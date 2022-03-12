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
    }
  }
  
  register(id: string, callback: (context: any) => void){
    if (!this.listeners[id]){
      this.listeners[id] = {}
      this.listeners[id].callbacks = [];
    }

    this.listeners[id].callbacks.push(callback);
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
