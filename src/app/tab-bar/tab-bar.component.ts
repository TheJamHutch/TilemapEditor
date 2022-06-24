import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ConfigService } from '../config.service';

@Component({
  selector: 'app-tab-bar',
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.scss']
})
export class TabBarComponent implements OnInit {

  tabs = ['Assets', 'Tiling', 'Entities'];
  selectedTabId: string;

  @Output('selected') tabSelectEvent = new EventEmitter<string>();

  constructor(private config: ConfigService) {
    this.selectedTabId = this.config.selectedTab;
  }

  ngOnInit(): void {
  }

  onTabClick(tabId: string): void {
    this.selectedTabId = tabId;
    this.tabSelectEvent.emit(tabId);
  }

}
