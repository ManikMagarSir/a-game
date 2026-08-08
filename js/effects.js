import { G } from './state.js';
import { scene, camera } from './world.js';
import { glowTexture } from './textures.js';

const tracers = [];
const particles = [];
const rings = [];
const lights = [];
const sprites = [];
const decals = [];
const bursts = [];
const partGeo = new THREE.BoxGeometry(0.14,0.14,0.14);
const partMatCache = {};
function partMat(c){ if(!partMatCache[c]) partMatCache[c] = new THREE.MeshBasicMaterial({ color:c }); return partMatCache[c]; }
const glowTex = glowTexture();
const decalGeo = new THREE.PlaneGeometry(0.8, 0.8);
function decalMat(){ return new THREE.MeshBasicMaterial({ color:0x550e0e, transparent:true, opacity:0.55, depthWrite:false }); }
export function spawnBloodDecal(pos){
    while(decals.length >= 40){ const d = decals.shift(); scene.remove(d.mesh); }
    const m = new THREE.Mesh(decalGeo, decalMat());
    m.rotation.x = -Math.PI/2;
    m.rotation.z = Math.random()*Math.PI;
    m.position.set(pos.x, 0.02, pos.z);
    scene.add(m);
    decals.push({ mesh:m, life:2.5 });
}

export function spawnTracer(a, b){
    const geo = new THREE.BufferGeometry().setFromPoints([a,b]);
    const mat = new THREE.LineBasicMaterial({ color:0xffdd55, transparent:true, opacity:0.9 });
    const line = new THREE.Line(geo, mat); scene.add(line);
    tracers.push({ line, life:0.06 });
}
export function spawnMuzzleLight(origin, dir){
    const light = new THREE.PointLight(0xffaa33, 2.2, 9);
    light.position.copy(origin).add(dir.clone().multiplyScalar(1.2));
    scene.add(light); lights.push({ line:light, life:0.05 });
}
export function spawnMuzzleSprite(origin, dir){
    const m = new THREE.SpriteMaterial({ map:glowTex, transparent:true, opacity:0.9, blending:THREE.AdditiveBlending, depthWrite:false });
    const s = new THREE.Sprite(m);
    s.position.copy(origin).add(dir.clone().multiplyScalar(1.1));
    s.scale.set(0.55 + Math.random()*0.3, 0.55 + Math.random()*0.3, 1);
    scene.add(s);
    sprites.push({ s, life:0.05 });
}
export function spawnParticles(pos, color, count, opts={}){
    const gfx = G.settings.gfx || 'medium';
    count = Math.round(count * (gfx === 'low' ? 0.4 : gfx === 'medium' ? 0.7 : 1));
    const mat = partMat(color);
    for(let i=0;i<count;i++){
        const m = new THREE.Mesh(partGeo, mat);
        m.position.copy(pos);
        const v = (opts.bias || new THREE.Vector3()).clone()
            .add(new THREE.Vector3((Math.random()-0.5)*5, Math.random()*5+1, (Math.random()-0.5)*5));
        scene.add(m); particles.push({ m, v, life:0.5+Math.random()*0.3, rise:!!opts.rise });
    }
}
export function spawnSmoke(pos, count=10){
    const mat = partMat(0x55555e);
    for(let i=0;i<count;i++){
        const m = new THREE.Mesh(partGeo, mat);
        m.position.copy(pos);
        const v = new THREE.Vector3((Math.random()-0.5)*3, 2.5 + Math.random()*2.5, (Math.random()-0.5)*3);
        scene.add(m); particles.push({ m, v, life:0.9+Math.random()*0.5, rise:true });
    }
}
export function spawnImpactBurst(pos, color, scale = 1){
    const glow = new THREE.SpriteMaterial({ map:glowTex, color, transparent:true, opacity:0.8, blending:THREE.AdditiveBlending, depthWrite:false });
    const sprite = new THREE.Sprite(glow);
    sprite.position.copy(pos);
    sprite.scale.setScalar(0.7 * scale);
    scene.add(sprite);
    const light = new THREE.PointLight(color, 1.6 * scale, 7 * scale);
    light.position.copy(pos);
    scene.add(light);
    bursts.push({ sprite, light, life:0.22, max:0.22, scale });
}

export function spawnRing(pos, color, maxR){
    const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.1, 0.4, 24),
        new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.8, side:THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI/2;
    ring.position.copy(pos); ring.position.y = 0.2;
    scene.add(ring);
    rings.push({ mesh:ring, life:0.5, maxR });
}

