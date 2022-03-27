import { Vector, Rect } from "./primitives";
import { drawBitmap, Bitmap, drawRect, RenderMode } from "./render";
import { Assets } from "./assets";

export class Palette{
  context: CanvasRenderingContext2D;
  resolution: Vector;
  viewSize: number;
  cursor: Rect;
  marker: Rect;
  tilesheet?: any;
  selectedTileType: number;

  constructor(context: CanvasRenderingContext2D, config: any){
    this.context = context;
    this.resolution = config.resolution
    this.viewSize = config.tileSize;
    this.selectedTileType = 0;

    this.cursor = new Rect({ x: 0, y: 0, w: this.viewSize, h: this.viewSize });
    this.marker = new Rect(this.cursor);
  }

  loadTilesheet(tilesheetId: string){
    this.tilesheet = Assets.store.tilesheets[tilesheetId];
    this.marker.x = 0;
    this.marker.y = 0;
    this.selectedTileType = 0;
  }

  update(): void {
    if (!this.tilesheet){
      return;
    }
    
    this.render();
  }

  onMouseMove(mousePos: Vector){
    this.setCursorPosition(mousePos);
  }

  onMouseDown(mousePos: Vector): void {
    this.setCursorPosition(mousePos);

    this.marker.x = this.cursor.x;
    this.marker.y = this.cursor.y;

    let cell = {
      x: Math.floor(this.cursor.x / this.viewSize),
      y: Math.floor(this.cursor.y / this.viewSize)
    };
    const cellIdx = (cell.y * Math.floor(this.resolution.x / this.viewSize)) + cell.x;
    this.selectedTileType = cellIdx;
  }

  private render(): void {
    
    const background = new Rect({ x: 0, y: 0, w: this.resolution.x, h: this.resolution.y});
    drawRect(this.context, background, RenderMode.Fill);

    const padding = 0;
    const clip = new Rect({ x: 0, y: 0, w: this.tilesheet.clipSize, h: this.tilesheet.clipSize });
    const view = new Rect({ x: padding, y: padding, w: this.viewSize, h: this.viewSize });

    const nCells = this.tilesheet.dimensions.x * this.tilesheet.dimensions.y;

    let cx = 0;
    let cy = 0;
    
    for (let i = 0; i < nCells; i++){
      const texture = Assets.store.textures[this.tilesheet.textureId];
      drawBitmap(this.context, texture.bitmap, clip, view);

      // Update clip rect
      cx += 1;
      if (cx >= this.tilesheet.dimensions.x){
        cx = 0;
        cy += 1;
      }
      clip.x = cx * this.tilesheet.clipSize;
      clip.y = cy * this.tilesheet.clipSize;

      // Update view rect
      view.x += this.viewSize + padding;
      if (view.x + this.viewSize > this.resolution.x){
        view.x = padding;
        view.y += this.viewSize + padding;
      }
    }

    // Draw cursor and marker
    this.context.strokeStyle = 'yellow';
    this.context.lineWidth = 4;
    drawRect(this.context, this.cursor);

    this.context.strokeStyle = 'red';
    this.context.lineWidth = 4;
    drawRect(this.context, this.marker);
  }

  private setCursorPosition(mousePos: Vector): void {
    this.cursor.x = mousePos.x - (mousePos.x % this.viewSize);
    this.cursor.y = mousePos.y - (mousePos.y % this.viewSize);
  }

}
