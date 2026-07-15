import { useEffect, useMemo, useRef, useState } from "react";

import styles from "./Game.module.css";

const PLAYER_SIZE = 32;
const TRACK_HEIGHT = 2;
const FLOOR_OFFSET = 0;
const PLAYER_VISUAL_OFFSET_Y = -10;
const GRAVITY = 0.82;
const FALL_GRAVITY_MULTIPLIER = 1.5;
const JUMP_FORCE = -11.8;
const BASE_SPEED = 6.2;
const MIN_BOARD_HEIGHT = 340;
const INITIAL_LIVES = 3;
const HIT_COOLDOWN_DISTANCE = 160;
const JUMP_BUFFER_FRAMES = 10;
const SQUASH_DURATION_FRAMES = 10;
const DAMAGE_FLASH_FRAMES = 18;
const BOUNCE_FRAMES = 10;
const PLATFORM_HEIGHT = 16;
const FRAME_DURATION_MS = 1000 / 60;
const MAX_FRAME_SCALE = 2.2;
const PERSONAL_BEST_STORAGE_KEY = "resolve-runner-personal-best";

const PICKUP_LABELS = [
  "JED",
  "rawrepo",
  "VIP",
  "CULR",
  "simpleSearch",
  "ORS",
  "smaug",
  "userinfo",
  "datahub",
  "openformat",
  "holdingsservice",
  "holdingsitems",
  "orderStatus",
  "suggester",
  "borchk",
  "retriever",
  "seriesService",
  "recommendations",
];
const OBSTACLE_LABELS = [
  "null!",
  "429",
  "N+1",
  "timeout",
  "syntax",
  "depth",
  "denied",
  "error",
];
const PLAYER_EMOJI = "🤠";
const PLAYER_HIT_EMOJI = "🫨";
const PLAYER_SAD_EMOJI = "😥";
const PLAYER_DEAD_EMOJI = "😵";

function getFloorTop(boardHeight) {
  return boardHeight - FLOOR_OFFSET - TRACK_HEIGHT;
}

function getInitialPlayer(boardHeight) {
  const floorTop = getFloorTop(boardHeight);

  return {
    x: 112,
    y: floorTop - PLAYER_SIZE,
    vy: 0,
    isGrounded: true,
  };
}

function createPickup(id, x, y, label) {
  return { id, x, y, width: 46, height: 32, label };
}

function createPlatform(id, x, y, width) {
  return { id, x, y, width, height: PLATFORM_HEIGHT };
}

function getObstacleWidth(label) {
  return Math.max(54, label.length * 10 + 26);
}

