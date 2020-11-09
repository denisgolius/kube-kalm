package builtin

import (
	"context"
	"net/http"

	"k8s.io/api/admission/v1beta1"
	"k8s.io/apimachinery/pkg/api/resource"
	"sigs.k8s.io/controller-runtime/pkg/client"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/runtime/inject"

	"github.com/kalmhq/kalm/controller/api/v1alpha1"
	corev1 "k8s.io/api/core/v1"
	"sigs.k8s.io/controller-runtime/pkg/webhook/admission"
)

var pvcAdmissionHandlerLog = logf.Log.WithName("pvc-admission-handler")

// +kubebuilder:webhook:verbs=create;update;delete,path=/admission-handler-v1-pvc,mutating=false,failurePolicy=fail,groups="",resources=persistentvolumeclaims,versions=v1,name=vpvc.kb.io

// webhook for PVC
type PVCAdmissionHandler struct {
	client  client.Client
	decoder *admission.Decoder
}

var _ admission.Handler = &PVCAdmissionHandler{}

var _ admission.DecoderInjector = &PVCAdmissionHandler{}
var _ inject.Client = &PVCAdmissionHandler{}

func (v *PVCAdmissionHandler) Handle(ctx context.Context, req admission.Request) admission.Response {

	pvcAdmissionHandlerLog.Info("pvc admission handler called")

	pvc := corev1.PersistentVolumeClaim{}

	// currently deal with
	// - create
	// - delete
	if req.Operation == v1beta1.Create {
		err := v.decoder.Decode(req, &pvc)
		if err != nil {
			return admission.Errored(http.StatusBadRequest, err)
		}

		// orphan pvc may appear in kalm-system

		pvcTenant := pvc.Labels[v1alpha1.TenantNameLabelKey]
		if pvcTenant == "" {
			return admission.Allowed("")
		}

		var tenantPVCList corev1.PersistentVolumeClaimList
		if err := v.client.List(ctx, &tenantPVCList, client.MatchingLabels{
			v1alpha1.TenantNameLabelKey: pvcTenant,
		}); err != nil {
			return admission.Errored(http.StatusBadRequest, err)
		}

		var size resource.Quantity
		for _, tmpPVC := range tenantPVCList.Items {
			size.Add(*tmpPVC.Spec.Resources.Requests.Storage())
		}

		// and current pvc
		size.Add(*pvc.Spec.Resources.Requests.Storage())

		if err := v1alpha1.SetTenantResourceByName(pvcTenant, v1alpha1.ResourceStorage, size); err != nil {
			return admission.Errored(http.StatusBadRequest, err)
		}

		pvcAdmissionHandlerLog.Info("pvc occupation updated for create", "tenant", pvcTenant, "newOccupation", size)
	}

	if req.Operation == v1beta1.Delete {
		err := v.decoder.DecodeRaw(req.OldObject, &pvc)
		if err != nil {
			return admission.Errored(http.StatusBadRequest, err)
		}

		pvcAdmissionHandlerLog.Info("pvc being deleted", "pvc", pvc.Name)

		pvcTenant := pvc.Labels[v1alpha1.TenantNameLabelKey]
		if pvcTenant == "" {
			return admission.Allowed("")
		}

		var tenantPVCList corev1.PersistentVolumeClaimList
		if err := v.client.List(ctx, &tenantPVCList, client.MatchingLabels{
			v1alpha1.TenantNameLabelKey: pvcTenant,
		}); err != nil {
			return admission.Errored(http.StatusBadRequest, err)
		}

		var size resource.Quantity
		for _, tmpPVC := range tenantPVCList.Items {
			// ignore pvc being deleted
			if tmpPVC.Name == pvc.Name {
				continue
			}

			size.Add(*pvc.Spec.Resources.Requests.Storage())
		}

		if err := v1alpha1.SetTenantResourceByName(pvcTenant, v1alpha1.ResourceStorage, size); err != nil {
			return admission.Errored(http.StatusBadRequest, err)
		}

		pvcAdmissionHandlerLog.Info("pvc occupation updated for delete", "tenant", pvcTenant, "newOccupation", size)
	}

	return admission.Allowed("")
}

// InjectDecoder injects the decoder.
func (v *PVCAdmissionHandler) InjectDecoder(d *admission.Decoder) error {
	v.decoder = d
	return nil
}

func (v *PVCAdmissionHandler) InjectClient(c client.Client) error {
	v.client = c
	return nil
}