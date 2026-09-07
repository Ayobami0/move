import { ColorValue } from "react-native";
import { GameEngine } from "react-native-game-engine";

export type AnimationState = "idle" | "run";
export type Direction = "left" | "up" | "right" | "down";

export interface Position2D {
  x: number;
  y: number;
}

export interface Size2D {
  width: number;
  height: number;
}

export interface IGameEngine<T = never> extends GameEngine {
  stop: () => void;
  start: () => void;
  swap: (newEntities: Promise<GameEngineEntities> | GameEngineEntities) => void;
  dispatch: (event: GameEngineEvent<T>) => void;
}

export interface GameEngineEvent<T = never> {
  type: string;
  [key: string]: T | string;
}

export interface Camera {
  x: number;
  y: number;
}

export interface ObstacleEntity {
  body: Matter.Body;
  type: "rock" | "tree" | "wall" | "boulder" | "bush" | "fence" | "pillar";
  pos: Position2D;
  renderer: React.ComponentType<any>;
}

export interface GameEntity {
  body: Matter.Body;
  color: ColorValue;
  pos: Position2D;
  state?: AnimationState;
  direction?: Direction;
  targetPosition?: Position2D | null;
  bypassTarget?: Position2D | null;
  activeAxis?: "horizontal" | "vertical" | null;
  detourDirection?: Direction | null;
  blockedDetours?: Direction[];
  avoidanceState?: {
    isBypassing: boolean;
    detourAxis: "horizontal" | "vertical";
  } | null;
  stuckTicks?: number;
  renderer: React.ComponentType<any>;
}

export interface GameEngineEntities {
  physics: {
    engine: Matter.Engine;
    world: Matter.World;
  };
  camera?: Camera;
  [key: string]: any;
}
