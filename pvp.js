// ===== PVP SYSTEM FOR DUNGEONAUT =====

class PvPSystem {
    constructor(game) {
        this.game = game;
        this.currentMatch = null;
        this.aiOpponent = null;
    }

    // ===== PVP SKILLS SYSTEM =====
    getPvPSkills() {
        return [
            // BURST SKILLS
            {
                id: 'shadow_strike',
                name: '🗡️ Shadow Strike',
                type: 'burst',
                priority: 'normal',
                cooldown: 3,
                desc: 'Deal 120% damage, +30% if target stunned',
                execute: (attacker, defender) => {
                    let damage = attacker.attack * 1.2;
                    if (defender.status.stunned) {
                        damage *= 1.3;
                    }
                    return {
                        damage: Math.floor(damage),
                        message: `${attacker.name} strikes from the shadows!`,
                        bonusMessage: defender.status.stunned ? ' (Bonus damage on stunned target!)' : ''
                    };
                }
            },
            {
                id: 'devastating_blow',
                name: '💥 Devastating Blow',
                type: 'burst',
                priority: 'normal',
                cooldown: 4,
                desc: 'Deal 160% damage, exhausts self for 2 turns',
                execute: (attacker, defender) => {
                    attacker.status.exhausted = 2;
                    return {
                        damage: Math.floor(attacker.attack * 1.6),
                        message: `${attacker.name} unleashes a devastating blow!`,
                        selfEffect: 'Exhausted for 2 turns'
                    };
                }
            },
            {
                id: 'execute',
                name: '⚔️ Execute',
                type: 'burst',
                priority: 'normal',
                cooldown: 5,
                desc: 'Deal 100% damage, +50% if target below 40% HP',
                execute: (attacker, defender) => {
                    let damage = attacker.attack;
                    if (defender.hp / defender.maxHp < 0.4) {
                        damage *= 1.5;
                    }
                    return {
                        damage: Math.floor(damage),
                        message: `${attacker.name} attempts an execution!`,
                        bonusMessage: defender.hp / defender.maxHp < 0.4 ? ' (Low HP bonus!)' : ''
                    };
                }
            },

            // CONTROL SKILLS
            {
                id: 'stunning_strike',
                name: '💫 Stunning Strike',
                type: 'control',
                priority: 'normal',
                cooldown: 4,
                desc: 'Deal 80% damage and stun for 1 turn',
                execute: (attacker, defender) => {
                    if (!defender.status.stunned && defender.statusResistance < Math.random()) {
                        defender.status.stunned = 1;
                        return {
                            damage: Math.floor(attacker.attack * 0.8),
                            message: `${attacker.name} lands a stunning strike!`,
                            statusEffect: 'Stunned for 1 turn'
                        };
                    }
                    return {
                        damage: Math.floor(attacker.attack * 0.8),
                        message: `${attacker.name}'s stunning strike hits, but ${defender.name} resists!`
                    };
                }
            },
            {
                id: 'silence',
                name: '🔇 Silence',
                type: 'control',
                priority: 'high',
                cooldown: 3,
                desc: 'Prevent target from using skills for 2 turns',
                execute: (attacker, defender) => {
                    if (defender.statusResistance < Math.random()) {
                        defender.status.silenced = 2;
                        return {
                            damage: 0,
                            message: `${attacker.name} silences ${defender.name}!`,
                            statusEffect: 'Silenced for 2 turns'
                        };
                    }
                    return {
                        damage: 0,
                        message: `${defender.name} resists the silence!`
                    };
                }
            },
            {
                id: 'slow',
                name: '🐌 Crippling Slow',
                type: 'control',
                priority: 'normal',
                cooldown: 3,
                desc: 'Reduce target speed by 50% for 3 turns',
                execute: (attacker, defender) => {
                    defender.status.slowed = 3;
                    defender.currentSpeed = defender.speed * 0.5;
                    return {
                        damage: 0,
                        message: `${attacker.name} slows ${defender.name}!`,
                        statusEffect: 'Speed reduced by 50%'
                    };
                }
            },

            // MOBILITY SKILLS
            {
                id: 'dodge_roll',
                name: '🌀 Dodge Roll',
                type: 'mobility',
                priority: 'high',
                cooldown: 3,
                desc: 'Evade next attack and counter for 60% damage',
                execute: (attacker, defender) => {
                    attacker.status.dodging = 1;
                    return {
                        damage: 0,
                        message: `${attacker.name} prepares to dodge!`,
                        selfEffect: 'Dodging next attack'
                    };
                }
            },
            {
                id: 'rapid_assault',
                name: '⚡ Rapid Assault',
                type: 'mobility',
                priority: 'high',
                cooldown: 4,
                desc: 'Strike first, deal 90% damage',
                execute: (attacker, defender) => {
                    return {
                        damage: Math.floor(attacker.attack * 0.9),
                        message: `${attacker.name} strikes with incredible speed!`,
                        alwaysFirst: true
                    };
                }
            },
            {
                id: 'feint',
                name: '🎭 Feint',
                type: 'mobility',
                priority: 'normal',
                cooldown: 2,
                desc: 'Deal 50% damage, reset one skill cooldown',
                execute: (attacker, defender) => {
                    // Reset shortest cooldown skill
                    let resetSkill = null;
                    attacker.skills.forEach(skill => {
                        if (skill.currentCooldown > 0) {
                            if (!resetSkill || skill.currentCooldown < resetSkill.currentCooldown) {
                                resetSkill = skill;
                            }
                        }
                    });
                    if (resetSkill) {
                        resetSkill.currentCooldown = 0;
                    }
                    return {
                        damage: Math.floor(attacker.attack * 0.5),
                        message: `${attacker.name} feints and resets a cooldown!`,
                        selfEffect: resetSkill ? `${resetSkill.name} ready!` : ''
                    };
                }
            },

            // SUSTAIN SKILLS
            {
                id: 'healing_light',
                name: '💚 Healing Light',
                type: 'sustain',
                priority: 'normal',
                cooldown: 4,
                desc: 'Restore 30% max HP',
                execute: (attacker, defender) => {
                    const heal = Math.floor(attacker.maxHp * 0.3);
                    attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
                    return {
                        damage: 0,
                        healing: heal,
                        message: `${attacker.name} heals for ${heal} HP!`,
                        selfEffect: 'Restored HP'
                    };
                }
            },
            {
                id: 'barrier',
                name: '🛡️ Barrier',
                type: 'sustain',
                priority: 'high',
                cooldown: 4,
                desc: 'Shield for 40% max HP for 2 turns',
                execute: (attacker, defender) => {
                    attacker.shield = Math.floor(attacker.maxHp * 0.4);
                    attacker.status.shielded = 2;
                    return {
                        damage: 0,
                        message: `${attacker.name} raises a barrier!`,
                        selfEffect: `Shield: ${attacker.shield} HP`
                    };
                }
            },
            {
                id: 'life_steal',
                name: '🧛 Life Steal',
                type: 'sustain',
                priority: 'normal',
                cooldown: 3,
                desc: 'Deal 70% damage, heal for 100% of damage dealt',
                execute: (attacker, defender) => {
                    const damage = Math.floor(attacker.attack * 0.7);
                    attacker.hp = Math.min(attacker.maxHp, attacker.hp + damage);
                    return {
                        damage: damage,
                        healing: damage,
                        message: `${attacker.name} drains life from ${defender.name}!`
                    };
                }
            },

            // UTILITY SKILLS
            {
                id: 'cleanse',
                name: '✨ Cleanse',
                type: 'utility',
                priority: 'high',
                cooldown: 5,
                desc: 'Remove all debuffs and gain immunity for 1 turn',
                execute: (attacker, defender) => {
                    attacker.status = {
                        immune: 1
                    };
                    return {
                        damage: 0,
                        message: `${attacker.name} cleanses all debuffs!`,
                        selfEffect: 'Immune for 1 turn'
                    };
                }
            },
            {
                id: 'weaken',
                name: '💀 Weaken',
                type: 'utility',
                priority: 'normal',
                cooldown: 3,
                desc: 'Target takes +25% damage for 3 turns',
                execute: (attacker, defender) => {
                    defender.status.vulnerable = 3;
                    return {
                        damage: 0,
                        message: `${attacker.name} weakens ${defender.name}!`,
                        statusEffect: 'Vulnerable: +25% damage taken'
                    };
                }
            },
            {
                id: 'power_up',
                name: '💪 Power Up',
                type: 'utility',
                priority: 'low',
                cooldown: 5,
                desc: 'Increase attack by 40% for 4 turns',
                execute: (attacker, defender) => {
                    attacker.status.powered = 4;
                    attacker.attack = Math.floor(attacker.baseAttack * 1.4);
                    return {
                        damage: 0,
                        message: `${attacker.name} powers up!`,
                        selfEffect: 'Attack +40% for 4 turns'
                    };
                }
            }
        ];
    }

