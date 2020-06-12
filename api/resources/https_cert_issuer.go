package resources

import (
	"fmt"
	"github.com/kapp-staging/kapp/controller/api/v1alpha1"
	"github.com/kapp-staging/kapp/controller/controllers"
	coreV1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metaV1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

type HttpsCertIssuer struct {
	Name           string                    `json:"name"`
	CAForTest      *v1alpha1.CAForTestIssuer `json:"caForTest,omitempty"`
	ACMECloudFlare *AccountAndSecret         `json:"acmeCloudFlare,omitempty"`
}

type AccountAndSecret struct {
	Account string `json:"account"`
	Secret  string `json:"secret"`
}

func (builder *Builder) GetHttpsCertIssuerList() ([]HttpsCertIssuer, error) {
	var fetched v1alpha1.HttpsCertIssuerList
	if err := builder.List(&fetched); err != nil {
		return nil, err
	}

	rst := make([]HttpsCertIssuer, 0, len(fetched.Items))
	for _, ele := range fetched.Items {
		issuer := HttpsCertIssuer{
			Name: ele.Name,
		}

		if ele.Spec.CAForTest != nil {
			issuer.CAForTest = ele.Spec.CAForTest
		}

		if ele.Spec.ACMECloudFlare != nil {
			issuer.ACMECloudFlare = &AccountAndSecret{
				Account: ele.Spec.ACMECloudFlare.Email,
				Secret:  "***", //won't show for list
			}
		}

		rst = append(rst, issuer)
	}

	return rst, nil
}

func GetACMESecretName(issuer HttpsCertIssuer) string {
	return "kapp-sec-acme-" + issuer.Name
}

func (builder *Builder) UpdateHttpsCertIssuer(hcIssuer HttpsCertIssuer) (HttpsCertIssuer, error) {
	var res v1alpha1.HttpsCertIssuer

	err := builder.Get("", hcIssuer.Name, &res)
	if err != nil {
		return HttpsCertIssuer{}, err
	}

	if (res.Spec.CAForTest == nil) != (hcIssuer.CAForTest == nil) ||
		(res.Spec.ACMECloudFlare == nil) != (hcIssuer.ACMECloudFlare == nil) {
		return HttpsCertIssuer{}, fmt.Errorf("can not change type of HttpsCertIssuer")
	}

	res.Spec.CAForTest = hcIssuer.CAForTest

	if hcIssuer.ACMECloudFlare != nil {

		secName := res.Spec.ACMECloudFlare.APITokenSecretName

		// reconcile secret content for acme, ignore if content is empty
		if hcIssuer.ACMECloudFlare.Secret != "" {
			secNs := controllers.CertManagerNamespace
			secContent := hcIssuer.ACMECloudFlare.Secret

			err := builder.ReconcileSecretForIssuer(secNs, secName, secContent)
			if err != nil {
				return HttpsCertIssuer{}, err
			}
		}

		res.Spec.ACMECloudFlare = &v1alpha1.ACMECloudFlareIssuer{
			Email:              hcIssuer.ACMECloudFlare.Account,
			APITokenSecretName: secName,
		}
	}

	err = builder.Update(&res)
	if err != nil {
		return HttpsCertIssuer{}, err
	}

	return hcIssuer, nil
}

func (builder *Builder) DeleteHttpsCertIssuer(name string) error {
	return builder.Delete(&v1alpha1.HttpsCertIssuer{ObjectMeta: metaV1.ObjectMeta{Name: name}})
}

func (builder *Builder) ReconcileSecretForIssuer(secNs, secName string, secret string) error {
	expectedSec := coreV1.Secret{
		ObjectMeta: metaV1.ObjectMeta{
			Name:      secName,
			Namespace: secNs,
			Labels: map[string]string{
				controllers.KappLabelManaged: "true",
			},
		},
		Data: map[string][]byte{
			"content": []byte(secret),
		},
	}

	// check if exist
	sec, err := builder.GetSecret(secNs, secName)
	if err != nil {
		if errors.IsNotFound(err) {
			sec := expectedSec
			return builder.Create(&sec)
		}

		return err
	}

	sec.Data = expectedSec.Data
	sec.ObjectMeta.Labels = expectedSec.ObjectMeta.Labels

	return builder.Update(&sec)
}
