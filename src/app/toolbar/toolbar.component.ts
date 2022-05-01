import { Component, OnInit } from '@angular/core';
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

  constructor(private eventBus: EventBusService) { }

  ngOnInit(): void {

  }

  onNewMapClick(): void {
    this.eventBus.raise(EventType.NewMap);
  }

  onSaveMapClick(): void {
    this.eventBus.raise(EventType.SaveMap);
  }

  onLoadMapClick(): void {
    this.eventBus.raise(EventType.LoadMap);
  }

  onToggleGridClick(): void {
    this.eventBus.raise(EventType.ToggleGrid);
  }

  onDrawModeChange(modeIdx: number): void {
    this.drawModeIdx = modeIdx;
    this.eventBus.raise(EventType.DrawModeChange, { modeIdx });
  }

}
