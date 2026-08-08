import { G } from './state.js';
import { scene, beaconPos } from './world.js';
import { ZTYPES } from './config.js';
import { buildZombieMesh, buildBossForm, buildPickup } from './models/index.js';
import * as FX from './effects.js';
import { audio } from './audio.js';
import { updateHUD, toast, bossCutscene } from './ui.js';
import { gainXp } from './progression.js';

export const zombies = [];
export const pickups = [];
export const corpses = [];
const proj = [];

function hurtPlayer(dmg){
    if(G.god) return;
    G.player.health -= dmg;
    audio.hurt();
    G.shake = Math.max(G.shake, 0.2);
    if(G.player.health <= 0){ G.player.health = 0; G._onDeath && G._onDeath(); }
    updateHUD();
}

export function spawnZombie(type, at){
    const t = ZTYPES[type];
    const isBoss = type === 'boss';
    const g = isBoss ? buildBossForm(1) : buildZombieMesh(type);
    if(at){
        g.position.set(at.x, 0, at.z);
    } else {
        const ang = Math.random() * Math.PI * 2, dist = 32 + Math.random() * 18;
        g.position.set(Math.cos(ang) * dist, 0, Math.sin(ang) * dist);
    }
    const hp = isBoss
        ? Math.round(t.hp * Math.pow(1.22, Math.max(0, G.game.wave - 1)))
        : Math.round(t.hp * (1 + G.game.wave * 0.10));
    const z = {
        type, group: g, hit: g.hitMeshes, hp, maxHp: hp,
        speed: t.speed + (isBoss ? 0 : G.game.wave * 0.03),
        dmg: isBoss ? (t.dmg + G.game.wave * 1.5) : (t.dmg + G.game.wave * 0.8),
        score: t.score,
        cash: t.cash,
        alive: true, attackCd: 0, hitFlash: 0, lunge: 0, atkAnim: 0, groanCd: 1 + Math.random() * 3,
    };
    if(isBoss){
        z.abilityCd = 3;
        z.phase = 'idle';
        z.phaseT = 0;
        z.chargeVel = new THREE.Vector3();
        z.chargeDmg = 0;
        z.rage = 1;
        z.rageT = 0;
        z.atkFlip = false;
    }
    if(type === 'shield'){ z.shieldHp = 260; z.shieldMesh = g.userData.shieldMesh; }
    if(type === 'screamer') z.summonCd = 3;
    g.hitMeshes.forEach(m => m.userData.zombie = z);
    scene.add(g);
    zombies.push(z);
    if(isBoss){ G.boss = z; document.getElementById('bossBarWrap').style.display = 'block'; }
    return z;
}

export function damageZombie(z, dmg, point, isHead, shieldPierce){
    if(!z.alive) return;
    if(z.shieldHp > 0 && !shieldPierce){
        z.shieldHp -= dmg;
        z.hitFlash = 0.08;
        FX.spawnParticles(point || z.group.position.clone().setY(1.3), 0x8899aa, 5);
        FX.spawnDamageNumber(point || z.group.position.clone().setY(1.6), 'BLOCKED', '#89a');
        if(z.shieldHp <= 0 && z.shieldMesh){ z.shieldMesh.visible = false; audio.shieldBreak(); }
        return;
    }
    z.hp -= dmg;
    z.hitFlash = 0.08;
    if(isHead) G.game.headshots++;
    FX.spawnParticles(point || z.group.position.clone().setY(1.3), isHead ? 0xaa2222 : 0x882222, isHead ? 10 : 6, { bias: new THREE.Vector3(0, 2, 0) });
    if(isHead) FX.spawnParticles(point || z.group.position.clone().setY(1.6), 0xffcc44, 6, { bias: new THREE.Vector3(0, 3, 0) });
    FX.spawnBloodDecal(point || z.group.position.clone());
    FX.showHitmarker(isHead);
    FX.spawnDamageNumber(point || z.group.position.clone().setY(1.6), isHead ? ('HEAD ' + Math.round(dmg)) : ('' + Math.round(dmg)), isHead ? '#fd6' : '#fff');
    if(isHead) audio.headshot(); else audio.hit();
    if(z.hp <= 0) killZombie(z);
}

