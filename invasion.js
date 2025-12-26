// ===== INVASION GAME MODE =====
// Turn-based strategy game inspired by RuneScape's Conquest

class InvasionSystem {
    constructor(game) {
        this.game = game;

        // Game constants
        this.BOARD_SIZE = 20;
        this.MAX_UNITS = 10;
        this.MAX_COMMANDS = 4;
        this.STARTING_POINTS = 1000;
        this.STARTING_COMMAND_POINTS = 25;
        this.TURN_TIME_DEFAULT = 60; // seconds

        // Player data
        this.playerUnits = [];
        this.playerCommands = [];
        this.playerFormation = this.createEmptyFormation();
        this.remainingPoints = this.STARTING_POINTS;

        // Game state
        this.currentGame = null;
        this.isPlayerTurn = false;
        this.currentPhase = null; // 'selection', 'movement', 'combat', 'rally'
        this.selectedUnit = null;
        this.turnTimeRemaining = this.TURN_TIME_DEFAULT;
        this.actionCount = 0;

        // Unit definitions
        this.unitTypes = {
            scout: {
                name: 'Scout',
                icon: '🏃',
                movement: 6,
                damage: 50,
                health: 100,
                range: 1,
                cost: 25,
                description: 'Fast unit with great movement but poor combat stats'
            },
            footSoldier: {
                name: 'Foot Soldier',
                icon: '🛡️',
                movement: 3,
                damage: 75,
                health: 300,
                range: 1,
                cost: 100,
                description: 'Well-rounded unit with high health'
            },
            halberdier: {
                name: 'Halberdier',
                icon: '🗡️',
                movement: 3,
                damage: 100,
                health: 200,
                range: 2,
                cost: 125,
                description: 'Only melee troop with range of 2'
            },
            archer: {
                name: 'Archer',
                icon: '🏹',
                movement: 3,
                damage: 75,
                health: 100,
                range: 5,
                cost: 75,
                description: 'Long-range unit, weak in close combat'
            },
            mage: {
                name: 'Mage',
                icon: '🧙',
                movement: 3,
                damage: 125,
                health: 100,
                range: 3,
                cost: 125,
                description: 'High damage ranged unit with moderate range'
            },
            knight: {
                name: 'Knight',
                icon: '🐴',
                movement: 4,
                damage: 150,
                health: 300,
                range: 1,
                cost: 200,
                description: 'Strong melee unit with good mobility'
            },
            champion: {
                name: 'Champion',
                icon: '⚔️',
                movement: 3,
                damage: 250,
                health: 500,
                range: 1,
                cost: 300,
                description: 'Strongest unit on the battlefield'
            }
        };

        // Command definitions
        this.commandTypes = {
            battleCry: {
                name: 'Battle Cry',
                icon: '💪',
                description: 'Target unit gains +200 damage and +200 health until start of next turn',
                cooldown: 5,
                cost: 75,
                effect: (unit) => {
                    unit.buffDamage = (unit.buffDamage || 0) + 200;
                    unit.buffHealth = (unit.buffHealth || 0) + 200;
                    unit.maxHealth += 200;
                    unit.currentHealth += 200;
                }
            },
            stoicism: {
                name: 'Stoicism',
                icon: '🛡️',
                description: 'Target unit gains +400 health until start of next turn',
                cooldown: 5,
                cost: 75,
                effect: (unit) => {
                    unit.buffHealth = (unit.buffHealth || 0) + 400;
                    unit.maxHealth += 400;
                    unit.currentHealth += 400;
                }
            },
            regenerate: {
                name: 'Regenerate',
                icon: '💚',
                description: 'Target unit has its health completely restored',
                cooldown: 4,
                cost: 150,
                effect: (unit) => {
                    unit.currentHealth = unit.maxHealth;
                }
            },
            bombard: {
                name: 'Bombard',
                icon: '💥',
                description: 'Target enemy unit loses 100 health (no command points if killed)',
                cooldown: 2,
                cost: 200,
                effect: (unit) => {
                    unit.currentHealth = Math.max(0, unit.currentHealth - 100);
                }
            },
            windsOfFate: {
                name: 'Winds of Fate',
                icon: '🌪️',
                description: 'A random command reaches end of cooldown and is ready to use',
                cooldown: 2,
                cost: 150,
                effect: (gameState) => {
                    const onCooldown = gameState.commandCooldowns.filter(c => c.remaining > 0);
                    if (onCooldown.length > 0) {
                        const randomCmd = onCooldown[Math.floor(Math.random() * onCooldown.length)];
                        randomCmd.remaining = 0;
                    }
                }
            },
            charge: {
                name: 'Charge',
                icon: '⚡',
                description: 'Target unit has movement doubled for this turn',
                cooldown: 5,
                cost: 75,
                effect: (unit) => {
                    unit.movement = unit.movement * 2;
                }
            },
            chastise: {
                name: 'Chastise',
                icon: '🚫',
                description: 'Target enemy cannot move or attack during next turn (not on last unit)',
                cooldown: 3,
                cost: 50,
                effect: (unit) => {
                    unit.stunned = true;
                }
            },
            vigilance: {
                name: 'Vigilance',
                icon: '👁️',
                description: 'Target unit strikes first when defending until start of next turn',
                cooldown: 3,
                cost: 50,
                effect: (unit) => {
                    unit.strikesFirst = true;
                }
            },
            shieldWall: {
                name: 'Shield Wall',
                icon: '🛡️',
                description: 'All damage to target unit reduced to 100 until start of next turn',
                cooldown: 5,
                cost: 50,
                effect: (unit) => {
                    unit.damageReduction = true;
                }
            }
        };
    }

