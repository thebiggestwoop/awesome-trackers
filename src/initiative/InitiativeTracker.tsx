import { useEffect, useRef, useState } from "react";
import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { useOwlbearStore } from "../useOwlbearStore";
import { getPluginId } from "../getPluginId";
import {
  getInitiativeEntryFromItem,
  getPreviousStackFromSceneMetadata,
  getRoundFromSceneMetadata,
  InitiativeEntry,
  removeEntryFromInitiative,
  setRound as writeRoundToScene,
  setSlotReady,
  startNewRound,
} from "../initiativeHelpers";
import InitiativeListItem from "./InitiativeListItem";
import IconButton from "../components/IconButton";
import OpenInNewIcon from "../icons/OpenInNewIcon";
import Input from "../components/Input";
import { cn } from "../lib/utils";

export default function InitiativeTracker(): React.JSX.Element {
  const mode = useOwlbearStore((state) => state.themeMode);
  const role = useOwlbearStore((state) => state.role);
  const items = useOwlbearStore((state) => state.items);

  const [round, setRound] = useState(1);
  const [previousStack, setPreviousStack] = useState<string[]>([]);

  useEffect(() => {
    const handleSceneMetadata = (sceneMetadata: Metadata) => {
      setRound(getRoundFromSceneMetadata(sceneMetadata));
      setPreviousStack(getPreviousStackFromSceneMetadata(sceneMetadata));
    };
    OBR.scene.getMetadata().then(handleSceneMetadata);
    return OBR.scene.onMetadataChange(handleSceneMetadata);
  }, []);

  const initiativeEntries: InitiativeEntry[] = items
    .map(getInitiativeEntryFromItem)
    .filter((entry): entry is InitiativeEntry => entry !== undefined);

  const defeatedEntries = initiativeEntries.filter((entry) => entry.defeated);
  const partyEntries = initiativeEntries.filter(
    (entry) => !entry.defeated && entry.group === "PARTY",
  );
  const adversaryEntries = initiativeEntries.filter(
    (entry) => !entry.defeated && entry.group === "ADVERSARY",
  );

  const divRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!divRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length > 0) {
        const height = entries[0].contentRect.bottom + entries[0].contentRect.top;
        OBR.action.setHeight(Math.max(height, 129));
      }
    });
    resizeObserver.observe(divRef.current);
    return () => {
      resizeObserver.disconnect();
      OBR.action.setHeight(129);
    };
  }, []);

  return (
    <div className={cn("h-screen overflow-y-auto", { dark: mode === "DARK" })}>
      <div ref={divRef}>
        <div className="flex items-center justify-between p-4 pb-2">
          <h1 className="m-0 text-lg font-bold tracking-[0px] text-text-primary dark:text-text-primary-dark">
            Initiative
          </h1>
          <div className="flex items-center gap-1">
            {role === "GM" && (
              <button
                className="rounded-full border-none bg-white/30 px-3 py-1 text-sm text-text-primary no-underline hover:bg-white/20 dark:bg-black/15 dark:text-text-primary-dark dark:hover:bg-black/35"
                onClick={() => startNewRound(round)}
              >
                New Round
              </button>
            )}
            {role === "GM" ? (
              <div className="flex items-center gap-1">
                <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                  Round
                </span>
                <Input
                  value={round}
                  updateHandler={(value) => {
                    setRound(value);
                    writeRoundToScene(value);
                  }}
                />
              </div>
            ) : (
              <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                Round {round}
              </span>
            )}
            {role === "GM" && (
              <IconButton
                Icon={OpenInNewIcon}
                title="Scene settings"
                onClick={() =>
                  OBR.popover.open({
                    id: getPluginId("scene-settings"),
                    url: "/src/sceneSettings/sceneSettings.html",
                    height: 480,
                    width: 300,
                    anchorOrigin: { horizontal: "CENTER", vertical: "CENTER" },
                    transformOrigin: {
                      horizontal: "CENTER",
                      vertical: "CENTER",
                    },
                  })
                }
              />
            )}
          </div>
        </div>

        <hr className="mx-4 my-0 border-text-primary dark:border-text-primary-dark/10" />

        <div className="flex flex-col gap-1 px-2 py-2">
          <GroupSection
            title="Party"
            entries={partyEntries}
            role={role}
            previousStack={previousStack}
            emptyHint="The party seems to be empty..."
          />
          <GroupSection
            title="Adversaries"
            entries={adversaryEntries}
            role={role}
            previousStack={previousStack}
            emptyHint={
              partyEntries.length === 0
                ? "The action must be elsewhere..."
                : "The party stands uncontested"
            }
          />
          {defeatedEntries.length > 0 && (
            <GroupSection
              title="Defeated"
              entries={defeatedEntries}
              role={role}
              previousStack={previousStack}
              emptyHint=""
            />
          )}
        </div>
      </div>
    </div>
  );
}

function GroupSection({
  title,
  entries,
  role,
  previousStack,
  emptyHint,
}: {
  title: string;
  entries: InitiativeEntry[];
  role: "GM" | "PLAYER";
  previousStack: string[];
  emptyHint: string;
}): React.JSX.Element {
  const visibleEntries = entries.filter(
    (entry) => entry.visible || role === "GM",
  );

  return (
    <div className="flex flex-col">
      <h2 className="px-2 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-text-secondary dark:text-text-secondary-dark">
        {title}
      </h2>
      {visibleEntries.length === 0 ? (
        <p className="px-2 pb-2 text-xs text-text-secondary dark:text-text-secondary-dark">
          {emptyHint}
        </p>
      ) : (
        visibleEntries.map((entry) => (
          <InitiativeListItem
            key={entry.itemId}
            entry={entry}
            role={role}
            onReadyChange={(slotId, ready) =>
              setSlotReady(slotId, ready, previousStack)
            }
            onRemove={() => removeEntryFromInitiative(entry.itemId)}
          />
        ))
      )}
    </div>
  );
}
