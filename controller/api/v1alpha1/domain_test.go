package v1alpha1

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"k8s.io/apimachinery/pkg/util/rand"
)

func ExamplegetDirectCNAMEOfDomain() {
	domain := "tst1crmapps.starbucks.com"

	for i := 0; i < 10; i++ {
		cname, err := getDirectCNAMEOfDomain(domain)
		fmt.Println(cname, err)
	}
}

func TestIsDomainConfiguredAsExpectedARecord(t *testing.T) {
	domainSpec := DomainSpec{
		Domain:    fmt.Sprintf("random-domain-%s.com", rand.String(10)),
		DNSType:   DNSTypeA,
		DNSTarget: "1.1.1.1",
	}

	isAsExpected, err := IsDomainConfiguredAsExpected(domainSpec)
	assert.Nil(t, err)
	assert.False(t, isAsExpected)
}

func TestIsDomainConfiguredAsExpectedCNAME(t *testing.T) {
	domainSpec := DomainSpec{
		Domain:    fmt.Sprintf("random-domain-%s.com", rand.String(10)),
		DNSType:   DNSTypeCNAME,
		DNSTarget: "fake-cname-target.com",
	}

	isAsExpected, err := IsDomainConfiguredAsExpected(domainSpec)
	assert.Nil(t, err)
	assert.False(t, isAsExpected)
}
