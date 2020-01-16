package controllers

import (
	"context"
	"fmt"
	"github.com/go-logr/logr"
	corev1alpha1 "github.com/kapp-staging/kapp/api/v1alpha1"
	"github.com/kapp-staging/kapp/util"
	appv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"strings"
	"time"
)

// There will be a new Task instance for each reconciliation
type applicationReconcilerTask struct {
	ctx        context.Context
	reconciler *ApplicationReconciler
	app        *corev1alpha1.Application
	req        ctrl.Request
	log        logr.Logger

	deployments []appv1.Deployment
	services    []corev1.Service
}

func newApplicationReconcilerTask(
	reconciler *ApplicationReconciler,
	app *corev1alpha1.Application,
	req ctrl.Request,
) *applicationReconcilerTask {
	return &applicationReconcilerTask{
		context.Background(),
		reconciler,
		app,
		req,
		reconciler.Log,
		[]appv1.Deployment{},
		[]corev1.Service{},
	}
}

func (act *applicationReconcilerTask) Run() (err error) {
	log := act.log

	// handle delete
	if shouldFinishReconcilation, err := act.handleDelete(); err != nil || shouldFinishReconcilation {
		if err != nil {
			log.Error(err, "unable to delete Application")
		}
		return err
	}

	err = act.getDeployments()

	if err != nil {
		log.Error(err, "unable to list child deployments")
		return err
	}

	err = act.getServices()

	if err != nil {
		log.Error(err, "unable to list child services")
		return err
	}

	err = act.reconcileServices()

	if err != nil {
		log.Error(err, "unable to construct services")
		return err
	}

	err = act.reconcileComponents()

	if err != nil {
		log.Error(err, "unable to construct deploymentp")
		return err
	}

	return nil
}

func (act *applicationReconcilerTask) reconcileComponents() (err error) {
	for _, component := range act.app.Spec.Components {
		if err = act.reconcileComponent(&component); err != nil {
			return err
		}
	}

	return nil
}

func (act *applicationReconcilerTask) reconcileServices() (err error) {
	app := act.app
	ctx := act.ctx
	log := act.log

	for _, component := range act.app.Spec.Components {
		// ports
		service := act.getService(component.Name)
		if len(component.Ports) > 0 {
			newService := false
			if service == nil {
				newService = true
				service = &corev1.Service{
					ObjectMeta: metav1.ObjectMeta{
						Name:      getServiceName(app.Name, component.Name),
						Namespace: app.Namespace,
					},
					Spec: corev1.ServiceSpec{},
				}
			}

			ps := []corev1.ServicePort{}

			for _, port := range component.Ports {
				sp := corev1.ServicePort{
					Name:       port.Name,
					TargetPort: intstr.FromInt(int(port.ContainerPort)),
					Port:       int32(port.ServicePort),
				}

				if port.Protocol != "" {
					sp.Protocol = port.Protocol
				}

				ps = append(ps, sp)
			}

			service.Spec.Ports = ps

			if newService {
				if err := ctrl.SetControllerReference(app, service, act.reconciler.Scheme); err != nil {
					return err
				}

				if err := act.reconciler.Create(ctx, service); err != nil {
					log.Error(err, "unable to create Service for Component", "app", app, "component", component)
					return err
				}
			} else {
				if err := act.reconciler.Update(ctx, service); err != nil {
					log.Error(err, "unable to update Service for Component", "app", app, "component", component)
					return err
				}
			}
		} else if service != nil {
			if err := act.reconciler.Delete(act.ctx, service); err != nil {
				log.Error(err, "unable to delete Service for Application Component", "app", app, "component", component)
				return err
			}
		}
	}

	// refresh services
	err = act.getServices()

	if err != nil {
		log.Error(err, "unable to refresh services")
		return err
	}

	return nil
}

