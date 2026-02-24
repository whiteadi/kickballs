# KickBalls Game Enhancement Plan 🎮

## Current Game Status
- ✅ Migrated to Phaser 3 + TypeScript + Vite + Capacitor
- ✅ Mobile-friendly with larger balls and touch areas
- ✅ Random ball spawning from edges (level 3+)
- ⚠️ Level 5+ has too many balls (currently 26-30 balls!)

---

## 🔧 Balance Fixes Needed

### Ball Count Per Level (Current vs Proposed)
| Level | Current | Proposed | Notes |
|-------|---------|----------|-------|
| 1     | 4       | 4        | Tutorial level |
| 2     | 6       | 6        | Easy |
| 3     | 15      | 8        | Medium - edge spawning starts |
| 4     | 20      | 12       | Hard |
| 5     | 26      | 16       | Very Hard |
| 6     | 30      | 20       | Expert |

### Time Limits (Current: 4, 10, 17, 22, 26, 33 seconds)
Consider adjusting based on new ball counts.

---

## 🚀 Enhancement Roadmap

### Phase 1: Balance & Polish (Priority: HIGH) ✅ COMPLETED
- [x] Reduce ball counts for playability (4, 6, 8, 12, 16, 20)
- [x] Adjust time limits accordingly (8, 14, 20, 26, 34, 45 seconds)
- [x] Fine-tune ball speeds per level (speed multipliers: 1.0x to 1.5x)
- [x] Add level transition animations (level text + staggered ball spawn)

### Phase 2: Visual Variety (Priority: MEDIUM) ✅ COMPLETED
- [x] **Different ball types per level**
  - Level 1-2: Black balls (`black_ball.png`)
  - Level 3-4: Shiny balls (`shinyball.png`)
  - Level 5: Metal balls (`metal.png`)
  - Level 6: Pang balls (`pangball.png`)
- [x] **Background variety**
  - Animated tint transitions per level (green→blue→red→yellow→purple)
- [x] **Ball size variation**
  - Level 1-2: Uniform size (1.5x)
  - Level 3-4: Slight variation (0.9x-1.2x)
  - Level 5-6: Mix of sizes (0.8x-1.4x)

### Phase 3: Gameplay Mechanics (Priority: MEDIUM) ✅ COMPLETED
- [x] **Combo System** ✅ COMPLETED
  - 1.5 second window to maintain combo
  - Up to 10x score multiplier
  - Color-coded floating text (yellow 2x → cyan 3x+ → magenta 5x+)
  - Points display: "3x COMBO! +90"
- [x] **Special Balls** ✅ COMPLETED
  - ⭐ Golden ball: 5x points, gold tint, gold explosion, "⭐ GOLDEN! ⭐" text
  - 💥 Bomb ball: Destroys nearby balls (150px radius), red tint, big explosion, chain reactions
  - Spawn rates: 10% golden (level 2+), 8% bomb (level 3+)
- [x] **Power-ups** ✅ COMPLETED
  - ⏱️ Time Freeze: Pause all balls for 3 seconds, cyan tint, screen flash
  - 💥 Bomb: Destroy 3 random balls with staggered explosions
  - ⭐ Score Boost: 2x points for 10 seconds, gold score text indicator
  - Spawn every 5-10 seconds from level 2+, auto-despawn after 8 seconds
  - Floating animation with emoji labels (⏱️💥⭐)

### Phase 4: Advanced Features (Priority: LOW) 🔄 IN PROGRESS
- [x] **Expanded to 12 Levels** ✅ COMPLETED
  - Levels 1-2: Tutorial (4-6 balls, black balls)
  - Levels 3-4: Early-mid (8-10 balls, shiny balls) - Boss at L4
  - Levels 5-6: Mid (8-10 balls, metal balls)
  - Levels 7-8: Mid-late (12-14 balls, pang balls) - Boss at L8
  - Levels 9-10: Late (12-14 balls, mixed ball types)
  - Levels 11-12: Final (16-18 balls, mixed) - Final Boss at L12
  - Unique background tints for each level
  - Progressive speed multipliers (1.0x → 1.6x)
- [x] **Boss Levels** ✅ COMPLETED (at levels 4, 8, 12)
  - 🔴 Giant red boss ball (3x-4x scale)
  - ❤️ Health system: 5/7/9 HP for Mini/Mega/Final Boss
  - 📊 Health bar UI with color changes (green→yellow→red)
  - 👾 Spawns 2 minion balls on each hit
  - ⚡ Boss speeds up when damaged
  - 💥 Multi-explosion defeat animation
  - 🏆 Bonus points: 500/750/1000 for defeating bosses
  - ⚠️ Dramatic "BOSS WARNING" entrance animation
- [x] **Polish: Particle Effects** ✅ COMPLETED
  - 💥 Pop particles on ball destruction (colored by level)
  - ✨ Sparkle particles for golden balls
  - 🎯 Combo particles (escalating count, color-coded)
- [x] **Polish: Sound Variety** ✅ COMPLETED
  - 🔊 Different pitch for each ball type (golden=high, bomb=low, boss=very low)
  - 📈 Combo escalating pitch (1.0x → 2.0x)
  - 🎵 Power-up collect sound (high pitch whoosh)
- [ ] **Endless Mode**
  - Survive as long as possible
  - Increasing difficulty over time
- [ ] **Daily Challenges**
  - Special rules each day
  - Leaderboard

---

## 🎨 Asset Inventory
Available images we can use:
- `black_ball.png` / `black_ball2.png` - Current balls
- `shinyball.png` - Shiny variant
- `metal.png` / `metal2.png` - Metal balls
- `pangball.png` - Alternative ball
- `ball.png` / `ball2.png` - Other variants
- `mushroom2.png` - Could be power-up
- `EnemyBug.png` - Currently used as platform

---

## 📱 Mobile Optimizations Done
- [x] Balls scaled 1.5x for easier tapping
- [x] Larger hit areas (80% bigger than visual)
- [x] Touch response on `pointerdown` (instant)
- [x] FIT scaling mode
- [x] Multi-touch support (3 pointers)

---

## 🐛 Known Issues
1. Level 5+ has too many balls (30!) - needs rebalancing
2. Screen shake might be too intense on mobile
3. Timer position might overlap with score on small screens

---

## 💡 Future Ideas
- Achievements system
- Sound settings persistence (localStorage)
- Haptic feedback on mobile
- Social sharing of scores
- Multiple game modes (Zen, Time Attack, Survival)

---

## 📊 Technical Debt
- [ ] Add proper collision groups (avoid duplicate colliders in update loop)
- [ ] Implement object pooling for balls
- [ ] Add loading progress indicator
- [ ] Error handling for audio (some browsers block autoplay)

---

*Last updated: February 2026*