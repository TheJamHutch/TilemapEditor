import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { EventBusService, EventType } from '../event-bus.service';
import { Rendering } from '../core/rendering';
import { config } from '../core/config';
import { Rect, Vector } from "../core/primitives";
import { Camera } from "../core/camera";
import { Tiling } from "../core/tilemap";
import { AssetsService } from '../assets.service';

export enum DrawModes{
  Free = 0,
  Line,
  Rect,
  Block
}

@Component({
  selector: 'app-editor-control',
  templateUrl: './editor-control.component.html',
  styleUrls: ['./editor-control.component.scss']
})
export class EditorControlComponent implements OnInit, AfterViewInit {

  @ViewChild('mapCanvas') mapCanvas: ElementRef<HTMLCanvasElement>;

  context: Rendering.RenderContext;
  cursor: Rect;
  selectedTileIdx = 1;
  tileSize: number;
  pasteMode = false;

  tilemap?: Tiling.Tilemap;
  camera?: Camera;

  topLayerIdx = -1;

  showGrid = false;
  drawMode = DrawModes.Free;

  constructor(private assets: AssetsService, private eventBus: EventBusService) { }

  ngOnInit(): void {
    this.eventBus.register(EventType.NewFrame, (context: any) => {
      this.update();
    });
    this.eventBus.register(EventType.PaletteSelect, (context: any) => {
      this.selectedTileIdx = context.cellIdx;
    });
    this.eventBus.register(EventType.ToggleGrid, (context: any) => {
      this.showGrid = !this.showGrid;
    });
    this.eventBus.register(EventType.NewMap, (_) => {
      const initMap = this.generateNewMap();
      this.loadMap(initMap);

      this.eventBus.raise(EventType.MapChange, { tilemap: this.tilemap });
    });
    this.eventBus.register(EventType.LoadMap, (context: any) => {
      this.loadMap(context.map);

      this.eventBus.raise(EventType.MapChange, { tilemap: this.tilemap });
    });
    this.eventBus.register(EventType.SaveMap, (_) => {
      const savedMap = this.saveMap('TEST');
      this.exportJson(savedMap.id, savedMap);
    });
    this.eventBus.register(EventType.TilesheetChange, (context: any) => {
      if (this.tilemap){
        const tilesheet = this.assets.store.tilesheets[context.tilesheetId];
        this.tilemap.layers[this.topLayerIdx].tilesheet = tilesheet;
      }
    });
    this.eventBus.register(EventType.AddLayer, (context: any) => {
      const firstSheet = Object.values(this.assets.store.tilesheets)[0];
      const layer = new Tiling.TilemapLayer([], firstSheet, this.tilemap.dimensions);
      this.tilemap.layers.push(layer);
    });
    this.eventBus.register(EventType.RemoveLayer, (context: any) => {
      this.tilemap.layers.splice(context.layerIdx, 1);
      this.topLayerIdx--;
    });
    this.eventBus.register(EventType.LayerChange, (context: any) => {
      this.topLayerIdx = context.layerIdx;
    });
    this.eventBus.register(EventType.DrawModeChange, (context: any) => {
      
    });
  }

