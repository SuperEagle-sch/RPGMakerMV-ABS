//=============================================================================
// ABS_Weapon.js - Weapon Animation System
//=============================================================================

/*:
 * @plugindesc Weapon Animation System untuk Action Battle System
 * @author SuperEagle-sch
 *
 * @param Enable Weapon Animation
 * @desc Aktifkan weapon animation dari database
 * @type boolean
 * @default true
 *
 * @param Animation Speed
 * @desc Kecepatan weapon animation
 * @type number
 * @min 1
 * @max 10
 * @default 5
 *
 * @param Show Weapon Sprite
 * @desc Tampilkan weapon sprite di player
 * @type boolean
 * @default true
 *
 * @help
 * Plugin ini menambahkan weapon animation dari database ke ABS.
 * 
 * Features:
 * - Weapon sprite dari database
 * - Attack animation otomatis
 * - Hit animation
 * - Weapon change during battle
 * - Custom animation per weapon
 * 
 * Note Tag untuk Weapon:
 * <absAnimId:5>      // Animation ID saat attack
 * <absHitAnimId:6>   // Animation ID saat hit
 * <absRange:2>       // Attack range dalam tile
 * <absAttackType:1>  // 1=melee, 2=ranged
 */

var Imported = Imported || {};
Imported.ABS_Weapon = true;

var ABS = ABS || {};
ABS.Weapon = {};
ABS.Weapon.params = PluginManager.parameters('ABS_Weapon');

ABS.Weapon.enabled = ABS.Weapon.params['Enable Weapon Animation'] === 'true';
ABS.Weapon.animationSpeed = Number(ABS.Weapon.params['Animation Speed']) || 5;
ABS.Weapon.showWeaponSprite = ABS.Weapon.params['Show Weapon Sprite'] === 'true';

ABS.Weapon.weaponData = {};

//=============================================================================
// DataManager - Load Weapon Data
//=============================================================================

const _DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
    if (!_DataManager_isDatabaseLoaded.call(this)) return false;
    
    if (!ABS.Weapon.weaponData.loaded) {
        this.loadABSWeaponData();
        ABS.Weapon.weaponData.loaded = true;
    }
    return true;
};

DataManager.loadABSWeaponData = function() {
    for (let i = 1; i < $dataWeapons.length; i++) {
        const weapon = $dataWeapons[i];
        if (weapon) {
            // Parse animation dari note
            weapon.absAnimationId = this.getWeaponParam(weapon, 'absAnimId', 0);
            weapon.absHitAnimationId = this.getWeaponParam(weapon, 'absHitAnimId', 0);
            weapon.absRange = this.getWeaponParam(weapon, 'absRange', 1);
            weapon.absAttackType = this.getWeaponParam(weapon, 'absAttackType', 1); // 1=melee, 2=ranged
            weapon.absAttackPower = this.getWeaponParam(weapon, 'absAttackPower', 0);
            weapon.absAnimationFrame = 0;
        }
    }
};

DataManager.getWeaponParam = function(weapon, paramName, defaultValue) {
    const regex = new RegExp(`<${paramName}:(\\d+)>`, 'i');
    const match = weapon.note.match(regex);
    return match ? parseInt(match[1]) : defaultValue;
};

//=============================================================================
// Game_Actor - Weapon Animation
//=============================================================================

const _Game_Actor_initialize = Game_Actor.prototype.initialize;
Game_Actor.prototype.initialize = function(actorId) {
    _Game_Actor_initialize.call(this, actorId);
    this._currentWeapon = null;
    this._weaponAnimationIndex = 0;
    this._isAttacking = false;
    this._attackAnimationTimer = 0;
};

Game_Actor.prototype.getCurrentWeapon = function() {
    const weaponId = this.equips()[0];
    if (weaponId) {
        return $dataWeapons[weaponId];
    }
    return null;
};

Game_Actor.prototype.getWeaponAnimationId = function() {
    const weapon = this.getCurrentWeapon();
    return weapon ? weapon.absAnimationId : 1;
};

Game_Actor.prototype.getWeaponHitAnimationId = function() {
    const weapon = this.getCurrentWeapon();
    return weapon ? weapon.absHitAnimationId : 2;
};

Game_Actor.prototype.getWeaponRange = function() {
    const weapon = this.getCurrentWeapon();
    return weapon ? weapon.absRange : 1;
};

Game_Actor.prototype.getWeaponAttackType = function() {
    const weapon = this.getCurrentWeapon();
    return weapon ? weapon.absAttackType : 1; // 1=melee, 2=ranged
};

