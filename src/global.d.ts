import { IGameEngine } from "@types";

declare global {
  var global: typeof globalThis & {
    topInset: number;
    bottomInset: number;
    leftInset: number;
    rightInset: number;
    gameEngine: IGameEngine | null;
  };
  var topInset: number;
  var bottomInset: number;
  var leftInset: number;
  var rightInset: number;
  var gameEngine: IGameEngine | null;
}

export {};

