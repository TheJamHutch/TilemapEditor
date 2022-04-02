import { Vector } from "./primitives"

export namespace Entities{
  export type Entity = {
    id: string,
    archetype: string,
    animationId: string,
    spritesheetId: string,
    pathNodes: Vector[]
  }

  export const instances = {} as any;

  export function load(rawEntities: any){
    
  }

  function createEntity(rawEntity: any): Entity{
    const entityCount = Object.values(instances).length;
    return {
        id: `${rawEntity.archetype}${entityCount}`,
        archetype: rawEntity.archetype,
        animationId: '',
        spritesheetId: rawEntity.spritesheetId,
        pathNodes: rawEntity.pathNodes
    };
  }
}