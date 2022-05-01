import { Vector } from "./primitives";
import { App } from "./app";
import { Assets } from "./assets";

export namespace View{
  export let listeners = {} as any;
  let dom = {} as any;

  export function initListeners(domRef: any){

    // @TODO
    dom = domRef;

    listeners = {
      onNewMap:
        () => {
          $(dom.mapNameInput).prop('value', '');
          $(dom.xDimInput).prop('value', App.editor.tilemap!.dimensions.x);
          $(dom.yDimInput).prop('value', App.editor.tilemap!.dimensions.y);
          const layerCount = App.editor.tilemap!.layers.length - 1;
          const layerName = 'layer' + layerCount;
          $(dom.layerSelect).empty();
          $(dom.layerSelect).prepend(`<option value="${layerCount}" selected>${layerName}</option>`);
        },
      onLoadMap:
        () => {
          $(dom.mapNameInput).prop('value', App.editor.mapId);
          $(dom.xDimInput).prop('value', App.editor.tilemap!.dimensions.x);
          $(dom.yDimInput).prop('value', App.editor.tilemap!.dimensions.y);

          // Add layers from loaded map to the layer select box
          $(dom.layerSelect).empty();
          let layerCount = -1;
          for (let layer of App.editor.tilemap!.layers){
            layerCount++;
            const layerName = 'layer' + layerCount;
            $(dom.layerSelect).prepend(`<option value="${layerCount}" selected>${layerName}</option>`);
          }

          
        },
      onLoadTilesheet:
        () => {
          $(dom.tilesheetSelect).empty();
          let sheets = Object.values(Assets.store.tilesheets) as Assets.Tilesheet[];
          for (let sheet of sheets){
            $(dom.tilesheetSelect).append(`<option value="${sheet.id}">${sheet.id}</option>`);
          }
          const firstSheet = (sheets.length === 1);
          if (firstSheet){
            $(dom.tilesheetSelect).prop('selectedIndex', 0);
          }
        },
      onPaletteSelect:
        () => {
          const tileIdx = App.palette.selectedTileType;
          const isSolid = (App.palette.tilesheet.solidMap[tileIdx] == 1) ? true : false;
          const effect = App.palette.tilesheet.effectMap[tileIdx];
    
          $(dom.solidCheckbox).prop('checked', isSolid);
          $(dom.tileEffectSelect).prop('value', effect);
        },
      onLayerChange:
        (layerIdx: number) => {
          const tilesheetId = App.editor.tilemap!.layers[layerIdx].tilesheetId;
          updateTilesheetSelection(tilesheetId);
        },
      onTabSelect:
        (tabId: string) => {
          if (tabId === 'tilemap'){
            $(dom.tabContentTextures).hide();
            $(dom.tabContentEntities).hide();
            $(dom.tabContentTilemap).show();
            $(dom.tabSelectorEntities).css('color', 'white');
            $(dom.tabSelectorTilemap).css('color', 'yellow');
            $(dom.tabSelectorTextures).css('color', 'white');
          } else if (tabId === 'entities'){
            $(dom.tabContentTilemap).hide();
            $(dom.tabContentTextures).hide();
            $(dom.tabContentEntities).show();
            $(dom.tabSelectorEntities).css('color', 'yellow');
            $(dom.tabSelectorTilemap).css('color', 'white');
            $(dom.tabSelectorTextures).css('color', 'white');
          } else if (tabId === 'textures'){
            $(dom.tabContentTilemap).hide();
            $(dom.tabContentEntities).hide();
            $(dom.tabContentTextures).show();
            $(dom.tabSelectorEntities).css('color', 'white');
            $(dom.tabSelectorTilemap).css('color', 'white');
            $(dom.tabSelectorTextures).css('color', 'yellow');
          }
        },
      onTileSizeChange:
        () => {
          const tilesheetId = dom.sheetNameInput.value;
          updateSheetDimensions(tilesheetId);
        },
      onTilesheetChange:
        (tilesheetId: string) => {
          updateTilesheetSelection(tilesheetId);
        },
      onAddLayer:
        () => {
          const layerCount = App.editor.tilemap!.layers.length - 1;
          const layerName = 'layer' + layerCount;
          $(dom.layerSelect).prepend(`<option value="${layerCount}">${layerName}</option>`);
        },
      onRemoveLayer:
        (layerIdx: number) => {
          // @TODO: Don't use hardcoded element ID here
          $(`#layerSelect option[value="${layerIdx}"]`).remove();
        },
      onTextureLoad:
        (textureId: string) => {
          $(dom.textureNameInput).prop('value', textureId);
          updateSheetDimensions(textureId);
        },
      onTextureNew:
        (textureId: string) => {
          $(dom.textureSelect).append(`<option value="${textureId}">${textureId}</option>`)
        },
      onTextureRemove:
        (textureId: string) => {
          // @TODO: Don't use hardcoded element ID here
          $(`#textureSelect option[value="${textureId}"]`).remove();
          $(dom.textureImageDiv)
            .find('img')
            .remove();
        }
    }
    
  }

  function updateTilesheetSelection(tilesheetId: string){
    $(dom.tilesheetSelect).find('option').each(
      (_, element) => {
        element.selected = (element.value === tilesheetId);
      });
  }

  function updateSheetDimensions(textureId: string){
    const texture = Assets.store.textures[textureId];
    const clipSize = parseInt(dom.tileSizeSelect.value);
    const sheetDimensions = {
      x: texture.resolution.x / clipSize,
      y: texture.resolution.y / clipSize
    };
    
    $(dom.sheetXDimInput).prop('value', sheetDimensions.x);
    $(dom.sheetYDimInput).prop('value', sheetDimensions.y);
  }

  export function mapName(): string {
    return dom.mapNameInput.value;
  }

  export function mapDimensions(): Vector {
    return {
      x: parseInt(dom.xDimInput.value),
      y: parseInt(dom.yDimInput.value)
    }
  }

  export function selectedLayerIndex(): number {
    let layerIdx = -1;
    
    $(dom.layerSelect)
      .find('option')
      .each(
        (_, element) => {
          if (element.selected){
            layerIdx = parseInt(element.value);
          }
        });
      
    return layerIdx;
  }

  export function selectedTilesheetId(): string {
    let id = '';

    $(dom.tilesheetSelect)
      .find('option')
      .each(
        (_, element) => {
          if (element.selected){
            id = element.value;
          }
        });

    return id;
  }

  export function selectedTexture(): string {
    let id = '';

    $(dom.textureSelect)
      .find('option')
      .each(
        (_, element) => {
          if (element.selected){
            id = element.value;
          }
        }
      )

    return id;
  }

}