    // ===== TYPE ADVANTAGE SYSTEM =====
    getTypeMatchup(attackerType, defenderType) {
        const advantages = {
            burst: { strong: 'sustain', weak: 'control' },
            control: { strong: 'mobility', weak: 'burst' },
            mobility: { strong: 'burst', weak: 'sustain' },
            sustain: { strong: 'control', weak: 'mobility' },
            utility: { strong: null, weak: null }
        };

        const matchup = advantages[attackerType];
        if (!matchup) return 1.0;

        if (matchup.strong === defenderType) return 1.15; // +15% advantage
        if (matchup.weak === defenderType) return 0.9;    // -10% disadvantage
        return 1.0;
    }

    // ===== MATCH INITIALIZATION =====
    startPvPMatch(isRanked = false) {
        // For MVP, create an AI opponent with similar stats
        const playerStats = this.game.state.stats;

        this.currentMatch = {
            isRanked: isRanked,
            turn: 0,
            maxTurns: 30,

            player: {
                name: 'You',
                hp: 100 + (playerStats.vitality * 10),
                maxHp: 100 + (playerStats.vitality * 10),
                baseAttack: 10 + (playerStats.strength * 3),
                attack: 10 + (playerStats.strength * 3),
                speed: 100 + (playerStats.agility * 5),
                currentSpeed: 100 + (playerStats.agility * 5),
                critChance: 0.1 + (playerStats.luck * 0.05),
                statusResistance: 0.2,
                shield: 0,
                selectedSkills: [],
                selectedAction: null,
                status: {},
                isPlayer: true
            },

            opponent: {
                name: 'Rival',
                hp: 120,
                maxHp: 120,
                baseAttack: 12,
                attack: 12,
                speed: 110,
                currentSpeed: 110,
                critChance: 0.15,
                statusResistance: 0.25,
                shield: 0,
                selectedSkills: [],
                selectedAction: null,
                status: {},
                isPlayer: false
            },

            battleLog: [],
            winner: null
        };

        // Initialize skill cooldowns
        this.currentMatch.player.skills = this.currentMatch.player.selectedSkills.map(s => ({
            ...s,
            currentCooldown: 0
        }));

        this.currentMatch.opponent.skills = this.currentMatch.opponent.selectedSkills.map(s => ({
            ...s,
            currentCooldown: 0
        }));

        return this.currentMatch;
    }

