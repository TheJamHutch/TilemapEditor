import { AfterViewInit, Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Rendering } from '../core/rendering';
import { Rect, Vector } from "../core/primitives";
import { EventBusService, EventType } from '../event-bus.service';
import { AssetsService } from '../assets.service';
import { Palette } from './palette';
import { ConfigService } from '../config.service';
import { PerformanceCounterService } from '../performance-counter.service';

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

  constructor(
    private assets: AssetsService,
    private eventBus: EventBusService,
    private config: ConfigService,
    private performanceCounter: PerformanceCounterService
  ) {}

  ngOnInit(): void {
    this.eventBus.register(EventType.NewFrame, this.onNewFrame.bind(this));
    this.eventBus.register(EventType.TilesheetChange, this.onTilesheetChange.bind(this));
  }

  ngAfterViewInit(): void {
    // Init palette canvas resolution
    this.paletteCanvas.nativeElement.width = this.config.paletteResolution.x;
    this.paletteCanvas.nativeElement.height = this.config.paletteResolution.y;

    // Init palette canvas context
    const rawPaletteContext = this.paletteCanvas.nativeElement.getContext('2d');
    rawPaletteContext.imageSmoothingEnabled = false;
    const paletteContext = new Rendering.RenderContext(rawPaletteContext, this.config.paletteResolution);

    this.palette = new Palette(paletteContext, this.config.paletteCellSize);

    // Select first item in palette on startup.
    this.eventBus.raise(EventType.PaletteSelect, { cellIdx: 0 });
  }

  onMouseMove(e: PointerEvent): void {
    const mousePos = { x: e.offsetX, y: e.offsetY };

    if (!this.palette.tilesheet){
      return;
    }
    if (!this.palette.posOnSheet(mousePos)){
      return;
    }

    this.palette.setCursorPosition(mousePos);
  }

  onMouseDown(e: PointerEvent): void {
    const mousePos = { x: e.offsetX, y: e.offsetY };

    if (!this.palette.posOnSheet(mousePos)){
      return;
    }

    this.palette.setCursorPosition(mousePos);

    this.palette.marker.x = this.palette.cursor.x;

    this.palette.marker.y = this.palette.cursor.y;

    const cellIdx = this.palette.cellIdxAtPosition(this.palette.cursor);
    this.eventBus.raise(EventType.PaletteSelect, { cellIdx });
  }

  onNewFrame(e: any): void {
    this.palette.update();
  }

  onTilesheetChange(e: any): void {
    const tilesheet = this.assets.store.tilesheets[e.tilesheetId] as any;
    this.palette.changeTilesheet(tilesheet);
    this.eventBus.raise(EventType.PaletteSelect, { cellIdx: 0 });
  }
}
