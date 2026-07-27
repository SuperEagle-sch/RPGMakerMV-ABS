# Enemy Setup Guide - ABS Plugin

## 📋 Daftar Isi
1. [Cara Membuat Enemy di RPG Maker](#cara-membuat-enemy)
2. [Setup Enemy di Map](#setup-enemy-di-map)
3. [Configure Enemy Stats](#configure-enemy-stats)
4. [Enemy AI Behavior](#enemy-ai-behavior)
5. [Contoh Praktis](#contoh-praktis)

---

## Cara Membuat Enemy

### Step 1: Setup Database Enemy

1. Buka RPG Maker MV Project
2. Klik **Database** → **Enemies**
3. Tambah enemy baru:
   - **Name**: Nama enemy (misal: "Goblin", "Orc Warrior")
   - **HP**: 50-100
   - **MP**: 20-50
   - **Attack**: 8-15
   - **Defense**: 3-8
   - **Sprite**: Pilih character sprite untuk visual
   - **Battler**: Pilih sprite jika pakai side-view

### Step 2: Set Enemy Parameters

| Parameter | Min | Max | Rekomendasi |
|-----------|-----|-----|-------------|
| HP | 30 | 200 | 80 |
| MP | 0 | 100 | 30 |
| Attack | 5 | 30 | 12 |
| Defense | 2 | 20 | 5 |
| M.Atk | 0 | 20 | 8 |
| M.Def | 0 | 15 | 4 |
| Agility | 1 | 20 | 6 |
| Luck | 0 | 20 | 1 |

---

## Setup Enemy di Map

### Method 1: Via Event Editor (Paling Mudah)

**Step-by-step:**

1. **Buka Map dan Tambah Event:**
   - Klik kanan di map → **New Event**
   - Atur posisi enemy
   - Tentukan trigger: **Action Button** atau **Player Touch**

2. **Setup Event Commands:**
   ```
   Event Commands:
   ├─ Script: this.initABSEnemy(1)    // Enemy ID 1
   ├─ Script: this.setABSStats(50, 20, 10, 5, 1.0)
   ├─ Script: $gameSystem.setABSInBattle(true)
   └─ Change Event Image: Pilih sprite enemy
   ```

3. **Full Event Script:**
   ```javascript
   // Di event comment atau script
   this.initABSEnemy(1);  // Gunakan enemy dari database ID 1
   this.setABSStats(50, 20, 10, 5, 1.0);
   // Parameters: HP, MP, Attack, Defense, Speed
   ```

### Method 2: Via Plugin Command (Lebih Fleksibel)

Tambahkan di event dengan **Script** command:

```javascript
// Spawn enemy di koordinat tertentu
const event = $gameMap.event(1);  // Event ID 1
event.initABSEnemy(2);  // Enemy ID 2 dari database
event.show();  // Tampilkan enemy
```

### Method 3: Via JavaScript (Advanced)

Buat di **Plugin Command** atau custom plugin:

```javascript
// Create enemy object
const enemy = {
    id: 1,
    name: "Goblin",
    x: 5,
    y: 5,
    hp: 50,
    mp: 20,
    atk: 10,
    def: 5,
    spd: 1.0
};

// Spawn di map
const event = $gameMap.event(1);
event.initABSEnemy(enemy.id);
event.setABSStats(enemy.hp, enemy.mp, enemy.atk, enemy.def, enemy.spd);
```

---

## Configure Enemy Stats

### Stat Configuration

```javascript
// Format: setABSStats(HP, MP, Attack, Defense, Speed)

// Weak Enemy
event.setABSStats(30, 10, 5, 2, 0.8);

// Normal Enemy
event.setABSStats(50, 20, 10, 5, 1.0);

// Strong Enemy
event.setABSStats(100, 40, 20, 10, 1.3);

// Boss Enemy
event.setABSStats(200, 80, 30, 15, 1.5);
```

### Enemy Difficulty Levels

**Easy:**
```javascript
this.initABSEnemy(1);
this.setABSStats(40, 15, 8, 3, 0.9);
```

**Normal:**
```javascript
this.initABSEnemy(2);
this.setABSStats(60, 25, 12, 6, 1.0);
```

**Hard:**
```javascript
this.initABSEnemy(3);
this.setABSStats(100, 40, 18, 10, 1.2);
```

**Insane:**
```javascript
this.initABSEnemy(4);
this.setABSStats(150, 60, 25, 14, 1.4);
```

---

## Enemy AI Behavior

### Default AI Behavior

Enemy otomatis akan:
1. **Search** player dalam radius 5 tile
2. **Chase** player saat terlihat
3. **Attack** saat dalam range (1 tile)
4. **Patrol** saat tidak ada target
5. **Heal** otomatis 2% HP per 60 frame

### Custom AI Behavior

```javascript
// Modify search range
event._searchRange = 8;  // Cari player 8 tile jauh

// Modify aggressiveness
event._aggressiveness = 1.5;  // 1.5x lebih aggressive

// Modify attack speed
event._absAttackSpeed = 1.5;  // Attack 1.5x lebih cepat
```

---

## Contoh Praktis

### Contoh 1: Goblin Sederhana

```javascript
// Event Command Script:
const event = this;  // Current event
event.initABSEnemy(1);  // Goblin dari database
event.setABSStats(50, 20, 10, 5, 1.0);
event._searchRange = 5;  // Cari player 5 tile
```

### Contoh 2: Orc Warrior (Medium Difficulty)

```javascript
const event = this;
event.initABSEnemy(3);  // Orc Warrior ID 3
event.setABSStats(80, 30, 15, 8, 1.2);
event._searchRange = 6;
event._aggressiveness = 1.2;
```

### Contoh 3: Dragon Boss

```javascript
const event = this;
event.initABSEnemy(5);  // Dragon ID 5
event.setABSStats(250, 100, 35, 15, 1.4);
event._searchRange = 10;  // Cari player jauh
event._aggressiveness = 1.5;
event._absAttackSpeed = 1.3;  // Attack cepat
```

### Contoh 4: Multiple Enemies di Satu Map

```javascript
// Event 1: Goblin
const event1 = $gameMap.event(1);
event1.initABSEnemy(1);
event1.setABSStats(50, 20, 10, 5, 1.0);

// Event 2: Goblin (sama)
const event2 = $gameMap.event(2);
event2.initABSEnemy(1);
event2.setABSStats(50, 20, 10, 5, 1.0);

// Event 3: Orc Warrior
const event3 = $gameMap.event(3);
event3.initABSEnemy(3);
event3.setABSStats(80, 30, 15, 8, 1.2);
```

---

## Advanced Setup

### Spawn Enemy Dinamis (Saat Battle Mulai)

```javascript
// Trigger: Event Touch atau Action Button

// Script Command:
$gameSystem.enableABS(true);
$gameSystem.setABSInBattle(true);

// Spawn enemy
const event = $gameMap.event(1);
event.initABSEnemy(2);
event.show();
event.setABSStats(60, 25, 12, 6, 1.0);
```

### Enemy Disappear Saat Mati

```javascript
// Enemy otomatis erase() saat HP <= 0
// Tapi jika perlu custom:

if (event._absHP <= 0) {
    event.erase();
    // Add reward/drop item
    $gameParty.gainGold(100);
}
```

### Random Enemy Spawn

```javascript
// Random enemy dari 3 pilihan
const enemyIds = [1, 2, 3];  // Goblin, Orc, Skeleton
const randomEnemy = enemyIds[Math.randomInt(enemyIds.length)];

const event = this;
event.initABSEnemy(randomEnemy);
event.setABSStats(60, 25, 12, 6, 1.0);
```

---

## Debugging

### Check Enemy Status

```javascript
// Di console browser (F12):
const enemy = $gameMap.event(1);
console.log('Enemy HP:', enemy._absHP);
console.log('Enemy Max HP:', enemy._absMaxHP);
console.log('Enemy Attack:', enemy._absAttackPower);
console.log('Is ABS Enemy?', enemy.isABSEnemy());
```

### Common Issues

**Problem: Enemy tidak muncul**
- ✓ Cek apakah `initABSEnemy()` sudah dipanggil
- ✓ Cek apakah event sudah di-show
- ✓ Cek apakah ABS enabled: `$gameSystem.enableABS(true)`

**Problem: Enemy tidak bergerak**
- ✓ Cek apakah `isABSInBattle()` return true
- ✓ Cek apakah event ada di map dengan koordinat

**Problem: Enemy tidak attack**
- ✓ Cek stat attack > 0
- ✓ Cek apakah player dalam range
- ✓ Cek cooldown attack

---

## Quick Reference

```javascript
// Most Common Commands:

// 1. Initialize enemy
event.initABSEnemy(enemyId);

// 2. Set stats
event.setABSStats(hp, mp, attack, defense, speed);

// 3. Deal damage
event.damageABS(damage);

// 4. Heal
event.healABS(healing);

// 5. Check distance
const dist = event.getABSDistance($gamePlayer);

// 6. Perform attack
event.performAttack();

// 7. Check if can attack
if (event.canAttack()) { event.performAttack(); }

// 8. Remove enemy
event.erase();
```
