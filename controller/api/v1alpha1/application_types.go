/*

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package v1alpha1

import (
	apps1 "k8s.io/api/apps/v1"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

// EDIT THIS FILE! THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

type ComponentSpec struct {
	Name string `json:"name"`

	Env []EnvVar `json:"env,omitempty"`

	Image string `json:"image"`

	Dependencies []string `json:"dependencies,omitempty"`

	Command []string `json:"command,omitempty"`

	Args []string `json:"args,omitempty"`

	Ports []Port `json:"ports,omitempty"`

	// +kubebuilder:validation:Enum=server;cronjob
	WorkLoadType WorkLoadType `json:"workloadType,omitempty"`

	Schedule string `json:"schedule,omitempty"`

	// +optional
	LivenessProbe *v1.Probe `json:"livenessProbe,omitempty"`

	// +optional
	ReadinessProbe *v1.Probe `json:"readinessProbe,omitempty"`

	Plugins []runtime.RawExtension `json:"plugins,omitempty"`

	BeforeStart []string `json:"beforeStart,omitempty"`

	AfterStart []string `json:"afterStart,omitempty"`

	BeforeDestroy []string `json:"beforeDestroy,omitempty"`

	CPU resource.Quantity `json:"cpu,omitempty"`

	Memory resource.Quantity `json:"memory,omitempty"`

	// +optional
	Disks []Disk `json:"disks,omitempty"`
}

// ApplicationSpec defines the desired state of Application
type ApplicationSpec struct {
	Components          []ComponentSpec `json:"components"`
	SharedEnv           []EnvVar        `json:"sharedEnv,omitempty"`
	ImagePullSecretName string          `json:"imagePullSecretName,omitempty"`
}

type ComponentStatus struct {
	Name             string                 `json:"name"`
	DeploymentStatus apps1.DeploymentStatus `json:"deploymentStatus,omitempty"`
	ServiceStatus    v1.ServiceStatus       `json:"serviceStatus,omitempty"`
}

// ApplicationStatus defines the observed state of Application
type ApplicationStatus struct {
	IsActive bool `json:"isActive,omitempty"`

	// Failed to use map here, so use array for now.
	ComponentStatus []ComponentStatus `json:"componentStatus,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status

// Application is the Schema for the applications API
type Application struct {
	metav1.TypeMeta   `json:",inline"`
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Spec   ApplicationSpec   `json:"spec,omitempty"`
	Status ApplicationStatus `json:"status,omitempty"`
}

// +kubebuilder:object:root=true

// ApplicationList contains a list of Application
type ApplicationList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitempty"`
	Items           []Application `json:"items"`
}

func init() {
	SchemeBuilder.Register(&Application{}, &ApplicationList{})
}