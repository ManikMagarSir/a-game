import { G } from './state.js';
import { initWorld, scene, camera, renderer, GROUND, requestLock, collidePlayer, showBeacon } from './world.js';
import { initUI, updateHUD, updateBanner, setVignette, drawMinimap, openShopUI, closeShopUI } from './ui.js';
import { updateEffects, tickHitmarker, clearEffects } from './effects.js';
import { audio } from './audio.js';
import { initWeapons, updateWeapons, tryShoot } from './weapons.js';
import { zombies, pickups, corpses, updateZombies, updatePickups, spawnZombie, damageZombie, clearProjectiles } from './zombies.js';
import { updateWaves } from './waves.js';
import { applyCareerEffects } from './progression.js';
import { initLobby, refreshLobby } from './lobby.js';
import { initInput } from './input.js';
import { ensureProfile, hydrate, persist } from './storage.js';
import { loadMods } from './mods.js';
import { playIntro } from './intro.js';
import { music, combatIntensity } from './music.js';
import * as configMod from './config.js';

const _fwd = new THREE.Vector3(), _right = new THREE.Vector3(), _up = new THREE.Vector3(0,1,0);
const clock = new THREE.Clock();
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));

function loadPersistedInto(){
    G.profile = ensureProfile();
    hydrate(G);
}

function hideAllOverlays(){
    ['lobby','pause','levelUp','shop','sandbox','gameOver'].forEach(id => document.getElementById(id).classList.add('hidden'));
}

function startRun(){
    zombies.forEach(z => scene.remove(z.group)); zombies.length = 0;
    pickups.forEach(p => scene.remove(p.mesh)); pickups.length = 0;
    corpses.forEach(c => scene.remove(c.group)); corpses.length = 0;
    clearProjectiles();
    clearEffects();
    G.boss = null; document.getElementById('bossBarWrap').style.display = 'none';

    G.player.health = 100; G.player.maxHealth = 100; G.player.pos.set(0, 1.7, 0); G.player.grenades = 3;
    G.mult.damage = 1; G.mult.fireRate = 1; G.mult.reload = 1; G.mult.speed = 1;
    G.mult.pellets = 0; G.mult.pierce = 0; G.mult.head = 2.5; G.mult.mag = 0; G.mult.lifesteal = 0;
    G.attach.mag = 0; G.attach.sup = 0; G.attach.scope = 0;
    G.hitStop = 0;
    G.weapons.forEach(w => w.ammo = w.mag);
    G.curWeapon = 0; G.weaponReloading = false; G.weaponTimer = 0; G.meleeCd = 0;
    initWeapons();
    G.firing = false; G.aiming = false; G.recoil.p = 0; G.recoil.y = 0; G.yaw = 0; G.pitch = 0; G.shake = 0;
    G.game.score = 0; G.game.kills = 0; G.game.wave = 0; G.game.xp = 0; G.game.level = 1; G.game.xpToNext = 50;
    G.game.waveActive = false; G.game.toSpawn = 0; G.game.intermission = 3; G.game.combo = 0; G.game.comboTimer = 0; G.game.cash = 0;
    G.game.shots = 0; G.game.hits = 0; G.game.headshots = 0;
    G.game.perks = []; G.game.bought = [];
    G.game.timer = G.mode === 'time' ? 180 : 0;
    G.game.beaconHp = G.mode === 'defense' ? 1000 : 0; G.game.beaconMaxHp = G.game.beaconHp;
    G.pendingLevelUps = 0;
    G.god = G.mode === 'sandbox';
    G.overTitle = '';
    G.ownedWeapons = { 0:true, 1:false, 2:false, 3:G.career.upg.rifle ? true : false, 4:false, 5:false, 6:false, 7:false };

    applyCareerEffects();
    showBeacon(G.mode === 'defense');

    camera.fov = 75; camera.updateProjectionMatrix();

    hideAllOverlays();
    document.getElementById('hud').classList.remove('hidden');
    updateHUD();
    G.state = 'playing';
    audio.init(); audio.resume();
    music.start();
    requestLock();
}

function beginGame(){
    audio.init(); audio.resume();
    music.start();
    playIntro(startRun);
}

function gameOver(){
    G.state = 'gameover';
    document.exitPointerLock();
    const earned = Math.floor(G.game.score / 10);
    G.career.credits += earned;
    if(G.game.score > G.best.score) G.best = { score: G.game.score, wave: G.game.wave };
    G.leaderboard.push({ score: G.game.score, wave: G.game.wave, kills: G.game.kills, mode: G.mode, date: Date.now() });
    G.leaderboard.sort((a,b) => b.score - a.score);
    G.leaderboard.length = Math.min(G.leaderboard.length, 5);
    persist(G);
    audio.gameOverSting();
    document.getElementById('goWave').textContent = G.game.wave;
    document.getElementById('goKills').textContent = G.game.kills;
    document.getElementById('goScore').textContent = G.game.score;
    document.getElementById('goLevel').textContent = G.game.level;
    document.getElementById('goCredits').textContent = earned;
    document.getElementById('goBest').textContent = G.best.score;
    document.getElementById('goAcc').textContent = G.game.shots ? Math.round(G.game.hits / G.game.shots * 100) + '%' : '-';
    document.getElementById('goHead').textContent = G.game.headshots;
    document.getElementById('goTitle').textContent = G.overTitle || 'GAME OVER';
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('gameOver').classList.remove('hidden');
}

