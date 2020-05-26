import {
  createStyles,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Theme
} from "@material-ui/core";
import AssignmentReturnedIcon from "@material-ui/icons/AssignmentReturned";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import { WithStyles, withStyles } from "@material-ui/styles";
import clsx from "clsx";
import React from "react";
import { connect } from "react-redux";
import { NavLink } from "react-router-dom";
import { RootState } from "reducers";
import { TDispatch } from "types";
import { setSettingsAction } from "../actions/settings";
import { LEFT_SECTION_WIDTH } from "../pages/BasePage";
import { primaryBackgroud, primaryColor } from "../theme";
import { KappApplicationIcon, KappNodeIcon, KappTemplateIcon, KappVolumeIcon } from "../widgets/Icon";
import { APP_BAR_HEIGHT } from "./AppBar";

const mapStateToProps = (state: RootState) => {
  const auth = state.get("auth");
  const isAdmin = auth.get("isAdmin");
  const entity = auth.get("entity");
  return {
    isOpenRootDrawer: state.get("settings").get("isOpenRootDrawer"),
    activeNamespaceName: state.get("namespaces").get("active"),
    isAdmin,
    entity
  };
};

const styles = (theme: Theme) =>
  createStyles({
    listItem: {
      color: "#000000 !important",
      height: 40,

      "& > .MuiListItemIcon-root": {
        minWidth: 40
      }
    },
    listItemSeleted: {
      backgroundColor: `${primaryBackgroud} !important`,
      borderRight: `4px solid ${primaryColor}`
    },
    listSubHeader: {
      textTransform: "uppercase",
      color: "#000000 !important"
    },
    openBtnWrapper: {
      width: "100%",
      display: "flex",
      justifyContent: "flex-end",
      padding: "15px 16px"
    },
    hide: {
      display: "none"
    },
    drawer: {
      width: LEFT_SECTION_WIDTH,
      flexShrink: 0,
      whiteSpace: "nowrap"
    },
    drawerPaper: {
      width: LEFT_SECTION_WIDTH,
      paddingTop: APP_BAR_HEIGHT
    },
    // material-ui official
    drawerOpen: {
      width: LEFT_SECTION_WIDTH,
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen
      })
    },
    drawerClose: {
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
      }),
      overflowX: "hidden",
      width: 60 + 1,
      [theme.breakpoints.up("sm")]: {
        width: 60 + 1
      }
    },
    itemBorder: {
      borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
      height: 60
    }
  });

interface Props extends WithStyles<typeof styles>, ReturnType<typeof mapStateToProps> {
  dispatch: TDispatch;
}

interface State {}

class DashboardDrawerRaw extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {};
  }

  private getMenuDataApplication() {
    return [
      { icon: KappApplicationIcon, text: "Applications", to: "/applications" },
      {
        icon: KappTemplateIcon,
        text: "Templates",
        to: "/templates"
      }
    ];
  }

  private getMenuDataCluster() {
    return [
      {
        icon: KappNodeIcon,
        text: "Nodes",
        to: "/cluster/nodes"
      },
      {
        icon: KappVolumeIcon,
        text: "Volumes",
        to: "/cluster/volumes"
      },
      {
        icon: AssignmentReturnedIcon,
        text: "Registries",
        to: "/cluster/registries"
      }
    ];
  }

  render() {
    const { classes, isOpenRootDrawer: open, dispatch } = this.props;
    const pathname = window.location.pathname;

    return (
      <Drawer
        variant="permanent"
        className={clsx(classes.drawer, {
          [classes.drawerOpen]: open,
          [classes.drawerClose]: !open
        })}
        classes={{
          paper: clsx(classes.drawerPaper, {
            [classes.drawerOpen]: open,
            [classes.drawerClose]: !open
          })
        }}>
        <div className={clsx(classes.openBtnWrapper, { [classes.itemBorder]: !open })}>
          <IconButton onClick={() => dispatch(setSettingsAction({ isOpenRootDrawer: !open }))} size={"small"}>
            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </div>

        <List style={{ paddingTop: open ? 8 : 0 }}>
          {open ? (
            <ListSubheader disableSticky={true} className={classes.listSubHeader}>
              Application
            </ListSubheader>
          ) : null}

          {this.getMenuDataApplication().map((item, index) => (
            <ListItem
              className={clsx(classes.listItem, {
                [classes.itemBorder]: !open
              })}
              classes={{
                selected: classes.listItemSeleted
              }}
              button
              component={NavLink}
              to={item.to}
              key={item.text}
              selected={pathname.startsWith(item.to.split("?")[0])}>
              <ListItemIcon>
                <item.icon />
              </ListItemIcon>
              {open ? <ListItemText primary={item.text} /> : null}
            </ListItem>
          ))}

          {open ? (
            <ListSubheader disableSticky={true} className={classes.listSubHeader}>
              Cluster
            </ListSubheader>
          ) : null}

          {this.getMenuDataCluster().map((item, index) => (
            <ListItem
              className={clsx(classes.listItem, {
                [classes.itemBorder]: !open
              })}
              classes={{
                selected: classes.listItemSeleted
              }}
              button
              component={NavLink}
              to={item.to}
              key={item.text}
              selected={pathname.startsWith(item.to.split("?")[0])}>
              <ListItemIcon>
                <item.icon />
              </ListItemIcon>
              {open ? <ListItemText primary={item.text} /> : null}
            </ListItem>
          ))}
        </List>
      </Drawer>
    );
  }
}

export const DashboardDrawer = connect(mapStateToProps)(withStyles(styles)(DashboardDrawerRaw));
