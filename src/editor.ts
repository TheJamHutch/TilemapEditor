import _ from 'lodash';
import { Camera } from "./camera";
import { Tilemap, renderTilemap, Tile } from "./tilemap";
import { Vector, Rect } from "./primitives";
import { drawBitmap, Bitmap, drawRect, RenderMode } from "./render";
import { Events } from "./events";
import { posToIndex } from './util';

export class Editor{
  events: Events;
  tilemap: Tilemap;
  camera: Camera;
  context: CanvasRenderingContext2D;
  texture: Bitmap;
  resolution: Vector;
  selectedTile: number;
  cursor: Rect;
  tilesheet: any;

  constructor(events: Events, context: CanvasRenderingContext2D, resolution: Vector, config: any, assets: any){
    this.events = events;
    this.context = context;
    this.resolution = resolution;
    
    this.tilemap = new Tilemap(config.mapDimensions, []);
    this.camera = new Camera(this.resolution, this.tilemap.resolution, { x: 0, y: 0 });

    this.tilesheet = assets.tilesheets[config.tilesheetId];
    this.texture = assets.textures[this.tilesheet.textureId];

    this.cursor = new Rect({ x: 0, y: 0, w: this.tilemap.tileSize, h: this.tilemap.tileSize });

    this.selectedTile = 0;
    this.events.register('paletteSelect', (selectedTile: number) => {
      this.selectedTile = selectedTile;
    });
  }

  update(): void {
    this.camera.update();
    this.render();
  }

  newMap(dimensions: Vector): void {
    this.tilemap = new Tilemap(dimensions, []);
    this.camera = new Camera(this.resolution, this.tilemap.resolution, { x: 0, y: 0 });
  }

  saveMap(mapName: string): any {
    let saveTiles = this.tilemap.tiles.slice(0);
    
    return {
      name: mapName,
      dimensions: this.tilemap.dimensions,
      playerSpawn: { x: 0, y: 0 },
      tiles: saveTiles,
      enemies: []
    }
  }

  loadMap(mapObj: any){
    //this.tilemap = initTilemap(mapObj.dimensions, mapObj.tiles);
    //this.camera = new Camera(this.resolution, this.tilemap.resolution, { x: 0, y: 0 });
  }

  loadTilesheet(sheet: any){
    this.tilesheet = sheet;
  }

  onKeyDown(keycode: string): void {
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

  onMouseMove(mousePos: Vector){
    this.setCursorPosition(mousePos);
  }

  onMouseDown(mousePos: Vector){
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

  private setCursorPosition(mousePos: Vector): void {
    this.cursor.x = (mousePos.x - (mousePos.x % this.tilemap.tileSize)) - (this.camera.world.x % this.tilemap.tileSize);
    this.cursor.y = (mousePos.y - (mousePos.y % this.tilemap.tileSize)) - (this.camera.world.y % this.tilemap.tileSize);
  }

  private viewToWorld(view: Vector): Vector {
    return {
      x: Math.floor(this.cursor.x / this.tilemap.tileSize) + Math.ceil(this.camera.world.x / this.tilemap.tileSize),
      y: Math.floor(this.cursor.y / this.tilemap.tileSize) + Math.ceil(this.camera.world.y / this.tilemap.tileSize)
    };
  }

  private render(): void {
    drawRect(this.context, new Rect({ x: 0, y: 0, w: this.resolution.x, h: this.resolution.y }), RenderMode.Fill)

    renderTilemap(this.tilemap, this.context, this.camera, this.tilesheet, this.texture);

    this.context.strokeStyle = 'yellow';
    this.context.lineWidth = 4;
    drawRect(this.context, this.cursor);
  }
  
}