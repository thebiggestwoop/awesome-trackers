import OBR, { Image, Item, Metadata, isImage } from "@owlbear-rodeo/sdk";
import { getPluginId } from "../getPluginId";
import {
  FULL_BAR_HEIGHT,
  createTrackerBubble,
  createTrackerBar,
  createDefeatedLabel,
  getDefeatedLabelId,
  getBarItemIds,
  getBarTextId,
  getBarIconId,
  getBubbleItemIds,
  getBubbleTextId,
  getBubbleIconId,
  getImageBubbleItemIds,
  REDUCED_BAR_HEIGHT,
  BUBBLE_DIAMETER,
  BAR_ICONS,
  BUBBLE_ICONS,
  createNameTag,
  getNameTagId,
} from "./compoundItemHelpers";
import {
  getTrackersFromItem,
  getTrackersHiddenFromItem,
  getDefeatedFromItem,
} from "../trackerHelpersItem";
import {
  TRACKER_METADATA_ID,
  HIDDEN_METADATA_ID,
  DEFEATED_METADATA_ID,
  MAX_TRACKER_COUNT,
  Tracker,
  Corner,
} from "../trackerHelpersBasic";
import { BubblePosition } from "./trackerPositionHelper";
import {
  BAR_HEIGHT_METADATA_ID,
  SEGMENTS_ENABLED_METADATA_ID,
  HIDE_LABEL_METADATA_ID,
  TRACKERS_ABOVE_METADATA_ID,
  VERTICAL_OFFSET_METADATA_ID,
  HIDE_ENEMY_TRACKERS_METADATA_ID,
  readBooleanFromMetadata,
  readNumberFromMetadata,
} from "../sceneMetadataHelpers";
import { getImageCenter } from "./mathHelpers";
import { isSegmentSettings } from "../isSegmentSettings";

let itemsLast: Image[] = []; // for item change checks
const addItemsArray: Item[] = []; // for bulk addition or changing of items
const deleteItemsArray: string[] = []; // for bulk deletion of scene items
let sceneListenersSet = false;
let userRoleLast: "GM" | "PLAYER";

// Serializes handleItemsChange invocations. Without this, if a second
// onChange event arrives while a first invocation is still awaiting its
// local-scene writes, both would push into the same shared
// addItemsArray/deleteItemsArray, and whichever finishes first clears
// them out from under the other -- silently dropping the other's
// pending render (e.g. a name tag update never actually landing until a
// full reload redraws everything from scratch). Queuing the latest
// payload (rather than dropping it) ensures nothing is lost, just
// processed right after the current run finishes.
let itemsChangeResolving = false;
let pendingItemsFromCallback: Item[] | null = null;

let verticalOffset = 0;
let trackersAboveToken = false;
let barHeightIsReduced = false;
let segmentsEnabled = false;
let segmentSettings = new Map<string, number>();
let hideLabel = false;
let hideEnemyTrackers = false;

// How far down past the token's top edge the name tag dips -- tune this up
// or down to adjust how much it overlaps the token art.
const NAME_TAG_OVERLAP = 20;

let extraRefreshIsDone = false;
const extraRefreshDelay = 1000;

export async function initOnMapTrackers() {
  // Handle when the scene is either changed or made ready after extension load
  OBR.scene.onReadyChange(async (isReady) => {
    if (isReady) {
      await getGlobalSettings();
      await getSegmentSettings();
      await refreshAllTrackers();
      await startTrackerUpdates();
      setTimeout(() => {
        if (!extraRefreshIsDone) refreshAllTrackers();
        extraRefreshIsDone = true;
      }, extraRefreshDelay);
    }
  });

  // Check if the scene is already ready once the extension loads
  const isReady = await OBR.scene.isReady();
  if (isReady) {
    await getGlobalSettings();
    await getSegmentSettings();
    await refreshAllTrackers();
    await startTrackerUpdates();
    setTimeout(() => {
      if (!extraRefreshIsDone) refreshAllTrackers();
      extraRefreshIsDone = true;
    }, extraRefreshDelay);
  }
}

