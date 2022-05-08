import { Injectable } from '@angular/core';
import { Assets } from './core/assets';
import { Vector } from './core/primitives';
import { Tiling } from './core/tilemap';
import { EventBusService, EventType } from './event-bus.service';

@Injectable({
  providedIn: 'root'
})
export class MapInstanceService {

  name: string;
  dimensions: Vector;
  tilemap?: Tiling.Tilemap;

  constructor(private eventBus: EventBusService) { }

  init(): void {
    this.eventBus.register(EventType.MapChange, this.onMapChange.bind(this));
  }

  layerCount(): number {
    return this.tilemap?.layers.length;
  }

  baseLayerId(): string {
    if (this.tilemap){
      return this.tilemap.layers[0].id;
    } else {
      return '';
    }
  }

  topLayerIndex(): number {
    let topLayerIdx = 0;

    if (this.tilemap){
      for (let i = 0; i < this.tilemap.layers.length; i++){
        if (this.tilemap.layers[i].visible){
          topLayerIdx = i;
        }
      }
    }

    return topLayerIdx;
  }

  topLayer(): Tiling.TilemapLayer {
    return this.tilemap?.layers[this.topLayerIndex()];
  }

  topLayerId(): string {
    return this.tilemap?.layers[this.topLayerIndex()].id;
  }

  topTilesheet(): Assets.Tilesheet {
    return this.tilemap?.layers[this.topLayerIndex()].tilesheet;
  }

  onMapChange(e: any): void {
    this.name = e.name;
    this.dimensions = e.dimensions;
    this.tilemap = e.tilemap;
  }
}
