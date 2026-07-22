import React from "react";
import ReactDOM from "react-dom/client";
import "../index.css";
import OBR from "@owlbear-rodeo/sdk";

import { ThemeProvider } from "@mui/material";
import { getTheme } from "../getTheme";
import App from "../editor/App";

OBR.onReady(async () => {
  const [OBRTheme, role] = await Promise.all([
    OBR.theme.getTheme(),
    OBR.player.getRole(),
  ]);

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <ThemeProvider theme={getTheme(OBRTheme)}>
        <App
          initialMode={OBRTheme.mode}
          initialRole={role}
          editorProps={{ type: "scene" }}
        />
      </ThemeProvider>
    </React.StrictMode>,
  );
});
