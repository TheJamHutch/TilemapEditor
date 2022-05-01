import { AfterViewInit, Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Rendering } from '../core/rendering';
import { Rect, Vector } from "../core/primitives";
import { config } from '../core/config';
import { EventBusService, EventType } from '../event-bus.service';
import { AssetsService } from '../assets.service';

@Component({
  selector: 'app-palette-control',
  templateUrl: './palette-control.component.html',
  styleUrls: [
    './palette-control.component.scss',
    '../../common/app.common.scss'
  ]
})
export class PaletteControlComponent implements OnInit, AfterViewInit {

  @ViewChild('paletteCanvas') paletteCanvas: ElementRef<HTMLCanvasElement>;

  context: Rendering.RenderContext;
  cellSize: Vector;
  cursor: Rect;
  marker: Rect;
  tilesheet?: any;

  constructor(private assets: AssetsService, private eventBus: EventBusService) {}

  ngOnInit(): void {
    this.eventBus.register(EventType.NewFrame, (context: any) => {
      this.update();
    });
    this.eventBus.register(EventType.TilesheetChange, (context: any) => {
      this.tilesheet = this.assets.store.tilesheets[context.tilesheetId];
      const texture = this.assets.store.textures[this.tilesheet.id];
      this.tilesheet.texture = texture;

      this.cursor.x = 0; this.cursor.y = 0;
      this.marker.x = 0; this.marker.y = 0;
      this.eventBus.raise(EventType.PaletteSelect, { cellIdx: 0 });
    });
  }

  ngAfterViewInit(): void {
    // Init palette canvas resolution
    this.paletteCanvas.nativeElement.width = config.palette.resolution.x;
    this.paletteCanvas.nativeElement.height = config.palette.resolution.y;

    // Init palette canvas context
    const paletteContext = this.paletteCanvas.nativeElement.getContext('2d');
    paletteContext.imageSmoothingEnabled = false;
    this.context = new Rendering.RenderContext(paletteContext, config.palette.resolution);

    // Init palette canvas events
    this.paletteCanvas.nativeElement.addEventListener('mousemove', (e: any) => {
      this.onMouseMove({ x: e.offsetX, y: e.offsetY });
    });
    this.paletteCanvas.nativeElement.addEventListener('mousedown', (e: any) => {
      this.onMouseDown({ x: e.offsetX, y: e.offsetY });
    });

    this.cellSize = { x: config.palette.tileSize, y: config.palette.tileSize };
    this.cursor = new Rect({ x: 0, y: 0, w: this.cellSize.x, h: this.cellSize.y });
    this.marker = new Rect(this.cursor);

    // Select first item in palette on startup.
    this.eventBus.raise(EventType.PaletteSelect, { cellIdx: 0 });
  }

  onChangeTilesheet(tilesheet: any): void {
    this.tilesheet = tilesheet;
  }

  update(): void {
    if (!this.tilesheet){
      return;
    }
    
    this.render();
  }

  onMouseMove(mousePos: Vector): void {
    if (!this.tilesheet){
      return;
    }
    if (!this.posOnSheet(mousePos)){
      return;
    }

    this.setCursorPosition(mousePos);
  }

  onMouseDown(mousePos: Vector): void {
    if (!this.posOnSheet(mousePos)){
      return;
    }

    this.setCursorPosition(mousePos);

    this.marker.x = this.cursor.x;
    this.marker.y = this.cursor.y;

    const cellIdx = this.cellIdxAtPosition(this.cursor);
    this.eventBus.raise(EventType.PaletteSelect, { cellIdx });
  }

  private cellIdxAtPosition(pos: Vector){
    let cell = {
      x: Math.floor(pos.x / this.cellSize.x),
      y: Math.floor(pos.y / this.cellSize.y)
    };
    const cellIdx = (cell.y * Math.floor(this.context.resolution.x / this.cellSize.x)) + cell.x;
    return cellIdx;
  }

  private posOnSheet(pos: Vector): boolean {
    const cellIdx = this.cellIdxAtPosition(pos);
    return (cellIdx < this.tilesheet.nCells);
  }

  private setCursorPosition(rawPos: Vector): void {
    this.cursor.x = rawPos.x - (rawPos.x % this.cellSize.x);
    this.cursor.y = rawPos.y - (rawPos.y % this.cellSize.y);
  }

  private render(): void {
    // Render black background
    this.context.fillRect(new Rect({ x: 0, y: 0, w: this.context.resolution.x, h: this.context.resolution.y }));

    const padding = 0;
    const clip = new Rect({ x: 0, y: 0, w: this.tilesheet.clipSize, h: this.tilesheet.clipSize });
    const view = new Rect({ x: padding, y: padding, w: this.cellSize.x, h: this.cellSize.y });

    let cx = 0;
    let cy = 0;
    
    for (let i = 0; i < this.tilesheet.nCells; i++){
      this.context.renderBitmap(this.tilesheet.texture.bitmap, clip, view);

      // Update clip rect
      cx += 1;
      if (cx >= this.tilesheet.cellsPerRow){
        cx = 0;
        cy += 1;
      }
      clip.x = cx * this.tilesheet.clipSize;
      clip.y = cy * this.tilesheet.clipSize;

      // Update view rect
      view.x += this.cellSize.x + padding;
      if (view.x + this.cellSize.x > this.context.resolution.x){
        view.x = padding;
        view.y += this.cellSize.y + padding;
      }
    }

    this.context.setStrokeWeight(4);
    this.context.setStrokeColor('yellow');
    this.context.strokeRect(this.cursor);
    this.context.setStrokeColor('red');
    this.context.strokeRect(this.marker);
  }

}
