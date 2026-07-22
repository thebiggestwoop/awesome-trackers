import OBR, { Item, Metadata, isImage } from "@owlbear-rodeo/sdk";
import { getPluginId } from "./getPluginId";
import { createId } from "./trackerHelpersBasic";
import { getDefeatedFromItem } from "./trackerHelpersItem";

/////////////////////////////////////////////////////////////////////
// Initiative tracking, adapted from Pretty Sordid Initiative's
// "zipper" mode (ready/spent flag + undo stack), stripped of numeric
// initiative rolls, drag-to-reorder, and any Draw Steel-specific
// cross-extension messaging. A token's Party/Adversary group is chosen
// explicitly when it joins initiative ("Join as Ally"/"Join as Enemy")
// and is entirely independent of the token's Ally/Enemy tracker-hiding
// classification -- a GM can put a token on the Party side of
// initiative without it being classified as an Ally for HP-hiding
// purposes, or vice versa.
//
// A token can hold more than one activation slot (for Elites/bosses
// that act more than once a round); each slot has its own stable id so
// slots can be added/removed independently without reshuffling the
// undo stack.
/////////////////////////////////////////////////////////////////////

const INITIATIVE_METADATA_ID = "initiative";
const ROUND_METADATA_ID = "initiativeRound";
const PREVIOUS_STACK_METADATA_ID = "initiativePreviousStack";

export const MAX_ACTIVATIONS = 3;

type Group = "PARTY" | "ADVERSARY";
type Slot = { id: string; ready: boolean; active: boolean };
type InitiativeMetadata = { group: Group; slots: Slot[] };

export type InitiativeEntry = {
  itemId: string;
  name: string;
  url: string;
  visible: boolean;
  group: Group;
  slots: Slot[];
  defeated: boolean;
};

function isSlot(value: unknown): value is Slot {
  if (typeof value !== "object" || value === null) return false;
  const slot = value as Slot;
  return (
    typeof slot.id === "string" &&
    typeof slot.ready === "boolean" &&
    typeof slot.active === "boolean"
  );
}

function isInitiativeMetadata(value: unknown): value is InitiativeMetadata {
  if (typeof value !== "object" || value === null) return false;
  const metadata = value as InitiativeMetadata;
  return (
    (metadata.group === "PARTY" || metadata.group === "ADVERSARY") &&
    Array.isArray(metadata.slots) &&
    metadata.slots.every(isSlot)
  );
}

function createSlot(): Slot {
  return { id: createId(), ready: true, active: false };
}

export function getInitiativeEntryFromItem(
  item: Item,
): InitiativeEntry | undefined {
  if (!isImage(item)) return undefined;

  const metadata = item.metadata[getPluginId(INITIATIVE_METADATA_ID)];
  if (!isInitiativeMetadata(metadata)) return undefined;

  return {
    itemId: item.id,
    name: item.text.plainText || item.name,
    url: item.image.url,
    visible: item.visible,
    group: metadata.group,
    slots: metadata.slots,
    defeated: getDefeatedFromItem(item),
  };
}

/** Looks up the currently selected token's initiative entry, if any --
 * used by the tracker menu to show "Join"/"Leave" and the activation
 * count stepper. */
export async function getInitiativeEntryFromSelection(
  items: Item[],
): Promise<InitiativeEntry | undefined> {
  const selection = await OBR.player.getSelection();
  const selectedItem = items.find((item) => item.id === selection?.[0]);
  if (selectedItem === undefined) return undefined;

  return getInitiativeEntryFromItem(selectedItem);
}

/** Add the selected token to initiative on the given side with a single
 * activation slot -- a no-op if it's already in. Independent of the
 * token's Ally/Enemy tracker-hiding classification. */
export async function joinInitiative(group: Group) {
  const selection = await OBR.player.getSelection();
  const selectedItems = await OBR.scene.items.getItems(selection);

  if (selection === undefined || selection.length !== 1) {
    throw `Error: Player has selected ${selection?.length} items selected, expected 1.`;
  }

  await OBR.scene.items.updateItems(selectedItems, (items) => {
    for (const item of items) {
      const existing = item.metadata[getPluginId(INITIATIVE_METADATA_ID)];
      if (!isInitiativeMetadata(existing)) {
        item.metadata[getPluginId(INITIATIVE_METADATA_ID)] = {
          group,
          slots: [createSlot()],
        } satisfies InitiativeMetadata;
      }
    }
  });
}

/** Remove the selected token from initiative entirely (all slots) and
 * clean up any trace of it left in the undo stack. */
export async function leaveInitiative() {
  const selection = await OBR.player.getSelection();

  if (selection === undefined || selection.length !== 1) {
    throw `Error: Player has selected ${selection?.length} items selected, expected 1.`;
  }

  await removeEntryFromInitiative(selection[0]);
}

/** Remove a token from initiative entirely (all its activation slots) --
 * used both by "Leave Initiative" and the tracker list's own remove
 * button, which acts on a row regardless of the current map selection. */
export async function removeEntryFromInitiative(itemId: string) {
  let removedSlotIds: string[] = [];

  await OBR.scene.items.updateItems([itemId], (items) => {
    for (const item of items) {
      const metadata = item.metadata[getPluginId(INITIATIVE_METADATA_ID)];
      if (isInitiativeMetadata(metadata)) {
        removedSlotIds = metadata.slots.map((slot) => slot.id);
      }
      delete item.metadata[getPluginId(INITIATIVE_METADATA_ID)];
    }
  });

  await removeFromPreviousStack(removedSlotIds);
}

