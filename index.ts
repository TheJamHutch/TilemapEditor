import './style.scss';
import jquery from 'jquery';
import { Events } from './src/events';
import { Editor } from './src/editor';
import { Palette } from './src/palette';
import { loadBitmap } from './src/render';

import overworldTilesheet from './assets/tilesheets/overworld.json';

// @ts-ignore
window.$ = window.jquery = jquery;

let editor: Editor;
let palette: Palette;
let assets: any;

function initConfig(): any {
  let config = {
    mapDimensions: { x: 30, y: 30 },
    tileSize: 32,
    tilesheetId: 'overworld'
  };

  return config;
}

function initAssets(): void {
  assets = {
    textures: {
      basetiles: loadBitmap('./assets/textures/basetiles.png'),
      overtiles: loadBitmap('./assets/textures/overtiles.png'),
      player: loadBitmap('./assets/textures/player.png'),
      slime: loadBitmap('./assets/textures/slime.png')
    },
    tilesheets: {
      overworld: overworldTilesheet
    }
  };
}

function initDomElements(config: any): any {
  const editorCanvas = $('#editor-canvas')[0] as HTMLCanvasElement;
  editorCanvas.width = 800;
  editorCanvas.height = 600;

  const paletteCanvas = $('#palette-canvas')[0] as HTMLCanvasElement;
  paletteCanvas.width = 608;
  paletteCanvas.height = 300;

  let dom = {
    // Canvas
    editorCanvas,
    paletteCanvas,
    // Buttons
    newBtn: $('#newBtn')[0] as HTMLButtonElement,
    saveBtn: $('#saveBtn')[0] as HTMLButtonElement,
    loadBtn: $('#loadBtn')[0] as HTMLButtonElement,
    newTilesheetBtn: $('#newTilesheetBtn')[0] as HTMLButtonElement,
    saveTilesheetBtn: $('#saveTilesheetBtn')[0] as HTMLButtonElement,
    loadTilesheetBtn: $('#loadTilesheetBtn')[0] as HTMLButtonElement,
    // Inputs
    mapNameInput: $('#mapNameInput')[0] as HTMLInputElement,
    xDimInput: $('#xDimInput')[0] as HTMLInputElement,
    yDimInput: $('#yDimInput')[0] as HTMLInputElement,

    uploadFileInput: $('#uploadFileInput')[0] as HTMLInputElement,
    // Checkbox
    solidCheckbox: $('#solidCheckbox')[0] as HTMLInputElement,
    // Select
    tileEffectSelect: $('#tileEffectSelect')[0] as HTMLSelectElement,
    selectTilesheet: $('#tilesheetSelect')[0] as HTMLSelectElement,

    // New tilesheet dialog
    sheetNameInput: $('#sheetNameInput')[0] as HTMLInputElement,
    textureNameInput: $('#textureNameInput')[0] as HTMLInputElement,
    textureBrowseBtn: $('#textureBrowseBtn')[0] as HTMLButtonElement,
    tileSizeSelect: $('#tileSizeSelect')[0] as HTMLSelectElement,
    sheetXDimInput: $('#sheetXDimInput')[0] as HTMLInputElement,
    sheetYDimInput: $('#sheetYDimInput')[0] as HTMLInputElement,
    createSheetBtn: $('#createSheetBtn')[0] as HTMLButtonElement,
  };

  return dom;
}

function initKeyboardEvents(){
  $(document).on('keydown', (e) => {
    editor.onKeyDown(e.code);
  });
  $(document).on('keyup', (e) => {
    editor.onKeyUp(e.code);
  });
}

// Binds the listeners to the DOM event
function initMouseEvents(dom: any){

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
}

