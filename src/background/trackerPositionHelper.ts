import { BUBBLE_DIAMETER } from "./compoundItemHelpers";

export class BubblePosition {
  origin: { x: number; y: number };
  bounds: { width: number; height: number };
  barCount: number;
  barHeight: number;
  aboveToken: boolean;
  rowIndex = 0;
  columnIndex = 0;

  constructor(
    origin: { x: number; y: number },
    bounds: { width: number; height: number },
    barCount: number,
    barHeight: number,
    aboveToken: boolean = false,
  ) {
    this.origin = origin;
    this.bounds = bounds;
    this.barCount = barCount;
    this.barHeight = barHeight;
    this.aboveToken = aboveToken;
  }

  getNew(): { x: number; y: number } {
    if ((this.rowIndex + 1) * (BUBBLE_DIAMETER + 2) > this.bounds.width) {
      if (this.aboveToken) this.columnIndex--;
      else this.columnIndex++;
      this.rowIndex = 0;
    }

    const position = {
      x:
        this.origin.x +
        2 -
        this.bounds.width / 2 +
        this.rowIndex * (BUBBLE_DIAMETER + 2) +
        BUBBLE_DIAMETER / 2,
      y:
        this.origin.y -
        (this.aboveToken ? -2 - BUBBLE_DIAMETER / 2 : 2 + BUBBLE_DIAMETER / 2) -
        this.columnIndex * (BUBBLE_DIAMETER + 2) -
        (this.aboveToken ? 0 : this.barCount * this.barHeight) +
        this.bounds.height / 2,
    };

    this.rowIndex++;
    return position;
  }
}
