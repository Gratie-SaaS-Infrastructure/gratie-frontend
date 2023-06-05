import * as React from "react";
import Grid from "@mui/material/Grid";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

import Token from "./token";
import Profile from "./claim-token";
import Users from "./users";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0, ml: 0 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default function CompanyTab(props: any) {
  const [value, setValue] = React.useState(props.showProfile ? 1 : 1);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleClickTab = (tabNo: number) => {
    setValue(tabNo);
  };

  return (
    <Grid
      className="admin-list"
      style={{ maxWidth: "2200px" }}
      component="main"
      container
    >
      <Box sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            style={{ justifyContent: "center" }}
            value={value}
            onChange={handleChange}
            aria-label="basic tabs example"
          >
            <Tab
              style={{ marginRight: "54px" }}
              className={value == 1 ? "selected-tab" : "non-selected-tab"}
              label="Request NFT"
              {...a11yProps(1)}
            />
            <Tab
              style={{ marginRight: "54px" }}
              className={value == 2 ? "selected-tab" : "non-selected-tab"}
              label="Claim Token"
              {...a11yProps(2)}
            />
            <Tab
              className={value == 3 ? "selected-tab" : "non-selected-tab"}
              label="Profile"
              {...a11yProps(3)}
            />
          </Tabs>
        </Box>
        <Grid item xs={12}>
          <TabPanel value={value} index={1}>
            {<Profile {...props} />}
          </TabPanel>
        </Grid>
        <Grid item xs={12}>
          <TabPanel value={value} index={2}>
            {<Users {...props} />}
          </TabPanel>
        </Grid>
        <Grid item xs={12}>
          <TabPanel value={value} index={3}>
            {<Token users={props.users} license={props.license} />}
          </TabPanel>
        </Grid>
      </Box>
    </Grid>
  );
}