import { Vector } from "./primitives";
import { Rendering } from "./rendering";
import { Tiling } from "./tilemap";
import { v4 as uuid } from 'uuid';

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
    spritesheets: { [id: string]: Spritesheet },
    maps: { [id: string]: GameMap },
    data: { [id: string]: any }
  };

  export type Texture = {
    id: string;
    bitmap: Rendering.Bitmap;  
  }

  export type GameMap = {
    id: string;
    name: string;
    tilemap: any;
    entities: any[];
  }

  export type Tilesheet = {
    id: string;
    name: string;
    texture: Texture;
    clipSize: number;
    nCells: number;
    cellsPerRow: number;

    // @TODO: Stronger typing for tileData
    tileData: any;
  }

  export type Spritesheet = {
    id: string;
    name: string;
    dimensions: Vector;
    clipSize: Vector;
    scaleFactor: number;
    animations: any;
  }

  export function generateID(): string {
    return uuid();
  }

  export function createTexture(id: string, path: string): Assets.Texture {
    const bitmap = Rendering.createBitmap(path);
    const texture = { id, bitmap };
    return texture;
  }
}
