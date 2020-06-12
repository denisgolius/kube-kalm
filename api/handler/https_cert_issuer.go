package handler

import (
	"github.com/kapp-staging/kapp/api/resources"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"github.com/kapp-staging/kapp/controller/controllers"
	"github.com/labstack/echo/v4"
	v1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func (h *ApiHandler) handleGetHttpsCertIssuer(c echo.Context) error {
	k8sClient := getK8sClient(c)
	k8sClientConfig := getK8sClientConfig(c)
	builder := resources.NewBuilder(k8sClient, k8sClientConfig, h.logger)

	httpsCertIssuers, err := builder.GetHttpsCertIssuerList()
	if err != nil {
		return err
	}

	return c.JSON(200, httpsCertIssuers)
}

func (h *ApiHandler) handleCreateHttpsCertIssuer(c echo.Context) (err error) {
	httpsCertIssuer, err := getHttpsCertIssuerFromContext(c)
	if err != nil {
		return err
	}

	resource := v1alpha1.HttpsCertIssuer{
		ObjectMeta: v1.ObjectMeta{
			Name: httpsCertIssuer.Name,
		},
		Spec: v1alpha1.HttpsCertIssuerSpec{},
	}

	if httpsCertIssuer.CAForTest != nil {
		resource.Spec.CAForTest = httpsCertIssuer.CAForTest
	}

	if httpsCertIssuer.ACMECloudFlare != nil {
		// reconcile secret for this issuer
		k8sClient := getK8sClient(c)
		k8sClientConfig := getK8sClientConfig(c)
		builder := resources.NewBuilder(k8sClient, k8sClientConfig, h.logger)

		acmeSecretName := resources.GetACMESecretName(httpsCertIssuer)
		err := builder.ReconcileSecretForIssuer(
			controllers.CertManagerNamespace,
			acmeSecretName,
			httpsCertIssuer.ACMECloudFlare.Secret,
		)

		if err != nil {
			return err
		}

		resource.Spec.ACMECloudFlare = &v1alpha1.ACMECloudFlareIssuer{
			Email:              httpsCertIssuer.ACMECloudFlare.Account,
			APITokenSecretName: acmeSecretName,
		}
	}

	err = h.Builder(c).Create(&resource)
	if err != nil {
		return err
	}

	return c.JSON(201, httpsCertIssuer)
}


func (h *ApiHandler) handleUpdateHttpsCertIssuer(c echo.Context) error {
	httpsCertIssuer, err := getHttpsCertIssuerFromContext(c)
	if err != nil {
		return err
	}

	httpsCertIssuer, err = h.Builder(c).UpdateHttpsCertIssuer(httpsCertIssuer)
	if err != nil {
		return err
	}

	return c.JSON(200, httpsCertIssuer)
}

func (h *ApiHandler) handleDeleteHttpsCertIssuer(c echo.Context) error {
	err := h.Builder(c).DeleteHttpsCertIssuer(c.Param("name"))
	if err != nil {
		return err
	}
	return c.NoContent(200)
}

func getHttpsCertIssuerFromContext(c echo.Context) (resources.HttpsCertIssuer, error) {
	var httpsCertIssuer resources.HttpsCertIssuer
	if err := c.Bind(&httpsCertIssuer); err != nil {
		return resources.HttpsCertIssuer{}, err
	}

	return httpsCertIssuer, nil
}
