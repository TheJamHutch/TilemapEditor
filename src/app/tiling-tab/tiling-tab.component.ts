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
    const tilesheet = this.mapInstance.topTilesheet();
    return !!(tilesheet?.tileData[this.tileIdx].solid);
  }

  tileIsAnimated(): boolean {
    const tilesheet = this.mapInstance.topTilesheet();
    return !!(tilesheet?.tileData[this.tileIdx].animation);
  }

  tileEffectSelected(effectOptionIdx: number): boolean {
    const tilesheet = this.mapInstance.topTilesheet();
    return (effectOptionIdx === tilesheet?.tileData[this.tileIdx].effect);
  }

  tileAnimation(): any {
    const tilesheet = this.mapInstance.topTilesheet();
    return tilesheet?.tileData[this.tileIdx].animation;
  }

  tilesheetSelected(tilesheetId: string): boolean {
    return (tilesheetId === this.mapInstance.topTilesheet()?.id);
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
    this.eventBus.raise(EventType.AddLayer, { layerId: `Layer${this.mapInstance.layerTotal()}` });
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
