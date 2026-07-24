import {
  AttachmentBehavior,
  Image,
  Item,
  buildCurve,
  buildImage,
  buildLabel,
  buildShape,
  buildText,
} from "@owlbear-rodeo/sdk";
import { getColor } from "../colorHelpers";
import { Tracker } from "../trackerHelpersBasic";
import {
  createParallelogram,
  createRoundedRectangle,
  getFillPortion,
} from "./mathHelpers";

// Constants used in multiple functions
const FONT = "Roboto, sans-serif";
const MONOSPACE_FONT = "monospace";
// The monospace font's vertical metrics sit slightly higher than the
// default font's -- nudge value text down this many pixels to compensate.
const MONOSPACE_TEXT_Y_ADJUST = 1;
const DISABLE_HIT = true;
const BUBBLE_OPACITY = 0.7;
// Fill opacity for the "wide" bubble layout's backdrop.
const WIDE_BUBBLE_OPACITY = 0.3;
// Width:height ratio for the "wide" bubble layout (height stays
// BUBBLE_DIAMETER).
const WIDE_BUBBLE_ASPECT_RATIO = 3 / 2;
const DISABLE_ATTACHMENT_BEHAVIORS: AttachmentBehavior[] = [
  "ROTATION",
  "VISIBLE",
  "COPY",
  "SCALE",
];
const TEXT_VERTICAL_OFFSET = -1.2;

// Attachment items (bars, bubbles, name tags) render on the SAME layer
// as their parent token, with a small zIndex offset above it, instead
// of Owlbear's dedicated "ATTACHMENT"/"TEXT" layers -- those stack
// globally above ALL tokens regardless of the individual tokens' own
// relative order, so a token positioned behind another one still had
// its trackers render on top of the token in front of it. Using the
// parent's own layer and zIndex makes a token's trackers stack
// correctly with everything else instead.
const ZINDEX_TIER = {
  BAR_BACKGROUND: 0.1,
  BAR_FILL: 0.2,
  BAR_ICON: 0.25,
  BAR_TEXT: 0.3,
  BUBBLE_BACKGROUND: 0.1,
  BUBBLE_ICON: 0.15,
  BUBBLE_TEXT: 0.2,
  DEFEATED_LABEL: 0.3,
  NAME_TAG: 0.4,
};

// Lancer preset icon theme (experimental): a bar tracker whose name matches
// a key here gets a small decorative icon at its left end, sized relative
// to the bar's own height (with the icon's own aspect ratio preserved, so
// non-square icons like Heat's flame aren't stretched). Icon URLs are
// root-relative, served from public/graphics/ (copied verbatim into the
// build output, same as the extension's own logo) -- naturalWidth/Height
// are the icon's own rasterized PNG dimensions, needed to size it
// correctly on the token regardless of the scene's grid DPI.
export const BAR_ICONS: Record<
  string,
  {
    url: string;
    naturalWidth: number;
    naturalHeight: number;
    // Size relative to the bar's own height, and horizontal nudge (in
    // pixels) from the bar's left-cap center -- per-icon, since each
    // icon's own art needs its own eyeballed fit.
    sizeRatio: number;
    xShift: number;
  }
> = {
  HP: {
    url: new URL("/graphics/health.png", import.meta.url).toString(),
    naturalWidth: 192,
    naturalHeight: 192,
    sizeRatio: 1.1,
    xShift: 3,
  },
  Heat: {
    url: new URL("/graphics/heat.png", import.meta.url).toString(),
    naturalWidth: 104,
    naturalHeight: 168,
    sizeRatio: 1.0,
    xShift: 1,
  },
};

// Same idea as BAR_ICONS, but for bubble-type trackers: a decorative icon
// centered in the bubble, sized relative to the bubble's own diameter.
export const BUBBLE_ICONS: Record<
  string,
  {
    url: string;
    naturalWidth: number;
    naturalHeight: number;
    sizeRatio: number;
    xShift: number;
  }
