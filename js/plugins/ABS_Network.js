//=============================================================================
// ABS_Network.js - Alpha Netz Integration
//=============================================================================

/*:
 * @plugindesc Alpha Netz Network Integration untuk ABS Multiplayer
 * @author SuperEagle-sch
 *
 * @param Server URL
 * @desc URL server Alpha Netz
 * @type string
 * @default http://localhost:3000
 *
 * @param Game Version
 * @desc Versi game untuk kompatibilitas
 * @type string
 * @default 1.0.0
 *
 * @param Enable Multiplayer
 * @desc Aktifkan fitur multiplayer
 * @type boolean
 * @default false
 *
 * @param Sync Interval
 * @desc Interval sync data (milliseconds)
 * @type number
 * @min 100
 * @max 5000
 * @default 500
 *
 * @help
 * Plugin ini mengintegrasikan Alpha Netz untuk fitur multiplayer ABS.
 * 
 * Features:
 * - Real-time player sync
 * - Multiplayer battles
 * - Chat system
 * - Friend system
 * 
 * Script Commands:
 * $networkManager.connect(playerId);     // Connect ke server
 * $networkManager.disconnect();          // Disconnect dari server
 * $networkManager.sendPlayerPosition();  // Send posisi player
 */

var Imported = Imported || {};
Imported.ABS_Network = true;

var ABS = ABS || {};
ABS.Network = {};
ABS.Network.params = PluginManager.parameters('ABS_Network');

ABS.Network.serverURL = ABS.Network.params['Server URL'] || 'http://localhost:3000';
ABS.Network.gameVersion = ABS.Network.params['Game Version'] || '1.0.0';
ABS.Network.enableMultiplayer = ABS.Network.params['Enable Multiplayer'] === 'true';
ABS.Network.syncInterval = Number(ABS.Network.params['Sync Interval']) || 500;

ABS.Network.players = {};
ABS.Network.isConnected = false;
ABS.Network.playerId = null;
ABS.Network.lastSyncTime = 0;

//=============================================================================
// NetworkManager - Main Manager
//=============================================================================

function NetworkManager() {
    this.initialize();
}

NetworkManager.prototype.initialize = function() {
    this._socket = null;
    this._connected = false;
    this._playerId = null;
    this._sessionId = null;
    this._messageQueue = [];
    this._lastSync = 0;
    this._retryCount = 0;
    this._maxRetries = 5;
};

NetworkManager.prototype.connect = function(playerId) {
    if (this._connected) return;
    
    this._playerId = playerId;
    
    try {
        this.initializeWebSocket();
    } catch (error) {
        console.error('Failed to connect to server:', error);
        this.retry();
    }
};

NetworkManager.prototype.initializeWebSocket = function() {
    const wsURL = ABS.Network.serverURL.replace('http', 'ws');
    
    this._socket = new WebSocket(wsURL);
    
    this._socket.onopen = this.onConnected.bind(this);
    this._socket.onmessage = this.onMessage.bind(this);
    this._socket.onerror = this.onError.bind(this);
    this._socket.onclose = this.onDisconnected.bind(this);
};

NetworkManager.prototype.onConnected = function() {
    console.log('Connected to server!');
    this._connected = true;
    this._retryCount = 0;
    ABS.Network.isConnected = true;
    
    // Send initial handshake
    this.send('HANDSHAKE', {
        playerId: this._playerId,
        gameVersion: ABS.Network.gameVersion,
        timestamp: Date.now()
    });
};

NetworkManager.prototype.onMessage = function(event) {
    try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
    } catch (error) {
        console.error('Error parsing message:', error);
    }
};

NetworkManager.prototype.handleMessage = function(data) {
    switch (data.type) {
        case 'PLAYER_UPDATE':
            this.handlePlayerUpdate(data);
            break;
        case 'PLAYER_JOINED':
            this.handlePlayerJoined(data);
            break;
        case 'PLAYER_LEFT':
            this.handlePlayerLeft(data);
            break;
        case 'ATTACK':
            this.handleRemoteAttack(data);
            break;
        case 'CHAT':
            this.handleChatMessage(data);
            break;
        case 'SYNC':
            this.handleSync(data);
            break;
        default:
            console.log('Unknown message type:', data.type);
    }
};

NetworkManager.prototype.handlePlayerUpdate = function(data) {
    const player = ABS.Network.players[data.playerId];
    if (player) {
        player.x = data.x;
        player.y = data.y;
        player.hp = data.hp;
        player.direction = data.direction;
    }
};