function createObstacle(id, x, y, label, height = 34) {
  return {
    id,
    x,
    y,
    width: getObstacleWidth(label),
    height,
    label,
    squashedFrames: 0,
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getPatternNoise(index, seed = 1) {
  const raw = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
  return raw - Math.floor(raw);
}

function getPickupLift(index) {
  const noise = getPatternNoise(index, 29);

  if (index < 4) {
    return noise > 0.55 ? 80 : 64;
  }

  if (noise > 0.82) {
    return 132;
  }

  if (noise > 0.58) {
    return 108;
  }

  if (noise > 0.28) {
    return 88;
  }

  return 66;
}

function getPickupGap(index) {
  const baseGap =
    index < 5
      ? 420
      : index < 14
        ? 350
        : index < 28
          ? 300
          : Math.max(240, 300 - Math.floor((index - 28) * 0.28));
  const varianceStrength = index < 10 ? 135 : index < 24 ? 170 : 200;
  const noiseA = getPatternNoise(index, 31) - 0.5;
  const noiseB = getPatternNoise(index, 37) - 0.5;
  const clusterNoise = getPatternNoise(index, 41);
  const clusterShift =
    clusterNoise > 0.8
      ? -Math.round(varianceStrength * 0.75)
      : clusterNoise < 0.18
        ? Math.round(varianceStrength * 0.9)
        : 0;
  const variedGap =
    baseGap +
    Math.round(
      noiseA * varianceStrength + noiseB * varianceStrength * 0.8 + clusterShift
    );

  return clamp(variedGap, 160, 620);
}

function getObstacleGap(index) {
  const baseGap =
    index < 5
      ? 620
      : index < 10
        ? 480
        : index < 18
          ? 390
          : index < 28
            ? 330
            : index < 40
              ? 285
              : Math.max(220, 285 - Math.floor((index - 40) * 0.65));
  const varianceStrength =
    index < 8 ? 120 : index < 20 ? 160 : index < 40 ? 185 : 210;
  const noiseA = getPatternNoise(index, 1) - 0.5;
  const noiseB = getPatternNoise(index, 7) - 0.5;
  const noiseC = getPatternNoise(index, 19);
  const streakShift =
    noiseC > 0.83
      ? -Math.round(varianceStrength * 1.05)
      : noiseC < 0.16
        ? Math.round(varianceStrength * 1.1)
        : noiseC > 0.64
          ? -Math.round(varianceStrength * 0.55)
          : noiseC < 0.34
            ? Math.round(varianceStrength * 0.6)
            : 0;
  const variedGap =
    baseGap +
    Math.round(
      noiseA * varianceStrength + noiseB * varianceStrength * 0.9 + streakShift
    );

  return clamp(variedGap, 150, 760);
}

function getObstacleHeight(index) {
  const noise = getPatternNoise(index, 11);

  if (index < 8) {
    return noise > 0.7 ? 20 : 18;
  }

  if (index < 22) {
    if (noise > 0.82) {
      return 26;
    }

    return noise > 0.42 ? 22 : 20;
  }

  if (noise > 0.86) {
    return 32;
  }

  if (noise > 0.58) {
    return 28;
  }

  return noise > 0.24 ? 24 : 22;
}

function getPlatformWidth(index) {
  const noise = getPatternNoise(index, 59);
  return noise > 0.75 ? 150 : noise > 0.4 ? 126 : 108;
}

function isPlatformPairStarter(index) {
  return getPatternNoise(index, 79) > 0.8;
}

function isPlatformPairTop(index) {
  return index > 0 && isPlatformPairStarter(index - 1);
}

function getPlatformLift(index) {
  const noise = getPatternNoise(index, 61);

  if (isPlatformPairTop(index)) {
    return 92;
  }

  if (isPlatformPairStarter(index)) {
    return 56;
  }

  return noise > 0.52 ? 64 : 52;
}

function getPlatformGap(index) {
  if (isPlatformPairStarter(index)) {
    const pairNoise = getPatternNoise(index, 83);
    return getPlatformWidth(index) + Math.round(30 + pairNoise * 46);
  }

  const baseGap = index < 4 ? 1080 : index < 10 ? 920 : 820;
  const variance = index < 8 ? 220 : 260;
  const noiseA = getPatternNoise(index, 67) - 0.5;
  const noiseB = getPatternNoise(index, 71) - 0.5;

  return clamp(
    baseGap + Math.round(noiseA * variance + noiseB * variance * 0.6),
    680,
    1380
  );
}

function createPlatformSet(startX, floorTop, platformIndex) {
  const baseWidth = getPlatformWidth(platformIndex);
  const baseLift = getPlatformLift(platformIndex);
  const baseId = `platform-${platformIndex}`;
  const platforms = [
    createPlatform(baseId, startX, floorTop - baseLift, baseWidth),
  ];

  if (isPlatformPairStarter(platformIndex)) {
    const topIndex = platformIndex + 1;
    const topWidth = getPlatformWidth(topIndex);
    const topLift = getPlatformLift(topIndex);
    const pairGap = getPlatformGap(platformIndex);
    const topId = `platform-${topIndex}`;

    platforms.push(
      createPlatform(topId, startX + pairGap, floorTop - topLift, topWidth)
    );

    return {
      platforms,
      nextIndex: platformIndex + 2,
      endX: startX + pairGap,
    };
  }

  return {
    platforms,
    nextIndex: platformIndex + 1,
    endX: startX,
  };
}

function buildLevel(boardWidth, boardHeight) {
  const floorTop = getFloorTop(boardHeight);
  const pickups = [];
  const obstacles = [];
  const platforms = [];
  let obstacleCursorX = boardWidth + 180;
  let pickupCursorX = boardWidth + 120;
  let platformCursorX = boardWidth + 760;
  let platformIndex = 0;

  for (let index = 0; index < 18; index += 1) {
    const pickupLift = getPickupLift(index);
    pickups.push(
      createPickup(
        `pickup-${index}`,
        pickupCursorX,
        floorTop - pickupLift,
        PICKUP_LABELS[index % PICKUP_LABELS.length]
      )
    );

    const obstacleHeight = getObstacleHeight(index);
    obstacles.push(
      createObstacle(
        `obstacle-${index}`,
        obstacleCursorX,
        floorTop - obstacleHeight,
        OBSTACLE_LABELS[index % OBSTACLE_LABELS.length],
        obstacleHeight
      )
    );

    obstacleCursorX += getObstacleGap(index);
    pickupCursorX += getPickupGap(index);

    if (platformIndex < 3) {
      const platformSet = createPlatformSet(
        platformCursorX,
        floorTop,
        platformIndex
      );
      platforms.push(...platformSet.platforms);
      platformCursorX =
        platformSet.endX + getPlatformGap(platformSet.nextIndex);
      platformIndex = platformSet.nextIndex;
    }
  }

  return { pickups, obstacles, platforms };
}

function getInitialState(boardWidth, boardHeight) {
  const level = buildLevel(boardWidth, boardHeight);

  return {
    player: getInitialPlayer(boardHeight),
    pickups: level.pickups,
    obstacles: level.obstacles,
    platforms: level.platforms,
    score: 0,
    distance: 0,
    lives: INITIAL_LIVES,
    hitCooldown: 0,
    damageFrames: 0,
    bounceFrames: 0,
    isGameOver: false,
  };
}

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName;

  return (
    target.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT"
  );
}

function overlaps(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function getBaseSpeed(distance) {
  const distanceRamp = Math.min(4.5, distance / 1800);
  return BASE_SPEED + distanceRamp * 0.55;
}

function createNextPickup(boardWidth, floorTop, furthestX, pickupCounterRef) {
  const pickupGap = getPickupGap(pickupCounterRef.current);
  const floorBand = getPickupLift(pickupCounterRef.current);
  const spawnX = Math.max(boardWidth + pickupGap, furthestX + pickupGap);
  const nextPickup = createPickup(
    `pickup-${pickupCounterRef.current}`,
    spawnX,
    floorTop - floorBand,
    PICKUP_LABELS[pickupCounterRef.current % PICKUP_LABELS.length]
  );

  pickupCounterRef.current += 1;
  return nextPickup;
}

function createNextObstacle(
  boardWidth,
  floorTop,
  furthestX,
  obstacleCounterRef
) {
  const nextHeight = getObstacleHeight(obstacleCounterRef.current);
  const nextGap = getObstacleGap(obstacleCounterRef.current);
  const spawnX = Math.max(boardWidth + nextGap, furthestX + nextGap);
  const nextObstacle = createObstacle(
    `obstacle-${obstacleCounterRef.current}`,
    spawnX,
    floorTop - nextHeight,
    OBSTACLE_LABELS[obstacleCounterRef.current % OBSTACLE_LABELS.length],
    nextHeight
  );

  obstacleCounterRef.current += 1;
  return nextObstacle;
}

function createNextPlatform(boardWidth, floorTop, furthestX, platformIndex) {
  const gap = getPlatformGap(platformIndex);
  const startX = Math.max(boardWidth + gap, furthestX + gap);
  const platformSet = createPlatformSet(startX, floorTop, platformIndex);

  return platformSet;
}

function isBetterRun(current, best) {
  if (current.distance !== best.distance) {
    return current.distance > best.distance;
  }

  return current.score > best.score;
}

export default function Game({
  isActive = false,
  onActiveChange = () => {},
  className = "",
}) {
  const frameRef = useRef(null);
  const lastFrameTimeRef = useRef(null);
  const jumpBufferRef = useRef(0);
  const stateRef = useRef(getInitialState(1200, MIN_BOARD_HEIGHT));
  const boardRef = useRef(null);
  const obstacleCounterRef = useRef(18);
  const pickupCounterRef = useRef(18);
  const platformCounterRef = useRef(18);

  const [boardSize, setBoardSize] = useState({
    width: 1200,
    height: MIN_BOARD_HEIGHT,
  });
  const [personalBest, setPersonalBest] = useState({ score: 0, distance: 0 });
  const [gameState, setGameState] = useState(() =>
    getInitialState(1200, MIN_BOARD_HEIGHT)
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const saved = window.localStorage.getItem(PERSONAL_BEST_STORAGE_KEY);

      if (!saved) {
        return;
      }

      const parsed = JSON.parse(saved);

      setPersonalBest({
        score: Number.isFinite(parsed?.score) ? parsed.score : 0,
        distance: Number.isFinite(parsed?.distance) ? parsed.distance : 0,
      });
    } catch {
      setPersonalBest({ score: 0, distance: 0 });
    }
  }, []);

  useEffect(() => {
    const node = boardRef.current;

    if (!node) {
      return undefined;
    }

    function measure() {
      setBoardSize({
        width: node.clientWidth || 1200,
        height: Math.max(
          node.clientHeight || MIN_BOARD_HEIGHT,
          MIN_BOARD_HEIGHT
        ),
      });
    }

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isActive) {
      jumpBufferRef.current = 0;
      lastFrameTimeRef.current = null;
      return;
    }

    const nextState = getInitialState(boardSize.width, boardSize.height);
    obstacleCounterRef.current = nextState.obstacles.length;
    pickupCounterRef.current = nextState.pickups.length;
    platformCounterRef.current = nextState.platforms.length;
    stateRef.current = nextState;
    setGameState(nextState);
  }, [boardSize.height, boardSize.width, isActive]);

  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const currentRun = {
      score: gameState.score,
      distance: Math.floor(gameState.distance),
    };

    if (!isBetterRun(currentRun, personalBest)) {
      return;
    }

    setPersonalBest(currentRun);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        PERSONAL_BEST_STORAGE_KEY,
        JSON.stringify(currentRun)
      );
    }
  }, [gameState.distance, gameState.score, isActive, personalBest]);

  useEffect(() => {
    if (!isActive) {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }

      return undefined;
    }

    function update(timestamp) {
      const previous = stateRef.current;
      const previousTimestamp = lastFrameTimeRef.current;
      const deltaMs = previousTimestamp
        ? Math.min(
            previousTimestamp
              ? timestamp - previousTimestamp
              : FRAME_DURATION_MS,
            FRAME_DURATION_MS * MAX_FRAME_SCALE
          )
        : FRAME_DURATION_MS;
      const frameScale = Math.max(0.5, deltaMs / FRAME_DURATION_MS);
      lastFrameTimeRef.current = timestamp;

      if (previous.isGameOver) {
        frameRef.current = window.requestAnimationFrame(update);
        return;
      }

      const floorTop = getFloorTop(boardSize.height);
      const nextPlayer = { ...previous.player };
      const previousPlayerBottom = previous.player.y + PLAYER_SIZE;
      const speed = getBaseSpeed(previous.distance);
      const stepDistance = speed * frameScale;
      let nextLives = previous.lives;
      let nextScore = previous.score;
      let nextHitCooldown = Math.max(0, previous.hitCooldown - stepDistance);
      let nextDamageFrames = Math.max(
        0,
        (previous.damageFrames || 0) - frameScale
      );
      let nextBounceFrames = Math.max(
        0,
        (previous.bounceFrames || 0) - frameScale
      );

      if (jumpBufferRef.current > 0 && nextPlayer.isGrounded) {
        nextPlayer.vy = JUMP_FORCE;
        nextPlayer.isGrounded = false;
        jumpBufferRef.current = 0;
        nextBounceFrames = BOUNCE_FRAMES;
      } else if (jumpBufferRef.current > 0) {
        jumpBufferRef.current = Math.max(0, jumpBufferRef.current - frameScale);
      }

      const gravityStep =
        nextPlayer.vy < 0 ? GRAVITY : GRAVITY * FALL_GRAVITY_MULTIPLIER;

      nextPlayer.vy += gravityStep * frameScale;
      nextPlayer.y += nextPlayer.vy * frameScale;

      let furthestPlatformX = previous.platforms.reduce(
        (maxX, currentPlatform) => Math.max(maxX, currentPlatform.x),
        boardSize.width
      );
      let landedOnPlatform = false;
      const platforms = previous.platforms
        .map((platform) => ({
          ...platform,
          x: platform.x - stepDistance,
        }))
        .sort((a, b) => a.x - b.x)
        .flatMap((platform) => {
          if (platform.x + platform.width < -60) {
            const nextPlatformSet = createNextPlatform(
              boardSize.width,
              floorTop,
              furthestPlatformX,
              platformCounterRef.current
            );
            const lastPlatform =
              nextPlatformSet.platforms[nextPlatformSet.platforms.length - 1];
            furthestPlatformX = lastPlatform.x;
            platformCounterRef.current = nextPlatformSet.nextIndex;
            return nextPlatformSet.platforms;
          }

          if (!landedOnPlatform && nextPlayer.vy >= 0) {
            const platformTop = platform.y;
            const playerFeet = nextPlayer.y + PLAYER_SIZE;
            const landedFromAbove =
              previousPlayerBottom <= platformTop + 8 &&
              playerFeet >= platformTop &&
              nextPlayer.x + PLAYER_SIZE - 6 > platform.x &&
              nextPlayer.x + 6 < platform.x + platform.width;

            if (landedFromAbove) {
              nextPlayer.y = platformTop - PLAYER_SIZE;
              nextPlayer.vy = 0;
              nextPlayer.isGrounded = true;
              landedOnPlatform = true;
            }
          }

          return [platform];
        });

      if (!landedOnPlatform && nextPlayer.y >= floorTop - PLAYER_SIZE) {
        nextPlayer.y = floorTop - PLAYER_SIZE;
        nextPlayer.vy = 0;
        nextPlayer.isGrounded = true;
      } else if (!landedOnPlatform) {
        nextPlayer.isGrounded = false;
      }

      let furthestPickupX = previous.pickups.reduce(
        (maxX, currentPickup) => Math.max(maxX, currentPickup.x),
        boardSize.width
      );
      const pickups = previous.pickups
        .map((pickup) => ({ ...pickup, x: pickup.x - stepDistance }))
        .sort((a, b) => a.x - b.x)
        .flatMap((pickup) => {
          if (pickup.x + pickup.width < -40) {
            const nextPickup = createNextPickup(
              boardSize.width,
              floorTop,
              furthestPickupX,
              pickupCounterRef
            );
            furthestPickupX = nextPickup.x;
            return [nextPickup];
          }

          if (
            overlaps(
              {
                x: nextPlayer.x,
                y: nextPlayer.y,
                width: PLAYER_SIZE,
                height: PLAYER_SIZE,
              },
              pickup
            )
          ) {
            nextScore += 1;
            const nextPickup = createNextPickup(
              boardSize.width,
              floorTop,
              furthestPickupX,
              pickupCounterRef
            );
            furthestPickupX = nextPickup.x;
            return [nextPickup];
          }

          return [pickup];
        });

      let furthestObstacleX = previous.obstacles.reduce(
        (maxX, currentObstacle) => Math.max(maxX, currentObstacle.x),
        boardSize.width
      );
      const obstacles = previous.obstacles
        .map((obstacle) => ({
          ...obstacle,
          x: obstacle.x - stepDistance,
          squashedFrames: Math.max(
            0,
            (obstacle.squashedFrames || 0) - frameScale
          ),
        }))
        .sort((a, b) => a.x - b.x)
        .flatMap((obstacle) => {
          if (obstacle.squashedFrames > 0) {
            if (obstacle.squashedFrames === 1) {
              const nextObstacle = createNextObstacle(
                boardSize.width,
                floorTop,
                furthestObstacleX,
                obstacleCounterRef
              );
              furthestObstacleX = nextObstacle.x;
              return [nextObstacle];
            }

            return [obstacle];
          }

          if (obstacle.x + obstacle.width < -40) {
            const nextObstacle = createNextObstacle(
              boardSize.width,
              floorTop,
              furthestObstacleX,
              obstacleCounterRef
            );
            furthestObstacleX = nextObstacle.x;
            return [nextObstacle];
          }

          const playerBox = {
            x: nextPlayer.x + 5,
            y: nextPlayer.y + 5,
            width: PLAYER_SIZE - 10,
            height: PLAYER_SIZE - 7,
          };
          const obstacleBox = {
            x: obstacle.x + 4,
            y: obstacle.y + 10,
            width: Math.max(12, obstacle.width - 8),
            height: Math.max(10, obstacle.height - 12),
          };
          const playerFeet = nextPlayer.y + PLAYER_SIZE;
          const obstacleTop = obstacle.y;
          const canActuallyHitObstacle = playerFeet > obstacleTop + 8;
          const stompWindow =
            nextPlayer.vy > 0 &&
            previousPlayerBottom <= obstacleTop + 10 &&
            playerFeet >= obstacleTop - 2 &&
            nextPlayer.x + PLAYER_SIZE - 6 > obstacle.x &&
            nextPlayer.x + 6 < obstacle.x + obstacle.width;

          if (stompWindow) {
            nextScore += 1;
            nextPlayer.y = obstacleTop - PLAYER_SIZE;
            nextPlayer.vy = JUMP_FORCE * 0.38;
            nextPlayer.isGrounded = false;
            nextBounceFrames = BOUNCE_FRAMES;

            return [
              {
                ...obstacle,
                squashedFrames: SQUASH_DURATION_FRAMES,
              },
            ];
          }

          if (
            nextHitCooldown <= 0 &&
            canActuallyHitObstacle &&
            overlaps(playerBox, obstacleBox)
          ) {
            nextLives -= 1;
            nextHitCooldown = HIT_COOLDOWN_DISTANCE;
            nextPlayer.y = floorTop - PLAYER_SIZE - 6;
            nextPlayer.vy = JUMP_FORCE * 0.72;
            nextPlayer.isGrounded = false;
            jumpBufferRef.current = 0;
            nextDamageFrames = DAMAGE_FLASH_FRAMES;
            nextBounceFrames = BOUNCE_FRAMES;
            return [obstacle];
          }

          return [obstacle];
        });

      const nextDistance = previous.distance + stepDistance;
      const nextState = {
        player: nextPlayer,
        pickups,
        obstacles,
        platforms,
        score: nextScore,
        distance: nextDistance,
        lives: Math.max(0, nextLives),
        hitCooldown: nextHitCooldown,
        damageFrames: nextDamageFrames,
        bounceFrames: nextBounceFrames,
        isGameOver: nextLives <= 0,
      };

      stateRef.current = nextState;
      setGameState(nextState);
      frameRef.current = window.requestAnimationFrame(update);
    }

    frameRef.current = window.requestAnimationFrame(update);

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
      lastFrameTimeRef.current = null;
    };
  }, [boardSize.height, boardSize.width, isActive]);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (isTypingTarget(event.target)) {
        return;
      }

      if (
        event.key === "ArrowUp" ||
        event.key === " " ||
        event.code === "Space"
      ) {
        if (!event.repeat) {
          jumpBufferRef.current = JUMP_BUFFER_FRAMES;
        }
        event.preventDefault();
      }

      if (event.key === "Escape") {
        onActiveChange(false);
      }

      if (
        (event.key === "Enter" || event.key === "r") &&
        stateRef.current.isGameOver
      ) {
        const nextState = getInitialState(boardSize.width, boardSize.height);
        obstacleCounterRef.current = nextState.obstacles.length;
        pickupCounterRef.current = nextState.pickups.length;
        platformCounterRef.current = nextState.platforms.length;
        stateRef.current = nextState;
        setGameState(nextState);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [boardSize.height, boardSize.width, isActive, onActiveChange]);

  function createResetState() {
    const nextState = getInitialState(boardSize.width, boardSize.height);
    obstacleCounterRef.current = nextState.obstacles.length;
    pickupCounterRef.current = nextState.pickups.length;
    platformCounterRef.current = nextState.platforms.length;
    jumpBufferRef.current = 0;
    lastFrameTimeRef.current = null;
    stateRef.current = nextState;
    setGameState(nextState);
  }

  function handleReset() {
    createResetState();
  }

  function handleTryAgain() {
    createResetState();
  }

  const playerScaleX = gameState.bounceFrames
    ? gameState.player.vy < 0
      ? 0.92
      : 1.08
    : 1;
  const playerScaleY = gameState.bounceFrames
    ? gameState.player.vy < 0
      ? 1.12
      : 0.9
    : 1;
  const playerEmoji = gameState.isGameOver
    ? PLAYER_DEAD_EMOJI
    : gameState.damageFrames > DAMAGE_FLASH_FRAMES * 0.45
      ? PLAYER_HIT_EMOJI
      : gameState.damageFrames > 0
        ? PLAYER_SAD_EMOJI
        : PLAYER_EMOJI;
  const playerClassName = [
    styles.player,
    gameState.damageFrames > 0 ? styles.playerDamaged : "",
    gameState.bounceFrames > 0 ? styles.playerBouncing : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`${styles.overlay} ${isActive ? styles.overlayActive : ""} ${className}`}
      aria-hidden={!isActive}
    >
      {isActive ? (
        <div className={styles.controls}>
          <div className={styles.hud}>
            <span>{`score: ${gameState.score}`}</span>
            <span>{`lives: ${gameState.lives}`}</span>
            <span>{`distance: ${Math.floor(gameState.distance)}`}</span>
            <span>{`best: ${personalBest.distance}`}</span>
            <span>{`speed: ${(getBaseSpeed(gameState.distance) / BASE_SPEED).toFixed(1)}x`}</span>
          </div>
          <div className={styles.actions}>
            <p className={styles.instructions}>
              `↑` or `Space` to jump · `Esc` closes
            </p>
            <div className={styles.buttons}>
              <button
                className={styles.secondary}
                type="button"
                onClick={handleReset}
              >
                Reset
              </button>
              <button
                className={`${styles.secondary} ${styles.closeButton}`}
                type="button"
                aria-label="Close game"
                onClick={() => onActiveChange(false)}
              >
                ×
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div ref={boardRef} className={styles.board}>
        {isActive ? (
          <>
            <div className={styles.stage}>
              <div className={styles.grid} aria-hidden="true" />
            </div>

            <div className={styles.track} style={{ bottom: 0 }} />

            {gameState.pickups.map((pickup) => (
              <div
                key={pickup.id}
                className={styles.pickup}
                style={{ left: `${pickup.x}px`, top: `${pickup.y}px` }}
              >
                {pickup.label}
              </div>
            ))}

            {gameState.obstacles.map((obstacle) => (
              <div
                key={obstacle.id}
                className={`${styles.obstacle} ${
                  obstacle.squashedFrames > 0 ? styles.obstacleSquashed : ""
                }`}
                style={{
                  left: `${obstacle.x}px`,
                  top: `${obstacle.y}px`,
                  width: `${obstacle.width}px`,
                  height: `${obstacle.height}px`,
                }}
              >
                <span>{obstacle.label}</span>
              </div>
            ))}

            {gameState.platforms.map((platform) => (
              <div
                key={platform.id}
                className={styles.platform}
                style={{
                  left: `${platform.x}px`,
                  top: `${platform.y}px`,
                  width: `${platform.width}px`,
                  height: `${platform.height}px`,
                }}
              />
            ))}

            <div
              className={playerClassName}
              style={{
                transform: `translate(${gameState.player.x}px, ${gameState.player.y + PLAYER_VISUAL_OFFSET_Y}px) scale(${playerScaleX}, ${playerScaleY})`,
              }}
            >
              <span className={styles.playerEmoji} aria-hidden="true">
                {playerEmoji}
              </span>
            </div>

            {gameState.isGameOver ? (
              <div className={styles.banner}>
                <h3 className={styles.bannerTitle}>Run failed</h3>
                <p className={styles.bannerText}>You hit too many errors.</p>
                <p className={styles.bannerStats}>
                  {`Score: ${gameState.score} · Distance: ${Math.floor(gameState.distance)}`}
                </p>
                <p className={styles.bannerStats}>
                  {`Personal best: ${personalBest.score} score · ${personalBest.distance} distance`}
                </p>
                <div className={styles.bannerActions}>
                  <button
                    className={styles.secondary}
                    type="button"
                    onClick={handleTryAgain}
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
