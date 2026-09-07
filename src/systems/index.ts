import { Direction, GameEngineEntities, GameEntity, Position2D } from "@types";
import Matter from "matter-js";
import {
  GameEngineUpdateEventOptionType,
  TouchEvent,
} from "react-native-game-engine";
import { windowHeight, windowWidth } from "@utils";

const SPEED = 4;
const ARRIVAL_THRESHOLD = 6;

// Check if a point in world space is inside a static obstacle body
function isPointInsideObstacle(world: Matter.World, x: number, y: number): boolean {
  const bodies = Matter.Query.point(Matter.Composite.allBodies(world), { x, y });
  return bodies.some((b) => b.isStatic && b.label !== "Adam");
}

// Precise clearance probe for Adam's exact bounding box (32x48) in direction
function isPathBlocked(
  world: Matter.World,
  adamBody: Matter.Body,
  direction: Direction
): boolean {
  const clearance = 4;
  const halfW = 14;
  const halfH = 22;
  const pos = adamBody.position;

  let minX = pos.x - halfW;
  let maxX = pos.x + halfW;
  let minY = pos.y - halfH;
  let maxY = pos.y + halfH;

  if (direction === "right") { minX = pos.x + halfW; maxX = pos.x + halfW + clearance; }
  if (direction === "left") { maxX = pos.x - halfW; minX = pos.x - halfW - clearance; }
  if (direction === "down") { minY = pos.y + halfH; maxY = pos.y + halfH + clearance; }
  if (direction === "up") { maxY = pos.y - halfH; minY = pos.y - halfH - clearance; }

  const bodies = Matter.Query.region(Matter.Composite.allBodies(world), {
    min: { x: minX, y: minY },
    max: { x: maxX, y: maxY },
  });

  return bodies.some((b) => b.isStatic && b.label !== "Adam");
}

/**
 * Target-aware, sticky detour direction selector.
 * Prevents back-tracking loops by:
 * 1. Sorting candidate detour directions by proximity to target (dx / dy).
 * 2. Locking the active detour direction until cleared or blocked.
 * 3. Tracking failed/blocked detour directions so Adam never oscillates back and forth.
 */
function getOpenDetourDirection(
  world: Matter.World,
  adamBody: Matter.Body,
  blockedDir: Direction,
  targetPos: Position2D,
  currentDetour?: Direction | null,
  blockedDetours: Direction[] = []
): Direction | null {
  const pos = adamBody.position;
  const dx = targetPos.x - pos.x;
  const dy = targetPos.y - pos.y;

  let candidates: Direction[] = [];
  if (blockedDir === "right" || blockedDir === "left") {
    candidates = dy >= 0 ? ["down", "up"] : ["up", "down"];
  } else {
    candidates = dx >= 0 ? ["right", "left"] : ["left", "right"];
  }

  // 1. If currently detouring in a candidate direction, keep it locked if still unblocked & unblacklisted
  if (currentDetour && candidates.includes(currentDetour)) {
    if (!isPathBlocked(world, adamBody, currentDetour) && !blockedDetours.includes(currentDetour)) {
      return currentDetour;
    } else if (!blockedDetours.includes(currentDetour)) {
      // Detour path became blocked: blacklist to avoid backtracking oscillation
      blockedDetours.push(currentDetour);
    }
  }

  // 2. Evaluate candidate directions in target-preferred order
  for (const candidate of candidates) {
    if (!blockedDetours.includes(candidate)) {
      if (!isPathBlocked(world, adamBody, candidate)) {
        return candidate;
      } else {
        blockedDetours.push(candidate);
      }
    }
  }

  return null;
}

