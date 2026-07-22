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
import { createRoundedRectangle, getFillPortion } from "./mathHelpers";

// Constants used in multiple functions
const FONT = "Roboto, sans-serif";
const DISABLE_HIT = true;
const BUBBLE_OPACITY = 0.7;
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
  BAR_TEXT: 0.3,
  BUBBLE_BACKGROUND: 0.1,
  BUBBLE_TEXT: 0.2,
  DEFEATED_LABEL: 0.3,
  NAME_TAG: 0.4,
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
): Item[] {
  if (
    tracker.variant !== "value" &&
    tracker.variant !== "counter" &&
    tracker.variant !== "checkbox" &&
    tracker.variant !== "counter-with-temp"
  )
    throw new Error("Expected value or counter tracker variant");

  const bubbleShape = buildShape()
    .width(BUBBLE_DIAMETER)
    .height(BUBBLE_DIAMETER)
    .shapeType("CIRCLE")
    .fillColor(getColor(tracker.color))
    .fillOpacity(BUBBLE_OPACITY)
    .strokeColor(getColor(tracker.color))
    .strokeOpacity(0.5)
    .strokeWidth(0)
    .position({ x: position.x, y: position.y })
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

    const bubbleText = buildText()
      .position({
        x: position.x - BUBBLE_DIAMETER / 2,
        y: position.y - BUBBLE_DIAMETER / 2 + TEXT_VERTICAL_OFFSET,
      })
      .plainText(valueText.length > 3 ? String.fromCharCode(0x2026) : valueText)
      .textAlign("CENTER")
      .textAlignVertical("MIDDLE")
      .fontSize(
        valueText.length === 3 ? REDUCED_CIRCLE_FONT_SIZE : CIRCLE_FONT_SIZE,
      )
      .fontFamily(FONT)
      .textType("PLAIN")
      .height(CIRCLE_TEXT_HEIGHT)
      .width(BUBBLE_DIAMETER)
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
    .points(createRoundedRectangle(barWidth, barHeight, BAR_CORNER_RADIUS))
    .build();

  const fillPortion = getFillPortion(tracker.value, tracker.max, segments);

  const fillShape = buildCurve()
    .fillColor(getColor(tracker.color))
    .fillOpacity(FILL_OPACITY)
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
    .points(
      createRoundedRectangle(
        barWidth,
        barHeight,
        BAR_CORNER_RADIUS,
        fillPortion,
      ),
    )
    .build();

  const parts: Item[] = [backgroundShape, fillShape];

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

    const barText = buildText()
      .position({
        x: position.x,
        y:
          position.y +
          TEXT_VERTICAL_OFFSET +
          -5.3 -
          (reducedHeight ? -0.8 : 0),
      })
      .plainText(`${tracker.value}/${tracker.max}`)
      .textAlign("CENTER")
      .textAlignVertical("MIDDLE")
      .fontSize(barFontSize)
      .fontFamily(FONT)
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
 * no extra plumbing is needed to connect the two. */
export function createNameTag(
  item: Item,
  sceneDpi: number,
  plainText: string,
  position: { x: number; y: number },
  pointerDirection: "UP" | "DOWN",
): Item[] {
  const nameTagLabel = buildLabel()
    .maxViewScale(1)
    .minViewScale(1)
    .position(position)
    .plainText(plainText)
    .fontSize(NAME_TAG_FONT_SIZE)
    .fontFamily(FONT)
    .fontWeight(400)
    .pointerHeight(0)
    .pointerDirection(pointerDirection)
    .attachedTo(item.id)
    .fillOpacity(0.87)
    .layer(item.layer)
    .zIndex(item.zIndex + ZINDEX_TIER.NAME_TAG)
    .disableAutoZIndex(true)
    .cornerRadius(sceneDpi / 12)
    .padding(sceneDpi / 50)
    .backgroundOpacity(BACKGROUND_OPACITY)
    .locked(true)
    .id(getNameTagId(item.id))
    .visible(item.visible)
    .disableAttachmentBehavior(DISABLE_ATTACHMENT_BEHAVIORS)
    .disableHit(DISABLE_HIT)
    .build();

  return [nameTagLabel];
}

export const getNameTagId = (itemId: string) => `${itemId}-name-tag`;

export const getBubbleBackgroundId = (itemId: string, position: number) =>
  `${itemId}-${position}-bubble-bg`;
export const getBubbleTextId = (itemId: string, position: number) =>
  `${itemId}-${position}-bubble-text`;

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

export function getBubbleItemIds(itemId: string, position: number) {
  return [
    getBubbleBackgroundId(itemId, position),
    getBubbleTextId(itemId, position),
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
  ];
}
