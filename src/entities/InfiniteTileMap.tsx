import React, { memo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { windowHeight, windowWidth } from "@utils";

export const TILE_SIZE = 64;
const GRASS_TILE = require("@assets/sprites/terrain/grass.png");

// Calculate fixed tile grid columns and rows needed to cover viewport + buffer
const cols = Math.ceil(windowWidth / TILE_SIZE) + 2;
const rows = Math.ceil(windowHeight / TILE_SIZE) + 2;

// Static tile grid created ONCE and memoized to avoid re-instantiating VDOM nodes
const StaticGrid = memo(() => {
  const tiles = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push(
        <Image
          key={`${r}_${c}`}
          source={GRASS_TILE}
          style={{
            position: "absolute",
            left: c * TILE_SIZE,
            top: r * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
            resizeMode: "cover",
          }}
        />
      );
    }
  }
  return <>{tiles}</>;
});

export function InfiniteTileMap({
  adamPos,
}: {
  adamPos?: { x: number; y: number };
}) {
  if (!adamPos) return null;

  const cameraX = windowWidth / 2 - adamPos.x;
  const cameraY = windowHeight / 2 - adamPos.y;

  // Modulo shift translates static tile grid smoothly without re-creating React nodes
  const shiftX = ((cameraX % TILE_SIZE) + TILE_SIZE) % TILE_SIZE - TILE_SIZE;
  const shiftY = ((cameraY % TILE_SIZE) + TILE_SIZE) % TILE_SIZE - TILE_SIZE;

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        {
          transform: [{ translateX: shiftX }, { translateY: shiftY }],
        },
      ]}
    >
      <StaticGrid />
    </View>
  );
}

export default (adamPos: { x: number; y: number }) => ({
  adamPos,
  renderer: InfiniteTileMap,
});
