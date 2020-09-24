import { HttpRoute, HttpRouteDestination } from "types/route";
import sc from "utils/stringConstants";
import * as Yup from "yup";
import { addMethod, array, ArraySchema, mixed, object, Schema, string, ValidationError } from "yup";

addMethod(object, "unique", function (propertyName, message) {
  //@ts-ignore
  return this.test("unique", message, function (value) {
    if (!value || !value[propertyName]) {
      return true;
    }

    //@ts-ignore
    const { path } = this;
    //@ts-ignore
    const options = [...this.parent];
    const currentIndex = options.indexOf(value);

    const subOptions = options.slice(0, currentIndex);

    if (subOptions.some((option) => option[propertyName] === value[propertyName])) {
      //@ts-ignore
      throw this.createError({
        path: `${path}.${propertyName}`,
        message,
      });
    }

    return true;
  });
});

export const validator = () => {
  const errors = {};

  return errors;
};

export const ValidatorListNotEmpty = (value: Array<any>) => {
  if (!value || value.length <= 0) {
    return "Select at least one option";
  }

  return undefined;
};

export const ValidatorArrayNotEmpty = (value: any[]) => {
  if (!value || value.length <= 0) {
    return "Select at least one option";
  }

  return undefined;
};

export const ValidatorHttpRouteDestinations = (
  value: Array<HttpRouteDestination>,
  _allValues?: HttpRoute,
  _props?: any,
  _name?: any,
) => {
  if (!value || value.length <= 0) {
    return "Please define at least one target.";
  }

  if (value.length === 1) {
    return undefined;
  }

  let valid = false;

  for (let i = 0; i < value.length; i++) {
    const target = value[i]!;

    if (target.weight > 0) {
      valid = true;
      break;
    }
  }

  if (!valid) {
    return "Please define at least one target with non-zero weight.";
  }

  return undefined;
};

export const ValidatorRequired = (value: any) => {
  if (Array.isArray(value)) {
    return value.length > 0 ? undefined : "Required";
  }

  return !!value || value === 0 ? undefined : `Required`;
};

export const ValidatorContainerPortRequired = (value: any) => {
  if (!!value !== undefined) {
    const portInteger = parseInt(value, 10);

    if (portInteger === 443) {
      return `Can't use 443 port`;
    }
  }

  return !!value ? undefined : `Required`;
};

export const ValidatorPort = (value: any) => {
  if (!!value !== undefined) {
    const portInteger = parseInt(value, 10);

    if (portInteger === 443) {
      return `Can't use 443 port`;
    }
  }
  return undefined;
};

export const ValidatorOneof = (...options: (string | RegExp)[]) => {
  return (value: string) => {
    if (!value) return undefined;

    for (let i = 0; i < options.length; i++) {
      if (typeof options[i] === "string" && value === options[i]) {
        return undefined;
      } else if (
        typeof options[i] === "object" &&
        options[i].constructor.name === "RegExp" &&
        value.match(options[i])
      ) {
        return undefined;
      }
    }

    return `Must be one of ${options.map((x) => x.toString()).join(", ")}`;
  };
};

export const ValidatorVolumeSize = (value: string) => {
  if (!value) return "Required";

  if (value === "Gi") {
    return "Required";
  }

  if (!value.match(new RegExp(`(^\\d+(\\.\\d+)?)([eEinumkKMGTP]*[-+]?[0-9]*)$`)) || value === "0Gi") {
    return "Invalid Value";
  }
  // if (!value.match(/^([+-]?[0-9.]+)([eEinumkKMGTP]*[-+]?[0-9]*)$/) || value === "0") {
  //   return "Invalid Value";
  // }

  return undefined;
};

export const ValidatorName = (value: string) => {
  if (!value) return "Required";

  if (!value.match(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/) || value === "0") {
    return sc.NAME_RULE;
  }

  return undefined;
};

export const ValidatorHttpHeaders = (value: any) => {
  if (!value) return undefined;

  if (typeof value === "string") {
    return "Invalid JSON";
  }

  return undefined;
};

