import React from "react";
import { Image, View, StyleSheet } from "react-native";
import Matter from "matter-js";
import { Position2D, Size2D, ObstacleEntity } from "@types";

export type ObstacleType = "rock" | "tree" | "wall" | "boulder" | "bush" | "fence" | "pillar";

const OBSTACLE_TEXTURES: Record<string, any> = {
  rock: require("@assets/sprites/adam/idle/1.png"),
  tree: require("@assets/sprites/adam/idle/2.png"),
  wall: require("@assets/sprites/adam/idle/3.png"),
};

interface ObstacleProps {
  body: Matter.Body;
  type: ObstacleType;
  cameraX?: number;
  cameraY?: number;
}

export function Obstacle({
  body,
  type = "rock",
  cameraX = 0,
  cameraY = 0,
}: ObstacleProps) {
  const width = body.bounds.max.x - body.bounds.min.x;
  const height = body.bounds.max.y - body.bounds.min.y;

  // Translate world physics position into screen camera space
  const screenX = body.position.x - width / 2 + cameraX;
  const screenY = body.position.y - height / 2 + cameraY;

  const renderContent = () => {
    if (OBSTACLE_TEXTURES[type]) {
      return (
        <Image
          source={OBSTACLE_TEXTURES[type]}
          style={{ width, height, resizeMode: "contain" }}
        />
      );
    }

    switch (type) {
      case "boulder":
        return (
          <View
            style={[
              styles.boulder,
              { width, height, borderRadius: Math.min(width, height) / 2 },
            ]}
          />
        );
      case "bush":
        return (
          <View
            style={[
              styles.bush,
              { width, height, borderRadius: Math.min(width, height) / 3 },
            ]}
          />
        );
      case "fence":
        return (
          <View style={[styles.fence, { width, height }]}>
            <View style={styles.fenceRail} />
            <View style={styles.fenceRail} />
          </View>
        );
      case "pillar":
        return (
          <View style={[styles.pillar, { width, height }]}>
            <View style={styles.pillarCap} />
            <View style={styles.pillarBody} />
            <View style={styles.pillarCap} />
          </View>
        );
      default:
        return (
          <View style={[styles.defaultObstacle, { width, height }]} />
        );
    }
  };

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: screenX,
        top: screenY,
        width,
        height,
      }}
    >
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  boulder: {
    backgroundColor: "#4A5568",
    borderColor: "#2D3748",
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  bush: {
    backgroundColor: "#2F855A",
    borderColor: "#22543D",
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  fence: {
    backgroundColor: "#8C5524",
    borderColor: "#5C3A17",
    borderWidth: 2,
    borderRadius: 4,
    justifyContent: "space-around",
    paddingVertical: 2,
  },
  fenceRail: {
    height: 3,
    backgroundColor: "#5C3A17",
    width: "100%",
  },
  pillar: {
    backgroundColor: "#CBD5E0",
    borderColor: "#A0AEC0",
    borderWidth: 2,
    borderRadius: 6,
    justifyContent: "space-between",
  },
  pillarCap: {
    height: 6,
    backgroundColor: "#A0AEC0",
    width: "100%",
  },
  pillarBody: {
    flex: 1,
    backgroundColor: "#E2E8F0",
  },
  defaultObstacle: {
    backgroundColor: "#718096",
    borderRadius: 4,
  },
});

export default (
  label: string,
  world: Matter.Composite,
  type: ObstacleType,
  pos: Position2D,
  size: Size2D
): ObstacleEntity => {
  const body = Matter.Bodies.rectangle(pos.x, pos.y, size.width, size.height, {
    label,
    isStatic: true,
    friction: 0,
  });
  Matter.Composite.add(world, body);

  return {
    body,
    type,
    pos,
    renderer: Obstacle,
  };
};