    // ===== TURN RESOLUTION =====
    resolveTurn() {
        const match = this.currentMatch;
        const player = match.player;
        const opponent = match.opponent;

        match.turn++;
        const turnLog = { turn: match.turn, events: [] };

        // Update status effects at start of turn
        this.updateStatusEffects(player);
        this.updateStatusEffects(opponent);

        // Check if anyone is stunned
        if (player.status.stunned) {
            turnLog.events.push({ message: `${player.name} is stunned and cannot act!`, type: 'status' });
            player.status.stunned--;
            player.selectedAction = null;
        }

        if (opponent.status.stunned) {
            turnLog.events.push({ message: `${opponent.name} is stunned and cannot act!`, type: 'status' });
            opponent.status.stunned--;
            opponent.selectedAction = null;
        }

        // Determine action order based on priority and speed
        const actions = [];

        if (player.selectedAction) {
            actions.push({ actor: player, target: opponent, action: player.selectedAction });
        }

        if (opponent.selectedAction) {
            actions.push({ actor: opponent, target: player, action: opponent.selectedAction });
        }

        // Sort by priority first, then speed
        actions.sort((a, b) => {
            const priorityOrder = { high: 3, normal: 2, low: 1 };
            const aPriority = priorityOrder[a.action.priority] || 2;
            const bPriority = priorityOrder[b.action.priority] || 2;

            if (aPriority !== bPriority) return bPriority - aPriority;
            return b.actor.currentSpeed - a.actor.currentSpeed;
        });

        // Execute actions
        actions.forEach(({ actor, target, action }) => {
            if (actor.hp <= 0 || target.hp <= 0) return;

            if (action.id === 'basic_attack') {
                const result = this.executeBasicAttack(actor, target);
                turnLog.events.push(result);
            } else if (action.id === 'guard') {
                const result = this.executeGuard(actor);
                turnLog.events.push(result);
            } else {
                const result = this.executeSkill(actor, target, action);
                turnLog.events.push(result);

                // Put skill on cooldown
                const skill = actor.skills.find(s => s.id === action.id);
                if (skill) {
                    skill.currentCooldown = skill.cooldown;
                    if (actor.status.exhausted) {
                        skill.currentCooldown += 1;
                    }
                }
            }

            // Check for KO
            if (target.hp <= 0) {
                turnLog.events.push({
                    message: `${target.name} has been defeated!`,
                    type: 'ko'
                });
                match.winner = actor.name;
            }
        });

        // Decrement cooldowns at end of turn
        [player, opponent].forEach(fighter => {
            fighter.skills.forEach(skill => {
                if (skill.currentCooldown > 0) {
                    skill.currentCooldown--;
                }
            });
        });

        // Clear selected actions
        player.selectedAction = null;
        opponent.selectedAction = null;

        match.battleLog.push(turnLog);

        // Check for time limit
        if (match.turn >= match.maxTurns && !match.winner) {
            turnLog.events.push({
                message: 'Time limit reached! Match is a draw.',
                type: 'draw'
            });
            match.winner = 'draw';
        }

        return turnLog;
    }