> = {
  Structure: {
    url: new URL("/graphics/structure.png", import.meta.url).toString(),
    naturalWidth: 184,
    naturalHeight: 184,
    sizeRatio: 0.9,
    xShift: 1,
  },
  Stress: {
    url: new URL("/graphics/reactor.png", import.meta.url).toString(),
    naturalWidth: 192,
    naturalHeight: 176,
    sizeRatio: 0.9,
    xShift: 0,
  },
  Burn: {
    url: new URL("/graphics/burn.png", import.meta.url).toString(),
    naturalWidth: 123,
    naturalHeight: 170,
    sizeRatio: 0.9,
    xShift: 0,
  },
  Overshield: {
    url: new URL("/graphics/overshield.png", import.meta.url).toString(),
    naturalWidth: 192,
    naturalHeight: 192,
    sizeRatio: 0.9,
    xShift: 0,
  },
};

// Constants used in createStatBubble()
export const BUBBLE_DIAMETER = 30;
const CIRCLE_FONT_SIZE = BUBBLE_DIAMETER - 8;
const REDUCED_CIRCLE_FONT_SIZE = BUBBLE_DIAMETER - 15;
const CIRCLE_TEXT_HEIGHT = BUBBLE_DIAMETER + 2;

/** Creates Stat Bubble component items */
export function createTrackerBubble(
  item: Item,
  tracker: Tracker,
  position: { x: number; y: number },
  index: number,
  showText = true,
  sceneDpi = 0,
): Item[] {
  if (
    tracker.variant !== "value" &&
    tracker.variant !== "counter" &&
    tracker.variant !== "checkbox" &&
    tracker.variant !== "counter-with-temp"
  )
    throw new Error("Expected value or counter tracker variant");

  const isReversed = tracker.bubbleShape === "wide-reversed";
  const isWide = tracker.bubbleShape === "wide" || isReversed;
  const isRectangle = isWide || tracker.bubbleShape === "square";
  const shapeWidth = isWide
    ? BUBBLE_DIAMETER * WIDE_BUBBLE_ASPECT_RATIO
    : BUBBLE_DIAMETER;
  // Distance from the shape's center to each half's own center, used to
  // place the icon (left half) and value text (right half) below.
  const halfWidthOffset = shapeWidth / 4;
  // Unlike CIRCLE (positioned by its center, like everything else here),
  // Owlbear's RECTANGLE shape is positioned by its top-left corner -- shift
  // just this shape's position to compensate, so it's still centered on
  // `position` the same way a circle would be.
  const bubbleShapePosition = isRectangle
    ? { x: position.x - shapeWidth / 2, y: position.y - BUBBLE_DIAMETER / 2 }
    : { x: position.x, y: position.y };

  const bubbleColor = isWide ? "black" : getColor(tracker.color);

  const bubbleShape = buildShape()
    .width(shapeWidth)
    .height(BUBBLE_DIAMETER)
    .shapeType(isRectangle ? "RECTANGLE" : "CIRCLE")
    .fillColor(bubbleColor)
    .fillOpacity(isWide ? WIDE_BUBBLE_OPACITY : BUBBLE_OPACITY)
    .strokeColor(bubbleColor)
    .strokeOpacity(0.5)
    .strokeWidth(0)
    .position(bubbleShapePosition)
    .attachedTo(item.id)
    .layer(item.layer)
    .zIndex(item.zIndex + ZINDEX_TIER.BUBBLE_BACKGROUND)
    .disableAutoZIndex(true)
    .locked(true)
    .id(getBubbleBackgroundId(item.id, index))
    .visible(item.visible)
    .disableAttachmentBehavior(DISABLE_ATTACHMENT_BEHAVIORS)
    .disableHit(DISABLE_HIT)
    .build();

  const parts: Item[] = [bubbleShape];

  // In the "wide" layout, the icon lives in the left half and the value
  // text (below) lives in the right half ("wide-reversed" mirrors that),
  // instead of stacking on top of each other in the center.
  const iconPosition = isWide
    ? {
        x: position.x + (isReversed ? halfWidthOffset : -halfWidthOffset),
        y: position.y,
      }
    : { x: position.x, y: position.y };

  const bubbleIcon = tracker.name !== undefined ? BUBBLE_ICONS[tracker.name] : undefined;
  if (bubbleIcon) {
    const iconHeight = BUBBLE_DIAMETER * bubbleIcon.sizeRatio;
    const iconDpi = (bubbleIcon.naturalHeight * sceneDpi) / iconHeight;

    const iconImage = buildImage(
      {
        width: bubbleIcon.naturalWidth,
        height: bubbleIcon.naturalHeight,
        mime: "image/png",
        url: bubbleIcon.url,
      },
      {
        offset: {
          x: bubbleIcon.naturalWidth / 2,
          y: bubbleIcon.naturalHeight / 2,
        },
        dpi: iconDpi,
      },
    )
      .position({
        x: iconPosition.x + bubbleIcon.xShift,
        y: iconPosition.y,
      })
      .attachedTo(item.id)
      .layer(item.layer)
      .zIndex(item.zIndex + ZINDEX_TIER.BUBBLE_ICON)
      .disableAutoZIndex(true)
      .locked(true)
      .id(getBubbleIconId(item.id, index))
      .visible(item.visible)
      .disableAttachmentBehavior(DISABLE_ATTACHMENT_BEHAVIORS)
      .disableHit(DISABLE_HIT)
      .build();
    parts.push(iconImage);
  }

  if (showText) {
    const valueText =
      tracker.variant === "checkbox"
        ? tracker.checked === true
          ? "✓"
          : "◯"
        : tracker.variant === "counter-with-temp"
          ? (tracker.value + tracker.tempValue).toString()
          : tracker.value.toString();

    if (tracker.variant === "checkbox") position.y += 3;

    const textWidth = isWide ? shapeWidth / 2 : BUBBLE_DIAMETER;
    const isMonospace = tracker.numberFont === "monospace";
    const textY =
      position.y -
      BUBBLE_DIAMETER / 2 +
      TEXT_VERTICAL_OFFSET +
      (isMonospace ? MONOSPACE_TEXT_Y_ADJUST : 0);
    const textPosition = isWide
      ? { x: position.x - (isReversed ? textWidth : 0), y: textY }
      : { x: position.x - BUBBLE_DIAMETER / 2, y: textY };

    const numberFont = isMonospace ? MONOSPACE_FONT : FONT;

    const bubbleText = buildText()
      .position(textPosition)
      .plainText(valueText.length > 3 ? String.fromCharCode(0x2026) : valueText)
      .textAlign("CENTER")
      .textAlignVertical("MIDDLE")
      .fontSize(
        valueText.length === 3 ? REDUCED_CIRCLE_FONT_SIZE : CIRCLE_FONT_SIZE,
      )
      .fontFamily(numberFont)
      .textType("PLAIN")
      .height(CIRCLE_TEXT_HEIGHT)
      .width(textWidth)
      .fontWeight(400)
      .attachedTo(item.id)
      .layer(item.layer)
      .zIndex(item.zIndex + ZINDEX_TIER.BUBBLE_TEXT)
      .disableAutoZIndex(true)
      .locked(true)
      .id(getBubbleTextId(item.id, index))
      .visible(item.visible)
      .disableAttachmentBehavior(DISABLE_ATTACHMENT_BEHAVIORS)
      .disableHit(DISABLE_HIT)
      .build();
    parts.push(bubbleText);
  }

  return parts;
}

