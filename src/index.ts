import '../style.scss';
import jquery from 'jquery';
import { Assets } from './assets';
import { View } from './view';
import { App } from './app';

// @ts-ignore
window.$ = window.jquery = jquery;

function initDom(){
  let dom = {
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

    tabSelectorTextures: $('#tab-selector-textures')[0] as HTMLDivElement,
    tabSelectorTilemap: $('#tab-selector-tilemap')[0] as HTMLDivElement,
    tabSelectorEntities: $('#tab-selector-entities')[0] as HTMLDivElement,
    tabContentTextures: $('#tab-content-textures')[0] as HTMLDivElement,
    tabContentTilemap: $('#tab-content-tilemap')[0] as HTMLDivElement,
    tabContentEntities: $('#tab-content-entities')[0] as HTMLDivElement,

    newSheetSection: $('#newSheetSection')[0] as HTMLDivElement,
    newSheetForm: $('#newSheetForm')[0] as HTMLFormElement,
    newSheetCancelBtn: $('#newSheetCancelBtn')[0] as HTMLButtonElement,

    addLayerBtn: $('#addLayerBtn')[0] as HTMLButtonElement,
    removeLayerBtn: $('#removeLayerBtn')[0] as HTMLButtonElement,

    // Texture tab content
    textureSelect: $('#textureSelect')[0] as HTMLSelectElement,
    textureNewBtn: $('#textureNewBtn')[0] as HTMLButtonElement,
    textureRemoveBtn: $('#textureRemoveBtn')[0] as HTMLButtonElement,
    textureImageDiv: $('#textureImageDiv')[0] as HTMLDivElement,
  };

  // Set resolution of each canvas
  dom.editorCanvas.width = App.config.editor.resolution.x;
  dom.editorCanvas.height = App.config.editor.resolution.y;
  dom.paletteCanvas.width = App.config.palette.resolution.x;
  dom.paletteCanvas.height = App.config.palette.resolution.y;

  dom.xDimInput.value = App.config.editor.mapDimensions.x.toString();
  dom.yDimInput.value = App.config.editor.mapDimensions.y.toString();
  
  // Init tabs
  $(dom.tabContentTextures).show();
  $(dom.tabContentEntities).hide();
  $(dom.tabContentTilemap).hide();
  $(dom.tabSelectorTextures).css('color', 'yellow');

  $(dom.newSheetSection).hide();

  return dom;
}

