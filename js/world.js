import { G } from './state.js';
import { skyTexture, groundTexture, crateTexture, rockTexture } from './textures.js';

export let scene, camera, renderer;
export const GROUND = 240;
let sun, ambientLight, hemiLight, dayTime = 0.38;
export const nightColor = new THREE.Color(0x0a1420);
const _dayFog = new THREE.Color(0x121a22);

export function initWorld(){
    scene = new THREE.Scene();
    scene.background = makeSky();
    scene.fog = new THREE.Fog(0x121a22, 50, 150);

    camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 600);
    camera.rotation.order = 'YXZ';
    scene.add(camera);

    renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game').appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x556070, 0.65));
    scene.add(new THREE.HemisphereLight(0x6688aa, 0x223322, 0.5));

    sun = new THREE.DirectionalLight(0xfff0dd, 0.95);
    sun.position.set(50, 90, 35);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const d = 80;
    sun.shadow.camera.left=-d; sun.shadow.camera.right=d; sun.shadow.camera.top=d; sun.shadow.camera.bottom=-d;
    sun.shadow.camera.near=1; sun.shadow.camera.far=260;
    sun.shadow.bias = -0.0004;
    scene.add(sun);

    ambientLight = scene.children.find(c => c.isAmbientLight);
    hemiLight = scene.children.find(c => c.isHemisphereLight);

    buildWorld();
    buildBeacon();
    applyGfx();
    addEventListener('resize', onResize);
}

export function applyGfx(){
    if(!renderer) return;
    const gfx = G.settings.gfx || 'medium';
    renderer.shadowMap.enabled = gfx !== 'low';
    renderer.shadowMap.needsUpdate = true;
    renderer.setPixelRatio(gfx === 'low' ? 1 : (gfx === 'medium' ? Math.min(devicePixelRatio, 1.5) : Math.min(devicePixelRatio, 2)));
    const sz = gfx === 'low' ? 512 : gfx === 'medium' ? 1024 : 2048;
    sun.shadow.mapSize.set(sz, sz);
    if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map = null; }
    scene.fog = new THREE.Fog(0x121a22, gfx === 'low' ? 40 : 50, gfx === 'low' ? 110 : 150);
}

function makeSky(){
    const t = skyTexture();
    t.magFilter = THREE.LinearFilter;
    return t;
}

export const obstacles = [];
export const beaconPos = new THREE.Vector3(0, 0, 0);
export let beaconGroup = null;

export function buildBeacon(){
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 2.4), new THREE.MeshLambertMaterial({ color:0x445566 }));
    base.position.y = 0.25; base.receiveShadow = true;
    const core = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 1.2), new THREE.MeshLambertMaterial({ color:0x66ccff, emissive:0x2266ff }));
    core.position.y = 1.3; core.castShadow = true;
    g.add(base, core);
    g.visible = false;
    scene.add(g);
    beaconGroup = g;
}

export function showBeacon(on){
    if(beaconGroup) beaconGroup.visible = on;
}

function buildWorld(){
    const tile = 4, n = GROUND/tile;
    const matA = new THREE.MeshLambertMaterial({ map: groundTexture(true) });
    const matB = new THREE.MeshLambertMaterial({ map: groundTexture(false) });
    const tGeo = new THREE.BoxGeometry(tile, 1, tile);
    for(let i=0;i<n;i++) for(let j=0;j<n;j++){
        const m = new THREE.Mesh(tGeo, (i+j)%2===0 ? matA : matB);
        m.position.set(-GROUND/2 + i*tile + tile/2, -0.5, -GROUND/2 + j*tile + tile/2);
        m.receiveShadow = true;
        scene.add(m);
    }

    const crateTex = crateTexture();
    const crateMat  = new THREE.MeshLambertMaterial({ map:crateTex });
    const crateMat2 = new THREE.MeshLambertMaterial({ map:crateTex, color:0x8899aa });
    const boxGeo = new THREE.BoxGeometry(1,1,1);
    for(let k=0;k<80;k++){
        const s = 1.2 + Math.random()*2.4, h = s*(0.8+Math.random()*1.7);
        const m = new THREE.Mesh(boxGeo, Math.random()<0.5 ? crateMat : crateMat2);
        m.scale.set(s,h,s);
        const ang = Math.random()*Math.PI*2, dist = 9 + Math.random()*(GROUND/2-14);
        m.position.set(Math.cos(ang)*dist, h/2, Math.sin(ang)*dist);
        m.rotation.y = Math.random()*Math.PI;
        m.castShadow = true; m.receiveShadow = true;
        m.userData.radius = s/2;
        scene.add(m);
        obstacles.push(m);
    }

    for(let k=0;k<14;k++){
        const px = (Math.random()-0.5)*(GROUND-30), pz = (Math.random()-0.5)*(GROUND-30);
        if(Math.hypot(px,pz) < 12) continue;
        scene.add(makeTree(px, pz));
    }
    for(let k=0;k<10;k++){
        const px = (Math.random()-0.5)*(GROUND-30), pz = (Math.random()-0.5)*(GROUND-30);
        scene.add(makeRock(px, pz));
    }
}