    executeBasicAttack(attacker, defender) {
        // Check dodge
        if (defender.status.dodging) {
            defender.status.dodging = 0;
            const counterDamage = Math.floor(attacker.attack * 0.6);
            attacker.hp -= counterDamage;
            return {
                message: `${defender.name} dodges ${attacker.name}'s Basic Attack and counters for ${counterDamage} damage!`,
                type: 'counter',
                damage: counterDamage,
                target: attacker.name,
                actionName: 'Basic Attack'
            };
        }

        const damageResult = this.calculateDamage(attacker, defender, attacker.attack, 'basic');
        defender.hp -= damageResult.damage;
        if (defender.hp < 0) defender.hp = 0;

        const critText = damageResult.isCrit ? ' 💥 CRITICAL HIT!' : '';
        return {
            message: `${attacker.name} uses Basic Attack for ${damageResult.damage} damage!${critText}`,
            type: 'attack',
            damage: damageResult.damage,
            target: defender.name,
            isCrit: damageResult.isCrit,
            actionName: 'Basic Attack'
        };
    }

    executeGuard(actor) {
        actor.status.guarding = 1;
        const shieldGain = Math.floor(actor.maxHp * 0.2);
        actor.shield += shieldGain;
        return {
            message: `${actor.name} uses Guard! Gains ${shieldGain} shield!`,
            type: 'defense',
            effect: 'Guarding (+20% shield)',
            actionName: 'Guard'
        };
    }

