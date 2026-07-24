import { Metadata } from "@owlbear-rodeo/sdk";
import { getPluginId } from "./getPluginId";

export const VERTICAL_OFFSET_METADATA_ID = "verticalOffset";
export const TRACKERS_ABOVE_METADATA_ID = "trackersAboveToken";
export const BAR_HEIGHT_METADATA_ID = "barHeightIsReduced";
export const SEGMENTS_ENABLED_METADATA_ID = "segmentsEnabled";
export const HIDE_LABEL_METADATA_ID = "hideLabel";
export const HIDE_ENEMY_TRACKERS_METADATA_ID = "hideEnemyTrackers";

export function readBooleanFromMetadata(
  metadata: Metadata,
  key: string,
  defaultValue = false,
): boolean {
  const value = metadata[getPluginId(key)];
  if (typeof value !== "boolean") return defaultValue;
  return value;
}

export function readNumberFromMetadata(
  metadata: Metadata,
  key: string,
): number {
  const value = metadata[getPluginId(key)];
  if (typeof value !== "number") return 0;
  if (Number.isNaN(value)) return 0;
  return value;
}
