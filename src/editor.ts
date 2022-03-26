import _, { map } from 'lodash';
import { Camera } from "./camera";
import { TilemapLayer, renderTilemap, Tile, Tilemap, WorldMap } from "./tilemap";
import { Vector, Rect } from "./primitives";
import { drawBitmap, Bitmap, drawRect, RenderMode } from "./render";
import { posToIndex } from './util';
import { Global } from './global';
import { Assets } from './assets';

export class Editor{
  context: CanvasRenderingContext2D;
  resolution: Vector;
  selectedTileType: number;
  cursor: Rect;
  zoomLevel: number;
  pasteMode: boolean;
  worldMap?: WorldMap;
  camera?: Camera;
  ctrlHeld: boolean;
  undoStack: any[];
  redoStack: any[];

  constructor(context: CanvasRenderingContext2D, config: any){
    this.context = context;
    this.resolution = config.resolution;
    this.cursor = new Rect({ x: 0, y: 0, w: config.tileSize, h: config.tileSize });
    this.selectedTileType = 0;
    this.pasteMode = false;
    this.zoomLevel = 0;

    this.ctrlHeld = false;

    this.undoStack = [];
    this.redoStack = [];

    Global.events.register('tilesheetLoad', (sheet: any) => {
      Assets.store.tilesheets[sheet.id] = sheet;
    });
    Global.events.register('mapLoad', (map: any) => {
      this.worldMap = new WorldMap(map);
      this.camera = new Camera(this.resolution, this.worldMap, { x: 0, y: 0 });
    });
    Global.events.register('paletteSelect', (selectedTile: number) => {
      this.selectedTileType = selectedTile;
    });
  }

  update(): void {
    if (this.isInit()){
      this.camera!.update();
      this.render();
    }
  }

  saveMap(mapName: string): any {
    return {
      name: mapName,
      type: 'map',
      tilemap: this.worldMap!.saveTilemap(),
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
        const worldPos = this.camera!.viewToWorld(this.cursor) as Vector;
        this.worldMap!.setTile(worldPos, this.selectedTileType);
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
      const worldPos = this.camera!.viewToWorld(this.cursor) as Vector;
      this.worldMap!.setTile(worldPos, this.selectedTileType);
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
      this.worldMap.tilemap!.setTile(item.actual.tile, item.actual.pos);
      this.undoStack.push(item);
    }
  }*/

  private cursorInBounds(): boolean{
    return (this.cursor.x < this.worldMap!.resolution.x) && (this.cursor.y < this.worldMap!.resolution.y);
  }

  private setCursorPosition(mousePos: Vector): void {
    if (!this.isInit()){
      return;
    }

    this.cursor.x = (mousePos.x - (mousePos.x % this.worldMap!.tilemap.tileSize)) - (this.camera!.world.x % this.worldMap!.tilemap!.tileSize);
    this.cursor.y = (mousePos.y - (mousePos.y % this.worldMap!.tilemap.tileSize)) - (this.camera!.world.y % this.worldMap!.tilemap!.tileSize);
  }

  private render(): void {
    drawRect(this.context, new Rect({ x: 0, y: 0, w: this.resolution.x, h: this.resolution.y }), RenderMode.Fill);

    renderTilemap(this.worldMap!.tilemap, this.context, this.camera!);

    this.context.strokeStyle = 'yellow';
    this.context.lineWidth = 4;
    drawRect(this.context, this.cursor);
  }

  // Returns true if all of the optional properties of 'this' have been init.
  private isInit(): boolean {
    return (this.worldMap && this.camera) ? true : false;
  }
  
}