declare module 'pinia' {
  export function defineStore<Id extends string, S, G, A>(
    id: Id,
    options: any
  ): any;
  
  export function defineStore<Id extends string, SS>(
    id: Id, 
    storeSetup: () => SS,
    options?: any
  ): any;
  
  export function createPinia(): any;
  export function setActivePinia(pinia: any): void;
  export function getActivePinia(): any;
  export function acceptHMRUpdate(storeToUpdate: any, hmrModule: any): any;
  export function storeToRefs<T>(store: T): any;
} 