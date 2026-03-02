// Base ball speed - slightly increased
export const BALL_SPEED = 180;

// Speed multiplier per level (balls get faster as levels progress)
// 12 levels: gradual increase from 1.0x to 1.8x (was 1.6x)
export const SPEED_MULTIPLIERS = [
  1.0,  // Level 1 - Tutorial
  1.1,  // Level 2 (was 1.05)
  1.2,  // Level 3 (was 1.1)
  1.25, // Level 4 - Boss (was 1.15)
  1.3,  // Level 5 (was 1.2)
  1.35, // Level 6 (was 1.25)
  1.4,  // Level 7 (was 1.3)
  1.5,  // Level 8 - Boss (was 1.35)
  1.55, // Level 9 (was 1.4)
  1.6,  // Level 10 (was 1.45)
  1.7,  // Level 11 (was 1.5)
  1.8   // Level 12 - Final Boss (was 1.6)
];

// Time limits per level (in seconds)
// Boss levels have generous time limits since they're challenging
export const TIME_INTERVALS = [
  8,   // Level 1 - 4 balls
  11,  // Level 2 - 6 balls
  14,  // Level 3 - 8 balls
  45,  // Level 4 - BOSS (8 HP + minions, needs more time!)
  14,  // Level 5 - 8 balls
  18,  // Level 6 - 10 balls
  21,  // Level 7 - 12 balls
  55,  // Level 8 - BOSS (12 HP + minions)
  21,  // Level 9 - 12 balls
  24,  // Level 10 - 14 balls
  29,  // Level 11 - 16 balls
  70   // Level 12 - FINAL BOSS (16 HP + many minions)
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