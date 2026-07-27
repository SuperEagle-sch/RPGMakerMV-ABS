//=============================================================================
// ABS_Android.js
//=============================================================================

/*:
 * @plugindesc Android & Touch Controls untuk Action Battle System
 * @author SuperEagle-sch
 *
 * @param Touch Controls
 * @desc Enable touch controls untuk mobile
 * @type boolean
 * @default true
 *
 * @param Virtual Joystick
 * @desc Tampilkan virtual joystick di layar
 * @type boolean
 * @default true
 *
 * @param Joystick Position
 * @desc Posisi virtual joystick (bottomLeft, bottomRight, topLeft, topRight)
 * @type select
 * @option bottomLeft
 * @option bottomRight
 * @option topLeft
 * @option topRight
 * @default bottomLeft
 *
 * @param Joystick Size
 * @desc Ukuran virtual joystick (pixels)
 * @type number
 * @min 50
 * @max 300
 * @default 100
 *
 * @help
 * Plugin ini menambahkan kontrol Android dan touch/gamepad untuk ABS.
 * 
 * Features:
 * - Virtual Joystick untuk movement
 * - Touch buttons untuk skills
 * - Gamepad/Joystick support
 * - Responsive untuk berbagai screen size
 */

var Imported = Imported || {};
Imported.ABS_Android = true;

var ABS = ABS || {};
ABS.Android = {};
ABS.Android.params = PluginManager.parameters('ABS_Android');

ABS.Android.touchControlsEnabled = ABS.Android.params['Touch Controls'] === 'true';
ABS.Android.virtualJoystick = ABS.Android.params['Virtual Joystick'] === 'true';
ABS.Android.joystickPosition = ABS.Android.params['Joystick Position'] || 'bottomLeft';
ABS.Android.joystickSize = Number(ABS.Android.params['Joystick Size']) || 100;

ABS.Android.touchInput = {
    x: 0,
    y: 0,
    isPressed: false,
    touchX: 0,
    touchY: 0
};

//=============================================================================
// Sprite_VirtualJoystick
//=============================================================================

function Sprite_VirtualJoystick() {
    this.initialize.apply(this, arguments);
}

Sprite_VirtualJoystick.prototype = Object.create(Sprite.prototype);
Sprite_VirtualJoystick.prototype.constructor = Sprite_VirtualJoystick;

Sprite_VirtualJoystick.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    
    this._baseRadius = ABS.Android.joystickSize / 2;
    this._stickRadius = this._baseRadius / 2;
    this._angle = 0;
    this._distance = 0;
    this._pressed = false;
    this._centerX = 0;
    this._centerY = 0;
    
    this.setupPosition();
    this.createBitmap();
    this.setupTouchListener();
};

Sprite_VirtualJoystick.prototype.setupPosition = function() {
    const margin = 20;
    const position = ABS.Android.joystickPosition;
    const size = ABS.Android.joystickSize;
    
    switch (position) {
        case 'bottomLeft':
            this._centerX = margin + this._baseRadius;
            this._centerY = Graphics.height - margin - this._baseRadius;
            break;
        case 'bottomRight':
            this._centerX = Graphics.width - margin - this._baseRadius;
            this._centerY = Graphics.height - margin - this._baseRadius;
            break;
        case 'topLeft':
            this._centerX = margin + this._baseRadius;
            this._centerY = margin + this._baseRadius;
            break;
        case 'topRight':
            this._centerX = Graphics.width - margin - this._baseRadius;
            this._centerY = margin + this._baseRadius;
            break;
    }
    
    this.x = this._centerX - this._baseRadius;
    this.y = this._centerY - this._baseRadius;
};

Sprite_VirtualJoystick.prototype.createBitmap = function() {
    const size = ABS.Android.joystickSize + 20;
    this.bitmap = new Bitmap(size, size);
    
    // Draw outer circle (base)
    this.bitmap.fillRect(0, 0, size, size, 'rgba(0, 0, 0, 0)');
    this.bitmap.outlineColor = 'rgba(255, 255, 255, 0.3)';
    this.bitmap.outlineWidth = 2;
    this.bitmap.drawCircle(this._baseRadius + 10, this._baseRadius + 10, this._baseRadius, 'rgba(100, 100, 100, 0.3)');
    
    // Draw inner circle (stick)
    this.bitmap.outlineColor = 'rgba(255, 255, 255, 0.6)';
    this.bitmap.outlineWidth = 1;
    this.bitmap.drawCircle(this._baseRadius + 10, this._baseRadius + 10, this._stickRadius, 'rgba(150, 150, 150, 0.5)');
};

