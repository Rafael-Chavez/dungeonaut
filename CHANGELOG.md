# Dungeonaut Changelog

## Version 2.0 - Online Multiplayer Update (December 2025)

### 🌐 Major Features

#### Online Multiplayer System
- **Real-time WebSocket server** for live battles
- **Automatic matchmaking** with ranked and unranked queues
- **Turn synchronization** ensuring fair gameplay
- **Online leaderboards** tracking global rankings
- **Player profiles** with custom usernames
- **Disconnect handling** with automatic forfeit
- **Battle history** and statistics tracking

#### Enhanced PvP
- **4 game modes** now available:
  - Online Ranked (vs real players)
  - Online Casual (vs real players, unranked)
  - AI Ranked (vs AI, tracked)
  - AI Practice (vs AI, casual)

### 📁 New Files

| File | Purpose |
|------|---------|
| `server.js` | WebSocket multiplayer server |
| `multiplayer.js` | Client-side multiplayer integration |
| `package.json` | Node.js dependencies |
| `MULTIPLAYER_SETUP.md` | Comprehensive setup guide |
| `test-connection.html` | Connection testing tool |
| `.gitignore` | Git ignore patterns |

### 🎨 UI Enhancements

- **Multiplayer status indicator** showing connection state
- **Matchmaking screen** with queue timer
- **Match found animation** with opponent reveal
- **Waiting indicators** during opponent turns
- **Username display** in lobby
- **Connection status colors** (green/yellow/red)
- **Animated spinner** during matchmaking

### 🔧 Technical Improvements

- **WebSocket protocol** for low-latency communication
- **Heartbeat system** for connection monitoring
- **Auto-reconnect** with exponential backoff
- **Message validation** and error handling
- **Queue management** with FIFO ordering
- **Match state persistence** during battles
- **Server-side validation** of game logic

### 📊 Statistics & Tracking

- **Win/Loss records** per player
- **Win rate calculations**
- **Match history** storage
- **Online leaderboards** (daily, weekly, all-time)
- **Turn duration** tracking
- **Battle statistics** (damage dealt/taken, turns)

### 🎮 Gameplay Changes

- **Simultaneous turn resolution** in online mode
- **Action submission** with confirmation
- **Opponent action visibility** after resolution
- **Forfeit on disconnect** for fair play
- **Build sharing** between matched players

---

## Version 1.0 - Initial Release

### Core Features

#### Speedrun Mode (PvE)
- Daily procedurally generated dungeons
- Stamina system (5 runs per day)
- Time-based scoring with penalties
- 10 unique rooms per dungeon
- Boss encounters
- Ghost stats for top runs
- Local leaderboards

#### PvP Arena (Local)
- Turn-based tactical combat
- 16 unique skills across 5 types
- Type advantage system
- Priority-based action resolution
- 10+ status effects
- AI opponents
- Build customization

#### UI/UX
- Glassmorphism design
- Smooth animations
- Responsive layout
- Dark theme
- Real-time combat log

---

## Planned Features (v2.1+)

### High Priority
- [ ] ELO rating system
- [ ] Ranked seasons
- [ ] Tournament brackets
- [ ] Replay system
- [ ] Spectator mode

### Medium Priority
- [ ] Friend system
- [ ] Custom lobbies
- [ ] Chat functionality
- [ ] Team battles (2v2, 3v3)
- [ ] Draft mode (ban/pick)

### Low Priority
- [ ] Mobile app
- [ ] More character classes
- [ ] Cosmetic items
- [ ] Achievement system
- [ ] Daily quests

---

## Bug Fixes & Improvements

### v2.0.1 (Coming Soon)
- Fix: Matchmaking timeout handling
- Fix: Battle desync edge cases
- Improvement: Better error messages
- Improvement: Server performance optimization

### v2.0.0
- Initial multiplayer release
- All core features working
- Tested with 2-4 concurrent players

---

## Credits

**Design & Implementation**: Claude (Anthropic AI)
**Concept**: Based on roguelike speedrunning and tactical PvP games
**Inspired By**: Pokémon (turn-based), Dead Cells (speedrunning), TFT (matchmaking)

---

**Want to contribute?** Check the issues tab or submit a PR!
