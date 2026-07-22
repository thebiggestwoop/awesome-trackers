import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        background: resolve(__dirname, "src/background/background.html"),
        context_embed: resolve(__dirname, "src/trackerMenu/trackerMenu.html"),
        item_editor: resolve(__dirname, "src/editor/editor.html"),
        action: resolve(__dirname, "src/action/action.html"),
        scene_editor: resolve(__dirname, "src/sceneEditor/sceneEditor.html"),
        scene_settings: resolve(
          __dirname,
          "src/sceneSettings/sceneSettings.html",
        ),
      },
    },
  },
  server: {
    cors: true,
    // origin: "https://www.owlbear.rodeo",
  },
});
