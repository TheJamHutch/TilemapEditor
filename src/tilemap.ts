import * as _ from 'lodash';
import { Vector, Rect } from './primitives';
import { Camera } from './camera';
import { Bitmap, loadBitmap, drawBitmap } from './render';
import { setClip } from './util';
import { Global } from './global';
import { Assets } from './assets';

export enum TileEffect {
  None = 0,
  Hurt,
  Teleport,
  Transition
}

export type Tile = {
  solid: boolean;
  effect: number;
};

export class WorldMap{
  resolution: Vector;
  tilemap: Tilemap;

  constructor(map: any){
    this.tilemap = new Tilemap(map.tilemap);
    this.resolution = { 
      x: this.tilemap.dimensions.x * this.tilemap.tileSize,
      y: this.tilemap.dimensions.y * this.tilemap.tileSize
    };
  }

  saveTilemap(): any {
    let saveMap = {
      dimensions: this.tilemap.dimensions,
      layers: [] as any[]
    }

    for (let layer of this.tilemap.layers){
      saveMap.layers.push(layer);
    }

    return saveMap;
  }

  getTilePos(worldPos: Vector): Vector {
    return {
      x: Math.floor(worldPos.x / this.tilemap!.tileSize),
      y: Math.floor(worldPos.y / this.tilemap!.tileSize)
    };
  }

  setTile(worldPos: Vector, tileType: number){
    const tilePos = this.getTilePos(worldPos);
    this.tilemap!.setTile(tilePos, tileType)
  }
}

export class Tilemap{
  // The original tile size before zoom
  tileSize: number;

  layers: TilemapLayer[];
  dimensions: Vector;

  constructor(map: any){
    this.tileSize = 32; // @ TODO: HARDCODED
    this.dimensions = map.dimensions;
    this.layers = [];
    this.layers.push(new TilemapLayer(map.layers[0], this.dimensions));
  }

  setTile(pos: Vector, tileType: number){
    const idx = (pos.y * this.dimensions.x) + pos.x;
    this.layers[0].tiles[idx] = tileType;
  }

  addLayer(layer: { tilesheetId: string, tiles: number[] }){
    this.layers.push(new TilemapLayer(layer, this.dimensions));
  }
}

export class TilemapLayer{
  tilesheetId: any;
  tiles: number[];

  constructor(layer: { tilesheetId: string, tiles: number[] }, dimensions: Vector){
    this.tilesheetId = layer.tilesheetId;
    this.tiles = [];

    const nTiles = dimensions.x * dimensions.y;
    for (let i = 0; i < nTiles; i++)
    {
      if (!layer.tiles || layer.tiles.length === 0){
        this.tiles[i] = 0;
        continue;
      }
        
      if (layer.tiles[i] !== undefined){
        this.tiles[i] = layer.tiles[i];
      }
    }
  }
}

export function renderTilemap(tilemap: Tilemap, context: CanvasRenderingContext2D, camera: Camera): void {
  //
  const inView = {
    x: camera.view.x / tilemap.tileSize,
    y: camera.view.y / tilemap.tileSize
  };
  // 
  const start = {
    x: Math.floor(camera.world.x / tilemap.tileSize),
    y: Math.floor(camera.world.y / tilemap.tileSize)
  };
  const end = {
    x: (tilemap.dimensions.x > inView.x) ? start.x + inView.x + 1 : tilemap.dimensions.x, 
    y: (tilemap.dimensions.y > inView.y) ? start.y + inView.y + 1 : tilemap.dimensions.y
  };
  // @TODO: Restore offset
  /*
  const scrollsX = (layer.resolution.x > camera.view.x);
  const scrollsY = (layer.resolution.y > camera.view.y);
  const offset = {
    x: (!scrollsX) ? (camera.view.x / 2) - (layer.resolution.x / 2) : 0,
    y: (!scrollsY) ? ((camera.view.y) / 2) - (layer.resolution.y / 2) : 0
  };*/
  
  for (let y = start.y; y < end.y; y++)
  {
    for (let x = start.x; x < end.x; x++)
    {
      const tileIdx = (y * tilemap.dimensions.x) + x;
      for (let layer of tilemap.layers){
        const foundTile: boolean = (layer.tiles[tileIdx] !== undefined);
        if (foundTile){
          const sheet = Assets.store.tilesheets[layer.tilesheetId];
          const texture = Assets.store.textures[sheet.textureId];

          const clip = setClip(layer.tiles[tileIdx], sheet.clipSize, sheet.dimensions);
          const view = new Rect({ x: 0, y: 0, w: tilemap.tileSize, h: tilemap.tileSize });
          view.x = ((x * tilemap.tileSize) - camera.world.x);
          view.y = ((y * tilemap.tileSize) - camera.world.y);

          // @ TODO: Global access
          
          drawBitmap(context, texture.bitmap, clip, view);
        }
      }
    }
  }
}
