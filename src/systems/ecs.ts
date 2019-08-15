import { Sound } from '../sound';
import { Game } from '../game';

export class EntityEngine {

  systemsMap = new Map<Function, EntitySystem<any>>();

  systems: EntitySystem<any>[] = [];

  time: number;

  worldWidth: number;

  worldHeight: number;

  level: string[][];

  sound = new Sound();

  constructor(public game: Game) {}

  getSystem<T extends EntitySystem<any>>(systemClass: Function) {
    return this.systemsMap.get(systemClass) as T;
  }

  register(system: EntitySystem<any>) {
    this.systems.push(system);
    this.systemsMap.set(system.constructor, system);
    system.engine = this;
  }

  init() {
    for (const system of this.systems) {
      system.init();
    }
  }

  update(timeStep: number) {
    this.time += timeStep;
    for (const system of this.systems) {
      system.update();
    }
  }

  clear() {
    this.time = 0;
    this.systems = [];
    this.systemsMap.clear();
  }
}

export abstract class EntitySystem<E> {

  entities: E[] = [];

  engine: EntityEngine;

  init() {

  }

  add(entity: E) {
    (entity as any).system = this;
    this.entities.push(entity);
  }

  remove(entity: E) {
    const index = this.entities.indexOf(entity);
    if (index !== -1) {
      this.entities.splice(index, 1);
    }
  }

  clear() {
    this.entities = [];
  }

  start() {

  }

  end() {

  }

  abstract update(): void

}

export class Entity {

  system: EntitySystem<any>;

  parent: Entity;

  getTopParent() {
    let topParent: Entity = this;
    while (topParent.parent) {
      topParent = this.parent;
    }
    return topParent;
  }

  *getAncestors() {
    let parent: Entity = this;
    yield parent;
    while (parent.parent) {
      parent = this.parent;
      yield parent;
    }
  }

  destroy() {
    this.system.remove(this);
  }

}