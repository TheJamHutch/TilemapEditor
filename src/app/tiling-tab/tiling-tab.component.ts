import { Component, OnInit, AfterViewInit } from '@angular/core';
import { AssetsService } from '../assets.service';
import { Assets } from '../core/assets';
import { Rendering } from '../core/rendering';
import { Tiling } from '../core/tilemap';
import { EventBusService, EventType } from '../event-bus.service';
import { MapInstanceService } from '../map-instance.service';

@Component({
  selector: 'app-tiling-tab',
  templateUrl: './tiling-tab.component.html',
  styleUrls: [
    './tiling-tab.component.scss',
    '../../common/app.common.scss'
  ]
})
export class TilingTabComponent implements OnInit, AfterViewInit {

  tileIdx: number = 0;
  tileEffectOptions = [];

  constructor(
    private assets: AssetsService,
    private eventBus: EventBusService,
    private mapInstance: MapInstanceService  
  ) { }

  ngOnInit(): void {
    // Generate options for tileEffect select from the enum in Tiling.
    // @TODO: This is hardcoded
    this.tileEffectOptions = ['None', 'Hurt', 'Teleport', 'Transition', 'Door', 'Roof'];

    this.eventBus.register(EventType.PaletteSelect, this.onPaletteSelect.bind(this));
  }

  ngAfterViewInit(): void {
    
  }

  tileIsSolid(): boolean {
    let isSolid = false;

    const tilesheet = this.mapInstance.topTilesheet();
    if (tilesheet){
      isSolid = (tilesheet.solidMap[this.tileIdx] === 1);
    }

    return isSolid;
  }

  tileIsAnimated(): boolean {
    let isAnimated = false;
    
    const tilesheet = this.mapInstance.topTilesheet();
    if (tilesheet){
      for (let anim of tilesheet.tileAnimations){
        if (anim.frames.find((frame: number) => this.tileIdx === frame)){
          isAnimated = true;
          break;
        }
      }
    }

    return isAnimated;
  }

  tileEffectSelected(effectOptionIdx: number): boolean {
    let selected = false;

    const tilesheet = this.mapInstance.topTilesheet();
    if (tilesheet){
      selected = (effectOptionIdx === tilesheet.effectMap[this.tileIdx]);
    }

    return selected;
  }

  tileAnimation(): any {
    let animation = null;
    const tilesheet = this.mapInstance.topTilesheet();

    if (tilesheet?.tileAnimations){
      for (let anim of tilesheet.tileAnimations){
        if (anim.frames.find((frame: number) => this.tileIdx === frame)){
          animation = anim;
          break;
        }
      }
    }

    return animation;
  }

  isBaseLayer(layerId: string): boolean {
    return (layerId === this.mapInstance.baseLayerId());
  }

  tilesheetSelected(tilesheetId: string): boolean {
    return (tilesheetId === this.mapInstance.topTilesheet()?.id);
  }

  tilesheetAnimations(): any[] {
    return this.mapInstance.topTilesheet()?.tileAnimations;
  }

  layerSelected(layerId: string): boolean {
    return (layerId === this.mapInstance.topLayerId());
  }

  tilesheetCellCount(): number {
    const nCells = this.mapInstance.topTilesheet()?.nCells
    return (nCells) ? nCells : 0;
  }

  layerOptions(): Tiling.TilemapLayer[] {
    return (this.mapInstance.tilemap) ? this.mapInstance.tilemap.layers.slice().reverse() : [];
  }

  tilesheetOptions(): Assets.Tilesheet[] {
    return Object.values(this.assets.store.tilesheets);
  }

  onAddLayerClick(): void {
    this.eventBus.raise(EventType.AddLayer, { layerId: `Layer${this.mapInstance.layerCount()}` });
  }

  onRemoveLayerClick(layerId: string): void {
    this.eventBus.raise(EventType.RemoveLayer, { layerId });
  }

  onTilesheetSelect(tilesheetId: string): void {
    this.eventBus.raise(EventType.TilesheetChange, { tilesheetId });
  }

  onLayerVisibilityChange(layerId: string, checked: boolean): void {
    this.eventBus.raise(EventType.LayerChange, { layerId, visible: checked });
  }

  onPaletteSelect(e: any): void {
    this.tileIdx = e.cellIdx;
  }

}
