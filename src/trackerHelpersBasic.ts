/////////////////////////////////////////////////////////////////////
// Tracker types
/////////////////////////////////////////////////////////////////////

export type Corner = "TOP_LEFT" | "TOP_RIGHT" | "BOTTOM_LEFT" | "BOTTOM_RIGHT";
const CORNERS: Corner[] = [
  "TOP_LEFT",
  "TOP_RIGHT",
  "BOTTOM_LEFT",
  "BOTTOM_RIGHT",
];

export type Tracker = {
  id: string;
  // A number is an index into the built-in 9-color palette (colorHelpers.ts);
  // a string is a literal hex color, used by trackers that need an exact
  // color the palette doesn't offer.
  color: number | string;
  name?: string;
  showOnMap?: boolean;
  inlineMath?: boolean;
  // Auto-hides this tracker's on-map display entirely, for every viewer,
  // whenever it's "empty" -- for bubble-type trackers (value/counter/
  // checkbox) that means its value is exactly 0, for stats only worth
  // showing once they're active (Burn, Structure damage, etc). For a
  // bar (value-max) tracker it instead means its max is exactly 0 -- a
  // bar at 0/10 should still show empty, but a bar with no max at all
  // means the unit doesn't have that mechanic (e.g. no Heat track).
  hideWhenZero?: boolean;
  // Exempts this tracker from the token's Ally/Enemy hidden classification
  // entirely -- it always renders in full, to GM and players alike,
  // regardless of whether the token is hidden.
  alwaysVisible?: boolean;
  // This tracker's bubble always renders, but its numeric value is always
  // hidden from players specifically (GM still sees it) -- independent of
  // the token's Ally/Enemy classification. Used for a "something's there"
  // indicator, like Overshield, that shouldn't reveal an exact amount.
  hideValueFromPlayers?: boolean;
  // Anchors a bubble-type tracker (value/counter/checkbox) to a specific
  // corner of the token instead of the default sequential stacking order.
  corner?: Corner;
  // Renders a bubble-type tracker (value/counter/checkbox/counter-with-temp)
  // as a rectangle instead of the default circle -- "square" is diameter x
  // diameter; "wide"/"wide-reversed" are a rectangle split into an icon
  // half and a value half (see BUBBLE_ICONS/createTrackerBubble) -- "wide"
  // puts the icon on the left and the value on the right, "wide-reversed"
  // mirrors that (icon right, value left), for a tracker anchored to the
  // opposite corner. Currently only set by the Lancer preset's Structure
  // and Stress trackers, not a general per-tracker option exposed in the
  // editor.
  bubbleShape?: "square" | "wide" | "wide-reversed";
  // Font for this tracker's on-map value text (bar value/max, or bubble
  // count) -- falls back to the default font when unset. Currently only
  // set by the Lancer preset.
  numberFont?: "monospace";
} & (
  | {
      variant: "value";
      value: number;
    }
  | {
      variant: "value-max";
      value: number;
      max: number;
      // Renders the bar as an angled parallelogram instead of the default
      // rounded rectangle -- currently only set by the Lancer preset, not
      // a general per-tracker option exposed in the editor.
      barStyle?: "parallelogram";
    }
  | {
      variant: "checkbox";
      checked: boolean;
    }
  | {
      variant: "counter";
      value: number;
    }
  | {
      // A counter whose displayed/bubble value is the SUM of two
      // independently-editable numbers (e.g. Resistance + Temp
      // Resistance) -- neither number is directly editable via the
      // bubble itself, only through the two separate inputs in the
      // tracker menu.
      variant: "counter-with-temp";
      value: number;
      tempValue: number;
      // Label for the second (temp) input in the tracker menu -- falls
      // back to "Temp {name}" if unset. Lets a preset use a shorter
      // label (e.g. "Temp Res") when space is tight.
      tempLabel?: string;
    }
);

export type TrackerVariant =
  | "value"
  | "value-max"
  | "checkbox"
  | "counter"
  | "counter-with-temp";

