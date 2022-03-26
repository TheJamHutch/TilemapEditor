import { Editor } from './editor';
import { Palette } from './palette';
import { loadBitmap } from './render';
import { Global } from './global';
import { Tilemap } from './tilemap';

export namespace App{
  const config = {
    autosaveEnabled: false,
    storageEnabled: false,
    editor: {
      resolution: { x: 800, y: 600 },
      mapDimensions: { x: 30, y: 30 },
      tileSize: 32
    },
    palette: {
      resolution: { x: 608, y: 300 },
      tileSize: 32
    }
  };

  let state: {editor: Editor, palette: Palette};

  export function init(editorContext: CanvasRenderingContext2D, paletteContext: CanvasRenderingContext2D){
    state = {} as any;
    state.editor = new Editor(editorContext, config.editor);
    state.palette = new Palette(paletteContext, config.palette);
  }

  export function update(){
    state.editor.update();
    state.palette.update();
  }
}
