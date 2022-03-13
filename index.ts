import './style.scss';
import jquery from 'jquery';
import { Events } from './src/events';
import { Editor } from './src/editor';
import { Palette } from './src/palette';
import { loadBitmap } from './src/render';

import overworldTilesheet from './tilesheet/overworld.json';

// @ts-ignore
window.$ = window.jquery = jquery;

let editor: Editor;
let palette: Palette;

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
    },
    tilesheetId: 'overworld'
  };

  return config;
}

function initAssets(): any {
  let assets = {
    textures: {
      tileSheet: loadBitmap('./img/basetiles.png'),
      player: loadBitmap('./img/player.png'),
      slime: loadBitmap('./img/slime.png')
    },
    tilesheets: {
      overworld: overworldTilesheet
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

  let dom = {
    // Canvas
    editorCanvas,
    paletteCanvas,
    // Buttons
    newBtn: $('#newBtn')[0] as HTMLButtonElement,
    saveBtn: $('#saveBtn')[0] as HTMLButtonElement,
    loadBtn: $('#loadBtn')[0] as HTMLButtonElement,
    createTilesheetBtn: $('#createTilesheetBtn')[0] as HTMLButtonElement,
    loadTilesheetBtn: $('#loadTilesheetBtn')[0] as HTMLButtonElement,
    // Inputs
    mapNameInput: $('#mapNameInput')[0] as HTMLInputElement,
    xDimInput: $('#xDimInput')[0] as HTMLInputElement,
    yDimInput: $('#yDimInput')[0] as HTMLInputElement,
    downloadInput: $('#downloadInput')[0] as HTMLInputElement, // Invisible input to open browse file dialog
    solidCheckbox: $('#solidCheckbox')[0] as HTMLInputElement,
    // Select
    tileEffectSelect: $('#tileEffectSelect')[0] as HTMLSelectElement,
    selectTilesheet: $('#tilesheetSelect')[0] as HTMLSelectElement,
  };

  // Set initial value for map dimension inputs
  $(dom.xDimInput).prop('value', config.editor.mapDimensions.x);
  $(dom.yDimInput).prop('value', config.editor.mapDimensions.y);

  // Add the name of the init tilesheet to the multiline list
  //$(dom.)

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
    const savedMap = editor.saveMap(dom.mapNameInput.value);
    const savedMapJson = JSON.stringify(savedMap);

    const saveAnchor = document.createElement('a');
    saveAnchor.href = `data:application/json;charset=utf-8,${savedMapJson}`;
    saveAnchor.download = `${savedMap.name}.json`;
    saveAnchor.click();
    // @TODO: Delete link ???
  };
  const onMapNameInputChange = function(e: any){
    if (e.target.value.length > 0){
      $(dom.saveBtn).prop('disabled', false);
    } else {
      $(dom.saveBtn).prop('disabled', true);
    }
  };

  const onLoadBtnClick = function(e: any){
    $(dom.downloadInput).trigger('click');
  };

  const onDownloadInputChange = function(e: any){
    const selectedFile = e.target.files[0];

    let reader = new FileReader();
    reader.readAsText(selectedFile);

    reader.onload = ((readerEvent) => {
      let mapJson = readerEvent.target.result as string;
      let mapObj = JSON.parse(mapJson);

      $(dom.mapNameInput).attr('value', mapObj.name);
      $(dom.xDimInput).prop('value', mapObj.dimensions.x);
      $(dom.yDimInput).prop('value', mapObj.dimensions.y);
      editor.loadMap(mapObj);
    });
  };

  const onCreateTilesheetBtnClick = function(e: any){
    console.log('create sheet');
    
  };
  const onLoadTilesheetBtnClick = function(e: any){
    console.log('load sheet');
    
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
    createTilesheetBtn: {
      click: onCreateTilesheetBtnClick
    },
    loadTilesheetBtn: {
      click: onLoadTilesheetBtnClick
    },
    mapNameInput: {
      change: onMapNameInputChange
    },
    downloadInput: {
      change: onDownloadInputChange
    }
  }
}

function bindListeners(listeners: any, dom: any){
  $(dom.newBtn).on('click', listeners.newBtn.click);
  $(dom.mapNameInput).on('input', listeners.mapNameInput.change);
  $(dom.saveBtn).on('click', listeners.saveBtn.click);
  $(dom.loadBtn).on('click', listeners.loadBtn.click);
  $(dom.createTilesheetBtn).on('click', listeners.createTilesheetBtn.click);
  $(dom.loadTilesheetBtn).on('click', listeners.loadTilesheetBtn.click);
  $(dom.downloadInput).on('change', listeners.downloadInput.change);
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
  editor = new Editor(events, editorContext, config.editor, assets.textures['tileSheet'], assets.tilesheets[config.tilesheetId]);

  const paletteContext = dom.paletteCanvas.getContext('2d');
  palette = new Palette(events, paletteContext, config.palette, assets.textures['tileSheet']);

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

