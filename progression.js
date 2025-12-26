// ===== PLAYER PROGRESSION SYSTEM =====

class ProgressionSystem {
    constructor(game) {
        this.game = game;

        // Load or initialize progression data
        this.playerData = this.loadProgressionData() || {
            level: 1,
            xp: 0,
            totalXP: 0,
            selectedClass: 'novice',
            unlockedSkills: [],
            perks: {},
            perkPoints: 0,
            titles: [],
            equippedTitle: null
        };
    }

    // XP Curve - exponential growth
    getXPForLevel(level) {
        return Math.floor(100 * Math.pow(1.15, level - 1));
    }

    // Get total XP needed to reach a specific level
    getTotalXPForLevel(level) {
        let total = 0;
        for (let i = 1; i < level; i++) {
            total += this.getXPForLevel(i);
        }
        return total;
    }

    // Award XP and check for level up
    awardXP(amount, source = 'unknown') {
        this.playerData.xp += amount;
        this.playerData.totalXP += amount;

        console.log(`+${amount} XP from ${source}`);

        // Check for level up
        const xpNeeded = this.getXPForLevel(this.playerData.level);
        if (this.playerData.xp >= xpNeeded) {
            this.levelUp();
        }

        this.saveProgressionData();
        this.updateProgressionUI();
    }

    // Level up!
    levelUp() {
        const xpNeeded = this.getXPForLevel(this.playerData.level);
        this.playerData.xp -= xpNeeded;
        this.playerData.level++;
        this.playerData.perkPoints++;

        // Show level up notification
        this.showLevelUpNotification();

        // Unlock new content based on level
        this.checkLevelUnlocks();

        this.saveProgressionData();
        this.updateProgressionUI();
    }

