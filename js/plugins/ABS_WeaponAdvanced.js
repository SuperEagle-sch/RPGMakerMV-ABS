//=============================================================================
// ABS_WeaponAdvanced.js - Advanced Weapon Animation System (Alpha ABS Z Style)
//=============================================================================

/*:
 * @plugindesc Advanced Weapon Animation System seperti Alpha ABS Z
 * @author SuperEagle-sch
 *
 * @param Enable Weapon Animation
 * @desc Aktifkan weapon animation advanced
 * @type boolean
 * @default true
 *
 * @param Show Impact Effect
 * @desc Tampilkan impact/hit effect
 * @type boolean
 * @default true
 *
 * @param Enable Combo System
 * @desc Aktifkan weapon combo attack
 * @type boolean
 * @default true
 *
 * @param Direction Animation
 * @desc Support animation sesuai arah attack
 * @type boolean
 * @default true
 *
 * @param Show Weapon Trail
 * @desc Tampilkan weapon trail effect
 * @type boolean
 * @default true
 *
 * @param Enable Charge Attack
 * @desc Aktifkan charge attack
 * @type boolean
 * @default true
 *
 * @help
 * ============================================================================
 * Advanced Weapon Animation System (Alpha ABS Z Style)
 * ============================================================================
 * 
 * Features:
 * - Direction-based animations (up, down, left, right, diagonal)
 * - Combo system (press attack 3x untuk combo)
 * - Charge attack (hold button untuk power attack)
 * - Weapon trail effects
 * - Impact/hit effects
 * - Multi-hit weapons
 * - Knockback & hitstun
 * - Critical hit animations
 * - Element effects (fire, ice, lightning, etc)
 * 
 * Note Tags untuk Weapon:
 * <absAnimId:5>              // Basic attack animation
 * <absAnimUpId:15>           // Attack up direction
 * <absAnimDownId:16>         // Attack down direction
 * <absAnimLeftId:17>         // Attack left direction
 * <absAnimRightId:18>        // Attack right direction
 * <absComboAnimId:25>        // Combo attack animation
 * <absChargeAnimId:26>       // Charge attack animation
 * <absRange:2>               // Attack range (tile)
 * <absHitCount:3>            // Number of hits
 * <absHitstun:30>            // Enemy freeze frame saat kena attack
 * <absKnockback:1.5>         // Knockback force
 * <absCriticalChance:20>     // Critical chance (percent)
 * <absElement:1>             // Element ID
 * <absTrailColor:#FF0000>    // Trail color
 */

var Imported = Imported || {};
Imported.ABS_WeaponAdvanced = true;

var ABS = ABS || {};
ABS.WeaponAdvanced = {};
ABS.WeaponAdvanced.params = PluginManager.parameters('ABS_WeaponAdvanced');

ABS.WeaponAdvanced.enabled = ABS.WeaponAdvanced.params['Enable Weapon Animation'] === 'true';
ABS.WeaponAdvanced.showImpactEffect = ABS.WeaponAdvanced.params['Show Impact Effect'] === 'true';
ABS.WeaponAdvanced.enableCombo = ABS.WeaponAdvanced.params['Enable Combo System'] === 'true';
ABS.WeaponAdvanced.directionAnimation = ABS.WeaponAdvanced.params['Direction Animation'] === 'true';
ABS.WeaponAdvanced.showWeaponTrail = ABS.WeaponAdvanced.params['Show Weapon Trail'] === 'true';
ABS.WeaponAdvanced.enableChargeAttack = ABS.WeaponAdvanced.params['Enable Charge Attack'] === 'true';

//=============================================================================
// DataManager - Load Advanced Weapon Data
//=============================================================================

const _DataManager_isDatabaseLoaded2 = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
    if (!_DataManager_isDatabaseLoaded2.call(this)) return false;
    
    if (!ABS.WeaponAdvanced.loaded) {
        this.loadAdvancedWeaponData();
        ABS.WeaponAdvanced.loaded = true;
    }
    return true;
};

