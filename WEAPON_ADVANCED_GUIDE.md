# Advanced Weapon Animation System Guide (Alpha ABS Z Style)

## 🎮 Fitur Utama

### 1. **Direction-Based Animations**
- Animation berbeda untuk setiap arah attack (up, down, left, right)
- Creates more dynamic combat experience
- Animasi khusus untuk diagonal movements

### 2. **Combo System**
- Tekan attack button 3x dalam 30 frame = Combo attack
- Combo damage: 1.5x dari normal attack
- Combo range diperluas 1 tile
- Reset counter jika tidak tekan dalam waktu tertentu

### 3. **Charge Attack**
- Hold attack button untuk charge
- Max charge time: 60 frame (1 detik)
- Damage scale: 1.0x - 2.0x (tergantung charge time)
- Range diperluas 2 tile saat charged
- Visual effect saat charging

### 4. **Weapon Trail Effects**
- Visual trail saat weapon swing
- Customizable trail color per weapon
- Impact particles saat enemy kena damage

### 5. **Hitstun System**
- Enemy freeze frame saat kena attack
- Prevent rapid multi-hit dari player
- Configurable per weapon

### 6. **Multi-Hit Weapons**
- Support untuk weapon dengan multiple hits
- Each hit dapat trigger animation sendiri

---

## 📋 Setup Guide

### Step 1: Enable Plugin

```
Plugin Manager:
1. ABS_WeaponAdvanced.js
2. Enable Weapon Animation: true
3. Enable Combo System: true
4. Enable Charge Attack: true
5. Direction Animation: true
6. Show Impact Effect: true
7. Show Weapon Trail: true
```

### Step 2: Create Animations

**Database → Animations:**

Buat animation untuk setiap arah attack:
- Animation ID 5: Attack (Default)
- Animation ID 15: Attack Up
- Animation ID 16: Attack Down
- Animation ID 17: Attack Left
- Animation ID 18: Attack Right
- Animation ID 25: Combo Attack
- Animation ID 26: Charge Attack

### Step 3: Configure Weapon

**Database → Weapons:**

#### Basic Sword Setup:
```
Name: Iron Sword
Attack Power: 25

Note:
<absAnimId:5>
<absAnimUpId:15>
<absAnimDownId:16>
<absAnimLeftId:17>
<absAnimRightId:18>
<absComboAnimId:25>
<absChargeAnimId:26>
<absRange:1>
<absHitCount:1>
<absHitstun:20>
<absKnockback:1.0>
<absCriticalChance:15>
```

#### Advanced Spear Setup:
```
Name: Dragon Spear
Attack Power: 30

Note:
<absAnimId:7>
<absAnimUpId:35>
<absAnimDownId:36>
<absAnimLeftId:37>
<absAnimRightId:38>
<absComboAnimId:45>
<absChargeAnimId:46>
<absRange:2>
<absHitCount:2>
<absHitstun:25>
<absKnockback:1.5>
<absCriticalChance:20>
<absElement:4>
<absTrailColor:#00FFFF>
```

#### Fire Sword with Element:
```
Name: Flaming Sword
Attack Power: 28

Note:
<absAnimId:9>
<absAnimUpId:19>
<absAnimDownId:20>
<absAnimLeftId:21>
<absAnimRightId:22>
<absComboAnimId:27>
<absChargeAnimId:28>
<absRange:1>
<absHitCount:1>
<absHitstun:20>
<absKnockback:0.8>
<absCriticalChance:12>
<absElement:2>
<absTrailColor:#FF6600>
```

---

## 🎯 Note Tag Reference

### Animation Tags
```
<absAnimId:5>              // Default attack animation
<absAnimUpId:15>           // Animation saat attack ke atas
<absAnimDownId:16>         // Animation saat attack ke bawah
<absAnimLeftId:17>         // Animation saat attack ke kiri
<absAnimRightId:18>        // Animation saat attack ke kanan
<absComboAnimId:25>        // Animation untuk combo (hit 3x)
<absChargeAnimId:26>       // Animation untuk charged attack
```

### Combat Tags
```
<absRange:1>               // Attack range (tile)
<absHitCount:1>            // Number of hits in combo
<absHitstun:20>            // Enemy freeze frame (1/60 detik)
<absKnockback:1.0>         // Knockback force
<absCriticalChance:15>     // Critical hit chance (percent)
<absElement:2>             // Element ID (1=normal, 2=fire, 3=ice, 4=lightning)
<absTrailColor:#FF0000>    // Trail color (hex)
```

---

## 🎪 Combat Mechanics

### Normal Attack
```
Press Attack Button:
- Play direction-based animation
- Deal normal damage
- Apply knockback
- Show impact effect
- Trigger hitstun pada enemy
```

### Combo Attack (Alpha ABS Z Style)
```
Press Attack 3x dalam 30 frame:
- Play combo animation
- Deal 1.5x damage
- Extended range (+1 tile)
- Larger impact effect
- Reset combo counter
```

