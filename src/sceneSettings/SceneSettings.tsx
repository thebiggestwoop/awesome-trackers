import { useOwlbearStore } from "../useOwlbearStore";
import IconButton from "../components/IconButton";
import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { getPluginId } from "../getPluginId";
import ToggleButton from "../components/ToggleButton";
import { useEffect, useState } from "react";
import Input from "../components/Input";
import {
  BAR_HEIGHT_METADATA_ID,
  SEGMENTS_ENABLED_METADATA_ID,
  HIDE_LABEL_METADATA_ID,
  TRACKERS_ABOVE_METADATA_ID,
  VERTICAL_OFFSET_METADATA_ID,
  HIDE_ENEMY_TRACKERS_METADATA_ID,
} from "../sceneMetadataHelpers";
import { useSceneSettingsStore } from "../useSceneSettingsStore";
import { Collapse } from "@mui/material";
import { cn } from "../lib/utils";
import { useTrackerBarNames } from "../action/getTrackerBarNames";
import DeleteIcon from "../icons/DeleteIcon";
import { TrackerInput } from "../components/TrackerInput";
import SimplePlusIcon from "../icons/SimplePlusIcon";
import OpenInNewIcon from "../icons/OpenInNewIcon";
import { parseContentForNumber } from "../useTrackerStore";
import { isSegmentSettings } from "../isSegmentSettings";