function killZombie(z){
    if(!z.alive) return;
    z.alive = false;
    const i = zombies.indexOf(z); if(i >= 0) zombies.splice(i,1);
    corpses.push({ group: z.group, t: 0 });

    G.game.kills++;
    G.game.combo++; G.game.comboTimer = 3;
    const mult = 1 + Math.floor(G.game.combo/5)*0.5;
    if(G.game.combo >= 5 && G.game.combo % 5 === 0) toast('COMBO x' + mult + '!', 'combo');
    const gained = Math.round(z.score * mult);
    G.game.score += gained*2;
    const cash = Math.round(z.cash * mult);
    G.game.cash += cash;

    G.hitStop = Math.min(0.09, G.hitStop + 0.05);
    G.shake = Math.max(G.shake, 0.15);
    G.recoil.p += 0.015;
    FX.spawnDamageNumber(z.group.position.clone().setY(1.9), '+' + gained + ' XP', '#6cf', 'xp');
    FX.spawnDamageNumber(z.group.position.clone().setY(2.3), '+$' + cash, '#fd6', 'cash');

    if(G.mult.lifesteal > 0) G.player.health = Math.min(G.player.maxHealth, G.player.health + G.mult.lifesteal);

    gainXp(Math.round((10 + G.game.wave*2 + (z.maxHp>120?5:0)) * (z.type==='boss'?4:1)));
    FX.spawnParticles(z.group.position.clone().setY(1.1), ZTYPES[z.type].color, 14);
    audio.zombieDie();

    if(z.type === 'boss'){ G.boss = null; document.getElementById('bossBarWrap').style.display = 'none'; spawnPickup(z.group.position, 'grenade'); }
    if(Math.random() < 0.12) spawnPickup(z.group.position, 'health');
    else if(Math.random() < 0.10) spawnPickup(z.group.position, 'grenade');

    updateHUD();
}

export function spawnPickup(pos, type){
    const m = buildPickup(type);
    m.position.set(pos.x, 0.6, pos.z);
    scene.add(m);
    pickups.push({ mesh:m, type, t:0 });
}

const PICKUP_LIFE = 20, PICKUP_WARN = 4;

export function updatePickups(dt){
    for(let i=pickups.length-1;i>=0;i--){
        const p = pickups[i];
        p.t += dt;
        if(p.t > PICKUP_LIFE){
            scene.remove(p.mesh); pickups.splice(i,1);
            continue;
        }
        if(p.t > PICKUP_LIFE - PICKUP_WARN) p.mesh.visible = Math.floor(p.t * 2) % 2 === 0;
        p.mesh.rotation.y += dt*2;
        p.mesh.position.y = 0.6 + Math.sin(p.t*3)*0.12;
        const dx = G.player.pos.x - p.mesh.position.x, dz = G.player.pos.z - p.mesh.position.z;
        if(dx*dx + dz*dz < 1.7*1.7){
            if(p.type === 'health'){
                G.player.health = Math.min(G.player.maxHealth, G.player.health+50);
                FX.spawnDamageNumber(p.mesh.position.clone().setY(1.6), '+50 HP', '#3f6');
            } else {
                G.player.grenades += 2;
                FX.spawnDamageNumber(p.mesh.position.clone().setY(1.6), '+2 GRENADES', '#fc6');
            }
            scene.remove(p.mesh); pickups.splice(i,1);
            audio.pickup(); updateHUD();
        }
    }
}

function fireProjectile(origin, dir, speed, color, emissive, dmg, life){
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6),
        new THREE.MeshLambertMaterial({ color, emissive, emissiveIntensity: 0.8 }));
    mesh.position.copy(origin);
    scene.add(mesh);
    proj.push({ mesh, pos: origin.clone(), vel: dir.clone().multiplyScalar(speed), life, dmg, color });
}

function fireSpit(z, tx, tz){
    const origin = z.group.position.clone().setY(1.4);
    const dir = new THREE.Vector3(tx - origin.x, 1.2, tz - origin.z).normalize();
    fireProjectile(origin, dir, 16, 0x3a9a5a, 0x1a5a2a, 10 + G.game.wave * 0.8, 2.5);
    audio.groan(120, 160);
}

