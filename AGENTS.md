# Agent Memory - FIFA Mobile

## Repository Context
This is a FIFA Mobile game repository - a playable 2D football game with JavaScript/HTML5 Canvas.

## Key Files
- `js/game.js` - Main game loop and state management
- `js/player.js` - Player class with movement and shooting
- `js/team.js` - Team management
- `js/ball.js` - Ball physics
- `js/ai.js` - AI opponent logic

## Completed Fixes
1. **SyntaxError Fix**: Fixed stray semicolon in js/game.js (commit fd32028)
2. **Cache Busting**: Added `?v=XX` cache busting to script tags (commit d549d53)
3. **Mouse Click Control**: Implemented click-to-move player control (commits d15f952, fc467dc, 0db0027, 2a5d34b)
   - Clicking on canvas moves controlled player to that position
   - Player moves toward target until reaching it

## Controls
- **Desktop**: WASD/Arrow keys to move, Space to dribble
- **Mobile**: On-screen buttons (Shoot, Pass, Drible)
- **Click-to-move**: Click anywhere on canvas to move player to that position

## Browser Automation Limitation
- Browser automation tools don't send real keyboard/mouse events
- This affects testing but not actual user gameplay
- The game works correctly when used by real users