export function createImageBubble(
  item: Image,
  sceneDpi: number,
  position: { x: number; y: number },
  color: string,
  url: string,
  imageLabel: string,
  backgroundLabel: string,
): Item[] {
  const bubbleShape = buildShape()
    .width(BUBBLE_DIAMETER)
    .height(BUBBLE_DIAMETER)
    .shapeType("CIRCLE")
    .fillColor(color)
    .fillOpacity(BUBBLE_OPACITY)
    .strokeColor(color)
    .strokeOpacity(0.5)
    .strokeWidth(0)
    .position({ x: position.x, y: position.y })
    .attachedTo(item.id)
    .layer("ATTACHMENT")
    .locked(true)
    .id(backgroundLabel)
    .visible(item.visible)
    .disableAttachmentBehavior(DISABLE_ATTACHMENT_BEHAVIORS)
    .disableHit(DISABLE_HIT)
    .build();

  const desiredLength = 24;
  const IMAGE_DPI = 150; // Specific to visibility off icon used in extension, square so height and width are equal
  const imageObject = {
    width: IMAGE_DPI,
    height: IMAGE_DPI,
    mime: "image/png",
    url: url,
  };
  const imageInSceneDpi = (sceneDpi * IMAGE_DPI) / desiredLength;

  const image = buildImage(imageObject, {
    offset: { x: sceneDpi / 2, y: sceneDpi / 2 },
    dpi: imageInSceneDpi,
  })
    .position(position)
    .attachedTo(item.id)
    .locked(true)
    .id(imageLabel)
    .layer("NOTE")
    .disableHit(DISABLE_HIT)
    .visible(item.visible)
    .disableAttachmentBehavior(DISABLE_ATTACHMENT_BEHAVIORS)
    .build();

  return [bubbleShape, image];
}