DataManager.loadAdvancedWeaponData = function() {
    for (let i = 1; i < $dataWeapons.length; i++) {
        const weapon = $dataWeapons[i];
        if (weapon) {
            weapon.absAnimId = this.getWeaponParam(weapon, 'absAnimId', 0);
            weapon.absAnimUpId = this.getWeaponParam(weapon, 'absAnimUpId', weapon.absAnimId);
            weapon.absAnimDownId = this.getWeaponParam(weapon, 'absAnimDownId', weapon.absAnimId);
            weapon.absAnimLeftId = this.getWeaponParam(weapon, 'absAnimLeftId', weapon.absAnimId);
            weapon.absAnimRightId = this.getWeaponParam(weapon, 'absAnimRightId', weapon.absAnimId);
            weapon.absComboAnimId = this.getWeaponParam(weapon, 'absComboAnimId', weapon.absAnimId);
            weapon.absChargeAnimId = this.getWeaponParam(weapon, 'absChargeAnimId', weapon.absAnimId);
            weapon.absRange = this.getWeaponParam(weapon, 'absRange', 1);
            weapon.absHitCount = this.getWeaponParam(weapon, 'absHitCount', 1);
            weapon.absHitstun = this.getWeaponParam(weapon, 'absHitstun', 15);
            weapon.absKnockback = this.getWeaponParam(weapon, 'absKnockback', 0.5);
            weapon.absCriticalChance = this.getWeaponParam(weapon, 'absCriticalChance', 10);
            weapon.absElement = this.getWeaponParam(weapon, 'absElement', 0);
            weapon.absTrailColor = this.getWeaponParamString(weapon, 'absTrailColor', '#FFFFFF');
        }
    }
};

DataManager.getWeaponParam = function(weapon, paramName, defaultValue) {
    const regex = new RegExp(`<${paramName}:(\\d+)>`, 'i');
    const match = weapon.note.match(regex);
    return match ? parseInt(match[1]) : defaultValue;
};

DataManager.getWeaponParamString = function(weapon, paramName, defaultValue) {
    const regex = new RegExp(`<${paramName}:(.+?)>`, 'i');
    const match = weapon.note.match(regex);
    return match ? match[1].trim() : defaultValue;
};

//=============================================================================
// Game_Player - Advanced Weapon System
//=============================================================================

const _Game_Player_initialize2 = Game_Player.prototype.initialize;
Game_Player.prototype.initialize = function() {
    _Game_Player_initialize2.call(this);
    this._comboCount = 0;
    this._comboTimer = 0;
    this._isCharging = false;
    this._chargeTime = 0;
    this._chargeMaxTime = 60;
    this._lastAttackDirection = 0;
    this._hitstunTimer = 0;
    this._weaponTrails = [];
};

const _Game_Player_update3 = Game_Player.prototype.update;
Game_Player.prototype.update = function(sceneActive) {
    _Game_Player_update3.call(this, sceneActive);
    
    if (ABS.WeaponAdvanced.enabled && $gameSystem.isABSInBattle()) {
        this.updateWeaponSystem();
    }
};

Game_Player.prototype.updateWeaponSystem = function() {
    this.updateComboSystem();
    this.updateChargeAttack();
    this.updateWeaponTrails();
};

Game_Player.prototype.updateComboSystem = function() {
    if (this._comboTimer > 0) {
        this._comboTimer--;
    } else {
        this._comboCount = 0;
    }
};

Game_Player.prototype.updateChargeAttack = function() {
    if (this._isCharging) {
        this._chargeTime++;
        if (this._chargeTime >= this._chargeMaxTime) {
            this._chargeTime = this._chargeMaxTime;
        }
    }
};

Game_Player.prototype.updateWeaponTrails = function() {
    for (let i = this._weaponTrails.length - 1; i >= 0; i--) {
        const trail = this._weaponTrails[i];
        trail.update();
        if (trail.isFinished()) {
            this._weaponTrails.splice(i, 1);
        }
    }
};

Game_Player.prototype.startComboAttack = function() {
    if (ABS.WeaponAdvanced.enableCombo) {
        this._comboCount++;
        this._comboTimer = 30; // 30 frame window
        
        if (this._comboCount >= 3) {
            this.executeComboAttack();
            this._comboCount = 0;
        } else {
            this.executeNormalAttack();
        }
    } else {
        this.executeNormalAttack();
    }
};

Game_Player.prototype.startChargeAttack = function() {
    if (ABS.WeaponAdvanced.enableChargeAttack) {
        this._isCharging = true;
        this._chargeTime = 0;
    }
};

Game_Player.prototype.releaseChargeAttack = function() {
    if (this._isCharging) {
        this._isCharging = false;
        
        if (this._chargeTime >= this._chargeMaxTime * 0.5) {
            this.executeChargeAttack();
        } else {
            this.executeNormalAttack();
        }
        
        this._chargeTime = 0;
    }
};