function showMenu(){
    G.state = 'lobby';
    hideAllOverlays();
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('lobby').classList.remove('hidden');
    refreshLobby();
}

function onLockChange(locked){
    if(!locked){
        if(G.state === 'playing'){ G.state = 'paused'; document.getElementById('pause').classList.remove('hidden'); }
    } else {
        if(G.state === 'paused'){ G.state = 'playing'; document.getElementById('pause').classList.add('hidden'); }
    }
}

function openShop(){
    if(G.state !== 'playing' && G.state !== 'paused') return;
    G.state = 'shop';
    document.getElementById('pause').classList.add('hidden');
    document.exitPointerLock();
    openShopUI();
}
function closeShop(){
    if(G.state !== 'shop') return;
    G.state = 'playing';
    closeShopUI();
    requestLock();
}

function openSandbox(){
    if(G.state !== 'playing' || G.mode !== 'sandbox') return;
    G.state = 'sandbox';
    document.exitPointerLock();
    document.getElementById('sandbox').classList.remove('hidden');
}
function closeSandbox(){
    if(G.state !== 'sandbox') return;
    G.state = 'playing';
    document.getElementById('sandbox').classList.add('hidden');
    requestLock();
}
function spawnSandbox(type){
    spawnZombie(type);
    if(G.state === 'sandbox'){ G.state = 'playing'; document.getElementById('sandbox').classList.add('hidden'); requestLock(); }
}

function updatePlayer(dt){
    camera.getWorldDirection(_fwd); _fwd.y = 0; _fwd.normalize();
    _right.crossVectors(_fwd, _up).normalize();
    const move = new THREE.Vector3();
    if(G.keys['KeyW']) move.add(_fwd);
    if(G.keys['KeyS']) move.sub(_fwd);
    if(G.keys['KeyD']) move.add(_right);
    if(G.keys['KeyA']) move.sub(_right);
    if(move.lengthSq() > 0){
        move.normalize();
        let sp = (G.keys['ShiftLeft'] || G.keys['ShiftRight']) ? G.player.sprint : G.player.baseSpeed;
        sp *= G.mult.speed;
        if(G.aiming) sp *= 0.55;
        G.player.pos.x += move.x * sp * dt;
        G.player.pos.z += move.z * sp * dt;
        const lim = GROUND/2 - 2;
        G.player.pos.x = clamp(G.player.pos.x, -lim, lim);
        G.player.pos.z = clamp(G.player.pos.z, -lim, lim);
    }
    collidePlayer();
    camera.position.set(G.player.pos.x, G.player.y, G.player.pos.z);
    if(G.shake > 0){ camera.position.x += (Math.random()-0.5)*G.shake; camera.position.y += (Math.random()-0.5)*G.shake; }

    if(G.firing && G.weapons[G.curWeapon].auto) tryShoot();
    camera.rotation.set(G.pitch + G.recoil.p, G.yaw + G.recoil.y, 0);

    if(G.game.comboTimer > 0){ G.game.comboTimer -= dt; if(G.game.comboTimer <= 0) G.game.combo = 0; }
}

function animate(){
    requestAnimationFrame(animate);
    const rawDt = Math.min(clock.getDelta(), 0.05);
    let dt = rawDt;
    if(G.hitStop > 0){ G.hitStop -= rawDt; dt = rawDt * 0.15; }
    if(G.state === 'playing'){
        updatePlayer(dt);
        updateWeapons(dt);
        updateWaves(dt);
        updateZombies(dt);
        updatePickups(dt);
        updateBanner(dt);
        tickHitmarker(dt);
        setVignette();
        drawMinimap();
        if(G.shake > 0) G.shake = Math.max(0, G.shake - dt*2.5);
    }
    updateEffects(dt);
    music.setIntensity(G.state === 'playing' ? combatIntensity() : 0.2);
    renderer.render(scene, camera);
}

function init(){
    loadPersistedInto();
    initWorld();
    initUI();
    initWeapons();
    initInput({ openShop, closeShop, openSandbox, closeSandbox, onLockChange });
    initLobby(beginGame);
    G._onDeath = gameOver;

    window.Voxel = {
        G,
        config: configMod,
        spawnZombie: spawnZombie,
        damageZombie: damageZombie,
        MODES: configMod.MODES,
        log: msg => console.log('[Voxel] ' + msg),
    };
    loadMods(window.VOXEL_MODS || []);

    document.getElementById('resumeBtn').onclick = () => { document.getElementById('pause').classList.add('hidden'); G.state = 'playing'; requestLock(); };
    document.getElementById('restartBtn').onclick = startRun;
    document.getElementById('menuBtn').onclick = showMenu;
    document.getElementById('shopClose').onclick = closeShop;
    document.getElementById('shopBtn').onclick = openShop;
    document.getElementById('pauseShopBtn').onclick = openShop;
    document.getElementById('sandboxClose').onclick = closeSandbox;
    ['normal','runner','crawler','brute','spitter','exploder','screamer','shield','boss'].forEach(t => {
        document.getElementById('spawn' + t) && (document.getElementById('spawn' + t).onclick = () => spawnSandbox(t));
    });

    refreshLobby();
    animate();
}

init();
