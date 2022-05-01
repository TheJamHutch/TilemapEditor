import { Vector } from './primitives';
import { Tilemaps } from './tilemap';

export class Camera{
  world: Vector;
  view: Vector;
  velocity: Vector
  moveSpeed: number;
  maxZoom: number
  zoomLevel: number;
  tilemap: Tilemaps.Tilemap;

  constructor(resolution: Vector, tilemap: Tilemaps.Tilemap, initPos: Vector){
    this.world = initPos;
    this.tilemap = tilemap;
    this.view = resolution;
    this.velocity = { x: 0, y: 0 };
    this.moveSpeed = 10;

    this.maxZoom = 20;
    this.zoomLevel = 0;
  }

  update(){
    // Check world bounds
    if ((this.velocity.x < 0 && this.world.x <= 0) || ( this.velocity.x > 0 && this.world.x + this.view.x > this.tilemap.resolution.x)){
      this.velocity.x = 0;
    }
    if ((this.velocity.y < 0 && this.world.y <= 0) || ( this.velocity.y > 0 && this.world.y + this.view.y > this.tilemap.resolution.y)){
      this.velocity.y = 0;
    }

    this.world.x += this.moveSpeed * this.velocity.x;
    this.world.y += this.moveSpeed * this.velocity.y;
  }

  worldToView(world: Vector): Vector {
    return {
      x: world.x - this.world.x,
      y: world.y - this.world.y
    };
  }

  viewToWorld(view: Vector): Vector {
    return {
      x: view.x + this.world.x,
      y: view.y + this.world.y
    }
  }

  zoomIn(): void {
    if (this.zoomLevel < this.maxZoom){
      this.zoomLevel += 1;
    }
  }

  zoomOut(): void {

  }

  /*
  private zoomIn(){
    const maxZoom = 20;
    if (this.zoomLevel < maxZoom){
      this.zoomLevel += 2;
      this.tilemap!.changeTileViewSize(this.tilemap!.tileSize + this.zoomLevel);
      this.cursor.w = this.tilemap!.tileViewSize;
      this.cursor.h = this.tilemap!.tileViewSize;
    }
  }

  private zoomOut(){
    const minZoom = -20;
    if (this.zoomLevel > minZoom){
      this.zoomLevel -= 2;
      this.tilemap!.changeTileViewSize(this.tilemap!.tileSize + this.zoomLevel);
      this.cursor.w = this.tilemap!.tileViewSize;
      this.cursor.h = this.tilemap!.tileViewSize;
    }
  }*/
}
