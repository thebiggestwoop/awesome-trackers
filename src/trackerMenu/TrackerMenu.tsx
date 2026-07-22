import { useEffect, useState } from "react";
import { useOwlbearStore } from "../useOwlbearStore";
import "../index.css";
import NumberTrackerInput from "../components/NumberTrackerInput";
import IconButton from "../components/IconButton";

import OBR, { Item, Metadata } from "@owlbear-rodeo/sdk";
import { getPluginId } from "../getPluginId";
import { Tracker } from "../trackerHelpersBasic";
import { getTrackersFromSceneMetadata } from "../trackerHelpersScene";
import { useTrackersHidden } from "../useTrackersHidden";
import { useTrackerStore } from "../useTrackerStore";
import {
  getTrackersFromSelection,
  getNameFromSelection,
  writeNameToSelection,
  classifySelection,
  getDefeatedFromSelection,
  setDefeatedForSelection,
} from "../trackerHelpersItem";
import {
  addActivation,
  getInitiativeEntryFromSelection,
  InitiativeEntry,
  joinInitiative,
  leaveInitiative,
  MAX_ACTIVATIONS,
  removeActivation,
} from "../initiativeHelpers";
import BarTrackerInput from "../components/BarTrackerInput";
import CheckboxTrackerInput from "../components/CheckboxTrackerInput";
import OpenInNewIcon from "../icons/OpenInNewIcon";
import AddTrackerButton from "../components/AddTrackerButton";
import CounterTrackerInput from "../components/CounterTrackerInput";
import CounterWithTempInput from "../components/CounterWithTempInput";
import NameInput from "../components/NameInput";
import SimplePlusIcon from "../icons/SimplePlusIcon";
import SimpleMinusIcon from "../icons/SimpleMinusIcon";