Sprite_VirtualJoystick.prototype.setupTouchListener = function() {
    document.addEventListener('touchstart', this.onTouchStart.bind(this), false);
    document.addEventListener('touchmove', this.onTouchMove.bind(this), false);
    document.addEventListener('touchend', this.onTouchEnd.bind(this), false);
};

Sprite_VirtualJoystick.prototype.onTouchStart = function(event) {
    const touch = event.touches[0];
    const x = touch.clientX * window.devicePixelRatio;
    const y = touch.clientY * window.devicePixelRatio;
    
    const dx = x - this._centerX;
    const dy = y - this._centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= this._baseRadius) {
        this._pressed = true;
    }
};

Sprite_VirtualJoystick.prototype.onTouchMove = function(event) {
    if (!this._pressed) return;
    
    const touch = event.touches[0];
    const x = touch.clientX * window.devicePixelRatio;
    const y = touch.clientY * window.devicePixelRatio;
    
    const dx = x - this._centerX;
    const dy = y - this._centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > this._baseRadius) {
        const angle = Math.atan2(dy, dx);
        this._distance = this._baseRadius;
        this._angle = angle;
    } else {
        this._distance = distance;
        this._angle = Math.atan2(dy, dx);
    }
    
    ABS.Android.touchInput.angle = this._angle;
    ABS.Android.touchInput.distance = this._distance;
};

Sprite_VirtualJoystick.prototype.onTouchEnd = function(event) {
    this._pressed = false;
    this._distance = 0;
    this._angle = 0;
    ABS.Android.touchInput.distance = 0;
};

Sprite_VirtualJoystick.prototype.update = function() {
    Sprite.prototype.update.call(this);
    
    // Update stick position based on touch
    if (this._distance > 0) {
        const stickX = Math.cos(this._angle) * Math.min(this._distance, this._baseRadius);
        const stickY = Math.sin(this._angle) * Math.min(this._distance, this._baseRadius);
        
        // Update visual (bisa ditambahkan nanti)
    }
};

//=============================================================================
// Sprite_TouchButtons - Tombol skill untuk mobile
//=============================================================================

function Sprite_TouchButtons() {
    this.initialize.apply(this, arguments);
}

Sprite_TouchButtons.prototype = Object.create(Sprite.prototype);
Sprite_TouchButtons.prototype.constructor = Sprite_TouchButtons;

Sprite_TouchButtons.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    
    this._buttons = [];
    this._skillIds = [1, 2, 3, 4]; // Default 4 skills
    
    this.createButtons();
    this.setupTouchListener();
};

Sprite_TouchButtons.prototype.createButtons = function() {
    const buttonSize = 60;
    const margin = 20;
    const startX = Graphics.width - (buttonSize + margin) * 4;
    const startY = Graphics.height - buttonSize - margin;
    
    for (let i = 0; i < this._skillIds.length; i++) {
        const button = {
            x: startX + i * (buttonSize + margin),
            y: startY,
            width: buttonSize,
            height: buttonSize,
            skillId: this._skillIds[i],
            pressed: false
        };
        
        this._buttons.push(button);
    }
};

Sprite_TouchButtons.prototype.setupTouchListener = function() {
    document.addEventListener('touchstart', this.onButtonTouchStart.bind(this), false);
    document.addEventListener('touchend', this.onButtonTouchEnd.bind(this), false);
};

Sprite_TouchButtons.prototype.onButtonTouchStart = function(event) {
    const touch = event.touches[0];
    const x = touch.clientX * window.devicePixelRatio;
    const y = touch.clientY * window.devicePixelRatio;
    
    for (let button of this._buttons) {
        if (x >= button.x && x <= button.x + button.width &&
            y >= button.y && y <= button.y + button.height) {
            button.pressed = true;
            this.onButtonPressed(button.skillId);
        }
    }
};