    // Show level up notification
    showLevelUpNotification() {
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.innerHTML = `
            <div class="level-up-content">
                <div class="level-up-icon">⭐</div>
                <div class="level-up-text">
                    <div class="level-up-title">LEVEL UP!</div>
                    <div class="level-up-level">Level ${this.playerData.level}</div>
                    <div class="level-up-reward">+1 Perk Point</div>
                </div>
            </div>
        `;
        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    // Check for new unlocks based on level
    checkLevelUnlocks() {
        const level = this.playerData.level;

        // Level milestones
        const unlocks = this.getLevelUnlocks();

        unlocks.forEach(unlock => {
            if (unlock.level === level) {
                console.log(`🎉 Unlocked: ${unlock.name}`);

                if (unlock.type === 'skill') {
                    this.playerData.unlockedSkills.push(unlock.id);
                } else if (unlock.type === 'title') {
                    this.playerData.titles.push(unlock.id);
                }
            }
        });
    }

    // Get all level-based unlocks
    getLevelUnlocks() {
        return [
            // Skills
            { level: 3, type: 'skill', id: 'power_strike', name: 'Power Strike' },
            { level: 5, type: 'skill', id: 'healing_potion', name: 'Healing Potion' },
            { level: 5, type: 'class', name: 'Class Selection Unlocked' },
            { level: 7, type: 'skill', id: 'critical_hit', name: 'Critical Hit' },
            { level: 10, type: 'skill', id: 'shield_bash', name: 'Shield Bash' },
            { level: 10, type: 'title', id: 'veteran', name: 'Title: Veteran' },
            { level: 12, type: 'skill', id: 'life_steal', name: 'Life Steal' },
            { level: 15, type: 'skill', id: 'berserker_rage', name: 'Berserker Rage' },
            { level: 15, type: 'title', id: 'champion', name: 'Title: Champion' },
            { level: 20, type: 'skill', id: 'divine_intervention', name: 'Divine Intervention' },
            { level: 20, type: 'title', id: 'legend', name: 'Title: Legend' },
            { level: 25, type: 'title', id: 'master', name: 'Title: Master' },
            { level: 30, type: 'title', id: 'grandmaster', name: 'Title: Grandmaster' }
        ];
    }

    // Get available classes
    getClasses() {
        return [
            {
                id: 'novice',
                name: 'Novice',
                icon: '🎯',
                desc: 'Balanced starter class',
                unlockLevel: 1,
                bonuses: {}
            },
            {
                id: 'warrior',
                name: 'Warrior',
                icon: '⚔️',
                desc: 'High damage, melee specialist',
                unlockLevel: 5,
                bonuses: { strength: 2, attack: 10 }
            },
            {
                id: 'tank',
                name: 'Tank',
                icon: '🛡️',
                desc: 'High HP and defense',
                unlockLevel: 5,
                bonuses: { vitality: 3, defense: 15 }
            },
            {
                id: 'assassin',
                name: 'Assassin',
                icon: '🗡️',
                desc: 'High crit chance and speed',
                unlockLevel: 10,
                bonuses: { agility: 2, luck: 2, critChance: 0.1 }
            },
            {
                id: 'mage',
                name: 'Mage',
                icon: '🔮',
                desc: 'Powerful skills, lower HP',
                unlockLevel: 10,
                bonuses: { skillDamage: 1.25, vitality: -1 }
            },
            {
                id: 'paladin',
                name: 'Paladin',
                icon: '✝️',
                desc: 'Balanced tank with healing',
                unlockLevel: 15,
                bonuses: { vitality: 2, strength: 1, healing: 1.2 }
            },
            {
                id: 'berserker',
                name: 'Berserker',
                icon: '💥',
                desc: 'Glass cannon - high risk, high reward',
                unlockLevel: 15,
                bonuses: { strength: 3, vitality: -2, critDamage: 1.5 }
            }
        ];
    }

    // Get available perks
    getPerks() {
        return [
            // Tier 1 - Basic Perks
            {
                id: 'health_boost',
                name: 'Health Boost',
                tier: 1,
                icon: '💚',
                desc: '+10% Maximum HP',
                maxRank: 3,
                cost: 1,
                requires: null,
                effect: (rank) => ({ maxHPPercent: 0.1 * rank })
            },
            {
                id: 'damage_boost',
                name: 'Damage Boost',
                tier: 1,
                icon: '⚔️',
                desc: '+5% Damage',
                maxRank: 3,
                cost: 1,
                requires: null,
                effect: (rank) => ({ damagePercent: 0.05 * rank })
            },
            {
                id: 'speed_boost',
                name: 'Speed Boost',
                tier: 1,
                icon: '⚡',
                desc: '+5% Attack Speed',
                maxRank: 3,
                cost: 1,
                requires: null,
                effect: (rank) => ({ speedPercent: 0.05 * rank })
            },
            {
                id: 'xp_boost',
                name: 'XP Boost',
                tier: 1,
                icon: '📈',
                desc: '+10% XP gain',
                maxRank: 3,
                cost: 1,
                requires: null,
                effect: (rank) => ({ xpPercent: 0.1 * rank })
            },

            // Tier 2 - Intermediate Perks
            {
                id: 'critical_master',
                name: 'Critical Master',
                tier: 2,
                icon: '💥',
                desc: '+5% Crit Chance',
                maxRank: 2,
                cost: 2,
                requires: 'damage_boost',
                effect: (rank) => ({ critChance: 0.05 * rank })
            },
            {
                id: 'iron_skin',
                name: 'Iron Skin',
                tier: 2,
                icon: '🛡️',
                desc: '+10 Defense',
                maxRank: 2,
                cost: 2,
                requires: 'health_boost',
                effect: (rank) => ({ defense: 10 * rank })
            },
            {
                id: 'swift_striker',
                name: 'Swift Striker',
                tier: 2,
                icon: '⚡',
                desc: 'First attack each combat deals +25% damage',
                maxRank: 1,
                cost: 2,
                requires: 'speed_boost',
                effect: () => ({ firstStrikeDamage: 0.25 })
            },
            {
                id: 'mana_regen',
                name: 'Mana Regeneration',
                tier: 2,
                icon: '💙',
                desc: 'Skills cooldown 10% faster',
                maxRank: 2,
                cost: 2,
                requires: 'xp_boost',
                effect: (rank) => ({ cooldownReduction: 0.1 * rank })
            },

            // Tier 3 - Advanced Perks
            {
                id: 'life_steal',
                name: 'Life Steal',
                tier: 3,
                icon: '🩸',
                desc: 'Heal for 15% of damage dealt',
                maxRank: 1,
                cost: 3,
                requires: 'critical_master',
                effect: () => ({ lifeSteal: 0.15 })
            },
            {
                id: 'last_stand',
                name: 'Last Stand',
                tier: 3,
                icon: '💪',
                desc: 'Survive lethal damage once per run with 1 HP',
                maxRank: 1,
                cost: 3,
                requires: 'iron_skin',
                effect: () => ({ lastStand: true })
            },
            {
                id: 'double_strike',
                name: 'Double Strike',
                tier: 3,
                icon: '⚔️⚔️',
                desc: '15% chance to attack twice',
                maxRank: 1,
                cost: 3,
                requires: 'swift_striker',
                effect: () => ({ doubleStrikeChance: 0.15 })
            },
            {
                id: 'master_learner',
                name: 'Master Learner',
                tier: 3,
                icon: '📚',
                desc: '+25% XP from all sources',
                maxRank: 1,
                cost: 3,
                requires: 'mana_regen',
                effect: () => ({ xpPercent: 0.25 })
            }
        ];
    }

    // Get available titles
    getTitles() {
        return [
            { id: 'novice', name: 'Novice', icon: '🎯', unlockLevel: 1 },
            { id: 'adventurer', name: 'Adventurer', icon: '🗡️', unlockLevel: 3 },
            { id: 'veteran', name: 'Veteran', icon: '⚔️', unlockLevel: 10 },
            { id: 'champion', name: 'Champion', icon: '🏆', unlockLevel: 15 },
            { id: 'legend', name: 'Legend', icon: '⭐', unlockLevel: 20 },
            { id: 'master', name: 'Master', icon: '👑', unlockLevel: 25 },
            { id: 'grandmaster', name: 'Grandmaster', icon: '💎', unlockLevel: 30 }
        ];
    }

    // Calculate XP reward based on activity
    calculateXPReward(activity, details = {}) {
        let baseXP = 0;

        switch (activity) {
            case 'run_complete':
                baseXP = 50;
                // Bonus for speed
                if (details.time && details.time < 300) baseXP += 25;
                // Bonus for deaths
                if (details.deaths === 0) baseXP += 30;
                break;

            case 'pvp_win':
                baseXP = 30;
                // Bonus for ranked
                if (details.ranked) baseXP += 20;
                break;

            case 'pvp_loss':
                baseXP = 10;
                break;

            case 'pvp_draw':
                baseXP = 15;
                break;

            case 'achievement':
                baseXP = details.value || 25;
                break;

            case 'first_daily':
                baseXP = 100;
                break;
        }

        // Apply XP boost perks
        const xpBoost = this.getActivePerkBonus('xpPercent') || 0;
        const finalXP = Math.floor(baseXP * (1 + xpBoost));

        return finalXP;
    }

    // Get active perk bonus
    getActivePerkBonus(statType) {
        let total = 0;
        const perks = this.getPerks();

        for (const perkId in this.playerData.perks) {
            const rank = this.playerData.perks[perkId];
            const perk = perks.find(p => p.id === perkId);
            if (perk) {
                const effect = perk.effect(rank);
                if (effect[statType]) {
                    total += effect[statType];
                }
            }
        }

        return total;
    }

    // Apply class bonuses to stats
    applyClassBonuses(baseStats) {
        const classes = this.getClasses();
        const playerClass = classes.find(c => c.id === this.playerData.selectedClass);

        if (!playerClass || !playerClass.bonuses) return baseStats;

        const modifiedStats = { ...baseStats };

        for (const [stat, bonus] of Object.entries(playerClass.bonuses)) {
            if (modifiedStats[stat] !== undefined) {
                modifiedStats[stat] += bonus;
            } else {
                modifiedStats[stat] = bonus;
            }
        }

        return modifiedStats;
    }

    // Select a class
    selectClass(classId) {
        const classes = this.getClasses();
        const selectedClass = classes.find(c => c.id === classId);

        if (!selectedClass) {
            console.error('Class not found:', classId);
            return false;
        }

        if (this.playerData.level < selectedClass.unlockLevel) {
            alert(`This class unlocks at level ${selectedClass.unlockLevel}`);
            return false;
        }

        this.playerData.selectedClass = classId;
        this.saveProgressionData();
        this.updateProgressionUI();

        console.log(`Class changed to: ${selectedClass.name}`);
        return true;
    }

    // Unlock a perk
    unlockPerk(perkId) {
        const perks = this.getPerks();
        const perk = perks.find(p => p.id === perkId);

        if (!perk) return false;

        // Check if already at max rank
        const currentRank = this.playerData.perks[perkId] || 0;
        if (currentRank >= perk.maxRank) {
            alert('Perk already at maximum rank!');
            return false;
        }

        // Check perk points
        if (this.playerData.perkPoints < perk.cost) {
            alert('Not enough perk points!');
            return false;
        }

        // Check requirements
        if (perk.requires && !this.playerData.perks[perk.requires]) {
            const requiredPerk = perks.find(p => p.id === perk.requires);
            alert(`Requires: ${requiredPerk.name}`);
            return false;
        }

        // Unlock perk
        this.playerData.perks[perkId] = currentRank + 1;
        this.playerData.perkPoints -= perk.cost;

        this.saveProgressionData();
        this.renderProgressionScreen();

        console.log(`Unlocked ${perk.name} (Rank ${this.playerData.perks[perkId]})`);
        return true;
    }

    // Equip title
    equipTitle(titleId) {
        if (!this.playerData.titles.includes(titleId)) {
            alert('Title not unlocked!');
            return false;
        }

        this.playerData.equippedTitle = titleId;
        this.saveProgressionData();
        this.renderProgressionScreen();
        return true;
    }

    // Update progression UI on main menu
    updateProgressionUI() {
        const levelDisplay = document.getElementById('player-level-display');
        const classDisplay = document.getElementById('player-class-display');
        const xpBarFill = document.getElementById('xp-bar-fill');
        const xpBarText = document.getElementById('xp-bar-text');

        if (levelDisplay) {
            levelDisplay.textContent = `Level ${this.playerData.level}`;
        }

        if (classDisplay) {
            const classes = this.getClasses();
            const playerClass = classes.find(c => c.id === this.playerData.selectedClass);
            classDisplay.textContent = playerClass ? playerClass.name : 'Novice';
        }

        const xpNeeded = this.getXPForLevel(this.playerData.level);
        const xpProgress = (this.playerData.xp / xpNeeded) * 100;

        if (xpBarFill) {
            xpBarFill.style.width = `${xpProgress}%`;
        }

        if (xpBarText) {
            xpBarText.textContent = `${this.playerData.xp} / ${xpNeeded} XP`;
        }
    }

    // Render progression screen
    renderProgressionScreen() {
        // Update level display
        document.getElementById('progression-level').textContent = this.playerData.level;

        const xpNeeded = this.getXPForLevel(this.playerData.level);
        const xpProgress = (this.playerData.xp / xpNeeded) * 100;

        document.getElementById('progression-xp-fill').style.width = `${xpProgress}%`;
        document.getElementById('progression-xp-text').textContent = `${this.playerData.xp} / ${xpNeeded} XP`;
        document.getElementById('total-xp').textContent = this.playerData.totalXP;
        document.getElementById('xp-to-next').textContent = `${xpNeeded - this.playerData.xp} XP`;
        document.getElementById('perk-points').textContent = this.playerData.perkPoints;

        // Render classes
        this.renderClasses();

        // Render skill unlocks
        this.renderSkillUnlocks();

        // Render perk tree
        this.renderPerkTree();

        // Render titles
        this.renderTitles();
    }

    // Render class selection
    renderClasses() {
        const container = document.getElementById('class-selection-grid');
        if (!container) return;

        const classes = this.getClasses();
        let html = '';

        classes.forEach(cls => {
            const isUnlocked = this.playerData.level >= cls.unlockLevel;
            const isSelected = this.playerData.selectedClass === cls.id;

            html += `
                <div class="class-card ${!isUnlocked ? 'locked' : ''} ${isSelected ? 'selected' : ''}"
                     onclick="${isUnlocked ? `game.progressionSystem.selectClass('${cls.id}')` : ''}">
                    <div class="class-icon">${cls.icon}</div>
                    <div class="class-name">${cls.name}</div>
                    <div class="class-desc">${cls.desc}</div>
                    ${!isUnlocked ? `<div class="class-unlock">Unlocks at Level ${cls.unlockLevel}</div>` : ''}
                    ${isSelected ? '<div class="class-selected-badge">✓ Active</div>' : ''}
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Render skill unlocks
    renderSkillUnlocks() {
        const container = document.getElementById('skill-unlocks-grid');
        if (!container) return;

        const unlocks = this.getLevelUnlocks().filter(u => u.type === 'skill');
        let html = '';

        unlocks.forEach(unlock => {
            const isUnlocked = this.playerData.level >= unlock.level;

            html += `
                <div class="unlock-card ${!isUnlocked ? 'locked' : ''}">
                    <div class="unlock-level">Level ${unlock.level}</div>
                    <div class="unlock-name">${unlock.name}</div>
                    ${isUnlocked ? '<div class="unlock-badge">✓ Unlocked</div>' : '<div class="unlock-badge locked-badge">🔒 Locked</div>'}
                </div>
            `;
        });

        container.innerHTML = html || '<p>No skill unlocks available</p>';
    }

    // Render perk tree
    renderPerkTree() {
        const container = document.getElementById('perk-tree');
        if (!container) return;

        const perks = this.getPerks();
        let html = '';

        // Group by tier
        const tiers = [1, 2, 3];

        tiers.forEach(tier => {
            const tierPerks = perks.filter(p => p.tier === tier);

            html += `<div class="perk-tier">`;
            html += `<h4 class="perk-tier-label">Tier ${tier}</h4>`;
            html += `<div class="perk-tier-grid">`;

            tierPerks.forEach(perk => {
                const currentRank = this.playerData.perks[perk.id] || 0;
                const canUnlock = this.playerData.perkPoints >= perk.cost &&
                                  currentRank < perk.maxRank &&
                                  (!perk.requires || this.playerData.perks[perk.requires]);

                html += `
                    <div class="perk-card ${!canUnlock ? 'perk-locked' : ''}"
                         onclick="${canUnlock ? `game.progressionSystem.unlockPerk('${perk.id}')` : ''}">
                        <div class="perk-icon">${perk.icon}</div>
                        <div class="perk-info">
                            <div class="perk-name">${perk.name}</div>
                            <div class="perk-desc">${perk.desc}</div>
                            <div class="perk-rank">Rank: ${currentRank} / ${perk.maxRank}</div>
                            <div class="perk-cost">Cost: ${perk.cost} points</div>
                            ${perk.requires ? `<div class="perk-requires">Requires: ${perks.find(p => p.id === perk.requires).name}</div>` : ''}
                        </div>
                    </div>
                `;
            });

            html += `</div></div>`;
        });

        container.innerHTML = html;
    }

    // Render titles
    renderTitles() {
        const container = document.getElementById('title-grid');
        if (!container) return;

        const titles = this.getTitles();
        let html = '';

        titles.forEach(title => {
            const isUnlocked = this.playerData.titles.includes(title.id) || this.playerData.level >= title.unlockLevel;
            const isEquipped = this.playerData.equippedTitle === title.id;

            html += `
                <div class="title-card ${!isUnlocked ? 'locked' : ''} ${isEquipped ? 'equipped' : ''}"
                     onclick="${isUnlocked ? `game.progressionSystem.equipTitle('${title.id}')` : ''}">
                    <div class="title-icon">${title.icon}</div>
                    <div class="title-name">${title.name}</div>
                    ${!isUnlocked ? `<div class="title-unlock">Level ${title.unlockLevel}</div>` : ''}
                    ${isEquipped ? '<div class="title-equipped-badge">✓ Equipped</div>' : ''}
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Save progression data
    saveProgressionData() {
        localStorage.setItem('dungeonaut_progression', JSON.stringify(this.playerData));

        // Also save to Firebase if logged in
        if (this.game.authSystem && this.game.authSystem.isLoggedIn()) {
            this.game.authSystem.saveStatsToCloud({
                progression: this.playerData
            });
        }
    }

    // Load progression data
    loadProgressionData() {
        const saved = localStorage.getItem('dungeonaut_progression');
        return saved ? JSON.parse(saved) : null;
    }
}