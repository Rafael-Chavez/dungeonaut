// ===== DUNGEONAUT MULTIPLAYER SERVER =====
// Simple WebSocket server for real-time PvP battles

const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;

// Create HTTP server
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Dungeonaut Multiplayer Server Running\n');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Game state
const gameState = {
    players: new Map(), // playerId -> player object
    matchmakingQueue: {
        ranked: [],
        unranked: []
    },
    activeMatches: new Map(), // matchId -> match object
    leaderboard: {
        daily: [],
        weekly: [],
        alltime: []
    }
};

// ===== UTILITY FUNCTIONS =====
function generateId() {
    return crypto.randomBytes(16).toString('hex');
}

function broadcast(clients, message) {
    const data = JSON.stringify(message);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(data);
        }
    });
}

function sendToPlayer(playerId, message) {
    const player = gameState.players.get(playerId);
    if (player && player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify(message));
    }
}

// ===== MATCHMAKING =====
function addToQueue(playerId, queueType) {
    const player = gameState.players.get(playerId);
    if (!player) return;

    // Remove from other queues
    gameState.matchmakingQueue.ranked = gameState.matchmakingQueue.ranked.filter(p => p.id !== playerId);
    gameState.matchmakingQueue.unranked = gameState.matchmakingQueue.unranked.filter(p => p.id !== playerId);

    // Add to requested queue
    gameState.matchmakingQueue[queueType].push({
        id: playerId,
        username: player.username,
        joinedAt: Date.now()
    });

    console.log(`Player ${player.username} joined ${queueType} queue`);

    // Try to create a match
    tryCreateMatch(queueType);
}

function removeFromQueue(playerId) {
    gameState.matchmakingQueue.ranked = gameState.matchmakingQueue.ranked.filter(p => p.id !== playerId);
    gameState.matchmakingQueue.unranked = gameState.matchmakingQueue.unranked.filter(p => p.id !== playerId);
}

function tryCreateMatch(queueType) {
    const queue = gameState.matchmakingQueue[queueType];

    if (queue.length >= 2) {
        // Create match with first two players
        const player1Data = queue.shift();
        const player2Data = queue.shift();

        const player1 = gameState.players.get(player1Data.id);
        const player2 = gameState.players.get(player2Data.id);

        if (!player1 || !player2) return;

        const matchId = generateId();
        const match = {
            id: matchId,
            type: queueType,
            player1: {
                id: player1Data.id,
                username: player1.username,
                ready: false,
                build: null,
                disconnected: false
            },
            player2: {
                id: player2Data.id,
                username: player2.username,
                ready: false,
                build: null,
                disconnected: false
            },
            state: 'building', // building, ready, active, finished
            turn: 0,
            maxTurns: 30,
            actions: {
                player1: null,
                player2: null
            },
            battleLog: [],
            winner: null,
            createdAt: Date.now()
        };

        gameState.activeMatches.set(matchId, match);

        // Notify players
        sendToPlayer(player1Data.id, {
            type: 'match_found',
            matchId: matchId,
            opponent: player2.username,
            yourRole: 'player1'
        });

        sendToPlayer(player2Data.id, {
            type: 'match_found',
            matchId: matchId,
            opponent: player1.username,
            yourRole: 'player2'
        });

        console.log(`Match created: ${player1.username} vs ${player2.username}`);
    }
}

// ===== MATCH LOGIC =====
function submitBuild(playerId, matchId, build) {
    const match = gameState.activeMatches.get(matchId);
    if (!match) return;

    const playerRole = match.player1.id === playerId ? 'player1' : 'player2';
    match[playerRole].build = build;
    match[playerRole].ready = true;

    // Notify opponent
    const opponentRole = playerRole === 'player1' ? 'player2' : 'player1';
    const opponentId = match[opponentRole].id;

    sendToPlayer(opponentId, {
        type: 'opponent_ready',
        matchId: matchId
    });

    // Check if both ready
    if (match.player1.ready && match.player2.ready) {
        match.state = 'ready';

        // Start battle
        sendToPlayer(match.player1.id, {
            type: 'battle_start',
            matchId: matchId,
            playerData: match.player1.build,
            opponentData: match.player2.build
        });

        sendToPlayer(match.player2.id, {
            type: 'battle_start',
            matchId: matchId,
            playerData: match.player2.build,
            opponentData: match.player1.build
        });

        match.state = 'active';
        console.log(`Battle started: ${match.player1.username} vs ${match.player2.username}`);
    }
}

function submitAction(playerId, matchId, action) {
    const match = gameState.activeMatches.get(matchId);
    if (!match || match.state !== 'active') return;

    const playerRole = match.player1.id === playerId ? 'player1' : 'player2';
    match.actions[playerRole] = action;

    // Check if both players submitted
    if (match.actions.player1 && match.actions.player2) {
        // Resolve turn (client-side for now, server validates later)
        match.turn++;

        // Broadcast actions to both players
        sendToPlayer(match.player1.id, {
            type: 'turn_resolved',
            matchId: matchId,
            turn: match.turn,
            yourAction: match.actions.player1,
            opponentAction: match.actions.player2
        });

        sendToPlayer(match.player2.id, {
            type: 'turn_resolved',
            matchId: matchId,
            turn: match.turn,
            yourAction: match.actions.player2,
            opponentAction: match.actions.player1
        });

        // Reset actions
        match.actions.player1 = null;
        match.actions.player2 = null;
    } else {
        // Notify opponent that player is waiting
        const opponentRole = playerRole === 'player1' ? 'player2' : 'player1';
        const opponentId = match[opponentRole].id;

        sendToPlayer(opponentId, {
            type: 'opponent_action_submitted',
            matchId: matchId
        });
    }
}