### Charge Attack
```
Hold Attack Button (max 60 frame):
- Play charge effect (particles)
- Damage scales: 1.0x → 2.0x
- Extended range (+2 tile)
- Release button untuk execute
- Larger impact area
```

### Element Effects
```
<absElement:2> (Fire):
- Add fire visual effect
- 30 frame duration

<absElement:3> (Ice):
- Slow enemy movement
- Blue trail color

<absElement:4> (Lightning):
- Chain effect
- Yellow/cyan trail
```

---

## 📊 Weapon Balance Examples

### Fast Attack Weapon (Dagger)
```
<absAnimId:5>
<absRange:1>
<absHitCount:1>
<absHitstun:10>
<absKnockback:0.3>
<absCriticalChance:25>
```

### Balanced Weapon (Sword)
```
<absAnimId:5>
<absAnimUpId:15>
<absAnimDownId:16>
<absRange:1>
<absHitCount:1>
<absHitstun:20>
<absKnockback:1.0>
<absCriticalChance:15>
```

### Slow Heavy Weapon (Greatsword)
```
<absAnimId:5>
<absComboAnimId:25>
<absChargeAnimId:26>
<absRange:1>
<absHitCount:2>
<absHitstun:30>
<absKnockback:1.5>
<absCriticalChance:10>
```

### Range Weapon (Spear)
```
<absAnimId:7>
<absRange:2>
<absHitCount:1>
<absHitstun:15>
<absKnockback:0.8>
<absCriticalChance:12>
```

---

## 🎬 Animation Tips

### Creating Good Attack Animations

1. **Frame Count**: 8-12 frames per direction
2. **Speed**: 8-10 frame duration
3. **Easing**: Ease-in for start, ease-out for recovery

### Combo Animation Guidelines

- Faster than normal attack
- More frames untuk bigger visual impact
- Flash effects untuk emphasize power

### Charge Animation Guidelines

- Gradual build-up effect
- Glow/aura around player
- Particle effects

---

## 🔧 Advanced Configuration

### Custom Damage Calculation

```javascript
// Modify di ABS_WeaponAdvanced.js:
const baseDamage = this._absAttackPower * damageMultiplier;
const weaponBonus = weapon.params.atk || 0;
const finalDamage = Math.max(1, (baseDamage + weaponBonus) - enemy._absDefense);
```

### Enable Direction Animation Only untuk Certain Weapons

```javascript
// Add custom property:
<absDirectionAnim:true>
<absDirectionAnim:false>
```

### Custom Hitstun per Enemy

```javascript
// Enemy properties:
this._hitstunResistance = 0.8; // 80% normal hitstun
// actual hitstun = weapon.absHitstun * 0.8
```

---

## 🐛 Troubleshooting

### Issue: Direction animations tidak work

**Solution:**
- Check: Direction Animation = true di plugin param
- Verify animation IDs untuk setiap arah
- Test di console: `$gamePlayer.direction()`

### Issue: Combo tidak trigger

**Solution:**
```javascript
// Debug combo system:
console.log('Combo Count:', $gamePlayer._comboCount);
console.log('Combo Timer:', $gamePlayer._comboTimer);
console.log('Enable Combo:', ABS.WeaponAdvanced.enableCombo);
```

### Issue: Charge attack terlalu cepat/lambat

**Solution:**
Adjust di code:
```javascript
this._chargeMaxTime = 60;  // Change ini value (default 60 frame = 1 detik)
```

### Issue: Impact effect tidak muncul

**Solution:**
- Check: Show Impact Effect = true
- Verify weapon trail color format (hex format)
- Check trail color: `#FF0000` (tidak pakai quotes di note)

---

## 📈 Plugin Load Order (Updated)

```
1. ABS_Core.js
2. ABS_Skill.js
3. ABS_Enemy.js
4. ABS_Effect.js
5. ABS_Weapon.js (old - bisa dihapus)
6. ABS_WeaponAdvanced.js ⭐ NEW
7. ABS_Android.js
8. ABS_Gamepad.js
9. ABS_Network.js
```

---

## 🚀 Performance Tips

1. **Limit Trail Particles**: Reduce untuk low-end devices
2. **Animation Optimization**: Use sprite sheets dengan ukuran optimal
3. **Impact Effects**: Disable di mobile untuk better performance
4. **Hitstun Duration**: Reduce untuk faster-paced combat

---

## 🎁 Bonus: Effect Combinations

### Fire + Knockback
```
<absElement:2>
<absKnockback:1.5>
<absTrailColor:#FF4400>
```
→ Flaming knockback effect

### Ice + Extended Range
```
<absElement:3>
<absRange:2>
<absKnockback:0.5>
<absTrailColor:#00AAFF>
```
→ Freezing spear attack

### Lightning + Multi-Hit
```
<absElement:4>
<absHitCount:3>
<absCriticalChance:20>
<absTrailColor:#FFFF00>
```
→ Chain lightning attack

---

**Sekarang ABS plugin Anda sudah mirip Alpha ABS Z! 🎮✨**
