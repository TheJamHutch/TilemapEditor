import { Rendering } from '../core/rendering';
import { Rect, Vector } from "../core/primitives";
import { Camera } from "../core/camera";
import { Tiling } from "../core/tilemap";

export enum DrawModes{
  Free = 0,
  Line,
  Rect,
  Block
}

export class Editor{

  context: Rendering.RenderContext;
  cursor: Rect;
  selectedTileIdx = 1;
  tileSize: number;
  pasteMode = false;
  tilemap?: Tiling.Tilemap;
  camera?: Camera;
  topLayerIdx = -1;
  showGrid = false;
  drawMode = DrawModes.Free;

  constructor(context: Rendering.RenderContext, config: any){
    this.context = context;
    this.cursor = new Rect({ x: 0, y: 0, w: config.tileSize, h: config.tileSize });
    this.tileSize = config.tileSize;
  }

  loadMap(rawMap: any){
    this.tilemap = new Tiling.Tilemap(rawMap.tilemap, this.tileSize);
    this.camera = new Camera(this.context.resolution, this.tilemap.resolution);

    this.topLayerIdx = this.tilemap.layers.length - 1;
  }

  saveMap(mapId: string): any {
    let layers = [];
    for (const layer of this.tilemap!.layers){
      layers.push({
        tilesheetId: layer.tilesheet.id,
        tiles: layer.tiles
      });
    }

    return {
      id: mapId,
      type: 'map',
      tilemap: {
        dimensions: this.tilemap.dimensions,
        layers
      },
      entities: [
        {
          archetypeId: 'player',
          spawnPos: { x: 0, y: 0 }
        }
      ]
    };
  }

  update(): void {
    if (!this.camera || !this.tilemap){
      return;
    }
    
    this.camera.update();
    this.render();
  }

  posOnMap(pos: Vector): boolean {
    return (pos.x - 16 > this.camera.view.x &&
            pos.x <= this.camera.view.x + this.tilemap.resolution.x &&
            pos.y - 16 > this.camera.view.y &&
            pos.y <= this.camera.view.y + this.tilemap.resolution.y);
  }

  updateTileAtCursorPos(): void {
    const worldPos = this.camera.viewToWorld(this.cursor) as Vector;
    const tilePos = Tiling.worldToTilePos(this.tilemap, worldPos);

    this.tilemap.setTile(this.topLayerIdx, tilePos, this.selectedTileIdx);
  }

  setCursorPosition(pos: Vector): void {
    this.cursor.x = (pos.x - (pos.x % this.tilemap.tileSize)) - (this.camera.world.x % this.tilemap.tileSize) - (this.camera.view.x % this.tilemap.tileSize);
    this.cursor.y = (pos.y - (pos.y % this.tilemap.tileSize)) - (this.camera.world.y % this.tilemap.tileSize) - (this.camera.view.y % this.tilemap.tileSize);
  }

  private render(): void {
    // Render black background
    this.context.setFillColor('black');
    this.context.fillRect(new Rect({ x: 0, y: 0, w: this.context.resolution.x, h: this.context.resolution.y }));

    Tiling.renderTilemap(this.context, this.tilemap, this.camera, this.topLayerIdx);

    if (this.showGrid){
      this.renderGrid();
    }

    this.context.setStrokeColor('yellow');
    this.context.setStrokeWeight(4);
    this.context.strokeRect(this.cursor);
  }

  private renderGrid(): void {
    this.context.setStrokeColor('black');
    this.context.setStrokeWeight(1);
    const dims = this.tilemap.dimensions;

    // Vertical lines
    for (let x = 0; x < dims.x; x++){
      let start = {
        x: (this.camera.view.x + (x * this.tileSize)) - (this.camera.world.x % this.tileSize),
        y: 0
      };
      let end = {
        x: (this.camera.view.x + (x * this.tileSize)) - (this.camera.world.x % this.tileSize),
        y: this.tilemap.resolution.y
      };

      this.context.drawLine(start, end);
    }
    // Horizontal lines
    for (let y = 0; y < dims.y; y++){
      let start = {
        x: 0,
        y: (this.camera.view.y + (y * this.tileSize)) - (this.camera.world.y % this.tileSize)
      };
      let end = {
        x: this.tilemap.resolution.x,
        y: (this.camera.view.y + (y * this.tileSize)) - (this.camera.world.y % this.tileSize)
      };

      this.context.drawLine(start, end);
    }
  }

  generateNewMap(tilesheet: any): any {
    const dimensions = { x: 100, y: 100 };

    const mapObj = {
      id: '',
      tilemap: {
        dimensions,
        layers: [
          {
            tilesheet,
            tiles: [] as any[]
          }
        ]
      }
    }
    // Insert tiles
    const nTiles = dimensions.x * dimensions.y;
    for (let i = 0; i < nTiles; i++){
      mapObj.tilemap.layers[0].tiles.push(0);
    }

    return mapObj;
  }

  toggleGrid(): void {
    this.showGrid = !this.showGrid;
  }

  changeTilesheet(layerIdx: number, tilesheet: any): void {
    this.tilemap.layers[layerIdx].tilesheet = tilesheet;
  }

  addLayer(tilesheet: any): void {
    const layer = new Tiling.TilemapLayer([], tilesheet, this.tilemap.dimensions);
    this.tilemap.layers.push(layer);
  }

  removeLayer(layerIdx: number): void {
    this.tilemap.layers.splice(layerIdx, 1);
    this.topLayerIdx--;
  }
}