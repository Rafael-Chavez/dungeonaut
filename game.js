// ===== GAME STATE MANAGEMENT =====
class DungeonAutGame {
    constructor() {
        this.initializeState();
        this.loadFromStorage();
        this.updateUI();
        this.pvpSystem = new PvPSystem(this);
        this.pvpStats = {
            strength: 0,
            vitality: 0,
            agility: 0,
            luck: 0
        };
        this.pvpSelectedSkills = [];
        this.selectedPvPAction = null;

        // Loadout system
        this.pvpLoadouts = this.loadPvPLoadouts();

        // Arena stats tracking
        this.arenaStats = this.loadArenaStats();

        // Achievement system
        this.achievements = this.loadAchievements();

        // Initialize authentication system
        this.authSystem = new AuthSystem(this);
        this.authSystem.initFirebase();

        // Initialize admin system
        this.adminSystem = new AdminSystem(this);
        window.adminSystem = this.adminSystem; // Global reference for onclick handlers
    }

    initializeState() {
        this.state = {
            playerName: 'Player',
            stamina: 5,
            maxStamina: 5,
            lastStaminaReset: this.getTodayString(),

            // Planning state
            stats: {
                strength: 3,
                vitality: 3,
                agility: 2,
                luck: 2
            },
            totalStatPoints: 10,
            selectedGear: {
                weapon: null,
                armor: null,
                accessory: null
            },
            selectedSkills: [],

            // Run state
            currentRun: null,
            runTimer: 0,

            // Leaderboards
            leaderboards: {
                daily: [],
                weekly: [],
                alltime: []
            },

            currentLeaderboard: 'daily'
        };

        this.runInterval = null;
    }

