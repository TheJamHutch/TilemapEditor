import '../style.scss';
import jquery from 'jquery';
import { Editor } from './editor';
import { Palette } from './palette';
import { Assets } from './assets';

// @ts-ignore
window.$ = window.jquery = jquery;

let dom = {} as any;
let editor: Editor;
let palette: Palette;
// Identifies the last know user of the upload file input element to determine whether the correct type of file was selected.
let lastFileUser: string;

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

export function exportJson(id: string, obj: any): void {
  const json = JSON.stringify(obj);
  const a = document.createElement('a');
  a.href = `data:application/json;charset=utf-8,${json}`;
  a.download = `${id}.json`;
  a.click();
}

function initDom(){
  dom = {
    // Canvas
    editorCanvas: $('#editor-canvas')[0] as HTMLCanvasElement,
    paletteCanvas: $('#palette-canvas')[0] as HTMLCanvasElement,
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

  // Set resolution of each canvas
  dom.editorCanvas.width = config.editor.resolution.x;
  dom.editorCanvas.height = config.editor.resolution.y;
  dom.paletteCanvas.width = config.palette.resolution.x;
  dom.paletteCanvas.height = config.palette.resolution.y;
  
  // Init tabs
  $(dom.tabContentEntities).hide();
  $(dom.tabContentTilemap).show();
  $(dom.tabSelectorTilemap).css('color', 'yellow');

  $(dom.newSheetSection).hide();
}

function initEvents(){
  // Init keyboard events
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
  $(dom.editorCanvas).on('mouseup', (e) => {
    editor.onMouseUp({ x: e.offsetX, y: e.offsetY });
  });

  // Palette mouse events
  $(dom.paletteCanvas).on('mousemove', (e) => {
    palette.onMouseMove({ x: e.offsetX, y: e.offsetY });
  });
  $(dom.paletteCanvas).on('mousedown', (e) => {
    palette.onMouseDown({ x: e.offsetX, y: e.offsetY });
    editor.selectedTileType = palette.selectedTileType;

    /*
    const tilesheet = Assets.store.tilesheets[tilesheetId];
    const tileIdx = e;
    const isSolid = (tilesheet.solidMap[tileIdx] == 1) ? true : false;
    const effect = tilesheet.effectMap[tileIdx];
    
    $(dom.solidCheckbox).prop('checked', isSolid);
    $(dom.tileEffectSelect).prop('value', effect);*/
  });
  
  const onNewBtnClick = function(e: any){
    const x = parseInt(dom.xDimInput.value);
    const y = parseInt(dom.yDimInput.value);
    editor.newMap({ x, y });
    $(dom.mapNameInput).prop('value', '');
    const layerCount = editor.tilemap?.layers.length
    const layerName = 'layer' + layerCount;
    $(dom.layerSelect).prepend(`<option value="${layerCount}">${layerName}</option>`);
    
    /*
    if (config.storageEnabled){
      localStorage.setItem('map', JSON.stringify(mapObj));
    }*/
  };

  const onSaveBtnClick = function(e: any){
    const mapName = dom.mapNameInput.value;
    const savedMap = editor.saveMap(mapName);
    exportJson(mapName, savedMap);
  };

  const onLoadBtnClick = function(e: any){
    lastFileUser = 'loadMap';
    $(dom.uploadFileInput).trigger('click');
  };

  const onLayerSelectChange = function(e: any){
    //const layer = editor.worldMap!.tilemap.layers[e.target.value];
  

    //$(`#tilesheetSelect option[value=${layer.tilesheetId}]`).prop('selected', true);
  };

  const onResizeBtnClick = function(e: any){
    const x = parseInt(dom.xDimInput.value);
    const y = parseInt(dom.yDimInput.value);
    //editor.resizeMap({ x, y });
  }

  const onUploadFileInputChange = function(e: any){
    const file = e.target.files[0];
    if (file){
      loadAssetFromFile(file);
    }
  };

  const onNewTilesheetBtnClick = function(e: any){
    $(dom.paletteCanvas).hide();
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
    const tilesheetId = e.target.value;
    palette.loadTilesheet(tilesheetId);
  }
  
  const onTextureBrowseBtnClick = function(e: any){
    lastFileUser = 'loadTexture';
    $(dom.uploadFileInput).trigger('click');
  };
  const onCreateSheetBtnClick = function(e: any){

    const id = dom.sheetNameInput.value;
    const textureId = dom.textureNameInput.value;
    const clipSize = parseInt(dom.tileSizeSelect.value);
    const texture = Assets.store.textures[textureId];
    const dims = {
      x: texture.resolution.x / clipSize,
      y: texture.resolution.y / clipSize
    };
    
    const sheet = new Assets.Tilesheet({
      id,
      type: 'tilesheet',
      textureId,
      clipSize,
      dimensions: { x: dims.x, y: dims.y },
      solidMap: [],
      effectMap: []
    });
    Assets.loadTilesheet(sheet);

    $(dom.newSheetSection).hide();
    $(dom.paletteCanvas).show();
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
    const firstSheet = Object.values(Assets.store.tilesheets)[0] as Assets.Tilesheet;
    const layer = {
      tilesheetId: firstSheet.id,
      tiles: []
    };
    editor.tilemap!.addLayer(layer);
    const layerCount = editor.tilemap!.layers.length;
    const layerName = 'layer' + layerCount;
    $(dom.layerSelect).prepend(`<option value="${layerCount}">${layerName}</option>`);
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
}

function update() {
  editor.update();
  palette.update();

  requestAnimationFrame(() => {
    update();
  });
}

// Load asset from a File into assets map
async function loadAssetFromFile(file: File){
  const fileText = await Assets.readFileText(file);

  if (file.type === 'application/json'){
    const asset = JSON.parse(fileText);
    if (asset.type === 'map' && lastFileUser === 'loadMap'){
      Assets.loadGameMap(asset);
      editor.loadMap(asset.id);
      
      if (config.storageEnabled){
        localStorage.setItem('map', JSON.stringify(asset));
      }
    
      $(dom.mapNameInput).prop('value', asset.id);
      $(dom.xDimInput).prop('value', asset.tilemap.dimensions.x);
      $(dom.yDimInput).prop('value', asset.tilemap.dimensions.y);
    } else if (asset.type === 'tilesheet' && lastFileUser === 'loadTilesheet'){
      Assets.loadTilesheet(asset);
      
  
      if (config.storageEnabled){
        localStorage.setItem('tilesheet', JSON.stringify(asset));
      }
    
      const firstOption = (dom.tilesheetSelect.options.length === 0);
      const selected = (firstOption) ? 'selected' : '';
      $(dom.tilesheetSelect).prepend(`<option value="${asset.id}" ${selected}>${asset.id}</option>`);
      if (firstOption){
        palette.loadTilesheet(asset.id);
        if (editor.tilemap){
          console.log($(dom.layerSelect));
          
          const layerIdx = 0;
          editor.tilemap!.layers[layerIdx].tilesheetId = id;
        }
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

$(() => {

  initDom();
  
  const editorContext = dom.editorCanvas.getContext('2d') as CanvasRenderingContext2D;
  editorContext.imageSmoothingEnabled = false;
  editor = new Editor(editorContext, config.editor);

  const paletteContext = dom.paletteCanvas.getContext('2d') as CanvasRenderingContext2D;
  paletteContext.imageSmoothingEnabled = false;
  palette = new Palette(paletteContext, config.palette);

  // @TODO: Find another way to load textures
  Assets.loadTexture('basetiles', './assets/textures/basetiles.png');
  Assets.loadTexture('overtiles', './assets/textures/overtiles.png');

  /*
  if (config.storageEnabled){
    const initSheetJson = localStorage.getItem('tilesheet');
    if (initSheetJson){
      const initSheet = JSON.parse(initSheetJson);
      tilesheetId = initSheet.id;
      // @TODO: Call method on palette instead of raising event?
      Global.events.raise('tilesheetLoad', initSheet);
    }

    const initMapJson = localStorage.getItem('map');
    if (initMapJson){
      const initMap = JSON.parse(initMapJson);
      editor.loadMap(initMap.id);
      $(dom.mapNameInput).prop('value', initMap.id);
      $(dom.xDimInput).prop('value', initMap.tilemap.dimensions.x);
      $(dom.yDimInput).prop('value', initMap.tilemap.dimensions.y);

      if (config.autosaveEnabled){
        startMapAutosave(editor);
      }
    }
  }*/

  initEvents();

  update();
});