func (act *applicationReconcilerTask) reconcileComponent(component *corev1alpha1.ComponentSpec) (err error) {
	app := act.app
	log := act.log
	ctx := act.ctx

	deployment := act.getDeployment(component.Name)

	label := fmt.Sprintf("%s-%d", app.Name, time.Now().UTC().Unix())
	labelMap := map[string]string{"kapp-component": label}

	newDeployment := false

	if deployment == nil {
		newDeployment = true

		deployment = &appv1.Deployment{
			ObjectMeta: metav1.ObjectMeta{
				Labels:      make(map[string]string),
				Annotations: make(map[string]string),
				Name:        getDeploymentName(app.Name, component.Name),
				Namespace:   app.Namespace,
			},
			Spec: appv1.DeploymentSpec{
				Template: corev1.PodTemplateSpec{
					ObjectMeta: metav1.ObjectMeta{
						Labels: labelMap,
					},
					Spec: corev1.PodSpec{
						Containers: []corev1.Container{
							{
								Name:    component.Name,
								Image:   component.Image,
								Env:     []corev1.EnvVar{},
								Command: component.Command,
								Args:    component.Args,
							},
						},
					},
				},
				Selector: &metav1.LabelSelector{
					MatchLabels: labelMap,
				},
			},
		}
	}

	mainContainer := &(deployment.Spec.Template.Spec.Containers[0])

	// apply envs
	envs := []corev1.EnvVar{}
	for _, env := range component.Env {
		var value string

		if env.Value != "" {
			value = env.Value
		} else if env.SharedEnv != "" {
			value = act.app.Spec.FindShareEnvValue(env.SharedEnv)
			if value == "" {
				// TODO is this the corrent way to allocate an error?
				return fmt.Errorf("Can't find shared env %s", env.SharedEnv)
			}
		} else if env.ComponentPort != "" {
			parts := strings.Split(env.ComponentPort, "/")

			if len(parts) != 2 {
				return fmt.Errorf("wrong componentPort config %s, format error", env.ComponentPort)
			}

			service := act.FindService(parts[0])

			if service == nil {
				return fmt.Errorf("wrong componentPort config %s, service not exist", env.ComponentPort)
			}

			var port int32

			for _, servicePort := range service.Spec.Ports {
				if servicePort.Name == parts[1] {
					port = servicePort.Port
				}
			}

			if port == 0 {
				return fmt.Errorf("wrong componentPort config %s, port not exist", env.ComponentPort)
			}

			value = fmt.Sprintf("%s.%s:%d", service.Name, act.app.Namespace, port)
		}

		envs = append(envs, corev1.EnvVar{
			Name:  env.Name,
			Value: fmt.Sprintf("%s%s%s", env.Prefix, value, env.Suffix),
		})
	}

	mainContainer.Env = envs

	// before start
	beforeHooks := []corev1.Container{}
	for i, beforeHook := range component.BeforeStart {
		beforeHooks = append(beforeHooks, corev1.Container{
			Image:   component.Image,
			Name:    fmt.Sprintf("%s-before-hook-%d", component.Name, i),
			Command: []string{"/bin/sh"}, // TODO: when to use /bin/bash ??
			Args: []string{
				"-c",
				beforeHook,
			},
			Env: envs,
		})
	}
	deployment.Spec.Template.Spec.InitContainers = beforeHooks

	// after start
	if len(component.AfterStart) == 0 {
		if mainContainer.Lifecycle != nil {
			mainContainer.Lifecycle.PostStart = nil
		}
	} else {
		if mainContainer.Lifecycle == nil {
			mainContainer.Lifecycle = &corev1.Lifecycle{}
		}

		mainContainer.Lifecycle.PostStart = &corev1.Handler{
			Exec: &corev1.ExecAction{
				Command: []string{
					"/bin/sh",
					"-c",
					strings.Join(component.AfterStart, " && "),
				},
			},
		}
	}

	// before stoop
	if len(component.BeforeDestroy) == 0 {
		if mainContainer.Lifecycle != nil {
			mainContainer.Lifecycle.PreStop = nil
		}
	} else {
		if mainContainer.Lifecycle == nil {
			mainContainer.Lifecycle = &corev1.Lifecycle{}
		}

		mainContainer.Lifecycle.PreStop = &corev1.Handler{
			Exec: &corev1.ExecAction{
				Command: []string{
					"/bin/sh",
					"-c",
					strings.Join(component.BeforeDestroy, " && "),
				},
			},
		}
	}

	// apply plugins
	for _, pluginDef := range component.Plugins {
		plugin := corev1alpha1.GetPlugin(pluginDef)

		switch p := plugin.(type) {
		case *corev1alpha1.PluginManualScaler:
			p.Operate(deployment)
		}
	}

	if newDeployment {
		if err := ctrl.SetControllerReference(app, deployment, act.reconciler.Scheme); err != nil {
			return err
		}

		if err := act.reconciler.Create(ctx, deployment); err != nil {
			log.Error(err, "unable to create Deployment for Application", "app", app)
			return err
		}

		log.Info("create Deployment")
	} else {
		if err := act.reconciler.Update(ctx, deployment); err != nil {
			log.Error(err, "unable to update Deployment for Application", "app", app)
			return err
		}

		log.Info("update Deployment")
	}

	// apply plugins
	for _, pluginDef := range app.Spec.Components[0].Plugins {
		plugin := corev1alpha1.GetPlugin(pluginDef)

		switch p := plugin.(type) {
		case *corev1alpha1.PluginManualScaler:
			p.Operate(deployment)
		}
	}

	return nil
}

