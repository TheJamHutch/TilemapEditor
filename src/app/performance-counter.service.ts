import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PerformanceCounterService {

  readonly maxFrames = 1000;
  frameCount = 0;
  fps = 60;  // @TODO: Calculate FPS properly

  constructor() { }

  increment(): void {
    this.frameCount++;

    if (this.frameCount > this.maxFrames){
      this.frameCount = 0;
    }
  }
}