    // ===== SETUP METHODS =====

    createEmptyFormation() {
        // 20x20 board, player controls rows 0-2 for placement
        const formation = [];
        for (let row = 0; row < 3; row++) {
            formation[row] = [];
            for (let col = 0; col < 20; col++) {
                formation[row][col] = null;
            }
        }
        return formation;
    }

    showInvasionMenu() {
        // Add invasion-active class to remove app padding
        const appDiv = document.getElementById('app');
        if (appDiv) {
            appDiv.classList.add('invasion-active');
        }

        this.game.showScreen('invasion-menu-screen');
        this.updateInvasionMenuUI();
        this.showUnitShop();
        this.showCommandShop();
    }

    updateInvasionMenuUI() {
        const pointsDisplay = document.getElementById('invasion-points-remaining');

        if (pointsDisplay) {
            pointsDisplay.textContent = `${this.remainingPoints} / ${this.STARTING_POINTS}`;
        }

        // Refresh shops to update selection state
        this.showUnitShop();
        this.showCommandShop();
    }

    showUnitShop() {
        const shopEl = document.getElementById('invasion-unit-shop');
        if (!shopEl) return;

        shopEl.innerHTML = `
            <div class="invasion-unit-grid">
                ${Object.keys(this.unitTypes).map(type => {
                    const unit = this.unitTypes[type];
                    const selectedCount = this.playerUnits.filter(u => u.type === type).length;
                    const canAfford = this.remainingPoints >= unit.cost;
                    const hasSpace = this.playerUnits.length < this.MAX_UNITS;
                    const canPurchase = canAfford && hasSpace;

                    return `
                        <div class="invasion-unit-card ${canPurchase ? '' : 'disabled'}"
                             onclick="${canPurchase ? `game.invasionSystem.addUnit('${type}')` : ''}">
                            <div class="unit-icon">${unit.icon}</div>
                            <div class="unit-info">
                                <div class="unit-name">${unit.name}</div>
                                <div class="unit-stats">
                                    <div class="stat-item">⚔️${unit.damage}</div>
                                    <div class="stat-item">❤️${unit.health}</div>
                                    <div class="stat-item">👟${unit.movement}</div>
                                    <div class="stat-item">🎯${unit.range}</div>
                                </div>
                            </div>
                            <div class="unit-cost-badge">${unit.cost}</div>
                            ${selectedCount > 0 ? `<div class="selected-badge">x${selectedCount}</div>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    showCommandShop() {
        const shopEl = document.getElementById('invasion-command-shop');
        if (!shopEl) return;

        shopEl.innerHTML = `
            <div class="invasion-command-grid">
                ${Object.keys(this.commandTypes).map(type => {
                    const cmd = this.commandTypes[type];
                    const hasSpace = this.playerCommands.length < this.MAX_COMMANDS;
                    const alreadySelected = this.playerCommands.includes(type);
                    const canPurchase = hasSpace && !alreadySelected;

                    return `
                        <div class="invasion-command-card ${alreadySelected ? 'selected' : ''} ${canPurchase ? '' : 'disabled'}"
                             onclick="${canPurchase ? `game.invasionSystem.addCommand('${type}')` : (alreadySelected ? `game.invasionSystem.removeCommandByType('${type}')` : '')}">
                            <div class="command-icon">${cmd.icon}</div>
                            <div class="command-info">
                                <div class="command-name">${cmd.name}</div>
                                <div class="command-description">${cmd.description}</div>
                                <div class="command-stats">
                                    <div class="stat-item">⏱️${cmd.cooldown}t</div>
                                    <div class="stat-item">💎${cmd.cost}</div>
                                </div>
                            </div>
                            ${alreadySelected ? '<div class="selected-badge">✓</div>' : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    addUnit(type) {
        if (this.playerUnits.length >= this.MAX_UNITS) {
            alert('Maximum units reached (10)');
            return;
        }

        const unit = this.unitTypes[type];
        if (this.remainingPoints < unit.cost) {
            alert('Not enough points');
            return;
        }

        this.playerUnits.push({
            type: type,
            id: Date.now() + Math.random()
        });
        this.remainingPoints -= unit.cost;

        this.updateInvasionMenuUI();
        this.showUnitShop();
    }

    removeUnit(index) {
        const unit = this.playerUnits[index];
        const unitType = this.unitTypes[unit.type];
        this.remainingPoints += unitType.cost;
        this.playerUnits.splice(index, 1);

        this.updateInvasionMenuUI();
        this.showUnitShop();
    }

    addCommand(type) {
        if (this.playerCommands.length >= this.MAX_COMMANDS) {
            alert('Maximum commands reached (4)');
            return;
        }

        if (this.playerCommands.includes(type)) {
            alert('Command already selected');
            return;
        }

        this.playerCommands.push(type);
        this.updateInvasionMenuUI();
        this.showCommandShop();
    }

    removeCommand(index) {
        this.playerCommands.splice(index, 1);
        this.updateInvasionMenuUI();
        this.showCommandShop();
    }

    removeCommandByType(type) {
        const index = this.playerCommands.indexOf(type);
        if (index > -1) {
            this.removeCommand(index);
        }
    }

    clearAll() {
        if (confirm('Remove all units and commands?')) {
            this.remainingPoints = this.STARTING_POINTS;
            this.playerUnits = [];
            this.playerCommands = [];
            this.updateInvasionMenuUI();
            this.showUnitShop();
            this.showCommandShop();
        }
    }

    // ===== FORMATION EDITOR =====

    showFormationEditor() {
        if (this.playerUnits.length === 0) {
            alert('Add some units first!');
            return;
        }

        // Keep invasion-active class
        const appDiv = document.getElementById('app');
        if (appDiv) {
            appDiv.classList.add('invasion-active');
        }

        this.game.showScreen('invasion-formation-screen');
        this.renderFormationEditor();
    }

    renderFormationEditor() {
        const boardEl = document.getElementById('invasion-formation-board');
        if (!boardEl) return;

        let html = '<div class="formation-grid">';

        // Render rows 0-2 (player placement area)
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 20; col++) {
                const unit = this.playerFormation[row][col];
                html += `
                    <div class="formation-cell"
                         data-row="${row}"
                         data-col="${col}"
                         onclick="game.invasionSystem.handleFormationCellClick(${row}, ${col})">
                        ${unit ? this.unitTypes[unit.type].icon : ''}
                    </div>
                `;
            }
        }

        html += '</div>';

        // Unit placement list
        html += '<div class="formation-units"><h4>Units to Place:</h4>';
        const placedCount = this.getPlacedUnitsCount();
        const unplacedUnits = this.playerUnits.slice(placedCount);

        if (unplacedUnits.length === 0) {
            html += '<p class="text-success">All units placed!</p>';
        } else {
            html += unplacedUnits.map(unit => `
                <div class="formation-unit-item">
                    <span>${this.unitTypes[unit.type].icon}</span>
                    <span>${this.unitTypes[unit.type].name}</span>
                </div>
            `).join('');
        }
        html += '</div>';

        boardEl.innerHTML = html;
    }

    getPlacedUnitsCount() {
        let count = 0;
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 20; col++) {
                if (this.playerFormation[row][col]) count++;
            }
        }
        return count;
    }

    handleFormationCellClick(row, col) {
        const cell = this.playerFormation[row][col];

        if (cell) {
            // Remove unit from this cell
            this.playerFormation[row][col] = null;
        } else {
            // Place next unplaced unit
            const placedCount = this.getPlacedUnitsCount();
            if (placedCount < this.playerUnits.length) {
                this.playerFormation[row][col] = this.playerUnits[placedCount];
            }
        }

        this.renderFormationEditor();
    }

    clearFormation() {
        this.playerFormation = this.createEmptyFormation();
        this.renderFormationEditor();
    }

    // ===== MATCHMAKING =====

    showMatchmaking() {
        // Validate setup
        if (this.playerUnits.length === 0) {
            alert('You need to select at least one unit!');
            return;
        }

        const placedCount = this.getPlacedUnitsCount();
        if (placedCount < this.playerUnits.length) {
            alert('You need to place all your units in the formation editor!');
            return;
        }

        // Keep invasion-active class
        const appDiv = document.getElementById('app');
        if (appDiv) {
            appDiv.classList.add('invasion-active');
        }

        this.game.showScreen('invasion-matchmaking-screen');
        this.startMatchmaking();
    }

    async startMatchmaking() {
        const statusEl = document.getElementById('invasion-matchmaking-status');
        if (statusEl) {
            statusEl.textContent = 'Searching for opponent...';
        }

        // TODO: Implement Firebase matchmaking
        // For now, just simulate finding a match after 3 seconds
        setTimeout(() => {
            this.foundMatch('AI Opponent');
        }, 3000);
    }

    foundMatch(opponentName) {
        const statusEl = document.getElementById('invasion-matchmaking-status');
        if (statusEl) {
            statusEl.textContent = `Match found! Opponent: ${opponentName}`;
        }

        setTimeout(() => {
            this.startGame(opponentName);
        }, 2000);
    }

    cancelMatchmaking() {
        this.showInvasionMenu();
    }

    // Exit Invasion mode and return to main menu
    exitInvasionMode() {
        // Remove invasion-active class to restore app padding
        const appDiv = document.getElementById('app');
        if (appDiv) {
            appDiv.classList.remove('invasion-active');
        }

        this.game.showMainMenu();
    }

    // ===== GAME LOGIC =====

    startGame(opponentName) {
        // Keep invasion-active class
        const appDiv = document.getElementById('app');
        if (appDiv) {
            appDiv.classList.add('invasion-active');
        }

        // Initialize game state
        this.currentGame = {
            board: this.createGameBoard(),
            playerUnits: this.initializePlayerUnits(),
            enemyUnits: this.initializeEnemyUnits(),
            obstacles: this.generateObstacles(),
            turn: 1,
            currentPlayer: 'player',
            commandPoints: this.STARTING_COMMAND_POINTS,
            commandCooldowns: this.initializeCommandCooldowns(),
            opponentName: opponentName
        };

        this.isPlayerTurn = true;
        this.currentPhase = 'selection';
        this.selectedUnit = null;
        this.actionCount = 0;

        this.game.showScreen('invasion-game-screen');
        this.renderGameBoard();
        this.updateGameUI();
    }

    createGameBoard() {
        const board = [];
        for (let row = 0; row < this.BOARD_SIZE; row++) {
            board[row] = [];
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                board[row][col] = { type: 'empty', unit: null, obstacle: false };
            }
        }
        return board;
    }

    initializePlayerUnits() {
        const units = [];
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 20; col++) {
                const formationUnit = this.playerFormation[row][col];
                if (formationUnit) {
                    const unitType = this.unitTypes[formationUnit.type];
                    units.push({
                        id: formationUnit.id,
                        type: formationUnit.type,
                        owner: 'player',
                        row: row,
                        col: col,
                        currentHealth: unitType.health,
                        maxHealth: unitType.health,
                        damage: unitType.damage,
                        movement: unitType.movement,
                        range: unitType.range,
                        hasMoved: false,
                        buffs: {}
                    });
                }
            }
        }
        return units;
    }

    initializeEnemyUnits() {
        // Generate random AI army with 1000 points budget
        const aiUnits = [];
        let remainingPoints = this.STARTING_POINTS;

        // AI unit selection strategy: random but balanced
        const unitKeys = Object.keys(this.unitTypes);

        while (remainingPoints > 0 && aiUnits.length < this.MAX_UNITS) {
            const randomType = unitKeys[Math.floor(Math.random() * unitKeys.length)];
            const unitCost = this.unitTypes[randomType].cost;

            if (unitCost <= remainingPoints) {
                aiUnits.push({
                    type: randomType,
                    id: `ai-${Date.now()}-${Math.random()}`
                });
                remainingPoints -= unitCost;
            }

            // Prevent infinite loop if can't afford any units
            if (remainingPoints < 25) break;
        }

        // Place AI units in enemy territory (rows 17-19, bottom 3 rows)
        const placedUnits = [];
        let unitIndex = 0;

        for (let row = 17; row < 20 && unitIndex < aiUnits.length; row++) {
            for (let col = 0; col < 20 && unitIndex < aiUnits.length; col++) {
                const aiUnit = aiUnits[unitIndex];
                const unitType = this.unitTypes[aiUnit.type];

                placedUnits.push({
                    id: aiUnit.id,
                    type: aiUnit.type,
                    owner: 'enemy',
                    row: row,
                    col: col,
                    currentHealth: unitType.health,
                    maxHealth: unitType.health,
                    damage: unitType.damage,
                    movement: unitType.movement,
                    range: unitType.range,
                    hasMoved: false,
                    buffs: {}
                });

                unitIndex++;
            }
        }

        return placedUnits;
    }

    generateObstacles() {
        const obstacles = [];
        const obstacleCount = Math.floor(Math.random() * 3) + 1; // 1-3 obstacles

        for (let i = 0; i < obstacleCount; i++) {
            obstacles.push(this.generateRandomObstacle());
        }

        return obstacles;
    }

    generateRandomObstacle() {
        // Random position between rows 6-14
        const row = Math.floor(Math.random() * 9) + 6;
        const col = Math.floor(Math.random() * 18);

        // Random shape
        const shapes = [
            { width: 1, height: 1 },
            { width: 2, height: 2 },
            { width: 2, height: 1 },
            { width: 1, height: 2 },
            { width: 3, height: 1 },
            { width: 1, height: 3 },
            { width: 4, height: 1 },
            { width: 1, height: 4 }
        ];

        const shape = shapes[Math.floor(Math.random() * shapes.length)];

        return { row, col, width: shape.width, height: shape.height };
    }

    initializeCommandCooldowns() {
        return this.playerCommands.map(cmd => ({
            type: cmd,
            remaining: 0
        }));
    }

    renderGameBoard() {
        const boardEl = document.getElementById('invasion-game-board');
        if (!boardEl) return;

        // Place units on board
        this.currentGame.board.forEach(row => row.forEach(cell => cell.unit = null));

        this.currentGame.playerUnits.forEach(unit => {
            if (unit.row >= 0 && unit.row < this.BOARD_SIZE && unit.col >= 0 && unit.col < this.BOARD_SIZE) {
                this.currentGame.board[unit.row][unit.col].unit = unit;
            }
        });

        this.currentGame.enemyUnits.forEach(unit => {
            if (unit.row >= 0 && unit.row < this.BOARD_SIZE && unit.col >= 0 && unit.col < this.BOARD_SIZE) {
                this.currentGame.board[unit.row][unit.col].unit = unit;
            }
        });

        // Place obstacles
        this.currentGame.obstacles.forEach(obstacle => {
            for (let r = 0; r < obstacle.height; r++) {
                for (let c = 0; c < obstacle.width; c++) {
                    const row = obstacle.row + r;
                    const col = obstacle.col + c;
                    if (row >= 0 && row < this.BOARD_SIZE && col >= 0 && col < this.BOARD_SIZE) {
                        this.currentGame.board[row][col].obstacle = true;
                    }
                }
            }
        });

        // Get valid moves and attacks for selected unit
        let validMoves = [];
        let validAttacks = [];
        if (this.selectedUnit) {
            validMoves = this.getValidMovementTiles(this.selectedUnit);
            validAttacks = this.getValidAttackTargets(this.selectedUnit);
        }

        // Render board with chess-style alternating colors
        let html = '';

        for (let row = 0; row < this.BOARD_SIZE; row++) {
            for (let col = 0; col < this.BOARD_SIZE; col++) {
                const cell = this.currentGame.board[row][col];
                const isSelected = this.selectedUnit && this.selectedUnit.row === row && this.selectedUnit.col === col;
                const isValidMove = validMoves.some(m => m.row === row && m.col === col);
                const isValidAttack = validAttacks.some(a => a.row === row && a.col === col);

                // Chess-style alternating colors
                const isLight = (row + col) % 2 === 0;
                let cellClass = `invasion-board-cell ${isLight ? 'light' : 'dark'}`;

                if (cell.obstacle) cellClass += ' obstacle';
                if (cell.unit) {
                    cellClass += cell.unit.owner === 'player' ? ' player-unit' : ' enemy-unit';
                }
                if (isSelected) cellClass += ' selected';
                if (isValidMove) cellClass += ' moveable';
                if (isValidAttack) cellClass += ' attackable';

                html += `
                    <div class="${cellClass}"
                         data-row="${row}"
                         data-col="${col}"
                         onclick="game.invasionSystem.handleCellClick(${row}, ${col})">
                        ${cell.obstacle ? '🪨' : (cell.unit ? this.unitTypes[cell.unit.type].icon : '')}
                        ${cell.unit ? `<div class="unit-health-bar"><div class="health-bar-fill" style="width: ${(cell.unit.currentHealth / cell.unit.maxHealth) * 100}%"></div></div>` : ''}
                    </div>
                `;
            }
        }

        boardEl.innerHTML = html;
    }

    updateGameUI() {
        // Update turn counter, command points, etc.
        const turnEl = document.getElementById('invasion-turn-counter');
        const cpEl = document.getElementById('invasion-command-points');
        const playerUnitsEl = document.getElementById('invasion-player-units');
        const opponentUnitsEl = document.getElementById('invasion-opponent-units');
        const opponentNameEl = document.getElementById('invasion-opponent-name');

        if (turnEl && this.currentGame) {
            turnEl.textContent = this.currentGame.turn;
        }

        if (cpEl && this.currentGame) {
            cpEl.textContent = this.currentGame.commandPoints;
        }

        if (playerUnitsEl && this.currentGame) {
            const alivePlayer = this.currentGame.playerUnits.filter(u => u.currentHealth > 0).length;
            playerUnitsEl.textContent = alivePlayer;
        }

        if (opponentUnitsEl && this.currentGame) {
            const aliveEnemy = this.currentGame.enemyUnits.filter(u => u.currentHealth > 0).length;
            opponentUnitsEl.textContent = `${aliveEnemy} units`;
        }

        if (opponentNameEl && this.currentGame) {
            opponentNameEl.textContent = this.currentGame.opponentName;
        }

        // Render command buttons
        this.renderCommands();

        // Add initial battle log message
        if (this.currentGame.turn === 1 && !this.hasLoggedStart) {
            this.addBattleLog('Battle started! Your turn.');
            this.hasLoggedStart = true;
        }
    }

    renderCommands() {
        const commandsEl = document.getElementById('invasion-commands-list');
        if (!commandsEl) return;

        if (this.playerCommands.length === 0) {
            commandsEl.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center;">No commands selected</p>';
            return;
        }

        commandsEl.innerHTML = this.playerCommands.map(cmdType => {
            const cmd = this.commandTypes[cmdType];
            const cooldown = this.currentGame?.commandCooldowns.find(c => c.type === cmdType);
            const isReady = !cooldown || cooldown.remaining === 0;
            const hasCP = this.currentGame?.commandPoints >= cmd.cost;
            const canUse = isReady && hasCP;

            return `
                <div class="invasion-command-btn ${canUse ? '' : 'disabled'}">
                    <div class="command-icon">${cmd.icon}</div>
                    <div class="command-details">
                        <div class="command-name">${cmd.name}</div>
                        <div class="command-cooldown">
                            ${!isReady ? `Cooldown: ${cooldown.remaining}` : `CP: ${cmd.cost}`}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    addBattleLog(message) {
        const logEl = document.getElementById('invasion-battle-log');
        if (!logEl) return;

        const entry = document.createElement('div');
        entry.className = 'battle-log-entry';
        entry.textContent = message;
        logEl.appendChild(entry);
        logEl.scrollTop = logEl.scrollHeight;
    }

    // ===== MOVEMENT & PATHFINDING =====

    // Calculate all valid movement tiles for a unit using BFS
    getValidMovementTiles(unit) {
        if (!unit || unit.hasMoved) return [];

        const validTiles = [];
        const visited = new Set();
        const queue = [{ row: unit.row, col: unit.col, distance: 0 }];
        visited.add(`${unit.row},${unit.col}`);

        while (queue.length > 0) {
            const current = queue.shift();

            // If we've reached movement limit, skip
            if (current.distance >= unit.movement) continue;

            // Check all 4 adjacent cells
            const directions = [
                { row: -1, col: 0 }, // up
                { row: 1, col: 0 },  // down
                { row: 0, col: -1 }, // left
                { row: 0, col: 1 }   // right
            ];

            for (const dir of directions) {
                const newRow = current.row + dir.row;
                const newCol = current.col + dir.col;
                const key = `${newRow},${newCol}`;

                // Check bounds
                if (newRow < 0 || newRow >= this.BOARD_SIZE || newCol < 0 || newCol >= this.BOARD_SIZE) {
                    continue;
                }

                // Skip if already visited
                if (visited.has(key)) continue;

                const cell = this.currentGame.board[newRow][newCol];

                // Skip obstacles and occupied cells
                if (cell.obstacle || cell.unit) continue;

                visited.add(key);
                validTiles.push({ row: newRow, col: newCol, distance: current.distance + 1 });
                queue.push({ row: newRow, col: newCol, distance: current.distance + 1 });
            }
        }

        return validTiles;
    }

    // Get all valid attack targets for a unit
    getValidAttackTargets(unit) {
        if (!unit || unit.hasAttacked) return [];

        const targets = [];

        for (const enemy of this.currentGame.enemyUnits) {
            if (enemy.currentHealth <= 0) continue;

            const distance = Math.abs(unit.row - enemy.row) + Math.abs(unit.col - enemy.col);
            if (distance <= unit.range) {
                targets.push({ row: enemy.row, col: enemy.col, unit: enemy });
            }
        }

        return targets;
    }

    // Move unit to new position
    moveUnit(unit, targetRow, targetCol) {
        // Clear old position
        this.currentGame.board[unit.row][unit.col].unit = null;

        // Update unit position
        unit.row = targetRow;
        unit.col = targetCol;
        unit.hasMoved = true;

        // Set new position
        this.currentGame.board[targetRow][targetCol].unit = unit;

        this.addBattleLog(`${this.unitTypes[unit.type].name} moved to (${targetRow}, ${targetCol})`);
    }

    // Handle cell click with movement and attack system
    handleCellClick(row, col) {
        if (!this.currentGame || !this.isPlayerTurn) return;

        const cell = this.currentGame.board[row][col];

        if (this.selectedUnit) {
            // Unit is selected, try to move or attack
            if (cell.unit) {
                if (cell.unit.owner === 'enemy') {
                    // Check if in attack range
                    const attackTargets = this.getValidAttackTargets(this.selectedUnit);
                    const isValidTarget = attackTargets.some(t => t.row === row && t.col === col);

                    if (isValidTarget) {
                        this.attackUnit(this.selectedUnit, cell.unit);
                        this.selectedUnit = null;
                        this.renderGameBoard();
                    } else {
                        this.addBattleLog(`Target out of range! Range: ${this.selectedUnit.range}`);
                    }
                } else {
                    // Select different player unit
                    this.selectedUnit = cell.unit;
                    this.renderGameBoard();
                }
            } else if (!cell.obstacle) {
                // Check if valid movement tile
                const validMoves = this.getValidMovementTiles(this.selectedUnit);
                const isValidMove = validMoves.some(t => t.row === row && t.col === col);

                if (isValidMove) {
                    this.moveUnit(this.selectedUnit, row, col);
                    this.selectedUnit = null;
                    this.renderGameBoard();
                } else {
                    this.addBattleLog('Invalid move! Too far or blocked.');
                }
            }
        } else {
            // Select unit
            if (cell.unit && cell.unit.owner === 'player' && cell.unit.currentHealth > 0) {
                this.selectedUnit = cell.unit;
                this.renderGameBoard();
                this.addBattleLog(`Selected ${this.unitTypes[cell.unit.type].name} - Movement: ${cell.unit.movement}, Range: ${cell.unit.range}`);
            }
        }
    }

    // Attack enemy unit
    attackUnit(attacker, defender) {
        const damage = attacker.damage;
        defender.currentHealth = Math.max(0, defender.currentHealth - damage);

        attacker.hasAttacked = true;

        this.addBattleLog(`${this.unitTypes[attacker.type].name} dealt ${damage} damage to ${this.unitTypes[defender.type].name}`);

        if (defender.currentHealth === 0) {
            this.addBattleLog(`${this.unitTypes[defender.type].name} was defeated!`);
            // Grant command points for kill
            this.currentGame.commandPoints = Math.min(100, this.currentGame.commandPoints + 10);
        }

        this.updateGameUI();
        this.checkWinCondition();
    }

    // Check win/loss conditions
    checkWinCondition() {
        const alivePlayer = this.currentGame.playerUnits.filter(u => u.currentHealth > 0).length;
        const aliveEnemy = this.currentGame.enemyUnits.filter(u => u.currentHealth > 0).length;

        if (alivePlayer === 0) {
            this.addBattleLog('DEFEAT! All your units have been destroyed.');
            setTimeout(() => {
                alert('You lost the battle!');
                this.exitInvasionMode();
            }, 2000);
        } else if (aliveEnemy === 0) {
            this.addBattleLog('VICTORY! All enemy units have been destroyed.');
            setTimeout(() => {
                alert('You won the battle!');
                this.exitInvasionMode();
            }, 2000);
        }
    }

    // Reset unit action flags for new turn
    resetUnitActions() {
        this.currentGame.playerUnits.forEach(unit => {
            unit.hasMoved = false;
            unit.hasAttacked = false;
        });

        this.currentGame.enemyUnits.forEach(unit => {
            unit.hasMoved = false;
            unit.hasAttacked = false;
        });

        // Decrease command cooldowns
        this.currentGame.commandCooldowns.forEach(cd => {
            if (cd.remaining > 0) cd.remaining--;
        });
    }

    endTurn() {
        if (!this.currentGame || !this.isPlayerTurn) return;

        this.currentGame.turn++;
        this.isPlayerTurn = false;
        this.selectedUnit = null;

        this.addBattleLog('Turn ended. AI is thinking...');
        this.updateGameUI();
        this.renderGameBoard();

        // AI turn simulation
        setTimeout(() => {
            this.addBattleLog('AI turn complete.');
            this.isPlayerTurn = true;

            // Reset unit actions for new turn
            this.resetUnitActions();

            // Restore some command points
            this.currentGame.commandPoints = Math.min(100, this.currentGame.commandPoints + 10);

            this.updateGameUI();
            this.renderGameBoard();
        }, 1500);
    }

    forfeit() {
        if (confirm('Are you sure you want to forfeit?')) {
            this.addBattleLog('You forfeited the match.');
            setTimeout(() => {
                this.exitInvasionMode();
            }, 1000);
        }
    }
}