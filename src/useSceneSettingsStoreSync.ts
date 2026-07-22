import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { useEffect } from "react";
import {
  readNumberFromMetadata,
  VERTICAL_OFFSET_METADATA_ID,
  readBooleanFromMetadata,
  TRACKERS_ABOVE_METADATA_ID,
  BAR_HEIGHT_METADATA_ID,
  SEGMENTS_ENABLED_METADATA_ID,
  NAME_TAGS_METADATA_ID,
  HIDE_ENEMY_TRACKERS_METADATA_ID,
} from "./sceneMetadataHelpers";
import { useOwlbearStore } from "./useOwlbearStore";
import { useSceneSettingsStore } from "./useSceneSettingsStore";

export function useSceneSettingsStoreSync() {
  const sceneReady = useOwlbearStore((state) => state.sceneReady);

  const setVerticalOffset = useSceneSettingsStore(
    (state) => state.setVerticalOffset,
  );
  const setTrackersAboveToken = useSceneSettingsStore(
    (state) => state.setTrackersAboveToken,
  );
  const setBarHeightIsReduced = useSceneSettingsStore(
    (state) => state.setBarHeightIsReduced,
  );
  const setSegmentsEnabled = useSceneSettingsStore(
    (state) => state.setSegmentsEnabled,
  );
  const setNameTagsEnabled = useSceneSettingsStore(
    (state) => state.setNameTagsEnabled,
  );
  const setHideEnemyTrackers = useSceneSettingsStore(
    (state) => state.setHideEnemyTrackers,
  );

  const setSettings = (metadata: Metadata) => {
    setVerticalOffset(
      readNumberFromMetadata(metadata, VERTICAL_OFFSET_METADATA_ID),
    );
    setTrackersAboveToken(
      readBooleanFromMetadata(metadata, TRACKERS_ABOVE_METADATA_ID),
    );
    setBarHeightIsReduced(
      readBooleanFromMetadata(metadata, BAR_HEIGHT_METADATA_ID),
    );
    setSegmentsEnabled(
      readBooleanFromMetadata(metadata, SEGMENTS_ENABLED_METADATA_ID),
    );
    setNameTagsEnabled(
      readBooleanFromMetadata(metadata, NAME_TAGS_METADATA_ID),
    );
    setHideEnemyTrackers(
      readBooleanFromMetadata(metadata, HIDE_ENEMY_TRACKERS_METADATA_ID),
    );
  };

  useEffect(() => {
    OBR.scene.onMetadataChange(setSettings);
  }, []);

  useEffect(() => {
    if (sceneReady) {
      OBR.scene.getMetadata().then(setSettings);
    }
  }, [sceneReady]);
}
