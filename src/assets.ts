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
    let rawSheet = {} as any;


    const sheet = new Tilesheet(sheetJson);
    store.tilesheets[sheet.id] = sheet;
  }

  export function loadGameMap(mapJson: any){
    const map = new GameMap(mapJson);
    
    store.maps[map.id] = map;
  }

  export function loadTexture(id: string, path: string){
    const bitmap = loadBitmap(path);
    const texture = new Texture(id, bitmap);

    store.textures[texture.id] = texture;
  }

  export async function loadAssetFromFile(assetType: AssetType): Promise<string | null> {
    let contentType = '';
    
    switch(assetType){
      case AssetType.Tilesheet:
      case AssetType.Map:
        contentType = 'json';
        break;
      case AssetType.Texture:
        contentType = 'png';
        break;
      default:
        contentType = 'json';
        break;
    }

    let rawAsset = await readFile(contentType);
    
    if (rawAsset === null){
      return null;
    }

    // Get file extension and check that it matches contentType
    const extIdx = rawAsset.name.lastIndexOf('.');
    const fileExt = rawAsset.name.substring(extIdx + 1);
    if (fileExt !== contentType){
      return null;
    }
    
    let assetJson;
    let assetId;
    if (contentType === 'json'){
      assetJson = JSON.parse(rawAsset.content);
      assetId = assetJson.id;
    }
    
    switch(assetType){
      case AssetType.Tilesheet:
        loadTilesheet(assetJson);
        break;
      case AssetType.Map:
        loadGameMap(assetJson);
        break;
      case AssetType.Texture:
        // @TODO: Textures must be in TilemapEditors assets/textures folder, should be able to pick from elsewhere
        assetId = rawAsset.name.substring(0, extIdx);
        const path = `assets/textures/${rawAsset.name}`;
        loadTexture(assetId, path);
        break;
      default:
        contentType = 'json';
        break;
    }

    return assetId;
  }

  async function readFile(contentType: string): Promise<any> {
    const pickerOpts = {
      types: [
        {
          accept: {
            'application/*': [`.${contentType}`]
          }
        },
      ],
      excludeAcceptAllOption: true,
      multiple: false
    };

    let fileHandle;
    try {
      // @ts-ignore
      [fileHandle] = await showOpenFilePicker(pickerOpts);

      const file = await fileHandle.getFile();
      const content = await file.text();

      return {
        name: file.name,
        content
      };
    } catch(ex) {
      // User closed out without selecting file
      return null;
    }
  }
}