function makeTree(x,z){
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.BoxGeometry(0.6,2.4,0.6), new THREE.MeshLambertMaterial({color:0x5a3b22}));
    trunk.position.y = 1.2; trunk.castShadow = true;
    g.add(trunk);
    const leafMat = new THREE.MeshLambertMaterial({color:0x2f6b34});
    for(let i=0;i<3;i++){
        const s = 2.2 - i*0.5;
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(s,s,s), leafMat);
        leaf.position.y = 2.6 + i*0.9; leaf.castShadow = true;
        g.add(leaf);
    }
    g.position.set(x, 0, z);
    return g;
}

function makeRock(x,z){
    const s = 1 + Math.random()*1.6;
    const r = new THREE.Mesh(new THREE.BoxGeometry(s,s*0.7,s), new THREE.MeshLambertMaterial({ map:rockTexture() }));
    r.position.set(x, s*0.35, z);
    r.rotation.y = Math.random()*Math.PI;
    r.castShadow = true; r.receiveShadow = true;
    return r;
}

export function requestLock(){
    if(!renderer) return;
    try {
        const p = renderer.domElement.requestPointerLock();
        if(p && typeof p.catch === 'function') p.catch(() => {});
    } catch(e){}
}

export function collidePlayer(){
    const pr = G.player.radius;
    for(const o of obstacles){
        const r = (o.userData.radius || 1) + pr;
        const ox = G.player.pos.x - o.position.x, oz = G.player.pos.z - o.position.z;
        const d2 = ox*ox + oz*oz;
        if(d2 < r*r && d2 > 0.0001){
            const d = Math.sqrt(d2);
            const push = r - d;
            G.player.pos.x += ox/d * push;
            G.player.pos.z += oz/d * push;
        }
    }
}

export function damageObstacle(o, dmg){
    if(o.userData.hp === undefined) o.userData.hp = 60;
    o.userData.hp -= dmg;
    if(o.userData.hp <= 0){
        scene.remove(o);
        const i = obstacles.indexOf(o);
        if(i >= 0) obstacles.splice(i,1);
        return true;
    }
    return false;
}

export function serializeWorld(){
    return JSON.stringify(obstacles.map(o => ({
        x: +o.position.x.toFixed(2), z: +o.position.z.toFixed(2),
        s: +o.scale.x.toFixed(2), h: +o.scale.y.toFixed(2), ry: +o.rotation.y.toFixed(2),
        hp: o.userData.hp,
    })), null, 2);
}

export function loadWorld(json){
    const data = JSON.parse(json);
    if(!Array.isArray(data)) throw new Error('map must be an array of crates');
    [...obstacles].forEach(o => scene.remove(o));
    obstacles.length = 0;
    const crateMat  = new THREE.MeshLambertMaterial({ color:0x6b4a2b });
    const crateMat2 = new THREE.MeshLambertMaterial({ color:0x55707a });
    const boxGeo = new THREE.BoxGeometry(1,1,1);
    for(const d of data){
        const s = d.s || 1.2, h = d.h || 1.2;
        const m = new THREE.Mesh(boxGeo, Math.random() < 0.5 ? crateMat : crateMat2);
        m.scale.set(s, h, s);
        m.position.set(d.x, h/2, d.z);
        m.rotation.y = d.ry || 0;
        m.castShadow = true; m.receiveShadow = true;
        m.userData.radius = s/2;
        m.userData.hp = d.hp !== undefined ? d.hp : 60;
        scene.add(m);
        obstacles.push(m);
    }
}

export function onResize(){
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
}

export function updateDayNight(dt){
    dayTime += dt * 0.008;
    if(dayTime >= 1) dayTime -= 1;
    const light = Math.sin(dayTime * Math.PI * 2) * 0.5 + 0.5;
    sun.intensity = 0.12 + light * 0.85;
    ambientLight.intensity = 0.22 + light * 0.45;
    hemiLight.intensity = 0.15 + light * 0.35;
    scene.fog.color.copy(nightColor).lerp(_dayFog, light);
    sun.position.set(50, 20 + light*90, 35);
}
