import { Vector } from "./primitives";
import { Rendering } from "./rendering";

export namespace Assets{

  export enum AssetType{
    Texture,
    GameMap,
    Tilesheet,
    Spritesheet
  }

  export type Store = {
    textures: { [id: string]: Texture },
    tilesheets: { [id: string]: Tilesheet },
    spritesheets: { [id: string]: Spritesheet }
  };

  export type Texture = {
    id: string;
    bitmap: Rendering.Bitmap;  
  }

  export type GameMap = {
    id: string;
    name: string;
    tilemap: any;
    entities: any;
  }

  export type Tilesheet = {
    id: string;
    textureId: string;
    clipSize: number;
    nCells: number;
    cellsPerRow: number;
    solidMap: number[];
    effectMap: number[];
    animatedMap: number[];
    tileAnimations: Map<number, number[]>;
  }

  export type Spritesheet = {
    id: string;
    name: string;
    dimensions: Vector;
    clipSize: Vector;
    scaleFactor: number;
    animations: any;
  }

  export function createTexture(id: string, path: string): Assets.Texture {
    const bitmap = Rendering.createBitmap(path);
    const texture = { id, bitmap };
    return texture;
  }
}
