import { AfterViewInit, Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Rendering } from '../core/rendering';
import { Rect, Vector } from "../core/primitives";
import { config } from '../core/config';
import { EventBusService, EventType } from '../event-bus.service';
import { AssetsService } from '../assets.service';
import { Palette } from '../core/palette';

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

  palette: Palette;

  constructor(private assets: AssetsService, private eventBus: EventBusService) {}

  ngOnInit(): void {
    this.eventBus.register(EventType.NewFrame, (context: any) => {
      this.palette.update();
    });
    this.eventBus.register(EventType.TilesheetChange, (context: any) => {
      const tilesheet = this.assets.store.tilesheets[context.tilesheetId] as any;
      this.palette.changeTilesheet(tilesheet);
      this.eventBus.raise(EventType.PaletteSelect, { cellIdx: 0 });
    });
  }

  ngAfterViewInit(): void {
    // Init palette canvas resolution
    this.paletteCanvas.nativeElement.width = config.palette.resolution.x;
    this.paletteCanvas.nativeElement.height = config.palette.resolution.y;

    // Init palette canvas context
    const rawPaletteContext = this.paletteCanvas.nativeElement.getContext('2d');
    rawPaletteContext.imageSmoothingEnabled = false;
    const paletteContext = new Rendering.RenderContext(rawPaletteContext, config.palette.resolution);

    this.palette = new Palette(paletteContext, config.palette);

    // Init palette canvas events
    this.paletteCanvas.nativeElement.addEventListener('mousemove', (e: PointerEvent) => {
      this.onMouseMove({ x: e.offsetX, y: e.offsetY });
    });
    this.paletteCanvas.nativeElement.addEventListener('mousedown', (e: PointerEvent) => {
      this.onMouseDown({ x: e.offsetX, y: e.offsetY });
    });

    // Select first item in palette on startup.
    this.eventBus.raise(EventType.PaletteSelect, { cellIdx: 0 });
  }

  onMouseMove(mousePos: Vector): void {
    if (!this.palette.tilesheet){
      return;
    }
    if (!this.palette.posOnSheet(mousePos)){
      return;
    }

    this.palette.setCursorPosition(mousePos);
  }

  onMouseDown(mousePos: Vector): void {
    if (!this.palette.posOnSheet(mousePos)){
      return;
    }

    this.palette.setCursorPosition(mousePos);

    this.palette.marker.x = this.palette.cursor.x;
    this.palette.marker.y = this.palette.cursor.y;

    const cellIdx = this.palette.cellIdxAtPosition(this.palette.cursor);
    this.eventBus.raise(EventType.PaletteSelect, { cellIdx });
  }
}