/** returns true if global settings have changed */
async function getGlobalSettings(sceneMetadata?: Metadata): Promise<boolean> {
  // load settings from scene metadata if not passed to function
  if (typeof sceneMetadata === "undefined") {
    sceneMetadata = await OBR.scene.getMetadata();
  }

  const [
    newVerticalOffset,
    newTrackersAboveToken,
    newBarHeightIsReduced,
    newSegmentsEnabled,
    newHideLabel,
    newHideEnemyTrackers,
  ] = [
    readNumberFromMetadata(sceneMetadata, VERTICAL_OFFSET_METADATA_ID),
    readBooleanFromMetadata(sceneMetadata, TRACKERS_ABOVE_METADATA_ID),
    readBooleanFromMetadata(sceneMetadata, BAR_HEIGHT_METADATA_ID),
    readBooleanFromMetadata(sceneMetadata, SEGMENTS_ENABLED_METADATA_ID),
    readBooleanFromMetadata(sceneMetadata, HIDE_LABEL_METADATA_ID),
    readBooleanFromMetadata(sceneMetadata, HIDE_ENEMY_TRACKERS_METADATA_ID),
  ];

  const doRefresh =
    newVerticalOffset !== verticalOffset ||
    newTrackersAboveToken !== trackersAboveToken ||
    newBarHeightIsReduced !== barHeightIsReduced ||
    newSegmentsEnabled !== segmentsEnabled ||
    newHideLabel !== hideLabel ||
    newHideEnemyTrackers !== hideEnemyTrackers;

  verticalOffset = newVerticalOffset;
  trackersAboveToken = newTrackersAboveToken;
  barHeightIsReduced = newBarHeightIsReduced;
  segmentsEnabled = newSegmentsEnabled;
  hideLabel = newHideLabel;
  hideEnemyTrackers = newHideEnemyTrackers;

  return doRefresh;
}

/** Returns true if segment settings have changed */
async function getSegmentSettings(sceneMetadata?: Metadata): Promise<boolean> {
  // load settings from scene metadata if not passed to function
  if (typeof sceneMetadata === "undefined") {
    sceneMetadata = await OBR.scene.getMetadata();
  }

  let doRefresh = false;

  const newSegmentSettings = sceneMetadata[getPluginId("segmentSettings")] as
    | [string, number][]
    | undefined;
  if (isSegmentSettings(newSegmentSettings)) {
    if (newSegmentSettings.length !== segmentSettings.size) doRefresh = true;
    for (const setting of newSegmentSettings) {
      if (
        !segmentSettings.has(setting[0]) ||
        segmentSettings.get(setting[0]) !== setting[1]
      )
        doRefresh = true;
    }
    segmentSettings = new Map(newSegmentSettings);
  }

  return doRefresh;
}

async function refreshAllTrackers() {
  //get shapes from scene
  const items: Image[] = await OBR.scene.items.getItems(
    (item) =>
      (item.layer === "CHARACTER" || item.layer === "MOUNT") && isImage(item),
  );

  //store array of all items currently on the board for change monitoring
  itemsLast = items;

  //draw health bars
  const roll = await OBR.player.getRole();
  const sceneDpi = await OBR.scene.grid.getDpi();
  for (const item of items) {
    updateItemTrackers(item, roll, sceneDpi);
  }

  await OBR.scene.local.deleteItems(deleteItemsArray); //bulk delete items
  await batchAddToScene(addItemsArray);
  // await OBR.scene.local.addItems(addItemsArray); //bulk add items
  //clear add and delete arrays arrays
  addItemsArray.length = 0;
  deleteItemsArray.length = 0;
}

