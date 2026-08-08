import { G } from './state.js';
import { camera } from './world.js';
import { zombies, pickups } from './zombies.js';
import { SHOP_ITEMS, ABILITIES, shopOwned } from './config.js';
import { chooseAbility, buyShopItem } from './progression.js';
import { audio } from './audio.js';

let el = {};
let bannerTimer = 0;
let cutsceneTimer = 0;
const BOSS_NAMES = ['ABOMINATION','TITAN','OCULUS','REAPER','COLOSSUS'];
let lastHp = 100, flashHp = 100, flashUntil = 0, ghostT = null, lastBeat = 0, lastUpg = '';

export function initUI(){
    const ids = ['hpFill','hpGhost','hpText','xpFill','lvlText','cashText','weaponName','ammo','killsText',
        'bossBarWrap','bossFill','bossPhase','waveBanner','vignette','dmgFlash','minimap','levelUp','luSub','cards',
        'shop','shopCash','shopList','timerLine','timerText','beaconBarWrap','beaconFill','toasts','upgPanel',
        'meleeRow','meleeFill'];
    ids.forEach(id => el[id] = document.getElementById(id));
}

export function toast(msg, cls){
    if(!el.toasts) return;
    const t = document.createElement('div');
    t.className = 'toast' + (cls ? ' ' + cls : '');
    t.textContent = msg;
    el.toasts.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2000);
}

export function setAim(on){
    const show = !!on;
    const ov = document.getElementById('scopeOverlay');
    const ch = document.getElementById('crosshair');
    if(ov) ov.classList.toggle('hidden', !show);
    if(ch) ch.classList.toggle('hidden', show);
}

function refreshHealth(){
    const hpPct = Math.max(0, G.player.health / G.player.maxHealth * 100);
    if(G.player.health < lastHp - 0.5 && el.hpGhost){
        el.hpGhost.style.width = (lastHp / G.player.maxHealth * 100) + '%';
        el.hpGhost.style.opacity = 1;
        clearTimeout(ghostT);
        ghostT = setTimeout(() => {
            el.hpGhost.style.width = (G.player.health / G.player.maxHealth * 100) + '%';
        }, 320);
        setTimeout(() => { el.hpGhost.style.opacity = 0; }, 1500);
    }
    lastHp = G.player.health;
    el.hpFill.style.width = hpPct + '%';
    el.hpText.textContent = Math.ceil(G.player.health);
}

export function updateHUD(){
    refreshHealth();
    el.xpFill.style.width = (G.game.xp / G.game.xpToNext * 100) + '%';
    el.lvlText.textContent = G.game.level;
    el.cashText.textContent = G.game.cash;
    const w = G.weapons[G.curWeapon];
    el.weaponName.textContent = w.name;
    el.ammo.innerHTML = '∞';
    el.killsText.textContent = G.game.kills;
    if(G.meleeCd !== undefined && el.meleeFill){
        const MELEE_CD = 0.6;
        const pct = Math.max(0, 1 - G.meleeCd / MELEE_CD);
        el.meleeFill.style.width = (pct * 100) + '%';
        el.meleeRow.classList.toggle('ready', pct >= 1);
    }
    if(G.boss){
        el.bossFill.style.width = Math.max(0, G.boss.hp / G.boss.maxHp * 100) + '%';
        const n = Math.min(5, Math.max(1, G.boss.rage || 1));
        el.bossPhase.textContent = 'PHASE ' + n + ' · ' + BOSS_NAMES[n - 1];
    }
    el.timerLine.style.display = G.mode === 'time' ? 'block' : 'none';
    if(G.mode === 'time'){
        const s = Math.max(0, Math.ceil(G.game.timer));
        el.timerText.textContent = Math.floor(s/60) + ':' + String(s%60).padStart(2,'0');
    }
    el.beaconBarWrap.style.display = G.mode === 'defense' ? 'block' : 'none';
    if(G.mode === 'defense') el.beaconFill.style.width = Math.max(0, G.game.beaconHp / G.game.beaconMaxHp * 100) + '%';
    if(el.upgPanel){
        const upg = [...G.game.perks, ...G.game.bought].map(s => `<span class="upg-chip">${s}</span>`).join('');
        if(upg !== lastUpg){ lastUpg = upg; el.upgPanel.innerHTML = upg; }
    }
}

export function showBanner(text){ el.waveBanner.textContent = text; el.waveBanner.style.opacity = 1; bannerTimer = 2; }
export function updateBanner(dt){
    if(bannerTimer > 0){
        bannerTimer -= dt;
        if(bannerTimer <= 0) el.waveBanner.style.opacity = 0;
    }
    if(cutsceneTimer > 0){
        cutsceneTimer -= dt;
        if(cutsceneTimer <= 0){
            const bc = document.getElementById('bossCutscene');
            if(bc) bc.classList.add('hidden');
        }
    }
}