Game_Player.prototype.executeNormalAttack = function() {
    this.performAttack();
    this._lastAttackDirection = this.direction();
    const weapon = this.getCurrentWeapon();
    
    if (!weapon) return;
    
    const animId = this.getWeaponAnimationByDirection();
    const range = weapon.absRange;
    const enemies = this.getEnemiesInRange(range);
    
    if (enemies.length > 0) {
        this.playWeaponAnimation(animId);
        this.applyWeaponAttackToEnemies(enemies, weapon, 1.0);
    }
};

Game_Player.prototype.executeComboAttack = function() {
    this.performAttack();
    const weapon = this.getCurrentWeapon();
    
    if (!weapon) return;
    
    const animId = weapon.absComboAnimId || weapon.absAnimId;
    const range = weapon.absRange + 1; // Combo has extended range
    const enemies = this.getEnemiesInRange(range);
    
    if (enemies.length > 0) {
        this.playWeaponAnimation(animId);
        this.applyWeaponAttackToEnemies(enemies, weapon, 1.5); // 1.5x damage
    }
};

Game_Player.prototype.executeChargeAttack = function() {
    this.performAttack();
    const weapon = this.getCurrentWeapon();
    
    if (!weapon) return;
    
    const animId = weapon.absChargeAnimId || weapon.absAnimId;
    const range = weapon.absRange + 2; // Charge has large range
    const chargeMultiplier = 1.0 + (this._chargeTime / this._chargeMaxTime) * 1.0; // 1.0x - 2.0x damage
    const enemies = this.getEnemiesInRange(range);
    
    if (enemies.length > 0) {
        this.playWeaponAnimation(animId);
        this.playChargeEffect();
        this.applyWeaponAttackToEnemies(enemies, weapon, chargeMultiplier);
    }
};

Game_Player.prototype.getWeaponAnimationByDirection = function() {
    if (!ABS.WeaponAdvanced.directionAnimation) {
        const weapon = this.getCurrentWeapon();
        return weapon ? weapon.absAnimId : 0;
    }
    
    const weapon = this.getCurrentWeapon();
    const direction = this.direction();
    
    switch (direction) {
        case 2: return weapon.absAnimDownId || weapon.absAnimId;
        case 4: return weapon.absAnimLeftId || weapon.absAnimId;
        case 6: return weapon.absAnimRightId || weapon.absAnimId;
        case 8: return weapon.absAnimUpId || weapon.absAnimId;
        default: return weapon.absAnimId;
    }
};

Game_Player.prototype.playWeaponAnimation = function(animId) {
    if (animId > 0 && $gameTemp.requestAnimation) {
        $gameTemp.requestAnimation([$gamePlayer], animId);
    }
};

Game_Player.prototype.playChargeEffect = function() {
    // Charge effect animation
    if (ABS.WeaponAdvanced.showImpactEffect) {
        // Create charge particle effect
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const trail = new WeaponTrail(
                this.x,
                this.y,
                Math.cos(angle) * 2,
                Math.sin(angle) * 2,
                '#FFFF00',
                20
            );
            this._weaponTrails.push(trail);
        }
    }
};

Game_Player.prototype.applyWeaponAttackToEnemies = function(enemies, weapon, damageMultiplier) {
    for (let enemy of enemies) {
        let baseDamage = this._absAttackPower * damageMultiplier;
        const isCritical = Math.random() * 100 < weapon.absCriticalChance;
        
        if (isCritical) {
            baseDamage *= 1.5;
        }
        
        const finalDamage = Math.max(1, baseDamage - enemy._absDefense);
        enemy.damageABS(finalDamage);
        
        // Apply hitstun
        enemy._hitstunTimer = weapon.absHitstun;
        
        // Show hit animation
        if ($gameTemp.requestAnimation) {
            $gameTemp.requestAnimation([enemy], 2);
        }
        
        // Show damage popup
        $showDamagePopup(finalDamage, enemy.x, enemy.y, isCritical);
        
        // Apply knockback
        this.applyKnockbackToEnemy(enemy, weapon.absKnockback);
        
        // Apply element effect if any
        if (weapon.absElement > 0) {
            this.applyElementEffect(enemy, weapon.absElement);
        }
        
        // Create impact effect
        if (ABS.WeaponAdvanced.showImpactEffect) {
            this.createImpactEffect(enemy.x, enemy.y, weapon.absTrailColor);
        }
    }
};