function bossNova(z){
    const g = z.group;
    const N = 14 + (z.rage - 1) * 2;
    for(let k = 0; k < N; k++){
        const a = k / N * Math.PI * 2;
        const dir = new THREE.Vector3(Math.sin(a), 0.02, Math.cos(a)).normalize();
        fireProjectile(g.position.clone().setY(2.2), dir, 13, 0xaa22ff, 0x5500aa, Math.round(z.dmg * 0.75), 3.2);
    }
    FX.spawnRing(g.position.clone().setY(0), 0xaa22ff, 16);
    FX.spawnParticles(g.position.clone().setY(1.5), 0xaa22ff, 30, { bias: new THREE.Vector3(0, 4, 0) });
    audio.summon();
    G.shake = Math.max(G.shake, 0.4);
}

function bossVolley(z){
    const g = z.group, P = G.player.pos;
    const origin = g.position.clone().setY(2.2);
    const N = 4 + z.rage;
    const base = new THREE.Vector3(P.x - origin.x, 0, P.z - origin.z).normalize();
    const ang = Math.atan2(base.x, base.z);
    for(let k = 0; k < N; k++){
        const t = (N === 1 ? 0 : k / (N - 1)) - 0.5;
        const a = ang + t * 0.5;
        const dir = new THREE.Vector3(Math.sin(a), 1.1, Math.cos(a)).normalize();
        fireProjectile(origin, dir, 14, 0xff4422, 0x882200, Math.round(z.dmg * 0.5), 2.8);
    }
    FX.spawnParticles(origin, 0xff4422, 16, { bias: new THREE.Vector3(0, 3, 0) });
    audio.groan(120, 160);
    G.shake = Math.max(G.shake, 0.3);
}

function updateProjectiles(dt){
    for(let i=proj.length-1;i>=0;i--){
        const p = proj[i];
        p.vel.y -= 12*dt;
        p.pos.addScaledVector(p.vel, dt);
        p.mesh.position.copy(p.pos);
        p.life -= dt;
        const dx = p.pos.x - G.player.pos.x, dy = p.pos.y - G.player.y, dz = p.pos.z - G.player.pos.z;
        if(dx*dx + dy*dy + dz*dz < 0.36){
            if(!G.god){
                G.player.health -= p.dmg;
                audio.hurt();
                G.shake = Math.max(G.shake, 0.12);
                if(G.player.health <= 0){ G.player.health = 0; G._onDeath && G._onDeath(); }
                updateHUD();
            }
            FX.spawnParticles(p.pos, p.color, 8);
            scene.remove(p.mesh); proj.splice(i,1);
            continue;
        }
        if(p.life <= 0 || p.pos.y < 0.1){ FX.spawnParticles(p.pos, p.color, 5); scene.remove(p.mesh); proj.splice(i,1); }
    }
}

function exploderBoom(z){
    const pos = z.group.position.clone();
    FX.spawnParticles(pos.clone().setY(1), 0xff7722, 26, { bias: new THREE.Vector3(0, 3, 0) });
    FX.spawnSmoke(pos.clone().setY(0.8), 12);
    FX.spawnRing(pos.clone().setY(0), 0xff6622, 8);
    audio.explosion();
    G.shake = Math.max(G.shake, 0.4);
    const d = pos.distanceTo(G.player.pos);
    if(d < 8 && !G.god){
        G.player.health -= ZTYPES.exploder.dmg * (1 - d/8);
        audio.hurt();
        if(G.player.health <= 0){ G.player.health = 0; G._onDeath && G._onDeath(); }
        updateHUD();
    }
    killZombie(z);
}

function updateCorpses(dt){
    for(let i=corpses.length-1;i>=0;i--){
        const c = corpses[i];
        c.t += dt;
        c.group.rotation.x += dt * 2.2;
        c.group.rotation.z += dt * 5.5;
        c.group.position.y -= dt * 1.4;
        if(c.t > 1.1){ scene.remove(c.group); corpses.splice(i, 1); }
    }
}

function animateWalk(z, dt, freq, amp){
    const g = z.group, parts = g.userData.parts;
    const ph = (g.userData.walk += dt * freq);
    const s = Math.sin(ph), c = Math.cos(ph);
    if(g.userData.crawler){
        parts.armL.rotation.x = -0.8 + s * amp;
        parts.armR.rotation.x = -0.8 - s * amp;
        parts.legL.rotation.x = 1.0 - s * amp * 0.8;
        parts.legR.rotation.x = 1.0 + s * amp * 0.8;
        parts.body.rotation.x = 0.18 + c * 0.08;
        parts.head.rotation.x = 0.15 + c * 0.1;
        g.position.y = Math.abs(c) * 0.08;
        g.rotation.z = c * 0.06;
        return;
    }
    parts.armL.rotation.x = s * amp;
    parts.armR.rotation.x = -s * amp;
    parts.legL.rotation.x = -s * amp * 0.75;
    parts.legR.rotation.x = s * amp * 0.75;
    const elbow = 0.45 + Math.max(0, s) * 0.35;
    if(parts.armL.userData.lower) parts.armL.userData.lower.rotation.x = elbow;
    if(parts.armR.userData.lower) parts.armR.userData.lower.rotation.x = elbow;
    parts.head.rotation.x = 0.12 + c * 0.06;
    parts.body.rotation.x = c * 0.05;
    g.position.y = Math.abs(c) * 0.12;
    g.rotation.z = c * 0.035;
}