    executeSkill(attacker, defender, skill) {
        // Check if silenced
        if (attacker.status.silenced) {
            return {
                message: `${attacker.name} is silenced and cannot use ${skill.name}!`,
                type: 'blocked',
                actionName: skill.name
            };
        }

        // Execute skill
        const result = skill.execute(attacker, defender);
        result.actionName = skill.name;

        // Apply type advantage
        const typeMultiplier = this.getTypeMatchup(skill.type, defender.dominantType || 'sustain');
        if (result.damage) {
            result.damage = Math.floor(result.damage * typeMultiplier);
        }

        // Apply damage with crit check
        if (result.damage) {
            const damageResult = this.calculateDamage(attacker, defender, result.damage, skill.type);
            defender.hp -= damageResult.damage;
            if (defender.hp < 0) defender.hp = 0;

            result.finalDamage = damageResult.damage;
            result.isCrit = damageResult.isCrit;

            // Update message with crit indicator and actual damage
            if (damageResult.isCrit) {
                result.message += ` Deals ${damageResult.damage} damage! 💥 CRITICAL HIT!`;
            } else if (damageResult.damage > 0) {
                result.message += ` Deals ${damageResult.damage} damage!`;
            }
        }

        result.type = 'skill';
        result.skillType = skill.type;
        return result;
    }

    calculateDamage(attacker, defender, baseDamage, damageType) {
        let damage = baseDamage;
        let isCrit = false;

        // Check for crit
        if (Math.random() < attacker.critChance) {
            damage *= 1.5;
            isCrit = true;
        }

        // Apply vulnerable status
        if (defender.status.vulnerable) {
            damage *= 1.25;
        }

        // Apply guarding status
        if (defender.status.guarding) {
            damage *= 0.5;
            defender.status.guarding = 0;
        }

        // Apply shield
        if (defender.shield > 0) {
            if (defender.shield >= damage) {
                defender.shield -= damage;
                return { damage: 0, isCrit: isCrit };
            } else {
                damage -= defender.shield;
                defender.shield = 0;
            }
        }

        return { damage: Math.floor(damage), isCrit: isCrit };
    }

    updateStatusEffects(fighter) {
        // Decrement status durations
        Object.keys(fighter.status).forEach(status => {
            if (typeof fighter.status[status] === 'number') {
                fighter.status[status]--;
                if (fighter.status[status] <= 0) {
                    delete fighter.status[status];

                    // Remove effects
                    if (status === 'powered') {
                        fighter.attack = fighter.baseAttack;
                    }
                    if (status === 'slowed') {
                        fighter.currentSpeed = fighter.speed;
                    }
                }
            }
        });
    }

    // ===== AI OPPONENT =====
    selectAIAction() {
        const opponent = this.currentMatch.opponent;
        const player = this.currentMatch.player;

        // Simple AI logic
        const availableSkills = opponent.skills.filter(s => s.currentCooldown === 0);

        // Prioritize healing if low HP
        if (opponent.hp / opponent.maxHp < 0.3) {
            const healSkill = availableSkills.find(s => s.type === 'sustain');
            if (healSkill) {
                opponent.selectedAction = healSkill;
                return;
            }
        }

        // Use control skills if available
        if (Math.random() < 0.3 && availableSkills.length > 0) {
            const controlSkill = availableSkills.find(s => s.type === 'control');
            if (controlSkill) {
                opponent.selectedAction = controlSkill;
                return;
            }
        }

        // Use burst skills if available
        if (availableSkills.length > 0) {
            const burstSkill = availableSkills.find(s => s.type === 'burst');
            if (burstSkill) {
                opponent.selectedAction = burstSkill;
                return;
            }
        }

        // Use any available skill
        if (availableSkills.length > 0) {
            opponent.selectedAction = availableSkills[Math.floor(Math.random() * availableSkills.length)];
            return;
        }

        // Default to basic attack
        opponent.selectedAction = { id: 'basic_attack', name: 'Basic Attack', priority: 'normal' };
    }

    // ===== LEADERBOARD =====
    savePvPResult(winner, loser, turns) {
        if (!this.game.state.pvpLeaderboard) {
            this.game.state.pvpLeaderboard = {
                ranked: [],
                unranked: []
            };
        }

        const entry = {
            playerName: this.game.state.playerName,
            result: winner === 'You' ? 'win' : 'loss',
            turns: turns,
            date: new Date().toISOString()
        };

        const board = this.currentMatch.isRanked ? 'ranked' : 'unranked';
        this.game.state.pvpLeaderboard[board].push(entry);

        this.game.saveToStorage();
    }
}

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PvPSystem;
}
