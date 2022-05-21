import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { EventBusService, EventType } from '../event-bus.service';
import { Rendering } from '../core/rendering';
import { Camera, CameraDirection } from "../core/camera";
import { AssetsService } from '../assets.service';
import { Editor } from './editor';
import { PerformanceCounterService } from '../performance-counter.service';
import { ConfigService } from '../config.service';

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

  constructor(
    private assets: AssetsService,
    private eventBus: EventBusService,
    private performanceCounter: PerformanceCounterService,
    private config: ConfigService  
  ) { }

  ngOnInit(): void {
    this.eventBus.register(EventType.NewFrame, this.onNewFrame.bind(this));
    this.eventBus.register(EventType.PaletteSelect, this.onPaletteSelect.bind(this));
    this.eventBus.register(EventType.ToggleGrid, this.onToggleGrid.bind(this));
    this.eventBus.register(EventType.NewMap, this.onNewMap.bind(this));
    this.eventBus.register(EventType.LoadMap, this.onLoadMap.bind(this));
    this.eventBus.register(EventType.SaveMap, this.onSaveMap.bind(this));
    this.eventBus.register(EventType.TilesheetChange, this.onTilesheetChange.bind(this));
    this.eventBus.register(EventType.AddLayer, this.onAddLayer.bind(this));
    this.eventBus.register(EventType.RemoveLayer, this.onRemoveLayer.bind(this));
    this.eventBus.register(EventType.LayerChange, this.onLayerChange.bind(this));
    this.eventBus.register(EventType.PaletteUpdate, this.onPaletteUpdate.bind(this));

    this.eventBus.register(EventType.MapResize, this.onMapResize.bind(this));
  }

  ngAfterViewInit(): void {
    // Init map canvas resolution 
    this.mapCanvas.nativeElement.width = this.config.editorResolution.x;
    this.mapCanvas.nativeElement.height = this.config.editorResolution.y;
    // Init map canvas context
    const rawEditorContext = this.mapCanvas.nativeElement.getContext('2d');
    rawEditorContext.imageSmoothingEnabled = false;
    const editorContext = new Rendering.RenderContext(rawEditorContext, this.config.editorResolution);

    this.editor = new Editor(editorContext, this.config.tileSize, this.config.lineDashSpeed);

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
        break;
      case 'ControlLeft':
        this.ctrlHeld = true;
        break;
      case 'Delete':
        this.editor.resetTileSelection();
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
        break;
      case 'ControlLeft':
        this.ctrlHeld = false;
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

    if (this.shiftHeld && !this.editor.rectSelectStarted){
      this.editor.startRectSelect();
      return;
    } else {
      this.editor.clearRectSelect();
    }

    if (this.ctrlHeld){
      let tilePos = this.editor.getTileAtCursorPos();
      this.editor.selectTiles(tilePos);
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

    if (this.editor.rectSelectStarted){
      this.editor.endRectSelect();
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

    if (this.editor.rectSelectStarted){
      this.editor.updateRectSelect();
      return;
    }

    // @TODO: Decide on a brace style.
    if (this.editor.paste)
    {
      if (this.ctrlHeld)
      {
        let tilePos = this.editor.getTileAtCursorPos();
        this.editor.selectTiles(tilePos);
      }
      else 
      {
        this.editor.updateTileAtCursorPos();
      }
    }
  }

  onNewFrame(e: any): void {
    this.editor.update(this.performanceCounter.frameCount);
  }

  onPaletteSelect(e: any): void {
    this.editor.selectedTileIdx = e.cellIdx;
  }

  onToggleGrid(e: any): void {
    this.editor.toggleGrid();
  }

  onNewMap(e: any): void {
    let firstSheet = Object.values(this.assets.store.tilesheets)[0] as any;
    const initMap = this.editor.generateNewMap(firstSheet, e.dimensions);
    this.editor.loadMap(initMap);
    this.eventBus.raise(EventType.MapChange, { 
      name: '', 
      dimensions: this.editor.tilemap.dimensions, 
      tilemap: this.editor.tilemap 
    });
  }

  onLoadMap(e: any): void {
    // @TODO: Is this necessary?
    this.editor.clearSelectedTiles();

    const loadedMap = this.assets.store.maps[e.mapId];
    this.editor.loadMap(loadedMap);
    this.eventBus.raise(EventType.MapChange, { 
      name: loadedMap.id, 
      dimensions: this.editor.tilemap.dimensions, 
      tilemap: this.editor.tilemap 
    });
  }

  onSaveMap(e: any): void {
    const savedMap = this.editor.saveMap(e.name);
    this.assets.exportJson(savedMap.id, savedMap);
  }

  onTilesheetChange(e: any): void {
    if (this.editor.tilemap){
      const tilesheet = this.assets.store.tilesheets[e.tilesheetId];
      this.editor.changeTilesheet(this.editor.topLayerIdx(), tilesheet);
    }
  }

  onAddLayer(e: any): void {
    const firstSheet = Object.values(this.assets.store.tilesheets)[0];
    this.editor.addLayer(e.layerId, firstSheet);
    this.eventBus.raise(EventType.TilesheetChange, { tilesheetId: firstSheet.id });
  }

  onRemoveLayer(e: any): void {
    this.editor.removeLayer(e.layerId);
    const tilesheetId = this.editor.tilemap.layers[this.editor.topLayerIdx()].tilesheet.id;
    this.eventBus.raise(EventType.TilesheetChange, { tilesheetId });
  }

  onLayerChange(e: any): void {
    // Change the visibility of a tile layer.
    if (e.visible !== undefined){
      let layerIdx = -1;
      for (let i = 0; i < this.editor.tilemap.layers.length; i++){
        if (this.editor.tilemap.layers[i].id === e.layerId){
          layerIdx = i;
          break;
        }
      }

      // Base layer (0) must always be visibile.
      if (layerIdx > 0){
        this.editor.tilemap.layers[layerIdx].visible = e.visible;
        const tilesheetId = this.editor.tilemap.layers[this.editor.topLayerIdx()].tilesheet.id;
        this.eventBus.raise(EventType.TilesheetChange, { tilesheetId });
      }
    }
  }

  onPaletteUpdate(e: any): void {
    this.editor.updateSelectedTiles(e.cellIdx);
  }

  onMapResize(e: any): void {
    this.editor.resizeMap(e.addNorth, e.addEast, e.addSouth, e.addWest);
  }
}
