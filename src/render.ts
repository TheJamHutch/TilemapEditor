import { Vector, Rect } from './primitives';

export namespace Rendering{
  
}

export enum RenderMode{
  Stroke, Fill
};
  
export type Bitmap = {
  resolution: Vector,
  image: HTMLImageElement
};
  
export function loadBitmap(path: string): Bitmap {
  const image = new Image();
  image.src = path;
  
  return {
    resolution: { x: image.width, y: image.height },
    image
  };
}
  
export function drawLine(context: CanvasRenderingContext2D, start: Vector, end: Vector){
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
}
  
export function drawRect(context: CanvasRenderingContext2D, rect: Rect, mode: RenderMode = RenderMode.Stroke){
  if (mode === RenderMode.Stroke){
    context.strokeRect(rect.x, rect.y, rect.w, rect.h);
  } else if (mode === RenderMode.Fill){
    context.fillRect(rect.x, rect.y, rect.w, rect.h);
  }
}
  
export function drawBitmap(context: CanvasRenderingContext2D, bitmap: Bitmap, src: Rect, dst: Rect){
  context.drawImage(bitmap.image, 
    src.x, src.y, src.w, src.h,
    dst.x, dst.y, dst.w, dst.h);
}

export class RenderContext{
  resolution: Vector;
  context: CanvasRenderingContext2D;
  
  constructor(resolution: Vector, context: CanvasRenderingContext2D){
    this.resolution = resolution;
    this.context = context;
  }
}