async function startTrackerUpdates() {
  if (!sceneListenersSet) {
    // Don't run this again unless the listeners have been unsubscribed
    sceneListenersSet = true;

    // Initialize previous user role
    userRoleLast = await OBR.player.getRole();

    // Handle role changes
    const unSubscribeFromPlayer = OBR.player.onChange((player) => {
      // Do a refresh if player role change is detected
      if (player.role !== userRoleLast) {
        refreshAllTrackers();
        userRoleLast = player.role;
      }
    });

    // Handle Global settings changes
    const unsubscribeFromSceneMetadata = OBR.scene.onMetadataChange(
      async (metadata) => {
        const globalSettingsChanged = await getGlobalSettings(metadata);
        const segmentSettingsChanged = await getSegmentSettings(metadata);
        if (globalSettingsChanged || segmentSettingsChanged)
          refreshAllTrackers();
      },
    );

    // Handle item changes (Update health bars)
    const unsubscribeFromItems = OBR.scene.items.onChange(
      async (itemsFromCallback) => {
        if (itemsChangeResolving) {
          pendingItemsFromCallback = itemsFromCallback;
          return;
        }

        itemsChangeResolving = true;
        try {
          let current: Item[] | null = itemsFromCallback;
          while (current) {
            await handleItemsChange(current);
            current = pendingItemsFromCallback;
            pendingItemsFromCallback = null;
          }
        } finally {
          itemsChangeResolving = false;
        }
      },
    );

    // Unsubscribe listeners that rely on the scene if it stops being ready
    const unsubscribeFromSceneReady = OBR.scene.onReadyChange((isReady) => {
      if (!isReady) {
        unSubscribeFromPlayer();
        unsubscribeFromSceneMetadata();
        unsubscribeFromItems();
        unsubscribeFromSceneReady();
        sceneListenersSet = false;
      }
    });
  }
}

async function handleItemsChange(itemsFromCallback: Item[]) {
  // Filter items for only images from character and mount layers
  const imagesFromCallback: Image[] = [];
  for (const item of itemsFromCallback) {
    if (
      (item.layer === "CHARACTER" || item.layer === "MOUNT") &&
      isImage(item)
    ) {
      imagesFromCallback.push(item);
    }
  }

  const changedItems = getChangedItems(imagesFromCallback);

  //update array of all items currently on the board
  itemsLast = imagesFromCallback;

  //draw health bars
  const role = await OBR.player.getRole();
  const sceneDpi = await OBR.scene.grid.getDpi();

  for (const item of changedItems) {
    updateItemTrackers(item, role, sceneDpi);
  }

  await OBR.scene.local.deleteItems(deleteItemsArray); //bulk delete items
  await OBR.scene.local.addItems(addItemsArray); //bulk add items

  //clear add and delete arrays arrays
  addItemsArray.length = 0;
  deleteItemsArray.length = 0;
}

function getChangedItems(items: Image[]): Image[] {
  const changedItems: Image[] = [];

  let s = 0; // # items skipped in itemsLast array, caused by deleted items

  for (let i = 0; i < items.length; i++) {
    //check for new items at the end of the list
    if (i > itemsLast.length - 1 - s) {
      changedItems.push(items[i]);
    } else if (itemsLast[i + s].id !== items[i].id) {
      s++; // Skip an index in itemsLast
      i--; // Reuse the index item in imagesFromCallback
      //check for scaling changes
    } else if (
      !(
        itemsLast[i + s].scale.x === items[i].scale.x &&
        itemsLast[i + s].scale.y === items[i].scale.y
      )
    ) {
      // Bar text attachments must be deleted to prevent ghost selection highlight bug
      deleteItemsArray.push(
        ...Array(MAX_TRACKER_COUNT)
          .fill(undefined)
          .map((_, barIndex) => getBarTextId(items[i].id, barIndex)),
      );
      changedItems.push(items[i]);
    } else if (
      //check position, visibility, and metadata changes
      !(
        itemsLast[i + s].grid.offset.x === items[i].grid.offset.x &&
        itemsLast[i + s].grid.offset.y === items[i].grid.offset.y &&
        itemsLast[i + s].grid.dpi === items[i].grid.dpi &&
        itemsLast[i + s].visible === items[i].visible &&
        itemsLast[i + s].zIndex === items[i].zIndex &&
        JSON.stringify(
          itemsLast[i + s].metadata[getPluginId(TRACKER_METADATA_ID)],
        ) ===
          JSON.stringify(items[i].metadata[getPluginId(TRACKER_METADATA_ID)]) &&
        JSON.stringify(
          itemsLast[i + s].metadata[getPluginId(HIDDEN_METADATA_ID)],
        ) ===
          JSON.stringify(items[i].metadata[getPluginId(HIDDEN_METADATA_ID)]) &&
        JSON.stringify(
          itemsLast[i + s].metadata[getPluginId(DEFEATED_METADATA_ID)],
        ) ===
          JSON.stringify(
            items[i].metadata[getPluginId(DEFEATED_METADATA_ID)],
          ) &&
        itemsLast[i + s].name === items[i].name &&
        itemsLast[i + s].text.plainText === items[i].text.plainText
      )
    ) {
      //update items
      changedItems.push(items[i]);
    }
  }

  return changedItems;
}

