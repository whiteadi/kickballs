// Base ball speed
export const BALL_SPEED = 160;

// Speed multiplier per level (balls get faster as levels progress)
// 12 levels: gradual increase from 1.0x to 1.6x
export const SPEED_MULTIPLIERS = [
  1.0,  // Level 1 - Tutorial
  1.05, // Level 2
  1.1,  // Level 3
  1.15, // Level 4 - Boss
  1.2,  // Level 5
  1.25, // Level 6
  1.3,  // Level 7
  1.35, // Level 8 - Boss
  1.4,  // Level 9
  1.45, // Level 10
  1.5,  // Level 11
  1.6   // Level 12 - Final Boss
];

// Time limits per level (in seconds)
// More generous time for more balls
export const TIME_INTERVALS = [
  10,  // Level 1 - 4 balls
  14,  // Level 2 - 6 balls
  18,  // Level 3 - 8 balls
  24,  // Level 4 - Boss (10 balls)
  18,  // Level 5 - 8 balls (reset after boss)
  22,  // Level 6 - 10 balls
  26,  // Level 7 - 12 balls
  32,  // Level 8 - Boss (14 balls)
  26,  // Level 9 - 12 balls (reset after boss)
  30,  // Level 10 - 14 balls
  36,  // Level 11 - 16 balls
  45   // Level 12 - Final Boss (18 balls)
];

// Number of balls per level (12 levels with gradual progression)
export const LEVELS = [
  4,   // Level 1 - Tutorial
  6,   // Level 2 - Easy
  8,   // Level 3 - Medium
  10,  // Level 4 - Boss level
  8,   // Level 5 - Reset after boss
  10,  // Level 6
  12,  // Level 7
  14,  // Level 8 - Boss level
  12,  // Level 9 - Reset after boss
  14,  // Level 10
  16,  // Level 11
  18   // Level 12 - Final Boss
];

// Boss levels (0-indexed)
export const BOSS_LEVELS = [3, 7, 11]; // Levels 4, 8, 12