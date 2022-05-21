import { Injectable } from '@angular/core';
import { Vector } from './core/primitives';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  // Immutable, injectable config service.

  readonly editorResolution = { x: 800, y: 600 }
  readonly paletteResolution = { x: 700, y: 350 };

  readonly initMapDimensions = { x: 30, y: 20 };

  readonly tileSize = 32;
  readonly paletteCellSize = 48;

  readonly lineDashSpeed = 4;

  readonly selectedTab = 'Tiling'

  constructor() { }
}
