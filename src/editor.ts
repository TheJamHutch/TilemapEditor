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
  tilesheet: any;
  assets: any;
  mapDimensions: Vector;

  texture?: Bitmap;
  tilemap?: Tilemap;
  camera?: Camera;

  constructor(events: Events, context: CanvasRenderingContext2D, config: any, assets: any){
    this.events = events;
    this.context = context;
    this.resolution = config.resolution;
    this.assets = assets;
    this.cursor = new Rect({ x: 0, y: 0, w: config.tileSize, h: config.tileSize });
    this.selectedTile = 0;
    
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
    if (!this.camera || !this.tilemap || !this.tilesheet || !this.texture){
      return;
    }
    
    this.camera.update();
    this.render();
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

  onKeyDown(keycode: string): void {
    if (!this.camera){
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
    }
  }

  onKeyUp(keycode: string): void {
    if (!this.camera){
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
    }
  }

  onMouseMove(mousePos: Vector): void {
    this.setCursorPosition(mousePos);
  }

  onMouseDown(mousePos: Vector): void {
    if (!this.tilemap){
      return;
    }

    this.setCursorPosition(mousePos);
  
    if ((this.cursor.x < this.tilemap.resolution.x) && (this.cursor.y < this.tilemap.resolution.y)){
      // Update tile
      const tileIdx = posToIndex(this.viewToWorld(this.cursor), this.tilemap.dimensions);
      const solid = (this.tilesheet.solidMap[this.selectedTile] === 1);
      const effect = this.tilesheet.effectMap[this.selectedTile];
      this.tilemap.tiles[tileIdx] = { texture: this.selectedTile, solid, effect };
    }
  }

  onMouseUp(mousePos: Vector){
    
  }

  private loadTilesheet(sheet: any){
    this.tilesheet = sheet;
    this.texture = this.assets.textures[sheet.textureId];
  }

  private setCursorPosition(mousePos: Vector): void {
    if (!this.tilemap || !this.camera){
      return;
    }

    this.cursor.x = (mousePos.x - (mousePos.x % this.tilemap.tileSize)) - (this.camera.world.x % this.tilemap.tileSize);
    this.cursor.y = (mousePos.y - (mousePos.y % this.tilemap.tileSize)) - (this.camera.world.y % this.tilemap.tileSize);
  }

  private viewToWorld(view: Vector): Vector {
    if (!this.tilemap || !this.camera){
      return { x: -1, y: -1 };
    }

    return {
      x: Math.floor(view.x / this.tilemap.tileSize) + Math.ceil(this.camera.world.x / this.tilemap.tileSize),
      y: Math.floor(view.y / this.tilemap.tileSize) + Math.ceil(this.camera.world.y / this.tilemap.tileSize)
    };
  }

  private render(): void {
    drawRect(this.context, new Rect({ x: 0, y: 0, w: this.resolution.x, h: this.resolution.y }), RenderMode.Fill)

    renderTilemap(this.tilemap as Tilemap, this.context, this.camera as Camera, this.tilesheet, this.texture as Bitmap);

    this.context.strokeStyle = 'yellow';
    this.context.lineWidth = 4;
    drawRect(this.context, this.cursor);
  }
  
}