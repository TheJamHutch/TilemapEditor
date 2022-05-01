export class Events{
  listeners: any;
  queue: any[];

  constructor(){
    this.listeners = {};
    this.queue = [];
  }

  raise(id: string, context: any){
    if (this.listeners[id]){
      this.queue.push({ id, context });
    } else {
      this.listeners[id] = {}
      this.listeners[id].callbacks = [];
    }
  }

  register(id: string, callback?: (context: any) => void){
    // If the listeners doesn't already exist then create it first
    if (!this.listeners[id]){
      this.listeners[id] = {}
      this.listeners[id].callbacks = [];
    }

    if (callback){
      this.listeners[id].callbacks.push(callback);
    }
  }

  poll(){
    if (this.queue.length > 0){
      let item = this.queue.shift();
      for(let fn of this.listeners[item.id].callbacks){
        fn(item.context);
      }
    }
  }

}