export default function TrackerMenu({
  initialSceneTrackers,
}: {
  initialSceneTrackers: Tracker[];
}): React.JSX.Element {
  const role = useOwlbearStore((state) => state.role);
  const mode = useOwlbearStore((state) => state.themeMode);

  const trackers = useTrackerStore((state) => state.trackers);
  const setTrackers = useTrackerStore((state) => state.setTrackers);
  const updateTrackerField = useTrackerStore(
    (state) => state.updateTrackerField,
  );

  const trackersHidden = useTrackersHidden();
  const [sceneTrackers, setSceneTrackers] =
    useState<Tracker[]>(initialSceneTrackers);

  const [itemName, setItemName] = useState<string>("");
  const [initiativeEntry, setInitiativeEntry] = useState<
    InitiativeEntry | undefined
  >(undefined);
  const [defeated, setDefeated] = useState<boolean>(false);

  const [initDone, setInitDone] = useState<{
    trackers: boolean;
    sceneTrackers: boolean;
  }>({ trackers: false, sceneTrackers: false });

  useEffect(() => {
    const updateTrackers = (items: Item[]) => {
      getTrackersFromSelection(items).then((newTracker) => {
        setTrackers(newTracker);
      });
      getNameFromSelection(items).then((name) => {
        setItemName(name);
      });
      getInitiativeEntryFromSelection(items).then((entry) => {
        setInitiativeEntry(entry);
      });
      getDefeatedFromSelection(items).then((defeated) => {
        setDefeated(defeated);
      });
    };
    OBR.scene.items
      .getItems()
      .then(updateTrackers)
      .then(() => setInitDone((prev) => ({ ...prev, trackers: true })));
    return OBR.scene.items.onChange(updateTrackers);
  }, []);

  useEffect(() => {
    const updateSceneTrackers = (metadata: Metadata) => {
      setSceneTrackers(getTrackersFromSceneMetadata(metadata));
    };
    OBR.scene
      .getMetadata()
      .then(updateSceneTrackers)
      .then(() => {
        setInitDone((prev) => ({ ...prev, sceneTrackers: true }));
      });
    return OBR.scene.onMetadataChange(updateSceneTrackers);
  }, []);

  const generateInput = (tracker: Tracker): React.JSX.Element => {
    if (tracker.variant === "value") {
      return (
        <NumberTrackerInput
          key={tracker.id}
          tracker={tracker}
          color={tracker.color}
          updateHandler={(content: string) =>
            updateTrackerField(tracker.id, "value", content)
          }
          animateOnlyWhenRootActive={true}
        />
      );
    } else if (tracker.variant === "value-max") {
      return (
        <BarTrackerInput
          key={tracker.id}
          tracker={tracker}
          color={tracker.color}
          valueUpdateHandler={(content: string) =>
            updateTrackerField(tracker.id, "value", content)
          }
          maxUpdateHandler={(content: string) =>
            updateTrackerField(tracker.id, "max", content)
          }
          animateOnlyWhenRootActive={true}
        />
      );
    } else if (tracker.variant === "counter") {
      return (
        <CounterTrackerInput
          key={tracker.id}
          tracker={tracker}
          color={tracker.color}
          updateHandler={(content: string) =>
            updateTrackerField(tracker.id, "value", content)
          }
          increment={() =>
            updateTrackerField(
              tracker.id,
              "value",
              `=${(tracker.value + 1).toString()}`,
            )
          }
          decrement={() =>
            updateTrackerField(
              tracker.id,
              "value",
              `=${(tracker.value - 1).toString()}`,
            )
          }
          animateOnlyWhenRootActive={true}
        />
      );
    } else if (tracker.variant === "counter-with-temp") {
      return (
        <CounterWithTempInput
          key={tracker.id}
          tracker={tracker}
          color={tracker.color}
          updateValue={(content: string) =>
            updateTrackerField(tracker.id, "value", content)
          }
          updateTempValue={(content: string) =>
            updateTrackerField(tracker.id, "tempValue", content)
          }
          incrementValue={() =>
            updateTrackerField(
              tracker.id,
              "value",
              `=${(tracker.value + 1).toString()}`,
            )
          }
          decrementValue={() =>
            updateTrackerField(
              tracker.id,
              "value",
              `=${(tracker.value - 1).toString()}`,
            )
          }
          incrementTempValue={() =>
            updateTrackerField(
              tracker.id,
              "tempValue",
              `=${(tracker.tempValue + 1).toString()}`,
            )
          }
          decrementTempValue={() =>
            updateTrackerField(
              tracker.id,
              "tempValue",
              `=${(tracker.tempValue - 1).toString()}`,
            )
          }
          animateOnlyWhenRootActive={true}
        />
      );
    } else
      return (
        <CheckboxTrackerInput
          key={tracker.id}
          tracker={tracker}
          color={tracker.color}
          updateHandler={(checked) =>
            updateTrackerField(tracker.id, "checked", checked)
          }
          animateOnlyWhenRootActive={true}
        />
      );
  };

  if (!initDone.trackers || !initDone.sceneTrackers) return <></>;

  return (
    <div
      className={`${mode === "DARK" ? "dark" : ""} h-screen overflow-y-auto`}
    >
      <div className={`flex flex-col gap-2 px-2 py-1`}>
        <div className="flex flex-row justify-center gap-1 self-center rounded-full bg-white/25 p-0.5 dark:bg-black/25">
          <AddTrackerButton dense />
          <IconButton
            Icon={OpenInNewIcon}
            onClick={() => {
              OBR.popover.open({
                id: getPluginId("editor"),
                url: "/src/editor/editor.html",
                height: 550,
                width: 430,
                anchorOrigin: { horizontal: "CENTER", vertical: "CENTER" },
                transformOrigin: { horizontal: "CENTER", vertical: "CENTER" },
              });
            }}
          ></IconButton>
        </div>
        <div className="rounded-lg bg-white/30 px-2 py-1 dark:bg-black/15">
          <NameInput
            value={itemName}
            onUserConfirm={(target) => {
              setItemName(target.value);
              writeNameToSelection(target.value);
            }}
          />
        </div>
        {role === "GM" && (
          <button
            className="self-center justify-self-center rounded-lg border-none bg-white/30 px-2 py-[4px] text-center text-2xs text-text-primary no-underline hover:bg-white/20 dark:bg-black/15 dark:text-text-primary-dark dark:hover:bg-black/35"
            onClick={() => {
              setDefeated(!defeated);
              setDefeatedForSelection(!defeated);
            }}
          >
            {defeated ? "Revive" : "Mark Defeated"}
          </button>
        )}
        <div className="flex flex-row items-center justify-center gap-2">
          {initiativeEntry ? (
            <button
              className="self-center justify-self-center rounded-lg border-none bg-white/30 px-2 py-[4px] text-center text-2xs text-text-primary no-underline hover:bg-white/20 dark:bg-black/15 dark:text-text-primary-dark dark:hover:bg-black/35"
              onClick={() => leaveInitiative()}
            >
              Leave Initiative
            </button>
          ) : (
            <>
              <button
                className="self-center justify-self-center rounded-lg border-none bg-white/30 px-2 py-[4px] text-center text-2xs text-text-primary no-underline hover:bg-white/20 dark:bg-black/15 dark:text-text-primary-dark dark:hover:bg-black/35"
                onClick={() => joinInitiative("PARTY")}
              >
                Join as Ally
              </button>
              {role === "GM" && (
                <button
                  className="self-center justify-self-center rounded-lg border-none bg-white/30 px-2 py-[4px] text-center text-2xs text-text-primary no-underline hover:bg-white/20 dark:bg-black/15 dark:text-text-primary-dark dark:hover:bg-black/35"
                  onClick={() => joinInitiative("ADVERSARY")}
                >
                  Join as Enemy
                </button>
              )}
            </>
          )}
          {initiativeEntry && (
            <div className="flex items-center gap-1 rounded-lg bg-white/30 px-1 dark:bg-black/15">
              <IconButton
                Icon={SimpleMinusIcon}
                className="size-[26px] disabled:opacity-30"
                disabled={initiativeEntry.slots.length <= 1}
                onClick={() => removeActivation(initiativeEntry.itemId)}
                title="Remove an activation"
              />
              <span className="min-w-[10px] text-center text-2xs text-text-primary dark:text-text-primary-dark">
                {initiativeEntry.slots.length}
              </span>
              <IconButton
                Icon={SimplePlusIcon}
                className="size-[26px] disabled:opacity-30"
                disabled={initiativeEntry.slots.length >= MAX_ACTIVATIONS}
                onClick={() => addActivation(initiativeEntry.itemId)}
                title="Give another activation"
              />
            </div>
          )}
        </div>
        {trackersHidden.value === undefined ? (
          <div className="flex flex-col items-center gap-1">
            <div className="flex flex-row justify-center gap-2">
              <button
                className="self-center justify-self-center rounded-lg border-none bg-white/30 p-[6px] text-center text-text-primary no-underline hover:bg-white/20 dark:bg-black/15 dark:text-text-primary-dark dark:hover:bg-black/35"
                onClick={() => classifySelection(false, sceneTrackers)}
              >
                Add Ally
              </button>
              {role === "GM" && (
                <button
                  className="self-center justify-self-center rounded-lg border-none bg-white/30 p-[6px] text-center text-text-primary no-underline hover:bg-white/20 dark:bg-black/15 dark:text-text-primary-dark dark:hover:bg-black/35"
                  onClick={() => classifySelection(true, sceneTrackers)}
                >
                  Add Enemy
                </button>
              )}
            </div>
            {sceneTrackers.length === 0 && (
              <p className="text-center text-2xs text-text-secondary dark:text-text-secondary-dark">
                No scene default trackers set -- add trackers manually after.
              </p>
            )}
          </div>
        ) : (
          <>
            {role === "GM" && (
              <button
                className="self-center justify-self-center rounded-lg border-none bg-white/30 px-2 py-[4px] text-center text-2xs text-text-primary no-underline hover:bg-white/20 dark:bg-black/15 dark:text-text-primary-dark dark:hover:bg-black/35"
                onClick={() => trackersHidden.clear()}
              >
                {trackersHidden.value === true ? "Remove Enemy" : "Remove Ally"}
              </button>
            )}
            {trackers.length !== 0 ? (
              <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 rounded-xl bg-white/0">
                {trackers.map((tracker) => generateInput(tracker))}
              </div>
            ) : (
              <div className="self-center justify-self-center rounded-lg border-none p-[6px] text-center text-text-primary no-underline dark:text-text-primary-dark">
                No trackers yet -- use the + button above to add one.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
