# SE_LAN & ABS Integration Guide

## 🎮 Overview

**SE_LAN_ABS** mengintegrasikan SE_LAN multiplayer dengan ABS plugin untuk multiplayer real-time combat.

### Fitur Utama:
- ✅ Real-time attack animation sync
- ✅ Shared enemy spawning & HP
- ✅ Cooperative boss fights
- ✅ Loot sharing system
- ✅ Combat log untuk semua players
- ✅ Skill effects synchronization
- ✅ XP/Gold sharing

---

## 🚀 Quick Setup

### Plugin Load Order:
```
1. ABS_Core.js
2. ABS_Skill.js
3. ABS_Enemy.js
4. ABS_Effect.js
5. ABS_WeaponAdvanced.js
6. ABS_Android.js
7. ABS_Gamepad.js
8. ABS_Network.js
9. SE_LAN.js
10. SE_LAN_Android.js
11. SE_LAN_ABS.js ⭐ NEW
```

### Plugin Parameters:

```
SE_LAN_ABS:
- Sync Attack Animations: true
- Sync Enemy Spawn: true
- Shared Enemy HP: true
- PvP Damage: false
- Sync Skill Effects: true
- Sync Combat Log: true
- Enemy Loot Sharing: true
- XP Sharing: true
```

---

## 🛠️ How It Works

### 1. Attack Synchronization

```javascript
// Player 1 attacks enemy
$gamePlayer.executeWeaponAttack();

// Otomatis sync ke semua players:
// - Animation dimainkan
// - Damage dikalkulasi server
// - Popup damage muncul
```

### 2. Shared Enemy HP

```
Server:
- Maintain enemy state
- Validate damage calculations
- Track who dealt damage

Clients:
- See same enemy HP
- See attack animations dari players lain
- Synchronized death
```

### 3. Loot System

```
Enemy dies:
1. Server calculate loot
2. Determine contributors (damage-based)
3. If Loot Sharing = true:
   - Bagikan gold/exp equally
   - Semua dapat loot
4. If Loot Sharing = false:
   - Hanya killer dapat loot
```

### 4. Combat Log

```
Semua actions tercatat:
- Attack damage
- Critical hits
- Skill usage
- Enemy death
- Loot obtained

Tampil di window untuk all players
```

---

## 🎯 Use Case Examples

### Use Case 1: Cooperative Dungeon

```javascript
// Event saat enter dungeon:
if (SE_LAN.isConnected && Object.keys(SE_LAN.players).length > 1) {
    // Multiple players co-op
    $gameSystem.enableABS(true);
    $gameSystem.setABSInBattle(true);
    
    // Spawn shared enemies
    const event = $gameMap.event(1);
    $syncEnemySpawn(1, 2);  // Goblin enemy
}
```

### Use Case 2: Shared Boss Fight

```javascript
// Boss event:
const bossEvent = $gameMap.event(10);
bossEvent.initABSEnemy(50);  // Boss ID 50
bossEvent.setABSStats(500, 100, 30, 15, 1.2);

// Broadcast ke semua players
$syncEnemySpawn(10, 50);

// Multiple players attack simultaneously
// Boss HP updated for everyone
```

### Use Case 3: Loot Distribution

```javascript
// Goblin drops 100 gold
// 2 players attacked:
// - Player 1: 80 damage
// - Player 2: 20 damage

// With Loot Sharing:
// Both get 50 gold

// Without Loot Sharing:
// Only Player 1 gets 100 gold
```

---

## 📢 Message Format

### Attack Message:
```javascript
{
    type: 'ABS_ATTACK',
    playerId: 'player_xxx',
    targetId: eventId,
    damage: 25,
    animId: 5,
    isCritical: false
}
```

### Skill Usage:
```javascript
{
    type: 'ABS_SKILL_USAGE',
    playerId: 'player_xxx',
    skillId: 1,
    targetId: eventId
}
```

### Enemy Death:
```javascript
{
    type: 'ABS_ENEMY_DEATH',
    eventId: 1,
    killedBy: 'player_xxx'
}
```

### Loot Distribution:
```javascript
{
    type: 'ABS_LOOT',
    gold: 50,
    exp: 25,
    items: [
        { kind: 1, dataId: 1, amount: 1 }
    ]
}
```

---

## 📘 Script Commands

### Sync Attack
```javascript
$syncABSAttack(targetEventId, damage);
```

### Sync Enemy Spawn
```javascript
$syncEnemySpawn(eventId, enemyId);
```

### Sync Enemy Death
```javascript
$syncEnemyDeath(eventId);
```

### Broadcast Combat Log
```javascript
$broadcastCombatLog('Dragon appears!');
```

### Get Combat Log
```javascript
const logs = $getCombatLog();
logs.forEach(log => {
    console.log(log.player + ' ' + log.action + ' ' + log.value);
});
```

---

## 📊 Configuration Examples

### Full Cooperative Mode:
```
Sync Attack Animations: true
Sync Enemy Spawn: true
Shared Enemy HP: true
PvP Damage: false
Sync Skill Effects: true
Sync Combat Log: true
Enemy Loot Sharing: true
XP Sharing: true
```