Game_Actor.prototype.getWeaponAttackPower = function() {
    const weapon = this.getCurrentWeapon();
    return weapon ? weapon.absAttackPower : 0;
};

//=============================================================================
// Game_Player - Weapon Animation Integration
//=============================================================================

const _Game_Player_initialize = Game_Player.prototype.initialize;
Game_Player.prototype.initialize = function() {
    _Game_Player_initialize.call(this);
    this._currentWeapon = null;
    this._weaponAnimationIndex = 0;
    this._isAttacking = false;
    this._attackAnimationTimer = 0;
    this._lastAttackedEnemy = null;
};

Game_Player.prototype.getCurrentWeapon = function() {
    if ($gameParty.members().length > 0) {
        const actor = $gameParty.leader();
        if (actor) {
            return actor.getCurrentWeapon();
        }
    }
    return null;
};

Game_Player.prototype.getWeaponAnimationId = function() {
    const weapon = this.getCurrentWeapon();
    return weapon ? weapon.absAnimationId : 1;
};

Game_Player.prototype.getWeaponHitAnimationId = function() {
    const weapon = this.getCurrentWeapon();
    return weapon ? weapon.absHitAnimationId : 2;
};

Game_Player.prototype.getWeaponRange = function() {
    const weapon = this.getCurrentWeapon();
    return weapon ? weapon.absRange : 1;
};

Game_Player.prototype.getWeaponAttackType = function() {
    const weapon = this.getCurrentWeapon();
    return weapon ? weapon.absAttackType : 1;
};

Game_Player.prototype.getWeaponAttackPower = function() {
    const weapon = this.getCurrentWeapon();
    return weapon ? weapon.absAttackPower : 0;
};

//=============================================================================
// Game_Character - Weapon Attack Animation
//=============================================================================

const _Game_CharacterBase_performAttack = Game_CharacterBase.prototype.performAttack;
Game_CharacterBase.prototype.performAttack = function() {
    if (_Game_CharacterBase_performAttack) {
        _Game_CharacterBase_performAttack.call(this);
    }
    
    this._isAttacking = true;
    this._attackAnimationTimer = 10; // Duration attack animation
};

Game_Character.prototype.performWeaponAnimation = function() {
    if (this === $gamePlayer) {
        const animId = this.getWeaponAnimationId();
        if (animId > 0) {
            $gameTemp.requestAnimation([this], animId);
        }
    }
};

Game_Character.prototype.performWeaponHitAnimation = function(target) {
    if (target) {
        const animId = this.getWeaponHitAnimationId ? this.getWeaponHitAnimationId() : 1;
        if (animId > 0) {
            $gameTemp.requestAnimation([target], animId);
        }
    }
};

//=============================================================================
// Game_Player - Attack with Weapon
//=============================================================================

const _Game_Player_performAttack2 = Game_Player.prototype.performAttack;
Game_Player.prototype.performAttack = function() {
    _Game_Player_performAttack2.call(this);
    
    if (ABS.Weapon.enabled) {
        this.executeWeaponAttack();
    }
};

Game_Player.prototype.executeWeaponAttack = function() {
    const range = this.getWeaponRange();
    const weapon = this.getCurrentWeapon();
    
    if (!weapon) return;
    
    // Get enemies dalam range
    const enemies = this.getEnemiesInRange(range);
    
    if (enemies.length > 0) {
        // Show weapon animation
        this.performWeaponAnimation();
        
        // Attack setiap enemy dalam range
        for (let enemy of enemies) {
            const baseDamage = this._absAttackPower + this.getWeaponAttackPower();
            const damage = Math.max(1, baseDamage - enemy._absDefense);
            const isCritical = Math.random() < 0.1; // 10% critical
            
            if (isCritical) {
                damage = Math.floor(damage * 1.5);
            }
            
            enemy.damageABS(damage);
            
            // Show hit animation
            this.performWeaponHitAnimation(enemy);
            
            // Show damage popup
            $showDamagePopup(damage, enemy.x, enemy.y, isCritical);
            
            // Knockback effect
            const knockbackForce = 0.5;
            this.applyWeaponKnockback(enemy, knockbackForce);
        }
    }
};

Game_Player.prototype.getEnemiesInRange = function(range) {
    const enemies = [];
    const allEvents = $gameMap.events();
    
    for (let event of allEvents) {
        if (event.isABSEnemy && event.isABSEnemy()) {
            const distance = this.getABSDistance(event);
            if (distance <= range) {
                enemies.push(event);
            }
        }
    }
    
    return enemies;
};

