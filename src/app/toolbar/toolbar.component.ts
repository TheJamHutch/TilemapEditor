import { Component, OnInit } from '@angular/core';
import { AssetsService } from '../assets.service';
import { Assets } from '../core/assets';
import { EventBusService, EventType } from '../event-bus.service';

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

  constructor(private assets: AssetsService, private eventBus: EventBusService) { }

  ngOnInit(): void {

  }

  onNewMapClick(): void {
    this.eventBus.raise(EventType.NewMap);
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
