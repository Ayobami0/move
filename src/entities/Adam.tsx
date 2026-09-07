import { useEffect, useState } from "react";
import { ColorValue, Image, View } from "react-native";
import Matter from "matter-js";

import { AnimationState, Direction, GameEntity, Position2D, Size2D } from "@types";
import { windowHeight, windowWidth } from "@utils";

export const ANIMATIONS: Record<AnimationState, Record<Direction, any[]>> = {
  idle: {
    left: [
      require("@assets/sprites/adam/idle_anim/idle_l_01.png"),
      require("@assets/sprites/adam/idle_anim/idle_l_02.png"),
      require("@assets/sprites/adam/idle_anim/idle_l_03.png"),
      require("@assets/sprites/adam/idle_anim/idle_l_04.png"),
      require("@assets/sprites/adam/idle_anim/idle_l_05.png"),
      require("@assets/sprites/adam/idle_anim/idle_l_06.png"),
    ],
    up: [
      require("@assets/sprites/adam/idle_anim/idle_u_01.png"),
      require("@assets/sprites/adam/idle_anim/idle_u_02.png"),
      require("@assets/sprites/adam/idle_anim/idle_u_03.png"),
      require("@assets/sprites/adam/idle_anim/idle_u_04.png"),
      require("@assets/sprites/adam/idle_anim/idle_u_05.png"),
      require("@assets/sprites/adam/idle_anim/idle_u_06.png"),
    ],
    right: [
      require("@assets/sprites/adam/idle_anim/idle_r_01.png"),
      require("@assets/sprites/adam/idle_anim/idle_r_02.png"),
      require("@assets/sprites/adam/idle_anim/idle_r_03.png"),
      require("@assets/sprites/adam/idle_anim/idle_r_04.png"),
      require("@assets/sprites/adam/idle_anim/idle_r_05.png"),
      require("@assets/sprites/adam/idle_anim/idle_r_06.png"),
    ],
    down: [
      require("@assets/sprites/adam/idle_anim/idle_d_01.png"),
      require("@assets/sprites/adam/idle_anim/idle_d_02.png"),
      require("@assets/sprites/adam/idle_anim/idle_d_03.png"),
      require("@assets/sprites/adam/idle_anim/idle_d_04.png"),
      require("@assets/sprites/adam/idle_anim/idle_d_05.png"),
      require("@assets/sprites/adam/idle_anim/idle_d_06.png"),
    ],
  },
  run: {
    left: [
      require("@assets/sprites/adam/run/run_l_01.png"),
      require("@assets/sprites/adam/run/run_l_02.png"),
      require("@assets/sprites/adam/run/run_l_03.png"),
      require("@assets/sprites/adam/run/run_l_04.png"),
      require("@assets/sprites/adam/run/run_l_05.png"),
      require("@assets/sprites/adam/run/run_l_06.png"),
    ],
    up: [
      require("@assets/sprites/adam/run/run_u_01.png"),
      require("@assets/sprites/adam/run/run_u_02.png"),
      require("@assets/sprites/adam/run/run_u_03.png"),
      require("@assets/sprites/adam/run/run_u_04.png"),
      require("@assets/sprites/adam/run/run_u_05.png"),
      require("@assets/sprites/adam/run/run_u_06.png"),
    ],
    right: [
      require("@assets/sprites/adam/run/run_r_01.png"),
      require("@assets/sprites/adam/run/run_r_02.png"),
      require("@assets/sprites/adam/run/run_r_03.png"),
      require("@assets/sprites/adam/run/run_r_04.png"),
      require("@assets/sprites/adam/run/run_r_05.png"),
      require("@assets/sprites/adam/run/run_r_06.png"),
    ],
    down: [
      require("@assets/sprites/adam/run/run_d_01.png"),
      require("@assets/sprites/adam/run/run_d_02.png"),
      require("@assets/sprites/adam/run/run_d_03.png"),
      require("@assets/sprites/adam/run/run_d_04.png"),
      require("@assets/sprites/adam/run/run_d_05.png"),
      require("@assets/sprites/adam/run/run_d_06.png"),
    ],
  },
};

export function Adam({
  body,
  state = "idle",
  direction = "down",
}: GameEntity & { state?: AnimationState; direction?: Direction }) {
  const [frameIndex, setFrameIndex] = useState(0);

  const frames = ANIMATIONS[state]?.[direction] ?? ANIMATIONS.idle.down;

  useEffect(() => {
    setFrameIndex(0);
    if (frames.length <= 1) return;

    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, 120);

    return () => clearInterval(interval);
  }, [state, direction, frames.length]);

  const currentFrame = frames[frameIndex % frames.length];

  const heightBody = body.bounds.max.y - body.bounds.min.y;
  const widthBody = body.bounds.max.x - body.bounds.min.x;

  // Adam renders in screen center while camera offset tracks world movement
  const xBody = windowWidth / 2 - widthBody / 2;
  const yBody = windowHeight / 2 - heightBody / 2;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: xBody,
        top: yBody,
        width: widthBody,
        height: heightBody,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Image
        source={currentFrame}
        style={{ width: widthBody, height: heightBody, resizeMode: "contain" }}
      />
    </View>
  );
}

export default (
  label: string,
  world: Matter.Composite,
  pos: Position2D,
  size: Size2D,
  color: ColorValue = "transparent",
  initialState: AnimationState = "idle",
  initialDirection: Direction = "down",
) => {
  const body = Matter.Bodies.rectangle(pos.x, pos.y, size.width, size.height, {
    label,
    isStatic: false,
    inertia: Infinity,
    frictionAir: 0,
  });
  Matter.Composite.add(world, body);

  return {
    body,
    color,
    pos,
    state: initialState,
    direction: initialDirection,
    renderer: Adam,
  };
};
