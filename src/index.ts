import '../style.scss';
import jquery from 'jquery';
import { Editor } from './editor';
import { Palette } from './palette';
import { loadBitmap } from './render';
import { Global } from './global';
import { Tilemap } from './tilemap';
import { Assets } from './assets';
import { App } from './app';

// @ts-ignore
window.$ = window.jquery = jquery;

let dom = {} as any;
let tilesheetLoaded = false;
let tilesheetId = '';
let mapLoaded = false;

let editor: Editor;
let palette: Palette

let layerCount = 0;

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
    layerSelect: $('#layerSelect')[0] as HTMLSelectElement,
    tilesheetSelect: $('#tilesheetSelect')[0] as HTMLSelectElement,

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

    newSheetSection: $('#newSheetSection')[0] as HTMLDivElement,

    addLayerBtn: $('#addLayerBtn')[0] as HTMLButtonElement,
    removeLayerBtn: $('#removeLayerBtn')[0] as HTMLButtonElement,
  };
  
  // Init tabs
  $(dom.tabContentEntities).hide();
  $(dom.tabContentTilemap).show();
  $(dom.tabSelectorTilemap).css('color', 'yellow');

  $(dom.newSheetSection).hide();
}

// Identifies the last know user of the upload file input element to determine whether the correct type of file was selected.
let lastFileUser: string;

function update() {
  Global.events.poll();
  editor.update();
  palette.update();
  App.update();

  requestAnimationFrame(() => {
    update();
  });
}



function addTilemapLayer(){

}

