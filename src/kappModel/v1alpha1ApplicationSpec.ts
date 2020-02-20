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

import { V1alpha1ApplicationSpecComponents } from './v1alpha1ApplicationSpecComponents';
import { V1alpha1ApplicationSpecEnv } from './v1alpha1ApplicationSpecEnv';
import { V1alpha1ApplicationSpecVolumes } from './v1alpha1ApplicationSpecVolumes';

/**
* ApplicationSpec defines the desired state of Application
*/
export class V1alpha1ApplicationSpec {
    'components': Array<V1alpha1ApplicationSpecComponents>;
    'imagePullSecretName'?: string;
    'sharedEnv'?: Array<V1alpha1ApplicationSpecEnv>;
    'volumes'?: Array<V1alpha1ApplicationSpecVolumes>;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "components",
            "baseName": "components",
            "type": "Array<V1alpha1ApplicationSpecComponents>"
        },
        {
            "name": "imagePullSecretName",
            "baseName": "imagePullSecretName",
            "type": "string"
        },
        {
            "name": "sharedEnv",
            "baseName": "sharedEnv",
            "type": "Array<V1alpha1ApplicationSpecEnv>"
        },
        {
            "name": "volumes",
            "baseName": "volumes",
            "type": "Array<V1alpha1ApplicationSpecVolumes>"
        }    ];

    static getAttributeTypeMap() {
        return V1alpha1ApplicationSpec.attributeTypeMap;
    }
}

