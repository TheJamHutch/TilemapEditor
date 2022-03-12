import { Vector, Rect } from './primitives';

// Returns the position and size of the clipping rectangle of a spritesheet at a particular index.
export function setClip(index: number, cellSize: number, sheetDims: Vector): Rect {
  let x = 0;
  let y = 0;
  let c = 0;

  while (c < index){
    x += 1;
    if (x >= sheetDims.x){
      x = 0;
      y++;

      if (y >= sheetDims.y){
        x = 0;
        y = 0;
      }
    }

    c++;
  }

  return new Rect({
    x: x * cellSize,
    y: y * cellSize, 
    w: cellSize, 
    h: cellSize
  });
}

export function posToIndex(pos: Vector, dims: Vector): number {
  // @TODO: Check dimensions and return -1 if pos is OOB
  return (pos.y * dims.x) + pos.x;
}
