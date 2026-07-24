import { useEffect, useState } from "react";
import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import {
  getPresetsFromSceneMetadata,
  getActivePresetNameFromSceneMetadata,
  writeActivePresetNameToScene,
  createPreset,
  deletePreset,
  installPreset,
  mergeSegmentSettings,
} from "../trackerHelpersScene";
import {
  createLancerPresetTrackers,
  createAscensionPresetTrackers,
} from "../builtInPresets";
import IconButton from "../components/IconButton";
import DeleteIcon from "../icons/DeleteIcon";
import { cn } from "../lib/utils";

/** Lets the GM switch which named set of default trackers is active for
 * this scene (e.g. one preset per game system), so the same extension can
 * be reused across different systems without re-entering defaults. */
export default function PresetSwitcher(): React.JSX.Element {
  const [presetNames, setPresetNames] = useState<string[]>([]);
  const [activeName, setActiveName] = useState<string>("");
  const [newName, setNewName] = useState<string>("");

  useEffect(() => {
    const handleMetadata = (metadata: Metadata) => {
      setPresetNames(Object.keys(getPresetsFromSceneMetadata(metadata)));
      setActiveName(getActivePresetNameFromSceneMetadata(metadata));
    };
    OBR.scene.getMetadata().then(handleMetadata);
    return OBR.scene.onMetadataChange(handleMetadata);
  }, []);

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (trimmed === "") return;
    createPreset(trimmed);
    setNewName("");
  };

  return (
    <div className="flex flex-col gap-2 border-b border-black/10 p-2 dark:border-white/10">
      <div className="flex flex-row flex-wrap items-center gap-1">
        {presetNames.map((name) => (
          <div key={name} className="flex items-center gap-0.5">
            <button
              className={cn(
                "rounded-full px-3 py-1 text-sm text-text-primary outline outline-1 outline-white/30 dark:text-text-primary-dark",
                name === activeName
                  ? "bg-white/40 dark:bg-black/40"
                  : "hover:bg-black/20 dark:hover:bg-white/10",
              )}
              onClick={() => writeActivePresetNameToScene(name)}
            >
              {name}
            </button>
            <IconButton
              Icon={DeleteIcon}
              className="rounded-md"
              onClick={() => deletePreset(name)}
            />
          </div>
        ))}
        {presetNames.length === 0 && (
          <p className="text-xs text-text-secondary dark:text-text-secondary-dark">
            No presets yet -- add one below.
          </p>
        )}
      </div>
      <div className="flex flex-row gap-1">
        <input
          className="w-full rounded-lg border-none bg-white/30 px-2 py-1 text-sm text-text-primary placeholder-text-secondary outline-none dark:bg-black/15 dark:text-text-primary-dark dark:placeholder-text-secondary-dark"
          placeholder="New preset name (e.g. Lancer)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <button
          className="shrink-0 rounded-lg border-none bg-white/30 px-3 py-1 text-sm text-text-primary no-underline hover:bg-white/20 dark:bg-black/15 dark:text-text-primary-dark dark:hover:bg-black/35"
          onClick={handleAdd}
        >
          Add
        </button>
      </div>
      <div className="flex flex-row gap-1">
        <button
          className="min-w-0 flex-1 truncate rounded-lg border-none bg-white/30 px-3 py-1 text-sm text-text-primary no-underline hover:bg-white/20 dark:bg-black/15 dark:text-text-primary-dark dark:hover:bg-black/35"
          onClick={() => {
            installPreset("Lancer", createLancerPresetTrackers());
            mergeSegmentSettings([
              ["HP", 4],
              ["Heat", 2],
            ]);
          }}
        >
          Add Lancer Preset
        </button>
        <button
          className="min-w-0 flex-1 truncate rounded-lg border-none bg-white/30 px-3 py-1 text-sm text-text-primary no-underline hover:bg-white/20 dark:bg-black/15 dark:text-text-primary-dark dark:hover:bg-black/35"
          onClick={() =>
            installPreset("Ascension", createAscensionPresetTrackers())
          }
        >
          Add Ascension Preset
        </button>
      </div>
    </div>
  );
}
