//=============================================================================
// SE_LAN_ABS.js - SE_LAN Integration with ABS Plugin
//=============================================================================

/*:
 * @plugindesc SE_LAN & ABS Integration - Multiplayer Real-time Combat
 * @author SuperEagle-sch
 *
 * @param Sync Attack Animations
 * @desc Sinkronisasi attack animation ke semua players
 * @type boolean
 * @default true
 *
 * @param Sync Enemy Spawn
 * @desc Semua players lihat enemy yang sama
 * @type boolean
 * @default true
 *
 * @param Shared Enemy HP
 * @desc Enemy HP terbagi di semua attackers
 * @type boolean
 * @default true
 *
 * @param PvP Damage
 * @desc Enable player dapat melukai player lain
 * @type boolean
 * @default false
 *
 * @param Sync Skill Effects
 * @desc Sinkronisasi skill effects ke semua players
 * @type boolean
 * @default true
 *
 * @param Sync Combat Log
 * @desc Show combat log untuk semua players
 * @type boolean
 * @default true
 *
 * @param Enemy Loot Sharing
 * @desc Semua party members dapat loot
 * @type boolean
 * @default true
 *
 * @param XP Sharing
 * @desc Bagikan XP ke semua party members
 * @type boolean
 * @default true
 *
 * @help
 * ============================================================================
 * SE_LAN & ABS Integration
 * ============================================================================
 *
 * Plugin ini mengintegrasikan SE_LAN dengan ABS untuk multiplayer combat.
 *
 * Features:
 * - Real-time attack animation sync
 * - Shared enemy spawning
 * - Cooperative boss fights
 * - Shared loot system
 * - Combat log untuk semua players
 * - Synchronized skill effects
 * - Party-based dungeon crawling
 * 
 * Script Commands:
 * $syncABSAttack(targetId, damage);         // Sync attack
 * $syncEnemySpawn(eventId, enemyId);        // Sync enemy spawn
 * $syncEnemyDeath(eventId);                 // Sync enemy death
 * $broadcastCombatLog(message);             // Send combat log
 */

var Imported = Imported || {};
Imported.SE_LAN_ABS = true;

var SE_LAN_ABS = {};
SE_LAN_ABS.params = PluginManager.parameters('SE_LAN_ABS');

SE_LAN_ABS.syncAttackAnimations = SE_LAN_ABS.params['Sync Attack Animations'] === 'true';
SE_LAN_ABS.syncEnemySpawn = SE_LAN_ABS.params['Sync Enemy Spawn'] === 'true';
SE_LAN_ABS.sharedEnemyHP = SE_LAN_ABS.params['Shared Enemy HP'] === 'true';
SE_LAN_ABS.enablePvPDamage = SE_LAN_ABS.params['PvP Damage'] === 'true';
SE_LAN_ABS.syncSkillEffects = SE_LAN_ABS.params['Sync Skill Effects'] === 'true';
SE_LAN_ABS.syncCombatLog = SE_LAN_ABS.params['Sync Combat Log'] === 'true';
SE_LAN_ABS.enemyLootSharing = SE_LAN_ABS.params['Enemy Loot Sharing'] === 'true';
SE_LAN_ABS.xpSharing = SE_LAN_ABS.params['XP Sharing'] === 'true';

SE_LAN_ABS.combatLog = [];
SE_LAN_ABS.sharedEnemies = {};

//=============================================================================
// Multiplayer Manager - ABS Integration
//=============================================================================

function MultiplayerABSManager() {
    this.initialize();
}

MultiplayerABSManager.prototype.initialize = function() {
    this._combatLog = [];
    this._sharedEnemies = {};
    this._playerDamageContribution = {}; // Track damage untuk loot sharing
};

//=============================================================================
// Sync Attack Animation
//=============================================================================

MultiplayerABSManager.prototype.syncAttack = function(playerId, targetId, damage, animId, isCritical) {
    if (!SE_LAN.isConnected || !SE_LAN_ABS.syncAttackAnimations) return;
    
    const message = {
        type: 'ABS_ATTACK',
        data: {
            playerId: playerId,
            targetId: targetId,
            damage: damage,
            animId: animId,
            isCritical: isCritical,
            timestamp: Date.now()
        }
    };
    
    if (window.$seLAN._isServer) {
        $seLAN.broadcast({
            type: 'ABS_ATTACK',
            playerId: playerId,
            targetId: targetId,
            damage: damage,
            animId: animId,
            isCritical: isCritical
        });
    } else {
        $seLAN.sendToServer(message);
    }
    
    // Add to combat log
    this.addCombatLog(SE_LAN.players[playerId].name, 'attacks', damage, isCritical);
};

