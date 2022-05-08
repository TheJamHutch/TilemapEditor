import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AssetsService } from '../assets.service';
import { Assets } from '../core/assets';
import { Vector } from '../core/primitives';
import { EventBusService, EventType } from '../event-bus.service';
import { MapInstanceService } from '../map-instance.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: [
    './toolbar.component.scss',
    '../../common/app.common.scss'
  ]
})
export class ToolbarComponent implements OnInit {

  @ViewChild('mapNameInput') mapNameInput: ElementRef<HTMLInputElement>;
  @ViewChild('mapDimsXInput') mapDimsXInput: ElementRef<HTMLInputElement>;
  @ViewChild('mapDimsYInput') mapDimsYInput: ElementRef<HTMLInputElement>;

  constructor(
    private assets: AssetsService,
    private eventBus: EventBusService,
    private mapInstance: MapInstanceService
  ) { }

  ngOnInit(): void {

  }

  mapName(): string {
    const mapName = this.mapInstance.name;
    return (mapName) ? mapName : '';
  }

  mapDimensions(): Vector {
    const mapDims = this.mapInstance.dimensions;
    return (mapDims) ? mapDims : { x: 0, y: 0 };
  }

  onNewMapClick(): void {
    const dimensions = {
      x: parseInt(this.mapDimsXInput.nativeElement.value),
      y: parseInt(this.mapDimsYInput.nativeElement.value)
    };
    
    const newMap = {
      dimensions
    };
    this.eventBus.raise(EventType.NewMap, newMap);
  }

  onSaveMapClick(): void {
    const name = this.mapNameInput.nativeElement.value;
    const saveMap = { name };
    this.eventBus.raise(EventType.SaveMap, saveMap);
  }

  async onLoadMapClick(): Promise<void> {
    const mapId = await this.assets.loadFromFile(Assets.AssetType.GameMap);
    if (mapId){
      this.eventBus.raise(EventType.LoadMap, { mapId: mapId });
    }
  }

  onToggleGridClick(): void {
    this.eventBus.raise(EventType.ToggleGrid);
  }

}
