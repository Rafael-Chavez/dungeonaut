// ===== DUNGEONAUT MULTIPLAYER CLIENT =====

class MultiplayerClient {
    constructor(game) {
        this.game = game;
        this.ws = null;
        this.playerId = null;
        this.username = localStorage.getItem('dungeonaut_username') || null;
        this.connected = false;
        this.currentMatch = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    // ===== CONNECTION =====
    connect(serverUrl = 'ws://localhost:8080') {
        if (this.ws) {
            this.ws.close();
        }

        console.log('Connecting to multiplayer server...');

        this.ws = new WebSocket(serverUrl);

        this.ws.onopen = () => {
            console.log('Connected to multiplayer server!');
            this.connected = true;
            this.reconnectAttempts = 0;
            this.game.showMultiplayerStatus('Connected', 'success');

            // Request username if not set
            if (!this.username) {
                this.promptUsername();
            } else {
                this.send({ type: 'set_username', username: this.username });
            }
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('Error handling message:', error);
            }
        };

        this.ws.onclose = () => {
            console.log('Disconnected from server');
            this.connected = false;
            this.game.showMultiplayerStatus('Disconnected', 'error');
            this.attemptReconnect(serverUrl);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.game.showMultiplayerStatus('Connection error', 'error');
        };

        // Heartbeat
        setInterval(() => {
            if (this.connected) {
                this.send({ type: 'ping' });
            }
        }, 30000);
    }

    attemptReconnect(serverUrl) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            console.log(`Reconnecting in ${delay}ms... (attempt ${this.reconnectAttempts})`);
            setTimeout(() => this.connect(serverUrl), delay);
        } else {
            this.game.showMultiplayerStatus('Failed to reconnect. Please refresh.', 'error');
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
    }

    send(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.warn('Cannot send message: not connected');
        }
    }

    // ===== USERNAME =====
    promptUsername() {
        const username = prompt('Enter your username:', this.username || `Player${Math.floor(Math.random() * 10000)}`);
        if (username && username.trim()) {
            this.setUsername(username.trim());
        }
    }

    setUsername(username) {
        this.username = username;
        localStorage.setItem('dungeonaut_username', username);
        this.send({ type: 'set_username', username: username });
    }

    // ===== MESSAGE HANDLING =====
    handleMessage(message) {
        console.log('Received:', message.type);

        switch (message.type) {
            case 'connected':
                this.playerId = message.playerId;
                this.username = message.username;
                break;

            case 'username_set':
                this.username = message.username;
                this.game.updateUsernameDisplay(this.username);
                break;

            case 'queue_joined':
                this.game.showMatchmakingUI(message.queueType);
                break;

            case 'queue_left':
                this.game.hideMatchmakingUI();
                break;

            case 'match_found':
                this.currentMatch = {
                    id: message.matchId,
                    opponent: message.opponent,
                    role: message.yourRole
                };
                this.game.showMatchFound(message.opponent);
                break;

            case 'opponent_ready':
                this.game.showOpponentReady();
                break;

            case 'battle_start':
                this.game.startOnlineBattle(message);
                break;

            case 'opponent_action_submitted':
                this.game.showOpponentWaiting();
                break;

            case 'turn_resolved':
                this.game.resolveOnlineTurn(message);
                break;

            case 'match_ended':
                this.currentMatch = null;
                this.game.showOnlineMatchResult(message);
                break;

            case 'leaderboard_data':
                this.game.updateOnlineLeaderboard(message.leaderboard);
                break;

            case 'player_stats':
                this.game.updatePlayerStats(message.stats);
                break;

            case 'pong':
                // Heartbeat response
                break;

            default:
                console.log('Unknown message type:', message.type);
        }
    }

    // ===== MATCHMAKING =====
    joinQueue(queueType) {
        if (!this.connected) {
            alert('Not connected to server. Please wait...');
            return;
        }

        this.send({
            type: 'join_queue',
            queueType: queueType // 'ranked' or 'unranked'
        });
    }

    leaveQueue() {
        this.send({ type: 'leave_queue' });
    }

    // ===== MATCH ACTIONS =====
    submitBuild(build) {
        if (!this.currentMatch) return;

        this.send({
            type: 'submit_build',
            matchId: this.currentMatch.id,
            build: build
        });
    }

    submitAction(action) {
        if (!this.currentMatch) return;

        this.send({
            type: 'submit_action',
            matchId: this.currentMatch.id,
            action: action
        });
    }

    endMatch(winnerId, stats) {
        if (!this.currentMatch) return;

        this.send({
            type: 'end_match',
            matchId: this.currentMatch.id,
            winnerId: winnerId,
            stats: stats
        });
    }

    // ===== DATA REQUESTS =====
    requestLeaderboard() {
        this.send({ type: 'get_leaderboard' });
    }

    requestStats() {
        this.send({ type: 'get_stats' });
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.MultiplayerClient = MultiplayerClient;
}
