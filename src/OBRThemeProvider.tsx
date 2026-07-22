import { Theme as MuiTheme, ThemeProvider } from "@mui/material/styles";
import OBR, { Theme } from "@owlbear-rodeo/sdk";
import { useState, useEffect } from "react";
import { getTheme } from "./getTheme";

/**
 * Provide a MUI theme with the same palette as the parent OBR window
 * WARNING: Doesn't work well for popover because it creates a flash when loading
 */
export function OBRThemeProvider({ children }: { children?: React.ReactNode }) {
  const [theme, setTheme] = useState<MuiTheme>(() => getTheme());
  useEffect(() => {
    const updateTheme = (theme: Theme) => {
      setTheme(getTheme(theme));
    };
    OBR.theme.getTheme().then(updateTheme);
    return OBR.theme.onChange(updateTheme);
  }, []);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
