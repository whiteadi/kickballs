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

### Phase 1: Balance & Polish (Priority: HIGH)
- [ ] Reduce ball counts for playability
- [ ] Adjust time limits accordingly
- [ ] Fine-tune ball speeds per level
- [ ] Add level transition animations

### Phase 2: Visual Variety (Priority: MEDIUM)
- [ ] **Different ball types per level**
  - Level 1-2: Black balls (current)
  - Level 3-4: Shiny balls (`shinyball.png`)
  - Level 5-6: Metal balls (`metal.png`)
- [ ] **Background variety**
  - Different tints or backgrounds per level
- [ ] **Ball size variation**
  - Mix of small and large balls in later levels

### Phase 3: Gameplay Mechanics (Priority: MEDIUM)
- [ ] **Combo System**
  - Quick successive hits = bonus multiplier
  - Visual feedback (text popup: "2x!", "3x!")
  - Sound escalation
- [ ] **Special Balls**
  - Golden ball: 5x points
  - Bomb ball: Destroys nearby balls
  - Speed ball: Moves faster, worth more
- [ ] **Power-ups** (spawn randomly)
  - ⏱️ Time Freeze: Pause all balls for 3 seconds
  - 💥 Bomb: Destroy 3 random balls
  - ⭐ Score Boost: 2x points for 10 seconds

### Phase 4: Advanced Features (Priority: LOW)
- [ ] **Boss Levels** (every 3 levels)
  - One giant ball that takes 5 hits
  - Spawns mini-balls when hit
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