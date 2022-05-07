import { Injectable } from '@angular/core';
import { Vector } from './core/primitives';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  // Immutable, injectable config service.

  readonly editorResolution = { x: 800, y: 600 }
  readonly paletteResolution = { x: 600, y: 400 };

  readonly initMapDimensions = { x: 100, y: 100 };

  readonly tileSize = 32;
  readonly paletteCellSize = 32;

  readonly lineDashSpeed = 4;

  readonly selectedTab = 'Assets'

  constructor() { }
}
