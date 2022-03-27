import _, { map } from 'lodash';
import { Camera } from "./camera";
import { Tilemaps } from "./tilemap";
import { Vector, Rect } from "./primitives";
import { drawBitmap, Bitmap, drawRect, RenderMode } from "./render";
import { posToIndex } from './util';
import { Assets } from './assets';

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
  undoStack: any[];
  redoStack: any[];
  mapId: string;
  listeners: any;
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

    this.undoStack = [];
    this.redoStack = [];

    this.listeners = {
      onNewMap:
        (dimensions: Vector) => {
          this.newMap(dimensions);
          this.topLayerIdx = 0;
        },
      onSaveMap:
        (mapName: string) => {
          this.saveMap(mapName);
        },
      onLoadMap:
        (mapId: string) => {
          this.loadMap(mapId);
          this.topLayerIdx = this.tilemap!.layers.length - 1;
        },
      onAddLayer:
        () => {
          const firstSheet = Object.values(Assets.store.tilesheets)[0] as Assets.Tilesheet;
          const layer = {
            tilesheetId: firstSheet.id,
            tiles: []
          };
          this.tilemap!.layers.push(new Tilemaps.TilemapLayer(layer, this.tilemap!.dimensions));
        },
      onRemoveLayer:
        (layerIdx: number) => {
          this.tilemap!.layers.splice(layerIdx, 1);
          this.topLayerIdx--;
        },
      onLayerChange:
        (layerIdx: number) => {
          this.topLayerIdx = layerIdx;
        },
      onTilesheetChange:
        (sheetId: string) => {
          if (this.tilemap){
            this.tilemap.layers[this.topLayerIdx].tilesheetId = sheetId;
          }
        }
    }
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

  resizeMap(dimensions: Vector){
    /*const n = dimensions.x * dimensions.y;
    let tiles = [] as any[];

    for (let i = 0; i < n; i++){
      tiles[i] = this.tilemap!.tiles[i];
    }

    this.worldMap = new WorldMap(mapObj);
    this.camera = new Camera(this.resolution, this.worldMap, { x: 0, y: 0 });*/
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

  /*
  private undo(): void {
    let item = this.undoStack.pop();
    if (item){
      this.worldMap.tilemap!.setTile(item.inverse.tile, item.inverse.pos);
      this.redoStack.push(item);
    }
  }

  private redo(): void {
    let item = this.redoStack.pop();
    if (item){
      this.worldMap.tilemap!.le(item.actual.tile, item.actual.pos);
      this.undoStack.push(item);
    }
  }*/

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