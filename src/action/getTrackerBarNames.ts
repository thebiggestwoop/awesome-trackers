import OBR, { Item, Metadata } from "@owlbear-rodeo/sdk";
import { getTrackersFromItem } from "../trackerHelpersItem";
import { useEffect, useState } from "react";
import { getTrackersFromSceneMetadata } from "../trackerHelpersScene";

export function useTrackerBarNames() {
  const [itemTrackerBarNames, setItemTrackerBarNames] = useState<string[]>([]);

  useEffect(() => {
    const getTrackerBarNames = (items: Item[]) => {
      const trackerBarNames = new Set<string>();
      for (const item of items) {
        const trackers = getTrackersFromItem(item);
        for (const tracker of trackers) {
          if (tracker.variant === "value-max" && tracker.name !== undefined)
            trackerBarNames.add(tracker.name);
        }
      }

      setItemTrackerBarNames([...trackerBarNames]);
    };

    OBR.scene.items.getItems().then(getTrackerBarNames);
    return OBR.scene.items.onChange(getTrackerBarNames);
  }, []);

  const [sceneTrackerBarNames, setSceneTrackerBarNames] = useState<string[]>(
    [],
  );

  useEffect(() => {
    const getTrackerBarNames = (sceneMetadata: Metadata) => {
      const trackerBarNames = new Set<string>();
      const trackers = getTrackersFromSceneMetadata(sceneMetadata);
      for (const tracker of trackers) {
        if (tracker.variant === "value-max" && tracker.name !== undefined)
          trackerBarNames.add(tracker.name);
      }

      setSceneTrackerBarNames([...trackerBarNames]);
    };

    OBR.scene.getMetadata().then(getTrackerBarNames);
    return OBR.scene.onMetadataChange(getTrackerBarNames);
  }, []);

  return [...new Set([...itemTrackerBarNames, ...sceneTrackerBarNames])];
}