MultiplayerABSManager.prototype.handleRemoteAttack = function(playerId, targetId, damage, animId) {
    const attacker = SE_LAN.players[playerId];
    
    if (!attacker) return;
    
    // Display remote player attack
    const targetEvent = this.findEventById(targetId);
    if (targetEvent) {
        if ($gameTemp.requestAnimation) {
            $gameTemp.requestAnimation([targetEvent], animId);
        }
        
        targetEvent.damageABS(damage);
        
        // Show damage popup
        $showDamagePopup(damage, targetEvent.x, targetEvent.y, false);
    }
};

//=============================================================================
// Sync Enemy Spawn
//=============================================================================

MultiplayerABSManager.prototype.syncEnemySpawn = function(eventId, enemyId, x, y) {
    if (!SE_LAN.isConnected || !SE_LAN_ABS.syncEnemySpawn) return;
    
    const message = {
        type: 'ABS_ENEMY_SPAWN',
        data: {
            eventId: eventId,
            enemyId: enemyId,
            x: x,
            y: y,
            mapId: $gameMap.mapId()
        }
    };
    
    if (window.$seLAN._isServer) {
        // Server validates dan broadcast
        SE_LAN_ABS.sharedEnemies[eventId] = {
            enemyId: enemyId,
            x: x,
            y: y,
            hp: $dataEnemies[enemyId].hp,
            maxHp: $dataEnemies[enemyId].hp,
            contributors: {} // Track siapa yang damage
        };
        
        $seLAN.broadcast({
            type: 'ABS_ENEMY_SPAWN',
            eventId: eventId,
            enemyId: enemyId,
            x: x,
            y: y
        });
    } else {
        $seLAN.sendToServer(message);
    }
};

MultiplayerABSManager.prototype.handleEnemySpawn = function(eventId, enemyId, x, y) {
    const event = $gameMap.event(eventId);
    if (event) {
        event.initABSEnemy(enemyId);
        event.setABSStats(
            $dataEnemies[enemyId].hp,
            $dataEnemies[enemyId].mp,
            $dataEnemies[enemyId].atk,
            $dataEnemies[enemyId].def,
            1.0
        );
        event.show();
    }
};

//=============================================================================
// Sync Enemy Death & Loot
//=============================================================================

MultiplayerABSManager.prototype.syncEnemyDeath = function(eventId, killedByPlayerId) {
    if (!SE_LAN.isConnected) return;
    
    const message = {
        type: 'ABS_ENEMY_DEATH',
        data: {
            eventId: eventId,
            killedBy: killedByPlayerId,
            timestamp: Date.now()
        }
    };
    
    if (window.$seLAN._isServer) {
        const sharedEnemy = SE_LAN_ABS.sharedEnemies[eventId];
        if (sharedEnemy) {
            // Calculate loot
            const loot = this.calculateEnemyLoot(sharedEnemy.enemyId);
            
            // Determine who gets loot (damage contribution)
            const contributors = Object.keys(sharedEnemy.contributors);
            
            if (SE_LAN_ABS.enemyLootSharing) {
                // Share loot among contributors
                const lootPerPlayer = Math.floor(loot.gold / contributors.length);
                const expPerPlayer = Math.floor(loot.exp / contributors.length);
                
                contributors.forEach(playerId => {
                    $seLAN.sendToPlayer(playerId, {
                        type: 'ABS_LOOT',
                        gold: lootPerPlayer,
                        exp: expPerPlayer,
                        items: loot.items
                    });
                });
            } else {
                // Only killer gets loot
                $seLAN.sendToPlayer(killedByPlayerId, {
                    type: 'ABS_LOOT',
                    gold: loot.gold,
                    exp: loot.exp,
                    items: loot.items
                });
            }
            
            // Broadcast enemy death
            $seLAN.broadcast({
                type: 'ABS_ENEMY_DEATH',
                eventId: eventId,
                killedBy: killedByPlayerId
            });
            
            delete SE_LAN_ABS.sharedEnemies[eventId];
        }
    } else {
        $seLAN.sendToServer(message);
    }
};

MultiplayerABSManager.prototype.calculateEnemyLoot = function(enemyId) {
    const enemy = $dataEnemies[enemyId];
    
    return {
        gold: enemy.exp ? Math.floor(enemy.exp / 2) : 10,
        exp: enemy.exp || 50,
        items: this.getEnemyDropItems(enemyId)
    };
};

