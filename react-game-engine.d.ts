declare module 'react-native-game-engine' {
  import { Component } from 'react';

  export interface GameEngine {
    start(): void;
    stop(): void;
    swap(entities: any): void;
    dispatch(event: any): void;
  }

  export interface GameEngineProps {
    systems: any[];
    entities: any;
    running?: boolean;
    onEvent?: (event: any) => void;
    style?: any;
    children?: React.ReactNode;
  }

  export interface TouchEvent {
    type: string;
    event: {
      pageX: number;
      pageY: number;
      locationX: number;
      locationY: number;
      [key: string]: any;
    };
    [key: string]: any;
  }

  export interface GameEngineUpdateEventOptionType {
    touches: TouchEvent[];
    screen: any;
    time: {
      current: number;
      previous: number;
      delta: number;
    };
    dispatch: (event: any) => void;
    [key: string]: any;
  }

  export class GameEngine extends Component<GameEngineProps> {}
}

