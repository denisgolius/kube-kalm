import { RouterAction } from "connected-react-router";
import { ThunkAction, ThunkDispatch } from "redux-thunk";
import { RootState } from "reducers";
import { ApplicationActions } from "./application";
import { CertificateActions } from "./certificate";
import { ClusterActions } from "./cluster";
import { CommonActions } from "./common";
import { NamespaceActions } from "./namespace";
import { NodeActions } from "./node";
import { VolumeActions } from "types/disk";
import { RegistriesActions } from "./registry";
import { RouteActions } from "./route";
import { ServiceActions } from "./service";
import { TutorialActions } from "./tutorial";
import { ResourceActions } from "./resources";
import { DebounceActions } from "./debounce";
import { SSOConfigActions } from "types/sso";
import { DomainActions } from "./domain";
import { DeployKeyActions } from "types/deployKey";

export type Actions =
  | RouterAction
  | CommonActions
  | ApplicationActions
  | NamespaceActions
  | NodeActions
  | RegistriesActions
  | RouteActions
  | CertificateActions
  | ServiceActions
  | VolumeActions
  | ClusterActions
  | TutorialActions
  | ResourceActions
  | DebounceActions
  | SSOConfigActions
  | DomainActions
  | DeployKeyActions;

export type ThunkResult<R> = ThunkAction<R, RootState, undefined, Actions>;
export type TDispatch = ThunkDispatch<RootState, undefined, Actions>;
export type TDispatchProp = { dispatch: TDispatch };

export const StatusFailure = "Failure";
export const StatusSuccess = "Success";
export const SomethingWrong = "Something wrong";
