import { Camera } from "./camera";
import { Tilemap, initTilemap, renderTilemap, Tile } from "./tilemap";
import { Vector, Rect } from "./primitives";
import { drawBitmap, Bitmap, drawRect, RenderMode } from "./render";
import { Events } from "./events"; 

export class Palette{
  context: CanvasRenderingContext2D;
  sheetDimensions: Vector;
  resolution: Vector;
  texture: Bitmap;
  clipSize: number;
  viewSize: number;
  events: Events;

  cursor: Rect;
  marker: Rect;

  constructor(events: Events, context: CanvasRenderingContext2D, config: any, sheetImg: Bitmap){
    this.events = events;
    this.context = context;
    this.texture = sheetImg;
    this.resolution = config.resolution;
    this.clipSize = config.clipSize;
    this.viewSize = config.viewSize;
    this.sheetDimensions = config.sheetDimensions;

    this.cursor = new Rect({ x: 0, y: 0, w: this.viewSize, h: this.viewSize });
    this.marker = new Rect(this.cursor);
  }

  update(): void{
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
      x: Math.floor(this.cursor.x / this.clipSize),
      y: Math.floor(this.cursor.y / this.clipSize)
    };
    const cellIdx = (cell.y * Math.floor(this.resolution.x / this.viewSize)) + cell.x;
    this.events.raise('paletteSelect', cellIdx);
  }

  private setCursorPosition(mousePos: Vector): void {
    this.cursor.x = mousePos.x - (mousePos.x % this.viewSize);
    this.cursor.y = mousePos.y - (mousePos.y % this.viewSize);
  }

  private render(): void {
    this.context.fillStyle = 'black';
    const background = new Rect({ x: 0, y: 0, w: this.resolution.x, h: this.resolution.y});
    drawRect(this.context, background, RenderMode.Fill);

    const padding = 0;
    const clip = new Rect({ x: 0, y: 0, w: this.clipSize, h: this.clipSize });
    const view = new Rect({ x: padding, y: padding, w: this.viewSize, h: this.viewSize });

    const nCells = this.sheetDimensions.x * this.sheetDimensions.y;
    for (let i = 0; i < nCells; i++){
      drawBitmap(this.context, this.texture, clip, view);

      // Update clip rect
      clip.x += this.clipSize;
      if (clip.x >= this.texture.resolution.x){
        clip.x = 0;
        clip.y += this.clipSize;
      }

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
}