export function GameLoop(
  entities: GameEngineEntities,
  { touches, time, dispatch }: GameEngineUpdateEventOptionType,
) {
  if (!entities || !entities.physics || !entities.physics.engine) {
    return entities;
  }

  const engine = entities.physics.engine;
  const world = engine.world;
  const adamEntity = entities.Adam as GameEntity | undefined;

  if (!adamEntity || !adamEntity.body) return entities;

  const adamBody = adamEntity.body;
  const adamWorldX = adamBody.position.x;
  const adamWorldY = adamBody.position.y;

  // Calculate Camera offset to keep Adam centered on screen
  const cameraX = windowWidth / 2 - adamWorldX;
  const cameraY = windowHeight / 2 - adamWorldY;
  entities.camera = { x: cameraX, y: cameraY };

  // Synchronize tilemap position
  if (entities.infiniteTileMap) {
    entities.infiniteTileMap.adamPos = { x: adamWorldX, y: adamWorldY };
  }

  // Synchronize camera offsets for all rendering obstacle entities
  Object.keys(entities).forEach((key) => {
    if (entities[key] && entities[key].renderer && entities[key].body && entities[key] !== adamEntity) {
      entities[key].cameraX = cameraX;
      entities[key].cameraY = cameraY;
    }
  });

  // 1. Capture screen touch tap and convert to World target coordinates
  if (touches && touches.length > 0) {
    touches
      .filter((t: TouchEvent) => ["start", "press"].includes(t.type))
      .forEach((t: TouchEvent) => {
        const screenX = t.event.pageX ?? t.event.locationX;
        const screenY = t.event.pageY ?? t.event.locationY;
        if (screenX !== undefined && screenY !== undefined) {
          const worldTargetX = screenX - cameraX;
          const worldTargetY = screenY - cameraY;

          // Ignore taps directly inside static obstacle bodies
          if (!isPointInsideObstacle(world, worldTargetX, worldTargetY)) {
            adamEntity.targetPosition = { x: worldTargetX, y: worldTargetY };
            adamEntity.activeAxis = null;
            adamEntity.detourDirection = null;
            adamEntity.blockedDetours = [];
            adamEntity.stuckTicks = 0;
          }
        }
      });
  }

  // 2. Perform 4-way orthogonal movement & target-aware detour avoidance
  if (adamEntity.targetPosition) {
    const targetX = adamEntity.targetPosition.x;
    const targetY = adamEntity.targetPosition.y;

    const dx = targetX - adamWorldX;
    const dy = targetY - adamWorldY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Keep body rotation strictly locked upright
    Matter.Body.setAngle(adamBody, 0);
    Matter.Body.setAngularVelocity(adamBody, 0);

    if (absDx < ARRIVAL_THRESHOLD && absDy < ARRIVAL_THRESHOLD) {
      // Arrived at target destination
      Matter.Body.setVelocity(adamBody, { x: 0, y: 0 });
      adamEntity.state = "idle";
      adamEntity.targetPosition = null;
      adamEntity.activeAxis = null;
      adamEntity.detourDirection = null;
      adamEntity.blockedDetours = [];
      adamEntity.stuckTicks = 0;
    } else {
      adamEntity.state = "run";

      if (!adamEntity.activeAxis) {
        adamEntity.activeAxis = absDx >= absDy ? "horizontal" : "vertical";
      }

      if (adamEntity.activeAxis === "horizontal") {
        const nextDirection: "left" | "right" = dx > 0 ? "right" : "left";
        const blocked = isPathBlocked(world, adamBody, nextDirection);

        if (blocked) {
          if (!adamEntity.blockedDetours) adamEntity.blockedDetours = [];
          const detourDir = getOpenDetourDirection(
            world,
            adamBody,
            nextDirection,
            { x: targetX, y: targetY },
            adamEntity.detourDirection,
            adamEntity.blockedDetours
          );

          if (detourDir && (absDy >= ARRIVAL_THRESHOLD || absDx >= ARRIVAL_THRESHOLD)) {
            adamEntity.detourDirection = detourDir;
            adamEntity.direction = detourDir;
            const vx = detourDir === "right" ? SPEED : detourDir === "left" ? -SPEED : 0;
            const vy = detourDir === "down" ? SPEED : detourDir === "up" ? -SPEED : 0;
            Matter.Body.setVelocity(adamBody, { x: vx, y: vy });
          } else {
            // Blocked completely or all detours failed: stop & switch to idle immediately
            Matter.Body.setVelocity(adamBody, { x: 0, y: 0 });
            adamEntity.state = "idle";
            adamEntity.targetPosition = null;
            adamEntity.activeAxis = null;
            adamEntity.detourDirection = null;
            adamEntity.blockedDetours = [];
          }
        } else {
          // Path ahead is clear: reset detour state and move towards target
          adamEntity.detourDirection = null;
          adamEntity.blockedDetours = [];

          if (absDx >= ARRIVAL_THRESHOLD) {
            const vx = dx > 0 ? SPEED : -SPEED;
            Matter.Body.setVelocity(adamBody, { x: vx, y: 0 });
            adamEntity.direction = nextDirection;
          } else {
            // Switch to vertical stage
            adamEntity.activeAxis = "vertical";
            Matter.Body.setVelocity(adamBody, { x: 0, y: 0 });
          }
        }
      }

      if (adamEntity.activeAxis === "vertical") {
        const nextDirection: "up" | "down" = dy > 0 ? "down" : "up";
        const blocked = isPathBlocked(world, adamBody, nextDirection);

        if (blocked) {
          if (!adamEntity.blockedDetours) adamEntity.blockedDetours = [];
          const detourDir = getOpenDetourDirection(
            world,
            adamBody,
            nextDirection,
            { x: targetX, y: targetY },
            adamEntity.detourDirection,
            adamEntity.blockedDetours
          );

          if (detourDir && (absDx >= ARRIVAL_THRESHOLD || absDy >= ARRIVAL_THRESHOLD)) {
            adamEntity.detourDirection = detourDir;
            adamEntity.direction = detourDir;
            const vx = detourDir === "right" ? SPEED : detourDir === "left" ? -SPEED : 0;
            const vy = detourDir === "down" ? SPEED : detourDir === "up" ? -SPEED : 0;
            Matter.Body.setVelocity(adamBody, { x: vx, y: vy });
          } else {
            // Blocked completely or all detours failed: stop & switch to idle immediately
            Matter.Body.setVelocity(adamBody, { x: 0, y: 0 });
            adamEntity.state = "idle";
            adamEntity.targetPosition = null;
            adamEntity.activeAxis = null;
            adamEntity.detourDirection = null;
            adamEntity.blockedDetours = [];
          }
        } else {
          // Path ahead is clear: reset detour state and move towards target
          adamEntity.detourDirection = null;
          adamEntity.blockedDetours = [];

          if (absDy >= ARRIVAL_THRESHOLD) {
            const vy = dy > 0 ? SPEED : -SPEED;
            Matter.Body.setVelocity(adamBody, { x: 0, y: vy });
            adamEntity.direction = nextDirection;
          } else if (absDx >= ARRIVAL_THRESHOLD) {
            adamEntity.activeAxis = "horizontal";
            Matter.Body.setVelocity(adamBody, { x: 0, y: 0 });
          } else {
            // Reached destination
            Matter.Body.setVelocity(adamBody, { x: 0, y: 0 });
            adamEntity.state = "idle";
            adamEntity.targetPosition = null;
            adamEntity.activeAxis = null;
            adamEntity.detourDirection = null;
            adamEntity.blockedDetours = [];
          }
        }
      }
    }
  }

  // 3. Speed & stuck ticks guard: immediately switch to idle when stationary
  const currentSpeed = Math.hypot(adamBody.velocity.x, adamBody.velocity.y);

  if (adamEntity.targetPosition && currentSpeed < 0.1) {
    adamEntity.stuckTicks = (adamEntity.stuckTicks || 0) + 1;
    if (adamEntity.stuckTicks > 10) {
      // Stationary at obstacle edge for > 10 ticks: force idle state and clear target
      Matter.Body.setVelocity(adamBody, { x: 0, y: 0 });
      adamEntity.state = "idle";
      adamEntity.targetPosition = null;
      adamEntity.activeAxis = null;
      adamEntity.detourDirection = null;
      adamEntity.blockedDetours = [];
      adamEntity.stuckTicks = 0;
    }
  } else if (!adamEntity.targetPosition || currentSpeed < 0.1) {
    adamEntity.state = "idle";
    adamEntity.stuckTicks = 0;
  }

  const delta = Math.min(time.delta, 1000 / 60);
  Matter.Engine.update(engine, delta);
  return entities;
}
