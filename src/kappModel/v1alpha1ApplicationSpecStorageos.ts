/**
 * Kapp Models
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { V1alpha1ApplicationSpecStorageosSecretRef } from './v1alpha1ApplicationSpecStorageosSecretRef';

/**
* StorageOS represents a StorageOS volume attached and mounted on Kubernetes nodes.
*/
export class V1alpha1ApplicationSpecStorageos {
    /**
    * Filesystem type to mount. Must be a filesystem type supported by the host operating system. Ex. \"ext4\", \"xfs\", \"ntfs\". Implicitly inferred to be \"ext4\" if unspecified.
    */
    'fsType'?: string;
    /**
    * Defaults to false (read/write). ReadOnly here will force the ReadOnly setting in VolumeMounts.
    */
    'readOnly'?: boolean;
    'secretRef'?: V1alpha1ApplicationSpecStorageosSecretRef;
    /**
    * VolumeName is the human-readable name of the StorageOS volume.  Volume names are only unique within a namespace.
    */
    'volumeName'?: string;
    /**
    * VolumeNamespace specifies the scope of the volume within StorageOS.  If no namespace is specified then the Pod\'s namespace will be used.  This allows the Kubernetes name scoping to be mirrored within StorageOS for tighter integration. Set VolumeName to any name to override the default behaviour. Set to \"default\" if you are not using namespaces within StorageOS. Namespaces that do not pre-exist within StorageOS will be created.
    */
    'volumeNamespace'?: string;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "fsType",
            "baseName": "fsType",
            "type": "string"
        },
        {
            "name": "readOnly",
            "baseName": "readOnly",
            "type": "boolean"
        },
        {
            "name": "secretRef",
            "baseName": "secretRef",
            "type": "V1alpha1ApplicationSpecStorageosSecretRef"
        },
        {
            "name": "volumeName",
            "baseName": "volumeName",
            "type": "string"
        },
        {
            "name": "volumeNamespace",
            "baseName": "volumeNamespace",
            "type": "string"
        }    ];

    static getAttributeTypeMap() {
        return V1alpha1ApplicationSpecStorageos.attributeTypeMap;
    }
}

