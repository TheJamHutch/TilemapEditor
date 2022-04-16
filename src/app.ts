import { Camera } from "./camera";
import { Tilemaps } from "./tilemap";
import { Vector, Rect } from "./primitives";
import { drawBitmap, Bitmap, drawRect, RenderMode } from "./render";
import { posToIndex } from './util';
import { Assets } from './assets';

export namespace App{

  export const config = {
    autosaveEnabled: false,
    storageEnabled: false,
    editor: {
      resolution: { x: 800, y: 600 },
      mapDimensions: { x: 30, y: 30 },
      tileSize: 32
    },
    palette: {
      resolution: { x: 608, y: 300 },
      tileSize: 32
    }
  };

  export let editor: Editor;
  export let palette: Palette;
  export let listeners = {} as any;

  export function init(editorContext: CanvasRenderingContext2D, paletteContext: CanvasRenderingContext2D): void {
    editor = new Editor(editorContext, config.editor);
    palette = new Palette(paletteContext, config.palette);

    initListeners();
  }

  export function tilesheetLoaded(): boolean {
    return (palette.tilesheet);
  }

  function initListeners(): void {
    listeners = {
      onKeyDown: 
        (keycode: string) => {
          editor.onKeyDown(keycode);
        },
      onKeyUp: 
        (keycode: string) => {
          editor.onKeyUp(keycode);
        },
      onMouseDown:
        (mousePos: Vector) => {
            
        },
      onMouseUp:
        (mousePos: Vector) => {
            
        },
      onMouseMove:
        (mousePos: Vector) => {
            
        },
      onEditorMouseDown:
        (mousePos: Vector) => {
          editor.onMouseDown(mousePos);
        },
      onEditorMouseUp:
        (mousePos: Vector) => {
          editor.onMouseUp(mousePos);
        },
      onEditorMouseMove:
        (mousePos: Vector) => {
          editor.onMouseMove(mousePos);
        },
      onPaletteMouseDown:
        (mousePos: Vector) => {
          palette.onMouseDown(mousePos);
          editor.selectedTileType = palette.selectedTileType;
        },
      onPaletteMouseUp:
        (mousePos: Vector) => {
            
        },
      onPaletteMouseMove:
        (mousePos: Vector) => {
          palette.onMouseMove(mousePos);
        },



      onNewMap:
        (mapDimensions: Vector) => {
          editor.newMap(mapDimensions);
        },
      onSaveMap:
        (mapName: string) => {
          editor.saveMap
        },
      onLoadMap:
        (mapId: string) => {  
          editor.loadMap(mapId);
        },
      onResizeMap:
        (mapDimensions: Vector) => {
          editor.resizeMap(mapDimensions);
        },  
      onLoadTilesheet:
        () => {
          
        },
      onAddLayer:
        () => {
          const firstSheet = Object.values(Assets.store.tilesheets)[0] as Assets.Tilesheet;
          const layer = {
            tilesheetId: firstSheet.id,
            tiles: []
          };
          editor.tilemap!.layers.push(new Tilemaps.TilemapLayer(layer, editor.tilemap!.dimensions));
        },
      onRemoveLayer:
        () => {
        
        },
      onLayerChange:
        (layerIdx: number) => {
          editor.topLayerIdx = layerIdx;
          const tilesheetId = editor.tilemap!.layers[layerIdx].tilesheetId;
          palette.loadTilesheet(tilesheetId);
        },
      onTilesheetChange:
        (tilesheetId: string) => {
          palette.loadTilesheet(tilesheetId);
          if (editor.tilemap){
            editor.tilemap.layers[editor.topLayerIdx].tilesheetId = tilesheetId;
          }
        }
    };
  }

  export function update(): void {
    editor.update();
    palette.update();
  }

  export class Editor{
    context: CanvasRenderingContext2D;
    resolution: Vector;
    selectedTileType: number;
    cursor: Rect;
    zoomLevel: number;
    pasteMode: boolean;
    tilemap?: Tilemaps.Tilemap;
    camera?: Camera;
    ctrlHeld: boolean;
    mapId: string;
    topLayerIdx: number;
  
    constructor(context: CanvasRenderingContext2D, config: any){
      this.context = context;
      this.resolution = config.resolution;
      this.cursor = new Rect({ x: 0, y: 0, w: config.tileSize, h: config.tileSize });
      this.selectedTileType = 0;
      this.pasteMode = false;
      this.zoomLevel = 0;
      this.mapId = '';
      this.ctrlHeld = false;
  
      this.topLayerIdx = -1;
    }
  
    update(): void {
      if (this.isInit()){
        this.camera!.update();
        this.render();
      }
    }
  
