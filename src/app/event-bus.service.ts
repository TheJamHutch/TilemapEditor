import { Injectable } from '@angular/core';

export enum EventType{
  NewFrame,
  TilesheetChange,
  NewMap,
  SaveMap,
  LoadMap,
  MapChange,
  PaletteSelect,
  ToggleGrid,
  AssetsUpdate,
  LayerChange,
  AddLayer,
  RemoveLayer,
  DrawModeChange
}

@Injectable({
  providedIn: 'root'
})
export class EventBusService {

  listeners: any;   // Holds all of the registered callbacks for each type of event.
  queue: any[];     // 

  constructor() {
    this.listeners = {};
    this.queue = [];
  }

  register(type: EventType, callback: any){
    let key = this.getKeyFromEventType(type);
    
    if (!this.listeners[key]){
      this.listeners[key] = {};
      this.listeners[key].callbacks = [];
    }

    this.listeners[key].callbacks.push(callback);
  }

  raise(type: EventType, context?: any): void {
    let key = this.getKeyFromEventType(type);

    if (this.listeners[key]){
      this.queue.push({key, context});
    }
  }

  poll(): void {
    if (this.queue.length > 0){
      // Loop through all items in the queue
      for (let item of this.queue){
        // Run through all of the registered callbacks for each item.
        for(let cb of this.listeners[item.key].callbacks){
          cb(item.context);
        }
      }

      // Finally clear the queue
      this.queue = [];
    }
  }

  private getKeyFromEventType(type: EventType): string {
    let key;
    
    switch (type){
      case EventType.NewFrame:
        key = 'NewFrame';
        break;
      case EventType.TilesheetChange:
        key = 'TilesheetChange';
        break;
      case EventType.NewMap:
        key = 'NewMap';
        break;
      case EventType.SaveMap:
        key = 'SaveMap';
        break;
      case EventType.LoadMap:
        key = 'LoadMap';
        break;
      case EventType.MapChange:
        key = 'MapChange';
        break;
      case EventType.PaletteSelect:
        key = 'PaletteSelect';
        break;
      case EventType.ToggleGrid:
        key = 'ToggleGrid';
        break;
      case EventType.AssetsUpdate:
        key = 'AssetsUpdate';
        break;
      case EventType.LayerChange:
        key = 'LayerChange';
        break;
      case EventType.AddLayer:
        key = 'AddLayer';
        break;
      case EventType.RemoveLayer:
        key = 'RemoveLayer';
        break;
      case EventType.DrawModeChange:
        key = 'DrawModeChange';
        break;
      default:
        key = 'Noop';
        break;
    }

    return key;
  }
}
