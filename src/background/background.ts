import OBR from "@owlbear-rodeo/sdk";
import { getPluginId } from "../getPluginId";
import { initOnMapTrackers } from "./onMapTrackers";
import { initAutoIncrementNames } from "./autoIncrementName";
import { HIDDEN_METADATA_ID } from "../trackerHelpersBasic";

const menuIcon = new URL(
  "../assets/owl-trackers-logo-outline.svg#icon",
  import.meta.url,
).toString();

const contextMenuLabel = "Awesome Trackers";

OBR.onReady(async () => {
  fetch("/manifest.json")
    .then((response) => response.json())
    .then((json) =>
      console.log(json["name"] + " - version: " + json["version"]),
    );

  // create player context menu icon
  OBR.contextMenu.create({
    id: getPluginId("player-menu"),
    icons: [
      {
        icon: menuIcon,
        label: contextMenuLabel,
        filter: {
          every: [
            { key: "layer", value: "CHARACTER", coordinator: "||" },
            { key: "layer", value: "MOUNT" },
            { key: "type", value: "IMAGE" },
            {
              key: ["metadata", getPluginId(HIDDEN_METADATA_ID)],
              value: true,
              operator: "!=",
            },
          ],
          permissions: ["UPDATE"],
          roles: ["PLAYER"],
          max: 1,
        },
      },
    ],
    embed: {
      url: "/src/trackerMenu/trackerMenu.html",
      height: 280,
    },
  });

  // create GM context menu icon
  OBR.contextMenu.create({
    id: getPluginId("gm-menu"),
    icons: [
      {
        icon: menuIcon,
        label: contextMenuLabel,
        filter: {
          every: [
            { key: "layer", value: "CHARACTER", coordinator: "||" },
            { key: "layer", value: "MOUNT" },
            { key: "type", value: "IMAGE" },
          ],
          roles: ["GM"],
          max: 1,
        },
      },
    ],
    embed: {
      url: "/src/trackerMenu/trackerMenu.html",
      height: 280,
    },
  });

  initOnMapTrackers();
  initAutoIncrementNames();
});
