//=============================================================================
// ABS_Gamepad.js - Advanced Gamepad Support
//=============================================================================

/*:
 * @plugindesc Advanced Gamepad & Joystick Support untuk ABS
 * @author SuperEagle-sch
 *
 * @param Gamepad Enabled
 * @desc Aktifkan gamepad support
 * @type boolean
 * @default true
 *
 * @param Deadzone
 * @desc Deadzone untuk analog stick (0.0-1.0)
 * @type number
 * @decimals 2
 * @min 0.0
 * @max 1.0
 * @default 0.3
 *
 * @param Vibration
 * @desc Enable vibration feedback
 * @type boolean
 * @default true
 *
 * @param Sensitivity
 * @desc Sensitivitas gamepad (0.5-2.0)
 * @type number
 * @decimals 1
 * @min 0.5
 * @max 2.0
 * @default 1.0
 *
 * @help
 * Plugin ini menambahkan support untuk gamepad dan joystick.
 * 
 * Features:
 * - Multi-gamepad support (hingga 4 gamepad)
 * - Analog stick input
 * - Trigger support (L2/R2)
 * - Vibration feedback
 * - Customizable button mapping
 */

var Imported = Imported || {};
Imported.ABS_Gamepad = true;

var ABS = ABS || {};
ABS.Gamepad = {};
ABS.Gamepad.params = PluginManager.parameters('ABS_Gamepad');

ABS.Gamepad.enabled = ABS.Gamepad.params['Gamepad Enabled'] === 'true';
ABS.Gamepad.deadzone = Number(ABS.Gamepad.params['Deadzone']) || 0.3;
ABS.Gamepad.vibrationEnabled = ABS.Gamepad.params['Vibration'] === 'true';
ABS.Gamepad.sensitivity = Number(ABS.Gamepad.params['Sensitivity']) || 1.0;

ABS.Gamepad.gamepads = {};
ABS.Gamepad.buttonMap = {
    'A': 0,      // Jump/Attack
    'B': 1,      // Back
    'X': 2,      // Skill 1
    'Y': 3,      // Skill 2
    'LB': 4,     // Skill 3
    'RB': 5,     // Skill 4
    'BACK': 6,   // Menu
    'START': 7,  // Start
    'LS': 8,     // Left stick press
    'RS': 9      // Right stick press
};

//=============================================================================
// GamepadInput - Gamepad State Manager
//=============================================================================

function GamepadInput() {
    this.initialize();
}

GamepadInput.prototype.initialize = function() {
    this.index = 0;
    this.deadzone = ABS.Gamepad.deadzone;
    this.buttons = {};
    this.axes = {};
    this.lastButtons = {};
    this.lastAxes = {};
    
    // Initialize button states
    for (let buttonName in ABS.Gamepad.buttonMap) {
        this.buttons[buttonName] = false;
        this.lastButtons[buttonName] = false;
    }
};

GamepadInput.prototype.update = function(gamepad) {
    if (!gamepad) return;
    
    // Update buttons
    for (let i = 0; i < gamepad.buttons.length; i++) {
        this.updateButton(i, gamepad.buttons[i].pressed);
    }
    
    // Update axes
    this.updateAxes(gamepad);
};

GamepadInput.prototype.updateButton = function(buttonIndex, pressed) {
    for (let buttonName in ABS.Gamepad.buttonMap) {
        if (ABS.Gamepad.buttonMap[buttonName] === buttonIndex) {
            this.lastButtons[buttonName] = this.buttons[buttonName];
            this.buttons[buttonName] = pressed;
        }
    }
};

GamepadInput.prototype.updateAxes = function(gamepad) {
    // Left stick
    const leftX = this.applyDeadzone(gamepad.axes[0]);
    const leftY = this.applyDeadzone(gamepad.axes[1]);
    
    // Right stick
    const rightX = this.applyDeadzone(gamepad.axes[2]);
    const rightY = this.applyDeadzone(gamepad.axes[3]);
    
    // Triggers (L2/R2)
    const leftTrigger = gamepad.buttons[6]?.value || 0;
    const rightTrigger = gamepad.buttons[7]?.value || 0;
    
    this.axes = {
        leftX: leftX,
        leftY: leftY,
        rightX: rightX,
        rightY: rightY,
        leftTrigger: leftTrigger,
        rightTrigger: rightTrigger
    };
};

GamepadInput.prototype.applyDeadzone = function(value) {
    if (Math.abs(value) < this.deadzone) {
        return 0;
    }
    
    // Normalize value
    const sign = value > 0 ? 1 : -1;
    const normalizedValue = (Math.abs(value) - this.deadzone) / (1 - this.deadzone);
    return sign * normalizedValue * ABS.Gamepad.sensitivity;
};

GamepadInput.prototype.isButtonPressed = function(buttonName) {
    return this.buttons[buttonName] === true;
};

GamepadInput.prototype.isButtonTriggered = function(buttonName) {
    return this.buttons[buttonName] === true && this.lastButtons[buttonName] === false;
};

GamepadInput.prototype.isButtonReleased = function(buttonName) {
    return this.buttons[buttonName] === false && this.lastButtons[buttonName] === true;
};

