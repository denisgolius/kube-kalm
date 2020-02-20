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

import { V1alpha1ApplicationSpecCinderSecretRef } from './v1alpha1ApplicationSpecCinderSecretRef';

/**
* Cinder represents a cinder volume attached and mounted on kubelets host machine. More info: https://examples.k8s.io/mysql-cinder-pd/README.md
*/
export class V1alpha1ApplicationSpecCinder {
    /**
    * Filesystem type to mount. Must be a filesystem type supported by the host operating system. Examples: \"ext4\", \"xfs\", \"ntfs\". Implicitly inferred to be \"ext4\" if unspecified. More info: https://examples.k8s.io/mysql-cinder-pd/README.md
    */
    'fsType'?: string;
    /**
    * Optional: Defaults to false (read/write). ReadOnly here will force the ReadOnly setting in VolumeMounts. More info: https://examples.k8s.io/mysql-cinder-pd/README.md
    */
    'readOnly'?: boolean;
    'secretRef'?: V1alpha1ApplicationSpecCinderSecretRef;
    /**
    * volume id used to identify the volume in cinder. More info: https://examples.k8s.io/mysql-cinder-pd/README.md
    */
    'volumeID': string;

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
            "type": "V1alpha1ApplicationSpecCinderSecretRef"
        },
        {
            "name": "volumeID",
            "baseName": "volumeID",
            "type": "string"
        }    ];

    static getAttributeTypeMap() {
        return V1alpha1ApplicationSpecCinder.attributeTypeMap;
    }
}

