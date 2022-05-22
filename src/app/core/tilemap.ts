import * as _ from 'lodash';
import { Vector, Rect } from './primitives';
import { Camera } from './camera';
import { Rendering } from './rendering';
import { Assets } from './assets';

export namespace Tiling{

  export enum TileEffect {
    None = 0,
    Hurt,
    Teleport,
    Transition,
    Door,
    Roof
  }
  
  export type Tile = {
    pos: Vector;
    solid: boolean;
    effect: number;
    topLayerIdx?: number;
  };

  export type TileAnimation = {
    name: string;
    speed: number;
    frames: number[];
  };
  
  export class Tilemap{
    // The original tile size before zoom
    tileSize: number;
    layers: TilemapLayer[];
    dimensions: Vector;
    transitionTiles: { idx: number, mapId: string }[];

    get resolution(): Vector {
      return {
        x: this.dimensions.x * this.tileSize,
        y: this.dimensions.y * this.tileSize
      }
    }
  
    constructor(tilemap: any, tileSize: number){
      this.tileSize = tileSize;
      this.dimensions = tilemap.dimensions;
      this.transitionTiles = tilemap.transitionTiles
      this.layers = [];

      for (let layer of tilemap.layers){
        this.layers.push(new TilemapLayer(layer.tiles, layer.tilesheet, this.dimensions));
      }
    }

    addLayer(tiles: number[], tilesheet: any): TilemapLayer {
      const layer = new TilemapLayer(tiles, tilesheet, this.dimensions);
      this.layers.push(layer);
      return layer
    }

    setTile(layerIdx: number, pos: Vector, tileType: number){
      const idx = (pos.y * this.dimensions.x) + pos.x;
      this.layers[layerIdx].tiles[idx] = tileType;
    }

    posToIndex(pos: Vector): number{
      return (pos.y * this.dimensions.x) + pos.x;
    }

    indexToPos(idx: number): Vector {
      return {
        x: Math.floor(idx % this.dimensions.x),
        y: Math.floor(idx / this.dimensions.x)
      }
    }
  }
  
  export class TilemapLayer{
    id?: string;
    name?: string;
    tilesheet: any;
    tiles: number[];
    visible = true;
  
    constructor(tiles: number[], tilesheet: any, dimensions: Vector){
      this.tilesheet = tilesheet;
      this.tiles = [];
  
      const nTiles = dimensions.x * dimensions.y;
      for (let i = 0; i < nTiles; i++)
      {
        if (!tiles || tiles.length === 0){
          this.tiles[i] = -1;
          continue;
        }

        this.tiles[i] = tiles[i];
      }
    }
  }

  export function viewTiles(tilemap: Tilemap, camera: Camera): Tile[] {
    const inView = {
      x: Math.ceil(camera.view.w / tilemap.tileSize),
      y: Math.ceil(camera.view.h / tilemap.tileSize)
    };
    // 
    const start = {
      x: Math.floor(camera.world.x / tilemap.tileSize),
      y: Math.floor(camera.world.y / tilemap.tileSize)
    };
    const end = {
      x: (tilemap.dimensions.x > inView.x) ? start.x + inView.x : tilemap.dimensions.x, 
      y: (tilemap.dimensions.y > inView.y) ? start.y + inView.y : tilemap.dimensions.y
    };

    let viewTiles = [] as any;

    
    for (let layer of tilemap.layers){

      for (let y = start.y; y < end.y; y++){
        for (let x = start.x; x < end.x; x++){
          const tileIdx = (y * tilemap.dimensions.x) + x;
          if (layer.tiles[tileIdx] > -1){
          
            const tileType = layer.tiles[tileIdx];
            const solid = (layer.tilesheet.tileData[tileType].solid) ? true : false;
            const effect = layer.tilesheet.tileData[tileType].effect;
            const tile = {
              pos: { x, y },
              solid,
              effect
            };

            if (viewTiles[tileIdx]){
              viewTiles[tileIdx] = tile;
            } else {
              viewTiles.push(tile);
            }
          }
        }
      }
    }

    return viewTiles;
  }

  export function tilemapRenderOffset (tilemap: Tilemap, camera: Camera): Vector {
    const scrollsX = (tilemap.resolution.x > camera.view.w);
    const scrollsY = (tilemap.resolution.y > camera.view.h);
    const offset = {
      x: (!scrollsX) ? (camera.view.w / 2) - (tilemap.resolution.x / 2) : 0,
      y: (!scrollsY) ? ((camera.view.h) / 2) - (tilemap.resolution.y / 2) : 0
    };

    return offset;
  }

