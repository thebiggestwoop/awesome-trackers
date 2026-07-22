import OBR, { Math2, Vector2 } from "@owlbear-rodeo/sdk";

/** Pans the viewport to center on the given token, keeping the current
 * zoom level. */
export async function focusOnItem(itemId: string) {
  window.getSelection()?.removeAllRanges();

  const bounds = await OBR.scene.items.getItemBounds([itemId]);
  const boundsAbsoluteCenter = await OBR.viewport.transformPoint(bounds.center);

  const viewportWidth = await OBR.viewport.getWidth();
  const viewportHeight = await OBR.viewport.getHeight();
  const viewportCenter: Vector2 = {
    x: viewportWidth / 2,
    y: viewportHeight / 2,
  };

  const absoluteCenter = Math2.subtract(boundsAbsoluteCenter, viewportCenter);
  const relativeCenter = await OBR.viewport.inverseTransformPoint(absoluteCenter);

  const viewportScale = await OBR.viewport.getScale();
  const viewportPosition = Math2.multiply(relativeCenter, -viewportScale);

  await OBR.viewport.animateTo({
    scale: viewportScale,
    position: viewportPosition,
  });
}