export function SceneSettings(): React.JSX.Element {
  const mode = useOwlbearStore((state) => state.themeMode);

  const verticalOffset = useSceneSettingsStore((state) => state.verticalOffset);
  const setVerticalOffset = useSceneSettingsStore(
    (state) => state.setVerticalOffset,
  );

  const trackersAboveToken = useSceneSettingsStore(
    (state) => state.trackersAboveToken,
  );
  const setTrackersAboveToken = useSceneSettingsStore(
    (state) => state.setTrackersAboveToken,
  );

  const barHeightIsReduced = useSceneSettingsStore(
    (state) => state.barHeightIsReduced,
  );
  const setBarHeightIsReduced = useSceneSettingsStore(
    (state) => state.setBarHeightIsReduced,
  );

  const segmentsEnabled = useSceneSettingsStore(
    (state) => state.segmentsEnabled,
  );
  const setSegmentsEnabled = useSceneSettingsStore(
    (state) => state.setSegmentsEnabled,
  );

  const hideLabel = useSceneSettingsStore((state) => state.hideLabel);
  const setHideLabel = useSceneSettingsStore((state) => state.setHideLabel);

  const hideEnemyTrackers = useSceneSettingsStore(
    (state) => state.hideEnemyTrackers,
  );
  const setHideEnemyTrackers = useSceneSettingsStore(
    (state) => state.setHideEnemyTrackers,
  );

  const trackerBarNames = useTrackerBarNames();

  const [segmentSettings, setSegmentSettings] = useState<[string, number][]>(
    [],
  );

  const updateSegmentSettings = (segmentSettings: [string, number][]) => {
    OBR.scene.setMetadata({
      [getPluginId("segmentSettings")]: segmentSettings,
    });
    setSegmentSettings(segmentSettings);
  };

  useEffect(() => {
    const handleSceneMetadata = (sceneMetadata: Metadata) => {
      const segmentSettings = sceneMetadata[getPluginId("segmentSettings")];
      if (!isSegmentSettings(segmentSettings)) setSegmentSettings([]);
      else setSegmentSettings(segmentSettings);
    };
    OBR.scene.getMetadata().then(handleSceneMetadata);
    return OBR.scene.onMetadataChange(handleSceneMetadata);
  }, []);

  const trackerNamesWithSegmentsDisabled = trackerBarNames.filter(
    (name) => !segmentSettings.map((value) => value[0]).includes(name),
  );

  return (
    <div className={cn("h-screen overflow-y-auto", { dark: mode === "DARK" })}>
      <div className="grid grid-cols-[minmax(120px,_auto)] items-center p-4">
        <h1 className="m-0 text-lg font-bold tracking-[0px] text-text-primary dark:text-text-primary-dark">
          Scene Settings
        </h1>
      </div>
      <hr className="mx-4 my-0 border-text-primary dark:border-text-primary-dark/10" />

      <div className="flex w-full flex-col pt-3">
        <div className="grid w-full auto-rows-fr grid-cols-[auto_50px] items-center justify-items-center gap-x-1 gap-y-1 px-4">
          {/* Default trackers */}
          <h2 className="justify-self-start text-sm text-text-primary dark:text-text-primary-dark">
            Set scene default trackers
          </h2>
          <IconButton
            Icon={OpenInNewIcon}
            onClick={() =>
              OBR.popover.open({
                id: getPluginId("scene-editor"),
                url: "/src/sceneEditor/sceneEditor.html",
                height: 650,
                width: 430,
                anchorOrigin: {
                  horizontal: "CENTER",
                  vertical: "CENTER",
                },
                transformOrigin: {
                  horizontal: "CENTER",
                  vertical: "CENTER",
                },
              })
            }
          ></IconButton>

          {/* Vertical offset */}
          <h2 className="justify-self-start text-sm text-text-primary dark:text-text-primary-dark">
            Vertical Offset
          </h2>
          <Input
            value={verticalOffset}
            updateHandler={(value: number) => {
              setVerticalOffset(value);
              OBR.scene.setMetadata({
                [getPluginId(VERTICAL_OFFSET_METADATA_ID)]: value,
              });
            }}
          ></Input>

          {/* Trackers above token */}
          <h2 className="justify-self-start text-sm text-text-primary dark:text-text-primary-dark">
            Trackers above token
          </h2>
          <ToggleButton
            isChecked={trackersAboveToken}
            changeHandler={(isChecked: boolean) => {
              setTrackersAboveToken(isChecked);
              OBR.scene.setMetadata({
                [getPluginId(TRACKERS_ABOVE_METADATA_ID)]: isChecked,
              });
            }}
          ></ToggleButton>

          {/* Reduced bar height */}
          <h2 className="justify-self-start text-sm text-text-primary dark:text-text-primary-dark">
            Use reduced bar height
          </h2>
          <ToggleButton
            isChecked={barHeightIsReduced}
            changeHandler={(isChecked: boolean) => {
              setBarHeightIsReduced(isChecked);
              OBR.scene.setMetadata({
                [getPluginId(BAR_HEIGHT_METADATA_ID)]: isChecked,
              });
            }}
          ></ToggleButton>

          {/* Segments */}
          <h2 className="justify-self-start text-sm text-text-primary dark:text-text-primary-dark">
            Enable Segments
          </h2>
          <ToggleButton
            isChecked={segmentsEnabled}
            changeHandler={(isChecked: boolean) => {
              setSegmentsEnabled(isChecked);
              OBR.scene.setMetadata({
                [getPluginId(SEGMENTS_ENABLED_METADATA_ID)]: isChecked,
              });
            }}
          ></ToggleButton>

          {/* Hide label */}
          <h2 className="justify-self-start text-sm text-text-primary dark:text-text-primary-dark">
            Hide label
          </h2>
          <ToggleButton
            isChecked={hideLabel}
            changeHandler={(isChecked: boolean) => {
              setHideLabel(isChecked);
              OBR.scene.setMetadata({
                [getPluginId(HIDE_LABEL_METADATA_ID)]: isChecked,
              });
            }}
          ></ToggleButton>

          {/* Hide enemy trackers entirely */}
          <h2 className="justify-self-start text-sm text-text-primary dark:text-text-primary-dark">
            Hide all enemy stats from players
          </h2>
          <ToggleButton
            isChecked={hideEnemyTrackers}
            changeHandler={(isChecked: boolean) => {
              setHideEnemyTrackers(isChecked);
              OBR.scene.setMetadata({
                [getPluginId(HIDE_ENEMY_TRACKERS_METADATA_ID)]: isChecked,
              });
            }}
          ></ToggleButton>
        </div>

        {/* Segments dropdown */}
        <div>
          <Collapse in={segmentsEnabled}>
            <div className={"my-1 flex flex-col gap-2 bg-black/15 p-2"}>
              {segmentSettings.length > 0 && (
                <div className="flex flex-col gap-2">
                  {[...segmentSettings].map((setting) => (
                    <div
                      key={setting[0]}
                      className="overflow-clip rounded-lg bg-white/5 p-2 pb-3 pl-3"
                    >
                      <div className="flex w-full items-start justify-between">
                        <div>
                          <h1 className="text-text-primary dark:text-text-primary-dark">
                            {setting[0]}
                          </h1>
                          <p className="text-xs text-text-secondary dark:text-text-secondary-dark">
                            Segments
                          </p>
                        </div>
                        <IconButton
                          Icon={DeleteIcon}
                          className="rounded-md"
                          onClick={() =>
                            updateSegmentSettings(
                              segmentSettings.filter(
                                (value) => value !== setting,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="flex justify-between pr-1 pt-2">
                        <TrackerInput
                          fullWidth
                          value={setting[1].toString()}
                          onConfirm={(content) => {
                            const index = segmentSettings.findIndex(
                              (value) => value[0] === setting[0],
                            );
                            if (index !== -1) {
                              segmentSettings[index][1] = Math.trunc(
                                parseContentForNumber(content, 0, false, {
                                  min: 0,
                                }),
                              );
                              updateSegmentSettings([...segmentSettings]);
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {trackerNamesWithSegmentsDisabled.length > 0 && (
                <div className="flex flex-row flex-wrap gap-2 py-1">
                  {trackerNamesWithSegmentsDisabled.map((name) => (
                    <button
                      key={name}
                      className="flex items-center gap-2 rounded-full px-3 py-1 pl-2 text-sm text-text-primary outline outline-1 outline-white/30 hover:bg-black/20 dark:text-text-primary-dark"
                      onClick={() =>
                        updateSegmentSettings([...segmentSettings, [name, 0]])
                      }
                    >
                      <SimplePlusIcon />
                      <div className="pt-0.5">{name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Collapse>
        </div>
      </div>
    </div>
  );
}