func (act *applicationReconcilerTask) getService(componentName string) *corev1.Service {
	for i, _ := range act.services {
		service := &(act.services[i])

		if service.ObjectMeta.Name == getServiceName(act.app.Name, componentName) {
			return service
		}
	}

	return nil
}

func (act *applicationReconcilerTask) getDeployment(name string) *appv1.Deployment {
	for i, _ := range act.deployments {
		deployment := &(act.deployments[i])

		if deployment.ObjectMeta.Name == getDeploymentName(act.app.Name, name) {
			return deployment
		}
	}

	return nil
}

func (act *applicationReconcilerTask) getDeployments() error {
	var deploymentList appv1.DeploymentList

	if err := act.reconciler.List(
		act.ctx,
		&deploymentList,
		client.InNamespace(act.req.Namespace),
		client.MatchingFields{
			applicationOwnerKey: act.req.Name,
		},
	); err != nil {
		act.log.Error(err, "unable to list child deployments")
		return err
	}

	act.deployments = deploymentList.Items

	return nil
}

func (act *applicationReconcilerTask) getServices() error {
	var serviceList corev1.ServiceList

	if err := act.reconciler.List(
		act.ctx,
		&serviceList,
		client.InNamespace(act.req.Namespace),
		client.MatchingFields{
			applicationOwnerKey: act.req.Name,
		},
	); err != nil {
		act.log.Error(err, "unable to list child services")
		return err
	}

	act.services = serviceList.Items

	return nil
}

func (act *applicationReconcilerTask) handleDelete() (shouldFinishReconcilation bool, err error) {
	app := act.app
	ctx := act.ctx

	// examine DeletionTimestamp to determine if object is under deletion
	if app.ObjectMeta.DeletionTimestamp.IsZero() {
		// The object is not being deleted, so if it does not have our finalizer,
		// then lets add the finalizer and update the object. This is equivalent
		// registering our finalizer.
		if !util.ContainsString(app.ObjectMeta.Finalizers, finalizerName) {
			app.ObjectMeta.Finalizers = append(app.ObjectMeta.Finalizers, finalizerName)
			if err := act.reconciler.Update(context.Background(), app); err != nil {
				return true, err
			}
		}
	} else {
		// The object is being deleted
		if util.ContainsString(app.ObjectMeta.Finalizers, finalizerName) {
			// our finalizer is present, so lets handle any external dependency
			if err := act.deleteExternalResources(); err != nil {
				// if fail to delete the external dependency here, return with error
				// so that it can be retried
				return true, err
			}

			// remove our finalizer from the list and update it.
			app.ObjectMeta.Finalizers = util.RemoveString(app.ObjectMeta.Finalizers, finalizerName)
			if err := act.reconciler.Update(ctx, app); err != nil {
				return true, err
			}
		}

		return true, nil
	}

	return false, nil
}

func (act *applicationReconcilerTask) deleteExternalResources() error {
	log := act.log
	ctx := act.ctx

	if err := act.getDeployments(); err != nil {
		log.Error(err, "unable to list child deployments")
		return err
	}

	for _, deployment := range act.deployments {
		log.Info("delete deployment")
		if err := act.reconciler.Delete(ctx, &deployment); err != nil {
			log.Error(err, "delete deployment error")
			return err
		}
	}

	log.Info("Delete External Resources Done")

	return nil

}

func (act *applicationReconcilerTask) FindService(componentName string) *corev1.Service {
	for i := range act.services {
		service := act.services[i]
		if service.Name == getServiceName(act.app.Name, componentName) {
			return &service
		}
	}
	return nil
}

func getDeploymentName(appName, componentName string) string {
	return fmt.Sprintf("%s-%s", appName, componentName)
}

func getServiceName(appName, componentName string) string {
	return fmt.Sprintf("%s-%s", appName, componentName)
}
