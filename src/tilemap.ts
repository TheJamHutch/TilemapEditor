import * as _ from 'lodash';
import { Vector, Rect } from './primitives';
import { Camera } from './camera';
import { Bitmap, loadBitmap, drawBitmap } from './render';
import { setClip } from './util';
import { Assets } from './assets';

export namespace Tilemaps{
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
  
  export class Tilemap{
    // The original tile size before zoom
    tileSize: number;
  
    layers: TilemapLayer[];
    dimensions: Vector;
    resolution: Vector;
  
    constructor(map: any){
      this.tileSize = 32; // @ TODO: HARDCODED
      this.dimensions = map.dimensions;
      this.layers = [];

      for (let layer of map.layers){
        this.layers.push(new TilemapLayer(layer, this.dimensions));
      }
  
      this.resolution = { 
        x: this.dimensions.x * this.tileSize,
        y: this.dimensions.y * this.tileSize
      };
    }
  
    setTile(layerIdx: number, pos: Vector, tileType: number){
      const idx = (pos.y * this.dimensions.x) + pos.x;
      this.layers[layerIdx].tiles[idx] = tileType;
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
          this.tiles[i] = -1;
          continue;
        }
          
        if (layer.tiles[i] !== undefined){
          this.tiles[i] = layer.tiles[i];
        }
      }
    }
  }

  export function worldToTile(tilemap: Tilemap, worldPos: Vector): Vector {
    return {
      x: Math.floor(worldPos.x / tilemap.tileSize),
      y: Math.floor(worldPos.y / tilemap.tileSize)
    };
  }
                                                                                                    // @TODO: Make topLayeridx part of tilemap ??
  export function renderTilemap(tilemap: Tilemap, context: CanvasRenderingContext2D, camera: Camera, topLayerIdx: number): void {
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
        for (let i = 0; i <= topLayerIdx; i++){
          const layer = tilemap.layers[i];
          const foundTile: boolean = (layer.tiles[tileIdx] !== undefined);
          if (foundTile){
            if (layer.tiles[tileIdx] > -1){
              const sheet = Assets.store.tilesheets[layer.tilesheetId];
              const texture = Assets.store.textures[sheet.textureId];
              
              const clip = setClip(layer.tiles[tileIdx], sheet.clipSize, sheet.dimensions);
              const view = new Rect({ x: 0, y: 0, w: tilemap.tileSize, h: tilemap.tileSize });
              view.x = ((x * tilemap.tileSize) - camera.world.x);
              view.y = ((y * tilemap.tileSize) - camera.world.y);
              
              drawBitmap(context, texture.bitmap, clip, view);
            }
          }
        }
      }
    }
  }
  
}
