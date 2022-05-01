import { Assets } from './assets';
import { Vector, Rect } from './primitives';
//import { Sprite } from './sprites';

export namespace Rendering{
  export type Bitmap = {
    dimensions: Vector,
    image: HTMLImageElement
  };

  export function createBitmap(path: string): Bitmap {
    const image = new Image();
    image.src = path;
    
    return {
      dimensions: { x: image.width, y: image.height },
      image
    };
  }
  
  export class RenderContext{
  
    nativeContext: CanvasRenderingContext2D;
    resolution: Vector;
  
    constructor(context: CanvasRenderingContext2D, resolution: Vector){
      this.nativeContext = context;
      this.resolution = resolution;
    }

    setFillColor(colorId: string): void {
      this.nativeContext.fillStyle = colorId;
    }

    setStrokeWeight(strokeWeight: number): void {
      this.nativeContext.lineWidth = strokeWeight;
    }

    setStrokeColor(colorId: string): void {
      this.nativeContext.strokeStyle = colorId;
    }

    drawPixel(pos: Vector): void {
      this.nativeContext.fillRect(pos.x, pos.y, 1, 1);
    }

    drawLine(start: Vector, end: Vector): void {
      this.nativeContext.beginPath();
      this.nativeContext.moveTo(start.x, start.y);
      this.nativeContext.lineTo(end.x, end.y);
      this.nativeContext.stroke();
    }

    fillRect(rect: Rect, opacity?: number){
      if (opacity && (opacity >= 0 && opacity <= 1)){
        this.nativeContext.globalAlpha = opacity;
      }
    
      this.nativeContext.fillRect(rect.x, rect.y, rect.w, rect.h);
    
      this.nativeContext.globalAlpha = 1.0;
    }

    strokeRect(rect: Rect){
      this.nativeContext.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }

    renderBitmap(bitmap: Bitmap, src: Rect, dst: Rect){
      this.nativeContext.drawImage(
        bitmap.image,
        src.x, src.y, src.w, src.h,
        dst.x, dst.y, dst.w, dst.h)
    }

    renderText(text: string, size:number, pos: Vector){
      this.nativeContext.font = `${size}px myfont`;
      this.nativeContext.fillText(text, pos.x, pos.y);
    }
  }
}