Game_Player.prototype.applyWeaponKnockback = function(target, force) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        const knockbackX = (dx / distance) * force;
        const knockbackY = (dy / distance) * force;
        
        target._x += knockbackX;
        target._y += knockbackY;
    }
};

//=============================================================================
// Sprite_Character - Weapon Sprite
//=============================================================================

const _Sprite_Character_initialize = Sprite_Character.prototype.initialize;
Sprite_Character.prototype.initialize = function(character) {
    _Sprite_Character_initialize.call(this, character);
    this._weaponSprite = null;
    this._weaponAnimationTimer = 0;
};

const _Sprite_Character_update = Sprite_Character.prototype.update;
Sprite_Character.prototype.update = function() {
    _Sprite_Character_update.call(this);
    
    if (ABS.Weapon.showWeaponSprite && this._character === $gamePlayer) {
        this.updateWeaponSprite();
    }
};

Sprite_Character.prototype.updateWeaponSprite = function() {
    if (this._character._isAttacking) {
        if (!this._weaponSprite) {
            this.createWeaponSprite();
        }
        
        this._weaponAnimationTimer++;
        
        if (this._weaponAnimationTimer >= 10) {
            this._character._isAttacking = false;
            if (this._weaponSprite) {
                this.removeChild(this._weaponSprite);
                this._weaponSprite = null;
            }
            this._weaponAnimationTimer = 0;
        }
    }
};

Sprite_Character.prototype.createWeaponSprite = function() {
    const weapon = this._character.getCurrentWeapon();
    if (!weapon) return;
    
    this._weaponSprite = new Sprite();
    this._weaponSprite.bitmap = ImageManager.loadSystem('IconSet');
    
    const iconIndex = weapon.iconIndex;
    const sx = (iconIndex % 16) * ImageManager.iconWidth;
    const sy = Math.floor(iconIndex / 16) * ImageManager.iconHeight;
    
    this._weaponSprite.setFrame(sx, sy, ImageManager.iconWidth, ImageManager.iconHeight);
    this._weaponSprite.scale.x = 0.8;
    this._weaponSprite.scale.y = 0.8;
    
    // Position relative to player
    this._weaponSprite.x = 24;
    this._weaponSprite.y = -24;
    
    this.addChild(this._weaponSprite);
};

//=============================================================================
// Window_EquipStatus - Show Weapon Animation Info
//=============================================================================

const _Window_EquipStatus_drawParam = Window_EquipStatus.prototype.drawParam;
Window_EquipStatus.prototype.drawParam = function(paramId, x, y, width) {
    _Window_EquipStatus_drawParam.call(this, paramId, x, y, width);
    
    if (ABS.Weapon.enabled && this._actor && this._actor.equips()[0]) {
        const weapon = $dataWeapons[this._actor.equips()[0]];
        if (weapon) {
            this.drawWeaponInfo(weapon, x, y + 48, width);
        }
    }
};

Window_EquipStatus.prototype.drawWeaponInfo = function(weapon, x, y, width) {
    this.changeTextColor(this.normalColor());
    this.drawText('Weapon Info:', x, y, width);
    
    if (weapon.absAnimationId > 0) {
        this.drawText('Animation ID: ' + weapon.absAnimationId, x + 20, y + 24, width);
    }
    
    if (weapon.absRange > 1) {
        this.drawText('Range: ' + weapon.absRange + ' tile', x + 20, y + 48, width);
    }
    
    if (weapon.absAttackType === 2) {
        this.drawText('Type: Ranged', x + 20, y + 72, width);
    }
};

//=============================================================================
// Helper Functions
//=============================================================================

window.$getPlayerWeapon = function() {
    return $gamePlayer.getCurrentWeapon();
};

window.$changeWeapon = function(weaponId) {
    if ($gameParty.members().length > 0) {
        const actor = $gameParty.leader();
        actor.changeEquip(0, weaponId);
    }
};

window.$getWeaponAnimInfo = function(weaponId) {
    const weapon = $dataWeapons[weaponId];
    if (!weapon) return null;
    
    return {
        name: weapon.name,
        animationId: weapon.absAnimationId,
        hitAnimationId: weapon.absHitAnimationId,
        range: weapon.absRange,
        attackType: weapon.absAttackType === 1 ? 'Melee' : 'Ranged'
    };
};

console.log('ABS_Weapon.js loaded successfully!');