// https://regex101.com/r/cJ74bX/1/
export const ValidatorCPU = (value: number | string) => {
  if (!value) return undefined;

  if (parseFloat(`${value}`) < 0.001) {
    return "The minimum support is 0.001 Core";
  }

  // if (!value.match(/^([+-]?[0-9.]+)([eEinumkKMGTP]*[-+]?[0-9]*)$/) || value === "0") {
  //   return "Invalid CPU Value";
  // }

  return undefined;
};

export const ValidatorMemory = (value: string) => {
  if (!value) return undefined;

  if (value === "Gi") {
    return "Required";
  }

  // if (!value.match(/^([+-]?[0-9.]+)([eEinumkKMGTP]*[-+]?[0-9]*)$/) || value === "0") {
  //   return "Invalid Memory Value";
  // }

  return undefined;
};

export const ValidatorSchedule = (value: string) => {
  if (
    !value ||
    !value.match(
      /^(\*|((\*\/)?[1-5]?[0-9])) (\*|((\*\/)?[1-5]?[0-9])) (\*|((\*\/)?(1?[0-9]|2[0-3]))) (\*|((\*\/)?([1-9]|[12][0-9]|3[0-1]))) (\*|((\*\/)?([1-9]|1[0-2])))$/,
    )
  ) {
    return "Invalid Schedule Rule";
  }

  return undefined;
};

export const ValidatorStringLength = () => {};

export const ValidateHost = (value: string) => {
  if (!value) return "Required";

  if (value.length === 0 || value.length > 511) {
    return "Host length must be between 1 and 511 characters.";
  }

  let regResultWildcardname = regExpWildcardDomain.exec(value);
  if (regResultWildcardname === null) {
    return "Domain is invalid.";
  }

  return undefined;
};

export const ValidatorHostsOld = (
  values: string[],
  _allValues?: any,
  _props?: any,
  _name?: any,
): string | (undefined | string)[] | undefined => {
  if (!values || values.length === 0) {
    return "Required";
  }

  const errors = values.map((host) => (host === "*" ? undefined : ValidateHost(host)));

  return errors.filter((x) => !!x).length > 0 ? errors : undefined;
};

export const regExpIp = new RegExp(
  "^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
);

// correct:
// *.test.com
// test.com
// abc.test.com
// 1.2.3.4.com
// *.1.2.2.3.4.com
// Incorrect:
// *test.com
// test.com*
// test.*.com
// test.abc*.com
export const regExpWildcardDomain = new RegExp(/^(\*\.)?([\w]+\.)+[a-zA-Z]+$/);

export const validateHostWithWildcardPrefix = (value: string) => {
  if (!value || value.length === 0 || value.length > 511) {
    return "Host length must be between 1 and 511 characters.";
  }

  let regResultIp = regExpIp.exec(value);
  let regResultWildcardname = regExpWildcardDomain.exec(value);
  if (regResultIp === null && regResultWildcardname == null) {
    return "Host must be a valid IP address or hostname.";
  }

  return undefined;
};

export const ValidatorIpAndHosts = (
  values: string[],
  _allValues?: any,
  _props?: any,
  _name?: any,
): string | (undefined | string)[] | undefined => {
  if (!values || values.length === 0) {
    return "Required";
  }

  const errors = values.map((host) => (host === "*" ? undefined : validateHostWithWildcardPrefix(host)));

  return errors.filter((x) => !!x).length > 0 ? errors : undefined;
};

export const KValidatorInjectedFilePath = (value: string) => {
  if (!value) {
    return undefined;
  }

  if (!value.startsWith("/")) return 'Must be an absolute path, which starts with a "/"';
  if (value.endsWith("/")) return 'File name mush not end with "/"';

  return undefined;
};

export const KValidatorPaths = (
  values: string[],
  _allValues?: any,
  _props?: any,
  _name?: any,
): string | (undefined | string)[] | undefined => {
  if (!values || values.length === 0) {
    return "Required";
  }

  const errors = values.map((x) => (x.startsWith("/") ? undefined : 'path should start with a "/"'));

  return errors.filter((x) => !!x).length > 0 ? errors : undefined;
};

export const ValidatorEnvName = (value: string) => {
  if (value === undefined) return undefined;

  if (!value.match(/^[-._a-zA-Z][-._a-zA-Z0-9]*$/)) {
    return "Env name is invalid. regex used for validation is '[-._a-zA-Z][-._a-zA-Z0-9]*'";
  }

  return undefined;
};

