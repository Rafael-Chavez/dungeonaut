# 🎮 Dungeonaut - Speedrun RPG

A browser-based roguelike speedrunning game where you optimize builds and routes to achieve the fastest dungeon clear times!

## 🚀 Quick Start

### Single Player / Local AI
Simply open `index.html` in your web browser to start playing. No installation required!

### Online Multiplayer (Local Development)
1. Install Node.js (if not already installed)
2. Run `npm install` to install dependencies
3. Start the server: `npm start`
4. Open `index.html` in your browser
5. Challenge real players online!

See [MULTIPLAYER_SETUP.md](MULTIPLAYER_SETUP.md) for local setup.

### Deploy to Production
Hosting on Vercel or another platform? See [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) for complete deployment instructions.

## 🎯 Game Features

### Core Mechanics
- **Daily Procedural Dungeons** - Every day features a new dungeon with the same seed for all players, ensuring fair competition
- **Stamina System** - Limited to 5 runs per day to encourage optimization over grinding
- **Auto-Battle Combat** - Strategic planning meets deterministic execution
- **Time-Based Scoring** - Every second counts, with penalties for deaths and bonuses for perfect play

### Pre-Run Planning
Before each run, customize your character:
- **Stat Allocation** - Distribute 10 points across Strength, Vitality, Agility, and Luck
- **Gear Selection** - Choose weapon, armor, and accessory with different durability ratings
- **Skill Loadout** - Pick 3 skills from 6 available options, each with unique cooldowns

### Dungeon Structure
- **10 Rooms** including combat, traps, shrines, and a final boss
- **Dynamic Encounters** - Enemy composition and room types vary based on daily seed
- **Risk/Reward** - Shrine rooms provide buffs but trap rooms deal damage

### Daily Modifiers
Each day features a unique gameplay modifier:
- **Swift Enemies** - Enemies attack 30% faster
- **Reduced Cooldowns** - All skill cooldowns reduced by 20%
- **Fragile Gear** - Durability loss increased by 50%
- **Lucky Day** - Critical hit chance increased by 15%
- **Tough Monsters** - Enemy HP increased by 40%

### Scoring System
Your final time is calculated as:
```
Final Time = Base Time + Combat Time + Death Penalties + Gear Break Penalties - Speed Bonuses
```

- **Death Penalty**: +30 seconds per death
- **Gear Break Penalty**: +15 seconds per broken item
- **Speed Bonuses**: Awarded for efficient clears and perfect rooms

### Leaderboards
- **Daily** - Compete on today's dungeon seed
- **Weekly** - Track your best times over the past week
- **All-Time** - The ultimate hall of fame

### ⚔️ PvP Arena - Tactical Turn-Based Combat

Battle against AI opponents in strategic 1v1 matches! PvP mode features:

#### Combat Philosophy
- **Turn-Based Strategy** - Predictive decision-making over reaction speed
- **Simultaneous Actions** - Both players select actions, then resolve based on priority and speed
- **Deterministic Outcomes** - Fair, skill-based combat with minimal RNG
- **Build > Execution** - Your stat allocation and skill selection matter most

#### PvP Skill System (16 Skills Across 5 Types)

**BURST Skills** - High damage, long cooldowns
- Shadow Strike: 120% damage, bonus vs stunned targets
- Devastating Blow: 160% damage, exhausts self
- Execute: Bonus damage vs low HP enemies

**CONTROL Skills** - Disable and debilitate
- Stunning Strike: Damage + stun for 1 turn
- Silence: Prevent skills for 2 turns
- Crippling Slow: Reduce speed by 50%

**MOBILITY Skills** - Speed and evasion
- Dodge Roll: Evade next attack and counter
- Rapid Assault: Strike first with priority
- Feint: Light damage + reset cooldown

**SUSTAIN Skills** - Healing and defense
- Healing Light: Restore 30% max HP
- Barrier: Shield for 40% max HP
- Life Steal: Damage + heal for 100% of damage

