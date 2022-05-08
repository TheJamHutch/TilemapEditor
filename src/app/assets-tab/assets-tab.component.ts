import { Component, OnInit } from '@angular/core';
import { AssetsService } from '../assets.service';
import { Assets } from '../core/assets';
import { EventBusService, EventType } from '../event-bus.service';

@Component({
  selector: 'app-assets-tab',
  templateUrl: './assets-tab.component.html',
  styleUrls: [
    './assets-tab.component.scss',
    '../../common/app.common.scss'
  ]
})
export class AssetsTabComponent implements OnInit {

  textures: string[] = [];
  tilesheets: string[] = [];
  spritesheets: string[] = [];

  constructor(private assets: AssetsService, private eventBus: EventBusService) { }

  ngOnInit(): void {
    this.eventBus.register(EventType.AssetsUpdate, (context: any) => {
      this.textures = Object.keys(this.assets.store.textures);
      this.tilesheets = Object.keys(this.assets.store.tilesheets);
      this.spritesheets = Object.keys(this.assets.store.spritesheets);
    });
  }

  onTextureLoadClick(): void {
    this.assets.loadFromFile(Assets.AssetType.Texture);
  }

  onTilesheetLoadClick(): void {
    this.assets.loadFromFile(Assets.AssetType.Tilesheet);
  }

  onSpritesheetLoadClick(): void {
    this.assets.loadFromFile(Assets.AssetType.Spritesheet);
  }

}
