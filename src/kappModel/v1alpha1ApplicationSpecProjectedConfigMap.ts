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

import { V1alpha1ApplicationSpecConfigMapItems } from './v1alpha1ApplicationSpecConfigMapItems';

/**
* information about the configMap data to project
*/
export class V1alpha1ApplicationSpecProjectedConfigMap {
    /**
    * If unspecified, each key-value pair in the Data field of the referenced ConfigMap will be projected into the volume as a file whose name is the key and content is the value. If specified, the listed keys will be projected into the specified paths, and unlisted keys will not be present. If a key is specified which is not present in the ConfigMap, the volume setup will error unless it is marked optional. Paths must be relative and may not contain the \'..\' path or start with \'..\'.
    */
    'items'?: Array<V1alpha1ApplicationSpecConfigMapItems>;
    /**
    * Name of the referent. More info: https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names TODO: Add other useful fields. apiVersion, kind, uid?
    */
    'name'?: string;
    /**
    * Specify whether the ConfigMap or its keys must be defined
    */
    'optional'?: boolean;

    static discriminator: string | undefined = undefined;

    static attributeTypeMap: Array<{name: string, baseName: string, type: string}> = [
        {
            "name": "items",
            "baseName": "items",
            "type": "Array<V1alpha1ApplicationSpecConfigMapItems>"
        },
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "optional",
            "baseName": "optional",
            "type": "boolean"
        }    ];

    static getAttributeTypeMap() {
        return V1alpha1ApplicationSpecProjectedConfigMap.attributeTypeMap;
    }
}