Game_Player.prototype.applyKnockbackToEnemy = function(enemy, force) {
    const dx = enemy.x - this.x;
    const dy = enemy.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        const knockbackX = (dx / distance) * force;
        const knockbackY = (dy / distance) * force;
        
        enemy._x += knockbackX * 0.5;
        enemy._y += knockbackY * 0.5;
    }
};

Game_Player.prototype.applyElementEffect = function(enemy, elementId) {
    // Apply element-specific effects
    switch (elementId) {
        case 2: // Fire
            enemy._fire_timer = 60;
            break;
        case 3: // Ice
            enemy._ice_timer = 60;
            break;
        case 4: // Lightning
            enemy._lightning_timer = 60;
            break;
    }
};

Game_Player.prototype.createImpactEffect = function(x, y, color) {
    if (ABS.WeaponAdvanced.showWeaponTrail) {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const trail = new WeaponTrail(
                x,
                y,
                Math.cos(angle) * 1.5,
                Math.sin(angle) * 1.5,
                color,
                10
            );
            this._weaponTrails.push(trail);
        }
    }
};

Game_Player.prototype.getEnemiesInRange = function(range) {
    const enemies = [];
    const allEvents = $gameMap.events();
    
    for (let event of allEvents) {
        if (event.isABSEnemy && event.isABSEnemy()) {
            const distance = this.getABSDistance(event);
            if (distance <= range && event._hitstunTimer <= 0) {
                enemies.push(event);
            }
        }
    }
    
    return enemies;
};

Game_Player.prototype.getCurrentWeapon = function() {
    if ($gameParty.members().length > 0) {
        const actor = $gameParty.leader();
        if (actor) {
            const weaponId = actor.equips()[0];
            if (weaponId) {
                return $dataWeapons[weaponId];
            }
        }
    }
    return null;
};

//=============================================================================
// Game_Event - Hitstun Effect
//=============================================================================

const _Game_Event_initialize = Game_Event.prototype.initialize;
Game_Event.prototype.initialize = function(mapId, eventId) {
    _Game_Event_initialize.call(this, mapId, eventId);
    this._hitstunTimer = 0;
};

const _Game_Event_update2 = Game_Event.prototype.update;
Game_Event.prototype.update = function() {
    if (this._hitstunTimer > 0) {
        this._hitstunTimer--;
        return; // Skip normal update saat hitstun
    }
    
    _Game_Event_update2.call(this);
};

//=============================================================================
// WeaponTrail - Trail Effect
//=============================================================================

function WeaponTrail(x, y, vx, vy, color, duration) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.duration = duration;
    this.maxDuration = duration;
}

WeaponTrail.prototype.update = function() {
    this.x += this.vx;
    this.y += this.vy;
    this.duration--;
};

WeaponTrail.prototype.isFinished = function() {
    return this.duration <= 0;
};

WeaponTrail.prototype.getOpacity = function() {
    return Math.floor((this.duration / this.maxDuration) * 255);
};

//=============================================================================
// Scene_Map - Input Handler
//=============================================================================

const _Scene_Map_update4 = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
    _Scene_Map_update4.call(this);
    
    if (ABS.WeaponAdvanced.enabled && $gameSystem.isABSInBattle()) {
        this.updateAdvancedWeaponInput();
    }
};

Scene_Map.prototype.updateAdvancedWeaponInput = function() {
    // Combo attack dengan pressing attack button
    if (Input.isTriggered('ok')) {
        $gamePlayer.startComboAttack();
    }
    
    // Charge attack dengan holding button
    if (Input.isPressed('ok')) {
        if (!$gamePlayer._isCharging) {
            $gamePlayer.startChargeAttack();
        }
    }
    
    if (Input.isRepeated('ok') === false && $gamePlayer._isCharging) {
        $gamePlayer.releaseChargeAttack();
    }
};

//=============================================================================
// Helper Functions
//=============================================================================

window.$showDamagePopup = function(damage, x, y, isCritical) {
    if (ABS.Effect && ABS.Effect.damagePopups !== undefined) {
        const screenX = $gameMap.canvasToMapX(x * 48);
        const screenY = $gameMap.canvasToMapY(y * 48);
        // Implementation from ABS_Effect.js
    }
};

console.log('ABS_WeaponAdvanced.js loaded successfully!');
