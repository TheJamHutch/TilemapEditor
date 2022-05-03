import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { EventBusService, EventType } from '../event-bus.service';
import { Rendering } from '../core/rendering';
import { config } from '../core/config';
import { Rect, Vector } from "../core/primitives";
import { Camera, CameraDirection } from "../core/camera";
import { Tiling } from "../core/tilemap";
import { AssetsService } from '../assets.service';
import { Editor, EditorMode } from '../core/editor';
import { PerformanceCounterService } from '../performance-counter.service';

@Component({
  selector: 'app-editor-control',
  templateUrl: './editor-control.component.html',
  styleUrls: ['./editor-control.component.scss']
})
export class EditorControlComponent implements OnInit, AfterViewInit {

  @ViewChild('mapCanvas') mapCanvas: ElementRef<HTMLCanvasElement>;

  editor: Editor;
  ctrlHeld = false;
  shiftHeld = false;

  constructor(private assets: AssetsService, private eventBus: EventBusService, private performanceCounter: PerformanceCounterService) { }

  ngOnInit(): void {
    this.eventBus.register(EventType.NewFrame, (context: any) => {
      this.editor.update(this.performanceCounter.frameCount);
    });
    this.eventBus.register(EventType.PaletteSelect, (context: any) => {
      this.editor.selectedTileIdx = context.cellIdx;
    });
    this.eventBus.register(EventType.ToggleGrid, (context: any) => {
      this.editor.toggleGrid();
    });
    this.eventBus.register(EventType.NewMap, (_) => {
      let firstSheet = Object.values(this.assets.store.tilesheets)[0] as any;
      const initMap = this.editor.generateNewMap(firstSheet, config.editor.mapDimensions);
      this.editor.loadMap(initMap);

      this.eventBus.raise(EventType.MapChange, { tilemap: this.editor.tilemap });
    });
    this.eventBus.register(EventType.LoadMap, (context: any) => {
      const loadedMap = this.assets.store.maps[context.mapId];
      this.editor.loadMap(loadedMap);
      this.eventBus.raise(EventType.MapChange, { tilemap: this.editor.tilemap });
    });
    this.eventBus.register(EventType.SaveMap, (_) => {
      const savedMap = this.editor.saveMap('TEST');
      this.assets.exportJson(savedMap.id, savedMap);
    });
    this.eventBus.register(EventType.TilesheetChange, (context: any) => {
      if (this.editor.tilemap){
        const tilesheet = this.assets.store.tilesheets[context.tilesheetId];
        this.editor.changeTilesheet(this.editor.topLayerIdx, tilesheet);
      }
    });
    this.eventBus.register(EventType.AddLayer, (context: any) => {
      const firstSheet = Object.values(this.assets.store.tilesheets)[0];
      this.editor.addLayer(firstSheet);
    });
    this.eventBus.register(EventType.RemoveLayer, (context: any) => {
      this.editor.removeLayer(context.layerIdx);
    });
    this.eventBus.register(EventType.LayerChange, (context: any) => {
      this.editor.topLayerIdx = context.layerIdx;
    });
    this.eventBus.register(EventType.DrawModeChange, (context: any) => {
      
    });
  }

  ngAfterViewInit(): void {
    // Init map canvas resolution
    this.mapCanvas.nativeElement.width = config.editor.resolution.x;
    this.mapCanvas.nativeElement.height = config.editor.resolution.y;
    // Init map canvas context
    const rawEditorContext = this.mapCanvas.nativeElement.getContext('2d');
    rawEditorContext.imageSmoothingEnabled = false;
    const editorContext = new Rendering.RenderContext(rawEditorContext, config.editor.resolution);

    this.editor = new Editor(editorContext, config.editor)

    // MouseUp event is bound to document instead to prevent an annyoing bug where the editor is stil in paste mode after canvas
    // mouseleave and mouse button has been released.
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  onKeyDown(e: KeyboardEvent): void {
    if (!this.editor.tilemap){
      return;
    }

    switch(e.code){
      case 'KeyW':
        this.editor.moveCamera(CameraDirection.North);
        break;
      case 'KeyS':
        this.editor.moveCamera(CameraDirection.South);
        break;
      case 'KeyA':
        this.editor.moveCamera(CameraDirection.West);
        break;
      case 'KeyD':
        this.editor.moveCamera(CameraDirection.East);
        break;
      case 'ShiftLeft':
        this.shiftHeld = true;
        this.editor.mode = EditorMode.Select;
        break;
      case 'ControlLeft':
        this.ctrlHeld = true;
        this.editor.mode = EditorMode.Select;
        break;
        /*
      case 'Equal':
        this.camera!.zoomIn();
        break;
      case 'Minus':
        this.camera!.zoomOut();
        break;
      case 'KeyZ':
        if (this.ctrlHeld){
          //this.undo();
        }
        break;
      case 'KeyY':
        if (this.ctrlHeld){
          //this.redo();
        }
        break;*/
    }
  }

  onKeyUp(e: KeyboardEvent): void {
    if (!this.editor.tilemap){
      return;
    }

    switch(e.code){
      case 'KeyW':
      case 'KeyS':
        this.editor.camera.velocity.y = 0;
        break;
      case 'KeyA':
      case 'KeyD':
        this.editor.camera.velocity.x = 0;
        break;
      case 'ShiftLeft':
        this.shiftHeld = false;
        this.editor.mode = EditorMode.Draw;
        break;
      case 'ControlLeft':
        this.ctrlHeld = false;
        this.editor.mode = EditorMode.Draw;
        this.editor.paste = false;
        break;
    }
  }

  onMouseEnter(e: PointerEvent): void {
    // This prevents a bug where the current selection is cleared when clicking off the canvas and back onto it, amongst others.
    const elem = e.target as HTMLCanvasElement;
    elem.focus();
  }

  onMouseDown(e: PointerEvent): void {    
    const mousePos = { x: e.offsetX, y: e.offsetY };

    if (!this.editor.tilemap){
      return;
    }

    if (!this.editor.posOnMap(mousePos)){
      return;
    }
    
    this.editor.setCursorPosition(mousePos);

    this.editor.paste = true;

    if (this.ctrlHeld){
      let tilePos = this.editor.getTileAtCursorPos();
      this.editor.addSelectedTile(tilePos);
    } else {
      // If no tiles are currently selected then draw the tile as normal.
      if (this.editor.selectedTiles.length === 0)
      {
        this.editor.updateTileAtCursorPos();
      } 
      // Otherwise clear the tile selection first.
      else 
      {
        this.editor.clearSelectedTiles();
      }
    }
  }

  onMouseUp(e: PointerEvent): void {
    const mousePos = { x: e.offsetX, y: e.offsetY };

    if (!this.editor.tilemap){
      return;
    }

    this.editor.paste = false;
  }

  onMouseMove(e: PointerEvent): void {
    const mousePos = { x: e.offsetX, y: e.offsetY };

    if (!this.editor.tilemap){
      return;
    }

    if (!this.editor.posOnMap(mousePos)){
      return;
    }
  
    this.editor.setCursorPosition(mousePos);

    // @TODO: Decide on a brace style.
    if (this.editor.paste)
    {
      if (this.ctrlHeld)
      {
        let tilePos = this.editor.getTileAtCursorPos();
        this.editor.addSelectedTile(tilePos);
      }
      else 
      {
        this.editor.updateTileAtCursorPos();
      }
    }
  }
}