MultiplayerABSManager.prototype.getEnemyDropItems = function(enemyId) {
    const items = [];
    const enemy = $dataEnemies[enemyId];
    
    if (enemy.drops) {
        enemy.drops.forEach(drop => {
            if (Math.random() < (drop.denominator ? 1 / drop.denominator : 0.5)) {
                items.push({
                    kind: drop.kind,
                    dataId: drop.dataId,
                    amount: 1
                });
            }
        });
    }
    
    return items;
};

MultiplayerABSManager.prototype.handleEnemyDeath = function(eventId) {
    const event = $gameMap.event(eventId);
    if (event) {
        event.erase();
    }
};

MultiplayerABSManager.prototype.handleLoot = function(data) {
    $gameParty.gainGold(data.gold);
    
    if (SE_LAN_ABS.xpSharing) {
        $gameParty.leader().gainExp(data.exp);
    }
    
    data.items.forEach(item => {
        if (item.kind === 1) {
            $gameParty.gainItem($dataItems[item.dataId], item.amount);
        } else if (item.kind === 2) {
            $gameParty.gainItem($dataWeapons[item.dataId], item.amount);
        } else if (item.kind === 3) {
            $gameParty.gainItem($dataArmors[item.dataId], item.amount);
        }
    });
    
    this.addCombatLog('System', 'gained', data.gold + ' gold');
};

//=============================================================================
// Sync Skill Effects
//=============================================================================

MultiplayerABSManager.prototype.syncSkillUsage = function(playerId, skillId, targetId) {
    if (!SE_LAN.isConnected || !SE_LAN_ABS.syncSkillEffects) return;
    
    const message = {
        type: 'ABS_SKILL_USAGE',
        data: {
            playerId: playerId,
            skillId: skillId,
            targetId: targetId,
            timestamp: Date.now()
        }
    };
    
    if (window.$seLAN._isServer) {
        $seLAN.broadcast({
            type: 'ABS_SKILL_USAGE',
            playerId: playerId,
            skillId: skillId,
            targetId: targetId
        });
    } else {
        $seLAN.sendToServer(message);
    }
    
    this.addCombatLog(SE_LAN.players[playerId].name, 'used skill', $dataSkills[skillId].name);
};

MultiplayerABSManager.prototype.handleSkillUsage = function(playerId, skillId, targetId) {
    const skill = $dataSkills[skillId];
    const target = this.findEventById(targetId);
    
    if (target && skill) {
        // Play skill animation
        if ($gameTemp.requestAnimation && skill.animationId > 0) {
            $gameTemp.requestAnimation([target], skill.animationId);
        }
        
        // Calculate damage
        const damage = skill.damage ? Math.floor(skill.damage.value1) : 0;
        target.damageABS(damage);
        
        $showDamagePopup(damage, target.x, target.y, false);
    }
};

//=============================================================================
// Combat Log System
//=============================================================================

MultiplayerABSManager.prototype.addCombatLog = function(playerName, action, value, isCritical) {
    const entry = {
        player: playerName,
        action: action,
        value: value,
        critical: isCritical || false,
        timestamp: Date.now()
    };
    
    this._combatLog.push(entry);
    SE_LAN_ABS.combatLog.push(entry);
    
    // Keep last 50 entries
    if (this._combatLog.length > 50) {
        this._combatLog.shift();
    }
    
    if (SE_LAN_ABS.syncCombatLog && SE_LAN.isConnected) {
        if (window.$seLAN._isServer) {
            $seLAN.broadcast({
                type: 'COMBAT_LOG',
                entry: entry
            });
        } else {
            $seLAN.sendToServer({
                type: 'COMBAT_LOG',
                data: { entry: entry }
            });
        }
    }
};

MultiplayerABSManager.prototype.getCombatLog = function() {
    return this._combatLog;
};

//=============================================================================
// Helper Functions
//=============================================================================

MultiplayerABSManager.prototype.findEventById = function(eventId) {
    return $gameMap.event(eventId);
};

MultiplayerABSManager.prototype.trackDamageContribution = function(playerId, eventId, damage) {
    if (!SE_LAN_ABS.sharedEnemies[eventId]) return;
    
    const enemy = SE_LAN_ABS.sharedEnemies[eventId];
    if (!enemy.contributors[playerId]) {
        enemy.contributors[playerId] = 0;
    }
    
    enemy.contributors[playerId] += damage;
};

// Create global instance
window.$multiplayerABS = new MultiplayerABSManager();