  ngAfterViewInit(): void {
    // Init map canvas resolution
    this.mapCanvas.nativeElement.width = config.editor.resolution.x;
    this.mapCanvas.nativeElement.height = config.editor.resolution.y;
    // Init map canvas context
    const mapContext = this.mapCanvas.nativeElement.getContext('2d');
    mapContext.imageSmoothingEnabled = false;
    this.context = new Rendering.RenderContext(mapContext, config.editor.resolution);

    this.cursor = new Rect({ x: 0, y: 0, w: config.editor.tileSize, h: config.editor.tileSize });
    this.tileSize = config.editor.tileSize;

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

  loadMap(rawMap: any){
    this.tilemap = new Tiling.Tilemap(rawMap.tilemap, this.tileSize);
    this.camera = new Camera(this.context.resolution, this.tilemap.resolution);

    this.topLayerIdx = this.tilemap.layers.length - 1;
  }

  saveMap(mapId: string): any {
    let layers = [];
    for (const layer of this.tilemap!.layers){
      layers.push({
        tilesheetId: layer.tilesheet.id,
        tiles: layer.tiles
      });
    }

    return {
      id: mapId,
      type: 'map',
      tilemap: {
        dimensions: this.tilemap.dimensions,
        layers
      },
      entities: [
        {
          archetypeId: 'player',
          spawnPos: { x: 0, y: 0 }
        }
      ]
    };
  }

  update(): void {
    if (!this.camera || !this.tilemap){
      return;
    }
    
    this.camera.update();
    this.render();
  }

  onKeyDown(keycode: string): void {
    if (!this.camera || !this.tilemap){
      return;
    }

    switch(keycode){
      case 'KeyW':
        this.camera.velocity.y = -1;
        break;
      case 'KeyS':
        this.camera.velocity.y = 1;
        break;
      case 'KeyA':
        this.camera.velocity.x = -1;
        break;
      case 'KeyD':
        this.camera.velocity.x = 1;
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
    if (!this.camera || !this.tilemap){
      return;
    }

    switch(keycode){
      case 'KeyW':
      case 'KeyS':
        this.camera.velocity.y = 0;
        break;
      case 'KeyA':
      case 'KeyD':
        this.camera.velocity.x = 0;
        break;
        /*
      case 'ControlLeft':
        this.ctrlHeld = false;
        break;*/
    }
  }

  onMouseMove(mousePos: Vector): void {
    if (!this.camera || !this.tilemap){
      return;
    }

    if (!this.posOnMap(mousePos)){
      return;
    }
  
    this.setCursorPosition(mousePos);

    if (this.pasteMode){
      this.updateTileAtCursorPos();
    }
  }

  onMouseDown(mousePos: Vector): void {
    if (!this.camera || !this.tilemap){
      return;
    }

    if (!this.posOnMap(mousePos)){
      return;
    }
    
    this.setCursorPosition(mousePos);

    this.pasteMode = true;
    this.updateTileAtCursorPos();
  }

  onMouseUp(mousePos: Vector): void {
    if (!this.camera || !this.tilemap){
      return;
    }

    this.pasteMode = false;
  }

  private posOnMap(pos: Vector): boolean {
    return (pos.x - 16 > this.camera.view.x &&
            pos.x <= this.camera.view.x + this.tilemap.resolution.x &&
            pos.y - 16 > this.camera.view.y &&
            pos.y <= this.camera.view.y + this.tilemap.resolution.y);
  }

  private updateTileAtCursorPos(): void {
    const worldPos = this.camera.viewToWorld(this.cursor) as Vector;
    const tilePos = Tiling.worldToTilePos(this.tilemap, worldPos);

    this.tilemap.setTile(this.topLayerIdx, tilePos, this.selectedTileIdx);
  }

  private setCursorPosition(pos: Vector): void {
    this.cursor.x = (pos.x - (pos.x % this.tilemap.tileSize)) - (this.camera.world.x % this.tilemap.tileSize) - (this.camera.view.x % this.tilemap.tileSize);
    this.cursor.y = (pos.y - (pos.y % this.tilemap.tileSize)) - (this.camera.world.y % this.tilemap.tileSize) - (this.camera.view.y % this.tilemap.tileSize);
  }

  private render(): void {
    // Render black background
    this.context.setFillColor('black');
    this.context.fillRect(new Rect({ x: 0, y: 0, w: this.context.resolution.x, h: this.context.resolution.y }));

    Tiling.renderTilemap(this.context, this.tilemap, this.camera, this.topLayerIdx);

    if (this.showGrid){
      this.renderGrid();
    }

    this.context.setStrokeColor('yellow');
    this.context.setStrokeWeight(4);
    this.context.strokeRect(this.cursor);
  }

  private renderGrid(): void {
    this.context.setStrokeColor('black');
    this.context.setStrokeWeight(1);
    const dims = this.tilemap.dimensions;

    // Vertical lines
    for (let x = 0; x < dims.x; x++){
      let start = {
        x: (this.camera.view.x + (x * this.tileSize)) - (this.camera.world.x % this.tileSize),
        y: 0
      };
      let end = {
        x: (this.camera.view.x + (x * this.tileSize)) - (this.camera.world.x % this.tileSize),
        y: this.tilemap.resolution.y
      };

      this.context.drawLine(start, end);
    }
    // Horizontal lines
    for (let y = 0; y < dims.y; y++){
      let start = {
        x: 0,
        y: (this.camera.view.y + (y * this.tileSize)) - (this.camera.world.y % this.tileSize)
      };
      let end = {
        x: this.tilemap.resolution.x,
        y: (this.camera.view.y + (y * this.tileSize)) - (this.camera.world.y % this.tileSize)
      };

      this.context.drawLine(start, end);
    }
  }

  generateNewMap(): any {
    let firstSheet = Object.values(this.assets.store.tilesheets)[0] as any;
    firstSheet.texture = this.assets.store.textures[firstSheet.textureId];

    const dimensions = { x: 100, y: 100 };

    const mapObj = {
      id: '',
      tilemap: {
        dimensions,
        layers: [
          {
            tilesheet: firstSheet,
            tiles: [] as any[]
          }
        ]
      }
    }
    // Insert tiles
    const nTiles = dimensions.x * dimensions.y;
    for (let i = 0; i < nTiles; i++){
      mapObj.tilemap.layers[0].tiles.push(0);
    }

    return mapObj;
  }

  private exportJson(id: string, obj: any): void {
    const json = JSON.stringify(obj);
    const a = document.createElement('a');
    a.href = `data:application/json;charset=utf-8,${json}`;
    a.download = `${id}.json`;
    a.click();
  }

}
