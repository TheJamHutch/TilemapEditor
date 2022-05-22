import { Vector, Rect } from './primitives';

export enum CameraDirection{
  None,
  North,
  East,
  South,
  West
}

export class Camera{
  world: Rect;
  view: Rect;
  velocity: Vector;
  worldBounds: Vector;
  moveSpeed = 6;
  scrollsX: boolean;
  scrollsY: boolean;

  constructor(resolution: Vector, mapRes: Vector){
    this.world = new Rect({ x: 1, y: 1, w: mapRes.x, h: mapRes.y });
    this.velocity = { x: 0, y: 0 };
  
    this.scrollsX = (resolution.x < mapRes.x);
    this.scrollsY = (resolution.y < mapRes.y);
    const offset = {
      x: (!this.scrollsX) ? (resolution.x / 2) - (mapRes.x / 2) : 0,
      y: (!this.scrollsY) ? ((resolution.y) / 2) - (mapRes.y / 2) : 0
    };
    this.view = new Rect({
      x: offset.x,
      y: offset.y,
      w: resolution.x,
      h: resolution.y
    });
    this.worldBounds = mapRes;
  }

  update(): void {
    // Check world bounds
    if ((this.velocity.x < 0 && this.world.x <= 0) || ( this.velocity.x > 0 && this.world.x + this.view.w > this.worldBounds.x)){
      this.velocity.x = 0;
    }
    if ((this.velocity.y < 0 && this.world.y <= 0) || ( this.velocity.y > 0 && this.world.y + this.view.h > this.worldBounds.y)){
      this.velocity.y = 0;
    }

    if (this.scrollsX){
      this.world.x += this.moveSpeed * this.velocity.x;
    }
    if (this.scrollsY){
      this.world.y += this.moveSpeed * this.velocity.y;
    }
  }

  worldToView(world: Vector): Vector {
    return {
      x: (world.x - this.world.x),
      y: (world.y - this.world.y)
    };
  }

  viewToWorld(view: Vector): Vector {
    return {
      x: (view.x + this.world.x) - this.view.x,
      y: (view.y + this.world.y) - this.view.y
    }
  }
}

export function worldToView(camera: Camera, world: Rect): Rect {
  // @TODO: Clamp offscreen values to just outside the view???
  return new Rect({
    x: camera.view.x + (world.x - camera.world.x),
    y: camera.view.y + (world.y - camera.world.y),
    w: world.w,
    h: world.h
  });
}