function initListeners(dom: any): any {

  const onNewBtnClick = function(e: any){
    const x = parseInt(dom.xDimInput.value);
    const y = parseInt(dom.yDimInput.value);
    editor.newMap({ x, y });
    $(dom.mapNameInput).prop('value', '');
  };

  const onSaveBtnClick = function(e: any){
    const mapName = dom.mapNameInput.value;

    if (!mapName || mapName === ''){
      console.warn('Canot save map, name required');
      alert('You must enter a name for the map before you can save it.');
      return;
    }

    const savedMap = editor.saveMap(dom.mapNameInput.value);
    const savedMapJson = JSON.stringify(savedMap);

    const saveAnchor = document.createElement('a');
    saveAnchor.href = `data:application/json;charset=utf-8,${savedMapJson}`;
    saveAnchor.download = `${savedMap.name}.json`;
    saveAnchor.click();
    // @TODO: Delete link ???
  };

  const onLoadBtnClick = function(e: any){
    $(dom.uploadFileInput).trigger('click', 'map');
  };

  const onUploadFileInputChange = async function(e: any, t: any){

  };

  const onNewTilesheetBtnClick = function(e: any){
    console.log('new sheet');
    
  };
  const onSaveTilesheetBtnClick = function(e: any){
    console.log('save sheet');
    
  };
  const onLoadTilesheetBtnClick = function(e: any){
    $(dom.uploadFileInput).trigger('click', 'tilesheet'); // Pass an additional parameter specifying the type of expected file
  };
  
  const onTextureBrowseBtnClick = function(e: any){
    $(dom.uploadFileInput).trigger('click', 'texture'); // Pass an additional parameter specifying the type of expected file
  };
  const onCreateSheetBtnClick = function(e: any){

    const sheet = {
      name: dom.sheetNameInput.value,
      textureId: dom.textureNameInput.value,
      solidMap: [],
      effectMap: []
    };
    
    editor.loadTilesheet(sheet);
    palette.loadTilesheet(sheet);
  };

  return {
    newBtn: {
      click: onNewBtnClick
    },
    saveBtn: {
      click: onSaveBtnClick
    },
    loadBtn: {
      click: onLoadBtnClick
    },
    newTilesheetBtn: {
      click: onNewTilesheetBtnClick
    },
    saveTilesheetBtn: {
      click: onSaveTilesheetBtnClick
    },
    loadTilesheetBtn: {
      click: onLoadTilesheetBtnClick
    },
    uploadFileInput: {
      change: onUploadFileInputChange
    },

    textureBrowseBtn: {
      click: onTextureBrowseBtnClick
    },
    createSheetBtn: {
      click: onCreateSheetBtnClick
    }
  }
}

function bindListeners(listeners: any, dom: any){
  $(dom.newBtn).on('click', listeners.newBtn.click);
  $(dom.saveBtn).on('click', listeners.saveBtn.click);
  $(dom.loadBtn).on('click', listeners.loadBtn.click);
  $(dom.newTilesheetBtn).on('click', listeners.newTilesheetBtn.click);
  $(dom.saveTilesheetBtn).on('click', listeners.saveTilesheetBtn.click);
  $(dom.loadTilesheetBtn).on('click', listeners.loadTilesheetBtn.click);
  $(dom.uploadFileInput).on('change', listeners.uploadFileInput.change);

  $(dom.textureBrowseBtn).on('click', listeners.textureBrowseBtn.click);
  $(dom.createSheetBtn).on('click', listeners.createSheetBtn.click);
}

function update(events: Events) {
  events.poll();
  editor.update();
  palette.update();

  requestAnimationFrame(() => {
    update(events);
  });
}

async function readFileText(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (() => {
      resolve(reader.result);
    });

    reader.onerror = reject;

    reader.readAsText(file);
  });
}

// Init order => config, assets, domElements, objects, domEvents
$(() => {
  const config = initConfig();
  // @TODO: Should this be global???
  initAssets();
  const dom = initDomElements(config);
  const events = new Events();

  const editorContext = dom.editorCanvas.getContext('2d');
  editorContext.imageSmoothingEnabled = false;
  editor = new Editor(events, editorContext, { x: 800, y: 600 }, config, assets);

  const paletteContext = dom.paletteCanvas.getContext('2d');
  paletteContext.imageSmoothingEnabled = false;
  palette = new Palette(events, paletteContext, { x: 608, y: 300 }, config, assets);

  initKeyboardEvents();
  initMouseEvents(dom);

  let listeners = initListeners(dom);
  bindListeners(listeners, dom);

  // @TODO: Move this
  events.register('paletteSelect', (tileIdx: number) => {
    let tilesheet = assets.tilesheets[config.tilesheetId];

    if (tilesheet.solidMap[tileIdx] > 0){
      $(dom.solidCheckbox).prop('checked', true);
    } else {
      $(dom.solidCheckbox).prop('checked', false);
    }

    let effectIdx = tilesheet.effectMap[tileIdx];
    $(dom.tileEffectSelect).prop('value', effectIdx);
  });
  
  update(events);

});