export function bossCutscene(z){
    const n = Math.min(5, Math.max(1, z.rage));
    const bc = document.getElementById('bossCutscene');
    if(!bc) return;
    const name = document.getElementById('bcName');
    const sub = document.getElementById('bcSub');
    if(name) name.textContent = BOSS_NAMES[n - 1];
    if(sub) sub.textContent = 'PHASE ' + n + ' / 5';
    bc.classList.remove('hidden');
    G.shake = Math.max(G.shake, 0.5);
    cutsceneTimer = 1.7;
    audio.summon();
}

export function setVignette(){
    refreshHealth();
    const now = performance.now();
    const r = Math.max(0, G.player.health / G.player.maxHealth);
    const intensity = r < 0.4 ? (0.4 - r) / 0.4 : 0;
    el.vignette.style.boxShadow = 'inset 0 0 200px ' + (40 + intensity*60) + 'px rgba(180,0,0,' + (intensity*0.6).toFixed(2) + ')';
    if(G.player.health < flashHp - 0.5){ flashUntil = now + 380; flashHp = G.player.health; }
    else if(G.player.health > flashHp){ flashHp = G.player.health; }
    const f = Math.max(0, (flashUntil - now) / 380);
    el.dmgFlash.style.opacity = (f * 0.6).toFixed(2);
    document.body.classList.toggle('low-hp', r < 0.3);
    if(r < 0.3){
        if(now - lastBeat > 1100){ lastBeat = now; audio.heartbeat(); }
    }
}

export function drawMinimap(){
    const c = el.minimap, ctx = c.getContext('2d');
    const W = c.width, H = c.height, cx = W/2, cy = H/2, R = 75, scale = (W/2)/R;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = 'rgba(10,20,12,0.7)'; ctx.beginPath(); ctx.arc(cx,cy,W/2-1,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#2a4'; ctx.lineWidth = 2; ctx.stroke();
    for(const z of zombies){
        const dx = z.group.position.x - G.player.pos.x, dz = z.group.position.z - G.player.pos.z;
        if(Math.hypot(dx,dz) > R) continue;
        ctx.fillStyle = z.type==='boss' ? '#f0f' : (z.type==='brute' ? '#f55' : (z.type==='runner' ? '#ff5' : '#f22'));
        const s = z.type==='boss' ? 5 : 3;
        ctx.fillRect(cx + dx*scale - s/2, cy + dz*scale - s/2, s, s);
    }
    for(const p of pickups){
        const dx = p.mesh.position.x - G.player.pos.x, dz = p.mesh.position.z - G.player.pos.z;
        if(Math.hypot(dx,dz) > R) continue;
        ctx.fillStyle = p.type==='health' ? '#3f6' : '#fc6';
        ctx.fillRect(cx + dx*scale - 2, cy + dz*scale - 2, 4, 4);
    }
    const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
    ctx.strokeStyle = '#6f6'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(cx + fwd.x*12, cy + fwd.z*12); ctx.stroke();
    ctx.fillStyle = '#6f6'; ctx.beginPath(); ctx.arc(cx,cy,3,0,Math.PI*2); ctx.fill();
}

export function openLevelUp(){
    const pool = [...ABILITIES], picks = [];
    for(let i=0;i<3 && pool.length;i++) picks.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
    el.cards.innerHTML = '';
    picks.forEach(a => {
        const c = document.createElement('div'); c.className = 'card';
        c.innerHTML = `<div class="ico">${a.ico}</div><div class="name">${a.name}</div><div class="desc">${a.desc}</div><div class="lvl">CLICK TO SELECT</div>`;
        c.onclick = () => chooseAbility(a);
        el.cards.appendChild(c);
    });
    el.luSub.textContent = 'Level ' + G.game.level + ' — choose a perk';
    el.levelUp.classList.remove('hidden');
}

export function hideLevelUp(){ el.levelUp.classList.add('hidden'); }

export function renderShop(){
    el.shopCash.textContent = G.game.cash;
    el.shopList.innerHTML = '';
    SHOP_ITEMS.forEach((it, idx) => {
        const owned = shopOwned(it, G);
        const afford = G.game.cash >= it.cost;
        const cls = it.once ? (it.key && it.key[0] === 'w' ? 'unlock' : 'attach') : 'consum';
        const div = document.createElement('div'); div.className = 'shop-item ' + cls;
        div.innerHTML = `<div class="top"><span class="iname">${it.ico} ${it.name}</span><span class="credits">$${it.cost}</span></div><div class="idesc">${it.desc}</div>`;
        const btn = document.createElement('button'); btn.className = 'ibuy';
        btn.textContent = owned ? 'OWNED' : 'BUY';
        btn.disabled = owned || !afford;
        btn.onclick = () => buyShopItem(idx);
        div.appendChild(btn);
        el.shopList.appendChild(div);
    });
}

export function openShopUI(){ el.shop.classList.remove('hidden'); renderShop(); }
export function closeShopUI(){ el.shop.classList.add('hidden'); }
