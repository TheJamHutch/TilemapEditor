import { Injectable } from '@angular/core';
import { Assets } from './core/assets';
import { EventBusService, EventType } from './event-bus.service';

@Injectable({
  providedIn: 'root'
})
export class AssetsService {

  readonly assetFolders = {
    textures: 'assets/textures/',
    maps: 'assets/maps/',
    tilesheets: 'assets/tilesheets/',
    spritesheets: 'assets/spritesheets/',
    data: 'assets/data/'
  };
  readonly assetFiles = {
    textures: ['basetiles', 'glass', 'glass_night', 'toptiles', 'villager', 'slime', 'player'],
    maps: ['wretch', 'tesst', 'small', 'rev', 'empty', 'newone', 'daynight', 'tod'],
    tilesheets: ['basetiles', 'toptiles' ],
    spritesheets: ['player', 'slime', 'villager'],
    data: ['archetypes']
  };

  store: Assets.Store;

  constructor(private eventBus: EventBusService) {}

  async loadAll(){
    this.store = {
      textures: await this.loadAllTextures(),
      tilesheets: await this.loadAllTilesheets(),
      spritesheets: await this.loadAllSpritesheets()
    };
    this.eventBus.raise(EventType.AssetsChange);
  }

  async loadFromFile(assetType: Assets.AssetType): Promise<string | null> {
    let contentType = '';
    
    switch(assetType){
      case Assets.AssetType.Tilesheet:
      case Assets.AssetType.Spritesheet:
      case Assets.AssetType.GameMap:
        contentType = 'json';
        break;
      case Assets.AssetType.Texture:
        contentType = 'png';
        break;
      default:
        contentType = 'json';
        break;
    }

    let rawAsset = await this.readFile(contentType);
    
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
      case Assets.AssetType.Tilesheet:
        const tilesheet = Object.assign({}, assetJson);
        this.store.tilesheets[tilesheet.id] = tilesheet;
        break;
      case Assets.AssetType.Spritesheet:
        const spritesheet = Object.assign({}, assetJson);
        this.store.spritesheets[tilesheet.id] = spritesheet;
        break;
      case Assets.AssetType.GameMap:
        //loadGameMap(assetJson);
        break;
      case Assets.AssetType.Texture:
        // @TODO: Textures must be in TilemapEditors assets/textures folder, should be able to pick from elsewhere
        assetId = rawAsset.name.substring(0, extIdx);
        const path = `assets/textures/${rawAsset.name}`;
        //this.loadTexture(assetId, path);
        const texture = Assets.createTexture(assetId, path);
        if (!this.store.textures[texture.id]){
          this.store.textures[texture.id] = texture;
        } else {
          console.warn(`Asset ${assetId} already loaded`);
        }
        break;
      default:
        contentType = 'json';
        break;
    }

    this.eventBus.raise(EventType.AssetsChange);

    return assetId;
  }

  private async loadAllTextures(): Promise<any> {
    const ext = '.png';
    let textures = {};

    for (let fileName of this.assetFiles.textures){
      try{
        const url = this.assetFolders.textures + fileName + ext;
        
        const texture = Assets.createTexture(fileName, url);
        
        textures[texture.id] = texture;
      } catch(ex){
        console.warn(`Failed to load texture asset: ${fileName}${ext}`);
      }
    }

    return textures;
  }

  private async loadAllTilesheets(): Promise<any> {
    const ext = '.json';
    let tilesheets = {};

    for (let fileName of this.assetFiles.tilesheets){
      try{
        const url = this.assetFolders.tilesheets + fileName + ext;
        const rawJson = await this.fetchFileJson(url);

        const tilesheet = Object.assign({}, rawJson);
        
        tilesheets[tilesheet.id] = tilesheet;
      } catch(ex){
        console.warn(`Failed to load tilesheet asset: ${fileName}${ext}`);
      }
    }

    return tilesheets;
  }

  private async loadAllSpritesheets(): Promise<any> {
    const ext = '.json';
    let spritesheets = {};

    for (let fileName of this.assetFiles.spritesheets){
      try{
        const url = this.assetFolders.spritesheets + fileName + ext;
        const rawJson = await this.fetchFileJson(url);

        const spritesheet = Object.assign({}, rawJson);
        
        spritesheets[spritesheet.id] = spritesheet;
      } catch(ex){
        console.warn(`Failed to load spritesheet asset: ${fileName}${ext}`);
      }
    }

    return spritesheets;
  }

  private async fetchFileJson(url: string): Promise<any> {
    const res = await fetch(url);
    const rawJson = await res.json();
    return rawJson;
  }

  private async fetchFileText(url: string): Promise<string>{
    const res = await fetch(url);
    const rawData = await res.text();

    return rawData;
  }

  private async readFile(contentType: string): Promise<any> {
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
    } catch(err) {
      // User closed out without selecting file
      return null;
    }
  }
}
