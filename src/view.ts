import { Vector } from "./primitives";
import { Editor } from "./editor";
import { Palette } from "./palette";
import { Assets } from "./assets";

export namespace View{
  export let elements = {} as any;
  export let listeners = {} as any;

  export function initElements(config: any){
    elements = {
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
    elements.editorCanvas.width = config.editor.resolution.x;
    elements.editorCanvas.height = config.editor.resolution.y;
    elements.paletteCanvas.width = config.palette.resolution.x;
    elements.paletteCanvas.height = config.palette.resolution.y;
  
    elements.xDimInput.value = 30; //editor.tilemap!.mapDimensions.x;
    elements.yDimInput.value = 30; //editor.mapDimensions.y;
    
    // Init tabs
    $(elements.tabContentEntities).hide();
    $(elements.tabContentTilemap).show();
    $(elements.tabSelectorTilemap).css('color', 'yellow');
  
    $(elements.newSheetSection).hide();
  }

  export function initListeners(editor: Editor, palette: Palette){
    listeners = {
      onNewMap:
        () => {
          $(elements.mapNameInput).prop('value', editor.mapId);
          $(elements.xDimInput).prop('value', editor.tilemap!.dimensions.x);
          $(elements.yDimInput).prop('value', editor.tilemap!.dimensions.y);
          const layerCount = editor.tilemap!.layers.length - 1;
          const layerName = 'layer' + layerCount;
          $(elements.layerSelect).empty();
          $(elements.layerSelect).prepend(`<option value="${layerCount}" selected>${layerName}</option>`);
        },
      onLoadMap:
        () => {
          $(elements.mapNameInput).prop('value', editor.mapId);
          $(elements.xDimInput).prop('value', editor.tilemap!.dimensions.x);
          $(elements.yDimInput).prop('value', editor.tilemap!.dimensions.y);

          // Add layers from loaded map to the layer select box
          $(elements.layerSelect).empty();
          let layerCount = -1;
          for (let layer of editor.tilemap!.layers){
            layerCount++;
            const layerName = 'layer' + layerCount;
            $(elements.layerSelect).prepend(`<option value="${layerCount}" selected>${layerName}</option>`);
          }
        },
      onLoadTilesheet:
        (tilesheetId: string) => {
          $(elements.tilesheetSelect).empty();
          let sheets = Object.values(Assets.store.tilesheets) as Assets.Tilesheet[];
          for (let sheet of sheets){
            $(elements.tilesheetSelect).append(`<option value="${sheet.id}">${sheet.id}</option>`);
          }
        },
      onPaletteSelect:
        () => {
          const tileIdx = palette.selectedTileType;
          const isSolid = (palette.tilesheet.solidMap[tileIdx] == 1) ? true : false;
          const effect = palette.tilesheet.effectMap[tileIdx];
    
          $(elements.solidCheckbox).prop('checked', isSolid);
          $(elements.tileEffectSelect).prop('value', effect);
        },
      onLayerChange:
        () => {
          const tilesheetId = selectedTilesheetId();
          updateTilesheetSelection(tilesheetId);
        },
      onTabSelect:
        (tabId: string) => {
          if (tabId === 'tilemap'){
            $(elements.tabContentEntities).hide();
            $(elements.tabContentTilemap).show();
            $(elements.tabSelectorEntities).css('color', 'white');
            $(elements.tabSelectorTilemap).css('color', 'yellow');
          } else if (tabId === 'entities'){
            $(elements.tabContentTilemap).hide();
            $(elements.tabContentEntities).show();
            $(elements.tabSelectorEntities).css('color', 'yellow');
            $(elements.tabSelectorTilemap).css('color', 'white');
          }
        },
      onTileSizeChange:
        () => {
          const tilesheetId = elements.sheetNameInput.value;
          updateSheetDimensions(tilesheetId);
        },
      onTilesheetChange:
        (tilesheetId: string) => {
          updateTilesheetSelection(tilesheetId);
        },
      onAddLayer:
        () => {
          const layerCount = editor.tilemap!.layers.length - 1;
          const layerName = 'layer' + layerCount;
          $(elements.layerSelect).prepend(`<option value="${layerCount}">${layerName}</option>`);
        },
      onRemoveLayer:
        (layerIdx: number) => {
          $(`#layerSelect option[value="${layerIdx}"]`).remove();
        },
      onTextureLoad:
        (textureId: string) => {
          $(elements.textureNameInput).prop('value', textureId);
          updateSheetDimensions(textureId);
        }
    }
    
  }

  function updateTilesheetSelection(tilesheetId: string){
    $(elements.tilesheetSelect).find('option').each(
      (index, element) => {
        element.selected = (element.value === tilesheetId);
      });
  }

  function updateSheetDimensions(textureId: string){
    const texture = Assets.store.textures[textureId];
    const clipSize = parseInt(elements.tileSizeSelect.value);
    const sheetDimensions = {
      x: texture.resolution.x / clipSize,
      y: texture.resolution.y / clipSize
    };
    
    $(elements.sheetXDimInput).prop('value', sheetDimensions.x);
    $(elements.sheetYDimInput).prop('value', sheetDimensions.y);
  }

  export function mapName(): string {
    return elements.mapNameInput.value;
  }

  export function mapDimensions(): Vector {
    return {
      x: parseInt(elements.xDimInput.value),
      y: parseInt(elements.yDimInput.value)
    }
  }

  export function selectedLayerIndex(): number {
    let layerIdx = -1;
    
    $(elements.layerSelect)
      .find('option')
      .each(
        (index, element) => {
          if (element.selected){
            layerIdx = element.value;
          }
        });
      
    return layerIdx;
  }

  export function selectedTilesheetId(): string {
    let id = '';

    $(elements.tilesheetSelect)
      .find('option')
      .each(
        (index, element) => {
          if (element.selected){
            id = element.value;
          }
        });

    return id;
  }

}