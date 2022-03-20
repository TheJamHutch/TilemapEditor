import './style.scss';
import jquery from 'jquery';
import { Events } from './src/events';
import { Editor } from './src/editor';
import { Palette } from './src/palette';
import { loadBitmap } from './src/render';

// @ts-ignore
window.$ = window.jquery = jquery;

let dom = {} as any;
let assets: any = {
  textures: {
    basetiles: loadBitmap('./assets/textures/basetiles.png'),
    overtiles: loadBitmap('./assets/textures/overtiles.png')
  },
  tilesheets: {},
  maps: {},
  spritesheets: {},
};
let events: Events;
let tilesheetLoaded = false;
let mapLoaded = false;

const globalConfig = {
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

function initDom(){
  dom = {
    // Buttons
    newBtn: $('#newBtn')[0] as HTMLButtonElement,
    saveBtn: $('#saveBtn')[0] as HTMLButtonElement,
    loadBtn: $('#loadBtn')[0] as HTMLButtonElement,
    resizeBtn: $('#resizeBtn')[0] as HTMLButtonElement,
    newTilesheetBtn: $('#newTilesheetBtn')[0] as HTMLButtonElement,
    saveTilesheetBtn: $('#saveTilesheetBtn')[0] as HTMLButtonElement,
    loadTilesheetBtn: $('#loadTilesheetBtn')[0] as HTMLButtonElement,
    // Inputs
    mapNameInput: $('#mapNameInput')[0] as HTMLInputElement,
    xDimInput: $('#xDimInput')[0] as HTMLInputElement,
    yDimInput: $('#yDimInput')[0] as HTMLInputElement,

    // Hidden input to open the file picker dialog on the user's OS
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

    tabSelectorTilemap: $('#tab-selector-tilemap')[0] as HTMLDivElement,
    tabSelectorEntities: $('#tab-selector-entities')[0] as HTMLDivElement,
    tabContentTilemap: $('#tab-content-tilemap')[0] as HTMLDivElement,
    tabContentEntities: $('#tab-content-entities')[0] as HTMLDivElement,
  };
}

// Identifies the last know user of the upload file input element to determine whether the correct type of file was selected.
let lastFileUser: string;

function update(editor: Editor, palette: Palette) {
  events.poll();
  editor.update();
  palette.update();

  requestAnimationFrame(() => {
    update(editor, palette);
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

// Load asset from a File into assets map
async function loadAssetFromFile(file: File){
  const fileText = await readFileText(file);

  if (file.type === 'application/json'){
    const asset = JSON.parse(fileText);
    if (asset.type === 'map' && lastFileUser === 'loadMap'){
      assets.maps[asset.name] = asset;
      events.raise('mapLoad', assets.maps[asset.name]);
      mapLoaded = true;
      localStorage.setItem('map', JSON.stringify(asset));
      $(dom.mapNameInput).prop('value', asset.name);
      $(dom.xDimInput).prop('value', asset.dimensions.x);
      $(dom.yDimInput).prop('value', asset.dimensions.y);
    } else if (asset.type === 'tilesheet' && lastFileUser === 'loadTilesheet'){
      assets.tilesheets[asset.name] = asset;
      tilesheetLoaded = true;
      localStorage.setItem('tilesheet', JSON.stringify(asset));
      events.raise('tilesheetLoad', assets.tilesheets[asset.name]);
    } else {
      console.warn('Wrong file selected');
    }
  } else if (file.type === 'image/png'){
    if (lastFileUser === 'loadTexture'){

    } else {
      console.warn('Wrong file selected');
    }
  } else {
    console.warn(`Attempted to open an unsupported file type: ${file.name}, ${file.type}`);
  }
}

function startMapAutosave(editor: Editor){
  const autosaveInterval = 30000;
  setInterval(() => {
    const mapJson = JSON.stringify(editor.saveMap(dom.mapNameInput.value));
    localStorage.setItem('map', mapJson);
  }, autosaveInterval);
}

$(() => {

  initDom();

  events = new Events();
  
  const editorCanvas = $('#editor-canvas')[0] as HTMLCanvasElement;
  editorCanvas.width = globalConfig.editor.resolution.x;
  editorCanvas.height = globalConfig.editor.resolution.y;
  const editorContext = editorCanvas.getContext('2d');
  editorContext.imageSmoothingEnabled = false;
  const editor = new Editor(events, editorContext, globalConfig.editor, assets);

  // Init palette
  const paletteCanvas = $('#palette-canvas')[0] as HTMLCanvasElement;
  paletteCanvas.width = globalConfig.palette.resolution.x;
  paletteCanvas.height = globalConfig.palette.resolution.y;
  const paletteContext = paletteCanvas.getContext('2d');
  paletteContext.imageSmoothingEnabled = false;
  const palette = new Palette(events, paletteContext, globalConfig.palette, assets);

  const initSheetJson = localStorage.getItem('tilesheet');
  if (initSheetJson){
    const initSheet = JSON.parse(initSheetJson);
    // @TODO: Call method on palette instead of raising event?
    events.raise('tilesheetLoad', initSheet);
    tilesheetLoaded = true;
  }

  const initMapJson = localStorage.getItem('map');
  if (initMapJson){
    const initMap = JSON.parse(initMapJson);
    events.raise('mapLoad', initMap);
    mapLoaded = true;
    $(dom.mapNameInput).prop('value', initMap.name);
    $(dom.xDimInput).prop('value', initMap.dimensions.x);
    $(dom.yDimInput).prop('value', initMap.dimensions.y);

    startMapAutosave(editor);
  }

  // Init keyboard events
  $(document).on('keydown', (e) => {
    editor.onKeyDown(e.code);
  });
  $(document).on('keyup', (e) => {
    editor.onKeyUp(e.code);
  });

  // Editor mouse events
  $(editorCanvas).on('mousemove', (e) => {
    editor.onMouseMove({ x: e.offsetX, y: e.offsetY });
  });
  $(editorCanvas).on('mousedown', (e) => {
    editor.onMouseDown({ x: e.offsetX, y: e.offsetY });
  });
  // Mouseup events should be detected for editor canvas even when the mouse isn't on the canvas.
  $(document).on('mouseup', (e) => {
    editor.onMouseUp({ x: e.offsetX, y: e.offsetY });
  });

  // Palette mouse events
  $(paletteCanvas).on('mousemove', (e) => {
    palette.onMouseMove({ x: e.offsetX, y: e.offsetY });
  });
  $(paletteCanvas).on('mousedown', (e) => {
    palette.onMouseDown({ x: e.offsetX, y: e.offsetY });
  });
  
  const onNewBtnClick = function(e: any){
    if (tilesheetLoaded){
      const x = parseInt(dom.xDimInput.value);
      const y = parseInt(dom.yDimInput.value);

      const mapObj = {
        name: '',
        dimensions: { x, y },
        tiles: []
      };

      events.raise('mapLoad', mapObj);
      mapLoaded = true;
      $(dom.mapNameInput).prop('value', '');
      localStorage.setItem('map', JSON.stringify(mapObj));
    } else {
      console.warn('You must load a tilesheet before you can create a new map');
      alert('You must load a tilesheet before you can create a new map');
    }
    
  };

  const onSaveBtnClick = function(e: any){
    const mapName = dom.mapNameInput.value;

    if (!mapLoaded){
      console.warn('You must have a map before you can save it');
      alert('You must have a map before you can save it');
    } else if (!mapName || mapName === ''){
      console.warn('Canot save map, name required');
      alert('You must enter a name for the map before you can save it.');
    } else {
      const savedMap = editor.saveMap(dom.mapNameInput.value);
      const savedMapJson = JSON.stringify(savedMap);
      const saveAnchor = document.createElement('a');
      saveAnchor.href = `data:application/json;charset=utf-8,${savedMapJson}`;
      saveAnchor.download = `${savedMap.name}.json`;
      saveAnchor.click();
      // @TODO: Delete link ???
    }
  };

  const onLoadBtnClick = function(e: any){
    if (tilesheetLoaded){
      lastFileUser = 'loadMap';
      $(dom.uploadFileInput).trigger('click');
    } else {
      console.warn('You must load a tilesheet before you can load a map');
      alert('You must load a tilesheet before you can load a map');
    }
  };

  const onResizeBtnClick = function(e: any){
    const x = parseInt(dom.xDimInput.value);
    const y = parseInt(dom.yDimInput.value);
    editor.resizeMap({ x, y });
  }

  const onUploadFileInputChange = function(e: any){
    const file = e.target.files[0];
    if (file){
      loadAssetFromFile(file);
    }
  };

  const onNewTilesheetBtnClick = function(e: any){
    console.log('new sheet');
    
  };
  const onSaveTilesheetBtnClick = function(e: any){
    console.log('save sheet');
    
  };
  const onLoadTilesheetBtnClick = function(e: any){
    lastFileUser = 'loadTilesheet';
    $(dom.uploadFileInput).trigger('click');
  };
  
  const onTextureBrowseBtnClick = function(e: any){
    lastFileUser = 'loadTexture';
    $(dom.uploadFileInput).trigger('click');
  };
  const onCreateSheetBtnClick = function(e: any){

    const sheet = {
      name: dom.sheetNameInput.value,
      textureId: dom.textureNameInput.value,
      solidMap: [],
      effectMap: []
    };
    
    //editor.loadTilesheet(sheet);
    //palette.loadTilesheet(sheet);
  };

  const onTabSelectorTilemapClick = function(e: any){
    $(dom.tabContentEntities).hide();
    $(dom.tabContentTilemap).show();
  }
  const onTabSelectorEntitiesClick = function(e: any){
    $(dom.tabContentTilemap).hide();
    $(dom.tabContentEntities).show();
  }

  // Bind listeners
  $(dom.newBtn).on('click', onNewBtnClick);
  $(dom.saveBtn).on('click', onSaveBtnClick);
  $(dom.loadBtn).on('click', onLoadBtnClick);
  $(dom.resizeBtn).on('click', onResizeBtnClick);
  $(dom.newTilesheetBtn).on('click', onNewTilesheetBtnClick);
  $(dom.saveTilesheetBtn).on('click', onSaveTilesheetBtnClick);
  $(dom.loadTilesheetBtn).on('click', onLoadTilesheetBtnClick);
  $(dom.uploadFileInput).on('change', onUploadFileInputChange);
  $(dom.textureBrowseBtn).on('click', onTextureBrowseBtnClick);
  $(dom.createSheetBtn).on('click', onCreateSheetBtnClick);
  $(dom.tabSelectorTilemap).on('click', onTabSelectorTilemapClick);
  $(dom.tabSelectorEntities).on('click', onTabSelectorEntitiesClick);


  update(editor, palette);
});