GamepadInput.prototype.vibrate = function(duration, intensity) {
    if (!ABS.Gamepad.vibrationEnabled) return;
    
    try {
        if (navigator.vibrate) {
            navigator.vibrate(duration);
        } else if (navigator.webkitVibrate) {
            navigator.webkitVibrate(duration);
        }
    } catch (error) {
        console.error('Vibration not supported:', error);
    }
};

//=============================================================================
// Input - Gamepad Manager
//=============================================================================

const _Input_initialize = Input.initialize;
Input.initialize = function() {
    _Input_initialize.call(this);
    
    if (ABS.Gamepad.enabled) {
        this.initializeGamepads();
    }
};

Input.initializeGamepads = function() {
    for (let i = 0; i < 4; i++) {
        ABS.Gamepad.gamepads[i] = new GamepadInput();
        ABS.Gamepad.gamepads[i].index = i;
    }
};

const _Input_update2 = Input.update;
Input.update = function() {
    _Input_update2.call(this);
    
    if (ABS.Gamepad.enabled) {
        this.updateGamepads();
    }
};

Input.updateGamepads = function() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : navigator.webkitGetGamepads();
    
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            const gamepadInput = ABS.Gamepad.gamepads[i];
            if (gamepadInput) {
                gamepadInput.update(gamepads[i]);
                this.handleGamepadInput(i, gamepadInput);
            }
        }
    }
};

Input.handleGamepadInput = function(gamepadIndex, gamepadInput) {
    // Handle movement dari left stick
    const moveX = gamepadInput.axes.leftX;
    const moveY = gamepadInput.axes.leftY;
    
    if (Math.abs(moveX) > 0.1 || Math.abs(moveY) > 0.1) {
        this.handleAnalogMovement(moveX, moveY);
    }
    
    // Handle button presses
    this.handleGamepadButtons(gamepadInput);
    
    // Handle triggers
    if (gamepadInput.axes.rightTrigger > 0) {
        this.handleRightTrigger(gamepadInput.axes.rightTrigger);
    }
    
    if (gamepadInput.axes.leftTrigger > 0) {
        this.handleLeftTrigger(gamepadInput.axes.leftTrigger);
    }
};

Input.handleAnalogMovement = function(x, y) {
    const magnitude = Math.sqrt(x * x + y * y);
    const angle = Math.atan2(y, x);
    
    // Convert to direction (8-way)
    const degrees = angle * 180 / Math.PI;
    
    let direction = 0;
    if (degrees >= -22.5 && degrees < 22.5) direction = 6; // Right
    else if (degrees >= 22.5 && degrees < 67.5) direction = 3; // Down-Right
    else if (degrees >= 67.5 && degrees < 112.5) direction = 2; // Down
    else if (degrees >= 112.5 && degrees < 157.5) direction = 1; // Down-Left
    else if (degrees >= 157.5 || degrees < -157.5) direction = 4; // Left
    else if (degrees >= -157.5 && degrees < -112.5) direction = 7; // Up-Left
    else if (degrees >= -112.5 && degrees < -67.5) direction = 8; // Up
    else if (degrees >= -67.5 && degrees < -22.5) direction = 9; // Up-Right
    
    if (direction > 0 && $gamePlayer) {
        $gamePlayer.moveStraight(direction);
    }
};

Input.handleGamepadButtons = function(gamepadInput) {
    // A button = Attack
    if (gamepadInput.isButtonTriggered('A')) {
        $gamePlayer.performAttack();
    }
    
    // X, Y, LB, RB = Skills
    const skillMap = {
        'X': 1,
        'Y': 2,
        'LB': 3,
        'RB': 4
    };
    
    for (let button in skillMap) {
        if (gamepadInput.isButtonTriggered(button)) {
            const skillId = skillMap[button];
            if ($gamePlayer.canUseABSSkill(skillId)) {
                $gamePlayer.useABSSkill(skillId);
                gamepadInput.vibrate(50, 0.5);
            }
        }
    }
    
    // START = Menu
    if (gamepadInput.isButtonTriggered('START')) {
        SceneManager.push(Scene_Menu);
    }
    
    // BACK = Open map
    if (gamepadInput.isButtonTriggered('BACK')) {
        SceneManager.push(Scene_Map);
    }
};

Input.handleRightTrigger = function(intensity) {
    // Right trigger untuk special attack atau dodge
    if (intensity > 0.5) {
        if ($gamePlayer && $gamePlayer.canAttack()) {
            $gamePlayer.performAttack();
        }
    }
};

Input.handleLeftTrigger = function(intensity) {
    // Left trigger untuk defense atau skill
};

//=============================================================================
// Helper Functions
//=============================================================================

window.$getGamepadStatus = function(gamepadIndex) {
    const gamepadInput = ABS.Gamepad.gamepads[gamepadIndex];
    if (!gamepadInput) return null;
    
    return {
        leftX: gamepadInput.axes.leftX,
        leftY: gamepadInput.axes.leftY,
        rightX: gamepadInput.axes.rightX,
        rightY: gamepadInput.axes.rightY,
        buttons: gamepadInput.buttons
    };
};

window.$vibrateGamepad = function(gamepadIndex, duration, intensity) {
    const gamepadInput = ABS.Gamepad.gamepads[gamepadIndex];
    if (gamepadInput) {
        gamepadInput.vibrate(duration, intensity);
    }
};

console.log('ABS_Gamepad.js loaded successfully!');
