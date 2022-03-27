import { Vector } from "./primitives";
import { Editor } from "./editor";
import { Palette } from "./palette";

export namespace View{
  export let elements = {} as any;
  export let listeners = {} as any;

  export function init(dom: any, editor: Editor, palette: Palette){
    elements = {
      mapNameInput: {
        update: 
          (name: string): void => {
            $(dom.mapNameInput).prop('value', name);
          },
        value:
          (): string => {
            return dom.mapNameInput.value;
          } 
      },
      mapDimensions: {
        update:
          () => {
            $(dom.xDimInput).prop('value', editor.tilemap!.dimensions.x);
            $(dom.yDimInput).prop('value', editor.tilemap!.dimensions.y);
          },
        value:
          (): Vector => {
            return {
              x: parseInt(dom.xDimInput.value),
              y: parseInt(dom.yDimInput.value)
            }
          }
      }
    }

    listeners = {
      onNewMap:
        () => {
          elements.mapNameInput.update('');
        }
    }
    
  }

}