// Constants used in createBarTacker()
const BAR_PADDING = 2;
const FILL_OPACITY = 0.8;
export const FULL_BAR_HEIGHT = 20;
export const REDUCED_BAR_HEIGHT = 16;
const BACKGROUND_OPACITY = 0.7;
const BAR_CORNER_RADIUS = FULL_BAR_HEIGHT / 2;
// Fill opacity for the Lancer preset's parallelogram bars specifically --
// kept separate from FILL_OPACITY so it can be tuned without touching the
// default rounded-rectangle bars (Ascension, custom presets, etc).
const LANCER_FILL_OPACITY = 1;
// How far the parallelogram bar style's top edge leans left relative to
// the bottom edge, as a ratio of the bar's own height -- negative leans
// left. Scales with reduced/full bar height so the angle looks the same
// either way.
const PARALLELOGRAM_SKEW_RATIO = -0.8;

/** Creates bar component items */
export function createTrackerBar(
  item: Item,
  bounds: { width: number; height: number },
  tracker: Tracker,
  origin: { x: number; y: number },
  index: number,
  reducedHeight = false,
  showText = true,
  segments = 0,
  sceneDpi = 0,
): Item[] {
  const barHeight = reducedHeight ? REDUCED_BAR_HEIGHT : FULL_BAR_HEIGHT;
  const position = {
    x: origin.x - bounds.width / 2 + BAR_PADDING,
    y: origin.y - barHeight,
  };
  const barWidth = bounds.width - BAR_PADDING * 2;
  const setVisibilityProperty = item.visible;

  if (tracker.variant !== "value-max") throw "Error";

  const trackerBackgroundColor = "black"; // "#A4A4A4";

  const isParallelogram = tracker.barStyle === "parallelogram";
  const skew = barHeight * PARALLELOGRAM_SKEW_RATIO;
  const barShapePoints = (fill: number) =>
    isParallelogram
      ? createParallelogram(barWidth, barHeight, skew, fill)
      : createRoundedRectangle(barWidth, barHeight, BAR_CORNER_RADIUS, fill);

  const backgroundShape = buildCurve()
    .fillColor(trackerBackgroundColor)
    .fillOpacity(BACKGROUND_OPACITY)
    .strokeWidth(0)
    .position({ x: position.x, y: position.y })
    .attachedTo(item.id)
    .layer(item.layer)
    .zIndex(item.zIndex + ZINDEX_TIER.BAR_BACKGROUND)
    .disableAutoZIndex(true)
    .locked(true)
    .id(getBarBackgroundId(item.id, index))
    .visible(setVisibilityProperty)
    .disableAttachmentBehavior(DISABLE_ATTACHMENT_BEHAVIORS)
    .disableHit(DISABLE_HIT)
    .tension(0)
    .closed(true)
    .points(barShapePoints(1))
    .build();

  const fillPortion = getFillPortion(tracker.value, tracker.max, segments);

  const fillShape = buildCurve()
    .fillColor(getColor(tracker.color))
    .fillOpacity(isParallelogram ? LANCER_FILL_OPACITY : FILL_OPACITY)
    .strokeWidth(0)
    .strokeOpacity(0)
    .position({ x: position.x, y: position.y })
    .attachedTo(item.id)
    .layer(item.layer)
    .zIndex(item.zIndex + ZINDEX_TIER.BAR_FILL)
    .disableAutoZIndex(true)
    .locked(true)
    .id(getBarFillId(item.id, index))
    .visible(setVisibilityProperty)
    .disableAttachmentBehavior(DISABLE_ATTACHMENT_BEHAVIORS)
    .disableHit(DISABLE_HIT)
    .tension(0)
    .closed(true)
    .points(barShapePoints(fillPortion))
    .build();

  const parts: Item[] = [backgroundShape, fillShape];

  const barIcon = tracker.name !== undefined ? BAR_ICONS[tracker.name] : undefined;
  if (barIcon) {
    const iconHeight = barHeight * barIcon.sizeRatio;
    const iconDpi = (barIcon.naturalHeight * sceneDpi) / iconHeight;

    const iconImage = buildImage(
      {
        width: barIcon.naturalWidth,
        height: barIcon.naturalHeight,
        mime: "image/png",
        url: barIcon.url,
      },
      {
        offset: { x: barIcon.naturalWidth / 2, y: barIcon.naturalHeight / 2 },
        dpi: iconDpi,
      },
    )
      .position({
        x: position.x + barHeight / 2 + barIcon.xShift,
        y: position.y + barHeight / 2,
      })
      .attachedTo(item.id)
      .layer(item.layer)
      .zIndex(item.zIndex + ZINDEX_TIER.BAR_ICON)
      .disableAutoZIndex(true)
      .locked(true)
      .id(getBarIconId(item.id, index))
      .visible(setVisibilityProperty)
      .disableAttachmentBehavior(DISABLE_ATTACHMENT_BEHAVIORS)
      .disableHit(DISABLE_HIT)
      .build();
    parts.push(iconImage);
  }

  // The fill above is always drawn at full resolution for every viewer --
  // showText is the only thing that changes when a token's trackers are
  // hidden from a player, so GM and player see an identical bar, just with
  // or without the numeric label attached on top of it.
  if (showText) {
    const barTextHeight = reducedHeight
      ? REDUCED_BAR_HEIGHT + 8
      : FULL_BAR_HEIGHT + 8;
    const barFontSize = reducedHeight
      ? REDUCED_BAR_HEIGHT + 2
      : FULL_BAR_HEIGHT + 2;
    const isMonospace = tracker.numberFont === "monospace";
    const numberFont = isMonospace ? MONOSPACE_FONT : FONT;

    const barText = buildText()
      .position({
        x: position.x,
        y:
          position.y +
          TEXT_VERTICAL_OFFSET +
          -5.3 -
          (reducedHeight ? -0.8 : 0) +
          (isMonospace ? MONOSPACE_TEXT_Y_ADJUST : 0),
      })
      .plainText(`${tracker.value}/${tracker.max}`)
      .textAlign("CENTER")
      .textAlignVertical("MIDDLE")
      .fontSize(barFontSize)
      .fontFamily(numberFont)
      .textType("PLAIN")
      .height(barTextHeight)
      .width(barWidth)
      .fontWeight(400)
      .attachedTo(item.id)
      .fillOpacity(1)
      .layer(item.layer)
      .zIndex(item.zIndex + ZINDEX_TIER.BAR_TEXT)
      .disableAutoZIndex(true)
      .locked(true)
      .id(getBarTextId(item.id, index))
      .visible(setVisibilityProperty)
      .disableAttachmentBehavior(DISABLE_ATTACHMENT_BEHAVIORS)
      .disableHit(DISABLE_HIT)
      .build();
    parts.push(barText);
  }

  return parts;
}