**UTILITY Skills** - Buffs and debuffs
- Cleanse: Remove debuffs + immunity
- Weaken: Target takes +25% damage
- Power Up: Increase attack by 40%

#### Type Advantage System
Skills gain bonuses based on type matchups:
- **Burst** > Sustain (but weak to Control)
- **Control** > Mobility (but weak to Burst)
- **Mobility** > Burst (but weak to Sustain)
- **Sustain** > Control (but weak to Mobility)
- **Utility** - Neutral (no advantages/weaknesses)

Advantages: +15% effectiveness | Disadvantages: -10% effectiveness

#### Priority System
Actions resolve in this order:
1. **High Priority** - Guard, Silence, Dodge, Rapid Assault, Cleanse
2. **Normal Priority** - Most skills, Basic Attack
3. **Low Priority** - Power Up (charge-up moves)

*Speed stat breaks ties within the same priority*

#### Status Effects
- **Stun** - Skip next turn
- **Silence** - Cannot use skills
- **Vulnerable** - Take +25% damage
- **Guarding** - Reduce incoming damage by 50%
- **Exhausted** - Cooldowns recover slower
- **Powered** - Increased attack damage
- **Slowed** - Reduced speed
- **Dodging** - Evade next attack
- **Immune** - Cannot receive debuffs
- **Shielded** - Absorb damage before HP

#### Battle Modes
- **Ranked Match** - Compete for wins/losses, affect your arena record
- **Practice Match** - Test builds and strategies with no consequences

#### Turn Resolution
Each turn:
1. Both players select one action (skill, basic attack, or guard)
2. Actions resolve simultaneously based on priority → speed
3. Status effects update
4. Cooldowns decrement
5. Win on KO or after 30 turn time limit (draw)

### Ghost Stats
Study the top player's run with detailed breakdowns:
- Room-by-room completion times
- Skill usage timestamps
- Route decisions and strategies

## 🎮 How to Play

1. **Main Menu**
   - View today's daily seed and modifier
   - Check your remaining stamina (resets daily)
   - Access leaderboards and ghost stats

2. **Planning Phase**
   - Allocate 10 stat points wisely
   - Select a weapon (required)
   - Optionally choose armor and an accessory
   - Pick 3 skills from the available pool
   - Click "Begin Run" when ready

3. **Dungeon Run**
   - Watch the auto-battle unfold in real-time
   - Monitor your HP, timer, and room progress
   - Skills will be used automatically based on cooldowns
   - Navigate through 10 rooms to reach the boss

4. **Results**
   - Review your final time and breakdown
   - See your rank on the daily leaderboard
   - Analyze what went well and what to improve

5. **PvP Arena**
   - Select Ranked or Practice mode
   - Build your fighter: allocate stats and pick 4 skills
   - Each turn, choose: Basic Attack, Guard, or a Skill
   - Confirm your action and watch the battle unfold
   - Outsmart your opponent with priority plays and type advantages

## 📊 Strategy Tips

### Speedrun (PvE) Builds

### Stat Builds
- **Strength** - Increases damage output (3 DMG per point)
- **Vitality** - Increases max HP (10 HP per point)
- **Agility** - Increases movement and attack speed
- **Luck** - Increases critical hit chance (5% per point)

### Gear Synergies
- **Quick Dagger** - Pairs well with high Agility for rapid attacks
- **Battle Axe** - Maximize with Strength for devastating hits
- **Magic Robe** - Reduces cooldowns for skill-heavy builds
- **Speed Amulet** - Great for speedrunning strategies

### Skill Combos (PvE)
- **Power Slash + Critical Strike** - Massive burst damage
- **Healing Touch + Shield Block** - Survivability focus
- **Haste + Life Drain** - Sustain damage output
- Mix offensive and defensive skills for balanced runs

### PvP Arena Strategies