    // ===== DAILY SEED SYSTEM =====
    getTodayString() {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    getDailySeed() {
        const today = this.getTodayString();
        let hash = 0;
        for (let i = 0; i < today.length; i++) {
            const char = today.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    // Seeded random number generator
    seededRandom(seed) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    // ===== STAMINA SYSTEM =====
    checkStaminaReset() {
        const today = this.getTodayString();
        if (this.state.lastStaminaReset !== today) {
            this.state.stamina = this.state.maxStamina;
            this.state.lastStaminaReset = today;
            this.saveToStorage();
        }
    }

    consumeStamina() {
        if (this.state.stamina > 0) {
            this.state.stamina--;
            this.saveToStorage();
            return true;
        }
        return false;
    }

    // ===== STORAGE =====
    saveToStorage() {
        localStorage.setItem('dungeonaut_save', JSON.stringify(this.state));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('dungeonaut_save');
        if (saved) {
            try {
                const loadedState = JSON.parse(saved);
                this.state = { ...this.state, ...loadedState };
                this.checkStaminaReset();
            } catch (e) {
                console.error('Failed to load save:', e);
            }
        }
    }

    // ===== SCREEN MANAGEMENT =====
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }

    showMainMenu() {
        this.showScreen('menu-screen');
        this.updateUI();
    }

    showPlanningScreen() {
        this.checkStaminaReset();
        if (this.state.stamina <= 0) {
            alert('No stamina remaining! Come back tomorrow for a fresh daily dungeon.');
            return;
        }
        this.showScreen('planning-screen');
        this.renderGearSelection();
        this.renderSkillSelection();
        this.updatePlanningUI();
    }

    showLeaderboard() {
        this.showScreen('leaderboard-screen');
        this.renderLeaderboard();
    }

    showGhostStats() {
        this.showScreen('ghost-screen');
        this.renderGhostStats();
    }

    // ===== AUTHENTICATION METHODS =====
    switchAuthTab(tab) {
        // Toggle forms
        document.querySelectorAll('.auth-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });

        if (tab === 'login') {
            document.querySelector('.auth-tab:first-child').classList.add('active');
            document.getElementById('login-form').classList.add('active');
        } else {
            document.querySelector('.auth-tab:last-child').classList.add('active');
            document.getElementById('register-form').classList.add('active');
        }
    }

    async handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        const success = await this.authSystem.login(email, password);
        if (success) {
            this.showMainMenu();
        }
    }

    async handleRegister() {
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-password-confirm').value;

        if (!username || !email || !password || !confirmPassword) {
            alert('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }

        const success = await this.authSystem.register(email, password, username);
        if (success) {
            this.showMainMenu();
        }
    }

    // ===== STAT ALLOCATION =====
    adjustStat(statName, delta) {
        const newValue = this.state.stats[statName] + delta;
        const currentTotal = Object.values(this.state.stats).reduce((a, b) => a + b, 0);
        const newTotal = currentTotal + delta;

        if (newValue >= 0 && newTotal <= this.state.totalStatPoints) {
            this.state.stats[statName] = newValue;
            this.updatePlanningUI();
        }
    }

    updatePlanningUI() {
        // Update stat displays
        Object.keys(this.state.stats).forEach(stat => {
            const elem = document.getElementById(`stat-${stat}`);
            if (elem) elem.textContent = this.state.stats[stat];
        });

        // Update points remaining
        const currentTotal = Object.values(this.state.stats).reduce((a, b) => a + b, 0);
        const remaining = this.state.totalStatPoints - currentTotal;
        document.getElementById('points-remaining').textContent = remaining;

        // Enable/disable start button
        const startBtn = document.getElementById('start-run-btn');
        const hasWeapon = this.state.selectedGear.weapon !== null;
        const hasSkills = this.state.selectedSkills.length === 3;
        const validStats = remaining === 0;

        startBtn.disabled = !(hasWeapon && hasSkills && validStats);
    }

    // ===== GEAR SYSTEM =====
    getAvailableGear() {
        return {
            weapons: [
                { id: 'sword', name: 'Iron Sword', damage: 15, durability: 100, icon: '⚔️' },
                { id: 'axe', name: 'Battle Axe', damage: 20, durability: 80, icon: '🪓' },
                { id: 'dagger', name: 'Quick Dagger', damage: 10, durability: 120, attackSpeed: 1.5, icon: '🗡️' }
            ],
            armor: [
                { id: 'plate', name: 'Plate Armor', defense: 20, durability: 150, icon: '🛡️' },
                { id: 'leather', name: 'Leather Armor', defense: 10, durability: 100, speed: 1.2, icon: '🧥' },
                { id: 'robe', name: 'Magic Robe', defense: 5, durability: 80, cooldownReduction: 0.1, icon: '👘' }
            ],
            accessories: [
                { id: 'ring_str', name: 'Ring of Strength', damage: 5, durability: 50, icon: '💍' },
                { id: 'ring_vit', name: 'Ring of Vitality', hp: 20, durability: 50, icon: '💍' },
                { id: 'amulet', name: 'Speed Amulet', speed: 1.3, durability: 60, icon: '📿' }
            ]
        };
    }

    selectGear(slot, gearId) {
        const gear = this.getAvailableGear();
        const slotMap = {
            weapon: gear.weapons,
            armor: gear.armor,
            accessory: gear.accessories
        };

        const selected = slotMap[slot].find(g => g.id === gearId);
        this.state.selectedGear[slot] = selected;
        this.renderGearSelection();
        this.updatePlanningUI();
    }

    renderGearSelection() {
        const container = document.getElementById('gear-selection');
        const gear = this.getAvailableGear();

        let html = '';

        // Weapons
        html += '<div class="gear-section"><h4>Weapon (Required)</h4>';
        gear.weapons.forEach(item => {
            const selected = this.state.selectedGear.weapon?.id === item.id ? 'selected' : '';
            html += `
                <div class="gear-item ${selected}" onclick="game.selectGear('weapon', '${item.id}')">
                    <div class="gear-name">${item.icon} ${item.name}</div>
                    <div class="gear-stats">DMG: ${item.damage}</div>
                    <div class="gear-durability">Durability: ${item.durability}</div>
                </div>
            `;
        });
        html += '</div>';

        // Armor (optional)
        html += '<div class="gear-section"><h4>Armor (Optional)</h4>';
        gear.armor.forEach(item => {
            const selected = this.state.selectedGear.armor?.id === item.id ? 'selected' : '';
            html += `
                <div class="gear-item ${selected}" onclick="game.selectGear('armor', '${item.id}')">
                    <div class="gear-name">${item.icon} ${item.name}</div>
                    <div class="gear-stats">DEF: ${item.defense}</div>
                    <div class="gear-durability">Durability: ${item.durability}</div>
                </div>
            `;
        });
        html += '</div>';

        // Accessories (optional)
        html += '<div class="gear-section"><h4>Accessory (Optional)</h4>';
        gear.accessories.forEach(item => {
            const selected = this.state.selectedGear.accessory?.id === item.id ? 'selected' : '';
            html += `
                <div class="gear-item ${selected}" onclick="game.selectGear('accessory', '${item.id}')">
                    <div class="gear-name">${item.icon} ${item.name}</div>
                    <div class="gear-stats">${item.damage ? 'DMG: +' + item.damage : item.hp ? 'HP: +' + item.hp : 'SPD: +' + Math.round((item.speed - 1) * 100) + '%'}</div>
                    <div class="gear-durability">Durability: ${item.durability}</div>
                </div>
            `;
        });
        html += '</div>';

        container.innerHTML = html;
    }

    // ===== SKILL SYSTEM =====
    getAvailableSkills() {
        return [
            { id: 'slash', name: '⚔️ Power Slash', desc: 'Heavy damage attack', cooldown: 5, damage: 30 },
            { id: 'heal', name: '💚 Healing Touch', desc: 'Restore 25 HP', cooldown: 8, heal: 25 },
            { id: 'haste', name: '⚡ Haste', desc: 'Increase attack speed', cooldown: 10, duration: 5 },
            { id: 'shield', name: '🛡️ Shield Block', desc: 'Reduce damage taken', cooldown: 7, duration: 3 },
            { id: 'critical', name: '💥 Critical Strike', desc: 'Guaranteed critical hit', cooldown: 12, critMultiplier: 3 },
            { id: 'drain', name: '🧛 Life Drain', desc: 'Deal damage and heal', cooldown: 9, damage: 20, heal: 15 }
        ];
    }

    toggleSkill(skillId) {
        const index = this.state.selectedSkills.findIndex(s => s.id === skillId);

        if (index >= 0) {
            // Deselect
            this.state.selectedSkills.splice(index, 1);
        } else {
            // Select (max 3)
            if (this.state.selectedSkills.length < 3) {
                const skill = this.getAvailableSkills().find(s => s.id === skillId);
                this.state.selectedSkills.push(skill);
            }
        }

        this.renderSkillSelection();
        this.updatePlanningUI();
    }

    renderSkillSelection() {
        const container = document.getElementById('skill-selection');
        const skills = this.getAvailableSkills();

        let html = '';
        skills.forEach(skill => {
            const selected = this.state.selectedSkills.find(s => s.id === skill.id) ? 'selected' : '';
            const disabled = !selected && this.state.selectedSkills.length >= 3 ? 'disabled' : '';

            html += `
                <div class="skill-item ${selected} ${disabled}" onclick="game.toggleSkill('${skill.id}')">
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-desc">${skill.desc}</div>
                    <div class="skill-cooldown">Cooldown: ${skill.cooldown}s</div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // ===== DUNGEON GENERATION =====
    generateDungeon() {
        const seed = this.getDailySeed();
        const rooms = [];
        const totalRooms = 10; // MVP: 10 rooms including boss

        for (let i = 0; i < totalRooms; i++) {
            const roomSeed = seed + i;
            const rand = this.seededRandom(roomSeed);

            if (i === totalRooms - 1) {
                // Boss room
                rooms.push({
                    id: i,
                    type: 'boss',
                    title: '👹 Boss Chamber',
                    enemies: [
                        { id: 0, name: 'Dungeon Lord', hp: 150, maxHp: 150, damage: 15, isBoss: true }
                    ],
                    timeMultiplier: 1.0
                });
            } else if (rand < 0.6) {
                // Combat room
                const enemyCount = Math.floor(this.seededRandom(roomSeed + 1) * 3) + 2;
                const enemies = [];
                for (let e = 0; e < enemyCount; e++) {
                    const enemyHp = 30 + Math.floor(this.seededRandom(roomSeed + e + 10) * 30);
                    enemies.push({
                        id: e,
                        name: this.getRandomEnemyName(roomSeed + e),
                        hp: enemyHp,
                        maxHp: enemyHp,
                        damage: 5 + Math.floor(this.seededRandom(roomSeed + e + 20) * 5)
                    });
                }
                rooms.push({
                    id: i,
                    type: 'combat',
                    title: '⚔️ Combat Room',
                    enemies: enemies,
                    timeMultiplier: 1.0
                });
            } else if (rand < 0.8) {
                // Trap room
                rooms.push({
                    id: i,
                    type: 'trap',
                    title: '💀 Trap Room',
                    damage: 20,
                    timeMultiplier: 0.5
                });
            } else {
                // Shrine room
                rooms.push({
                    id: i,
                    type: 'shrine',
                    title: '✨ Shrine',
                    buff: this.getRandomBuff(roomSeed),
                    timeMultiplier: 0.3
                });
            }
        }

        return rooms;
    }

    getRandomEnemyName(seed) {
        const names = ['Goblin', 'Skeleton', 'Orc', 'Wraith', 'Bandit', 'Wolf', 'Spider', 'Zombie'];
        const index = Math.floor(this.seededRandom(seed) * names.length);
        return names[index];
    }

    getRandomBuff(seed) {
        const buffs = [
            { type: 'damage', value: 5, name: 'Strength Blessing' },
            { type: 'defense', value: 5, name: 'Protection Blessing' },
            { type: 'speed', value: 1.2, name: 'Haste Blessing' },
            { type: 'heal', value: 30, name: 'Healing Spring' }
        ];
        const index = Math.floor(this.seededRandom(seed) * buffs.length);
        return buffs[index];
    }

    getDailyModifier() {
        const seed = this.getDailySeed();
        const modifiers = [
            { name: 'Swift Enemies', desc: 'Enemies attack 30% faster', effect: 'enemy_speed', value: 1.3 },
            { name: 'Reduced Cooldowns', desc: 'All cooldowns -20%', effect: 'cooldown_reduction', value: 0.8 },
            { name: 'Fragile Gear', desc: 'Gear loses durability 50% faster', effect: 'durability_loss', value: 1.5 },
            { name: 'Lucky Day', desc: 'Critical chance +15%', effect: 'crit_bonus', value: 0.15 },
            { name: 'Tough Monsters', desc: 'Enemies have +40% HP', effect: 'enemy_hp', value: 1.4 }
        ];

        const index = Math.floor(this.seededRandom(seed + 1000) * modifiers.length);
        return modifiers[index];
    }

    // ===== RUN MANAGEMENT =====
    startRun() {
        if (!this.consumeStamina()) {
            alert('No stamina remaining!');
            return;
        }

        const modifier = this.getDailyModifier();

        this.state.currentRun = {
            dungeon: this.generateDungeon(),
            currentRoomIndex: 0,
            player: {
                hp: 100 + (this.state.stats.vitality * 10),
                maxHp: 100 + (this.state.stats.vitality * 10),
                damage: 10 + (this.state.stats.strength * 3),
                defense: this.state.selectedGear.armor?.defense || 0,
                speed: 1.0,
                critChance: 0.1 + (this.state.stats.luck * 0.05)
            },
            gear: JSON.parse(JSON.stringify(this.state.selectedGear)), // Deep copy
            skills: this.state.selectedSkills.map(s => ({
                ...s,
                currentCooldown: 0
            })),
            stats: {
                startTime: Date.now(),
                baseTime: 0,
                combatTime: 0,
                deaths: 0,
                perfectClears: 0,
                gearBreaks: 0,
                roomTimes: [],
                skillUsage: []
            },
            modifier: modifier,
            buffs: []
        };

        // Apply modifier effects
        if (modifier.effect === 'enemy_hp') {
            this.state.currentRun.dungeon.forEach(room => {
                if (room.enemies) {
                    room.enemies.forEach(enemy => {
                        enemy.hp = Math.floor(enemy.hp * modifier.value);
                        enemy.maxHp = Math.floor(enemy.maxHp * modifier.value);
                    });
                }
            });
        } else if (modifier.effect === 'crit_bonus') {
            this.state.currentRun.player.critChance += modifier.value;
        }

        this.showScreen('dungeon-screen');
        this.startRunTimer();
        this.enterRoom();
    }

    startRunTimer() {
        this.runInterval = setInterval(() => {
            const elapsed = Date.now() - this.state.currentRun.stats.startTime;
            this.updateTimerDisplay(elapsed);
        }, 100);
    }

    stopRunTimer() {
        if (this.runInterval) {
            clearInterval(this.runInterval);
            this.runInterval = null;
        }
    }

    updateTimerDisplay(ms) {
        const seconds = ms / 1000;
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(1);
        document.getElementById('run-timer').textContent =
            `${String(mins).padStart(2, '0')}:${String(Math.floor(secs)).padStart(2, '0')}.${Math.floor((secs % 1) * 10)}`;
    }

    enterRoom() {
        const run = this.state.currentRun;
        const room = run.dungeon[run.currentRoomIndex];
        const roomStartTime = Date.now();

        document.getElementById('room-counter').textContent = `${run.currentRoomIndex + 1}/${run.dungeon.length}`;
        document.getElementById('room-title').textContent = room.title;

        // Clear combat log
        document.getElementById('combat-log').innerHTML = '';

        if (room.type === 'combat' || room.type === 'boss') {
            this.startCombat(room, roomStartTime);
        } else if (room.type === 'trap') {
            this.handleTrapRoom(room, roomStartTime);
        } else if (room.type === 'shrine') {
            this.handleShrineRoom(room, roomStartTime);
        }

        this.updatePlayerHUD();
        this.renderSkillsBar();
    }

    // ===== COMBAT SYSTEM =====
    startCombat(room, roomStartTime) {
        const container = document.getElementById('room-content');
        container.innerHTML = '<div class="enemy-list" id="enemy-list"></div>';
        this.renderEnemies(room.enemies);

        // Auto-battle loop
        const combatInterval = setInterval(() => {
            const run = this.state.currentRun;
            const aliveEnemies = room.enemies.filter(e => e.hp > 0);

            if (aliveEnemies.length === 0) {
                // Combat won
                clearInterval(combatInterval);
                const roomTime = (Date.now() - roomStartTime) / 1000;
                run.stats.roomTimes.push({ room: run.currentRoomIndex, time: roomTime });
                run.stats.combatTime += roomTime;

                // Check perfect clear (no damage taken)
                // For now, simplified

                this.completeRoom();
                return;
            }

            // Player attacks
            const target = aliveEnemies[0];
            const isCrit = Math.random() < run.player.critChance;
            let damage = run.player.damage;
            if (isCrit) damage *= 2;

            target.hp -= damage;
            if (target.hp < 0) target.hp = 0;

            this.addCombatLog(`You deal ${damage} damage to ${target.name}${isCrit ? ' (CRIT!)' : ''}`, 'damage');

            if (target.hp === 0) {
                this.addCombatLog(`${target.name} defeated!`, 'skill');
            }

            // Enemies attack
            aliveEnemies.forEach(enemy => {
                if (enemy.hp > 0) {
                    const enemyDamage = Math.max(1, enemy.damage - run.player.defense);
                    run.player.hp -= enemyDamage;
                    this.addCombatLog(`${enemy.name} deals ${enemyDamage} damage to you`, 'damage');

                    if (run.player.hp <= 0) {
                        // Player died
                        run.player.hp = run.player.maxHp;
                        run.stats.deaths++;
                        this.addCombatLog('You died! Respawning...', 'damage');
                        document.getElementById('death-counter').textContent = run.stats.deaths;
                    }
                }
            });

            // Update cooldowns
            run.skills.forEach(skill => {
                if (skill.currentCooldown > 0) {
                    skill.currentCooldown -= 0.5;
                    if (skill.currentCooldown < 0) skill.currentCooldown = 0;
                }
            });

            this.renderEnemies(room.enemies);
            this.updatePlayerHUD();
            this.renderSkillsBar();
        }, 500); // Combat tick every 0.5s
    }

    renderEnemies(enemies) {
        const container = document.getElementById('enemy-list');
        let html = '';

        enemies.forEach(enemy => {
            const deadClass = enemy.hp <= 0 ? 'dead' : '';
            html += `
                <div class="enemy ${deadClass}">
                    <div class="enemy-name">${enemy.name}</div>
                    <div class="enemy-hp">HP: ${Math.max(0, enemy.hp)}/${enemy.maxHp}</div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    handleTrapRoom(room, roomStartTime) {
        const container = document.getElementById('room-content');
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">💀</div>
                <p>You triggered a trap and took ${room.damage} damage!</p>
            </div>
        `;

        this.state.currentRun.player.hp -= room.damage;
        if (this.state.currentRun.player.hp <= 0) {
            this.state.currentRun.player.hp = this.state.currentRun.player.maxHp;
            this.state.currentRun.stats.deaths++;
        }

        const roomTime = (Date.now() - roomStartTime) / 1000;
        this.state.currentRun.stats.roomTimes.push({ room: this.state.currentRun.currentRoomIndex, time: roomTime });

        this.updatePlayerHUD();

        setTimeout(() => {
            this.completeRoom();
        }, 2000);
    }

    handleShrineRoom(room, roomStartTime) {
        const container = document.getElementById('room-content');
        const buff = room.buff;

        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 3rem; margin-bottom: 20px;">✨</div>
                <p>You received: ${buff.name}</p>
            </div>
        `;

        // Apply buff
        if (buff.type === 'heal') {
            this.state.currentRun.player.hp = Math.min(
                this.state.currentRun.player.maxHp,
                this.state.currentRun.player.hp + buff.value
            );
        } else {
            this.state.currentRun.buffs.push(buff);
        }

        const roomTime = (Date.now() - roomStartTime) / 1000;
        this.state.currentRun.stats.roomTimes.push({ room: this.state.currentRun.currentRoomIndex, time: roomTime });

        this.updatePlayerHUD();

        setTimeout(() => {
            this.completeRoom();
        }, 2000);
    }

    completeRoom() {
        const run = this.state.currentRun;

        if (run.currentRoomIndex >= run.dungeon.length - 1) {
            // Dungeon complete!
            this.completeRun();
        } else {
            // Move to next room
            run.currentRoomIndex++;
            this.enterRoom();
        }
    }

    completeRun() {
        this.stopRunTimer();

        const run = this.state.currentRun;
        const totalTime = (Date.now() - run.stats.startTime) / 1000;

        // Calculate final score
        const deathPenalty = run.stats.deaths * 30;
        const gearPenalty = run.stats.gearBreaks * 15;
        const speedBonus = 0; // Simplified for MVP

        const finalTime = totalTime + deathPenalty + gearPenalty - speedBonus;

        run.stats.finalTime = finalTime;
        run.stats.totalTime = totalTime;
        run.stats.deathPenalty = deathPenalty;
        run.stats.gearPenalty = gearPenalty;
        run.stats.speedBonus = speedBonus;

        // Save to leaderboard
        this.saveRunToLeaderboard(run);

        // Show results
        this.showResults(run);
    }

    saveRunToLeaderboard(run) {
        const entry = {
            playerName: this.state.playerName,
            time: run.stats.finalTime,
            deaths: run.stats.deaths,
            date: new Date().toISOString(),
            seed: this.getDailySeed(),
            stats: run.stats
        };

        // Add to daily
        this.state.leaderboards.daily.push(entry);
        this.state.leaderboards.daily.sort((a, b) => a.time - b.time);
        this.state.leaderboards.daily = this.state.leaderboards.daily.slice(0, 100);

        // Add to all-time
        this.state.leaderboards.alltime.push(entry);
        this.state.leaderboards.alltime.sort((a, b) => a.time - b.time);
        this.state.leaderboards.alltime = this.state.leaderboards.alltime.slice(0, 100);

        this.saveToStorage();
    }

    showResults(run) {
        this.showScreen('results-screen');

        document.getElementById('final-time').textContent = this.formatTime(run.stats.finalTime);
        document.getElementById('base-time').textContent = this.formatTime(run.stats.totalTime);
        document.getElementById('combat-time').textContent = this.formatTime(run.stats.combatTime);
        document.getElementById('death-penalty').textContent = '+' + this.formatTime(run.stats.deathPenalty);
        document.getElementById('gear-penalty').textContent = '+' + this.formatTime(run.stats.gearPenalty);
        document.getElementById('speed-bonus').textContent = '-' + this.formatTime(run.stats.speedBonus);
        document.getElementById('perfect-clears').textContent = run.stats.perfectClears;

        // Leaderboard position
        const position = this.state.leaderboards.daily.findIndex(e =>
            e.time === run.stats.finalTime && e.date === run.stats.date
        ) + 1;

        const positionElem = document.getElementById('leaderboard-position');
        if (position > 0) {
            positionElem.innerHTML = `<strong>Daily Rank: #${position}</strong>`;
        } else {
            positionElem.innerHTML = '';
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(1);
        return `${String(mins).padStart(2, '0')}:${String(Math.floor(secs)).padStart(2, '0')}.${Math.floor((secs % 1) * 10)}`;
    }

    addCombatLog(message, type = '') {
        const log = document.getElementById('combat-log');
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = message;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;

        // Keep only last 20 entries
        while (log.children.length > 20) {
            log.removeChild(log.firstChild);
        }
    }

    updatePlayerHUD() {
        const run = this.state.currentRun;
        if (!run) return;

        const hpPercent = (run.player.hp / run.player.maxHp) * 100;
        document.getElementById('hp-bar-fill').style.width = hpPercent + '%';
        document.getElementById('hp-text').textContent = `${Math.max(0, Math.floor(run.player.hp))}/${run.player.maxHp}`;
    }

    renderSkillsBar() {
        const run = this.state.currentRun;
        if (!run) return;

        const container = document.getElementById('active-skills');
        let html = '';

        run.skills.forEach(skill => {
            const onCooldown = skill.currentCooldown > 0 ? 'on-cooldown' : '';
            const cooldownText = skill.currentCooldown > 0 ?
                `${skill.currentCooldown.toFixed(1)}s` :
                'Ready';

            html += `
                <div class="skill-button ${onCooldown}">
                    <div class="skill-button-name">${skill.name}</div>
                    <div class="skill-cooldown-text">${cooldownText}</div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // ===== LEADERBOARD =====
    switchLeaderboard(type) {
        this.state.currentLeaderboard = type;

        // Update tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');

        this.renderLeaderboard();
    }

    renderLeaderboard() {
        const type = this.state.currentLeaderboard;
        const entries = this.state.leaderboards[type] || [];

        const tbody = document.getElementById('leaderboard-body');

        if (entries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 40px;">No runs yet. Be the first!</td></tr>';
            return;
        }

        let html = '';
        entries.slice(0, 20).forEach((entry, index) => {
            const date = new Date(entry.date).toLocaleDateString();
            html += `
                <tr>
                    <td class="rank">#${index + 1}</td>
                    <td class="player-name">${entry.playerName}</td>
                    <td>${this.formatTime(entry.time)}</td>
                    <td>${entry.deaths}</td>
                    <td>${date}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    // ===== GHOST STATS =====
    renderGhostStats() {
        const container = document.getElementById('ghost-content');
        const topRun = this.state.leaderboards.daily[0];

        if (!topRun) {
            container.innerHTML = '<p style="text-align: center; padding: 40px;">No runs available yet.</p>';
            return;
        }

        let html = `
            <div class="ghost-run-info">
                <h3>Top Run by ${topRun.playerName}</h3>
                <p>Time: ${this.formatTime(topRun.time)} | Deaths: ${topRun.deaths}</p>
            </div>
        `;

        if (topRun.stats.roomTimes) {
            html += '<h4>Room-by-Room Breakdown</h4>';
            topRun.stats.roomTimes.forEach((rt, index) => {
                html += `
                    <div class="ghost-room">
                        <div class="ghost-room-title">Room ${rt.room + 1}</div>
                        <div class="ghost-stats-row">
                            <span>Time:</span>
                            <span>${this.formatTime(rt.time)}</span>
                        </div>
                    </div>
                `;
            });
        }

        container.innerHTML = html;
    }

    // ===== UI UPDATES =====
    updateUI() {
        this.checkStaminaReset();

        const seed = this.getDailySeed();
        const modifier = this.getDailyModifier();

        document.getElementById('daily-seed').textContent = '#' + seed;
        document.getElementById('daily-modifier').textContent = modifier.name;
        document.getElementById('stamina-display').textContent =
            `${this.state.stamina}/${this.state.maxStamina}`;
    }

    // ===== PVP METHODS =====
    showPvPLobby() {
        this.showScreen('pvp-lobby-screen');
        this.updatePvPStats();
    }

    updatePvPStats() {
        const wins = this.arenaStats.wins;
        const losses = this.arenaStats.losses;
        const winRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : 0;

        document.getElementById('pvp-wins').textContent = wins;
        document.getElementById('pvp-losses').textContent = losses;
        document.getElementById('pvp-winrate').textContent = winRate + '%';
    }

    showArenaStats() {
        this.showScreen('arena-stats-screen');
        this.renderArenaStats();
        this.renderAchievements();
    }

    renderArenaStats() {
        const stats = this.arenaStats;
        const mostUsed = this.getMostUsedSkill();
        const winRate = stats.wins + stats.losses > 0 ?
            ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1) : 0;

        // Career Stats
        document.getElementById('stat-total-matches').textContent = stats.totalMatches;
        document.getElementById('stat-wins').textContent = stats.wins;
        document.getElementById('stat-losses').textContent = stats.losses;
        document.getElementById('stat-draws').textContent = stats.draws;
        document.getElementById('stat-winrate').textContent = winRate + '%';
        document.getElementById('stat-best-streak').textContent = stats.bestWinStreak;

        // Combat Stats
        document.getElementById('stat-total-damage').textContent = stats.totalDamageDealt;
        document.getElementById('stat-total-taken').textContent = stats.totalDamageTaken;
        document.getElementById('stat-total-healing').textContent = stats.totalHealingDone;
        document.getElementById('stat-total-crits').textContent = stats.totalCrits;
        document.getElementById('stat-highest-damage').textContent = stats.highestDamageDealt;
        document.getElementById('stat-highest-taken').textContent = stats.highestDamageTaken;
        document.getElementById('stat-longest-match').textContent = stats.longestMatch + ' turns';
        document.getElementById('stat-shortest-win').textContent =
            (stats.shortestWin === 999 ? 'N/A' : stats.shortestWin + ' turns');
        document.getElementById('stat-most-used-skill').textContent =
            `${mostUsed.name}${mostUsed.uses > 0 ? ' (' + mostUsed.uses + 'x)' : ''}`;
    }

    renderAchievements() {
        const container = document.getElementById('achievements-grid');
        const allAchievements = this.getAllAchievements();

        let html = '';
        allAchievements.forEach(ach => {
            const unlocked = this.achievements[ach.id].unlocked;
            const lockedClass = unlocked ? 'unlocked' : 'locked';

            html += `
                <div class="achievement-card ${lockedClass}">
                    <div class="achievement-icon-large">${ach.icon}</div>
                    <div class="achievement-details">
                        <div class="achievement-name">${ach.name}</div>
                        <div class="achievement-desc">${ach.desc}</div>
                        ${unlocked ? `<div class="achievement-date">Unlocked: ${new Date(this.achievements[ach.id].unlockedAt).toLocaleDateString()}</div>` : '<div class="achievement-locked-msg">🔒 Locked</div>'}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    selectPvPMode(mode) {
        this.pvpMode = mode;
        this.showScreen('pvp-build-screen');
        this.renderPvPSkillSelection();
        this.updatePvPBuildUI();
    }

    adjustPvPStat(statName, delta) {
        const newValue = this.pvpStats[statName] + delta;
        const currentTotal = Object.values(this.pvpStats).reduce((a, b) => a + b, 0);
        const newTotal = currentTotal + delta;

        if (newValue >= 0 && newTotal <= this.state.totalStatPoints) {
            this.pvpStats[statName] = newValue;
            this.updatePvPBuildUI();
        }
    }

    updatePvPBuildUI() {
        Object.keys(this.pvpStats).forEach(stat => {
            const elem = document.getElementById(`pvp-stat-${stat}`);
            if (elem) elem.textContent = this.pvpStats[stat];
        });

        const currentTotal = Object.values(this.pvpStats).reduce((a, b) => a + b, 0);
        const remaining = this.state.totalStatPoints - currentTotal;
        document.getElementById('pvp-points-remaining').textContent = remaining;

        const startBtn = document.getElementById('start-pvp-btn');
        const hasSkills = this.pvpSelectedSkills.length === 4;
        const validStats = remaining === 0;
        startBtn.disabled = !(hasSkills && validStats);
    }

    renderPvPSkillSelection() {
        const container = document.getElementById('pvp-skill-selection');
        const skills = this.pvpSystem.getPvPSkills();

        let html = '';
        skills.forEach(skill => {
            const selected = this.pvpSelectedSkills.find(s => s.id === skill.id) ? 'selected' : '';
            const disabled = !selected && this.pvpSelectedSkills.length >= 4 ? 'disabled' : '';

            const typeColors = {
                burst: '#ef4444',
                control: '#8b5cf6',
                mobility: '#10b981',
                sustain: '#22c55e',
                utility: '#f59e0b'
            };

            html += `
                <div class="skill-item pvp-skill ${selected} ${disabled}"
                     onclick="game.togglePvPSkill('${skill.id}')"
                     style="border-color: ${typeColors[skill.type]};">
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-type" style="color: ${typeColors[skill.type]};">
                        ${skill.type.toUpperCase()} | ${skill.priority.toUpperCase()} Priority
                    </div>
                    <div class="skill-desc">${skill.desc}</div>
                    <div class="skill-cooldown">Cooldown: ${skill.cooldown} turns</div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    togglePvPSkill(skillId) {
        const index = this.pvpSelectedSkills.findIndex(s => s.id === skillId);

        if (index >= 0) {
            this.pvpSelectedSkills.splice(index, 1);
        } else {
            if (this.pvpSelectedSkills.length < 4) {
                const skill = this.pvpSystem.getPvPSkills().find(s => s.id === skillId);
                this.pvpSelectedSkills.push(skill);
            }
        }

        this.renderPvPSkillSelection();
        this.updatePvPBuildUI();
    }

    startPvPBattle() {
        const match = this.pvpSystem.startPvPMatch(this.pvpMode === 'ranked');

        // Apply player stats
        match.player.selectedSkills = [...this.pvpSelectedSkills];
        match.opponent.selectedSkills = this.generateAISkillset();

        // Initialize skills
        match.player.skills = match.player.selectedSkills.map(s => ({ ...s, currentCooldown: 0 }));
        match.opponent.skills = match.opponent.selectedSkills.map(s => ({ ...s, currentCooldown: 0 }));

        this.showScreen('pvp-battle-screen');
        this.updatePvPBattleUI();
    }

    generateAISkillset() {
        const allSkills = this.pvpSystem.getPvPSkills();
        const selected = [];

        // AI prefers balanced build
        const burst = allSkills.filter(s => s.type === 'burst')[0];
        const control = allSkills.filter(s => s.type === 'control')[0];
        const sustain = allSkills.filter(s => s.type === 'sustain')[0];
        const mobility = allSkills.filter(s => s.type === 'mobility')[0];

        selected.push(burst, control, sustain, mobility);
        return selected;
    }

    selectPvPAction(actionId) {
        // Clear previous selection first
        this.selectedPvPAction = null;

        if (actionId === 'basic_attack') {
            this.selectedPvPAction = { id: 'basic_attack', name: 'Basic Attack', priority: 'normal' };
        } else if (actionId === 'guard') {
            this.selectedPvPAction = { id: 'guard', name: 'Guard', priority: 'high' };
        } else {
            const skill = this.pvpSystem.currentMatch.player.skills.find(s => s.id === actionId);
            if (skill && skill.currentCooldown === 0) {
                this.selectedPvPAction = skill;
            }
        }

        // Update UI
        document.getElementById('pvp-confirm-btn').disabled = !this.selectedPvPAction;
        this.highlightSelectedAction();
    }

    highlightSelectedAction() {
        document.querySelectorAll('.action-btn, .pvp-skill-btn').forEach(btn => {
            btn.classList.remove('action-selected');
        });

        if (this.selectedPvPAction) {
            const btn = document.querySelector(`[data-action-id="${this.selectedPvPAction.id}"]`);
            if (btn) btn.classList.add('action-selected');
        }
    }

    confirmPvPAction() {
        if (!this.selectedPvPAction) return;

        const match = this.pvpSystem.currentMatch;
        match.player.selectedAction = this.selectedPvPAction;

        // AI selects action
        this.pvpSystem.selectAIAction();

        // Resolve turn
        const turnLog = this.pvpSystem.resolveTurn();

        // Update UI
        this.updatePvPBattleUI();
        this.displayTurnLog(turnLog);

        // Reset selection
        this.selectedPvPAction = null;
        document.getElementById('pvp-confirm-btn').disabled = true;

        // Check for battle end
        if (match.winner) {
            setTimeout(() => {
                this.endPvPBattle(match);
            }, 2000);
        }
    }

    updatePvPBattleUI() {
        const match = this.pvpSystem.currentMatch;

        // Update turn counter
        document.getElementById('pvp-turn').textContent = match.turn;

        // Update player HP
        const playerHpPercent = (match.player.hp / match.player.maxHp) * 100;
        document.getElementById('pvp-player-hp-fill').style.width = playerHpPercent + '%';
        document.getElementById('pvp-player-hp-text').textContent =
            `${Math.max(0, Math.floor(match.player.hp))}/${match.player.maxHp}`;

        // Update opponent HP
        const opponentHpPercent = (match.opponent.hp / match.opponent.maxHp) * 100;
        document.getElementById('pvp-opponent-hp-fill').style.width = opponentHpPercent + '%';
        document.getElementById('pvp-opponent-hp-text').textContent =
            `${Math.max(0, Math.floor(match.opponent.hp))}/${match.opponent.maxHp}`;

        // Update shields
        document.getElementById('pvp-player-shield').textContent =
            `🛡️ Shield: ${match.player.shield}`;
        document.getElementById('pvp-opponent-shield').textContent =
            `🛡️ Shield: ${match.opponent.shield}`;

        // Update status effects
        this.updatePvPStatusDisplay('player', match.player);
        this.updatePvPStatusDisplay('opponent', match.opponent);

        // Update skill buttons
        this.renderPvPSkillButtons();
    }

    updatePvPStatusDisplay(fighterType, fighter) {
        const container = document.getElementById(`pvp-${fighterType}-status`);
        const statuses = [];

        Object.keys(fighter.status).forEach(status => {
            if (fighter.status[status] > 0) {
                const icons = {
                    stunned: '💫',
                    silenced: '🔇',
                    vulnerable: '💀',
                    guarding: '🛡️',
                    powered: '💪',
                    slowed: '🐌',
                    dodging: '🌀',
                    shielded: '🛡️',
                    exhausted: '😓',
                    immune: '✨'
                };
                statuses.push(`${icons[status] || '❓'} ${status}`);
            }
        });

        container.textContent = statuses.join(' | ') || 'No effects';
    }

    renderPvPSkillButtons() {
        const match = this.pvpSystem.currentMatch;
        const container = document.getElementById('pvp-active-skills');

        let html = '';
        match.player.skills.forEach(skill => {
            const onCooldown = skill.currentCooldown > 0;
            const silenced = match.player.status.silenced;
            const disabled = onCooldown || silenced;

            html += `
                <button class="pvp-skill-btn ${disabled ? 'skill-disabled' : ''}"
                        data-action-id="${skill.id}"
                        onclick="game.selectPvPAction('${skill.id}')"
                        ${disabled ? 'disabled' : ''}>
                    <div class="skill-button-name">${skill.name}</div>
                    <div class="skill-cooldown-text">
                        ${onCooldown ? `Cooldown: ${skill.currentCooldown}` : 'Ready'}
                    </div>
                </button>
            `;
        });

        container.innerHTML = html;
    }

    displayTurnLog(turnLog) {
        const container = document.getElementById('pvp-log');

        turnLog.events.forEach(event => {
            const entry = document.createElement('div');
            entry.className = `log-entry log-${event.type || 'info'}`;
            entry.textContent = `[Turn ${turnLog.turn}] ${event.message}`;
            container.appendChild(entry);

            // Trigger crit animation on HP bars
            if (event.isCrit) {
                this.triggerCritAnimation(event.target);
            }
        });

        container.scrollTop = container.scrollHeight;

        // Keep only last 30 entries
        while (container.children.length > 30) {
            container.removeChild(container.firstChild);
        }
    }

    triggerCritAnimation(target) {
        // Determine which HP bar to animate
        const hpBarId = target === 'Rival' || target === 'opponent' ?
            'pvp-opponent-hp-fill' : 'pvp-player-hp-fill';

        const hpBar = document.getElementById(hpBarId);
        if (!hpBar) return;

        // Add crit animation class
        hpBar.closest('.fighter-display').classList.add('crit-hit');

        // Remove the class after animation completes
        setTimeout(() => {
            hpBar.closest('.fighter-display').classList.remove('crit-hit');
        }, 600);
    }

    endPvPBattle(match) {
        this.showScreen('pvp-results-screen');

        const isVictory = match.winner === 'You';
        document.getElementById('pvp-result-title').textContent =
            isVictory ? '🎉 Victory!' : match.winner === 'draw' ? '⚔️ Draw' : '💀 Defeat';

        document.getElementById('pvp-battle-turns').textContent = `${match.turn} turns`;

        // Calculate and display stats
        let damageDealt = 0;
        let damageTaken = 0;
        let healingDone = 0;
        let critsLanded = 0;
        let skillsUsed = { You: {}, Rival: {} };

        match.battleLog.forEach(turnLog => {
            turnLog.events.forEach(event => {
                // Get damage from either damage or finalDamage field
                const actualDamage = event.finalDamage || event.damage || 0;

                if (actualDamage > 0) {
                    // Track damage dealt by checking who the target is
                    if (event.target === 'Rival') {
                        damageDealt += actualDamage;
                    } else if (event.target === 'You') {
                        damageTaken += actualDamage;
                    }

                    // Track crits
                    if (event.isCrit) {
                        critsLanded++;
                    }
                }

                // Track healing
                if (event.heal && event.heal > 0) {
                    // Only track healing done by player
                    if (event.message.startsWith('You')) {
                        healingDone += event.heal;
                    }
                }

                // Track skill usage
                if (event.actionName && event.type === 'skill') {
                    const actor = event.message.startsWith('You') ? 'You' : 'Rival';
                    if (!skillsUsed[actor][event.actionName]) {
                        skillsUsed[actor][event.actionName] = 0;
                    }
                    skillsUsed[actor][event.actionName]++;
                }
            });
        });

        document.getElementById('pvp-damage-dealt').textContent = damageDealt;
        document.getElementById('pvp-damage-taken').textContent = damageTaken;
        document.getElementById('pvp-healing-done').textContent = healingDone;

        // Update arena stats
        this.updateArenaStats(match, damageDealt, damageTaken, healingDone, critsLanded);

        // Auto-save to cloud if logged in
        if (this.authSystem && this.authSystem.isLoggedIn()) {
            this.authSystem.saveStatsToCloud();
        }

        // Check for flawless victory achievement
        if (isVictory && damageTaken === 0 && !this.achievements['flawless'].unlocked) {
            this.achievements['flawless'].unlocked = true;
            this.achievements['flawless'].unlockedAt = new Date().toISOString();
            this.saveAchievements();
            this.showAchievementPopup(this.getAllAchievements().find(a => a.id === 'flawless'));
        }

        // Generate full battle log
        const logHtml = match.battleLog.map((turnLog, index) => {
            const eventsHtml = turnLog.events.map(event => {
                const critClass = event.isCrit ? ' crit-event' : '';
                return `<div class="log-event${critClass}">${event.message}${event.bonusMessage || ''}${event.statusEffect ? ' (' + event.statusEffect + ')' : ''}${event.selfEffect ? ' (' + event.selfEffect + ')' : ''}</div>`;
            }).join('');

            return `
                <div class="turn-log-block">
                    <div class="turn-header">Turn ${turnLog.turn}</div>
                    <div class="turn-events">${eventsHtml}</div>
                </div>
            `;
        }).join('');

        document.getElementById('pvp-full-battle-log').innerHTML = logHtml + `
            <div class="battle-stats-summary">
                <h4>Battle Statistics</h4>
                <div class="stat-row"><span>Total Turns:</span> <span>${match.turn}</span></div>
                <div class="stat-row"><span>Damage Dealt:</span> <span>${damageDealt}</span></div>
                <div class="stat-row"><span>Damage Taken:</span> <span>${damageTaken}</span></div>
                <div class="stat-row"><span>Critical Hits:</span> <span>${critsLanded} 💥</span></div>
            </div>
        `;

        // Save result
        this.pvpSystem.savePvPResult(match.winner, isVictory ? 'Rival' : 'You', match.turn);
    }

    // ===== MULTIPLAYER METHODS =====
  initializeMultiplayer() {
    this.multiplayerClient = new MultiplayerClient(this);
    // Replace YOUR_RENDER_APP_NAME with your actual Render app name
    const serverUrl = localStorage.getItem('dungeonaut_server_url') || 'wss://dungeonaut-server.onrender.com';
    this.multiplayerClient.connect(serverUrl);
}

    showMultiplayerStatus(message, type) {
        const statusElem = document.getElementById('connection-status');
        if (statusElem) {
            statusElem.textContent = message;
            statusElem.className = `status-${type}`;
        }
    }

    updateUsernameDisplay(username) {
        const usernameElem = document.getElementById('username-display');
        if (usernameElem) {
            usernameElem.textContent = `Playing as: ${username}`;
        }
    }

    changeUsername() {
        if (!this.multiplayerClient) return;

        const newUsername = prompt('Enter your new username:', this.multiplayerClient.username || '');
        if (newUsername && newUsername.trim()) {
            this.multiplayerClient.setUsername(newUsername.trim());
        }
    }

    selectPvPMode(mode) {
        if (mode === 'online-ranked' || mode === 'online-unranked') {
            // Online mode
            if (!this.multiplayerClient || !this.multiplayerClient.connected) {
                alert('Not connected to multiplayer server!');
                return;
            }

            const queueType = mode === 'online-ranked' ? 'ranked' : 'unranked';
            this.multiplayerClient.joinQueue(queueType);
            this.isOnlineMatch = true;
            this.pvpMode = queueType;
        } else {
            // AI mode (existing code)
            this.pvpMode = mode;
            this.isOnlineMatch = false;
            this.showScreen('pvp-build-screen');
            this.renderPvPSkillSelection();
            this.updatePvPBuildUI();
        }
    }

    showMatchmakingUI(queueType) {
        this.showScreen('matchmaking-screen');
        const status = document.getElementById('matchmaking-status');
        status.textContent = `Searching for ${queueType} match...`;

        // Start queue timer
        this.queueStartTime = Date.now();
        this.queueTimerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.queueStartTime) / 1000);
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            document.getElementById('queue-timer').textContent =
                `${mins}:${String(secs).padStart(2, '0')}`;
        }, 1000);
    }

    hideMatchmakingUI() {
        if (this.queueTimerInterval) {
            clearInterval(this.queueTimerInterval);
        }
        this.showPvPLobby();
    }

    cancelMatchmaking() {
        this.multiplayerClient.leaveQueue();
    }

    showMatchFound(opponentName) {
        if (this.queueTimerInterval) {
            clearInterval(this.queueTimerInterval);
        }

        this.showScreen('match-found-screen');
        document.getElementById('opponent-name').textContent = opponentName;

        // Auto-proceed after 3 seconds
        setTimeout(() => {
            this.proceedToBuild();
        }, 3000);
    }

    proceedToBuild() {
        this.showScreen('pvp-build-screen');
        this.renderPvPSkillSelection();
        this.updatePvPBuildUI();
    }

    showOpponentReady() {
        // Could show a notification
        console.log('Opponent is ready!');
    }

    startPvPBattle() {
        if (this.isOnlineMatch) {
            // Send build to server
            const build = {
                stats: this.pvpStats,
                skills: this.pvpSelectedSkills
            };
            this.multiplayerClient.submitBuild(build);

            // Show waiting screen
            this.showScreen('matchmaking-screen');
            document.getElementById('matchmaking-status').textContent = 'Waiting for opponent...';
        } else {
            // AI match (existing code)
            const match = this.pvpSystem.startPvPMatch(this.pvpMode === 'ranked');
            match.player.selectedSkills = [...this.pvpSelectedSkills];
            match.opponent.selectedSkills = this.generateAISkillset();
            match.player.skills = match.player.selectedSkills.map(s => ({ ...s, currentCooldown: 0 }));
            match.opponent.skills = match.opponent.selectedSkills.map(s => ({ ...s, currentCooldown: 0 }));

            this.showScreen('pvp-battle-screen');
            this.updatePvPBattleUI();
        }
    }

    startOnlineBattle(message) {
        // Initialize online battle
        const match = this.pvpSystem.startPvPMatch(this.pvpMode === 'ranked');

        // Set up player
        match.player.selectedSkills = message.playerData.skills;
        match.player.skills = message.playerData.skills.map(s => ({ ...s, currentCooldown: 0 }));

        // Set up opponent
        match.opponent.name = this.multiplayerClient.currentMatch.opponent;
        match.opponent.selectedSkills = message.opponentData.skills;
        match.opponent.skills = message.opponentData.skills.map(s => ({ ...s, currentCooldown: 0 }));

        this.showScreen('pvp-battle-screen');
        this.updatePvPBattleUI();
    }

    confirmPvPAction() {
        if (!this.selectedPvPAction) return;

        if (this.isOnlineMatch) {
            // Send action to server
            this.multiplayerClient.submitAction(this.selectedPvPAction);

            // Disable UI while waiting
            document.getElementById('pvp-confirm-btn').disabled = true;
            document.querySelectorAll('.action-btn, .pvp-skill-btn').forEach(btn => {
                btn.disabled = true;
            });

            this.addPvPLog('Waiting for opponent...');
        } else {
            // AI match (existing code)
            const match = this.pvpSystem.currentMatch;
            match.player.selectedAction = this.selectedPvPAction;
            this.pvpSystem.selectAIAction();
            const turnLog = this.pvpSystem.resolveTurn();
            this.updatePvPBattleUI();
            this.displayTurnLog(turnLog);

            this.selectedPvPAction = null;
            document.getElementById('pvp-confirm-btn').disabled = true;

            if (match.winner) {
                setTimeout(() => {
                    this.endPvPBattle(match);
                }, 2000);
            }
        }
    }

    showOpponentWaiting() {
        this.addPvPLog('Opponent is thinking...');
    }

    resolveOnlineTurn(message) {
        const match = this.pvpSystem.currentMatch;

        // Convert action IDs back to full action objects
        const convertAction = (actionId) => {
            if (actionId === 'basic_attack') {
                return { id: 'basic_attack', name: 'Basic Attack', priority: 'normal' };
            } else if (actionId === 'guard') {
                return { id: 'guard', name: 'Guard', priority: 'high' };
            } else {
                // Find the skill in the PvP skills list
                const allSkills = this.pvpSystem.getPvPSkills();
                const skill = allSkills.find(s => s.id === actionId);
                return skill || { id: actionId, name: 'Unknown', priority: 'normal' };
            }
        };

        // Resolve turn with both actions
        match.player.selectedAction = convertAction(message.yourAction);
        match.opponent.selectedAction = convertAction(message.opponentAction);

        const turnLog = this.pvpSystem.resolveTurn();
        this.updatePvPBattleUI();
        this.displayTurnLog(turnLog);

        // Re-enable UI
        this.selectedPvPAction = null;
        document.getElementById('pvp-confirm-btn').disabled = true;
        document.querySelectorAll('.action-btn, .pvp-skill-btn').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('selected');
        });

        if (match.winner) {
            setTimeout(() => {
                // Send result to server
                this.multiplayerClient.endMatch(
                    match.winner === 'You' ? this.multiplayerClient.playerId : 'opponent',
                    match.stats
                );
            }, 2000);
        }
    }

    showOnlineMatchResult(message) {
        this.showScreen('pvp-results-screen');

        const isVictory = message.result === 'victory';
        document.getElementById('pvp-result-title').textContent =
            isVictory ? '🎉 Victory!' : '💀 Defeat';

        // Update stats display
        if (message.stats) {
            this.updatePlayerStats(message.stats);
        }
    }

    updatePlayerStats(stats) {
        document.getElementById('pvp-wins').textContent = stats.wins;
        document.getElementById('pvp-losses').textContent = stats.losses;
        const winRate = stats.wins + stats.losses > 0 ?
            ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1) : 0;
        document.getElementById('pvp-winrate').textContent = winRate + '%';
    }

    updateOnlineLeaderboard(leaderboard) {
        // Update leaderboard with online data
        console.log('Received online leaderboard:', leaderboard);
    }

    addPvPLog(message) {
        const container = document.getElementById('pvp-log');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.textContent = message;
        container.appendChild(entry);
        container.scrollTop = container.scrollHeight;
    }

    // ===== LOADOUT SYSTEM =====
    loadPvPLoadouts() {
        const saved = localStorage.getItem('dungeonaut_pvp_loadouts');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load loadouts:', e);
            }
        }

        // Default loadouts
        return {
            slot1: this.getPresetLoadout('Tank'),
            slot2: this.getPresetLoadout('DPS'),
            slot3: this.getPresetLoadout('Balanced'),
            slot4: this.getPresetLoadout('Support'),
            slot5: this.getPresetLoadout('Glass Cannon')
        };
    }

    getPresetLoadout(name) {
        const skills = this.pvpSystem ? this.pvpSystem.getPvPSkills() : [];

        const presets = {
            'Tank': {
                name: 'Tank',
                stats: { strength: 2, vitality: 5, agility: 1, luck: 2 },
                skills: ['regeneration', 'shield_wall', 'taunt', 'iron_skin'].map(id =>
                    skills.find(s => s.id === id)).filter(s => s)
            },
            'DPS': {
                name: 'DPS',
                stats: { strength: 5, vitality: 1, agility: 2, luck: 2 },
                skills: ['shadow_strike', 'execute', 'blood_rage', 'critical_surge'].map(id =>
                    skills.find(s => s.id === id)).filter(s => s)
            },
            'Balanced': {
                name: 'Balanced',
                stats: { strength: 3, vitality: 3, agility: 2, luck: 2 },
                skills: ['shadow_strike', 'regeneration', 'flash_step', 'time_warp'].map(id =>
                    skills.find(s => s.id === id)).filter(s => s)
            },
            'Support': {
                name: 'Support',
                stats: { strength: 1, vitality: 4, agility: 2, luck: 3 },
                skills: ['regeneration', 'blessing', 'mana_shield', 'cleanse'].map(id =>
                    skills.find(s => s.id === id)).filter(s => s)
            },
            'Glass Cannon': {
                name: 'Glass Cannon',
                stats: { strength: 6, vitality: 0, agility: 2, luck: 2 },
                skills: ['shadow_strike', 'execute', 'blood_rage', 'desperate_strike'].map(id =>
                    skills.find(s => s.id === id)).filter(s => s)
            }
        };

        return presets[name] || presets['Balanced'];
    }

    saveLoadout(slotNumber, name, stats, skills) {
        this.pvpLoadouts[`slot${slotNumber}`] = {
            name: name,
            stats: stats,
            skills: skills
        };
        localStorage.setItem('dungeonaut_pvp_loadouts', JSON.stringify(this.pvpLoadouts));
    }

    loadLoadout(slotNumber) {
        const loadout = this.pvpLoadouts[`slot${slotNumber}`];
        if (!loadout) return;

        // Apply stats
        this.pvpStats = { ...loadout.stats };

        // Apply skills
        this.pvpSelectedSkills = [...loadout.skills];

        // Update UI
        this.updatePvPBuildUI();
        this.renderPvPSkillSelection();

        // Show notification
        this.addPvPLog(`Loaded loadout: ${loadout.name}`);
    }

    // ===== ARENA STATS SYSTEM =====
    loadArenaStats() {
        const saved = localStorage.getItem('dungeonaut_arena_stats');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load arena stats:', e);
            }
        }

        return {
            totalMatches: 0,
            wins: 0,
            losses: 0,
            draws: 0,
            totalDamageDealt: 0,
            totalDamageTaken: 0,
            totalHealingDone: 0,
            totalCrits: 0,
            skillUsage: {},
            highestDamageDealt: 0,
            highestDamageTaken: 0,
            longestMatch: 0,
            shortestWin: 999,
            winStreak: 0,
            bestWinStreak: 0,
            currentStreak: 0
        };
    }

    saveArenaStats() {
        localStorage.setItem('dungeonaut_arena_stats', JSON.stringify(this.arenaStats));
    }

    updateArenaStats(match, damageDealt, damageTaken, healingDone, critsLanded) {
        this.arenaStats.totalMatches++;

        if (match.winner === 'You') {
            this.arenaStats.wins++;
            this.arenaStats.currentStreak++;
            if (this.arenaStats.currentStreak > this.arenaStats.bestWinStreak) {
                this.arenaStats.bestWinStreak = this.arenaStats.currentStreak;
            }
            if (match.turn < this.arenaStats.shortestWin) {
                this.arenaStats.shortestWin = match.turn;
            }
        } else if (match.winner === 'Rival') {
            this.arenaStats.losses++;
            this.arenaStats.currentStreak = 0;
        } else {
            this.arenaStats.draws++;
        }

        this.arenaStats.totalDamageDealt += damageDealt;
        this.arenaStats.totalDamageTaken += damageTaken;
        this.arenaStats.totalHealingDone += healingDone;
        this.arenaStats.totalCrits += critsLanded;

        if (damageDealt > this.arenaStats.highestDamageDealt) {
            this.arenaStats.highestDamageDealt = damageDealt;
        }
        if (damageTaken > this.arenaStats.highestDamageTaken) {
            this.arenaStats.highestDamageTaken = damageTaken;
        }
        if (match.turn > this.arenaStats.longestMatch) {
            this.arenaStats.longestMatch = match.turn;
        }

        // Track skill usage
        match.battleLog.forEach(turnLog => {
            turnLog.events.forEach(event => {
                if (event.actionName && event.message.startsWith('You') && event.type === 'skill') {
                    if (!this.arenaStats.skillUsage[event.actionName]) {
                        this.arenaStats.skillUsage[event.actionName] = 0;
                    }
                    this.arenaStats.skillUsage[event.actionName]++;
                }
            });
        });

        this.saveArenaStats();
        this.checkAchievements();
    }

    getMostUsedSkill() {
        let maxUses = 0;
        let mostUsed = 'None';

        Object.keys(this.arenaStats.skillUsage).forEach(skillName => {
            if (this.arenaStats.skillUsage[skillName] > maxUses) {
                maxUses = this.arenaStats.skillUsage[skillName];
                mostUsed = skillName;
            }
        });

        return { name: mostUsed, uses: maxUses };
    }

    // ===== ACHIEVEMENT SYSTEM =====
    loadAchievements() {
        const saved = localStorage.getItem('dungeonaut_achievements');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load achievements:', e);
            }
        }

        // Initialize all achievements as locked
        const achievements = {};
        this.getAllAchievements().forEach(ach => {
            achievements[ach.id] = { unlocked: false, unlockedAt: null };
        });
        return achievements;
    }

