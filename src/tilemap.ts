import * as _ from 'lodash';
import { Vector, Rect } from './primitives';
import { Camera } from './camera';
import { Bitmap, loadBitmap, drawBitmap } from './render';
import { setClip } from './util';

export enum TileSize {
  Small = 8,
  Medium = 16,
  Large = 32
};

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

export type Tilemap = {
  tileSize: TileSize;
  dimensions: Vector;
  resolution: Vector;
  tiles: Tile[];
};

export function initTilemap(dimensions: Vector, tiles: Tile[]): Tilemap {
  let tilemap = {} as any;

  tilemap.tileSize = TileSize.Large;
  tilemap.dimensions = dimensions;
  tilemap.resolution = { 
    x: dimensions.x * tilemap.tileSize,
    y: dimensions.y * tilemap.tileSize
  };
  tilemap.tiles = [];


  // Insert tiles from param

  const nTiles = dimensions.x * dimensions.y;
    
  let blankMap = false;
  if (!tiles || tiles.length === 0 || tiles.length < nTiles){
    blankMap = true;
  }
  for (let i = 0; i < nTiles; i++)
  {
    if (blankMap){
      const blankTile = { texture: 0, solid: false, effect: 0, dest: undefined } as any;
      tilemap.tiles[i] = blankTile;
    } else {
      tilemap.tiles[i] = tiles[i];
    }
  }
  
  return tilemap;
}

export function renderTilemap(tilemap: Tilemap, context: CanvasRenderingContext2D, textureSheet: Bitmap, camera: Camera): void {
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
  const scrollsX = (tilemap.resolution.x > camera.view.x);
  const scrollsY = (tilemap.resolution.y > camera.view.y);
  const offset = {
    x: (!scrollsX) ? (camera.view.x / 2) - (tilemap.resolution.x / 2) : 0,
    y: (!scrollsY) ? ((camera.view.y) / 2) - (tilemap.resolution.y / 2) : 0
  };*/

  let clip = new Rect({ x: 0, y: 0, w: tilemap.tileSize, h: tilemap.tileSize });
  let dest = new Rect({ x: 0, y: 0, w: tilemap.tileSize, h: tilemap.tileSize });
  for (let y = start.y; y < end.y; y++)
  {
    for (let x = start.x; x < end.x; x++)
    {
      const tileIdx = (y * tilemap.dimensions.x) + x;
      const foundTile: boolean = (tilemap.tiles[tileIdx] !== undefined);
      if (foundTile){
        clip = setClip(tilemap.tiles[tileIdx].texture, tilemap.tileSize, { x: 6, y: 6 }/* TODO: REPLACE! */);
        dest.x = ((x * tilemap.tileSize) - camera.world.x);
        dest.y = ((y * tilemap.tileSize) - camera.world.y);

        drawBitmap(context, textureSheet, clip, dest);
      }
    }
  }
}

// Calculate view tiles during render?
export function tilesInView(tilemap: Tilemap, camera: Camera): Tile[] {
  let viewTiles = [];

  const start = {
    x: Math.floor(camera.world.x / tilemap.tileSize),
    y: Math.floor(camera.world.y / tilemap.tileSize)
  };
  const inView = {
    x: camera.view.x / tilemap.tileSize,
    y: camera.view.y / tilemap.tileSize
  };
  const end = {
    x: (tilemap.dimensions.x > inView.x) ? start.x + inView.x + 1 : tilemap.dimensions.x, 
    y: (tilemap.dimensions.y > inView.y) ? start.y + inView.y + 1 : tilemap.dimensions.y
  };

  for (let y = start.y; y < end.y; y++)
  {
    for (let x = start.x; x < end.x; x++)
    {
      const c = (y * tilemap.dimensions.x) + x;
      const worldTile = tilemap.tiles[c];
      worldTile.dest = new Rect({ 
        x: x * tilemap.tileSize, 
        y: y * tilemap.tileSize, 
        w: tilemap.tileSize, 
        h: tilemap.tileSize
      });

      viewTiles.push(worldTile);

    }
  }

  return viewTiles;
}
