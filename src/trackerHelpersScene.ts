import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { getPluginId } from "./getPluginId";
import { Tracker, isTracker, TRACKER_METADATA_ID } from "./trackerHelpersBasic";
import { isSegmentSettings } from "./isSegmentSettings";

/////////////////////////////////////////////////////////////////////
// Scene default tracker presets -- named sets of default trackers (e.g.
// one per game system) a scene can switch between. Add Ally/Add Enemy,
// and the scene defaults editor, always operate on whichever preset is
// currently active.
/////////////////////////////////////////////////////////////////////

export type Presets = Record<string, Tracker[]>;

const PRESETS_METADATA_ID = "presets";
const ACTIVE_PRESET_METADATA_ID = "activePreset";
export const DEFAULT_PRESET_NAME = "Default";

function parsePresets(value: unknown): Presets {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return {};

  const presets: Presets = {};
  for (const [name, trackersValue] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (!Array.isArray(trackersValue)) continue;
    presets[name] = trackersValue.filter(isTracker);
  }
  return presets;
}

export function getPresetsFromSceneMetadata(sceneMetadata: Metadata): Presets {
  const raw = sceneMetadata[getPluginId(PRESETS_METADATA_ID)];
  if (raw !== undefined) return parsePresets(raw);

  // Migrate the old single flat default list, if one was saved before this
  // feature existed and no named presets have been created yet.
  const legacy = sceneMetadata[getPluginId(TRACKER_METADATA_ID)];
  if (Array.isArray(legacy)) {
    const trackers = legacy.filter(isTracker);
    if (trackers.length > 0) return { [DEFAULT_PRESET_NAME]: trackers };
  }
  return {};
}

export async function getPresetsFromScene(): Promise<Presets> {
  return getPresetsFromSceneMetadata(await OBR.scene.getMetadata());
}

export async function writePresetsToScene(presets: Presets) {
  await OBR.scene.setMetadata({ [getPluginId(PRESETS_METADATA_ID)]: presets });
}

export function getActivePresetNameFromSceneMetadata(
  sceneMetadata: Metadata,
): string {
  const raw = sceneMetadata[getPluginId(ACTIVE_PRESET_METADATA_ID)];
  if (typeof raw === "string" && raw !== "") return raw;
  const names = Object.keys(getPresetsFromSceneMetadata(sceneMetadata));
  return names[0] ?? DEFAULT_PRESET_NAME;
}

export async function getActivePresetNameFromScene(): Promise<string> {
  return getActivePresetNameFromSceneMetadata(await OBR.scene.getMetadata());
}

export async function writeActivePresetNameToScene(name: string) {
  await OBR.scene.setMetadata({
    [getPluginId(ACTIVE_PRESET_METADATA_ID)]: name,
  });
}

/** Create a new empty preset and make it the active one. No-ops if the name
 * is blank or already taken. */
export async function createPreset(name: string) {
  const sceneMetadata = await OBR.scene.getMetadata();
  const presets = getPresetsFromSceneMetadata(sceneMetadata);
  if (name === "" || name in presets) return;
  await writePresetsToScene({ ...presets, [name]: [] });
  await writeActivePresetNameToScene(name);
}

/** Create a preset pre-populated with specific trackers (used for built-in
 * presets) and make it active. If the name is already taken, appends a
 * numeric suffix rather than overwriting the existing preset. */
export async function installPreset(name: string, trackers: Tracker[]) {
  const sceneMetadata = await OBR.scene.getMetadata();
  const presets = getPresetsFromSceneMetadata(sceneMetadata);

  let finalName = name;
  let suffix = 2;
  while (finalName in presets) {
    finalName = `${name} ${suffix}`;
    suffix++;
  }

  await writePresetsToScene({ ...presets, [finalName]: trackers });
  await writeActivePresetNameToScene(finalName);
}

const SEGMENT_SETTINGS_METADATA_ID = "segmentSettings";