/** Decides, for a given viewer, whether a bubble-type tracker renders at
 * all and whether its number shows -- in priority order:
 *  0. The GM's scene-wide "hide all enemy stats" setting: fully hidden
 *     for a player viewing a hidden (Enemy) token, overriding every
 *     other flag below (including alwaysVisible/hideValueFromPlayers).
 *  1. hideWhenZero: hidden for everyone once its value is 0.
 *  2. alwaysVisible: always renders in full, ignoring the token's
 *     Ally/Enemy hidden classification entirely.
 *  3. hideValueFromPlayers: renders, but the number is hidden from
 *     players specifically -- and only while the token is classified as
 *     an Enemy (GM always sees it; on an Ally, players see it too, since
 *     the whole point is concealing enemy stats, not the party's own).
 *  4. Otherwise, the default rule: fully hidden from a player viewing a
 *     token whose trackers are hidden.
 */
function getBubbleVisibility(
  tracker: Tracker,
  role: "PLAYER" | "GM",
  trackersHidden: boolean,
  hideEnemyTrackers: boolean,
): { render: boolean; showText: boolean } {
  if (role === "PLAYER" && trackersHidden && hideEnemyTrackers) {
    return { render: false, showText: false };
  }
  if ("value" in tracker && tracker.hideWhenZero) {
    const total =
      tracker.variant === "counter-with-temp"
        ? tracker.value + tracker.tempValue
        : tracker.value;
    if (total === 0) return { render: false, showText: false };
  }
  if (tracker.alwaysVisible) {
    return { render: true, showText: true };
  }
  if (tracker.hideValueFromPlayers) {
    return { render: true, showText: role === "GM" || !trackersHidden };
  }
  if (role === "PLAYER" && trackersHidden) {
    return { render: false, showText: false };
  }
  return { render: true, showText: true };
}

const CORNER_MARGIN = 2;

/** Positions a bubble anchored to a specific corner of the token, instead
 * of the default sequential stacking order. Additional bubbles sharing the
 * same corner stack inward along that corner's edge -- horizontally by
 * default, or vertically (stacking away from the corner's own top/bottom
 * edge) for the Lancer preset's "wide" bubbles, since those are wider than
 * they are tall and would overlap/overflow if stacked side by side. */
function getCornerBubblePosition(
  rawCenter: { x: number; y: number },
  bounds: { width: number; height: number },
  corner: Corner,
  indexInCorner: number,
  stackVertically = false,
): { x: number; y: number } {
  const inset = BUBBLE_DIAMETER / 2 + CORNER_MARGIN;
  const stackStep = BUBBLE_DIAMETER + CORNER_MARGIN;

  const isLeft = corner === "TOP_LEFT" || corner === "BOTTOM_LEFT";
  const isTop = corner === "TOP_LEFT" || corner === "TOP_RIGHT";

  const baseX = isLeft
    ? rawCenter.x - bounds.width / 2 + inset
    : rawCenter.x + bounds.width / 2 - inset;
  const baseY = isTop
    ? rawCenter.y - bounds.height / 2 + inset
    : rawCenter.y + bounds.height / 2 - inset;

  const x = stackVertically
    ? baseX
    : baseX + (isLeft ? 1 : -1) * stackStep * indexInCorner;
  const y = stackVertically
    ? baseY + (isTop ? 1 : -1) * stackStep * indexInCorner
    : baseY;

  return { x, y };
}