export const ValidatorServiceName = (value: string) => {
  if (value === undefined) return undefined;

  if (!value.match(/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/)) {
    return `Port name must consist of lower case alphanumeric characters or '-', and must start and end with an alphanumeric character. (e.g. 'my-name',  or '123-abc', regex used for validation is '[a-z0-9]([-a-z0-9]*[a-z0-9])?')`;
  }

  return undefined;
};

export const RequirePrefix = (prefix: string) => (value: string) => {
  if (value === undefined) return undefined;
  if (!value.startsWith(prefix)) return `Require prefix "${prefix}"`;
  return undefined;
};

export const RequireNoSuffix = (suffix: string) => (value: string) => {
  if (value === undefined) return undefined;
  if (value.endsWith(suffix)) return `Require no suffix "${suffix}"`;
  return undefined;
};

const yupValidatorWrap = function <T>(...v: Schema<T>[]) {
  return function (value: T) {
    let schema: Schema<T>;

    if (v.length === 1) {
      schema = v[0];
    } else {
      schema = mixed();

      for (let i = 0; i < v.length; i++) {
        schema = schema.concat(v[i]);
      }
    }

    try {
      schema.validateSync(value);
      return undefined;
    } catch (e) {
      if (!ValidationError.isError(e)) {
        throw e;
      }

      return e.errors[0] || "Unknown error";
    }
  };
};

const yupValidatorWrapForArray = function <T>(arraySchema: ArraySchema<T>, ...v: Schema<T>[]) {
  return function (values: T[]) {
    try {
      arraySchema.validateSync(values);
    } catch (e) {
      if (!ValidationError.isError(e)) {
        throw e;
      }

      return e.errors[0] || "Unknown error";
    }

    const validateFunction = yupValidatorWrap<T>(...v);

    const errors = values.map((value) => validateFunction(value));

    if (errors.findIndex((x) => !!x) < 0) {
      return undefined;
    }

    return errors;
  };
};

// Basic yup validator

const dns1123LabelFmt = "[a-z0-9]([-a-z0-9]*[a-z0-9])?";
const dns1123SubDomainFmt = dns1123LabelFmt + "(\\." + dns1123LabelFmt + ")*";
const IsDNS1123SubDomain = string()
  .required("Required")
  .matches(new RegExp(`^${dns1123SubDomainFmt}$`), "Not a valid DNS123 SubDomain")
  .max(253);

// wildcard definition - RFC 1034 section 4.3.3.
// examples:
// - valid: *.bar.com, *.foo.bar.com
// - invalid: *.*.bar.com, *.foo.*.com, *bar.com, f*.bar.com, *
const wildcardDNS1123SubDomainFmt = "\\*\\." + dns1123SubDomainFmt;
const IsWildcardDNS1123SubDomain = Yup.string()
  .required("Required")
  .matches(new RegExp(`^${wildcardDNS1123SubDomainFmt}$`), "Not a valid wildcard DNS123 SubDomain")
  .max(253);

const RequireString = string().required("Required");

const RequireMatchDNS1123Label = string()
  .required("Required")
  .max(63, "Max length is 63")
  .matches(
    new RegExp(`^${dns1123LabelFmt}$`),
    "Not a valid DNS1123 label. Regex is " + new RegExp(`^${dns1123LabelFmt}$`),
  );

// Kalm Validators
export const ValidatorApplicationName = yupValidatorWrap<string>(RequireMatchDNS1123Label);
export const ValidatorIsDNS1123SubDomain = yupValidatorWrap<string>(IsDNS1123SubDomain);
export const ValidatorArrayOfIsDNS1123SubDomain = yupValidatorWrapForArray<string>(
  Yup.array<string>().required("Should have at least one item"),
  IsDNS1123SubDomain,
);

export const ValidatorIsWildcardDNS1123SubDomain = yupValidatorWrap<string>(IsWildcardDNS1123SubDomain);
export const ValidatorArrayOfDIsWildcardDNS1123SubDomain = yupValidatorWrapForArray<string>(
  Yup.array<string>().required("Should have at least one item"),
  IsWildcardDNS1123SubDomain,
);

export const RequireArray = array().min(1, "Required");
