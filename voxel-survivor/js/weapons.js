import { G } from './state.js';
import { scene, camera, obstacles as worldObstacles, damageObstacle } from './world.js';
import { effMag } from './config.js';
import * as FX from './effects.js';
import { audio } from './audio.js';
import { buildViewModel } from './models/index.js';
import { damageZombie, zombies as zombieList } from './zombies.js';
import { updateHUD, toast } from './ui.js';

let vm = null, vmMuzzle = null, vmKick = 0, muzzleTimer = 0;
const grenades = [];

export function initWeapons(){ rebuildViewModel(); }
function rebuildViewModel(){
    if(vm && vm.group.parent) camera.remove(vm.group);
    vm = buildViewModel(G.weapons[G.curWeapon].id);
    camera.add(vm.group);
    vmMuzzle = vm.muzzle;
}

export function cycleWeapon(dir){
    if(G.state !== 'playing') return;
    let i = G.curWeapon;
    for(let n=0;n<G.weapons.length;n++){
        i = (i + dir + G.weapons.length) % G.weapons.length;
        if(G.ownedWeapons[i]) break;
    }
    G.curWeapon = i;
    G.weaponReloading = false;
    buildViewModel();
    updateHUD();
}

export function selectWeapon(i){
    if(G.state !== 'playing' || !G.ownedWeapons[i] || G.curWeapon === i) return;
    G.curWeapon = i;
    G.weaponReloading = false;
    buildViewModel();
    updateHUD();
}

export function tryShoot(){
    if(G.state !== 'playing' || G.weaponReloading || G.weaponTimer > 0) return;
    const w = G.weapons[G.curWeapon];
    G.weaponTimer = w.cd * G.mult.fireRate;

    const origin = camera.position.clone();
    const baseDir = new THREE.Vector3(); camera.getWorldDirection(baseDir);
    if(vmMuzzle){ vmMuzzle.material.opacity = 1; muzzleTimer = 0.05; }
    FX.spawnMuzzleLight(origin, baseDir);
    FX.spawnMuzzleSprite(origin, baseDir);
    if(G.attach.sup){ audio.noise(0.04, 0.015, 500); } else { audio.shoot(w.sfx); }

    const moving = G.keys['KeyW']||G.keys['KeyS']||G.keys['KeyA']||G.keys['KeyD'];
    const sprint = G.keys['ShiftLeft']||G.keys['ShiftRight'];
    let spread = w.spread + (G.aiming ? -0.008 : 0) + (moving ? 0.025 : 0) + (sprint ? 0.05 : 0) + G.recoil.p*0.4;
    spread = Math.max(0, spread);
    const pellets = w.pellets + G.mult.pellets;
    const pierce = 1 + G.mult.pierce;
    G.game.shots += pellets;
    let hitCount = 0;

    for(let p=0;p<pellets;p++){
        const dir = baseDir.clone();
        if(spread > 0){ dir.x += (Math.random()-0.5)*spread; dir.y += (Math.random()-0.5)*spread; dir.z += (Math.random()-0.5)*spread; dir.normalize(); }
        const ray = new THREE.Raycaster(origin, dir, 0, w.range);
        const targets = [];
        for(const z of zombieList) z.hit.forEach(m=>targets.push(m));
        for(const o of worldObstacles) targets.push(o);
        const hits = ray.intersectObjects(targets, false);
        let endPoint, pierced = 0;
        if(hits.length){
            endPoint = hits[0].point;
            for(const h of hits){
                const z = h.object.userData.zombie;
                if(z && z.alive){
                    const isHead = h.object.userData.part === 'head';
                    let dmg = w.dmg * G.mult.damage;
                    if(isHead) dmg *= G.mult.head;
                    damageZombie(z, dmg, h.point, isHead);
                    hitCount++;
                    pierced++; if(pierced >= pierce) break;
                } else {
                    const destroyed = damageObstacle(h.object, w.dmg * G.mult.damage);
                    if(destroyed) FX.spawnParticles(h.point.clone().setY(1), 0x6b4a2b, 12);
                    break;
                }
            }
        } else endPoint = origin.clone().add(dir.clone().multiplyScalar(w.range));
        FX.spawnTracer(origin, endPoint);
    }
    G.game.hits += hitCount;

    const recMul = G.attach.sup ? 0.6 : 1;
    G.recoil.p += w.recoil * (G.aiming ? 0.5 : 1) * recMul;
    G.recoil.y += (Math.random()-0.5) * w.recoil * recMul;
    vmKick = Math.min(0.5, vmKick + w.recoil*1.2);
    updateHUD();
}

