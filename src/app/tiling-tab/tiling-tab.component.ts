import { Component, OnInit, AfterViewInit } from '@angular/core';
import { AssetsService } from '../assets.service';
import { Rendering } from '../core/rendering';
import { config } from '../core/config';
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
  tilesheetId: string;
  tilemap?: any;
  layerIdx: number = 0;
  tileIdx: number = 0;
  tileEffectOptions = [];

  constructor(private assets: AssetsService, private eventBus: EventBusService) { }

  ngOnInit(): void {

    // Generate options for tileEffect select from the enum in Tiling.
    // @TODO: This is hardcoded
    this.tileEffectOptions = ['None', 'Hurt', 'Teleport', 'Transition', 'Door', 'Roof'];

    this.eventBus.register(EventType.AssetsChange, (_) => {
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
  }

  ngAfterViewInit(): void {
    
  }

  layerOptions(): any[] {
    let layers = [];
    if (this.tilemap?.layers){
      layers = this.tilemap.layers;
    }
    return layers;
  }

  layerOptionSelected(layerIdx: number): boolean {
    return (layerIdx === this.layerIdx);
  }

  onLayerSelect(layerIdx: any): void {
    this.layerIdx = parseInt(layerIdx);
    this.eventBus.raise(EventType.LayerChange, { layerIdx });
    const tilesheetId = this.tilemap.layers[layerIdx].tilesheet.id;
    this.eventBus.raise(EventType.TilesheetChange, { tilesheetId });
  }

  onAddLayerClick(): void {
    this.eventBus.raise(EventType.AddLayer);
  }

  onRemoveLayerClick(): void {
    if (this.layerIdx > 0){
      this.eventBus.raise(EventType.RemoveLayer, { layerIdx: this.layerIdx });
      this.layerIdx -= 1;
      this.eventBus.raise(EventType.LayerChange, { layerIdx: this.layerIdx });
      const tilesheetId = this.tilemap.layers[this.layerIdx].tilesheet.id;
      this.eventBus.raise(EventType.TilesheetChange, { tilesheetId });
    }
  }

  tilesheetOptionSelected(tilesheetId: string): boolean {
    return (tilesheetId === this.tilemap?.layers[this.layerIdx].tilesheet.id);
  }

  onTilesheetSelect(tilesheetId: string): void {
    this.tilesheetId = tilesheetId;
    this.eventBus.raise(EventType.TilesheetChange, { tilesheetId });
  }

  tileIsSolid(): boolean {
    let isSolid = false;
    if (this.tilemap){
      isSolid = (this.tilemap.layers[this.layerIdx].tilesheet.solidMap[this.tileIdx]);
    }

    return isSolid;
  }

  tileIsAnimated(): boolean {
    let isAnimated = false;

    if (this.tilemap){
      isAnimated = (this.tilemap.layers[this.layerIdx].tilesheet.animatedMap[this.tileIdx])
    }

    return isAnimated;
  }

  tileEffectOptionSelected(optionIdx: number): boolean {
    return (optionIdx === this.tilemap?.layers[this.layerIdx].tilesheet.effectMap[this.tileIdx]);
  }

}