export function showHitmarker(isHead){
    const h = document.getElementById('hitmarker');
    h.style.opacity = 1;
    G._hitTimer = isHead ? 0.16 : 0.09;
}
export function tickHitmarker(dt){
    if(G._hitTimer > 0){ G._hitTimer -= dt; if(G._hitTimer <= 0) document.getElementById('hitmarker').style.opacity = 0; }
}

export function spawnDamageNumber(world, text, color, cls){
    const v = world.clone().project(camera);
    if(v.z > 1) return;
    const x = (v.x*0.5+0.5)*innerWidth, y = (-v.y*0.5+0.5)*innerHeight;
    const el = document.createElement('div');
    el.className = 'dmg' + (cls ? ' ' + cls : '');
    el.textContent = text; el.style.color = color;
    el.style.left = x+'px'; el.style.top = y+'px';
    document.getElementById('dmgContainer').appendChild(el);
    requestAnimationFrame(()=>{ el.style.transform = 'translate(-50%,-50%) translateY(-44px)'; el.style.opacity = '0'; });
    setTimeout(()=>el.remove(), 820);
}

export function clearEffects(){
    [...tracers].forEach(t => scene.remove(t.line)); tracers.length = 0;
    [...lights].forEach(l => scene.remove(l.line)); lights.length = 0;
    [...sprites].forEach(s => scene.remove(s.s)); sprites.length = 0;
    [...particles].forEach(p => scene.remove(p.m)); particles.length = 0;
    [...rings].forEach(r => scene.remove(r.mesh)); rings.length = 0;
    [...decals].forEach(d => scene.remove(d.mesh)); decals.length = 0;
    [...bursts].forEach(b => { scene.remove(b.sprite); scene.remove(b.light); }); bursts.length = 0;
}

export function updateEffects(dt){
    for(let i=tracers.length-1;i>=0;i--){
        const t = tracers[i]; t.life -= dt;
        t.line.material.opacity = Math.max(0, t.life/0.06);
        if(t.life <= 0){ scene.remove(t.line); tracers.splice(i,1); }
    }
    for(let i=lights.length-1;i>=0;i--){
        const l = lights[i]; l.life -= dt;
        l.line.intensity = Math.max(0, l.life/0.05*2.2);
        if(l.life <= 0){ scene.remove(l.line); lights.splice(i,1); }
    }
    for(let i=sprites.length-1;i>=0;i--){
        const sp = sprites[i]; sp.life -= dt;
        sp.s.material.opacity = Math.max(0, sp.life/0.05);
        const sc = 0.55 * (1 + (1 - sp.life/0.05)*1.4);
        sp.s.scale.set(sc, sc, 1);
        if(sp.life <= 0){ scene.remove(sp.s); sprites.splice(i,1); }
    }
    for(let i=particles.length-1;i>=0;i--){
        const p = particles[i]; p.life -= dt;
        if(p.rise) p.v.y += 1.6*dt; else p.v.y -= 9*dt;
        p.m.position.addScaledVector(p.v, dt);
        if(!p.rise && p.m.position.y < 0.1){ p.m.position.y = 0.1; p.v.set(0,0,0); }
        p.m.scale.setScalar(Math.max(0.01, p.life*2));
        if(p.life <= 0){ scene.remove(p.m); particles.splice(i,1); }
    }
    for(let i=rings.length-1;i>=0;i--){
        const r = rings[i]; r.life -= dt;
        const s = (1 - r.life/0.5) * r.maxR;
        r.mesh.scale.set(s, s, s);
        r.mesh.material.opacity = Math.max(0, r.life/0.5*0.8);
        if(r.life <= 0){ scene.remove(r.mesh); rings.splice(i,1); }
    }
    for(let i=bursts.length-1;i>=0;i--){
        const b = bursts[i]; b.life -= dt;
        const p = Math.max(0, b.life / b.max);
        b.sprite.material.opacity = p * 0.8;
        b.sprite.scale.setScalar(b.scale * (0.7 + (1 - p) * 1.2));
        b.light.intensity = p * 1.6 * b.scale;
        if(b.life <= 0){ scene.remove(b.sprite); scene.remove(b.light); bursts.splice(i, 1); }
    }
    for(let i=decals.length-1;i>=0;i--){
        const d = decals[i]; d.life -= dt;
        d.mesh.material.opacity = Math.min(0.55, d.life/2.5*0.55);
        if(d.life <= 0){ scene.remove(d.mesh); decals.splice(i,1); }
    }
}