function updateItemTrackers(
  item: Image,
  role: "PLAYER" | "GM",
  sceneDpi: number,
) {
  // Extract metadata from the token
  const trackers = getTrackersFromItem(item);
  const trackersHidden = getTrackersHiddenFromItem(item);
  const defeated = getDefeatedFromItem(item);

  if (
    !defeated &&
    ((role === "GM" && trackers.length === 0 && !trackersHidden) ||
      (role === "PLAYER" && trackers.length === 0))
  ) {
    // Display nothing, delete any existing tracker attachments
    addAllItemAttachmentsToDeleteList(item.id);
  } else {
    // Display trackers. Bar-type trackers are always drawn at full
    // resolution for every viewer -- the only thing withheld from a
    // player when trackersHidden is set is the numeric label on top of
    // the bar. Non-bar trackers (plain value/counter/checkbox bubbles)
    // have no meaningful "shown without the number" state, so those stay
    // fully hidden from players when the token is hidden, same as before.
    createAllTrackers();
  }

  function createAllTrackers() {
    const playerViewingHiddenToken = role === "PLAYER" && trackersHidden;

    // Determine token bounds
    const bounds = getImageBounds(item, sceneDpi);
    bounds.width = Math.abs(bounds.width);
    bounds.height = Math.abs(bounds.height);

    // Determine coordinate origin for drawing stats
    const rawCenter = getImageCenter(item, sceneDpi);
    const origin = { ...rawCenter };
    if (trackersAboveToken) origin.y -= bounds.height;

    const barHeight = barHeightIsReduced ? REDUCED_BAR_HEIGHT : FULL_BAR_HEIGHT;

    // Add bar trackers. Stacking order runs opposite to array order --
    // the LAST bar-type tracker in the list renders closest to the
    // token's edge, and earlier ones stack progressively above it -- so
    // a tracker list can read "HP, Heat" (matching how it's displayed
    // in menus) while HP's bar still ends up rendered above Heat's.
    //
    // hideWhenZero on a bar checks max rather than value -- a bar at
    // 0/10 should still show empty, but a bar with no max at all (e.g.
    // a unit with no Heat mechanic) is hidden entirely for everyone.
    // When the GM's scene-wide "hide all enemy stats" setting is on,
    // bars are hidden entirely (not just their text) for a player
    // viewing a hidden (Enemy) token, same as bubbles below.
    const barTrackers = trackers
      .filter(
        (tracker) =>
          tracker.variant === "value-max" &&
          !(tracker.hideWhenZero && tracker.max === 0) &&
          !(playerViewingHiddenToken && hideEnemyTrackers),
      )
      .reverse();

    if (defeated) {
      // Hide every bar (values stay intact in metadata, just not
      // rendered) and show a single "DEFEATED" label spanning the same
      // area the bar stack would have occupied.
      for (let i = 0; i < MAX_TRACKER_COUNT; i++) {
        deleteItemsArray.push(...getBarItemIds(item.id, i));
      }
      const stackHeight = Math.max(barTrackers.length, 1) * barHeight;
      const stackBottomY = origin.y + bounds.height / 2 - verticalOffset;
      addItemsArray.push(
        ...createDefeatedLabel(
          item,
          bounds,
          origin,
          stackBottomY - stackHeight,
          stackHeight,
        ),
      );
    } else {
      deleteItemsArray.push(getDefeatedLabelId(item.id));

      barTrackers.forEach((tracker, index) => {
        if (tracker.showOnMap === false) {
          deleteItemsArray.push(...getBarItemIds(item.id, index));
        } else {
          // Segments only ever coarsen the hidden-from-player view -- the
          // GM (and a player viewing an unhidden token) always sees the
          // exact continuous fill. A tracker only gets segmented if the
          // GM has both enabled segments scene-wide and configured a
          // count for a tracker with this specific name.
          const segments =
            playerViewingHiddenToken &&
            segmentsEnabled &&
            tracker.name !== undefined
              ? (segmentSettings.get(tracker.name) ?? 0)
              : 0;

          addItemsArray.push(
            ...createTrackerBar(
              item,
              bounds,
              tracker,
              {
                x: origin.x,
                y:
                  origin.y -
                  index * barHeight +
                  bounds.height / 2 -
                  verticalOffset,
              },
              index,
              barHeightIsReduced,
              !playerViewingHiddenToken,
              segments,
              sceneDpi,
            ),
          );
          if (playerViewingHiddenToken) {
            deleteItemsArray.push(getBarTextId(item.id, index));
          }
          if (tracker.name === undefined || !(tracker.name in BAR_ICONS)) {
            deleteItemsArray.push(getBarIconId(item.id, index));
          }
        }
      });

      // Clean up extra bars
      for (let i = barTrackers.length; i < MAX_TRACKER_COUNT; i++) {
        deleteItemsArray.push(...getBarItemIds(item.id, i));
      }
    }

    const bubblePosition = new BubblePosition(
      origin,
      bounds,
      barTrackers.length,
      barHeight,
      trackersAboveToken,
    );

    // Clean up any leftover hide-indicator bubble from before this feature
    // was removed -- no longer created, but stale ones need clearing once.
    deleteItemsArray.push(...getImageBubbleItemIds(item.id, "hide"));

    if (defeated) {
      // Hide every bubble too -- a defeated token shows nothing but the
      // DEFEATED label.
      for (let i = 0; i < MAX_TRACKER_COUNT; i++) {
        deleteItemsArray.push(...getBubbleItemIds(item.id, i));
      }
    } else {
      // Add bubble trackers. Each tracker's own flags decide its
      // visibility for this viewer -- see getBubbleVisibility for the
      // priority order.
      const bubbleTrackerCandidates = trackers.filter(
        (tracker) =>
          tracker.variant === "value" ||
          tracker.variant === "counter" ||
          tracker.variant === "checkbox" ||
          tracker.variant === "counter-with-temp",
      );

      const bubbleTrackers = bubbleTrackerCandidates.filter(
        (tracker) =>
          getBubbleVisibility(tracker, role, trackersHidden, hideEnemyTrackers)
            .render,
      );

      const cornerCounters: Record<Corner, number> = {
        TOP_LEFT: 0,
        TOP_RIGHT: 0,
        BOTTOM_LEFT: 0,
        BOTTOM_RIGHT: 0,
      };

      // When bars stack below the token (the default), they're drawn
      // from the token's bottom edge upward, into the same space
      // bottom-corner bubbles are inset from -- so those bubbles need to
      // stop at the top of the bar stack instead of the token's raw
      // bounding box. (When trackersAboveToken is on, bars stack
      // entirely outside the token's bounds instead, so no corner ever
      // needs this adjustment.)
      const barStackTopY =
        origin.y +
        bounds.height / 2 -
        verticalOffset -
        barTrackers.length * barHeight;

      bubbleTrackers.forEach((tracker, index) => {
        if (tracker.showOnMap === false) {
          deleteItemsArray.push(...getBubbleItemIds(item.id, index));
        } else {
          const { showText } = getBubbleVisibility(
            tracker,
            role,
            trackersHidden,
            hideEnemyTrackers,
          );

          // Corner-anchored bubbles are pinned to the token's own
          // bounding box, independent of the vertical-offset nudge that
          // only makes sense for content stacking away from the token.
          const isWideBubble =
            tracker.bubbleShape === "wide" ||
            tracker.bubbleShape === "wide-reversed";
          // cornerCounters stays keyed by the tracker's real corner (so
          // stacking bookkeeping isn't affected), but when bars move above
          // the token, bottom-corner bubbles need to flip to the token's
          // top edge too -- that's where the bar stack now sits, and the
          // whole point of anchoring a bubble to "BOTTOM_LEFT" is to stay
          // adjacent to wherever the bar stack actually is.
          const indexInCorner = tracker.corner
            ? cornerCounters[tracker.corner]++
            : 0;
          const flipToTop =
            trackersAboveToken &&
            (tracker.corner === "BOTTOM_LEFT" ||
              tracker.corner === "BOTTOM_RIGHT");
          const effectiveCorner: Corner | undefined = flipToTop
            ? tracker.corner === "BOTTOM_LEFT"
              ? "TOP_LEFT"
              : "TOP_RIGHT"
            : tracker.corner;
          const position = effectiveCorner
            ? getCornerBubblePosition(
                rawCenter,
                bounds,
                effectiveCorner,
                indexInCorner,
                isWideBubble,
              )
            : bubblePosition.getNew();

          if (
            !trackersAboveToken &&
            barTrackers.length > 0 &&
            (tracker.corner === "BOTTOM_LEFT" ||
              tracker.corner === "BOTTOM_RIGHT")
          ) {
            // A vertically-stacked ("wide") bubble further from the
            // corner's edge needs its own ceiling pushed up by the same
            // amount its stacking already pushed it -- otherwise clamping
            // would collapse every stacked bubble at this corner onto the
            // exact same position once the bar stack is tall enough.
            const stackOffset = isWideBubble
              ? indexInCorner * (BUBBLE_DIAMETER + CORNER_MARGIN)
              : 0;
            position.y = Math.min(
              position.y,
              barStackTopY - BUBBLE_DIAMETER / 2 - stackOffset,
            );
          }

          const y = tracker.corner ? position.y : position.y - verticalOffset;

          addItemsArray.push(
            ...createTrackerBubble(
              item,
              tracker,
              { x: position.x, y },
              index,
              showText,
              sceneDpi,
            ),
          );
          if (!showText) {
            deleteItemsArray.push(getBubbleTextId(item.id, index));
          }
          if (tracker.name === undefined || !(tracker.name in BUBBLE_ICONS)) {
            deleteItemsArray.push(getBubbleIconId(item.id, index));
          }
        }
      });

      for (let i = bubbleTrackers.length; i < MAX_TRACKER_COUNT; i++) {
        deleteItemsArray.push(...getBubbleItemIds(item.id, i));
      }
    }

    // Add name tag -- prefers Owlbear's own native text label
    // (item.text.plainText, set via Owlbear's default token-labeling UI)
    // and falls back to item.name (the same field the tracker menu's
    // battle-name field writes to) otherwise, matching Pretty Sordid's
    // own name resolution so the two extensions agree on what a token is
    // called. Always anchored over the token's own top edge (dipping
    // down into the token by half the tag's height, nameplate-style),
    // independent of trackersAboveToken/bar count, so it reads as part
    // of the token rather than stacking with the bars. (If
    // trackersAboveToken is also on, bars stack on the same side and may
    // overlap the name tag -- a known tradeoff for keeping this simple.)
    // Always shown to everyone regardless of hidden state -- a token's
    // identity isn't secret just because its exact numbers are.
    const displayName = item.text.plainText || item.name;
    if (!hideLabel && displayName !== "") {
      const nameTagPosition = {
        x: rawCenter.x,
        y: rawCenter.y - bounds.height / 2 + NAME_TAG_OVERLAP - verticalOffset,
      };
      // A token using the Lancer preset has at least one tracker set to
      // the monospace font -- match the name tag's font/background to
      // the Lancer theme too.
      const isLancerTheme = trackers.some(
        (tracker) => tracker.numberFont === "monospace",
      );
      addItemsArray.push(
        ...createNameTag(
          item,
          sceneDpi,
          displayName,
          nameTagPosition,
          "DOWN",
          isLancerTheme,
        ),
      );
    } else {
      deleteItemsArray.push(getNameTagId(item.id));
    }
  }
}