/** Replaces the bar stack with a single "DEFEATED" label, spanning the
 * same rectangle the bars would have occupied so it reads as "this is
 * where the HP/Heat bars used to be" rather than a separate element. */
export function createDefeatedLabel(
  item: Item,
  bounds: { width: number; height: number },
  origin: { x: number; y: number },
  topY: number,
  height: number,
): Item[] {
  const width = bounds.width - BAR_PADDING * 2;

  const defeatedText = buildText()
    .position({ x: origin.x - bounds.width / 2 + BAR_PADDING, y: topY })
    .plainText("DEFEATED")
    .textAlign("CENTER")
    .textAlignVertical("MIDDLE")
    .fontSize(Math.min(height - 2, FULL_BAR_HEIGHT + 4))
    .fontFamily(FONT)
    .textType("PLAIN")
    .height(height)
    .width(width)
    .fontWeight(700)
    .fillColor("#ffffff")
    .fillOpacity(1)
    .attachedTo(item.id)
    .layer(item.layer)
    .zIndex(item.zIndex + ZINDEX_TIER.DEFEATED_LABEL)
    .disableAutoZIndex(true)
    .locked(true)
    .id(getDefeatedLabelId(item.id))
    .visible(item.visible)
    .disableAttachmentBehavior(DISABLE_ATTACHMENT_BEHAVIORS)
    .disableHit(DISABLE_HIT)
    .build();

  return [defeatedText];
}

