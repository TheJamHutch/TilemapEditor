import _ from 'lodash';
import { Camera } from "./camera";
import { Tilemap, renderTilemap, Tile } from "./tilemap";
import { Vector, Rect } from "./primitives";
import { drawBitmap, Bitmap, drawRect, RenderMode } from "./render";
import { Events } from "./events";
import { posToIndex } from './util';

export class Editor{
  events: Events;
  context: CanvasRenderingContext2D;
  resolution: Vector;
  selectedTile: number;
  cursor: Rect;
  assets: any;
  mapDimensions: Vector;
  zoomLevel: number;

  pasteMode: boolean;

  tilesheet?: any;
  texture?: Bitmap;
  tilemap?: Tilemap;
  camera?: Camera;

  ctrlHeld: boolean;

  undoStack: any[];
  redoStack: any[];

  constructor(events: Events, context: CanvasRenderingContext2D, config: any, assets: any){
    this.events = events;
    this.context = context;
    this.resolution = config.resolution;
    this.assets = assets;
    this.cursor = new Rect({ x: 0, y: 0, w: config.tileSize, h: config.tileSize });
    this.selectedTile = 0;
    this.pasteMode = false;
    this.zoomLevel = 0;

    this.ctrlHeld = false;

    this.undoStack = [];
    this.redoStack = [];
    
    this.mapDimensions = config.mapDimensions;

    this.events.register('mapLoad', (map: any) => {
      this.loadMap(map);
    });
    this.events.register('tilesheetLoad', (sheet: any) => {
      this.loadTilesheet(sheet);
    });
    this.events.register('paletteSelect', (selectedTile: number) => {
      this.selectedTile = selectedTile;
    });
  }

  update(): void {
    if (this.isInit()){
      this.camera!.update();
      this.render();
    }
  }

  saveMap(mapName: string): any {
    let saveTiles = this.tilemap?.tiles.slice(0);
    
    return {
      name: mapName,
      dimensions: this.tilemap?.dimensions,
      playerSpawn: { x: 0, y: 0 },
      tiles: saveTiles,
      enemies: []
    }
  }

  loadMap(mapObj: any): void {
    
    this.tilemap = new Tilemap(mapObj.dimensions, mapObj.tiles);
    this.camera = new Camera(this.resolution, this.tilemap.resolution, { x: 0, y: 0 });
  }

  resizeMap(dimensions: Vector){
    const n = dimensions.x * dimensions.y;
    let tiles = [] as any[];

    for (let i = 0; i < n; i++){
      tiles[i] = this.tilemap!.tiles[i];
    }

    this.tilemap = new Tilemap(dimensions, tiles);
    this.camera = new Camera(this.resolution, this.tilemap.resolution, { x: 0, y: 0 });
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
        this.zoomIn();
        break;
      case 'Minus':
        this.zoomOut();
        break;
      case 'ControlLeft':
        this.ctrlHeld = true;
        break;
      case 'KeyZ':
        if (this.ctrlHeld){
          this.undo();
        }
        break;
      case 'KeyY':
        if (this.ctrlHeld){
          this.redo();
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
        this.setTile();
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
      this.setTile();
    }
  }

  onMouseUp(mousePos: Vector){
    if (!this.isInit()){
      return;
    }

    this.pasteMode = false;
  }

  private undo(): void {
    let item = this.undoStack.pop();
    if (item){
      this.tilemap!.setTile(item.inverse.tile, item.inverse.pos);
      this.redoStack.push(item);
    }
  }

  private redo(): void {
    let item = this.redoStack.pop();
    if (item){
      this.tilemap!.setTile(item.actual.tile, item.actual.pos);
      this.undoStack.push(item);
    }
  }

  private setTile(): void {
    const tilePos = this.getTilePos(this.cursor);
    const originalTile = this.tilemap!.getTile(tilePos);

    const solid = (this.tilesheet.solidMap[this.selectedTile] === 1);
    const effect = this.tilesheet.effectMap[this.selectedTile];
    this.tilemap!.setTile({ texture: this.selectedTile, solid, effect }, tilePos);

    const updatedTile = this.tilemap!.getTile(tilePos);

    const item = {
      actual: {
        pos: tilePos,
        tile: updatedTile
      },
      inverse: {
        pos: tilePos,
        tile: originalTile
      }
    };
    this.undoStack.push(item);
  }

  private getTilePos(viewPos: Vector): Vector {
    return {
      x: Math.floor(viewPos.x / this.tilemap!.tileViewSize) + Math.ceil(this.camera!.world.x / this.tilemap!.tileViewSize),
      y: Math.floor(viewPos.y / this.tilemap!.tileViewSize) + Math.ceil(this.camera!.world.y / this.tilemap!.tileViewSize)
    };
  }

  private cursorInBounds(): boolean{
    return (this.cursor.x < this.tilemap!.resolution.x) && (this.cursor.y < this.tilemap!.resolution.y);
  }

  private zoomIn(){
    const maxZoom = 20;
    if (this.zoomLevel < maxZoom){
      this.zoomLevel += 2;
      this.tilemap!.changeTileViewSize(this.tilemap!.tileSize + this.zoomLevel);
      this.cursor.w = this.tilemap!.tileViewSize;
      this.cursor.h = this.tilemap!.tileViewSize;

      this.camera!.worldBounds = this.tilemap!.resolution;
    }
  }

  private zoomOut(){
    const minZoom = -20;
    if (this.zoomLevel > minZoom){
      this.zoomLevel -= 2;
      this.tilemap!.changeTileViewSize(this.tilemap!.tileSize + this.zoomLevel);
      this.cursor.w = this.tilemap!.tileViewSize;
      this.cursor.h = this.tilemap!.tileViewSize;

      this.camera!.worldBounds = this.tilemap!.resolution;
    }
  }

  private loadTilesheet(sheet: any){
    this.tilesheet = sheet;
    this.texture = this.assets.textures[sheet.textureId];
  }

  private setCursorPosition(mousePos: Vector): void {
    if (!this.isInit()){
      return;
    }

    this.cursor.x = (mousePos.x - (mousePos.x % this.tilemap!.tileViewSize)) - (this.camera!.world.x % this.tilemap!.tileViewSize);
    this.cursor.y = (mousePos.y - (mousePos.y % this.tilemap!.tileViewSize)) - (this.camera!.world.y % this.tilemap!.tileViewSize);
  }

  private viewToWorld(view: Vector): Vector {
    if (!this.tilemap || !this.camera){
      return { x: -1, y: -1 };
    }

    return {
      x: Math.floor(view.x / this.tilemap.tileViewSize) + Math.ceil(this.camera.world.x / this.tilemap.tileViewSize),
      y: Math.floor(view.y / this.tilemap.tileViewSize) + Math.ceil(this.camera.world.y / this.tilemap.tileViewSize)
    };
  }

  private render(): void {
    drawRect(this.context, new Rect({ x: 0, y: 0, w: this.resolution.x, h: this.resolution.y }), RenderMode.Fill);

    renderTilemap(this.tilemap!, this.context, this.camera!, this.tilesheet, this.texture!);

    this.context.strokeStyle = 'yellow';
    this.context.lineWidth = 4;
    drawRect(this.context, this.cursor);
  }

  // Returns true if all of the optional properties of 'this' have been init.
  private isInit(): boolean {
    return (this.tilemap && this.tilesheet && this.texture && this.camera);
  }
  
}