function bindEvents(dom: any){
  // Init keyboard events
  $(document).on('keydown', 
    (e: any) => {
      App.listeners.onKeyDown(e.code);
    });
  $(document).on('keyup', 
    (e: any) => {
      App.listeners.onKeyUp(e.code);
    });

  // Editor mouse events
  $(dom.editorCanvas).on('mousemove', 
    (e: any) => {
      App.listeners.onEditorMouseMove({ x: e.offsetX, y: e.offsetY });
    });
  $(dom.editorCanvas).on('mousedown',
    (e: any) => {
      App.listeners.onEditorMouseDown({ x: e.offsetX, y: e.offsetY });
    });
  $(dom.editorCanvas).on('mouseup', 
    (e: any) => {
      App.listeners.onEditorMouseUp({ x: e.offsetX, y: e.offsetY });
    });

  // Palette mouse events
  $(dom.paletteCanvas).on('mousemove', 
    (e: any) => {
      App.listeners.onPaletteMouseMove({ x: e.offsetX, y: e.offsetY });
    });
  $(dom.paletteCanvas).on('mousedown',
    (e: any) => {
      App.listeners.onPaletteMouseDown({ x: e.offsetX, y: e.offsetY });
      View.listeners.onPaletteSelect();
    });

  // Bind view element events
  $(dom.newBtn).on('click', 
    (e: any) => {
      const mapDimensions = View.mapDimensions();
      App.listeners.onNewMap(mapDimensions);
      View.listeners.onNewMap();
    });
  $(dom.saveBtn).on('click',
    (e: any) => {
      const mapName = View.mapName();
      const savedMap = App.editor.saveMap(mapName);
      exportJson(mapName, savedMap);
    });
  $(dom.loadBtn).on('click', 
    async (e: any) => {
      const mapId = await Assets.loadAssetFromFile(Assets.AssetType.Map);
      App.listeners.onLoadMap(mapId);
      View.listeners.onLoadMap(mapId);
    });
  $(dom.resizeBtn).on('click',
    (e: any) => {
      //editor.resizeMap(View.mapDimensions());
    });
  $(dom.newTilesheetBtn).on('click',
    (e: any) => {
      $(dom.newSheetForm).trigger('reset');
      $(dom.paletteCanvas).hide();
      $(dom.newSheetSection).show();
    });
  $(dom.saveTilesheetBtn).on('click',
    (e: any) => {
      console.log('save tilesheet');
    });
  $(dom.loadTilesheetBtn).on('click',
    async (e: any) => {
      const tilesheetId = await Assets.loadAssetFromFile(Assets.AssetType.Tilesheet);

      const tilesheet = Assets.store.tilesheets[tilesheetId];
      // Check that there is a texture loaded for the tilesheet
      if (!Assets.store.textures[tilesheet.textureId]){
        console.warn(`Failed to load tilesheet: tilesheet references an unloaded texture`);
        return;
      }

      App.listeners.onLoadTilesheet(tilesheetId);
      View.listeners.onLoadTilesheet();

      const sheets = Object.values(Assets.store.tilesheets);
      const firstSheet = (sheets.length === 1);
      if (firstSheet){
        // Trigger a tilesheetChange event to select and use the first tilesheet
        $(dom.tilesheetSelect).trigger('change', tilesheetId);
      }
    });
  $(dom.textureBrowseBtn).on('click',
    (e: any) => {
      
    });
  $(dom.createSheetBtn).on('click',
    (e: any) => {
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
      //Assets.loadTilesheet(sheet);
  
      $(dom.newSheetSection).hide();
      $(dom.paletteCanvas).show();
    });
  $(dom.tabSelectorTextures).on('click', (e: any) => {
    View.listeners.onTabSelect('textures');
  });
  $(dom.tabSelectorTilemap).on('click',
    (e: any) => {
      View.listeners.onTabSelect('tilemap');
    });
  $(dom.tabSelectorEntities).on('click',
    (e: any) => {
      View.listeners.onTabSelect('entities');
    });
  $(dom.tileSizeSelect).on('change', 
    (e: any) => {
      const textureId = dom.textureNameInput.value;
      const texture = Assets.store.textures[textureId];
      const clipSize = parseInt(dom.tileSizeSelect.value);
      
      const dims = {
        x: texture.resolution.x / clipSize,
        y: texture.resolution.y / clipSize
      };

      $(dom.sheetXDimInput).attr('value', dims.x);
      $(dom.sheetYDimInput).attr('value', dims.y);
    });
  $(dom.tilesheetSelect).on('change',
    (e: any, extra: any) => {
      const tilesheetId = (e.target.value) ? e.target.value : extra;
      App.listeners.onTilesheetChange(tilesheetId);
      View.listeners.onTilesheetChange(tilesheetId);
    });
  $(dom.layerSelect).on('change',
    (e: any) => {
      const layerIdx = View.selectedLayerIndex();
      App.listeners.onLayerChange(layerIdx);
      View.listeners.onLayerChange(layerIdx);
    });
  $(dom.addLayerBtn).on('click',
    (e: any) => {
      App.listeners.onAddLayer();
      View.listeners.onAddLayer();
    });
  $(dom.removeLayerBtn).on('click', 
    (e: any) => {
      const selectedLayers = $(dom.layerSelect).val() as string[];
      const layerIdx = parseInt(selectedLayers[0]);
      App.listeners.onRemoveLayer(layerIdx);
    });
  $(dom.newSheetCancelBtn).on('click',
    (e: any) => {
      $(dom.paletteCanvas).show();
      $(dom.newSheetSection).hide();
    });

  $(dom.textureSelect).on('change',
    (e: any) => {
      const textureId = View.selectedTexture();
      $(dom.textureImageDiv).empty();
      $(dom.textureImageDiv).append(`<img src="assets/textures/${textureId}.png" width="100%" height="100%" />`);
    })
  $(dom.textureNewBtn).on('click',
    async (e: any) => {
      const textureId = await Assets.loadAssetFromFile(Assets.AssetType.Texture);

      if (!textureId){
        console.warn('Failed to load texture, wrong file type?');
        return;
      }

      View.listeners.onTextureNew(textureId);
    });
  $(dom.textureRemoveBtn).on('click',
    (e: any) => {
      const textureId = View.selectedTexture();
      delete Assets.store.textures[textureId];
      View.listeners.onTextureRemove(textureId);
    });
  
}

function update() {
  App.update();

  requestAnimationFrame(() => {
    update();
  });
}

function exportJson(id: string, obj: any): void {
  const json = JSON.stringify(obj);
  const a = document.createElement('a');
  a.href = `data:application/json;charset=utf-8,${json}`;
  a.download = `${id}.json`;
  a.click();
}

$(() => {
  let dom = initDom();

  View.initListeners(dom);

  const editorContext = dom.editorCanvas.getContext('2d') as CanvasRenderingContext2D;
  editorContext.imageSmoothingEnabled = false;
  const paletteContext = dom.paletteCanvas.getContext('2d') as CanvasRenderingContext2D;
  paletteContext.imageSmoothingEnabled = false;
  App.init(editorContext, paletteContext);

  bindEvents(dom);

  update();
});
