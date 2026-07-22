import OBR, { Image, isImage } from "@owlbear-rodeo/sdk";

/** Auto-increments a copied token's trailing number so a duplicate
 * doesn't end up sharing the exact same displayed name as the token it
 * was copied from (e.g. copying "Scout 1" produces "Scout 2" instead of
 * a second "Scout 1"). Re-scans for collisions on every scene change.
 *
 * Which token in a colliding pair is "the original" is decided by which
 * id we saw first -- NOT by Owlbear's own lastModified timestamp, which
 * turns out to be an unreliable signal here: duplicating a token clones
 * lastModified from the source rather than stamping the copy with a
 * fresh time, and simply dragging a token around afterward keeps
 * bumping it too. Our own discovery-order counter is assigned once per
 * id and never changes after that, regardless of later edits or drags. */

// Persists for the life of the background script; each id gets a
// number the first time we ever see it, seeded from the scene's
// existing tokens at startup so pre-existing ones always sort before
// anything created afterward.
const firstSeenOrder = new Map<string, number>();
let nextOrder = 0;

function recordFirstSeen(images: Image[]) {
  for (const image of images) {
    if (!firstSeenOrder.has(image.id)) {
      firstSeenOrder.set(image.id, nextOrder++);
    }
  }
}

// Serializes resolveCollisions calls so our own rename writes (which
// themselves trigger new onChange events) don't re-enter it while an
// earlier call is still mid-loop -- that could cause overlapping calls
// to double up on the same numbering decision. Runs queued arrivals
// (rather than dropping them) so a change that arrives mid-run is never
// silently missed, just processed right after the current run finishes.
let resolving = false;
let pendingImages: Image[] | null = null;

export async function initAutoIncrementNames() {
  OBR.scene.items.onChange(async (allItems) => {
    const images = allItems.filter(isImage);
    recordFirstSeen(images);
    await runResolveCollisions(images);
  });

  // The onChange listener above only reacts to *future* changes. If a
  // duplicate happens to land before this listener has finished
  // attaching (most likely right after the extension loads), that
  // event is simply never delivered to us and nothing else would ever
  // re-check it. Scanning the scene's current state directly here, and
  // again whenever a scene becomes ready, closes that gap.
  const scanCurrentScene = async () => {
    if (!(await OBR.scene.isReady())) return;
    const items = await OBR.scene.items.getItems(isImage);
    recordFirstSeen(items);
    await runResolveCollisions(items);
  };

  await scanCurrentScene();
  OBR.scene.onReadyChange(scanCurrentScene);
}

async function runResolveCollisions(images: Image[]) {
  if (resolving) {
    pendingImages = images;
    return;
  }

  resolving = true;
  try {
    let current: Image[] | null = images;
    while (current) {
      await resolveCollisions(current);
      current = pendingImages;
      pendingImages = null;
    }
  } finally {
    resolving = false;
  }
}

/** The name Awesome Trackers displays for this token -- Owlbear's own
 * native text label takes priority, falling back to the item's name,
 * matching the same resolution used for name tags and the initiative
 * tracker. */
function getDisplayName(item: Image): string {
  return item.text.plainText || item.name;
}

const TRAILING_NUMBER = /^(.*?)(\d+)$/;

const LOG_PREFIX = "[AwesomeTrackers/autoIncrementName]";

async function resolveCollisions(images: Image[]) {
  const summary = images
    .map(
      (i) =>
        `  id=${i.id} name="${i.name}" text="${i.text.plainText}" firstSeen=${firstSeenOrder.get(i.id)}`,
    )
    .join("\n");
  console.log(`${LOG_PREFIX} checking ${images.length} images:\n${summary}`);

  const groups = new Map<string, Image[]>();
  for (const image of images) {
    const name = getDisplayName(image);
    if (!TRAILING_NUMBER.test(name)) continue;
    const group = groups.get(name);
    if (group) group.push(image);
    else groups.set(name, [image]);
  }

  for (const [name, group] of groups) {
    if (group.length < 2) continue;

    console.log(
      `${LOG_PREFIX} collision on "${name}": ${group.map((i) => i.id).join(", ")}`,
    );

    const match = name.match(TRAILING_NUMBER);
    if (!match) continue;
    const base = match[1];
    const numberStr = match[2];

    // Whichever id we discovered first is treated as the original;
    // anything else sharing its exact name is a newer duplicate and
    // gets renamed.
    group.sort(
      (a, b) =>
        (firstSeenOrder.get(a.id) ?? 0) - (firstSeenOrder.get(b.id) ?? 0),
    );
    const duplicates = group.slice(1);

    const pattern = new RegExp(`^${escapeRegExp(base)}(\\d+)$`);
    let maxNumber = 0;
    for (const image of images) {
      const otherMatch = getDisplayName(image).match(pattern);
      if (otherMatch) {
        maxNumber = Math.max(maxNumber, parseInt(otherMatch[1], 10));
      }
    }

    for (const duplicate of duplicates) {
      maxNumber++;
      const newName = `${base}${maxNumber.toString().padStart(numberStr.length, "0")}`;
      console.log(
        `${LOG_PREFIX} renaming ${duplicate.id} (currently "${getDisplayName(duplicate)}") -> "${newName}"`,
      );
      await renameImage(duplicate, newName);
    }
  }
}

async function renameImage(image: Image, newName: string) {
  try {
    await OBR.scene.items.updateItems([image.id], (items) => {
      console.log(
        `${LOG_PREFIX} updateItems callback got ${items.length} item(s) for id ${image.id}`,
      );
      for (const item of items) {
        if (isImage(item)) {
          console.log(
            `${LOG_PREFIX} before write: name="${item.name}" text="${item.text.plainText}"`,
          );
          if (item.text.plainText !== "") {
            item.text.plainText = newName;
          } else {
            item.name = newName;
          }
        } else {
          console.warn(`${LOG_PREFIX} item ${image.id} was not an Image`);
        }
      }
    });
    console.log(`${LOG_PREFIX} renameImage succeeded for ${image.id}`);
  } catch (error) {
    console.error(`${LOG_PREFIX} renameImage FAILED for ${image.id}: ${String(error)}`);
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
