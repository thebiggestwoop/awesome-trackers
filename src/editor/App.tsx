import { useEffect, useState } from "react";
import { useOwlbearStore } from "../useOwlbearStore.ts";
import { useOwlbearStoreSync } from "../useOwlbearStoreSync.ts";
import "../index.css";
import Editor from "./Editor.tsx";
import PresetSwitcher from "./PresetSwitcher.tsx";
import { useTrackerStore } from "../useTrackerStore.ts";
import {
  getTrackersFromSelection,
  writeTrackersToSelection,
} from "../trackerHelpersItem.ts";
import OBR, { Item, Metadata } from "@owlbear-rodeo/sdk";
import {
  getTrackersFromSceneMetadata,
  writeTrackersToScene,
} from "../trackerHelpersScene.ts";
import { Tracker } from "../trackerHelpersBasic.ts";

export type EditorAppConfig = { type: "scene" } | { type: "item" };

export default function App({
  initialMode,
  initialRole,
  editorProps,
}: {
  initialMode: "DARK" | "LIGHT";
  initialRole: "PLAYER" | "GM";
  editorProps: EditorAppConfig;
}): React.JSX.Element {
  useOwlbearStoreSync();

  const setRole = useOwlbearStore((state) => state.setRole);
  const setMode = useOwlbearStore((state) => state.setThemeMode);
  const mode = useOwlbearStore((state) => state.themeMode);

  const trackers = useTrackerStore((state) => state.trackers);
  const setTrackers = useTrackerStore((state) => state.setTrackers);
  const setWriteToSaveLocation = useTrackerStore(
    (state) => state.setWriteToSaveLocation,
  );

  const selection = useOwlbearStore((state) => state.selection);
  const items = useOwlbearStore((state) => state.items);

  const item = items.find(
    (value) => selection !== undefined && value.id === selection[0],
  );

  const [initDone, setInitDone] = useState<{
    trackers: boolean;
    sceneTrackers: boolean;
    misc: boolean;
  }>({ trackers: false, sceneTrackers: false, misc: false });

  // Prevent flash on startup
  useEffect(() => {
    setMode(initialMode);
    setRole(initialRole);
    setWriteToSaveLocation(
      editorProps.type === "item"
        ? writeTrackersToSelection
        : writeTrackersToScene,
    );
    setInitDone((prev) => ({ ...prev, misc: true }));
  }, []);

  useEffect(
    editorProps.type === "item"
      ? () => {
          const updateTrackers = (items: Item[]) => {
            getTrackersFromSelection(items).then((newTracker) => {
              setTrackers(newTracker);
            });
          };
          OBR.scene.items
            .getItems()
            .then(updateTrackers)
            .then(() => setInitDone((prev) => ({ ...prev, trackers: true })));
          return OBR.scene.items.onChange(updateTrackers);
        }
      : () => {},
    [],
  );

  const [autofillTrackers, setAutofillTrackers] = useState<Tracker[]>([]);
  useEffect(() => {
    const updateSceneTrackers = (metadata: Metadata) => {
      setAutofillTrackers(getTrackersFromSceneMetadata(metadata));
    };
    const updateTrackers = (metadata: Metadata) => {
      setTrackers(getTrackersFromSceneMetadata(metadata));
    };
    OBR.scene
      .getMetadata()
      .then(editorProps.type === "scene" ? updateTrackers : updateSceneTrackers)
      .then(() => {
        setInitDone((prev) => ({ ...prev, sceneTrackers: true }));
        if (editorProps.type === "scene")
          setInitDone((prev) => ({ ...prev, trackers: true }));
      });
    return OBR.scene.onMetadataChange(
      editorProps.type === "scene" ? updateTrackers : updateSceneTrackers,
    );
  }, []);

  if (!initDone.trackers || !initDone.sceneTrackers || !initDone.misc)
    return <></>;
  if (editorProps.type === "item") {
    return (
      <Editor
        title={item ? item.name : ""}
        trackers={trackers}
        autofillTrackers={autofillTrackers}
      />
    );
  } else {
    return (
      <div className={mode === "DARK" ? "dark" : ""}>
        <PresetSwitcher />
        <Editor
          title="Set Scene Defaults"
          trackers={trackers}
          autofillTrackers={[]}
        />
      </div>
    );
  }
}
