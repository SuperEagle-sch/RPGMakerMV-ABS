# Player Weapon Animation Setup Guide

## 📋 Daftar Isi
1. [Cara Setup Weapon Animation](#cara-setup)
2. [Weapon Database Configuration](#weapon-config)
3. [Animation Setup](#animation-setup)
4. [Contoh Praktis](#contoh-praktis)
5. [Advanced Setup](#advanced-setup)

---

## Cara Setup

### Step 1: Enable Plugin

1. Buka **Plugin Manager**
2. Cari **ABS_Weapon.js**
3. Set parameter:
   - **Enable Weapon Animation**: true
   - **Show Weapon Sprite**: true
   - **Animation Speed**: 5

### Step 2: Setup Weapon di Database

1. Buka **Database** → **Weapons**
2. Pilih atau buat weapon
3. Di field **Note**, tambahkan:

```
<absAnimId:5>
<absHitAnimId:6>
<absRange:2>
<absAttackType:1>
```

---

## Weapon Database Configuration

### Basic Parameters

| Parameter | Tipe | Contoh | Keterangan |
|-----------|------|--------|------------|
| **Name** | Text | Iron Sword | Nama weapon |
| **Type** | Select | Sword | Tipe weapon |
| **Attack Power** | Number | 25 | Base attack |
| **Attack Times** | Number | 1 | Hit count |
| **Hit Rate** | Percent | 90% | Akurasi |
| **Icon Index** | Number | 97 | Icon di UI |

### ABS Note Tag Parameters

```
<absAnimId:5>           // Animation saat player attack
<absHitAnimId:6>        // Animation saat enemy kena damage
<absRange:2>            // Attack range (tile)
<absAttackType:1>       // 1=Melee, 2=Ranged
<absAttackPower:10>     // Extra attack power bonus
```

### Contoh Weapon Setup

**Iron Sword (Melee, Close Range):**
```
<absAnimId:5>
<absHitAnimId:6>
<absRange:1>
<absAttackType:1>
```

**Spear (Melee, Medium Range):**
```
<absAnimId:7>
<absHitAnimId:8>
<absRange:2>
<absAttackType:1>
```

**Bow (Ranged):**
```
<absAnimId:9>
<absHitAnimId:10>
<absRange:5>
<absAttackType:2>
<absAttackPower:5>
```

**Greatsword (Melee, Slow, Powerful):**
```
<absAnimId:11>
<absHitAnimId:12>
<absRange:1>
<absAttackType:1>
<absAttackPower:15>
```

---

## Animation Setup

### Step 1: Buat Animation di Database

1. Buka **Database** → **Animations**
2. Buat animation baru untuk:
   - Attack animation (player attack)
   - Hit animation (enemy hit)

3. Setup Animation:
   - **Name**: Attack Effect (contoh)
   - **SE**: Pilih sound effect
   - **Flash**: Setup flash effect
   - **Frames**: Setup sprite animation frames

### Step 2: Dapatkan Animation ID

Setelah membuat animation, catat ID-nya:
- Animation ID 5 = Attack Effect
- Animation ID 6 = Hit Effect
- dst.

### Step 3: Link ke Weapon

Tambahkan di weapon note:
```
<absAnimId:5>
<absHitAnimId:6>
```

### Animation Priority

1. **Weapon Animation** (jika ada)
2. **Actor Animation** (default)
3. **Basic Animation** (fallback)

---

## Contoh Praktis

### Contoh 1: Simple Iron Sword

**Database → Weapons:**
- Name: Iron Sword
- Type: Sword
- Attack Power: 25
- Note:
```
<absAnimId:5>
<absHitAnimId:6>
<absRange:1>
<absAttackType:1>
```

**Result:**
- Attack dengan animation ID 5
- Enemy kena hit dengan animation ID 6
- Range 1 tile (melee)
- Damage = (Player ATK + 25) - Enemy DEF

### Contoh 2: Long Spear

**Database → Weapons:**
- Name: Long Spear
- Type: Spear
- Attack Power: 20
- Note:
```
<absAnimId:7>
<absHitAnimId:8>
<absRange:2>
<absAttackType:1>
```

**Result:**
- Attack reach 2 tile (lebih jauh)
- Damage lebih rendah (balance)

### Contoh 3: Magic Bow

**Database → Weapons:**
- Name: Magic Bow
- Type: Bow
- Attack Power: 15
- Note:
```
<absAnimId:9>
<absHitAnimId:10>
<absRange:6>
<absAttackType:2>
<absAttackPower:5>
```

**Result:**
- Ranged attack (6 tile)
- Lebih lemah tapi jarak jauh
- Total ATK = (Player ATK + 15 + 5) - Enemy DEF

### Contoh 4: Greatsword (Boss Weapon)

**Database → Weapons:**
- Name: Greatsword
- Type: Great Sword
- Attack Power: 35
- Note:
```
<absAnimId:11>
<absHitAnimId:12>
<absRange:1>
<absAttackType:1>
<absAttackPower:10>
```

**Result:**
- Damage tinggi (35 + 10)
- Attack animation keren
- Close range only

---

## Advanced Setup

### Multi-Hit Weapon

```javascript
// Modifikasi di ABS_Weapon.js
// Weapon dengan attack count lebih dari 1

Game_Player.prototype.executeWeaponAttack = function() {
    const weapon = this.getCurrentWeapon();
    const hitCount = weapon.attackTimes || 1;
    
    for (let i = 0; i < hitCount; i++) {
        setTimeout(() => {
            this.performWeaponAnimation();
            // Attack logic
        }, i * 100);
    }
};
```

### Special Weapon Effect

**Note Tag dengan effect:**
```
<absAnimId:5>
<absHitAnimId:6>
<absRange:1>
<absAttackType:1>
<absStunChance:20>      // 20% chance stun enemy
<absKnockback:2>        // Knockback force 2
```

### Weapon Combo System

```javascript
// Misal pressing attack button 3x = combo
Game_Player.prototype.handleWeaponCombo = function() {
    if (this._comboCount >= 3) {
        const weapon = this.getCurrentWeapon();
        const comboAnimId = weapon.absComboAnimId || weapon.absAnimId;
        
        // Execute combo attack
        this.performWeaponAnimation(comboAnimId);
        this._comboCount = 0;
    }
};
```

---

## Troubleshooting

### Problem: Animation tidak muncul

**Solution:**
```javascript
// Di console (F12):
const weapon = $gamePlayer.getCurrentWeapon();
console.log('Weapon:', weapon.name);
console.log('Animation ID:', weapon.absAnimationId);
console.log('Hit Animation ID:', weapon.absHitAnimationId);
```

Cek apakah animation ID valid di database.

### Problem: Weapon sprite tidak tampil

**Solution:**
- Cek parameter **Show Weapon Sprite**: true
- Verify weapon icon index di database
- Cek apakah IconSet image file ada

### Problem: Damage tidak sesuai

**Solution:**
```javascript
// Check weapon attack power
const weapon = $gamePlayer.getCurrentWeapon();
const baseDmg = $gamePlayer._absAttackPower;
const weaponBonus = weapon.absAttackPower;
const totalDmg = baseDmg + weaponBonus;
console.log('Total Damage:', totalDmg);
```

### Problem: Range tidak bekerja

**Solution:**
```javascript
// Debug range detection
const range = $gamePlayer.getWeaponRange();
const enemies = $gamePlayer.getEnemiesInRange(range);
console.log('Weapon Range:', range);
console.log('Enemies in Range:', enemies.length);
```

---

## Quick Reference

### Most Common Note Tags

```
<absAnimId:5>           // Required - Attack animation
<absHitAnimId:6>        // Recommended - Hit animation
<absRange:1>            // Default 1 (melee)
<absAttackType:1>       // 1=Melee (default), 2=Ranged
<absAttackPower:10>     // Bonus attack power
<absKnockback:1>        // Knockback force
```

### Check Weapon Info (Console)

```javascript
// Get current weapon
const wpn = $gamePlayer.getCurrentWeapon();

// Check all properties
console.log('Weapon Name:', wpn.name);
console.log('Anim ID:', wpn.absAnimationId);
console.log('Hit Anim ID:', wpn.absHitAnimationId);
console.log('Range:', wpn.absRange);
console.log('Type:', wpn.absAttackType);
console.log('Power Bonus:', wpn.absAttackPower);
```

### Script Commands

```javascript
// Get current weapon
$getPlayerWeapon();

// Change weapon
$changeWeapon(3);  // Change ke weapon ID 3

// Get weapon animation info
$getWeaponAnimInfo(2);  // Get info weapon ID 2
```

---

## Best Practices

1. **Balance Attack Range & Damage:**
   - Close range (1 tile) = High damage
   - Medium range (2-3 tile) = Medium damage
   - Long range (5+ tile) = Low damage

2. **Animation Variety:**
   - Use different animations per weapon type
   - Makes gameplay more visually interesting

3. **Sound Effects:**
   - Add SE (Sound Effect) ke animation
   - Makes hit feel more impactful

4. **Testing:**
   - Test weapon di berbagai enemy
   - Ensure damage balance
   - Check animation timing

---

## Performance Tips

- Limit active weapons dalam 1 session
- Optimize animation frame count
- Disable weapon sprite di low-end devices
- Use simpler animations untuk mobile