export function clearProjectiles(){
    for(const p of proj) scene.remove(p.mesh);
    proj.length = 0;
}

function swapBossForm(z){
    const old = z.group;
    const ng = buildBossForm(z.rage);
    ng.position.copy(old.position);
    ng.rotation.copy(old.rotation);
    ng.userData.walk = old.userData.walk || 0;
    scene.remove(old);
    scene.add(ng);
    z.group = ng;
    z.hit = ng.hitMeshes;
    ng.hitMeshes.forEach(m => m.userData.zombie = z);
}

function updateBoss(z, dt, dist){
    let g = z.group;
    let parts = g.userData.parts;
    const P = G.player.pos;
    const yaw = Math.atan2(P.x - g.position.x, P.z - g.position.z);
    z.rageT += dt;

    if(z.rage === 5 && g.userData.aura){
        g.userData.aura.visible = true;
        const pulse = Math.abs(Math.sin(z.rageT * 3));
        g.userData.aura.material.opacity = 0.14 + pulse * 0.2;
        g.userData.aura.material.emissiveIntensity = 0.7 + pulse * 1.3;
    }
    const base = g.userData.formScale || 2.2;
    const pulse = z.rage === 5 ? 1 + Math.abs(Math.sin(z.rageT * 5)) * 0.015 : 1;
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, base * pulse, Math.min(1, dt * 3)));

    if(z.phase === 'charge'){
        z.phaseT -= dt;
        g.position.x += z.chargeVel.x * dt;
        g.position.z += z.chargeVel.z * dt;
        g.position.y = Math.max(0, Math.sin(z.phaseT * 5) * 0.2);
        g.rotation.set(0, yaw, 0);
        parts.armL.rotation.x = -1.9; parts.armR.rotation.x = -1.9;
        if(parts.armL.userData.lower) parts.armL.userData.lower.rotation.x = 0.5;
        if(parts.armR.userData.lower) parts.armR.userData.lower.rotation.x = 0.5;
        if(g.position.distanceTo(P) < 2.4) hurtPlayer(z.chargeDmg);
        if(z.phaseT <= 0){
            z.phase = 'idle';
            z.abilityCd = 2.5 + Math.random() * 2;
            FX.spawnRing(g.position.clone().setY(0), 0xff5522, 7);
            FX.spawnParticles(g.position.clone().setY(1.2), 0xff7722, 16, { bias: new THREE.Vector3(0, 3, 0) });
            audio.explosion();
            G.shake = Math.max(G.shake, 0.5);
            if(g.position.distanceTo(P) < 7) hurtPlayer(Math.round(z.dmg * 0.9));
        }
        return;
    }
    if(z.phase === 'slam'){
        z.phaseT -= dt;
        g.rotation.set(0, yaw, 0);
        parts.armL.position.y = 0.5; parts.armR.position.y = 0.5;
        parts.armL.rotation.x = -2.4; parts.armR.rotation.x = -2.4;
        if(z.phaseT <= 0){
            z.phase = 'idle';
            z.abilityCd = 3 + Math.random() * 2;
            const r = 6;
            FX.spawnRing(g.position.clone().setY(0), 0xff6622, r * 1.4);
            FX.spawnParticles(g.position.clone().setY(1), 0xff7722, 22, { bias: new THREE.Vector3(0, 3, 0) });
            FX.spawnSmoke(g.position.clone().setY(0.8), 10);
            audio.explosion();
            G.shake = Math.max(G.shake, 0.6);
            const d = g.position.distanceTo(P);
            if(d < r) hurtPlayer(Math.round(z.dmg * 1.2 * (1 - d / r)));
        }
        return;
    }
    if(z.phase === 'summon'){
        z.phaseT -= dt;
        g.rotation.set(0, yaw, 0);
        parts.armL.position.y = 0.5; parts.armR.position.y = 0.5;
        parts.armL.rotation.x = -2.7; parts.armR.rotation.x = -2.7;
        g.position.y = Math.sin(z.phaseT * 4) * 0.2;
        if(z.phaseT <= 0){
            z.phase = 'idle';
            z.abilityCd = 4 + Math.random() * 2;
            audio.summon();
            for(let k = 0; k < 2 + Math.floor(z.rage / 2); k++) spawnZombie(k === 0 ? 'runner' : 'normal', { x: g.position.x + (Math.random() - 0.5) * 5, z: g.position.z + (Math.random() - 0.5) * 5 });
            FX.spawnRing(g.position.clone().setY(0), 0xcc66ff, 5);
        }
        return;
    }
    if(z.phase === 'nova'){
        z.phaseT -= dt;
        g.rotation.set(0, yaw, 0);
        parts.armL.position.y = 0.5; parts.armR.position.y = 0.5;
        parts.armL.rotation.x = -2.7; parts.armR.rotation.x = -2.7;
        g.position.y = Math.sin(z.phaseT * 4) * 0.2;
        parts.core.material.emissiveIntensity = 1.5 + Math.abs(Math.sin(z.phaseT * 8)) * 1.5;
        if(z.phaseT <= 0){
            z.phase = 'idle';
            z.abilityCd = 5 + Math.random() * 2;
            parts.core.material.emissiveIntensity = 1;
            bossNova(z);
        }
        return;
    }
    if(z.phase === 'volley'){
        z.phaseT -= dt;
        g.rotation.set(0, yaw, 0);
        parts.armL.position.y = 0.5; parts.armR.position.y = 0.5;
        parts.armL.rotation.x = -2.7; parts.armR.rotation.x = -2.7;
        g.position.y = Math.sin(z.phaseT * 3) * 0.2;
        parts.core.material.emissiveIntensity = 1.2 + Math.abs(Math.sin(z.phaseT * 6)) * 1.2;
        if(z.phaseT <= 0){
            z.phase = 'idle';
            z.abilityCd = 4.5 + Math.random() * 2;
            parts.core.material.emissiveIntensity = 1;
            bossVolley(z);
        }
        return;
    }

    parts.armL.position.y = 0; parts.armR.position.y = 0;
    parts.core.material.emissiveIntensity = 1;
    z.abilityCd -= dt;

    const frac = z.hp / z.maxHp;
    const newRage = frac > 0.8 ? 1 : frac > 0.6 ? 2 : frac > 0.4 ? 3 : frac > 0.2 ? 4 : 5;
    if(newRage !== z.rage){
        z.rage = newRage;
        swapBossForm(z);
        g = z.group;
        parts = g.userData.parts;
        FX.spawnRing(g.position.clone().setY(0), 0xcc66ff, 9);
        FX.spawnParticles(g.position.clone().setY(1.5), 0xcc66ff, 20, { bias: new THREE.Vector3(0, 4, 0) });
        audio.summon();
        G.shake = Math.max(G.shake, 0.4);
        bossCutscene(z);
        updateHUD();
    }
    const sp = z.speed * (1 + (z.rage - 1) * 0.14);
    const atkDist = 2.6;
    if(dist > atkDist){
        const nx = (P.x - g.position.x) / dist, nz = (P.z - g.position.z) / dist;
        g.position.x += nx * sp * dt;
        g.position.z += nz * sp * dt;
        g.rotation.set(0, Math.atan2(nx, nz), 0);
        animateWalk(z, dt, 3 + sp + (z.rage - 1) * 1.1, 0.55 + (z.rage - 1) * 0.06);
    } else {
        z.attackCd -= dt;
        if(z.attackCd <= 0){
            z.attackCd = 1.1 - (z.rage - 1) * 0.07;
            z.atkAnim = 0.5;
            z.atkFlip = !z.atkFlip;
            hurtPlayer(z.dmg);
        }
        g.rotation.set(0, yaw, 0);
        const p = z.atkAnim > 0 ? 1 - z.atkAnim / 0.5 : 0;
        const thrust = Math.sin(p * Math.PI);
        if(z.rage >= 5){
            const lead = z.atkFlip ? 'L' : 'R';
            parts.armL.rotation.x = (lead === 'L' ? -1.2 - thrust * 1.5 : -0.5 - thrust * 0.5);
            parts.armR.rotation.x = (lead === 'R' ? -1.2 - thrust * 1.5 : -0.5 - thrust * 0.5);
            parts.legL.rotation.x = 0.45 + (lead === 'L' ? thrust * 0.3 : 0);
            parts.legR.rotation.x = -0.45 - (lead === 'R' ? thrust * 0.3 : 0);
        } else if(z.rage >= 3){
            const smash = -2.5 + thrust * 3.1;
            parts.armL.rotation.x = smash;
            parts.armR.rotation.x = smash;
            parts.legL.rotation.x = 0.35; parts.legR.rotation.x = -0.35;
        } else {
            parts.armL.rotation.x = -1.1 - thrust * 1.0;
            parts.armR.rotation.x = -1.1 - thrust * 1.0;
            parts.legL.rotation.x = 0.35; parts.legR.rotation.x = -0.35;
        }
        if(parts.armL.userData.lower) parts.armL.userData.lower.rotation.x = 0.3 + thrust * 0.5;
        if(parts.armR.userData.lower) parts.armR.userData.lower.rotation.x = 0.3 + thrust * 0.5;
        if(z.atkAnim > 0) z.atkAnim -= dt;
    }

    if(z.abilityCd <= 0){
        const opts = ['slam'];
        if(z.rage >= 2) opts.push('charge');
        opts.push('summon');
        if(z.rage >= 3) opts.push('nova');
        if(z.rage >= 4) opts.push('volley');
        const r = opts[Math.floor(Math.random() * opts.length)];
        if(r === 'charge'){
            z.phase = 'charge';
            z.phaseT = 0.9;
            const v = new THREE.Vector3(P.x - g.position.x, 0, P.z - g.position.z).normalize();
            z.chargeVel = v.multiplyScalar(sp * (6 + z.rage));
            z.chargeDmg = Math.round(z.dmg * (1.5 + z.rage * 0.3));
            audio.summon();
        } else if(r === 'slam'){
            z.phase = 'slam';
            z.phaseT = 1.1;
        } else if(r === 'summon'){
            z.phase = 'summon';
            z.phaseT = 1.2;
        } else if(r === 'nova'){
            z.phase = 'nova';
            z.phaseT = 1.3;
        } else {
            z.phase = 'volley';
            z.phaseT = 1.8;
        }
    }
}

