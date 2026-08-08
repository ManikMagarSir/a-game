# VOXEL SURVIVOR — Documentation

> **One comprehensive reference** for players, modders, and the next engineer (human or AI).
> Covers: what it is, how to run it, controls, gameplay, architecture, every module, the data model,
> known gotchas, how to extend it, how it was validated, a future-vision roadmap, and an AI handover.

---

## Table of contents

1. [Overview](#1-overview)
2. [How to run](#2-how-to-run)
3. [Controls](#3-controls)
4. [Gameplay systems](#4-gameplay-systems)
5. [Architecture](#5-architecture)
6. [Module reference](#6-module-reference)
7. [Data model & config](#7-data-model--config)
8. [Rendering, audio & VFX](#8-rendering-audio--vfx)
9. [Persistence](#9-persistence)
10. [Modding & level editor](#10-modding--level-editor)
11. [Known gotchas](#11-known-gotchas)
12. [How to extend](#12-how-to-extend)
13. [Validation & testing](#13-validation--testing)
14. [Future vision / roadmap](#14-future-vision--roadmap)
15. [AI handover quickstart](#15-ai-handover-quickstart)
16. [Conventions](#16-conventions)

---

## 1. Overview

**VOXEL SURVIVOR** is a browser-based, first-person **voxel zombie-survival FPS**. You are the last
survivor in a blocky wasteland: survive escalating waves of zombies, earn XP to pick perks, earn cash
to buy gear mid-run, and spend career credits on permanent upgrades between runs.

- **Stack:** plain **HTML + CSS + JavaScript (ES modules)**. No bundler, no npm install, no framework.
- **Rendering:** **Three.js r128** loaded from a CDN as a global `THREE` (not an import).
- **Audio:** fully **procedural WebAudio** — zero asset files.
- **State:** one shared mutable object `G` (`js/state.js`) imported by every module.
- **Extras:** 8 weapons, 9 enemy types, a finite 8-wave campaign plus optional challenge modes, authored arenas, mod loader, level editor, static day lighting, PWA,
  **per-user local profiles**, an **intro cutscene**, a **procedurally synthesized soundtrack**, and a
  **single friendly difficulty for everyone** — infinite ammo (no reloads) and simple controls are the
  default for all players (the old Kids Mode toggle was removed and its easy features unified).
- **UI/UX:** **dark neumorphism styling** — raised extruded panels/buttons over recessed inset
  bars/inputs, soft dual shadows, on a deep `#1e2330` canvas. The lobby, pause, and game-over screens use
  an **asymmetric bento grid** of varied-size cards (big 2×2 PLAY CTA, 2-row leaderboard, wide
  settings/keys rows) to keep things uncluttered. **minimal HUD** (crosshair, health+XP with a
  KILLS counter, weapon/∞-ammo, an **F MELEE cooldown bar**, cash chip, minimap) with **toast popups**
  for events (combo milestones,
  no grenades) and **popup modals** for pause, level-up, field shop, sandbox, and career shop. Ghost HP
  bar, red damage flash, and a low-HP heartbeat round it out.

The whole game is **24 small JS modules** under `js/`, one stylesheet, one HTML file, and a `mods/` folder.

## 2. How to run

ES modules **require an HTTP server** (`file://` fails CORS). From the project root
(`voxel-survivor/`):

```bash
python -m http.server 8080
# open http://localhost:8080/voxel-survivor/index.html

# or:  npx serve .
```

A static server is usually already running in this workspace at `http://127.0.0.1:5500/`, so:
`http://127.0.0.1:5500/voxel-survivor/index.html`.

> Internet is needed on first load (Three.js CDN). Click **PLAY** (a user gesture) to start audio.
> The Service Worker caches static assets after the first visit, so subsequent loads work offline.

## 3. Controls

| Input | Action |
|-------|--------|
| `W A S D` | Move |
| Mouse | Look |
| Left Click | Shoot |
| Right Click (hold) | Aim (tighter spread, slower move, zoomed FOV; Sniper zooms to 25°, scope attachment to 38°) |
| `1`–`8` | Select owned weapon |
| Mouse Wheel | Cycle weapon |
| `F` | Melee swing (shield-piercing) |
| `G` | Throw grenade (shield-piercing) |
| `B` | Open / close field shop (also: on-screen 🛒 SHOP button + pause-menu button) |
| `T` | Sandbox mode: open / close spawn menu |
| `Shift` | Sprint |
| `Esc` | Pause (in intro: skip cutscene) |

**Intro cutscene** (`intro.js`): a **2D cinematic movie-style cutscene** rendered on a `<canvas>`
(letterboxed, film grain, scanlines). It plays **after clicking PLAY** (the click unlocks audio), then
the run starts. It is fully **automatic** and short (~7 s total): four quick chapters — **DAY 214** (parallax city skyline + fog), **THE OUTBREAK** (red blood moon, fires, an advancing zombie horde), **THE BARRICADE** (rotating beacon beam, rain, zombies pressing the fence), and **LAST SURVIVOR** (close-up survivor + "VOXEL SURVIVOR" title reveal). The campaign then moves through **ASHFALL OUTPOST**, **DROWNED METRO**, and **REDLINE REACTOR**. Chapters auto-advance (~1.6–1.9 s each) with
typewriter subtitles, a progress bar, white cut-flashes + zoom punch, and a fade-out. **SFX play
per chapter** (whoosh → distant explosion → thud → whoosh + groan), plus BGM starts alongside.
Click/`Space`/`Enter` advances early; `Esc` or the **SKIP** button ends it and starts the run
(restarts from "PLAY AGAIN" skip the intro).

**Unified friendly defaults** — there is one difficulty for everyone (no Kids Mode toggle):
- **Infinite ammo** — every weapon has unlimited ammunition, so there is **no reload** (the `R` key and
  reload-speed/magazine upgrades were removed as pointless). The HUD shows `∞`.
- **Simple controls** — shoot with click, switch weapons with `1-8`/wheel, melee with `F`, grenades with
  `G`, shop with `B`. Right-click aim works for everyone.
- **First-boot profile** — instead of silently creating a "SURVIVOR" profile, the game asks you to
  **create your own profile on first launch** (a centered modal, see §9). Everything is saved per profile.
- **HUD:** a **KILLS** counter sits in the top-left panel under health/XP; the weapon panel shows the
  weapon name and `∞` ammo, plus an **F MELEE cooldown bar** (fills up while `F` is recharging).
- **Field shop:** fully accessible (🛒 SHOP button, pause-menu button, or `B`) with everything listed —
  medkits, grenades, stat upgrades, weapon unlocks, and attachments (Suppressor / Scope).

## 4. Gameplay systems

- **Weapons (8):** Pistol, SMG, Shotgun, Rifle, LMG, Sniper, Crossbow, Flamethrower. Each has
  damage, fire rate, pellets, spread, range, recoil, and an SFX profile. **All weapons have infinite
  ammo — there is no reloading** (the HUD shows `∞`). Only Pistol is owned at run start; the rest
  unlock via career perks or the in-run field shop. Shotgun fires a pellet spread; Sniper has 25° aim
  zoom; Flamethrower is short-range with its own SFX.
- **Shooting model:** hitscan raycast from camera center. Damage = `weapon.dmg × G.mult.damage`,
  headshots multiply by `G.mult.head` (2.5×). Spread grows while moving/sprinting and shrinks while
  aiming or with recoil recovery. Bullets pierce up to `1 + G.mult.pierce` zombies; **crates are
  destructible** (`damageObstacle`) and block shots.
- **Attachments (shop unlocks):** **Suppressor** (−40% recoil + quieter shots via `audio.noise`),
  **Tactical Scope** (a deeper 38° aim zoom; the Sniper always uses a 25° scoped view). **Every**
  weapon shows a **scope overlay** (circular mask + reticle) while right-click zooming.
  (Magazine/reload upgrades were removed with infinite ammo.) All reset at `beginGame`.
- **Recoil & feel:** each shot adds camera recoil that decays; the viewmodel kicks and a muzzle flash
  sprite pops. **Hit-stop** on kills (`G.hitStop`) briefly slows the frame dt to 15% for punch.
- **Melee:** short-range frontal cone (30 base damage, 0.6 s cooldown); can break shield-zombie
  shields (see below). The viewmodel swings while on cooldown so the hit feels like a stab, and a
  cooldown bar under the weapon panel shows when `F` is ready again.
- **Grenades:** arcing physics projectile with fuse; on detonation deals AoE damage (shield-piercing),
  spawns a shockwave ring, particles, light flash, and screen shake.
- **Zombie types (9):**
  - `normal` — balanced baseline.
  - `runner` — fast / weak.
  - `crawler` — low, scuttling all-fours zombie that **pounces** at melee range (wave 3+).
  - `brute` — tank / slow, with horns and shoulder pads.
  - `boss` — huge (dedicated **boss model** + health bar + **phase label**), every 5th wave (or every
    wave in Boss Rush). Runs through **5 HP-based phases** (100/80/60/40/20% thresholds) — each phase
    is a **completely new boss form** (`buildBossForm` in `models/boss.js`): Phase 1 **THE ABOMINATION**
    (armored purple brute, horns, fists), Phase 2 **THE TITAN** (hulking rust brawler, huge fists),
    Phase 3 **THE OCULUS** (tall crowned caster, giant glowing core), Phase 4 **THE REAPER** (lean
    lacerator with blade arms and a head crest), Phase 5 **THE COLOSSUS** (enraged endgame with wings,
    crown, blades, and a pulsing red aura). Abilities unlock as the form changes: Phase 2 adds a
    **charge**, Phase 3 unlocks the **nova** projectile ring, Phase 4 unlocks an aimed **volley**
    burst, and Phase 5 enrages (faster, more projectiles, more minions). Speed, attack rate, and
    projectile counts all scale with phase. Scales **+22% HP per wave** from a **5000 HP** base.
    On every phase change the game swaps the mesh in place (`swapBossForm`) and plays a **mutation
    cutscene** overlay (`bossCutscene` in `ui.js`) naming the new form. Animations change per form too —
    Phase 3+ uses an overhead **smash**, Phase 5 fights with **alternating punches**.
  - `spitter` — keeps range (5–18 m) and fires **acid projectiles** (physics-arc, poison-green).
  - `exploder` — rushes in and **detonates** in a radial AoE when close (8 m radius).
  - `screamer` — periodically **summons** 2 normal zombies nearby (uses its own `summonCd`).
  - `shield` — front-facing **shield mesh** with `shieldHp`; blocks bullets until broken. Only melee,
    grenades, and explosions pierce it.
  They pathfind toward the player (or the **beacon** in Defense mode, whichever is closer), separate
  boids-style with **small fixed radii** (bosses are exempt, so they can't be shoved around — this
  also fixes zombies never reaching melee range), and animate properly: head bobbing and forward leg
  swings while walking, arm flailing + lunge while attacking, and a brief **tumble-sink death
  animation** (corpses) instead of popping out of existence. HP/damage scale with wave number. Heads
  are tagged `userData.part === 'head'`, so **headshots work**. Zombies always face their movement
  direction exactly (lean/pose is applied on an inner rig so the yaw never tilts them off-axis).
- **Campaign:** the default **THE LAST CIRCUIT** mode is a finite 8-wave run. Waves 1–3 take place in **ASHFALL OUTPOST**, waves 4–6 in **DROWNED METRO**, and waves 7–8 in **REDLINE REACTOR**; boss encounters anchor waves 4 and 8. The run ends with **CIRCUIT BROKEN** after wave 8.
- **Waves:** challenge-mode spawn count scales with wave; intermission between waves; **boss wave** every 5th wave in Endless.
  Enemy pool unlocks as waves rise (`pickSpawnType` in `waves.js`): runners wave 3+, crawlers wave 3+,
  brutes wave 4+, spitters wave 4+, exploders/shields wave 5+, screamers wave 6+.
- **Game modes (`MODES`, lobby select):**
  - **The Last Circuit** — finite 8-wave campaign across three authored arenas.
  - **Endless Horde** — optional survival mode with escalating waves.
  - **Time Attack** — 3-minute timer (HUD shows `TIME 3:00`); reaching 0 ends the run with
    **"TIME UP!"** as the title.
  - **Boss Rush** — a boss spawns every wave.
  - **Wave Defense** — protect the **beacon** (`showBeacon`, beacon HP bar). Zombies attack the beacon
    when it is closer than the player; letting it be destroyed ends the run with **"BEACON DESTROYED"**.
  - **Sandbox** — god mode (no damage) + infinite ammo/grenades + `T` spawn menu for any enemy type.
- **XP / Leveling:** kills grant XP (scaled by wave and combo). Leveling queues a **perk picker** that
  pauses the game and offers 3 random perks (damage, fire rate, vitality, adrenaline/speed, multishot,
  piercing, sharpshooter/headshot, vampire/lifesteal).
- **Combo:** consecutive kills within 3s raise a score multiplier (every 5 kills = +0.5×).
- **In-run shop (`B`):** kills drop `$` (cash). The field shop sells medkits, grenades, permanent
  damage/RoF/HP/speed upgrades, **weapon unlocks (SMG/Shotgun/Rifle/LMG/Sniper/Crossbow/
  Flamethrower)**, and **attachments** (Suppressor / Scope). Owned unlocks render as SOLD via
  `shopOwned`.
- **Pickups:** zombies randomly drop health crosses and grenade clusters, auto-collected by walking
  over them. A grenade pickup gives **+2 grenades** (ammo is infinite, so there are no ammo drops).
  **Pickups expire after 20 s** (blinking during the last 4 s) so they can't clutter the field.
  Bosses always drop one.
- **Kill feedback:** floating **+XP / +cash** text (color-coded `.dmg.xp` / `.dmg.cash`), **blood
  decals** on surfaces, hit-stop, screen shake, and headshot markers.
- **Career (lobby):** end-of-run score awards 💎 credits (persisted **per profile**). The lobby
  career shop spends them on permanent upgrades: Toughness (+starting HP), War Chest (+starting
  cash), Demo Man (+starting grenades), Veteran (start with Rifle unlocked).
- **Stats & leaderboard:** shots / hits / headshots are tracked (`G.game`) and shown on the game-over
  screen as **Accuracy %** and **Headshots**. The **top 5 runs** are persisted and shown in the lobby.
- **Lobby:** main menu with **profile bar** (select / create / delete a survivor profile — see §9),
  best-score/wave, **top-runs** leaderboard, **sensitivity / volume / graphics quality** sliders,
  **mode select**, the career shop, and **map export/import** buttons.
- **Graphics quality (`G.settings.gfx`):** `low` (no shadows, no fog, fewer particles) / `medium`
  (default) / `high`. Applied instantly via `applyGfx()`; particle counts scale in `effects.js`.

## 5. Architecture

### 5.1 Tech & constraints
- No build step. Browser loads `index.html` → CDN Three.js (classic `<script>`) → `js/main.js` (module).
- `THREE` is a **global**; modules use it directly (do not `import` it).
- Must be served over HTTP.
- Optional `mods/` folder of ES modules loaded by `js/mods.js`.

### 5.2 Module dependency graph
```
index.html
  └─ js/main.js  (entry; init + animate loop + state machine + window.Voxel API)
        ├─ world.js        scene / camera / renderer / pointer lock / collisions / beacon / static day lighting
        ├─ state.js        G (single source of truth)
        ├─ config.js       data: weapons, perks, zombie types, shop, career, modes
        ├─ storage.js      per-user profile localStorage
        ├─ models/         THREE mesh builders — index.js re-exports parts.js (shared parts/textures),
        │                  zombie.js, boss.js, weapon.js, pickup.js
        ├─ textures.js     procedural CanvasTexture generators
        ├─ audio.js        WebAudio SFX
        ├─ music.js        procedural BGM engine (start/stop/setIntensity)
        ├─ effects.js      tracers / particles / rings / damage numbers / blood decals / smoke / sprites
        ├─ weapons.js      shooting, viewmodel, grenades, crate damage
        ├─ zombies.js      AI, projectiles, pickups, corpses   (exports zombies[], pickups[], corpses[])
        ├─ waves.js        spawning / modes / boss waves
        ├─ ui.js           HUD / minimap / overlays (ghost HP, damage flash, heartbeat)
        ├─ progression.js  XP, perks, shop, career
        ├─ lobby.js        menu, profiles, settings, mode/gfx selects, leaderboard, map I/O
        ├─ intro.js        cutscene (playIntro, runs after PLAY for audio)
        ├─ mods.js         mod loader (imports ../mods/*)
        └─ input.js        keyboard / mouse / pointer-lock
```

### 5.3 Circular imports (intentional, safe)
`ui ↔ progression`, `ui ↔ zombies`, `zombies → progression → ui`, and `main → lobby → world`
form cycles. They are safe because **no module calls an imported function during top-level
evaluation** — all cross-module calls happen inside event handlers or the `animate()` loop at
runtime, after every module is evaluated and live bindings are resolved.
**Do not add top-level cross-module side effects.**

### 5.4 The `G` state object (`state.js`)
The only shared mutable state. Key fields:
- `G.state` — `'lobby' | 'playing' | 'paused' | 'levelup' | 'shop' | 'sandbox' | 'gameover'`.
- `G.profile` — active profile name (`null` on first boot until the player creates one in the
  **profile modal**; then set via the lobby profile bar).
- `G.mode` — current game mode id (`campaign | endless | time | bossrush | defense | sandbox`). `G.god` — god mode flag.
- `G.player` — health, maxHealth, pos (`THREE.Vector3`), grenades, speeds, radius.
- `G.mult` — global multipliers (damage, fireRate, reload, speed, pellets, pierce, head, mag, lifesteal).
- `G.attach` — `{ mag:0, sup:0, scope:0 }` attachment flags, reset each run.
- `G.weapons` — runtime copies of `config.WEAPONS` with live `ammo`.
- `G.ownedWeapons` — `{0..7: bool}`, reset each run from career unlocks.
- `G.game` — score, kills, wave, arena, xp, level, xpToNext, wave bookkeeping, combo, cash, and stats:
  `timer` (Time Attack), `beaconHp`/`beaconMaxHp` (Defense), `shots`/`hits`/`headshots`.
- `G.hitStop` — kill hit-stop timer. `G.shake` — screen shake. `G.overTitle` — custom game-over title.
- `G.boss` — live boss zombie or `null`.
- `G.settings` — sensitivity, volume, gfx (`low|medium|high`).
- `G.career` — persisted credits/upgrades. `G.best` — persisted best. `G.leaderboard` — persisted top-5 runs.
- `G._onDeath` — callback set by `main.js` → `gameOver()`; zombies call `G._onDeath?.()` on lethal hit.

### 5.5 Game loop (`main.js → animate`)
```
requestAnimationFrame(animate)
  rawDt = min(clock.getDelta(), 0.05)
  dt = (G.hitStop > 0) ? rawDt * 0.15 : rawDt     // hit-stop slows the world, not the timer
  if G.state === 'playing':
      updatePlayer      (movement + collidePlayer(); camera = pitch/yaw/recoil; auto-fire)
      updateWeapons     (timers, reload, viewmodel swing, grenades)
      updateWaves       (spawn / intermission / time & boss-rush logic)
      updateZombies     (AI, separation, limb anim, attack, projectiles, summons)
      updatePickups     (collect health/ammo)
      updateBanner / tickHitmarker / setVignette / drawMinimap
  updateEffects(dt)     (always — tracers/particles/rings fade even when paused)
  updateDayNight(dt)    (sun / ambient / fog lerp)
  renderer.render(scene, camera)
```

### 5.6 State machine
Transitions:
- `beginGame()` — lobby/shop/gameover → playing (requests pointer lock).
- `gameOver()` — playing → gameover (awards career credits, pushes leaderboard).
- `showMenu()` — → lobby.
- `gainXp()` — playing → levelup (exits pointer lock, opens perk cards).
- `chooseAbility()` — levelup → playing (hides cards, requests lock).
- `openShop()/closeShop()` — playing ↔ shop.
- `openSandbox()/closeSandbox()` — playing ↔ sandbox (sandbox mode only).
- `onLockChange()` (main.js via input.js) — playing ↔ paused on pointer-lock loss.

## 6. Module reference

| File | Responsibility | Key exports |
|------|---------------|-------------|
| `index.html` | DOM: HUD + overlays; loads Three.js CDN then `main.js`; manifest + SW registration; `window.VOXEL_MODS`. | — |
| `css/style.css` | All styling (incl. `.dmg.xp`, `.dmg.cash`, `#beaconBar`, `.sandbox-grid`, selects). | — |
| `state.js` | `G` shared state. | `G` |
| `config.js` | Tunable data + perk/shop effect fns. | `WEAPONS, ABILITIES, ZTYPES, SHOP_ITEMS, CAREER_UPGRADES, MODES, effMag, shopOwned` |
| `storage.js` | Per-user profile localStorage (list, active, per-profile data, legacy migration). | `getProfiles, profileExists, ensureProfile, setActiveProfile, createProfile, deleteProfile, loadProfileData, hydrate(G), persist(G)` |
| `world.js` | scene/camera/renderer, lights, shadows, arena, pointer lock, collisions, beacon, static day lighting, map I/O. | `initWorld, applyGfx, scene, camera, renderer, GROUND, obstacles, beaconPos, beaconGroup, buildBeacon, showBeacon, requestLock, collidePlayer, damageObstacle, serializeWorld, loadWorld, onResize` |
| `models/index.js` | Re-exports the `models/` folder: shared parts + zombie/boss/weapon/pickup builders. | `buildZombieMesh, buildBossForm, buildViewModel, buildPickup` |
| `models/parts.js` | Shared voxel parts: `box`, `boxMat`, articulated `limb()` (upper+lower+foot), skin/metal textures. | `box, boxMat, limb, fleshTex, metalTex` |
| `models/zombie.js` | Procedural zombie meshes (body/chest/head/jaw/eyes, per-type extras, articulated limbs, `scale`, head/body part tags). Humanoids carry their lean on an inner pose rig so the outer group is pure yaw. | `buildZombieMesh(type)` |
| `models/boss.js` | Five distinct boss forms — ABOMINATION / TITAN / OCULUS / REAPER / COLOSSUS (Form 5 carries a pulsing red aura) — each built from scratch with `buildBossForm(form)`. `buildBossMesh()` is kept as a Form 1 alias. | `buildBossForm(form), buildBossMesh()` |
| `models/weapon.js` | First-person gun viewmodel (metal texture, scope, flamer tank, muzzle point). | `buildViewModel(weaponId)` |
| `models/pickup.js` | Pickup meshes (health / grenade). | `buildPickup(type)` |
| `textures.js` | Procedural CanvasTexture generators. | `crateTexture, groundTexture(a), rockTexture, fleshTexture, metalTexture, glowTexture, skyTexture` |
| `audio.js` | Procedural SFX engine. | `audio` (init/setVolume/shoot/hit/noise/buy/shieldBreak/summon/heartbeat/gameOverSting/whoosh/thud/...) |
| `music.js` | Procedural BGM (128 BPM dark techno loop). | `music` (start/stop/setIntensity), `combatIntensity()` |
| `effects.js` | Visual helpers. | `spawnBloodDecal, spawnTracer, spawnMuzzleLight, spawnMuzzleSprite, spawnParticles(pos,color,count,opts), spawnSmoke, spawnRing, spawnDamageNumber(world, text, color, cls), showHitmarker, tickHitmarker, clearEffects, updateEffects` |
| `weapons.js` | Combat + viewmodel + grenades + crate damage. | `initWeapons, cycleWeapon, selectWeapon, tryShoot, meleeAttack, throwGrenade, updateWeapons` |
| `zombies.js` | AI (incl. boss charge/slam/summon/nova/volley + 5 HP-based phases that swap to entirely new forms via `swapBossForm` + trigger the `bossCutscene` mutation overlay) + projectiles + pickups (expire after 20 s) + corpses. | `zombies, pickups, corpses, spawnZombie(type, at), damageZombie(z, dmg, point, isHead, shieldPierce), spawnPickup, updateZombies, updatePickups` |
| `waves.js` | Spawning / boss waves / modes. | `startWave, updateWaves` (+ internal `pickSpawnType`) |
| `ui.js` | HUD/minimap/overlays (minimal HUD, toasts, ghost HP, damage flash, popup modals, boss mutation cutscene). | `initUI, updateHUD, toast, showBanner, updateBanner, bossCutscene, setVignette, drawMinimap, openLevelUp, hideLevelUp, renderShop, openShopUI, closeShopUI` |
| `progression.js` | XP/perks/shop/career. | `gainXp, chooseAbility, buyShopItem, buyCareerUpgrade, applyCareerEffects` |
| `lobby.js` | Menu, profiles, settings, mode/gfx selects, leaderboard, map I/O, first-boot profile modal. | `initLobby, refreshLobby` |
| `intro.js` | 2D cinematic canvas cutscene (4 auto chapters, letterbox/grain/skip, per-chapter SFX). | `playIntro(onDone)` |
| `mods.js` | Loader for `mods/*` ES modules. | `loadMods(list)` |
| `input.js` | Input wiring. | `initInput` |
| `main.js` | Glue + loop + state machine + `window.Voxel`. | `init, beginGame, gameOver, showMenu, animate` |

## 7. Data model & config

All balance lives in `config.js` so game logic rarely changes:
- **`WEAPONS`** — array of 8 `{id,name,auto,dmg,cd,pellets,spread,mag,reload,range,recoil,sfx}`.
  `id` doubles as the select key (Digit1-8) and the `ownedWeapons` index.
- **`ABILITIES`** — 8 perks; each `apply(G)` mutates `G.mult` / `G.player`.
  (Quick Hands + Drum Mag were removed — pointless with infinite ammo.)
- **`ZTYPES`** — 9 zombie types: `{hp,speed,scale,color,dmg,score,cash,groan}` plus optional flags
  `ranged` (spitter), `boom` (exploder), `summon` (screamer), `shielded` (shield).
- **`SHOP_ITEMS`** — in-run purchases; each `apply(G)` mutates state. `once:true` items carry a
  `key` (`w1`..`w7` for weapon unlocks, or an attachment key `mag`/`sup`/`scope`) and are checked
  with **`shopOwned(it, G)`** to render as owned/sold.
- **`CAREER_UPGRADES`** — persistent upgrades with `max` level, `cost(level)`, and `effect(G)`
  applied at `beginGame` per owned level.
- **`MODES`** — the 6 game modes: `{ico, name, desc}`. A **mode picker popup** (lobby button → card grid) writes `G.mode`; **The Last Circuit** is the default finite campaign.
- **`effMag(w, G)`** — effective magazine = `w.mag + G.mult.mag + G.attach.mag`. **Legacy/no-op**
  with infinite ammo (kept exported for API compatibility); magazine size never changes.

`G.weapons` is initialized as shallow copies of `WEAPONS` with a live `ammo` field, so per-run ammo
never mutates the config.

## 8. Rendering, audio & VFX

- **Textures (`textures.js`):** all world/zombie/weapon materials are generated on canvases
  (NearestFilter + RepeatWrapping) — `crateTexture`, `groundTexture(a)` (alternating shade per tile),
  `rockTexture`, `fleshTexture` (zombie skin), `metalTexture` (viewmodel/brute/shield),
  `glowTexture` (additive muzzle sprite), `skyTexture`.
- **World:** textured ground (instanced tiles), **destructible crates** (bullet blockers with
  `userData.radius` + collision), trees, rocks. Directional light casts shadows (PCFSoft); ambient +
  hemisphere fill. Gradient sky via `skyTexture()`. Fog for depth. Lighting is **fixed daytime**
  (the old day/night cycle was removed — sun, ambient, and hemisphere intensities stay constant).
- **Beacon (Defense mode):** `buildBeacon()` creates the protected structure at `beaconPos`;
  `showBeacon(on)` shows/hides it and the HUD bar.
- **Models (`js/models/`):** all builders live in a dedicated folder — `zombie.js`'s `buildZombieMesh`
  returns a `Group` whose animated limb **pivot** groups are stored in `group.userData.parts`
  (armL/armR/legL/legR with articulated 2-segment limbs + feet) and swung in `updateZombies`. Body
  parts are tagged `userData.part` (`head`, `body`, `chest`) so **headshots** hit the right part;
  `hitMeshes` carry `userData.zombie`. Zombies wear the `fleshTexture` skin with **glowing red eye
  cubes** (emissive), a chest skin panel, jaws, and per-type extras (brute pads, shield, screaming maw,
  exploder core, spitter snout), and apply their `ZTYPES.scale`. `boss.js`'s `buildBossForm(form)`
  returns **one of five distinct boss forms** (ABOMINATION / TITAN / OCULUS / REAPER / COLOSSUS).
  Form 5 also carries a `userData.aura` pulsing red box. On a phase change `zombies.js` calls
  `swapBossForm(z)` to rebuild the boss mesh in place (keeping position/rotation/walk phase) and
  re-links `z.hit`, plus a `bossCutscene` mutation overlay. Shield zombies get
  a metal `userData.shieldMesh` (hidden when `shieldHp` breaks). `weapon.js`'s `buildViewModel` builds
  the first-person gun attached to the **camera** (metal texture, sniper scope, flamer tank); recoil
  uses `group.userData.basePos`; firing spawns an additive **muzzle sprite** (`glowTexture`). Killed
  zombies spawn a **corpse** (tumble + sink for ~1.1 s) tracked in `zombies.corpses[]` instead of
  vanishing instantly.
- **Audio (`audio.js`):** `init()` creates an `AudioContext` (call inside a gesture); `setVolume`
  drives a master gain. Per-weapon gunshots, hits, headshot dings, groans, death, explosion, pickup,
  level-up jingle, wave sting, UI clicks, hurt — all synthesized (oscillators + filtered noise).
  Newer SFX: `buy` (shop purchase), `shieldBreak` (bandpass noise + descending saw), `summon`,
  `heartbeat` (low-HP), `gameOverSting` (descending minor arpeggio). `audio.noise()` doubles as the
  suppressed-shot sound; the Flamethrower has its own `flamer` case.
- **Music (`music.js`):** a fully procedural **dark-techno loop** at 128 BPM — kick/snare/hat/bass/
  lead/pad layers scheduled ahead of time (`setInterval` scheduler with ~0.14 s lookahead). The
  `music.intensity` (0–1) drives which layers play and their filter/level; `combatIntensity()`
  ramps with wave + pending spawns so the track heats up during fights and thins to 0.2 in menus.
  `main.animate` calls `music.setIntensity(...)` every frame; `beginGame` calls `music.start()`.
- **VFX (`effects.js`):** tracers (line segments), muzzle point light, **additive muzzle sprite**, short-lived additive **impact bursts** with point lights, blood/impact particles with optional **`bias`** (directional spray) and **`rise`** (upward-floating
  smoke), explosion shockwave **rings** (`RingGeometry` scaling out), **`spawnSmoke`**, floating
  **damage numbers** projected to screen (with optional `cls` for `xp`/`cash` styling), **blood
  decals** (capped at 40, faded and removed in `updateEffects`), hitmarker. Explosions add smoke +
  biased particles; headshots spray yellow sparks. Particle counts scale with `G.settings.gfx`.
- **HUD feedback (`ui.js`):** the HUD is intentionally **minimal** — only crosshair, health (+ ghost bar),
  XP, weapon/ammo, a small cash chip, and the minimap persist. Everything else is transient. Panels are
  **raised neumorphic cards**; bars, the minimap, and inputs are **recessed tracks** (inset shadows):
  - **Toast popups** (`toast(msg, cls)` in `ui.js`) slide in under the top-center bars for combo
    milestones and "no grenades" — auto-fade after ~2 s.
  - **Wave banner** (`showBanner`) announces "WAVE N" / "BOSS WAVE N" / "WAVE CLEARED".
  - **Damage feedback:** the red `#dmgFlash` overlay pulses on any hit, the ghost bar trails damage,
    and under 30% HP the screen pulses (`low-hp` class) while `audio.heartbeat()` plays. `setVignette()`
    calls `refreshHealth()` every frame, so the health bar **always** reflects real damage.
  - The `lastHp` (ghost bar) and `flashHp` (damage flash) trackers are separate so they never fight.
- **Popup modals:** pause, level-up, in-run shop, sandbox spawn menu, and career shop are centered
  `.modal` cards over a blurred backdrop (`.modal-wrap`) instead of full-screen overlays. Lobby, intro,
  and game-over remain full-screen scenes.
- **2D cinematic intro (`intro.js`):** a self-contained canvas cutscene drawn every frame, played
  **after clicking PLAY** so audio is unlocked (see gotcha 8). Parallax
  skyline layers (`genSkyline`, world-units with wrap-around panning), procedurally generated zombie/
  survivor silhouettes (`drawZombie`/`drawSurvivor`, limb animation via a phase `ph`), moon with glow +
  craters, drifting fog bands, fire glows, smoke puffs, rotating **beacon beam** (chapter III), rain
  streaks, rising embers, vignette + film grain, and a chapter-list timeline (`CH`) of `{key,kicker,sub,
  dur,draw(t,ctx,...)}`. Deterministic `mulberry32` seeds keep every run identical. `playIntro(onDone)`
  shows the overlay, starts a `requestAnimationFrame` loop, and calls `onDone` on completion/skip
  (e.g. `main.beginGame` → `playIntro(startRun)`). Chapters **auto-advance** (~1.6–1.9 s each, ~7 s
  total) with white cut-flash + zoom punch; per-chapter **SFX** (`whoosh`/`explosion`/`thud`/`groan`)
  fire in `showChap`. The final chapter fades to black and ends the cutscene. Click/Space/Enter
  advance early, Esc/SKIP skips.

## 9. Persistence — per-user profiles (`storage.js`)

Saves are **per profile** (a "local database" for each player) using these `localStorage` keys:
- `voxelProfiles` — array of profile names.
- `voxelActiveProfile` — the currently active profile name.
- `voxelProfile_<NAME>` — one profile's data blob (see below).
- `voxelSurvivor` — **legacy** pre-profile save; migrated into the default profile on first boot.

Each profile blob stores `{ career, settings, best, ownedWeapons, leaderboard }`:
- **best** — best score/wave (updated on game over).
- **leaderboard** — top-5 runs `{score, wave, kills, mode, date}` (sorted, capped, rendered in lobby).
- **settings** — sensitivity/volume/gfx (updated by lobby controls).
- **career** — credits + upgrade levels (earned credits on game over; spent in career shop).
- **ownedWeapons** — persisted across sessions (career Rifle unlock lives here too).

Profile API: `getProfiles()`, `ensureProfile()` (boot; returns `null` on a true first boot — **no**
  auto-created default — or migrates legacy data into `SURVIVOR`), `setActiveProfile(name)`,
  `createProfile(name)` (trims → upper → max 16 chars; sets it active), `deleteProfile(name)`
  (removes the blob and falls back to the first remaining profile), `loadProfileData(name)`,
  `hydrate(G)` (loads the active profile into `G`; no-ops when `G.profile` is `null`, and strips any
  legacy `kids` field), `persist(G)` (saves `G` back to the active profile).

Flow: `main.loadPersistedInto()` runs `G.profile = ensureProfile(); hydrate(G);` at boot. On a first
boot `G.profile` is `null`, so `lobby.js` **shows the "WELCOME, SURVIVOR" profile modal** — the player
types a name and hits START (or Enter), which calls `createProfile` + `hydrate` and enters the lobby.
The lobby's **profile bar** (`lobby.js`) lets the player create/select/delete profiles — every switch
calls `hydrate(G)` + `syncControls()` + `refreshLobby()` so career, settings, best, and leaderboard
are all per-player. `persist(G)` fires on game over, settings changes, and career purchases.

## 10. Modding & level editor

### 10.1 Mod loader (`mods.js` + `window.Voxel`)
- `index.html` declares `window.VOXEL_MODS = []` (array of file names inside `mods/`).
- `main.js` exposes a **`window.Voxel`** modding API: `{ G, config, MODES, spawnZombie, damageZombie, log }`.
- `main.init` calls `loadMods(window.VOXEL_MODS || [])`, which dynamic-imports `../mods/<name>` and
  invokes each module's `default` function with `window.Voxel` as its argument.
- **Example:** see `mods/example.js` — add `mods/example.js` to `VOXEL_MODS` to enable it.

### 10.2 Level editor (map export / import)
- `world.serializeWorld()` emits a JSON string of the current obstacle layout.
- `world.loadWorld(json)` rebuilds the arena from that JSON.
- Lobby buttons **EXPORT MAP** / **IMPORT MAP** (hidden file input) round-trip `voxel-map.json`.

### 10.3 PWA
- `manifest.json` + `icon.svg` (procedural SVG) enable "Add to Home Screen".
- `sw.js` — cache version **`voxel-survivor-v18`** precaches all 24 JS modules (incl. `js/models/*`) +
  CSS/HTML/manifest/icon. Network-first for navigations, cache-first for static assets,
  network-first-fallback-cache for the CDN Three.js script. Registered at the bottom of `index.html`.

## 11. Known gotchas

1. **Pointer-lock cooldown.** After `exitPointerLock()`, the browser refuses `requestPointerLock()`
   briefly. `world.requestLock()` swallows the rejection; `input.js` re-acquires on the next canvas
   click. This is expected, not a bug.
2. **Audio needs a gesture.** `audio.init()` runs on PLAY click. Silent before that is correct.
3. **THREE is a global** from the CDN `<script>`; module top-level `new THREE.*` relies on the CDN
   script executing first (it does — classic `<script>` in `<head>` runs before deferred module scripts).
4. **Mutate arrays in place.** `zombies`/`pickups`/`corpses` are exported `const` arrays; clear with
   `.length = 0`, never reassign. (Kills splice from inside — iterate backwards.)
5. **Circular imports are intentional.** See §5.3 — don't "fix" them, and never add top-level
   cross-module side effects.
6. **Arena reset.** Authored arenas are rebuilt at the start of each run, so destroyed cover does not leak between attempts. Imported cover layouts are editor previews and are replaced by the selected arena when a run begins.
7. **Do not rename `spawnZombie`/`damageZombie`.** They are used both by core code and exposed as
   `window.Voxel.spawnZombie` / `window.Voxel.damageZombie`.
8. **Mod errors are non-fatal.** `loadMods` catches and `console.error`s; a bad mod cannot crash boot.
9. **Intro audio needs the PLAY gesture.** The intro plays **after** clicking PLAY, so its SFX
   (`whoosh`/`thud`/`groan`/`explosion`) and BGM are audible. It can never play sound before the
   first gesture (browser autoplay policy).
10. **Music lifecycle.** `music.start()` guards `if(this.running) return`, so re-entering PLAY never
   doubles the track; music stays at 0.2 intensity in menus by design. To silence it in menus, add
   `music.stop()` to `showMenu`/`gameOver`.
11. **Profile mutation is destructive.** `deleteProfile` cannot be undone — the UI `confirm()`s first.
    `createProfile` uppercases + truncates names to 16 chars.
12. **Few comments by design.**

## 12. How to extend

- **New weapon / perk / zombie / mode:** add data to `config.js` (`WEAPONS` / `ABILITIES` / `ZTYPES` /
  `MODES`) + a model in `js/models/` for zombies. Game logic usually needs no change.
- **New attachment:** add an entry to `SHOP_ITEMS` with `once:true, key:'<name>'`, a flag in
  `G.attach`, and read it where the behavior lives (see `effMag`, `tryShoot`, `input.js` zoom).
- **New HUD element:** add markup in `index.html`, cache in `ui.initUI()`, update in `ui.updateHUD()`.
- **Balance:** all numbers are in `config.js`.
- **Performance:** shadow-map size in `world.js`; particle counts in `effects.js`; gfx tiers in `applyGfx`.
- **New enemy behavior:** edit `updateZombies` in `zombies.js` (state machine per zombie is simple),
  or add a new type flag in `ZTYPES` and handle it there.
- **Mod:** drop an ES module into `mods/` that default-exports a function taking `window.Voxel`,
  then add its filename to `window.VOXEL_MODS` in `index.html`.

## 13. Validation & testing

No test framework is set up (intentionally minimal). Changes are validated with:
- **`node tools/validate.mjs`** — the single command that runs a syntax check (`node --check`) and an
  import/export resolution scan on every module under `js/` (**recursively**, including `js/models/*`),
  asserting each `import { x }` is actually exported by its source (catches the earlier `spawnZombie`
  missing-export bug). It temporarily adds `js/package.json` `{"type":"module"}` and removes it
  afterward. Expected output: **"All 24 modules valid."**
- **Manual:** load via the local server, hard-refresh, select **THE LAST CIRCUIT**, and play through the intro and first sector. Confirm the sector tag updates, cover blocks movement, enemies spawn outside cover, and the wave banner names the current arena; then smoke-test each challenge mode. Recent smoke-test checklist: **first-boot profile modal** → create a profile → lobby; profile create/switch/delete +
  persistence across reloads; legacy migration into `SURVIVOR`; intro cutscene + skip; BGM starting on
  PLAY and heating up as waves ramp; **∞ ammo** (no reload) + KILLS counter in the HUD; zombies
  reaching melee range and dealing damage (ghost bar + red flash + heartbeat under 30%); **boss AI**
  (charge / slam AoE / summon minions / 5 HP-based phases, boss HP bar + **phase label**); the boss
  **mutating into a new form each phase** (ABOMINATION → TITAN → OCULUS → REAPER → COLOSSUS) with a
  **mutation cutscene** overlay + shake, its animations switching per form (overhead smash, alternating
  punches), and the red aura pulsing in Phase 5; **weapon switching in the field shows the right viewmodel**
  (fix: `applySwitch` calls `rebuildViewModel()`); the **F MELEE cooldown bar** filling up after a
  swing; **static day lighting** (no more day/night cycle); headshots registering; shop
  categories + buy sound; muzzle sprite; explosion smoke; shield-break sound; **toast popups**- **Service worker:** `sw.js` caches every asset (cache-first) under a versioned cache name. After any code change, **bump the `CACHE` version** (currently `voxel-survivor-v18`) so players stop getting stale
  files — this was the cause of "boss phases / new models / weapon switching not appearing".
  (combo / no-grenades); and **popup modals** (pause/level-up/shop/sandbox/career).

## 14. Future vision / roadmap

> Ideas for where the project could go. None are promised; ordered by rough effort.
> ✅ = implemented in the current codebase.

**Phase 1 — Polish ✅ (mostly done)**
- ✅ Blood decals, hit-stop / camera punch on kills.
- ✅ Floating XP/cash text (alongside crit/headshot damage numbers).
- ✅ Weapon upgrade attachments (extended mag, suppressor, scope).
- ✅ Graphics quality toggle (shadows/fog/particles) for low-end devices.
- ✅ Settings persistence (sensitivity/volume/gfx).
- ✅ **Modern UI** — dark neumorphism HUD/surfaces (raised panels, inset bars, soft dual shadows) plus an
  **asymmetric bento-grid** layout for the lobby/pause/game-over, animated bars, ghost HP bar, damage
  flash, low-HP heartbeat, categorized shop cards.
- ✅ **Per-user local profiles** — create/select/delete survivors, fully isolated saves.
- ✅ **Intro cutscene** — 2D cinematic movie-style cutscene (4 animated chapters, parallax skyline,
  hordes, beacon beam, title reveal).
- ✅ **Procedural BGM** — dynamic dark-techno soundtrack that ramps with combat intensity.
- ✅ **Textures** — procedural canvas textures for world/zombies/weapons + glowing zombie eyes.
- ✅ **VFX/SFX pass** — muzzle sprites, impact light bursts, smoke, biased particles, arena-colored neon, buy/shield-break/summon/heartbeat/game-over SFX.
- ✅ **Unified friendly defaults** — Kids Mode removed; infinite ammo (no reload), simple controls,
  a clear HUD with a KILLS counter, a first-boot **create-your-profile** modal, and a fully
  accessible field shop are now the default for **everyone**. Dead reload/magazine perks and the
  Extended Mag attachment were dropped.
- ▶ More perk variety (explosive rounds, freeze, lifesteal-on-headshot, adrenaline dash).
- ▶ Controller/gamepad support.

**Phase 2 — Content ✅ (mostly done)**
- ✅ Finite authored campaign with three arena layouts, sector progression HUD, landmark lighting, and arena-specific spawn bounds.
- ✅ New enemy archetypes: **spitter** (ranged acid), **screamer** (summons), **shield** brute,
  **exploder** (suicide AoE), plus existing boss/mini-boss variants.
- ✅ New weapons: LMG, sniper, crossbow, flamethrower.
- ✅ Game modes: **The Last Circuit** (finite 8-wave campaign), **Endless Horde**, **Time Attack**, **Boss Rush**, **Wave Defense** (beacon), **Sandbox** (god mode + spawn menu).
- ✅ Static day lighting (the day/night cycle was removed for cleaner visibility), destructible cover.
- ✅ Local **leaderboard** (top runs) and **stats screen** (accuracy, headshots, best wave).
- ▶ Environmental hazards: weather, traps, lureable zombies.

**Phase 3 — Systems (partially done)**
- ✅ **Modding API:** `window.Voxel` + `mods/` loader (drop-in ES modules, no core edits).
- ✅ **Level editor:** export/import layouts as JSON from the lobby.
- ✅ **PWA:** manifest + service worker for offline install.
- ▶ **Online:** co-op multiplayer (authoritative server, WebSocket sync of player transforms + shots),
  shared lobbies, global leaderboards. (Major undertaking — would need a backend.)
- ▶ **Mobile/touch:** on-screen joystick + auto-fire/aim-assist; responsive HUD.
- ▶ **Accessibility:** colorblind damage indicators, subtitle/caption mode for SFX, adjustable FOV,
  remappable controls, difficulty options (easy/normal/nightmare).

**Phase 4 — Community & scale (long-term)**
- User-generated content browser, weekly challenges, seasonal events.
- Procedural map generation for infinite variety.
- Narrative/quest layer (why the outbreak? rescue NPCs?).
- Weapon skins and cosmetics.

Design principles to keep regardless of direction: **no build step**, **single `G` state**, **data-driven
`config.js`**, **procedural assets over file downloads**, and **graceful pointer-lock/cooldown handling**.

## 15. AI handover quickstart

If you are an AI agent taking over:
1. Open `js/state.js` first — understand `G`. Then `js/config.js` (balance), then `js/main.js` (loop).
2. Run via a local HTTP server (see §2). Three.js comes from CDN.
3. Circular imports (`ui ↔ progression`, `ui ↔ zombies`) are intentional and safe — don't "fix" them.
4. Persistence is **per profile** (`storage.js`, §9) — always go through `hydrate(G)`/`persist(G)`;
   never write to a raw `localStorage` key except via `storage.js`.
5. Don't re-introduce: the Kids Mode toggle / `G.settings.kids` / `kidsToggle`/`kidsKills`/`keysKids`
   markup (infinite ammo + simple controls are the default for everyone); missing `export` on
   `spawnZombie`; level-up overlay not hiding; unguarded pointer-lock `SecurityError`; reassigning
   `zombies`/`pickups`/`corpses` arrays; a missing `z.score` (used by `killZombie`); per-frame
   `new THREE.Color()` in `updateDayNight`; renaming `spawnZombie`/`damageZombie` (they're also the
   `window.Voxel` API); sharing one HP tracker between the ghost bar and damage flash.
6. Validate with `node tools/validate.mjs` (expect **"All 24 modules valid"**).
7. On first boot `ensureProfile()` returns `null` → `lobby.js` shows the **profile modal**
   (`#profileModal`, `#profileNameBoot`, `#profileCreateBoot`) — keep that flow intact.
8. Extend via `config.js` + `js/models/`/`textures.js`; keep comments minimal unless asked.
9. New SFX go in `audio.js`; new BGM layers in `music.js`; new cutscene chapters in `intro.js`.
10. The game-over screen reads `G.overTitle` for custom endings ("TIME UP!", "BEACON DESTROYED").

## 16. Conventions

- ES modules, relative imports (`./x.js`), no bundler, no npm deps (Three.js via CDN only).
- 2-space indent, single quotes, minimal comments.
- One shared mutable state object `G`; mutate arrays in place.
- All tunable numbers in `config.js`.
- Circular imports are allowed only when there are no top-level cross-module side effects.
