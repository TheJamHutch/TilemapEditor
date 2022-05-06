import { Component, ElementRef, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { AssetsService } from './assets.service';
import { EventBusService, EventType } from './event-bus.service';
import { Rendering } from './core/rendering';
import { config } from './core/config';
import { PerformanceCounterService } from './performance-counter.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [
    './app.component.scss',
    '../common/app.common.scss'
  ]
})
export class AppComponent implements OnInit, AfterViewInit {

  title = 'TilemapEditor';
  selectedTab = 'Tiling';

  constructor(private assets: AssetsService, private eventBus: EventBusService, private performanceCounter: PerformanceCounterService){}
  
  async ngOnInit(): Promise<void> {
    await this.assets.loadAll();
    let firstSheet = Object.values(this.assets.store.tilesheets)[0];
    this.eventBus.raise(EventType.TilesheetChange, { tilesheetId: firstSheet.id });
    const newMap = {
      dimensions: config.editor.mapDimensions
    };
    this.eventBus.raise(EventType.NewMap, newMap);
  }

  ngAfterViewInit(): void {
    document.addEventListener('contextmenu', (e: PointerEvent) => {
      //e.preventDefault();
    });

    this.update();
  }

  update(): void {
    this.eventBus.poll();
    this.eventBus.raise(EventType.NewFrame);
    this.performanceCounter.increment();

    requestAnimationFrame(() => {
      this.update();
    });
  }

  onToolboxTabSelect(tabId: string): void {
    this.selectedTab = tabId;
  }
}
