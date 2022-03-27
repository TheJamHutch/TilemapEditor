import '../style.scss';
import jquery from 'jquery';
import { Assets } from './assets';
import { View } from './view';
import { App } from './app';

// @ts-ignore
window.$ = window.jquery = jquery;

// Identifies the last know user of the upload file input element to determine whether the correct type of file was selected.
let lastFileUser: string;

export function exportJson(id: string, obj: any): void {
  const json = JSON.stringify(obj);
  const a = document.createElement('a');
  a.href = `data:application/json;charset=utf-8,${json}`;
  a.download = `${id}.json`;
  a.click();
}

function initEvents(){
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
  $(View.elements.editorCanvas).on('mousemove', 
    (e: any) => {
      App.listeners.onEditorMouseMove({ x: e.offsetX, y: e.offsetY });
    });
  $(View.elements.editorCanvas).on('mousedown',
    (e: any) => {
      App.listeners.onEditorMouseDown({ x: e.offsetX, y: e.offsetY });
    });
  $(View.elements.editorCanvas).on('mouseup', 
    (e: any) => {
      App.listeners.onEditorMouseUp({ x: e.offsetX, y: e.offsetY });
    });

  // Palette mouse events
  $(View.elements.paletteCanvas).on('mousemove', 
    (e: any) => {
      App.listeners.onPaletteMouseMove({ x: e.offsetX, y: e.offsetY });
    });
  $(View.elements.paletteCanvas).on('mousedown',
    (e: any) => {
      App.listeners.onPaletteMouseDown({ x: e.offsetX, y: e.offsetY });
      View.listeners.onPaletteSelect();
    });

  // Bind view element events
  $(View.elements.newBtn).on('click', 
    (e: any) => {
      App.listeners.onNewMap();
      View.listeners.onNewMap();
    });
  $(View.elements.saveBtn).on('click',
    (e: any) => {
      const mapName = View.mapName();
      const savedMap = App.editor.saveMap(mapName);
      exportJson(mapName, savedMap);
    });
  $(View.elements.loadBtn).on('click', 
    (e: any) => {
      lastFileUser = 'loadMap';
      $(View.elements.uploadFileInput).trigger('click');
    });
  $(View.elements.resizeBtn).on('click',
    (e: any) => {
      //editor.resizeMap(View.mapDimensions());
    });
  $(View.elements.newTilesheetBtn).on('click',
    (e: any) => {
      $(View.elements.paletteCanvas).hide();
      $(View.elements.newSheetSection).show();
    });
  $(View.elements.saveTilesheetBtn).on('click',
    (e: any) => {
      console.log('save tilesheet');
    });
  $(View.elements.loadTilesheetBtn).on('click',
    (e: any) => {
      lastFileUser = 'loadTilesheet';
      $(View.elements.uploadFileInput).trigger('click');
    });
  $(View.elements.uploadFileInput).on('change',
    (e: any) => {
      const file = e.target.files[0];
      if (file){
        loadAssetFromFile(file);
      }
    });
  $(View.elements.textureBrowseBtn).on('click',
    (e: any) => {
      lastFileUser = 'loadTexture';
      $(View.elements.uploadFileInput).trigger('click');
    });
  $(View.elements.createSheetBtn).on('click',
    (e: any) => {
      const id = View.elements.sheetNameInput.value;
      const textureId = View.elements.textureNameInput.value;
      const clipSize = parseInt(View.elements.tileSizeSelect.value);
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
  
      $(View.elements.newSheetSection).hide();
      $(View.elements.paletteCanvas).show();
    });
  $(View.elements.tabSelectorTilemap).on('click',
    (e: any) => {
      View.listeners.onTabSelect('tilemap');
    });
  $(View.elements.tabSelectorEntities).on('click',
    (e: any) => {
      View.listeners.onTabSelect('entities');
    });
  $(View.elements.tileSizeSelect).on('change', 
    (e: any) => {
      const textureId = View.elements.textureNameInput.value;
      const texture = Assets.store.textures[textureId];
      const clipSize = parseInt(View.elements.tileSizeSelect.value);
      
      const dims = {
        x: texture.resolution.x / clipSize,
        y: texture.resolution.y / clipSize
      };

      $(View.elements.sheetXDimInput).attr('value', dims.x);
      $(View.elements.sheetYDimInput).attr('value', dims.y);
    });
  $(View.elements.tilesheetSelect).on('change',
    (e: any, extra: any) => {
      const tilesheetId = (e.target.value) ? e.target.value : extra;
      App.listeners.onTilesheetChange(tilesheetId);
      View.listeners.onTilesheetChange(tilesheetId);
    });
  $(View.elements.layerSelect).on('change',
    (e: any) => {
      App.listeners.onLayerChange();
      View.listeners.onLayerChange();
    });
  $(View.elements.addLayerBtn).on('click',
    (e: any) => {
      App.listeners.onAddLayer();
      View.listeners.onAddLayer();
    });
  $(View.elements.removeLayerBtn).on('click', 
    (e: any) => {
      const selectedLayers = $(View.elements.layerSelect).val() as string[];
      const layerIdx = parseInt(selectedLayers[0]);
      App.listeners.onRemoveLayer(layerIdx);
    });
}

function update() {
  App.update();

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
      App.listeners.onLoadMap(asset);
      View.listeners.onLoadMap();

    } else if (asset.type === 'tilesheet' && lastFileUser === 'loadTilesheet'){
      const tilesheetId = asset.id;
      App.listeners.onLoadTilesheet(asset);
      View.listeners.onLoadTilesheet();

      let sheets = Object.values(Assets.store.tilesheets) as Assets.Tilesheet[];
      let firstSheet = (sheets.length === 1);
      if (firstSheet){
        $(View.elements.tilesheetSelect).trigger('change', tilesheetId);
      }
    } else {
      console.warn('Wrong file selected');
    }
  } else if (file.type === 'image/png'){
    if (lastFileUser === 'loadTexture'){
      // Remove file extension to get texture ID
      const textureId = file.name.substring(0, file.name.lastIndexOf('.'));
      View.listeners.onTextureLoad(textureId);
    } else {
      console.warn('Wrong file selected');
    }
  } else {
    console.warn(`Attempted to open an unsupported file type: ${file.name}, ${file.type}`);
  }
}

$(() => {

  View.initElements(App.config);

  const editorContext = View.elements.editorCanvas.getContext('2d') as CanvasRenderingContext2D;
  editorContext.imageSmoothingEnabled = false;
  const paletteContext = View.elements.paletteCanvas.getContext('2d') as CanvasRenderingContext2D;
  paletteContext.imageSmoothingEnabled = false;
  App.init(editorContext, paletteContext);

  View.initListeners(App.editor, App.palette);

  initEvents();

  update();
});