    getAllAchievements() {
        return [
            // Win-based
            { id: 'first_win', name: 'First Blood', desc: 'Win your first PvP match', icon: '🏆', condition: () => this.arenaStats.wins >= 1 },
            { id: 'win_10', name: 'Veteran', desc: 'Win 10 PvP matches', icon: '⚔️', condition: () => this.arenaStats.wins >= 10 },
            { id: 'win_50', name: 'Champion', desc: 'Win 50 PvP matches', icon: '👑', condition: () => this.arenaStats.wins >= 50 },
            { id: 'win_100', name: 'Legend', desc: 'Win 100 PvP matches', icon: '🌟', condition: () => this.arenaStats.wins >= 100 },

            // Streak-based
            { id: 'streak_3', name: 'Hot Streak', desc: 'Win 3 matches in a row', icon: '🔥', condition: () => this.arenaStats.bestWinStreak >= 3 },
            { id: 'streak_5', name: 'Unstoppable', desc: 'Win 5 matches in a row', icon: '💪', condition: () => this.arenaStats.bestWinStreak >= 5 },
            { id: 'streak_10', name: 'Godlike', desc: 'Win 10 matches in a row', icon: '😇', condition: () => this.arenaStats.bestWinStreak >= 10 },

            // Damage-based
            { id: 'damage_500', name: 'Heavy Hitter', desc: 'Deal 500 damage in one match', icon: '💥', condition: () => this.arenaStats.highestDamageDealt >= 500 },
            { id: 'damage_1000', name: 'Destroyer', desc: 'Deal 1000 damage in one match', icon: '💀', condition: () => this.arenaStats.highestDamageDealt >= 1000 },

            // Crit-based
            { id: 'crit_10', name: 'Lucky Strike', desc: 'Land 10 crits in total', icon: '🎯', condition: () => this.arenaStats.totalCrits >= 10 },
            { id: 'crit_50', name: 'Precision', desc: 'Land 50 crits in total', icon: '🎲', condition: () => this.arenaStats.totalCrits >= 50 },

            // Survival-based
            { id: 'tank_500', name: 'Iron Wall', desc: 'Take 500 damage in one match and win', icon: '🛡️', condition: () => this.arenaStats.highestDamageTaken >= 500 },
            { id: 'healer', name: 'Combat Medic', desc: 'Heal 1000 HP in total', icon: '💚', condition: () => this.arenaStats.totalHealingDone >= 1000 },

            // Match length
            { id: 'quick_win', name: 'Speed Demon', desc: 'Win a match in under 5 turns', icon: '⚡', condition: () => this.arenaStats.shortestWin <= 5 },
            { id: 'marathon', name: 'Marathon Fighter', desc: 'Fight a match lasting 25+ turns', icon: '⏱️', condition: () => this.arenaStats.longestMatch >= 25 },

            // Perfect
            { id: 'flawless', name: 'Flawless Victory', desc: 'Win without taking any damage', icon: '✨', condition: () => false } // Checked separately
        ];
    }

    saveAchievements() {
        localStorage.setItem('dungeonaut_achievements', JSON.stringify(this.achievements));
    }

    checkAchievements() {
        const allAchievements = this.getAllAchievements();
        const newlyUnlocked = [];

        allAchievements.forEach(ach => {
            if (!this.achievements[ach.id].unlocked && ach.condition()) {
                this.achievements[ach.id].unlocked = true;
                this.achievements[ach.id].unlockedAt = new Date().toISOString();
                newlyUnlocked.push(ach);
            }
        });

        if (newlyUnlocked.length > 0) {
            this.saveAchievements();
            this.showAchievementNotifications(newlyUnlocked);
        }
    }

    showAchievementNotifications(achievements) {
        achievements.forEach((ach, index) => {
            setTimeout(() => {
                this.showAchievementPopup(ach);
            }, index * 2000);
        });
    }

    showAchievementPopup(achievement) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'achievement-popup';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-content">
                <div class="achievement-title">Achievement Unlocked!</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.desc}</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }
}

// ===== INITIALIZE GAME =====
const game = new DungeonAutGame();
game.showMainMenu();
game.initializeMultiplayer();