//=============================================================================
// Game_Player - ABS Multiplayer Integration
//=============================================================================

const _Game_Player_executeWeaponAttack = Game_Player.prototype.executeWeaponAttack;
Game_Player.prototype.executeWeaponAttack = function() {
    if (_Game_Player_executeWeaponAttack) {
        _Game_Player_executeWeaponAttack.call(this);
    }
    
    // Sync attack ke server
    if (SE_LAN.isConnected && SE_LAN_ABS.syncAttackAnimations) {
        const range = this.getWeaponRange ? this.getWeaponRange() : 1;
        const enemies = this.getEnemiesInRange(range);
        
        for (let enemy of enemies) {
            if (enemy.isABSEnemy && enemy.isABSEnemy()) {
                const damage = this._absAttackPower - enemy._absDefense + Math.random() * 5;
                const animId = this.getWeaponAnimationId ? this.getWeaponAnimationId() : 1;
                
                $multiplayerABS.syncAttack(
                    SE_LAN.localPlayer,
                    enemy._eventId,
                    damage,
                    animId,
                    false
                );
                
                // Track damage contribution
                $multiplayerABS.trackDamageContribution(SE_LAN.localPlayer, enemy._eventId, damage);
            }
        }
    }
};

const _Game_Player_useABSSkill = Game_Player.prototype.useABSSkill;
Game_Player.prototype.useABSSkill = function(skillId) {
    const result = _Game_Player_useABSSkill.call(this, skillId);
    
    // Sync skill usage
    if (result && SE_LAN.isConnected && SE_LAN_ABS.syncSkillEffects) {
        const targetEnemies = this.getEnemiesInRange(5);
        targetEnemies.forEach(enemy => {
            $multiplayerABS.syncSkillUsage(SE_LAN.localPlayer, skillId, enemy._eventId);
        });
    }
    
    return result;
};

//=============================================================================
// Game_Event - ABS Enemy Death Sync
//=============================================================================

const _Game_Character_damageABS = Game_Character.prototype.damageABS;
Game_Character.prototype.damageABS = function(damage) {
    const result = _Game_Character_damageABS.call(this, damage);
    
    if (this._absHP <= 0 && this.isABSEnemy && this.isABSEnemy()) {
        if (SE_LAN.isConnected) {
            $multiplayerABS.syncEnemyDeath(this._eventId, SE_LAN.localPlayer);
        }
    }
    
    return result;
};

//=============================================================================
// SE_LAN Message Handlers - ABS
//=============================================================================

const _original_handleMessage = window.$seLAN.handleClientMessage;
window.$seLAN.handleClientMessage = function(message) {
    if (_original_handleMessage) {
        _original_handleMessage.call(this, message);
    }
    
    // Handle ABS-specific messages
    if (message.type === 'ABS_ATTACK') {
        $multiplayerABS.handleRemoteAttack(
            message.playerId,
            message.targetId,
            message.damage,
            message.animId
        );
    } else if (message.type === 'ABS_ENEMY_SPAWN') {
        $multiplayerABS.handleEnemySpawn(
            message.eventId,
            message.enemyId,
            message.x,
            message.y
        );
    } else if (message.type === 'ABS_ENEMY_DEATH') {
        $multiplayerABS.handleEnemyDeath(message.eventId);
    } else if (message.type === 'ABS_LOOT') {
        $multiplayerABS.handleLoot(message);
    } else if (message.type === 'ABS_SKILL_USAGE') {
        $multiplayerABS.handleSkillUsage(message.playerId, message.skillId, message.targetId);
    } else if (message.type === 'COMBAT_LOG') {
        SE_LAN_ABS.combatLog.push(message.entry);
    }
};

//=============================================================================
// Helper Functions
//=============================================================================

window.$syncABSAttack = function(targetId, damage) {
    $multiplayerABS.syncAttack(SE_LAN.localPlayer, targetId, damage, 5, false);
};

window.$syncEnemySpawn = function(eventId, enemyId) {
    const event = $gameMap.event(eventId);
    if (event) {
        $multiplayerABS.syncEnemySpawn(eventId, enemyId, event.x, event.y);
    }
};

window.$syncEnemyDeath = function(eventId) {
    $multiplayerABS.syncEnemyDeath(eventId, SE_LAN.localPlayer);
};

window.$broadcastCombatLog = function(message) {
    $multiplayerABS.addCombatLog('Player', 'action', message);
};

window.$getCombatLog = function() {
    return $multiplayerABS.getCombatLog();
};

console.log('SE_LAN_ABS.js loaded successfully!');