export function isTracker(
  potentialTracker: unknown,
): potentialTracker is Tracker {
  const tracker = potentialTracker as Tracker;

  if (tracker.id === undefined) return false;
  if (typeof tracker.id !== "string") return false;

  if (tracker.color === undefined) return false;
  if (typeof tracker.color !== "number" && typeof tracker.color !== "string")
    return false;

  if (tracker.name !== undefined && typeof tracker.name !== "string")
    return false;

  if (tracker.showOnMap !== undefined && typeof tracker.showOnMap !== "boolean")
    return false;

  if (
    tracker.inlineMath !== undefined &&
    typeof tracker.inlineMath !== "boolean"
  )
    return false;

  if (
    tracker.hideWhenZero !== undefined &&
    typeof tracker.hideWhenZero !== "boolean"
  )
    return false;

  if (
    tracker.alwaysVisible !== undefined &&
    typeof tracker.alwaysVisible !== "boolean"
  )
    return false;

  if (
    tracker.hideValueFromPlayers !== undefined &&
    typeof tracker.hideValueFromPlayers !== "boolean"
  )
    return false;

  if (
    tracker.corner !== undefined &&
    !CORNERS.includes(tracker.corner as Corner)
  )
    return false;

  if (
    tracker.bubbleShape !== undefined &&
    tracker.bubbleShape !== "square" &&
    tracker.bubbleShape !== "wide" &&
    tracker.bubbleShape !== "wide-reversed"
  )
    return false;

  if (tracker.numberFont !== undefined && tracker.numberFont !== "monospace")
    return false;

  if (tracker.variant === "value") {
    if (tracker.value === undefined) return false;
    if (typeof tracker.value !== "number") return false;
  } else if (tracker.variant === "counter") {
    if (tracker.value === undefined) return false;
    if (typeof tracker.value !== "number") return false;
  } else if (tracker.variant === "counter-with-temp") {
    if (tracker.value === undefined) return false;
    if (typeof tracker.value !== "number") return false;
    if (tracker.tempValue === undefined) return false;
    if (typeof tracker.tempValue !== "number") return false;
    if (
      tracker.tempLabel !== undefined &&
      typeof tracker.tempLabel !== "string"
    )
      return false;
  } else if (tracker.variant === "value-max") {
    if (tracker.value === undefined) return false;
    if (typeof tracker.value !== "number") return false;
    if (tracker.max === undefined) return false;
    if (typeof tracker.max !== "number") return false;
    if (tracker.barStyle !== undefined && tracker.barStyle !== "parallelogram")
      return false;
  } else if (tracker.variant === "checkbox") {
    if (tracker.checked === undefined) return false;
    if (typeof tracker.checked !== "boolean") return false;
  } else return false;

  return true;
}

/////////////////////////////////////////////////////////////////////
// Constants
/////////////////////////////////////////////////////////////////////

export const MAX_TRACKER_COUNT = 12;
export const TRACKER_METADATA_ID: string = "trackers";
export const HIDDEN_METADATA_ID: string = "hidden";
export const DEFEATED_METADATA_ID: string = "defeated";

/////////////////////////////////////////////////////////////////////
// Tracker creation
/////////////////////////////////////////////////////////////////////

export const createColor = (trackers: Tracker[], variant: TrackerVariant) => {
  const count = trackers.filter(
    (tracker) => tracker.variant === variant,
  ).length;

  if (variant === "value") return (5 + count * 2) % 9;
  if (variant === "counter") return (6 + count * 2) % 9;
  else if (variant === "value-max") return (2 + count * 4) % 9;
  return (2 + count * 2) % 9;
};

export const createId = () => {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

export const createBubble = (trackers: Tracker[]): Tracker => {
  return {
    id: createId(),
    variant: "value",
    color: createColor(trackers, "value"),
    value: 0,
  };
};

export const createCounter = (trackers: Tracker[]): Tracker => {
  return {
    id: createId(),
    variant: "counter",
    color: createColor(trackers, "counter"),
    inlineMath: false,
    value: 0,
  };
};

export const createBar = (trackers: Tracker[]): Tracker => {
  return {
    id: createId(),
    variant: "value-max",
    color: createColor(trackers, "value-max"),
    value: 0,
    max: 0,
  };
};

export const createCheckboxTracker = (trackers: Tracker[]): Tracker => {
  return {
    id: createId(),
    variant: "checkbox",
    color: createColor(trackers, "checkbox"),
    checked: false,
  };
};
