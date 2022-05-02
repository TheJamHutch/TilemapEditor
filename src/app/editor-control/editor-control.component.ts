import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { EventBusService, EventType } from '../event-bus.service';
import { Rendering } from '../core/rendering';
import { config } from '../core/config';
import { Rect, Vector } from "../core/primitives";
import { Camera } from "../core/camera";
import { Tiling } from "../core/tilemap";
import { AssetsService } from '../assets.service';
import { Editor } from '../core/editor';

@Component({
  selector: 'app-editor-control',
  templateUrl: './editor-control.component.html',
  styleUrls: ['./editor-control.component.scss']
})
export class EditorControlComponent implements OnInit, AfterViewInit {

  @ViewChild('mapCanvas') mapCanvas: ElementRef<HTMLCanvasElement>;

  editor: Editor;

  constructor(private assets: AssetsService, private eventBus: EventBusService) { }

  ngOnInit(): void {
    this.eventBus.register(EventType.NewFrame, (context: any) => {
      this.editor.update();
    });
    this.eventBus.register(EventType.PaletteSelect, (context: any) => {
      this.editor.selectedTileIdx = context.cellIdx;
    });
    this.eventBus.register(EventType.ToggleGrid, (context: any) => {
      this.editor.toggleGrid();
    });
    this.eventBus.register(EventType.NewMap, (_) => {
      let firstSheet = Object.values(this.assets.store.tilesheets)[0] as any;
      firstSheet.texture = this.assets.store.textures[firstSheet.textureId];
      const initMap = this.editor.generateNewMap(firstSheet);
      this.editor.loadMap(initMap);

      this.eventBus.raise(EventType.MapChange, { tilemap: this.editor.tilemap });
    });
    this.eventBus.register(EventType.LoadMap, (context: any) => {
      this.editor.loadMap(context.map);

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

    // Init map canvas events
    this.mapCanvas.nativeElement.addEventListener('keydown', (e: any) => {
      this.onKeyDown(e.code);
    });
    this.mapCanvas.nativeElement.addEventListener('keyup', (e: any) => {
      this.onKeyUp(e.code);
    });
    this.mapCanvas.nativeElement.addEventListener('mousemove', (e: any) => {
      this.onMouseMove({ x: e.offsetX, y: e.offsetY });
    });
    this.mapCanvas.nativeElement.addEventListener('mousedown', (e: any) => {
      this.onMouseDown({ x: e.offsetX, y: e.offsetY });
    });
    // Bind this particular event listener to the document instead, to prevent an annoying bug where the editor is still in paste mode when mouseup occurs off-canavs.
    document.addEventListener('mouseup', (e: any) => {
      this.onMouseUp({ x: e.offsetX, y: e.offsetY });
    });
  }

  onKeyDown(keycode: string): void {
    if (!this.editor.tilemap){
      return;
    }

    switch(keycode){
      case 'KeyW':
        this.editor.camera.velocity.y = -1;
        break;
      case 'KeyS':
        this.editor.camera.velocity.y = 1;
        break;
      case 'KeyA':
        this.editor.camera.velocity.x = -1;
        break;
      case 'KeyD':
        this.editor.camera.velocity.x = 1;
        break;
        /*
      case 'Equal':
        this.camera!.zoomIn();
        break;
      case 'Minus':
        this.camera!.zoomOut();
        break;
      case 'ControlLeft':
        this.ctrlHeld = true;
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

  onKeyUp(keycode: string): void {
    if (!this.editor.tilemap){
      return;
    }

    switch(keycode){
      case 'KeyW':
      case 'KeyS':
        this.editor.camera.velocity.y = 0;
        break;
      case 'KeyA':
      case 'KeyD':
        this.editor.camera.velocity.x = 0;
        break;
        /*
      case 'ControlLeft':
        this.ctrlHeld = false;
        break;*/
    }
  }

  onMouseMove(mousePos: Vector): void {
    if (!this.editor.tilemap){
      return;
    }

    if (!this.editor.posOnMap(mousePos)){
      return;
    }
  
    this.editor.setCursorPosition(mousePos);

    if (this.editor.pasteMode){
      this.editor.updateTileAtCursorPos();
    }
  }

  onMouseDown(mousePos: Vector): void {
    if (!this.editor.tilemap){
      return;
    }

    if (!this.editor.posOnMap(mousePos)){
      return;
    }
    
    this.editor.setCursorPosition(mousePos);

    this.editor.pasteMode = true;
    this.editor.updateTileAtCursorPos();
  }

  onMouseUp(mousePos: Vector): void {
    if (!this.editor.tilemap){
      return;
    }

    this.editor.pasteMode = false;
  }
}
