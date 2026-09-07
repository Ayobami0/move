import { GameEngineEntities } from "@types";
import Adam from "./Adam";
import InfiniteTileMap from "./InfiniteTileMap";
import Obstacle from "./Obstacle";
import Matter from "matter-js";
import { windowWidth, windowHeight } from "@utils";

export { default as Adam } from "./Adam";
export { default as InfiniteTileMap } from "./InfiniteTileMap";
export { default as Obstacle } from "./Obstacle";

export function entities(): GameEngineEntities {
  const engine = Matter.Engine.create({
    enableSleeping: false,
    gravity: { x: 0, y: 0 },
  } as Matter.IEngineDefinition);

  const world = engine.world;
  const initialAdamX = windowWidth / 2;
  const initialAdamY = windowHeight / 2;

  const adamInstance = Adam(
    "Adam",
    world,
    { x: initialAdamX, y: initialAdamY },
    { width: 32, height: 48 },
  );

  // Placed static obstacles in world space surrounding the starting position
  const obstacles = {
    rock1: Obstacle("Rock1", world, "rock", { x: initialAdamX + 150, y: initialAdamY + 50 }, { width: 48, height: 48 }),
    tree1: Obstacle("Tree1", world, "tree", { x: initialAdamX - 180, y: initialAdamY - 100 }, { width: 64, height: 64 }),
    wall1: Obstacle("Wall1", world, "wall", { x: initialAdamX + 80, y: initialAdamY - 180 }, { width: 120, height: 32 }),
    boulder1: Obstacle("Boulder1", world, "boulder", { x: initialAdamX - 120, y: initialAdamY + 160 }, { width: 56, height: 56 }),
    bush1: Obstacle("Bush1", world, "bush", { x: initialAdamX + 220, y: initialAdamY - 80 }, { width: 48, height: 48 }),
    fence1: Obstacle("Fence1", world, "fence", { x: initialAdamX - 250, y: initialAdamY + 40 }, { width: 32, height: 140 }),
    pillar1: Obstacle("Pillar1", world, "pillar", { x: initialAdamX - 80, y: initialAdamY - 260 }, { width: 40, height: 80 }),
    rock2: Obstacle("Rock2", world, "rock", { x: initialAdamX - 300, y: initialAdamY - 150 }, { width: 52, height: 52 }),
    tree2: Obstacle("Tree2", world, "tree", { x: initialAdamX + 300, y: initialAdamY + 180 }, { width: 72, height: 72 }),
    wall2: Obstacle("Wall2", world, "wall", { x: initialAdamX - 180, y: initialAdamY + 280 }, { width: 160, height: 36 }),
    bush2: Obstacle("Bush2", world, "bush", { x: initialAdamX + 160, y: initialAdamY + 240 }, { width: 50, height: 50 }),
    boulder2: Obstacle("Boulder2", world, "boulder", { x: initialAdamX + 340, y: initialAdamY - 200 }, { width: 60, height: 60 }),
    pillar2: Obstacle("Pillar2", world, "pillar", { x: initialAdamX + 280, y: initialAdamY - 320 }, { width: 40, height: 80 }),
    tree3: Obstacle("Tree3", world, "tree", { x: initialAdamX - 350, y: initialAdamY + 200 }, { width: 64, height: 64 }),
  };

  const gameEntities: GameEngineEntities = {
    physics: { engine, world },
    camera: { x: windowWidth / 2 - initialAdamX, y: windowHeight / 2 - initialAdamY },
    infiniteTileMap: InfiniteTileMap({ x: initialAdamX, y: initialAdamY }),
    ...obstacles,
    Adam: adamInstance,
  };

  return gameEntities;
}

export const useEntities = () => {
  return {
    entities,
  };
};
