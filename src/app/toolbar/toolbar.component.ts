import { Component, OnInit } from '@angular/core';
import { AssetsService } from '../assets.service';
import { Assets } from '../core/assets';
import { EventBusService, EventType } from '../event-bus.service';
import { config } from '../core/config';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: [
    './toolbar.component.scss',
    '../../common/app.common.scss'
  ]
})
export class ToolbarComponent implements OnInit {

  // @TODO: Hardcoded
  drawModes = ['Free', 'Line', 'Rect', 'Block'];
  drawModeIdx = 0;

  mapName = '';
  mapDimsX = 0;
  mapDimsY = 0;

  constructor(private assets: AssetsService, private eventBus: EventBusService) { }

  ngOnInit(): void {
    this.eventBus.register(EventType.MapChange, (e: any) => {
      this.mapName = e.name;
      this.mapDimsX = e.dimensions.x;
      this.mapDimsY = e.dimensions.y;
    });
  }

  onNewMapClick(): void {
    const newMap = {
      dimensions: { x: this.mapDimsX, y: this.mapDimsY }
    };
    this.eventBus.raise(EventType.NewMap, newMap);
  }

  onSaveMapClick(): void {
    this.eventBus.raise(EventType.SaveMap);
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

  onDrawModeChange(modeIdx: number): void {
    this.drawModeIdx = modeIdx;
    this.eventBus.raise(EventType.DrawModeChange, { modeIdx });
  }

}