### Competitive Mode:
```
Sync Attack Animations: true
Sync Enemy Spawn: false
Shared Enemy HP: false
PvP Damage: true
Sync Skill Effects: true
Sync Combat Log: true
Enemy Loot Sharing: false
XP Sharing: false
```

### Casual Co-op:
```
Sync Attack Animations: true
Sync Enemy Spawn: true
Shared Enemy HP: true
PvP Damage: false
Sync Skill Effects: false (less network traffic)
Sync Combat Log: false
Enemy Loot Sharing: true
XP Sharing: true
```

---

## 🔧 Troubleshooting

### Problem: Enemy HP tidak synchronized

**Solution:**
```javascript
// Verify enemy sync:
const log = $getCombatLog();
if (log.filter(l => l.action === 'attack').length === 0) {
    console.log('Attacks not syncing');
}

// Check connection:
if (!SE_LAN.isConnected) {
    console.log('Not connected to server');
}
```

### Problem: Loot tidak dapat oleh semua players

**Solution:**
```javascript
// Check plugin parameter:
// Enemy Loot Sharing: true
// XP Sharing: true

// Verify damage tracking:
console.log($multiplayerABS._sharedEnemies);
```

### Problem: Attack animations tidak muncul di other players

**Solution:**
```javascript
// Check:
if (!SE_LAN_ABS.syncAttackAnimations) {
    console.log('Attack sync disabled');
}

// Verify network latency:
const status = $getLANStatus();
if (!status.connected) {
    console.log('Reconnect to server');
}
```

---

## 📈 Combat Log Window

### Example Implementation:

```javascript
// Create combat log window
function Window_CombatLog() {
    this.initialize.apply(this, arguments);
}

Window_CombatLog.prototype = Object.create(Window_Selectable.prototype);
Window_CombatLog.prototype.constructor = Window_CombatLog;

Window_CombatLog.prototype.initialize = function(x, y, width, height) {
    Window_Selectable.prototype.initialize.call(this, x, y, width, height);
    this._logs = [];
    this.refresh();
};

Window_CombatLog.prototype.update = function() {
    Window_Selectable.prototype.update.call(this);
    this._logs = $getCombatLog();
    this.refresh();
};

Window_CombatLog.prototype.maxItems = function() {
    return Math.min(this._logs.length, 10);
};

Window_CombatLog.prototype.itemHeight = function() {
    return 24;
};

Window_CombatLog.prototype.drawItem = function(index) {
    const log = this._logs[this._logs.length - 10 + index];
    if (log) {
        const rect = this.itemRectForText(index);
        const text = log.player + ' ' + log.action + ' ' + log.value;
        this.drawText(text, rect.x, rect.y, rect.width);
    }
};
```

---

## 🚀 Advanced Features

### Damage Contribution Tracking:

```javascript
// Server tracks siapa yang damage enemy:
SE_LAN_ABS.sharedEnemies[eventId] = {
    enemyId: 1,
    contributors: {
        'player_1': 80,  // 80 damage dealt
        'player_2': 20   // 20 damage dealt
    }
};

// Based on contribution, determine loot priority
```

### Skill Effect Sync:

```javascript
// Healing skill affects all party members:
if (skillId === 5) {  // Healing skill
    $gameParty.members().forEach(member => {
        member.gainHp(50);
    });
    
    // Broadcast ke semua players
    $syncABSAttack(null, -50);  // Negative = heal
}
```

### Boss Mechanics:

```javascript
// Boss special attack ke semua players:
if (bossHP < 250) {
    // Phase 2: Massive AoE attack
    $gameParty.members().forEach(member => {
        member.damageABS(100);
    });
    
    // Broadcast ke semua
    $broadcastCombatLog('Dragon unleashes massive fire breath!');
}
```

---

## 📚 Performance Tips

1. **Reduce Combat Log Entries:**
   ```
   Sync Combat Log: false (if network-limited)
   ```

2. **Increase Sync Interval:**
   ```
   SE_LAN: Sync Interval = 200ms (less frequent)
   ```

3. **Disable Unnecessary Sync:**
   ```
   Sync Skill Effects: false (if not needed)
   ```

4. **Optimize on Mobile:**
   ```
   Use SE_LAN_Android.js
   Reduce max players to 2-3
   ```

---

## 🎉 Bonus: Raid System

```javascript
// Multiple parties vs boss
// All synced together

if (SE_LAN.isConnected && Object.keys(SE_LAN.players).length >= 4) {
    // Enable raid mode
    SceneManager.push(Scene_RaidBattle);
    
    // Boss with massive HP
    const bossEvent = $gameMap.event(99);
    bossEvent.initABSEnemy(99);  // Boss
    bossEvent.setABSStats(1000, 200, 50, 20, 1.0);  // Raid boss HP
    
    // Broadcast ke semua players
    $syncEnemySpawn(99, 99);
    
    // Raid timer
    $gameVariables.setValue(100, 300);  // 5 minute timer
}
```

---

**SE_LAN_ABS plugin membuat multiplayer ABS combat yang awesome! 🚀💯**
