import { Vector } from "./primitives";
import { Bitmap, loadBitmap } from "./render";

export namespace Assets{

  export const store = {
    textures: {},
    tilesheets: {},
    maps: {}
  } as any;
    
  export enum AssetType{
    Tilesheet,
    Map,
    Texture
  };

  export interface Asset{
    id: string;
    type: AssetType;
  };

  export class Tilesheet implements Asset {
    id: string;
    type: AssetType;
    textureId: string;
    clipSize: number;
    dimensions: Vector;
    solidMap: number[];
    effectMap: number[];

    constructor(sheet: any){
      this.id = sheet.id;
      this.type = sheet.type;
      this.textureId = sheet.textureId;
      this.clipSize = sheet.clipSize;
      this.dimensions = sheet.dimensions;
      this.solidMap = sheet.solidMap;
      this.effectMap = sheet.effectMap;
    }
  }

  export class GameMap implements Asset {
    id: string;
    type: AssetType;
    tilemap: any;
    entities: any;
    
    constructor(map: any){
      this.id = map.id;
      this.type = map.type;
      this.tilemap = map.tilemap;
      this.entities = map.entities;
    }
  }

  export class Texture implements Asset {
    id: string;
    type: AssetType;
    bitmap: Bitmap;

    constructor(id: string, bitmap: Bitmap){
      this.id = id;
      this.type = AssetType.Texture;
      this.bitmap = bitmap;
    }
  }

  export function loadTilesheet(sheetJson: any){
    // Check sheetJson properties
    const sheet = new Tilesheet(sheetJson);

    store.tilesheets[sheet.id] = sheet;
  }

  export function loadGameMap(mapJson: any){
    const map = new GameMap(mapJson);
    
    store.maps[map.id] = map;
  }

  export function loadTexture(id: string, imgPath: string){
    const bitmap = loadBitmap(imgPath);
    const texture = new Texture(id, bitmap);

    store.textures[texture.id] = texture;
  }
  
  export async function readFileText(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
  
      reader.onload = (() => {
        resolve(reader.result);
      });
  
      reader.onerror = reject;
  
      reader.readAsText(file);
    });
  }
}