Sprite_TouchButtons.prototype.onButtonTouchEnd = function(event) {
    for (let button of this._buttons) {
        button.pressed = false;
    }
};

Sprite_TouchButtons.prototype.onButtonPressed = function(skillId) {
    if ($gamePlayer.canUseABSSkill(skillId)) {
        $gamePlayer.useABSSkill(skillId);
    }
};

//=============================================================================
// Input - Gamepad & Joystick Support
//=============================================================================

const _Input_update = Input.update;
Input.update = function() {
    _Input_update.call(this);
    this.updateGamepad();
};

Input.updateGamepad = function() {
    const gamepads = navigator.getGamepads();
    
    for (let i = 0; i < gamepads.length; i++) {
        const gamepad = gamepads[i];
        if (!gamepad) continue;
        
        // Analog stick input (left stick untuk movement)
        const deadzone = 0.3;
        
        if (Math.abs(gamepad.axes[0]) > deadzone) {
            ABS.Android.touchInput.stickX = gamepad.axes[0];
        }
        
        if (Math.abs(gamepad.axes[1]) > deadzone) {
            ABS.Android.touchInput.stickY = gamepad.axes[1];
        }
        
        // D-Pad atau buttons untuk skills
        // Button 0 = A, 1 = B, 2 = X, 3 = Y
        for (let j = 0; j < gamepad.buttons.length; j++) {
            if (gamepad.buttons[j].pressed) {
                this.handleGamepadButton(j);
            }
        }
    }
};

Input.handleGamepadButton = function(buttonIndex) {
    const skillMap = {
        0: 1,  // A button = Skill 1
        1: 2,  // B button = Skill 2
        2: 3,  // X button = Skill 3
        3: 4   // Y button = Skill 4
    };
    
    const skillId = skillMap[buttonIndex];
    if (skillId && $gamePlayer.canUseABSSkill(skillId)) {
        $gamePlayer.useABSSkill(skillId);
    }
};

//=============================================================================
// Scene_Map - Touch & Gamepad Integration
//=============================================================================

const _Scene_Map_create = Scene_Map.prototype.create;
Scene_Map.prototype.create = function() {
    _Scene_Map_create.call(this);
    
    if (ABS.Android.touchControlsEnabled) {
        this.createVirtualControls();
    }
};

Scene_Map.prototype.createVirtualControls = function() {
    if (ABS.Android.virtualJoystick) {
        this._virtualJoystick = new Sprite_VirtualJoystick();
        this.addWindow(this._virtualJoystick);
    }
    
    this._touchButtons = new Sprite_TouchButtons();
    this.addWindow(this._touchButtons);
};

const _Scene_Map_update2 = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
    _Scene_Map_update2.call(this);
    
    if (ABS.Android.touchControlsEnabled) {
        this.updateTouchInput();
    }
};

Scene_Map.prototype.updateTouchInput = function() {
    // Handle virtual joystick input untuk movement
    if (ABS.Android.touchInput.distance > 0) {
        const angle = ABS.Android.touchInput.angle;
        
        // Convert angle ke direction (4-way atau 8-way)
        const direction = this.angleToDirection(angle);
        
        if (direction) {
            $gamePlayer.moveStraight(direction);
        }
    }
};

Scene_Map.prototype.angleToDirection = function(angle) {
    // Convert radians to direction
    // 0 = right, 90 = down, 180/-180 = left, -90 = up
    
    const degrees = angle * 180 / Math.PI;
    
    // 8-way direction
    if (degrees >= -22.5 && degrees < 22.5) return 6; // Right
    if (degrees >= 22.5 && degrees < 67.5) return 3; // Down-Right
    if (degrees >= 67.5 && degrees < 112.5) return 2; // Down
    if (degrees >= 112.5 && degrees < 157.5) return 1; // Down-Left
    if (degrees >= 157.5 || degrees < -157.5) return 4; // Left
    if (degrees >= -157.5 && degrees < -112.5) return 7; // Up-Left
    if (degrees >= -112.5 && degrees < -67.5) return 8; // Up
    if (degrees >= -67.5 && degrees < -22.5) return 9; // Up-Right
    
    return null;
};

console.log('ABS_Android.js loaded successfully!');
