import './style.scss';
import jquery from 'jquery';
import { Events } from './src/events';
import { Editor } from './src/editor';
import { Palette } from './src/palette';
import { Controls } from './src/controls';
import { loadBitmap, drawBitmap } from './src/render';

// @ts-ignore
window.$ = window.jquery = jquery;

let editor: Editor;
let palette: Palette;
let controls: Controls;

function initConfig(): any {
  let config = {
    editor: {
      resolution: { x: 800, y: 600 },
      mapDimensions: { x: 30, y: 30 },
      tileSize: 32
    },
    palette: {
      resolution: { x: 608, y: 300 },
      sheetDimensions: { x: 6, y: 6 },
      clipSize: 32,
      viewSize: 32
    }
  }

  return config;
}

function initAssets(): any {
  let assets = {
    textures: {
      tileSheet: loadBitmap('./img/basetiles.png'),
      player: loadBitmap('./img/player.png'),
      slime: loadBitmap('./img/slime.png')
    }
  };

  return assets;
}

function initDomElements(config: any): any {
  const editorCanvas = $('#editor-canvas')[0] as HTMLCanvasElement;
  editorCanvas.width = config.editor.resolution.x;
  editorCanvas.height = config.editor.resolution.y;

  const paletteCanvas = $('#palette-canvas')[0] as HTMLCanvasElement;
  paletteCanvas.width = config.palette.resolution.x;
  paletteCanvas.height = config.palette.resolution.y;


  let domElements = {
    editorCanvas,
    paletteCanvas
  };

  return domElements;
}

function update(events: Events) {
  events.poll();
  editor.update();
  palette.update();

  requestAnimationFrame(() => {
    update(events);
  });
}

// Init order => config, assets, domElements, objects, domEvents
$(() => {
  const config = initConfig();
  const assets = initAssets();
  const dom = initDomElements(config);
  const events = new Events();

  const editorContext = dom.editorCanvas.getContext('2d');
  editor = new Editor(events, editorContext, config.editor, assets.textures['tileSheet']);

  const paletteContext = dom.paletteCanvas.getContext('2d');
  palette = new Palette(events, paletteContext, config.palette, assets.textures['tileSheet']);
  

  // Bind app events to the corresponding DOM event or element.
  $(document).on('keydown', (e) => {
    editor.onKeyDown(e.code);
  });
  $(document).on('keyup', (e) => {
    editor.onKeyUp(e.code);
  });

  // Editor mouse events
  $(dom.editorCanvas).on('mousemove', (e) => {
    editor.onMouseMove({ x: e.offsetX, y: e.offsetY });
  });
  $(dom.editorCanvas).on('mousedown', (e) => {
    editor.onMouseDown({ x: e.offsetX, y: e.offsetY });
  });
  $(document).on('mouseup', (e) => {
    editor.onMouseUp({ x: e.offsetX, y: e.offsetY });
    
  });

  // Palette mouse events
  $(dom.paletteCanvas).on('mousemove', (e) => {
    palette.onMouseMove({ x: e.offsetX, y: e.offsetY });
  });
  $(dom.paletteCanvas).on('mousedown', (e) => {
    palette.onMouseDown({ x: e.offsetX, y: e.offsetY });
  });


  // Create map file
  const xDimInput = $('#xDimInput')[0] as HTMLInputElement;
  const yDimInput = $('#yDimInput')[0] as HTMLInputElement;
  const newBtn = $('#newBtn')[0] as HTMLButtonElement;
  $(newBtn).on('click', (e) => {
    const x = parseInt(xDimInput.value);
    const y = parseInt(yDimInput.value);
    editor.newMap({ x, y });
  });


  // Save map file
  const saveInput = $('#saveInput')[0] as HTMLInputElement;
  const saveBtn = $('#saveBtn')[0] as HTMLButtonElement;
  $(saveInput).on('input', (e) => {
    if (e.target.value.length > 0){
      $(saveBtn).prop('disabled', false);
    } else {
      $(saveBtn).prop('disabled', true);
    }
  });
  $(saveBtn).on('click', (e) => {

    const savedMap = editor.saveMap(saveInput.value);
    const savedMapJson = JSON.stringify(savedMap);

    const saveAnchor = document.createElement('a');
    saveAnchor.href = `data:application/json;charset=utf-8,${savedMapJson}`;
    saveAnchor.download = `${savedMap.name}.json`;
    saveAnchor.click();
    // @TODO: Delete link ???
  });


  // Load map file
  const loadInput = $('#loadInput')[0] as HTMLInputElement;
  const loadBtn = $('#loadBtn')[0] as HTMLButtonElement;
  const localFileInput = $('#loadFileInput')[0] as HTMLInputElement;
  $(loadBtn).on('click', (e) => {
    $(localFileInput).trigger('click');
  });
  $(localFileInput).on('change', (e) => {
    const selectedFile = e.target.files[0];
    $(loadInput).attr('value', selectedFile.name);

    let reader = new FileReader();
    reader.readAsText(selectedFile);

    reader.onload = ((readerEvent) => {
      let mapJson = readerEvent.target.result as string;
      let mapObj = JSON.parse(mapJson);
      editor.loadMap(mapObj);
    });
  });
  
  update(events);
});