export const getDefeatedLabelId = (itemId: string) => `${itemId}-defeated-label`;

// Constants used in createNameTag()
export const NAME_TAG_HEIGHT = 26;
const NAME_TAG_FONT_SIZE = 22;

/** Creates the on-map name tag label, ported from Draw Steel Tools 2's
 * equivalent -- reads whatever's in the token's own `name` property, which
 * is exactly what the battle-name field in the tracker menu writes to, so
 * no extra plumbing is needed to connect the two. Auto-sized by Owlbear's
 * own Label type rather than a fixed height, so the text is never clipped
 * regardless of font size. */
export function createNameTag(
  item: Item,
  sceneDpi: number,
  plainText: string,
  position: { x: number; y: number },
  pointerDirection: "UP" | "DOWN",
  isLancerTheme = false,
): Item[] {
  let labelBuilder = buildLabel()
    .maxViewScale(1)
    .minViewScale(1)
    .position(position)
    .plainText(plainText)
    .fontSize(NAME_TAG_FONT_SIZE)
    .fontFamily(isLancerTheme ? MONOSPACE_FONT : FONT)
    .fontWeight(400)
    .pointerHeight(0)
    .pointerDirection(pointerDirection)
    .attachedTo(item.id)
    .fillOpacity(0.87)
    .layer(item.layer)
    .zIndex(item.zIndex + ZINDEX_TIER.NAME_TAG)
    .disableAutoZIndex(true)
    .padding(sceneDpi / 50)
    .locked(true)
    .id(getNameTagId(item.id))
    .visible(item.visible)
    .disableAttachmentBehavior(DISABLE_ATTACHMENT_BEHAVIORS)
    .disableHit(DISABLE_HIT);

  labelBuilder = isLancerTheme
    ? labelBuilder
        .cornerRadius(0)
        .backgroundColor("black")
        .backgroundOpacity(WIDE_BUBBLE_OPACITY)
    : labelBuilder.cornerRadius(sceneDpi / 12).backgroundOpacity(BACKGROUND_OPACITY);

  return [labelBuilder.build()];
}

export const getNameTagId = (itemId: string) => `${itemId}-name-tag`;

export const getBubbleBackgroundId = (itemId: string, position: number) =>
  `${itemId}-${position}-bubble-bg`;
export const getBubbleTextId = (itemId: string, position: number) =>
  `${itemId}-${position}-bubble-text`;
export const getBubbleIconId = (itemId: string, position: number) =>
  `${itemId}-${position}-bubble-icon`;

export const getImageBackgroundId = (itemId: string, label: string) =>
  `${itemId}-${label}-img-bg`;
export const getImageId = (itemId: string, label: string) =>
  `${itemId}-${label}-img`;

export const getBarBackgroundId = (itemId: string, position: number) =>
  `${itemId}-${position}-bar-bg`;
export const getBarFillId = (itemId: string, position: number) =>
  `${itemId}-${position}-bar-fill`;
export const getBarTextId = (itemId: string, position: number) =>
  `${itemId}-${position}-bar-text`;
export const getBarIconId = (itemId: string, position: number) =>
  `${itemId}-${position}-bar-icon`;

export function getBubbleItemIds(itemId: string, position: number) {
  return [
    getBubbleBackgroundId(itemId, position),
    getBubbleTextId(itemId, position),
    getBubbleIconId(itemId, position),
  ];
}

export function getImageBubbleItemIds(itemId: string, label: string) {
  return [getImageBackgroundId(itemId, label), getImageId(itemId, label)];
}

export function getBarItemIds(itemId: string, position: number) {
  return [
    getBarBackgroundId(itemId, position),
    getBarFillId(itemId, position),
    getBarTextId(itemId, position),
    getBarIconId(itemId, position),
  ];
}