export function updateZombies(dt){
    for(let i=zombies.length-1;i>=0;i--){
        const z = zombies[i];
        const g = z.group;
        const parts = g.userData.parts;
        const isBoss = z.type === 'boss';
        let tx = G.player.pos.x, tz = G.player.pos.z, targetPlayer = true;
        if(!isBoss && G.mode === 'defense' && G.game.beaconHp > 0){
            const dbx = beaconPos.x - g.position.x, dbz = beaconPos.z - g.position.z;
            const dpx = G.player.pos.x - g.position.x, dpz = G.player.pos.z - g.position.z;
            if(dbx*dbx + dbz*dbz < dpx*dpx + dpz*dpz){ tx = beaconPos.x; tz = beaconPos.z; targetPlayer = false; }
        }
        const dx = tx - g.position.x, dz = tz - g.position.z;
        const dist = Math.hypot(dx, dz);
        const tt = ZTYPES[z.type];

        if(z.type === 'exploder' && dist < 2.4){ exploderBoom(z); continue; }

        if(isBoss){
            updateBoss(z, dt, dist);
        } else {
            const spitterRanged = z.type === 'spitter' && dist < 18 && dist > 5;
            const atkDist = targetPlayer ? 1.4 : 2.0;

            if(spitterRanged){
                z.attackCd -= dt;
                if(z.attackCd <= 0){ z.attackCd = 1.4; fireSpit(z, tx, tz); z.atkAnim = 0.4; }
                g.rotation.set(0, Math.atan2(dx, dz), 0);
                const sp = z.atkAnim > 0 ? 1 - z.atkAnim / 0.4 : 0;
                const thrust = Math.sin(sp * Math.PI);
                parts.armL.rotation.x = -1.1 - thrust * 0.5;
                parts.armR.rotation.x = -1.1 - thrust * 0.5;
                if(z.atkAnim > 0) z.atkAnim -= dt;
            } else if(dist > atkDist){
                if(z.attackCd > 0) z.attackCd -= dt;
                let nx = dx / dist, nz = dz / dist;
                let sepX = 0, sepZ = 0;
                const rr = (z.type === 'brute' || z.type === 'shield') ? 1.6 : 1.1;
                for(const o of zombies){
                    if(o === z || o.type === 'boss') continue;
                    const ox = g.position.x - o.group.position.x, oz = g.position.z - o.group.position.z;
                    const d2 = ox * ox + oz * oz;
                    if(d2 < rr * rr && d2 > 0.0001){ const d = Math.sqrt(d2); sepX += ox / d * (rr - d); sepZ += oz / d * (rr - d); }
                }
                const sp = z.speed;
                g.position.x += (nx * sp + sepX * sp * 0.6) * dt;
                g.position.z += (nz * sp + sepZ * sp * 0.6) * dt;
                g.rotation.set(0, Math.atan2(nx, nz), 0);
                animateWalk(z, dt, 4 + sp * 1.2, z.type === 'runner' ? 0.95 : (z.type === 'brute' || z.type === 'shield') ? 0.5 : 0.7);
            } else {
                z.attackCd -= dt;
                if(z.attackCd <= 0){
                    z.attackCd = 0.8;
                    z.atkAnim = 0.45;
                    if(targetPlayer){
                        hurtPlayer(z.dmg);
                    } else {
                        G.game.beaconHp -= z.dmg;
                        audio.hurt();
                        if(G.game.beaconHp <= 0){
                            G.game.beaconHp = 0;
                            G.overTitle = 'BEACON DESTROYED';
                            G._onDeath && G._onDeath();
                        }
                    }
                }
                g.rotation.set(0, Math.atan2(dx, dz), 0);
                z.lunge = Math.min(0.4, z.lunge + dt * 2);
                g.position.y = z.lunge;
                const p = z.atkAnim > 0 ? 1 - z.atkAnim / 0.45 : 0;
                const thrust = Math.sin(p * Math.PI);
                if(g.userData.crawler){
                    g.position.y = z.lunge + thrust * 0.18;
                    parts.body.rotation.x = 0.18 - thrust * 0.4;
                    parts.head.rotation.x = 0.15 + thrust * 0.4;
                    parts.jaw.rotation.x = thrust * 0.5;
                    parts.armL.rotation.x = -0.8 - thrust * 0.7;
                    parts.armR.rotation.x = -0.8 - thrust * 0.7;
                    parts.legL.rotation.x = 1.0 + thrust * 0.4;
                    parts.legR.rotation.x = 1.0 + thrust * 0.4;
                } else {
                    parts.armL.rotation.x = -0.9 - thrust * 1.1;
                    parts.armR.rotation.x = -0.9 - thrust * 1.1;
                    if(parts.armL.userData.lower) parts.armL.userData.lower.rotation.x = 0.3 + thrust * 0.6;
                    if(parts.armR.userData.lower) parts.armR.userData.lower.rotation.x = 0.3 + thrust * 0.6;
                    parts.jaw.rotation.x = thrust * 0.25;
                    parts.head.rotation.x = 0.1;
                    parts.legL.rotation.x = 0.4; parts.legR.rotation.x = -0.4;
                }
                if(z.atkAnim > 0) z.atkAnim -= dt;
            }
            if(z.lunge > 0 && dist > atkDist) z.lunge = Math.max(0, z.lunge - dt * 2);

            if(z.type === 'screamer'){
                z.summonCd -= dt;
                if(z.summonCd <= 0 && dist < 26){
                    z.summonCd = 6;
                    audio.summon();
                    for(let k = 0; k < 2; k++) spawnZombie('normal', { x: g.position.x + (Math.random() - 0.5) * 4, z: g.position.z + (Math.random() - 0.5) * 4 });
                }
            }
        }

        if(z.hitFlash > 0){
            z.hitFlash -= dt;
            g.hitMeshes.forEach(m => m.material.emissive && m.material.emissive.setHex(0xaa0000));
        } else {
            g.hitMeshes.forEach(m => m.material.emissive && m.material.emissive.setHex(0x000000));
        }

        z.groanCd -= dt;
        if(z.groanCd <= 0){ z.groanCd = 4 + Math.random() * 5; const r = tt.groan; audio.groan(r[0], r[1]); }
    }
    updateProjectiles(dt);
    updateCorpses(dt);
}
