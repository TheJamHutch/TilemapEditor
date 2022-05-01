import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-tab-bar',
  templateUrl: './tab-bar.component.html',
  styleUrls: ['./tab-bar.component.scss']
})
export class TabBarComponent implements OnInit {

  tabs = ['Assets', 'Tiling', 'Entities'];
  selectedTabId = this.tabs[1]; // @TODO: Hardcoded

  @Output('selected') tabSelectEvent = new EventEmitter<string>();

  constructor() {

  }

  ngOnInit(): void {
  }

  onTabClick(tabId: string): void {
    this.selectedTabId = tabId;
    this.tabSelectEvent.emit(tabId);
  }

}