/** Give a token in initiative one more activation slot (up to
 * MAX_ACTIVATIONS) -- for Elites, bosses, or anything else that acts
 * more than once a round. */
export async function addActivation(itemId: string) {
  await OBR.scene.items.updateItems([itemId], (items) => {
    for (const item of items) {
      const metadata = item.metadata[getPluginId(INITIATIVE_METADATA_ID)];
      if (isInitiativeMetadata(metadata) && metadata.slots.length < MAX_ACTIVATIONS) {
        metadata.slots.push(createSlot());
      }
    }
  });
}

/** Remove a token's most recently added activation slot. Refuses to drop
 * below one slot -- use Leave Initiative to remove the token entirely. */
export async function removeActivation(itemId: string) {
  let removedSlotId: string | undefined;

  await OBR.scene.items.updateItems([itemId], (items) => {
    for (const item of items) {
      const metadata = item.metadata[getPluginId(INITIATIVE_METADATA_ID)];
      if (isInitiativeMetadata(metadata) && metadata.slots.length > 1) {
        const removed = metadata.slots.pop();
        removedSlotId = removed?.id;
      }
    }
  });

  if (removedSlotId !== undefined) await removeFromPreviousStack([removedSlotId]);
}

/////////////////////////////////////////////////////////////////////
// Ready/active toggle -- clicking a ready slot's flag activates it
// (marking it spent for the round); clicking a spent or active slot's
// flag re-readies it, restoring whichever slot was active before it if
// it was the one currently acting. A small scene-level undo stack
// tracks activation order (by slot id) so restoration works more than
// one step back.
/////////////////////////////////////////////////////////////////////

export async function setSlotReady(
  slotId: string,
  newReady: boolean,
  previousStack: string[],
) {
  const isNewActive = !newReady;

  const previousId =
    previousStack.length > 1
      ? previousStack[previousStack.length - 2]
      : undefined;
  const currentActiveId =
    previousStack.length > 0
      ? previousStack[previousStack.length - 1]
      : undefined;
  const isCurrentActive = currentActiveId === slotId;

  await OBR.scene.items.updateItems(
    (item) =>
      isInitiativeMetadata(item.metadata[getPluginId(INITIATIVE_METADATA_ID)]),
    (items) => {
      for (const item of items) {
        const metadata = item.metadata[
          getPluginId(INITIATIVE_METADATA_ID)
        ] as InitiativeMetadata;

        for (const slot of metadata.slots) {
          if (isNewActive) {
            if (slot.id === slotId) {
              slot.ready = false;
              slot.active = true;
            } else {
              slot.active = false;
            }
          } else {
            if (slot.id === previousId && isCurrentActive) {
              slot.active = true;
            } else if (slot.id === slotId) {
              slot.ready = true;
              slot.active = false;
            }
          }
        }
      }
    },
  );

  const newPreviousStack = isNewActive
    ? [...previousStack, slotId]
    : isCurrentActive
      ? previousStack.slice(0, -1)
      : previousStack.filter((id) => id !== slotId);
  await writePreviousStackToScene(newPreviousStack);
}

async function removeFromPreviousStack(slotIds: string[]) {
  if (slotIds.length === 0) return;
  const sceneMetadata = await OBR.scene.getMetadata();
  const previousStack = getPreviousStackFromSceneMetadata(sceneMetadata);
  const filtered = previousStack.filter((id) => !slotIds.includes(id));
  if (filtered.length !== previousStack.length) {
    await writePreviousStackToScene(filtered);
  }
}

/** Marks every activation slot currently in initiative as ready again,
 * clears who's active, resets the undo stack, and advances the round
 * counter. */
export async function startNewRound(roundCount: number) {
  await OBR.scene.items.updateItems(
    (item) =>
      isInitiativeMetadata(item.metadata[getPluginId(INITIATIVE_METADATA_ID)]),
    (items) => {
      for (const item of items) {
        const metadata = item.metadata[
          getPluginId(INITIATIVE_METADATA_ID)
        ] as InitiativeMetadata;
        for (const slot of metadata.slots) {
          slot.ready = true;
          slot.active = false;
        }
      }
    },
  );
  await writePreviousStackToScene([]);
  await OBR.scene.setMetadata({
    [getPluginId(ROUND_METADATA_ID)]: roundCount + 1,
  });
}

/////////////////////////////////////////////////////////////////////
// Scene metadata -- round counter and undo stack
/////////////////////////////////////////////////////////////////////

export function getRoundFromSceneMetadata(sceneMetadata: Metadata): number {
  const value = sceneMetadata[getPluginId(ROUND_METADATA_ID)];
  if (typeof value !== "number" || Number.isNaN(value)) return 1;
  return value;
}

/** Directly set the round counter to a specific value -- lets the GM
 * correct or jump the count without affecting anyone's ready/active
 * state. */
export async function setRound(round: number) {
  await OBR.scene.setMetadata({ [getPluginId(ROUND_METADATA_ID)]: round });
}

export function getPreviousStackFromSceneMetadata(
  sceneMetadata: Metadata,
): string[] {
  const value = sceneMetadata[getPluginId(PREVIOUS_STACK_METADATA_ID)];
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

export async function writePreviousStackToScene(previousStack: string[]) {
  await OBR.scene.setMetadata({
    [getPluginId(PREVIOUS_STACK_METADATA_ID)]: previousStack,
  });
}
