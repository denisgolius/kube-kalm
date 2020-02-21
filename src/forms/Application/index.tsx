import { Button, createStyles, Grid, Paper, WithStyles, withStyles } from "@material-ui/core";
import { Theme } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { InjectedFormProps } from "redux-form";
import { Field, FieldArray, formValueSelector, reduxForm } from "redux-form/immutable";
import { Application, ComponentTemplate, SharedEnv } from "../../actions";
import { ValidatorRequired } from "../validator";
import { Components } from "./component";
import { EnvTypeExternal, RenderSharedEnvs } from "../Basic/env";
import { RootState } from "../../reducers";
import { connect } from "react-redux";
import Immutable from "immutable";
import { HelperContainer } from "../../widgets/Helper";
import { TextField } from "../Basic/text";
import { SwitchField } from "../Basic/switch";
import { NormalizeBoolean } from "../normalizer";

const styles = (theme: Theme) =>
  createStyles({
    sectionHeader: {
      fontSize: 24,
      fontWeight: 400,
      margin: "16px 0"
    },
    paper: {
      padding: theme.spacing(3),
      marginBottom: theme.spacing(5)
    }
  });

const mapStateToProps = (state: RootState) => {
  const selector = formValueSelector("application");
  const formComponents: ComponentTemplate[] = selector(state, "components");
  const sharedEnv: SharedEnv[] = selector(state, "sharedEnv");

  return {
    sharedEnv,
    formComponents
  };
};

export interface Props {}

class ApplicationFormRaw extends React.PureComponent<
  Props & InjectedFormProps<Application, Props> & ReturnType<typeof mapStateToProps> & WithStyles<typeof styles>
> {
  private renderBaisc() {
    const { classes } = this.props;
    return (
      <>
        <Typography
          variant="h2"
          classes={{
            root: classes.sectionHeader
          }}>
          Basic
        </Typography>
        <HelperContainer>
          <Typography>Basic information of this application</Typography>
        </HelperContainer>
        <Paper
          elevation={4}
          square
          classes={{
            root: classes.paper
          }}>
          <Field
            name="name"
            label="Name"
            component={TextField}
            validate={ValidatorRequired}
            helperText='The characters allowed in names are: digits (0-9), lower case letters (a-z), "-", and ".". Max length is 180.'
            placeholder="Please type the component name"
          />
          <Field
            name="namespace"
            label="Namespace"
            component={TextField}
            validate={ValidatorRequired}
            placeholder="Please type the namespace"
            helperText="All resources will running in this namespace."
          />
          <div>
            <Field
              name="isActive"
              formControlLabelProps={{
                label: "Active"
              }}
              component={SwitchField}
              normalizer={NormalizeBoolean}
            />
          </div>
          <Field
            name="isPersistent"
            formControlLabelProps={{
              label: "Persistent"
            }}
            component={SwitchField}
            normalizer={NormalizeBoolean}
          />
        </Paper>
      </>
    );
  }

  private renderComponent() {
    const { classes } = this.props;

    return (
      <>
        <Typography
          variant="h2"
          classes={{
            root: classes.sectionHeader
          }}>
          Components
        </Typography>
        <HelperContainer>
          <Typography>Select compoents you want to include into this application.</Typography>
        </HelperContainer>
        <Paper
          elevation={4}
          square
          classes={{
            root: classes.paper
          }}>
          <Components />
        </Paper>
      </>
    );
  }

  private renderSharedEnvs() {
    const { sharedEnv, formComponents, classes } = this.props;
    const isEnvInSharedEnv = (envName: string) => {
      return !!sharedEnv.find(x => x.get("name") === envName);
    };

    const missingVariables = Array.from(
      new Set(
        formComponents
          .map(component => {
            return component
              .get("env")
              .filter(env => env.get("type") === EnvTypeExternal)
              .map(env => env.get("name"));
          })
          .reduce((acc, item) => acc.concat(item))
      )
    ).filter(x => !isEnvInSharedEnv(x));

    return (
      <>
        <Typography
          variant="h2"
          classes={{
            root: classes.sectionHeader
          }}>
          Shared Environment Variables
        </Typography>
        <HelperContainer>
          <Typography>Shared environment variable is consistent amoung all components.</Typography>
        </HelperContainer>
        <Paper
          elevation={4}
          square
          classes={{
            root: classes.paper
          }}>
          <FieldArray name="sharedEnv" valid={true} component={RenderSharedEnvs} missingVariables={missingVariables} />
        </Paper>
      </>
    );
  }

  public render() {
    const { handleSubmit } = this.props;

    return (
      <div>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={12} md={8} lg={8} xl={6}>
              {this.renderBaisc()}
              {this.renderComponent()}
              {this.renderSharedEnvs()}
            </Grid>
          </Grid>
          <Button variant="contained" color="primary" type="submit">
            Submit
          </Button>
        </form>
      </div>
    );
  }
}

const initialValues: Application = Immutable.fromJS({
  id: "0",
  name: "a-sample-application",
  sharedEnv: [],
  components: []
});

export default reduxForm<Application, Props>({
  form: "application",
  initialValues,
  onSubmitFail: (...args) => {
    console.log("submit failed", args);
  }
})(connect(mapStateToProps)(withStyles(styles)(ApplicationFormRaw)));