**Aggressive Burst Build**
- Stats: 5 STR, 2 VIT, 2 AGI, 1 LCK
- Skills: Shadow Strike, Execute, Devastating Blow, Weaken
- Strategy: Apply Weaken, then unleash burst combo for massive damage

**Control Lockdown Build**
- Stats: 2 STR, 4 VIT, 3 AGI, 1 LCK
- Skills: Stunning Strike, Silence, Crippling Slow, Healing Light
- Strategy: Chain CC to prevent opponent actions, sustain through healing

**Mobility Counter Build**
- Stats: 3 STR, 3 VIT, 3 AGI, 1 LCK
- Skills: Dodge Roll, Rapid Assault, Feint, Life Steal
- Strategy: Use Dodge to counter burst, reset cooldowns with Feint, sustain with Life Steal

**Tank Sustain Build**
- Stats: 2 STR, 6 VIT, 1 AGI, 1 LCK
- Skills: Barrier, Healing Light, Power Up, Life Steal
- Strategy: Outlast opponent with shields and healing, Power Up for late-game damage

**Mind Games & Priority**
- Guard beats predictable burst skills
- High-priority Silence/Dodge can shut down opponent's plans
- Power Up on Low Priority telegraphs intent—bait Guard, then Execute
- Speed advantage matters: Agility investment can win priority ties

## 💾 Save System

Your progress is automatically saved to your browser's local storage:
- Stamina resets daily at midnight
- Leaderboard entries persist across sessions
- All run statistics are stored locally

## 🔧 Technical Details

- **Built with**: Pure HTML, CSS, and JavaScript (no frameworks)
- **Storage**: LocalStorage API for save data
- **Seed System**: Deterministic procedural generation using date-based seeds
- **UI**: Glassmorphism design with smooth animations
- **Compatibility**: Works in all modern browsers

## 🎨 Features Included

### Speedrun Mode (PvE)
✅ Daily procedurally generated dungeons with consistent seeds
✅ Stamina system (5 runs per day)
✅ Pre-run planning with stats, gear, and skills
✅ Auto-battle combat with cooldowns
✅ Time-based scoring with penalties and bonuses
✅ Local leaderboards (daily, weekly, all-time)
✅ Ghost stats showing top run breakdowns
✅ Daily gameplay modifiers
✅ Gear durability system
✅ Multiple room types (combat, trap, shrine, boss)
✅ Glassmorphism UI design

### PvP Arena
✅ Turn-based tactical combat
✅ 16 unique skills across 5 types (Burst, Control, Mobility, Sustain, Utility)
✅ Type advantage system (Rock-Paper-Scissors mechanics)
✅ Priority-based action resolution
✅ 10+ status effects (stun, silence, vulnerable, shields, etc.)
✅ Ranked and Practice modes
✅ AI opponents with strategic behavior
✅ Arena statistics tracking (W/L record)
✅ Simultaneous action selection
✅ Mind games and prediction-based gameplay

### 🌐 Online Multiplayer (NEW!)
✅ Real-time WebSocket-based battles
✅ Automatic matchmaking system
✅ Ranked and Unranked queues
✅ Online leaderboards and statistics
✅ Custom usernames and profiles
✅ Turn synchronization
✅ Disconnect handling and forfeit system
✅ Battle history tracking
✅ Live opponent status updates

## 🚧 Future Enhancements

### Speedrun Mode
- Multiplayer leaderboards with backend integration
- More room types and boss varieties
- Advanced shortcuts and alternate paths
- Achievement system
- Custom difficulty modes
- Replay system to watch top runs
- More gear and skill options
- Weekly tournaments with special rewards

### PvP Arena
- Real-time multiplayer matchmaking
- ELO ranking system
- Ranked seasons and rewards
- Spectator mode
- Draft mode (ban/pick skills)
- Team battles (2v2, 3v3)
- Tournament brackets
- Replay system to watch epic battles
- More character classes with unique abilities

## 📝 License

This is a showcase project created for educational purposes.

---

**Master the dungeon. Break the clock. Become a Dungeonaut! ⚔️**
