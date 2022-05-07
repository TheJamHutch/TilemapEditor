import { Rendering } from '../core/rendering';
import { Rect, Vector } from "../core/primitives";
import { Camera, CameraDirection } from "../core/camera";
import { Tiling } from "../core/tilemap";

export enum EditorMode{
  Draw,
  Select,
  Grab
}

export enum EditorDrawMode{
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
  paste = false;
  tilemap?: Tiling.Tilemap;
  camera?: Camera;
  topLayerIdx = -1;
  showGrid = false;

  mode = EditorMode.Draw;
  drawMode = EditorDrawMode.Free;

  // @TODO: Tiles can be free-selected when Ctrl is held. Should be able to click on an already selected tile and have it de-select but not when mouse is moved (in paste mode)
  selectedTiles = [];

  lineDashSpeed = 0; // Controls the speed of the line dash animation shown when selecting a tile.

  constructor(context: Rendering.RenderContext, tileSize: number, lineDashSpeed: number){
    this.context = context;
    this.cursor = new Rect({ x: 0, y: 0, w: tileSize, h: tileSize });
    this.tileSize = tileSize;
    this.lineDashSpeed = lineDashSpeed;
  }

  loadMap(rawMap: any){
    this.tilemap = new Tiling.Tilemap(rawMap.tilemap, this.tileSize);
    this.camera = new Camera(this.context.resolution, this.tilemap.resolution);

    this.topLayerIdx = 0;
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

  update(frameCount: number): void {
    if (!this.camera || !this.tilemap){
      return;
    }

    this.context.nativeContext.lineDashOffset = Math.floor(frameCount / this.lineDashSpeed);

    this.camera.update();
    this.render();
  }

  moveCamera(direction: CameraDirection): void {
    switch (direction){
      case CameraDirection.North:
        this.camera.velocity.y = -1;
        break;
      case CameraDirection.South:
        this.camera.velocity.y = 1;
        break;
      case CameraDirection.East:
        this.camera.velocity.x = 1;
        break;
      case CameraDirection.West:
        this.camera.velocity.x = -1;
        break;
    }

    // @TODO: Paste-in tiles while camera is moving but mouse isn't, or prevent them from being pasted in?
    /*
    if (this.paste){
      this.updateTileAtCursorPos();
    }*/
  }

  selectTiles(...tiles: Vector[]): void {

    for (let tilePos of tiles){
      let addTile = true;

      for (let i = this.selectedTiles.length - 1; i >= 0; i--){
        let selTile = this.selectedTiles[i];
        if (tilePos.x === selTile.x && tilePos.y === selTile.y){
          addTile = false;
        }
      }

      if (addTile){
        this.selectedTiles.push(tilePos);
      }
    }
  }

  clearSelectedTiles(): void {
    this.selectedTiles = [];
  }

  resetTileSelection(): void {
    for (let tilePos of this.selectedTiles){
      const tileVal = (this.topLayerIdx === 0) ? 0 : -1;
      this.tilemap.setTile(this.topLayerIdx, tilePos, tileVal);
    }
    this.selectedTiles = [];
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

  getTileAtCursorPos(): Vector {
    const worldPos = this.camera.viewToWorld(this.cursor) as Vector;
    const tilePos = Tiling.worldToTilePos(this.tilemap, worldPos);
    return tilePos;
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

    // Render overlay for any selected tiles.
    for (let tilePos of this.selectedTiles){
      const tileViewPos = { x: tilePos.x * this.tileSize, y: tilePos.y * this.tileSize };
      const tileWorldPos = this.camera.worldToView(tileViewPos);
      let tileRect = new Rect({ 
        x: tileWorldPos.x, 
        y: tileWorldPos.y, 
        w: this.tileSize,
        h: this.tileSize
      });
      this.context.nativeContext.setLineDash([4, 2]);
      this.context.setFillColor('red');
      this.context.setStrokeColor('black');
      this.context.setStrokeWeight(1);
      this.context.fillRect(tileRect, 0.3);
      this.context.strokeRect(tileRect);
    }
    this.context.nativeContext.setLineDash([0]);

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

  generateNewMap(tilesheet: any, mapDims: Vector): any {
    const mapObj = {
      id: '',
      tilemap: {
        dimensions: mapDims,
        layers: [
          {
            tilesheet,
            tiles: [] as any[]
          }
        ]
      }
    }
    // Insert tiles
    const nTiles = mapDims.x * mapDims.y;
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