    newMap(dimensions: Vector): void {
      const firstSheet = Object.values(Assets.store.tilesheets)[0] as Assets.Tilesheet;
      const mapObj = {
        id: '',
        type: 'map',
        tilemap: {
          dimensions,
          layers: [
            {
              tilesheetId: firstSheet.id,
              tiles: [] as any[]
            }
          ]
        }
      };
  
      // Insert tiles
      const nTiles = dimensions.x * dimensions.y;
      for (let i = 0; i < nTiles; i++){
        mapObj.tilemap.layers[0].tiles.push(0);
      }

      this.topLayerIdx = 0;
  
      const map = new Assets.GameMap(mapObj);
      this.mapId = map.id;
      this.tilemap = new Tilemaps.Tilemap(map.tilemap);
      this.camera = new Camera(this.resolution, this.tilemap, { x: 0, y: 0 });
    }
  
    loadMap(mapId: string): void {
      const map = Assets.store.maps[mapId];
      this.mapId = map.id;
      this.tilemap = new Tilemaps.Tilemap(map.tilemap);
      this.camera = new Camera(this.resolution, this.tilemap, { x: 0, y: 0 });

      this.topLayerIdx = this.tilemap!.layers.length - 1;
    }
  
    saveMap(mapName: string): any {
      let layers = [];
      for (const layer of this.tilemap!.layers){
        layers.push({
          tilesheetId: layer.tilesheetId,
          tiles: layer.tiles
        });
      }
  
      return {
        id: mapName,
        type: 'map',
        tilemap: {
          dimensions: this.tilemap!.dimensions,
          layers
        },
        entities: {
          player: {
            spawnPos: { x: 0, y: 0 }
          }
        }
      }
    }
  
    resizeMap(mapDimensions: Vector){
      this.tilemap!.dimensions = mapDimensions;
    }
  
    onKeyDown(keycode: string): void {
      if (!this.isInit()){
        return;
      }
  
      switch(keycode){
        case 'KeyW':
          this.camera!.velocity.y = -1;
          break;
        case 'KeyS':
          this.camera!.velocity.y = 1;
          break;
        case 'KeyA':
          this.camera!.velocity.x = -1;
          break;
        case 'KeyD':
          this.camera!.velocity.x = 1;
          break;
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
          break;
      }
    }
  
    onKeyUp(keycode: string): void {
      if (!this.isInit()){
        return;
      }
  
      switch(keycode){
        case 'KeyW':
        case 'KeyS':
          this.camera!.velocity.y = 0;
          break;
        case 'KeyA':
        case 'KeyD':
          this.camera!.velocity.x = 0;
          break;
        case 'ControlLeft':
          this.ctrlHeld = false;
          break;
      }
    }
  
    onMouseMove(mousePos: Vector): void {
      if (!this.isInit()){
        return;
      }
  
      this.setCursorPosition(mousePos);
  
      if (this.pasteMode){
        if (this.cursorInBounds()){
          this.updateTileAtCursorPos();
        }
      }
    }
  
    onMouseDown(mousePos: Vector): void {
      if (!this.isInit()){
        return;
      }
  
      this.setCursorPosition(mousePos);
    
      if (this.cursorInBounds()){
        this.pasteMode = true;
        this.updateTileAtCursorPos();
      }
    }
  
    onMouseUp(mousePos: Vector){
      if (!this.isInit()){
        return;
      }
  
      this.pasteMode = false;
    }
  
    private updateTileAtCursorPos(){
      const worldPos = this.camera!.viewToWorld(this.cursor) as Vector;
      const tilePos = Tilemaps.worldToTile(this.tilemap!, worldPos);
      this.tilemap!.setTile(this.topLayerIdx, tilePos, this.selectedTileType);
    }
  
    private cursorInBounds(): boolean{
      return (this.cursor.x < this.tilemap!.resolution.x) && (this.cursor.y < this.tilemap!.resolution.y);
    }
  
    private setCursorPosition(mousePos: Vector): void {
      if (!this.isInit()){
        return;
      }
  
      this.cursor.x = (mousePos.x - (mousePos.x % this.tilemap!.tileSize)) - (this.camera!.world.x % this.tilemap!.tileSize);
      this.cursor.y = (mousePos.y - (mousePos.y % this.tilemap!.tileSize)) - (this.camera!.world.y % this.tilemap!.tileSize);
    }
  
    private render(): void {
      drawRect(this.context, new Rect({ x: 0, y: 0, w: this.resolution.x, h: this.resolution.y }), RenderMode.Fill);
  
      Tilemaps.renderTilemap(this.tilemap!, this.context, this.camera!, this.topLayerIdx);
  
      this.context.strokeStyle = 'yellow';
      this.context.lineWidth = 4;
      drawRect(this.context, this.cursor);
    }
  
    // Returns true if all of the optional properties of 'this' have been init.
    private isInit(): boolean {
      return (this.tilemap && this.camera) ? true : false;
    }
    
  }

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
  
}
