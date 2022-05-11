import { Rendering } from '../core/rendering';
import { Rect, Vector } from "../core/primitives";
import { Tiling } from '../core/tilemap';

export class Palette{

  context: Rendering.RenderContext;
  cellSize: Vector;
  cursor: Rect;
  marker: Rect;
  tilesheet?: any;

  constructor(context: Rendering.RenderContext, cellSize: number){
    this.context = context;
    this.cellSize = { x: cellSize, y: cellSize };
    this.cursor = new Rect({ x: 0, y: 0, w: this.cellSize.x, h: this.cellSize.y });
    this.marker = new Rect(this.cursor);
  }

  update(): void {
    if (!this.tilesheet){
      return;
    }
    
    this.render();
  }

  changeTilesheet(tilesheet: any): void {
    this.tilesheet = tilesheet;
    this.cursor.x = 0; this.cursor.y = 0;
    this.marker.x = 0; this.marker.y = 0;
  }

  cellIdxAtPosition(pos: Vector){
    let cell = {
      x: Math.floor(pos.x / this.cellSize.x),
      y: Math.floor(pos.y / this.cellSize.y)
    };
    const cellIdx = (cell.y * Math.floor(this.context.resolution.x / this.cellSize.x)) + cell.x;
    return cellIdx;
  }

  posOnSheet(pos: Vector): boolean {
    const cellIdx = this.cellIdxAtPosition(pos);
    return (cellIdx < this.tilesheet.nCells);
  }

  setCursorPosition(rawPos: Vector): void {
    this.cursor.x = rawPos.x - (rawPos.x % this.cellSize.x);
    this.cursor.y = rawPos.y - (rawPos.y % this.cellSize.y);
  }

  private render(): void {
    // Render black background
    this.context.fillRect(new Rect({ x: 0, y: 0, w: this.context.resolution.x, h: this.context.resolution.y }));

    const padding = 0;
    let clip = new Rect({ x: 0, y: 0, w: this.tilesheet.clipSize, h: this.tilesheet.clipSize });
    const view = new Rect({ x: padding, y: padding, w: this.cellSize.x, h: this.cellSize.y });

    let cx = 0;
    let cy = 0;
    let showOverlay = false;
    
    for (let i = 0; i < this.tilesheet.nCells; i++){
      this.context.renderBitmap(this.tilesheet.texture.bitmap, clip, view);
      if (showOverlay){
        this.context.setFillColor('black');
        this.context.fillRect(view, 0.5);
        showOverlay = false;
      }

      // Update clip rect
      cx += 1;
      if (cx >= this.tilesheet.cellsPerRow){
        cx = 0;
        cy += 1;
      }
      clip.x = cx * this.tilesheet.clipSize;
      clip.y = cy * this.tilesheet.clipSize;

      const tileType = (cy * this.tilesheet.cellsPerRow) + cx;
      if (this.tilesheet.tileAnimations){
        for (let anim of this.tilesheet.tileAnimations){
          const idx = anim.frames.findIndex((frame: number) => frame === tileType);
          if (idx >= 1){
            showOverlay = true;
          }
        }
      }

      // Update view rect
      view.x += this.cellSize.x + padding;
      if (view.x + this.cellSize.x > this.context.resolution.x){
        view.x = padding;
        view.y += this.cellSize.y + padding;
      }
    }

    // Render cursor and marker
    this.context.setStrokeWeight(4);
    this.context.setStrokeColor('yellow');
    this.context.strokeRect(this.cursor);
    this.context.setStrokeColor('red');
    this.context.strokeRect(this.marker);
  }
}