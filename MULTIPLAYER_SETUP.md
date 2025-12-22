# 🌐 Dungeonaut Multiplayer Setup Guide

## Overview

Dungeonaut now features **real-time online multiplayer** using WebSockets! Players can battle each other in tactical turn-based PvP matches with automatic matchmaking.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `ws` - WebSocket library for Node.js
- `nodemon` (dev) - Auto-restart server on changes

### 2. Start the Server

```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

The server will start on **port 8080** by default.

### 3. Open the Game

Simply open `index.html` in your web browser. The game will automatically try to connect to `ws://localhost:8080`.

### 4. Test Multiplayer

- Open the game in **two different browser windows** (or tabs)
- Both players click **"PvP Arena"**
- Choose **"Online Ranked"** or **"Online Casual"**
- The matchmaking system will pair you together!

## Features

### 🎮 Matchmaking System
- **Ranked Queue** - Competitive matches that affect your W/L record
- **Unranked Queue** - Casual practice matches
- **Automatic pairing** - Players are matched within seconds
- **Queue timer** - Shows how long you've been waiting

### ⚔️ Real-Time Battles
- **Simultaneous turn resolution** - Both players submit actions, then resolve together
- **Live opponent feedback** - See when your opponent is thinking
- **Turn-by-turn synchronization** - Server ensures fair play
- **Disconnect handling** - Forfeit if a player leaves

### 📊 Online Leaderboards
- **Daily rankings** - Reset every day
- **All-time records** - Track the best players ever
- **Match history** - Stores completed battles
- **Win/Loss tracking** - See your arena stats

### 👤 Player System
- **Custom usernames** - Set your display name
- **Persistent stats** - Wins, losses, win rate
- **Auto-reconnect** - Handles temporary disconnections

## Architecture

### Server (`server.js`)
```
WebSocket Server (Port 8080)
├── Matchmaking Queues (Ranked/Unranked)
├── Active Matches Management
├── Player Connection Handling
└── Leaderboard Storage
```

### Client (`multiplayer.js`)
```
WebSocket Client
├── Connection Management
├── Message Handlers
├── Matchmaking Interface
└── Battle Synchronization
```

### Game Integration (`game.js`)
```
Game Logic
├── Online Mode Detection
├── Build Submission
├── Action Synchronization
└── Result Handling
```

## Server Messages

### Client → Server

| Message Type | Purpose |
|-------------|---------|
| `set_username` | Set player display name |
| `join_queue` | Enter matchmaking (ranked/unranked) |
| `leave_queue` | Cancel matchmaking |
| `submit_build` | Send character build to server |
| `submit_action` | Send turn action |
| `end_match` | Report match result |
| `get_leaderboard` | Request leaderboard data |

### Server → Client

| Message Type | Purpose |
|-------------|---------|
| `connected` | Connection established, receive player ID |
| `match_found` | Opponent found, match created |
| `battle_start` | Both players ready, start battle |
| `turn_resolved` | Both actions submitted, resolve turn |
| `match_ended` | Battle finished, show results |
| `leaderboard_data` | Leaderboard information |

## Deployment

### Local Network (LAN)

1. Find your local IP:
   ```bash
   # Windows
   ipconfig

   # Mac/Linux
   ifconfig
   ```

2. Update client to connect to your IP:
   ```javascript
   localStorage.setItem('dungeonaut_server_url', 'ws://192.168.1.XXX:8080');
   ```

3. Share the game files with others on your network
4. They open `index.html` and connect automatically

### Cloud Deployment

#### Option 1: Heroku

1. Create `Procfile`:
   ```
   web: node server.js
   ```

2. Deploy:
   ```bash
   heroku create dungeonaut-server
   git push heroku main
   ```

3. Update client:
   ```javascript
   localStorage.setItem('dungeonaut_server_url', 'wss://dungeonaut-server.herokuapp.com');
   ```

#### Option 2: DigitalOcean/AWS

1. Set up a Node.js server
2. Install dependencies: `npm install`
3. Run with PM2: `pm2 start server.js`
4. Configure firewall to allow port 8080
5. Use nginx as reverse proxy for WSS

#### Option 3: Glitch.com

1. Create new Glitch project
2. Upload `server.js` and `package.json`
3. Glitch auto-installs and runs
4. Use the Glitch URL in client

### Security Considerations

For production deployment:

1. **Use WSS (WebSocket Secure)**
   ```javascript
   // Add SSL certificate
   const https = require('https');
   const fs = require('fs');

   const server = https.createServer({
     cert: fs.readFileSync('cert.pem'),
     key: fs.readFileSync('key.pem')
   });
   ```

2. **Add Rate Limiting**
   ```javascript
   // Prevent spam/abuse
   const rateLimits = new Map();
   ```

3. **Validate Messages**
   ```javascript
   // Sanitize and validate all input
   if (!message.type || typeof message.type !== 'string') {
     return;
   }
   ```

4. **Add Authentication**
   ```javascript
   // Use JWT tokens or session IDs
   const jwt = require('jsonwebtoken');
   ```

## Configuration

### Server Environment Variables

```bash
# Port (default: 8080)
PORT=8080

# Enable debug logging
DEBUG=true
```

### Client Configuration

Store in localStorage:

```javascript
// Server URL
localStorage.setItem('dungeonaut_server_url', 'ws://localhost:8080');

// Username
localStorage.setItem('dungeonaut_username', 'YourName');
```

## Troubleshooting

### "Not connected to server" Error

1. Check if server is running: `npm start`
2. Verify WebSocket port is open
3. Check console for connection errors
4. Try refreshing the page

### Matchmaking Not Finding Opponent

1. Ensure **two players** are in the same queue
2. Check server logs for errors
3. Verify both clients are connected
4. Try leaving and rejoining queue

### Battle Desyncs

1. Check network connection stability
2. Server logs show turn resolution
3. Both players should see same actions
4. Report to server admin if persistent

### Connection Timeouts

1. Server has 30-second heartbeat
2. Auto-reconnect attempts 5 times
3. Check firewall settings
4. Verify WebSocket support in browser

## Performance

### Server Capacity

Current implementation can handle:
- **~100 concurrent players** (single process)
- **~50 active matches** simultaneously
- Scales horizontally with load balancer

### Optimization Tips

1. **Use clustering** for more capacity:
   ```javascript
   const cluster = require('cluster');
   const numCPUs = require('os').cpus().length;
   ```

2. **Add Redis** for state management:
   ```javascript
   const redis = require('redis');
   const client = redis.createClient();
   ```

3. **Implement reconnection grace period**
4. **Add match spectating** for engagement

## Future Enhancements

- [ ] ELO rating system
- [ ] Ranked seasons with rewards
- [ ] Tournament brackets
- [ ] Replay system
- [ ] Chat system
- [ ] Friend lists
- [ ] Custom lobbies
- [ ] Team battles (2v2, 3v3)
- [ ] Spectator mode
- [ ] Draft mode (ban/pick)

## Support

For issues or questions:
1. Check console logs (F12 in browser)
2. Review server output
3. Open issue on GitHub
4. Join Discord community (if available)

---

**Ready to battle online? Start the server and challenge your friends! ⚔️🌐**