NetworkManager.prototype.handlePlayerJoined = function(data) {
    ABS.Network.players[data.playerId] = {
        id: data.playerId,
        name: data.playerName,
        x: data.x,
        y: data.y,
        hp: data.hp,
        maxHp: data.maxHp,
        class: data.class,
        level: data.level
    };
    
    console.log('Player joined:', data.playerName);
};

NetworkManager.prototype.handlePlayerLeft = function(data) {
    delete ABS.Network.players[data.playerId];
    console.log('Player left:', data.playerId);
};

NetworkManager.prototype.handleRemoteAttack = function(data) {
    // Handle serangan dari player lain
    const attacker = ABS.Network.players[data.attackerId];
    const target = ABS.Network.players[data.targetId];
    
    if (target) {
        target.hp -= data.damage;
        console.log(`${attacker?.name || 'Player'} deals ${data.damage} damage!`);
    }
};

NetworkManager.prototype.handleChatMessage = function(data) {
    // Display chat message
    if (window.$chatWindow) {
        $chatWindow.addMessage(data.playerName, data.message);
    }
};

NetworkManager.prototype.handleSync = function(data) {
    // Update game state dari server
    if (data.players) {
        for (let playerId in data.players) {
            if (playerId !== this._playerId) {
                ABS.Network.players[playerId] = data.players[playerId];
            }
        }
    }
};

NetworkManager.prototype.onError = function(error) {
    console.error('WebSocket error:', error);
};

NetworkManager.prototype.onDisconnected = function() {
    console.log('Disconnected from server');
    this._connected = false;
    ABS.Network.isConnected = false;
    this.retry();
};

NetworkManager.prototype.disconnect = function() {
    if (this._socket) {
        this._socket.close();
        this._connected = false;
        ABS.Network.isConnected = false;
    }
};

NetworkManager.prototype.send = function(type, data) {
    if (!this._connected) {
        this._messageQueue.push({ type: type, data: data });
        return;
    }
    
    const message = {
        type: type,
        data: data,
        timestamp: Date.now()
    };
    
    this._socket.send(JSON.stringify(message));
};

NetworkManager.prototype.sendPlayerPosition = function() {
    if (!this._connected) return;
    
    const now = Date.now();
    if (now - this._lastSync < ABS.Network.syncInterval) return;
    
    this._lastSync = now;
    
    this.send('PLAYER_UPDATE', {
        playerId: this._playerId,
        x: $gamePlayer.x,
        y: $gamePlayer.y,
        hp: $gamePlayer._absHP,
        maxHp: $gamePlayer._absMaxHP,
        direction: $gamePlayer.direction(),
        mapId: $gameMap.mapId()
    });
};

NetworkManager.prototype.sendAttack = function(targetId, damage, skillId) {
    this.send('ATTACK', {
        attackerId: this._playerId,
        targetId: targetId,
        damage: damage,
        skillId: skillId
    });
};

NetworkManager.prototype.sendChatMessage = function(message) {
    this.send('CHAT', {
        playerId: this._playerId,
        playerName: $gameVariables.getValue(1), // Assume var 1 = player name
        message: message
    });
};

NetworkManager.prototype.retry = function() {
    if (this._retryCount >= this._maxRetries) {
        console.error('Max retries reached');
        return;
    }
    
    this._retryCount++;
    const delay = Math.pow(2, this._retryCount) * 1000; // Exponential backoff
    
    console.log(`Retrying connection in ${delay}ms...`);
    setTimeout(() => {
        this.connect(this._playerId);
    }, delay);
};

// Create global instance
window.$networkManager = new NetworkManager();

//=============================================================================
// Scene_Map - Network Integration
//=============================================================================

const _Scene_Map_update3 = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
    _Scene_Map_update3.call(this);
    
    if (ABS.Network.enableMultiplayer && window.$networkManager._connected) {
        this.updateNetworkSync();
    }
};

Scene_Map.prototype.updateNetworkSync = function() {
    $networkManager.sendPlayerPosition();
};

//=============================================================================
// Script Commands
//=============================================================================

window.$connectNetwork = function(playerId) {
    $networkManager.connect(playerId);
};

window.$disconnectNetwork = function() {
    $networkManager.disconnect();
};

window.$sendChatMessage = function(message) {
    $networkManager.sendChatMessage(message);
};

window.$getNetworkPlayers = function() {
    return ABS.Network.players;
};

console.log('ABS_Network.js loaded successfully!');
