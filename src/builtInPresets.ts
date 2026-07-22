import { createId, Tracker } from "./trackerHelpersBasic";

/** Fresh IDs are generated each time this is installed, so the same
 * built-in preset can be added to multiple scenes without ID collisions.
 *
 * HP is listed before Heat here so scene defaults/tracker menus read
 * "HP, Heat" -- bar-stacking order runs in the opposite direction (see
 * onMapTrackers.ts), so HP's bar still ends up rendered above Heat's on
 * the map despite HP coming first in this list. */
export function createLancerPresetTrackers(): Tracker[] {
  return [
    {
      id: createId(),
      variant: "value-max",
      color: "#0284ff",
      name: "HP",
      value: 0,
      max: 0,
    },
    {
      id: createId(),
      variant: "value-max",
      color: "#ff1744",
      name: "Heat",
      value: 0,
      max: 0,
      hideWhenZero: true,
    },
    {
      id: createId(),
      variant: "counter",
      color: "#3a30ff",
      name: "Structure",
      value: 0,
      hideWhenZero: true,
      alwaysVisible: true,
      corner: "BOTTOM_LEFT",
    },
    {
      id: createId(),
      variant: "counter",
      color: "#ff1800",
      name: "Stress",
      value: 0,
      hideWhenZero: true,
      alwaysVisible: true,
      corner: "BOTTOM_RIGHT",
    },
    {
      id: createId(),
      variant: "counter",
      color: "#57b5ff",
      name: "Overshield",
      value: 0,
      hideWhenZero: true,
      hideValueFromPlayers: true,
      corner: "TOP_LEFT",
    },
    {
      id: createId(),
      variant: "counter",
      color: "#b71c1c",
      name: "Burn",
      value: 0,
      hideWhenZero: true,
      alwaysVisible: true,
      corner: "TOP_RIGHT",
    },
  ];
}

/** Ascension's preset -- a copy of the Lancer preset's structure with
 * renamed/reworked trackers. Resistance is a counter-with-temp tracker:
 * its on-map bubble shows the sum of two independently-editable inputs
 * (Resistance + Temp Resistance) rather than a single directly-editable
 * number. */
export function createAscensionPresetTrackers(): Tracker[] {
  return [
    {
      id: createId(),
      variant: "value-max",
      color: "#8b0000",
      name: "HP",
      value: 0,
      max: 0,
    },
    {
      id: createId(),
      variant: "value-max",
      color: "#a38826",
      name: "WP",
      value: 0,
      max: 0,
      hideWhenZero: true,
    },
    {
      id: createId(),
      variant: "counter",
      color: "#8b0000",
      name: "Health Bars",
      value: 0,
      hideWhenZero: true,
      alwaysVisible: true,
      corner: "BOTTOM_LEFT",
    },
    {
      id: createId(),
      variant: "counter-with-temp",
      color: "#5498c0",
      name: "Resistance",
      tempLabel: "Temp Res",
      value: 0,
      tempValue: 0,
      hideWhenZero: true,
      corner: "BOTTOM_RIGHT",
    },
    {
      id: createId(),
      variant: "counter",
      color: "#5e9957",
      name: "Temp HP",
      value: 0,
      hideWhenZero: true,
      hideValueFromPlayers: true,
      corner: "TOP_LEFT",
    },
    {
      id: createId(),
      variant: "counter",
      color: "#79449e",
      name: "Persistent",
      value: 0,
      hideWhenZero: true,
      alwaysVisible: true,
      corner: "TOP_RIGHT",
    },
  ];
}
