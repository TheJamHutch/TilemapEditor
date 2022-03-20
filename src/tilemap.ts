import * as _ from 'lodash';
import { Vector, Rect } from './primitives';
import { Camera } from './camera';
import { Bitmap, loadBitmap, drawBitmap } from './render';
import { setClip } from './util';

export enum TileEffect {
  None = 0,
  Hurt,
  Teleport,
  Transition
}

export type Tile = {
  texture: number;
  solid: boolean;
  effect: number;
  dest?: Rect;
};

export class Tilemap{
  // The original tile size before zoom
  tileSize: number;
  // Size of tile with zoom applied
  tileViewSize: number;
  dimensions: Vector;
  resolution: Vector;
  tiles: Tile[];

  constructor(dimensions: Vector, tiles: Tile[]){
    this.tileSize = 32; // @TODO: Hardcoded
    this.tileViewSize = this.tileSize;
    this.dimensions = dimensions;
    this.resolution = { 
      x: this.dimensions.x * this.tileViewSize,
      y: this.dimensions.y * this.tileViewSize
    };
    this.tiles = [];
  
  
    // Insert tiles from param=============
  
    const nTiles = dimensions.x * dimensions.y;
      
    let blankMap = false;
    const blankTile = { texture: 0, solid: false, effect: 0, dest: undefined } as any;
    if (!tiles || tiles.length === 0){
      blankMap = true;
    }
    for (let i = 0; i < nTiles; i++)
    {
      if (blankMap){
        this.tiles[i] = blankTile;
      } else {
        if (i < tiles.length){
          this.tiles[i] = tiles[i];
        } else {
          this.tiles[i] = blankTile;
        }
      }
    }
  }

  setTile(tile: Tile, pos: Vector){
    const idx = (pos.y * this.dimensions.x) + pos.x;
    this.tiles[idx] = tile;
  }

  getTile(pos: Vector): Tile {
    const idx = (pos.y * this.dimensions.x) + pos.x;
    return this.tiles[idx];
  }

  changeTileViewSize(tileSize: number): void {
    this.tileViewSize = tileSize;
    this.resolution = { 
      x: this.dimensions.x * this.tileViewSize,
      y: this.dimensions.y * this.tileViewSize
    };
  }
}

export function renderTilemap(tilemap: Tilemap, context: CanvasRenderingContext2D, camera: Camera, sheet: any, texture: Bitmap): void {
  //
  const inView = {
    x: camera.view.x / tilemap.tileViewSize,
    y: camera.view.y / tilemap.tileViewSize
  };
  // 
  const start = {
    x: Math.floor(camera.world.x / tilemap.tileViewSize),
    y: Math.floor(camera.world.y / tilemap.tileViewSize)
  };
  const end = {
    x: (tilemap.dimensions.x > inView.x) ? start.x + inView.x + 1 : tilemap.dimensions.x, 
    y: (tilemap.dimensions.y > inView.y) ? start.y + inView.y + 1 : tilemap.dimensions.y
  };

  
  // @TODO: Restore offset
  /*
  const scrollsX = (tilemap.resolution.x > camera.view.x);
  const scrollsY = (tilemap.resolution.y > camera.view.y);
  const offset = {
    x: (!scrollsX) ? (camera.view.x / 2) - (tilemap.resolution.x / 2) : 0,
    y: (!scrollsY) ? ((camera.view.y) / 2) - (tilemap.resolution.y / 2) : 0
  };*/

  let clip = new Rect({ x: 0, y: 0, w: sheet.clipSize, h: sheet.clipSize });
  let dest = new Rect({ x: 0, y: 0, w: tilemap.tileViewSize, h: tilemap.tileViewSize });
  for (let y = start.y; y < end.y; y++)
  {
    for (let x = start.x; x < end.x; x++)
    {
      const tileIdx = (y * tilemap.dimensions.x) + x;
      const foundTile: boolean = (tilemap.tiles[tileIdx] !== undefined);
      if (foundTile){
        clip = setClip(tilemap.tiles[tileIdx].texture, sheet.clipSize, sheet.dimensions);
        dest.x = ((x * tilemap.tileViewSize) - camera.world.x);
        dest.y = ((y * tilemap.tileViewSize) - camera.world.y);

        drawBitmap(context, texture, clip, dest);
      }
    }
  }
}