/** Merges the given tracker-name -> segment-count entries into the scene's
 * existing segment settings, overwriting any entry that already exists for
 * the same tracker name and leaving every other tracker's entry untouched.
 * Used by the built-in Lancer preset to set its own default segment counts
 * (4 for HP, 2 for Heat) without clobbering segment settings a GM may have
 * configured separately for other trackers. Doesn't touch the scene-wide
 * "Enable Segments" toggle itself -- that's a separate, more disruptive
 * switch left for the GM to flip on deliberately. */
export async function mergeSegmentSettings(entries: [string, number][]) {
  const sceneMetadata = await OBR.scene.getMetadata();
  const raw = sceneMetadata[getPluginId(SEGMENT_SETTINGS_METADATA_ID)];
  const existing = isSegmentSettings(raw) ? raw : [];

  const namesToReplace = new Set(entries.map(([name]) => name));
  const merged = [
    ...existing.filter(([name]) => !namesToReplace.has(name)),
    ...entries,
  ];

  await OBR.scene.setMetadata({
    [getPluginId(SEGMENT_SETTINGS_METADATA_ID)]: merged,
  });
}

/** Delete a preset. If it was the active one, switches active to whatever
 * preset remains first, or to nothing if none are left. */
export async function deletePreset(name: string) {
  const sceneMetadata = await OBR.scene.getMetadata();
  const presets = getPresetsFromSceneMetadata(sceneMetadata);
  const rest = { ...presets };
  delete rest[name];
  await writePresetsToScene(rest);

  const activeName = getActivePresetNameFromSceneMetadata(sceneMetadata);
  if (activeName === name) {
    const remaining = Object.keys(rest);
    await writeActivePresetNameToScene(remaining[0] ?? "");
  }
}

/** Rename a preset in place, keeping its trackers and, if it was active,
 * keeping it active under the new name. */
export async function renamePreset(oldName: string, newName: string) {
  const sceneMetadata = await OBR.scene.getMetadata();
  const presets = getPresetsFromSceneMetadata(sceneMetadata);
  if (newName === "" || newName === oldName || newName in presets) return;
  if (!(oldName in presets)) return;

  const rest = { ...presets };
  const trackers = rest[oldName];
  delete rest[oldName];
  rest[newName] = trackers;
  await writePresetsToScene(rest);

  const activeName = getActivePresetNameFromSceneMetadata(sceneMetadata);
  if (activeName === oldName) await writeActivePresetNameToScene(newName);
}

/////////////////////////////////////////////////////////////////////
// Active-preset trackers -- the API the rest of the extension already
// used before presets existed (Add Ally/Add Enemy, the scene defaults
// editor). Kept under the same names so those call sites didn't need to
// change; only the underlying storage did.
/////////////////////////////////////////////////////////////////////

/** Write local trackers to scene -- saves into whichever preset is
 * currently active (creating a "Default" preset first if none is active
 * yet). */
export async function writeTrackersToScene(trackers: Tracker[]) {
  const sceneMetadata = await OBR.scene.getMetadata();
  const presets = getPresetsFromSceneMetadata(sceneMetadata);
  const activeName = getActivePresetNameFromSceneMetadata(sceneMetadata);
  const name = activeName === "" ? DEFAULT_PRESET_NAME : activeName;
  await writePresetsToScene({ ...presets, [name]: trackers });
  if (activeName !== name) await writeActivePresetNameToScene(name);
}

/** Get trackers from scene -- the active preset's trackers. */
export async function getTrackersFromScene(): Promise<Tracker[]> {
  const sceneMetadata = await OBR.scene.getMetadata();
  return getTrackersFromSceneMetadata(sceneMetadata);
}

export function getTrackersFromSceneMetadata(
  sceneMetadata: Metadata,
): Tracker[] {
  const presets = getPresetsFromSceneMetadata(sceneMetadata);
  const activeName = getActivePresetNameFromSceneMetadata(sceneMetadata);
  return presets[activeName] ?? [];
}
