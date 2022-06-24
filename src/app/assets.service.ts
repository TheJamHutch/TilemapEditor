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
    textures: ['basetiles', 'glass', 'glass_night', 'toptiles', 'villager', 'slime', 'player', 'terrain'],
    maps: [ ],
    tilesheets: [ 'terrain' ],
    spritesheets: ['player', 'slime', 'villager'],
    data: ['archetypes']
  };

  store: Assets.Store;

  constructor(private eventBus: EventBusService) {}

  // Load order: Textures, Tilesheets, Spritesheet, Maps, other data.
  async loadAll(){
    this.store = {
      textures: {},
      tilesheets: {},
      spritesheets: {},
      maps: {},
      data: {}
    } as any;

    await this.loadAllTextures();
    await this.loadAllTilesheets(this.store.textures);
    await this.loadAllSpritesheets();
    await this.loadAllMaps(this.store.tilesheets);

    this.eventBus.raise(EventType.AssetsUpdate);
  }

  exportJson(name: string, obj: any): void {
    const json = JSON.stringify(obj);
    const a = document.createElement('a');
    a.href = `data:application/json;charset=utf-8,${json}`;
    a.download = `${name}.json`;
    a.click();
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
        this.loadTilesheet(assetJson, this.store.textures);
        break;
      case Assets.AssetType.Spritesheet:
        //const spritesheet = Object.assign({}, assetJson);
        //this.store.spritesheets[tilesheet.id] = spritesheet;
        break;
      case Assets.AssetType.GameMap:
        this.loadGameMap(assetJson, this.store.tilesheets);
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

    this.eventBus.raise(EventType.AssetsUpdate);

    return assetId;
  }

  loadTilesheet(rawTilesheet: any, textures: { [ id: string ]: Assets.Texture }): void {
    // @TODO: Check tilesheet properties

    const tilesheet = Object.assign({}, rawTilesheet);
    tilesheet.texture = textures[rawTilesheet.textureId];
    this.store.tilesheets[tilesheet.id] = tilesheet;
  }

  loadGameMap(rawMap: any, tilesheets: { [ id: string ]: Assets.Tilesheet }){
    // @TODO: Check game map properties

    const gameMap = Object.assign({}, rawMap);
    for (let layer of gameMap.tilemap.layers){
      const tilesheet = tilesheets[layer.tilesheetId];
      layer.tilesheet = tilesheet;
    }
    
    this.store.maps[gameMap.id] = gameMap;
  }

  private async loadAllTextures(): Promise<void> {
    const ext = '.png';

    for (let fileName of this.assetFiles.textures){
      try{
        const url = this.assetFolders.textures + fileName + ext;
        
        const texture = Assets.createTexture(fileName, url);
        
        this.store.textures[texture.id] = texture;
      } catch(ex){
        console.warn(`Failed to load texture asset: ${fileName}${ext}`);
      }
    }
  }

  private async loadAllTilesheets(textures: { [ id: string ]: Assets.Texture }): Promise<void> {
    const ext = '.json';

    for (let fileName of this.assetFiles.tilesheets){
      try{
        const url = this.assetFolders.tilesheets + fileName + ext;
        
        const rawJson = await this.fetchFileJson(url);

        this.loadTilesheet(rawJson, textures)
      } catch(ex){
        console.warn(`Failed to load tilesheet asset: ${fileName}${ext}`);
      }
    }
  }

  private async loadAllSpritesheets(): Promise<void> {
    const ext = '.json';

    for (let fileName of this.assetFiles.spritesheets){
      try{
        const url = this.assetFolders.spritesheets + fileName + ext;
        const rawJson = await this.fetchFileJson(url);

        const spritesheet = Object.assign({}, rawJson);
        
        this.store.spritesheets[spritesheet.id] = spritesheet;
      } catch(ex){
        console.warn(`Failed to load spritesheet asset: ${fileName}${ext}`);
      }
    }
  }

  private async loadAllMaps(tilesheets: { [ id: string ]: Assets.Tilesheet }): Promise<void> {
    const ext = '.json';

    for (let fileName of this.assetFiles.maps){
      try{
        const url = this.assetFolders.maps + fileName + ext;
        const rawJson = await this.fetchFileJson(url);

        this.loadGameMap(rawJson, tilesheets);
      } catch(ex){
        console.warn(`Failed to load map asset: ${fileName}${ext}`);
      }
    }
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
