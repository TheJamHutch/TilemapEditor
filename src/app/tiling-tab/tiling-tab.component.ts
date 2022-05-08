import { Component, OnInit, AfterViewInit } from '@angular/core';
import { AssetsService } from '../assets.service';
import { Rendering } from '../core/rendering';
import { Tiling } from '../core/tilemap';
import { EventBusService, EventType } from '../event-bus.service';

@Component({
  selector: 'app-tiling-tab',
  templateUrl: './tiling-tab.component.html',
  styleUrls: [
    './tiling-tab.component.scss',
    '../../common/app.common.scss'
  ]
})
export class TilingTabComponent implements OnInit, AfterViewInit {

  tilesheetOptions = [];
  tilemap?: any;
  tileIdx: number = 0;
  tileEffectOptions = [];

  openTilesheet: any;
  allTilesheets = [];

  constructor(private assets: AssetsService, private eventBus: EventBusService) { }

  ngOnInit(): void {
    // Generate options for tileEffect select from the enum in Tiling.
    // @TODO: This is hardcoded
    this.tileEffectOptions = ['None', 'Hurt', 'Teleport', 'Transition', 'Door', 'Roof'];

    this.eventBus.register(EventType.AssetsUpdate, (_) => {
      this.tilesheetOptions = [];
      const tilesheets = Object.values(this.assets.store.tilesheets);
      for (let sheet of tilesheets){
        this.tilesheetOptions.push(sheet);
      }
    });
    this.eventBus.register(EventType.MapChange, (context: any) => {
      this.tilemap = context.tilemap;
    });
    this.eventBus.register(EventType.PaletteSelect, (context: any) => {
      this.tileIdx = context.cellIdx;
    });

    this.eventBus.register(EventType.TilesheetChange, (context: any) => {
      this.openTilesheet = this.assets.store.tilesheets[context.tilesheetId];
    });

    this.eventBus.register(EventType.AssetsUpdate, (context: any) => {
      this.allTilesheets = Object.values(this.assets.store.tilesheets);
    });
  }

  ngAfterViewInit(): void {
    
  }

  layerOptionSelected(layerId: string): boolean {
    return false; //(layerIdx === this.topLayerIdx);
  }

  /*
  onLayerSelect(layerId: string): void {
    this.eventBus.raise(EventType.LayerChange, { layerId });
    const layer = this.tilemap.layers.filter((layer: Tiling.TilemapLayer) => layer.id === layerId)[0];
    this.eventBus.raise(EventType.TilesheetChange, { tilesheetId: layer.tilesheetId });
  }*/

  onAddLayerClick(): void {
    this.eventBus.raise(EventType.AddLayer, { layerId: `layer${this.tilemap.layers.length}` });
  }

  onRemoveLayerClick(layerId: string): void {
    this.eventBus.raise(EventType.RemoveLayer, { layerId });
  }

  onTilesheetSelect(tilesheetId: string): void {
    this.eventBus.raise(EventType.TilesheetChange, { tilesheetId });
  }

  tileIsSolid(): boolean {
    let isSolid = false;
    if (this.tilemap){
      //isSolid = (this.tilemap.layers[this.topLayerIdx].tilesheet.solidMap[this.tileIdx]);
    }

    return isSolid;
  }

  tileIsAnimated(): boolean {
    let isAnimated = false;

    //if (this.tilemap){
      //isAnimated = (this.tilemap.layers[this.topLayerIdx].tilesheet.animatedMap[this.tileIdx])
   // }

    return isAnimated;
  }

  tileEffectOptionSelected(optionIdx: number): boolean {
    return false; //(optionIdx === this.tilemap?.layers[this.topLayerIdx].tilesheet.effectMap[this.tileIdx]);
  }

  onLayerVisibilityChange(layerId: string, checked: boolean): void {
    this.eventBus.raise(EventType.LayerChange, { layerId, visible: checked });
  }

}