// Load asset from a File into assets map
async function loadAssetFromFile(file: File){
  const fileText = await Assets.readFileText(file);

  if (file.type === 'application/json'){
    const asset = JSON.parse(fileText);
    if (asset.type === 'map' && lastFileUser === 'loadMap'){
      Assets.loadGameMap(asset);
      Global.events.raise('mapLoad', Assets.store.maps[asset.id]);
      mapLoaded = true;
        
      if (config.storageEnabled){
        localStorage.setItem('map', JSON.stringify(asset));
      }
    
      $(dom.mapNameInput).prop('value', asset.id);
      $(dom.xDimInput).prop('value', asset.tilemap.dimensions.x);
      $(dom.yDimInput).prop('value', asset.tilemap.dimensions.y);
    } else if (asset.type === 'tilesheet' && lastFileUser === 'loadTilesheet'){
      Assets.store.tilesheets[asset.id] = asset;

      Assets.loadTilesheet(asset);
  
      if (config.storageEnabled){
        localStorage.setItem('tilesheet', JSON.stringify(asset));
      }
    
      const firstOption = (dom.tilesheetSelect.options.length === 0);
      
      const selected = (firstOption) ? 'selected' : '';
      $(dom.tilesheetSelect).prepend(`<option value="${asset.id}" ${selected}>${asset.id}</option>`);
      if (firstOption){
        changeTilesheet(asset.id);
      }
    } else {
      console.warn('Wrong file selected');
    }
  } else if (file.type === 'image/png'){
    if (lastFileUser === 'loadTexture'){
      // Remove file extension to get texture ID
      const textureId = file.name.substring(0, file.name.lastIndexOf('.'));
      $(dom.textureNameInput).attr('value', textureId);
      updateSheetDimensions();
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

function updateSheetDimensions(){
  const textureId = dom.textureNameInput.value;
  const texture = Assets.store.textures[textureId];
  const clipSize = parseInt(dom.tileSizeSelect.value);
  
  const dims = {
    x: texture.resolution.x / clipSize,
    y: texture.resolution.y / clipSize
  };
  
  $(dom.sheetXDimInput).attr('value', dims.x);
  $(dom.sheetYDimInput).attr('value', dims.y);
}

function changeTilesheet(id: string){
  tilesheetLoaded = true;
  tilesheetId = id;
  palette.useTilesheet(tilesheetId);
  if (editor.worldMap?.tilemap){
    const layerIdx = 0;
    editor.worldMap!.tilemap.layers[layerIdx].tilesheetId = tilesheetId;
  }
}

$(() => {

  initDom();

  // @TODO: Find another way to load textures
  Assets.loadTexture('basetiles', './assets/textures/basetiles.png');
  Assets.loadTexture('overtiles', './assets/textures/overtiles.png');
  
  const editorCanvas = $('#editor-canvas')[0] as HTMLCanvasElement;
  editorCanvas.width = config.editor.resolution.x;
  editorCanvas.height = config.editor.resolution.y;
  const editorContext = editorCanvas.getContext('2d') as CanvasRenderingContext2D;

  editorContext.imageSmoothingEnabled = false;
  editor = new Editor(editorContext, config.editor);

  // Init palette
  const paletteCanvas = $('#palette-canvas')[0] as HTMLCanvasElement;
  paletteCanvas.width = config.palette.resolution.x;
  paletteCanvas.height = config.palette.resolution.y;
  const paletteContext = paletteCanvas.getContext('2d') as CanvasRenderingContext2D;
  paletteContext.imageSmoothingEnabled = false;
  palette = new Palette(paletteContext, config.palette);


  App.init(editorContext, paletteContext);

  if (config.storageEnabled){
    const initSheetJson = localStorage.getItem('tilesheet');
    if (initSheetJson){
      const initSheet = JSON.parse(initSheetJson);
      tilesheetId = initSheet.id;
      // @TODO: Call method on palette instead of raising event?
      Global.events.raise('tilesheetLoad', initSheet);
      tilesheetLoaded = true;
    }

    const initMapJson = localStorage.getItem('map');
    if (initMapJson){
      const initMap = JSON.parse(initMapJson);
      Global.events.raise('mapLoad', initMap);
      mapLoaded = true;
      $(dom.mapNameInput).prop('value', initMap.id);
      $(dom.xDimInput).prop('value', initMap.tilemap.dimensions.x);
      $(dom.yDimInput).prop('value', initMap.tilemap.dimensions.y);

      if (config.autosaveEnabled){
        startMapAutosave(editor);
      }
    }
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
        type: 'map',
        tilemap: {
          dimensions: { x, y },
          layers: [
            {
              name: 'layer0',
              tilesheetId,
              tiles: []
            }
          ]
        }
      };

      Global.events.raise('mapLoad', mapObj);
      mapLoaded = true;
      $(dom.mapNameInput).prop('value', '');

      const layerName = 'layer' + layerCount;
      $(dom.layerSelect).prepend(`<option value="${layerCount}">${layerName}</option>`);
      layerCount = 1;
      console.log(tilesheetId);
      
      if (config.storageEnabled){
        localStorage.setItem('map', JSON.stringify(mapObj));
      }
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
      saveAnchor.download = `${savedMap.id}.json`;
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

  const onLayerSelectChange = function(e: any){
    const layer = editor.worldMap!.tilemap.layers[e.target.value];
    console.log(layer);
    console.log(editor.worldMap!.tilemap.layers);
  

    $(`#tilesheetSelect option[value=${layer.tilesheetId}]`).prop('selected', true);
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
    $(paletteCanvas).hide();
    $(dom.newSheetSection).show();
  };
  const onSaveTilesheetBtnClick = function(e: any){
    console.log('save sheet');
    
  };
  const onLoadTilesheetBtnClick = function(e: any){
    lastFileUser = 'loadTilesheet';
    $(dom.uploadFileInput).trigger('click');
  };
  const onTilesheetSelectChange = function(e: any){
    tilesheetId = e.target.value;
    changeTilesheet(tilesheetId);
  }
  
  const onTextureBrowseBtnClick = function(e: any){
    lastFileUser = 'loadTexture';
    $(dom.uploadFileInput).trigger('click');
  };
  const onCreateSheetBtnClick = function(e: any){

    // @ TODO: Get textures another way
    const textureId = dom.textureNameInput.value;
    const texture = Assets.store.textures[textureId];
    const clipSize = parseInt(dom.tileSizeSelect.value);
    const dims = {
      x: texture.resolution.x / clipSize,
      y: texture.resolution.y / clipSize
    };

    

    const sheet = {
      id: dom.sheetNameInput.value,
      type: 'tilesheet',
      textureId,
      clipSize: dom.tileSizeSelect.value,
      dimensions: { x: dims.x, y: dims.y },
      solidMap: [],
      effectMap: []
    };
    
    Assets.loadTilesheet(sheet);

    $(dom.newSheetSection).hide();
    $(paletteCanvas).show();
  };

  const onTabSelectorTilemapClick = function(e: any){
    $(dom.tabContentEntities).hide();
    $(dom.tabContentTilemap).show();
    
    $(dom.tabSelectorEntities).css('color', 'white');
    $(dom.tabSelectorTilemap).css('color', 'yellow');
  }
  const onTabSelectorEntitiesClick = function(e: any){
    $(dom.tabContentTilemap).hide();
    $(dom.tabContentEntities).show();

    $(dom.tabSelectorEntities).css('color', 'yellow');
    $(dom.tabSelectorTilemap).css('color', 'white');
  }

  const onTileSizeSelectChange = function(e: any){
    updateSheetDimensions();
  }

  const onAddLayerBtnClick = function(e: any){
    const layer = {
      tilesheetId,
      tiles: []
    };
    editor.worldMap!.tilemap.addLayer(layer);
    const layerName = 'layer' + layerCount;
    $(dom.layerSelect).prepend(`<option value="${layerCount}">${layerName}</option>`);
    layerCount++;
  };
  const onRemoveLayerBtnClick = function(e: any){
    console.log('RM');
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
  $(dom.tileSizeSelect).on('change', onTileSizeSelectChange);
  $(dom.tilesheetSelect).on('change', onTilesheetSelectChange);
  $(dom.layerSelect).on('change', onLayerSelectChange);
  $(dom.addLayerBtn).on('click', onAddLayerBtnClick);
  $(dom.removeLayerBtn).on('click', onRemoveLayerBtnClick);

  Global.events.register('paletteSelect', (e) => {
    const tilesheet = Assets.store.tilesheets[tilesheetId];
    const tileIdx = e;
    const isSolid = (tilesheet.solidMap[tileIdx] == 1) ? true : false;
    const effect = tilesheet.effectMap[tileIdx];
    
    $(dom.solidCheckbox).prop('checked', isSolid);
    $(dom.tileEffectSelect).prop('value', effect);
  });

  update();
});