export function startReload(){
    const w = G.weapons[G.curWeapon];
    if(G.weaponReloading || w.ammo >= effMag(w, G)) return;
    G.weaponReloading = true; G.weaponReloadTimer = w.reload * G.mult.reload;
    toast('RELOADING...', 'reload');
}

export function meleeAttack(){
    if(G.state !== 'playing' || G.meleeCd > 0) return;
    G.meleeCd = 0.45;
    const origin = camera.position.clone();
    const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
    for(const z of zombieList){
        const to = z.group.position.clone().setY(1.2).sub(origin);
        if(to.length() > 3.0) continue;
        if(dir.dot(to.normalize()) > 0.5) damageZombie(z, 70*G.mult.damage, z.group.position.clone().setY(1.3), false, true);
    }
    if(G.boss){ const to = G.boss.group.position.clone().setY(1.4).sub(origin); if(to.length()<4 && dir.dot(to.normalize())>0.3) damageZombie(G.boss, 70*G.mult.damage, G.boss.group.position.clone().setY(1.6), false, true); }
    G.shake = Math.max(G.shake, 0.15);
    audio.tone(180, 0.12, 'square', 0.05);
}

export function throwGrenade(){
    if(G.state !== 'playing') return;
    if(G.player.grenades <= 0){ toast('NO GRENADES', 'warn'); return; }
    if(G.mode !== 'sandbox') G.player.grenades--;
    const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
    const vel = dir.clone().multiplyScalar(22); vel.y += 6;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.35,0.35,0.35), new THREE.MeshLambertMaterial({ color:0x224400, emissive:0x113300 }));
    mesh.castShadow = true;
    const pos = camera.position.clone();
    scene.add(mesh);
    grenades.push({ mesh, pos, vel, fuse: 1.5 });
    updateHUD();
}

function explode(pos, radius, dmg){
    for(const z of [...zombieList]){
        const d = z.group.position.distanceTo(pos);
        if(d < radius) damageZombie(z, dmg*(1-d/radius), z.group.position.clone().setY(1.3), false, true);
    }
    FX.spawnParticles(pos.clone().setY(1), 0xff7722, 28, { bias: new THREE.Vector3(0, 3, 0) });
    FX.spawnSmoke(pos.clone().setY(0.8), 14);
    FX.spawnRing(pos.clone().setY(0), 0xff6622, radius*1.4);
    const light = new THREE.PointLight(0xffaa33, 5, 18); light.position.copy(pos).setY(1.5); scene.add(light);
    FX.spawnMuzzleLight(pos.clone().setY(1.5), new THREE.Vector3(0,1,0));
    G.shake = Math.max(G.shake, 0.5);
    audio.explosion();
}

export function updateWeapons(dt){
    if(G.weaponReloading){
        G.weaponReloadTimer -= dt;
        if(G.weaponReloadTimer <= 0){ G.weaponReloading = false; G.weapons[G.curWeapon].ammo = effMag(G.weapons[G.curWeapon], G); updateHUD(); }
    }
    if(G.weaponTimer > 0) G.weaponTimer -= dt;
    if(G.meleeCd > 0) G.meleeCd -= dt;

    G.recoil.p = lerp(G.recoil.p, 0, dt*9);
    G.recoil.y = lerp(G.recoil.y, 0, dt*9);

    if(vm){
        vmKick = lerp(vmKick, 0, dt*10);
        const bp = vm.group.userData.basePos, br = vm.group.userData.baseRot;
        vm.group.position.set(bp.x, bp.y + vmKick*0.5, bp.z + vmKick);
        vm.group.rotation.set(br.x - vmKick*0.6, br.y, br.z);
    }
    if(muzzleTimer > 0){ muzzleTimer -= dt; if(muzzleTimer <= 0 && vmMuzzle) vmMuzzle.material.opacity = 0; }

    for(let i=grenades.length-1;i>=0;i--){
        const g = grenades[i];
        g.vel.y -= 18*dt;
        g.pos.addScaledVector(g.vel, dt);
        g.mesh.position.copy(g.pos);
        g.mesh.rotation.x += dt*5; g.mesh.rotation.y += dt*4;
        g.fuse -= dt;
        if(g.pos.y < 0.2){ g.pos.y = 0.2; g.vel.y *= -0.4; g.vel.x *= 0.6; g.vel.z *= 0.6; }
        if(g.fuse <= 0){ explode(g.pos.clone(), 7, 120*G.mult.damage); scene.remove(g.mesh); grenades.splice(i,1); }
    }
}

function lerp(a,b,t){ return a + (b-a)*t; }