function endMatch(matchId, winnerId, stats) {
    const match = gameState.activeMatches.get(matchId);
    if (!match) return;

    match.state = 'finished';
    match.winner = winnerId;

    const loserRole = match.player1.id === winnerId ? 'player2' : 'player1';
    const loserId = match[loserRole].id;

    // Update leaderboard
    const winner = gameState.players.get(winnerId);
    const loser = gameState.players.get(loserId);

    if (winner) winner.stats.wins++;
    if (loser) loser.stats.losses++;

    // Add to leaderboard
    const entry = {
        winner: winner?.username || 'Unknown',
        loser: loser?.username || 'Unknown',
        turns: match.turn,
        type: match.type,
        date: new Date().toISOString(),
        stats: stats
    };

    gameState.leaderboard.daily.push(entry);
    gameState.leaderboard.alltime.push(entry);

    // Sort and trim
    gameState.leaderboard.daily.sort((a, b) => a.turns - b.turns);
    gameState.leaderboard.alltime.sort((a, b) => a.turns - b.turns);
    gameState.leaderboard.daily = gameState.leaderboard.daily.slice(0, 100);
    gameState.leaderboard.alltime = gameState.leaderboard.alltime.slice(0, 100);

    // Notify players
    sendToPlayer(winnerId, {
        type: 'match_ended',
        matchId: matchId,
        result: 'victory',
        stats: winner?.stats
    });

    sendToPlayer(loserId, {
        type: 'match_ended',
        matchId: matchId,
        result: 'defeat',
        stats: loser?.stats
    });

    // Clean up match after 30 seconds
    setTimeout(() => {
        gameState.activeMatches.delete(matchId);
    }, 30000);

    console.log(`Match ended: ${winner?.username} defeated ${loser?.username}`);
}

// ===== WEBSOCKET HANDLERS =====
wss.on('connection', (ws) => {
    const playerId = generateId();
    console.log(`New connection: ${playerId}`);

    // Initialize player
    gameState.players.set(playerId, {
        id: playerId,
        ws: ws,
        username: `Player${Math.floor(Math.random() * 10000)}`,
        stats: {
            wins: 0,
            losses: 0,
            matches: 0
        },
        connectedAt: Date.now()
    });

    // Send player their ID
    ws.send(JSON.stringify({
        type: 'connected',
        playerId: playerId,
        username: gameState.players.get(playerId).username
    }));

    // Handle messages
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            handleMessage(playerId, message);
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    // Handle disconnect
    ws.on('close', () => {
        console.log(`Player disconnected: ${playerId}`);
        handleDisconnect(playerId);
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for ${playerId}:`, error);
    });
});

function handleMessage(playerId, message) {
    const player = gameState.players.get(playerId);
    if (!player) return;

    switch (message.type) {
        case 'set_username':
            player.username = message.username.substring(0, 20); // Limit length
            sendToPlayer(playerId, {
                type: 'username_set',
                username: player.username
            });
            console.log(`Player ${playerId} set username to ${player.username}`);
            break;

        case 'join_queue':
            addToQueue(playerId, message.queueType);
            sendToPlayer(playerId, {
                type: 'queue_joined',
                queueType: message.queueType
            });
            break;

        case 'leave_queue':
            removeFromQueue(playerId);
            sendToPlayer(playerId, {
                type: 'queue_left'
            });
            break;

        case 'submit_build':
            submitBuild(playerId, message.matchId, message.build);
            break;

        case 'submit_action':
            submitAction(playerId, message.matchId, message.action);
            break;

        case 'end_match':
            endMatch(message.matchId, message.winnerId, message.stats);
            break;

        case 'get_leaderboard':
            sendToPlayer(playerId, {
                type: 'leaderboard_data',
                leaderboard: gameState.leaderboard
            });
            break;

        case 'get_stats':
            sendToPlayer(playerId, {
                type: 'player_stats',
                stats: player.stats
            });
            break;

        case 'ping':
            sendToPlayer(playerId, { type: 'pong' });
            break;

        default:
            console.log(`Unknown message type: ${message.type}`);
    }
}

function handleDisconnect(playerId) {
    // Remove from queues
    removeFromQueue(playerId);

    // Handle active matches
    gameState.activeMatches.forEach((match, matchId) => {
        if (match.player1.id === playerId) {
            match.player1.disconnected = true;
            // Forfeit match
            if (match.state === 'active') {
                endMatch(matchId, match.player2.id, { forfeit: true });
            }
        } else if (match.player2.id === playerId) {
            match.player2.disconnected = true;
            // Forfeit match
            if (match.state === 'active') {
                endMatch(matchId, match.player1.id, { forfeit: true });
            }
        }
    });

    // Remove player
    gameState.players.delete(playerId);
}

// ===== SERVER STATUS =====
setInterval(() => {
    console.log(`Server Status:
    - Players online: ${gameState.players.size}
    - Ranked queue: ${gameState.matchmakingQueue.ranked.length}
    - Unranked queue: ${gameState.matchmakingQueue.unranked.length}
    - Active matches: ${gameState.activeMatches.size}
    `);
}, 60000); // Every minute

// Start server
server.listen(PORT, () => {
    console.log(`🎮 Dungeonaut Multiplayer Server running on port ${PORT}`);
    console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    wss.clients.forEach((client) => {
        client.close();
    });
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
