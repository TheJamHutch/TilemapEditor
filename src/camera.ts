import { Vector } from './primitives';

export class Camera{
  world: Vector;
  worldBounds: Vector;
  view: Vector;
  velocity: Vector
  moveSpeed: number;

  constructor(resolution: Vector, mapRes: Vector, initPos: Vector){
    this.world = initPos;
    this.worldBounds = mapRes;
    this.view = resolution;
    this.velocity = { x: 0, y: 0 };
    this.moveSpeed = 3;
  }

  update(){
    // Check world bounds
    if ((this.velocity.x < 0 && this.world.x <= 0) || ( this.velocity.x > 0 && this.world.x + this.view.x > this.worldBounds.x)){
      this.velocity.x = 0;
    }
    if ((this.velocity.y < 0 && this.world.y <= 0) || ( this.velocity.y > 0 && this.world.y + this.view.y > this.worldBounds.y)){
      this.velocity.y = 0;
    }

    this.world.x += this.moveSpeed * this.velocity.x;
    this.world.y += this.moveSpeed * this.velocity.y;
  }

  worldToView(world: Vector){
    return {
      x: world.x - this.world.x,
      y: world.y - this.world.y
    };
  }
}
