import { useEffect, useState } from "react";
import { useOwlbearStore } from "../useOwlbearStore.ts";
import { useOwlbearStoreSync } from "../useOwlbearStoreSync.ts";
import "../index.css";
import TrackerMenu from "./TrackerMenu.tsx";
import { Tracker } from "../trackerHelpersBasic.ts";
import { useTrackerStore } from "../useTrackerStore.ts";
import { writeTrackersToSelection } from "../trackerHelpersItem.ts";

export default function App({
  initialMode,
  initialRole,
  initialSceneTrackers,
}: {
  initialMode: "DARK" | "LIGHT";
  initialRole: "PLAYER" | "GM";
  initialSceneTrackers: Tracker[];
}): React.JSX.Element {
  useOwlbearStoreSync();

  const setRole = useOwlbearStore((state) => state.setRole);
  const setMode = useOwlbearStore((state) => state.setThemeMode);

  const setWriteToSaveLocation = useTrackerStore(
    (state) => state.setWriteToSaveLocation,
  );

  // Prevent flash on startup
  const [initDone, setInitDone] = useState(false);
  useEffect(() => {
    setMode(initialMode);
    setRole(initialRole);
    setWriteToSaveLocation(writeTrackersToSelection);
    setInitDone(true);
  }, []);

  if (!initDone) return <></>;

  return (
    <TrackerMenu initialSceneTrackers={initialSceneTrackers}></TrackerMenu>
  );
}