  export function renderTilemap(context: Rendering.RenderContext, tilemap: Tilemap, camera: Camera, frameCount: number): void {
    const inView = {
      x: Math.ceil(camera.view.w / tilemap.tileSize),
      y: Math.ceil(camera.view.h / tilemap.tileSize)
    };
    const start = {
      x: Math.floor(camera.world.x / tilemap.tileSize),
      y: Math.floor(camera.world.y / tilemap.tileSize)
    };
    const end = {
      x: (tilemap.dimensions.x > inView.x) ? start.x + inView.x + 1 : tilemap.dimensions.x, 
      y: (tilemap.dimensions.y > inView.y) ? start.y + inView.y + 1 : tilemap.dimensions.y
    };
    
    const offset = tilemapRenderOffset(tilemap, camera);
    
    for (let layer of tilemap.layers){
      if (!layer.visible){
        continue;
      }

      // Iterate tiles
      for (let y = start.y; y < end.y; y++){
        for (let x = start.x; x < end.x; x++){
          const tileIdx = (y * tilemap.dimensions.x) + x;
          const tileType = layer.tiles[tileIdx];

          if (tileType > -1){
            let clip = setClip(tileType, layer.tilesheet.clipSize, layer.tilesheet.nCells, layer.tilesheet.cellsPerRow);

            // @TODO: Tile animations screw up when frame count resets
            // Overwrite clip if tile is animated
            let tileIsAnimated = false;
            let animation;
            if (layer.tilesheet.tileAnimations){
              for (let anim of layer.tilesheet.tileAnimations){
                if (anim.frames.find((frame: number) => frame === tileType)){
                  animation = anim;
                  break;
                }
              }

              if (animation){
                let animIdx = Math.floor(((frameCount / animation.speed) % animation.frames.length));
                let idx = animation.frames[animIdx];
                clip = setClip(idx, layer.tilesheet.clipSize, layer.tilesheet.nCells, layer.tilesheet.cellsPerRow);
              }
            }
            
            const view = new Rect({ x: 0, y: 0, w: tilemap.tileSize, h: tilemap.tileSize });
            view.x = offset.x + ((x * tilemap.tileSize) - camera.world.x);
            view.y = offset.y + ((y * tilemap.tileSize) - camera.world.y);

            context.renderBitmap(layer.tilesheet.texture.bitmap, clip, view);
          }
        }
      }
    }
  }

  export function tilePosToWorldPos(tilemap: Tilemap, tilePos: Vector): Vector {
    return {
      x: tilePos.x * tilemap.tileSize,
      y: tilePos.y * tilemap.tileSize
    };
  }

  export function tilePosToWorldRect(tilemap: Tilemap, tilePos: Vector): Rect {
    return new Rect({
      x: tilePos.x * tilemap.tileSize,
      y: tilePos.y * tilemap.tileSize,
      w: tilemap.tileSize,
      h: tilemap.tileSize
    });
  }

  export function worldToTilePos(tilemap: Tilemap, worldPos: Vector): Vector {
    return {
      x: Math.floor(worldPos.x / tilemap.tileSize),
      y: Math.floor(worldPos.y / tilemap.tileSize)
    };
  }

  export function getTileAtWorldPos(tilemap: Tilemap, worldPos: Vector): Tile {
    const tilePos = {
      x: Math.floor(worldPos.x / tilemap.tileSize),
      y: Math.floor(worldPos.y / tilemap.tileSize)
    };
    const tileIdx = tilemap.posToIndex(tilePos);
    let tile = {} as any;
    let layerIdx = 0;
    for (let layer of tilemap.layers){
      const rawTile = layer.tiles[tileIdx];
      if (rawTile > -1){
        tile = {
          pos: tilePos,
          solid: layer.tilesheet.tileData[rawTile].solid,
          effect: layer.tilesheet.tileData[rawTile].effect,
          topLayerIdx: layerIdx
        };
      }
      layerIdx++;
    }

    

    return tile;
  }

  // Returns the position and size of the clipping rectangle of a spritesheet at a particular index.
  export function setClip(index: number, cellSize: number, nCells: number, cellsPerRow: number): Rect {
    let x = 0;
    let y = 0;
    let c = 0;
  
    while (c < index){
      x += 1;
      if (x >= cellsPerRow){
        x = 0;
        y++;
  
        if (c >= nCells){
          x = 0;
          y = 0;
        }
      }
  
      c++;
    }
  
    return new Rect({
      x: x * cellSize,
      y: y * cellSize, 
      w: cellSize, 
      h: cellSize
    });
  }
    
}