const getImageBounds = (item: Image, dpi: number) => {
  const dpiScale = dpi / item.grid.dpi;
  const width = item.image.width * dpiScale * item.scale.x;
  const height = item.image.height * dpiScale * item.scale.y;
  return { width, height };
};

function addAllItemAttachmentsToDeleteList(itemId: string) {
  for (let i = 0; i < MAX_TRACKER_COUNT; i++) {
    deleteItemsArray.push(...getBarItemIds(itemId, i));
  }
  addAllBubbleTrackersToDeleteList(itemId);
  addHideBubbleToDeleteList(itemId);
  deleteItemsArray.push(getNameTagId(itemId));
  deleteItemsArray.push(getDefeatedLabelId(itemId));
}

function addAllBubbleTrackersToDeleteList(itemId: string) {
  for (let i = 0; i < MAX_TRACKER_COUNT; i++) {
    deleteItemsArray.push(...getBubbleItemIds(itemId, i));
  }
}

function addHideBubbleToDeleteList(itemId: string) {
  deleteItemsArray.push(...getImageBubbleItemIds(itemId, "hide"));
}

// Prevent errors when many items are added at onces
const MAX_UPDATE_LENGTH = 100;
async function batchAddToScene(items: Item[]) {
  for (let i = 0; i < Math.ceil(items.length / MAX_UPDATE_LENGTH); i++) {
    await OBR.scene.local.addItems(
      items.slice(i * MAX_UPDATE_LENGTH, (i + 1) * MAX_UPDATE_LENGTH),
    );
  }
}
