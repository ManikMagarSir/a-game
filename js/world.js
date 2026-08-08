import { G } from './state.js';
import { ARENAS } from './config.js';
import { skyTexture, groundTexture, crateTexture, rockTexture, asphaltTexture, plasterTexture, roofTexture, concreteTexture, windowTexture, metalTexture } from './textures.js';

export let scene, camera, renderer;
export const GROUND = 112;
let sun;
let currentArena = null;
const arenaObjects = [];

export const obstacles = [];
export const beaconPos = new THREE.Vector3(0, 0, 0);
export let beaconGroup = null;
export let evacGroup = null;

export function initWorld(){
    scene = new THREE.Scene();
    scene.background = makeSky();
    scene.fog = new THREE.Fog(0xb9d6d2, 52, 150);

    camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 420);
    camera.rotation.order = 'YXZ';
    scene.add(camera);

    const mobile = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    renderer = new THREE.WebGLRenderer({ antialias: !mobile, powerPreference: 'high-performance' });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('game').appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xfff4dd, 1.05));
    scene.add(new THREE.HemisphereLight(0xbfe8ff, 0x668052, 0.82));
    sun = new THREE.DirectionalLight(0xfff1c7, 1.7);
    sun.position.set(-32, 90, 26);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -70; sun.shadow.camera.right = 70;
    sun.shadow.camera.top = 70; sun.shadow.camera.bottom = -70;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 220;
    sun.shadow.bias = -0.0004;
    scene.add(sun);

    buildWorld();
    buildBeacon();
    buildEvac();
    applyGfx();
    addEventListener('resize', onResize);
}

export function applyGfx(){
    if(!renderer) return;
    const gfx = G.settings.gfx || 'medium';
    const mobile = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    renderer.shadowMap.enabled = gfx !== 'low' && !mobile;
    renderer.shadowMap.needsUpdate = true;
    renderer.setPixelRatio(gfx === 'low' ? 1 : Math.min(devicePixelRatio, mobile ? 1.25 : (gfx === 'medium' ? 1.5 : 2)));
    const size = mobile ? 512 : (gfx === 'low' ? 512 : gfx === 'medium' ? 1024 : 2048);
    sun.shadow.mapSize.set(size, size);
    if(sun.shadow.map){ sun.shadow.map.dispose(); sun.shadow.map = null; }
    const a = currentArena || ARENAS[0];
    scene.fog = new THREE.Fog(a.fogColor, gfx === 'low' ? 46 : 58, gfx === 'low' ? 118 : 160);
}

function makeSky(){
    const t = skyTexture();
    t.magFilter = THREE.LinearFilter;
    return t;
}
function track(obj){ arenaObjects.push(obj); scene.add(obj); return obj; }
function mat(color, map){ return new THREE.MeshLambertMaterial({ color, ...(map ? { map } : {}) }); }
function detailMat(color, texture){ return new THREE.MeshLambertMaterial({ color, map:texture }); }
function setShadow(obj){ obj.traverse(o => { if(o.isMesh){ o.castShadow = true; o.receiveShadow = true; } }); return obj; }
function addObstacle(mesh, radius, hp = 100, bounds = null){
    mesh.userData.radius = radius;
    if(bounds) Object.assign(mesh.userData, bounds);
    mesh.userData.hp = hp;
    obstacles.push(mesh);
    return mesh;
}

function addWall(x, z, sx, sz, h, material, hp = 180){
    const wall = new THREE.Mesh(new THREE.BoxGeometry(sx, h, sz), material);
    wall.position.set(x, h / 2, z);
    wall.castShadow = true; wall.receiveShadow = true;
    track(wall);
    addObstacle(wall, Math.max(sx, sz) * 0.48, hp, { halfX: sx / 2, halfZ: sz / 2 });
    return wall;
}

function addStation(p){
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(p.w || 24, 0.5, p.d || 9), detailMat(0x263746, concreteTexture()));
    base.position.y = 0.25;
    const roof = new THREE.Mesh(new THREE.BoxGeometry((p.w || 24) + 1, 0.35, (p.d || 9) + 1), detailMat(0x101820, metalTexture()));
    roof.position.y = (p.h || 5) + 0.18;
    const hall = new THREE.Mesh(new THREE.BoxGeometry(p.w || 24, p.h || 5, p.d || 9), detailMat(0x263746, plasterTexture('#263746','#ef4444')));
    hall.position.y = (p.h || 5) / 2;
    g.add(base, hall, roof);
    for(let x = -(p.w || 24) * .34; x <= (p.w || 24) * .34; x += 4){
        const window = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, .08), detailMat(0xffffff, windowTexture('#e2e8f0')));
        window.position.set(x, (p.h || 5) * .62, (p.d || 9) / 2 + .06); g.add(window);
    }
    g.position.set(p.x, 0, p.z); g.rotation.y = p.r || 0; setShadow(g); track(g); addObstacle(g, Math.max(p.w || 24, p.d || 9) * .42, 220);
}

function addRailcar(p){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.4, 13), detailMat(0x33434d, metalTexture())); body.position.y = 1.7;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(4.1, .22, 13.3), detailMat(0x111820, roofTexture('#111820'))); roof.position.y = 2.95;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.86, .22, 12.2), new THREE.MeshBasicMaterial({ color:0xef4444 })); stripe.position.set(0, 2.05, 0);
    const wheelGeo = new THREE.CylinderGeometry(.48, .48, .22, 10); wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshLambertMaterial({ color:0x11151a, map:metalTexture() });
    const wheels = [-4.3, -1.5, 1.5, 4.3].map(z => { const w = new THREE.Mesh(wheelGeo, wheelMat); w.position.set(0, .55, z); return w; });
    g.add(body, roof, stripe, ...wheels); g.position.set(p.x, 0, p.z); g.rotation.y = p.r || 0; setShadow(g); track(g); addObstacle(g, 4.2, 180);
}

function addContainer(p){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.8, 8.5), detailMat(p.color || 0x8f2637, metalTexture()));
    body.position.y = 1.4;
    const ribs = [];
    for(let z = -3.7; z <= 3.7; z += 1.2){
        const rib = new THREE.Mesh(new THREE.BoxGeometry(3.28, 2.9, .08), new THREE.MeshBasicMaterial({ color:0x101820 })); rib.position.set(0, 1.4, z); ribs.push(rib);
    }
    g.add(body, ...ribs); g.position.set(p.x, 0, p.z); g.rotation.y = p.r || 0; setShadow(g); track(g); addObstacle(g, 4.5, 140);
}

function addFence(p){
    const length = p.w || 20, g = new THREE.Group();
    const railMat = detailMat(0x334155, metalTexture());
    for(let x = -length / 2; x <= length / 2; x += 4){
        const post = new THREE.Mesh(new THREE.BoxGeometry(.14, 2.2, .14), railMat); post.position.set(x, 1.1, 0); g.add(post);
    }
    for(const y of [.75, 1.55]){ const rail = new THREE.Mesh(new THREE.BoxGeometry(length, .12, .12), railMat); rail.position.y = y; g.add(rail); }
    g.position.set(p.x, 0, p.z); g.rotation.y = p.r || 0; setShadow(g); track(g); addObstacle(g, length * .5, 90, { halfX: length / 2, halfZ: .2 });
}

function addGenerator(p){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 2), detailMat(0x374151, metalTexture())); body.position.y = .9;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.1, .7, .05), new THREE.MeshBasicMaterial({ color:0xef4444 })); panel.position.set(0, 1.2, 1.03);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 1.4, 8), detailMat(0x111820, metalTexture())); pipe.position.set(.8, 2.1, -.4);
    const lamp = new THREE.PointLight(0xef4444, .9, 7, 2); lamp.position.set(0, 2.1, 1.1);
    g.add(body, panel, pipe); g.position.set(p.x, 0, p.z); g.rotation.y = p.r || 0; setShadow(g); track(g); lamp.position.add(g.position); track(lamp); addObstacle(g, 1.6, 100);
}

function addBarrier(p){
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.8, .8, .8), detailMat(0x69717d, concreteTexture())); base.position.y = .4;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.2, .12, .84), new THREE.MeshBasicMaterial({ color:0xef4444 })); stripe.position.set(0, .62, 0);
    g.add(base, stripe); g.position.set(p.x, 0, p.z); g.rotation.y = p.r || 0; setShadow(g); track(g); addObstacle(g, 2.2, 80);
}

function addTank(p){
    const g = new THREE.Group();
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 3.3, 12), detailMat(0x52616b, metalTexture())); tank.position.y = 2.1; tank.rotation.z = Math.PI / 2;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .2, 10), new THREE.MeshBasicMaterial({ color:0xef4444 })); cap.position.set(0, 3.8, 0);
    const legGeo = new THREE.BoxGeometry(.25, 1.2, .25); const legMat = new THREE.MeshLambertMaterial({ color:0x1f2937 });
    [[-1.5,-1.4],[1.5,-1.4],[-1.5,1.4],[1.5,1.4]].forEach(([x,z]) => { const leg = new THREE.Mesh(legGeo, legMat); leg.position.set(x, .6, z); g.add(leg); });
    g.add(tank, cap); g.position.set(p.x, 0, p.z); setShadow(g); track(g); addObstacle(g, 2.8, 180);
}

function addTower(p){
    const g = new THREE.Group(), steel = detailMat(0x334155, metalTexture());
    const postGeo = new THREE.BoxGeometry(.18, 9, .18);
    [[-1.8,-1.8],[1.8,-1.8],[-1.8,1.8],[1.8,1.8]].forEach(([x,z]) => { const post = new THREE.Mesh(postGeo, steel); post.position.set(x, 4.5, z); g.add(post); });
    for(const y of [1.5, 4, 6.5, 9]){ const beam = new THREE.Mesh(new THREE.BoxGeometry(4.2, .14, .14), steel); beam.position.y = y; g.add(beam); const cross = beam.clone(); cross.rotation.y = Math.PI / 2; g.add(cross); }
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(.34, 8, 8), new THREE.MeshBasicMaterial({ color:0xef4444 })); beacon.position.y = 9.35; g.add(beacon);
    const light = new THREE.PointLight(0xef4444, 1.1, 18, 2); light.position.set(p.x, 8.5, p.z);
    g.position.set(p.x, 0, p.z); setShadow(g); track(g); track(light); addObstacle(g, 2.6, 160);
}

function addCivic(p){
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(16, .45, 12), detailMat(0xd2c5a7, concreteTexture())); base.position.y = .22;
    const hall = new THREE.Mesh(new THREE.BoxGeometry(14, 4.8, 10), detailMat(0xd9c7a5, plasterTexture('#d9c7a5','#9b7651'))); hall.position.y = 2.4;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(10.4, 3.4, 4), detailMat(0x8f3f35, roofTexture('#8f3f35'))); roof.rotation.y = Math.PI / 4; roof.position.y = 6.5;
    const steps = new THREE.Mesh(new THREE.BoxGeometry(5, .35, 2.2), detailMat(0xb8aa8f, concreteTexture())); steps.position.set(0, .4, 6);
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3, .12), new THREE.MeshLambertMaterial({ color:0x4a3128 })); door.position.set(0, 1.7, 5.05);
    g.add(base, hall, roof, steps, door);
    for(let x of [-4.5,4.5]){ const win = new THREE.Mesh(new THREE.BoxGeometry(1.7,1.5,.08), detailMat(0xffffff, windowTexture('#f4d58b'))); win.position.set(x,2.8,5.06); g.add(win); }
    g.position.set(p.x,p.y || 0,p.z); setShadow(g); track(g); addObstacle(g, 7.4, 240, { halfX:7.2, halfZ:5.2 });
}

function addChurch(p){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 18), detailMat(0xe1d6bd, plasterTexture('#e1d6bd','#b79b70'))); body.position.y = 2.5;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(8.8, 4, 4), detailMat(0x6f3c35, roofTexture('#6f3c35'))); roof.rotation.y = Math.PI / 4; roof.position.y = 7;
    const steeple = new THREE.Mesh(new THREE.ConeGeometry(1.5, 7, 6), detailMat(0x6f3c35, roofTexture('#6f3c35'))); steeple.position.set(0,10.5,0);
    const cross = new THREE.Mesh(new THREE.BoxGeometry(.25,2.1,.25), new THREE.MeshBasicMaterial({ color:0xd6ae55 })); cross.position.set(0,14.8,0); const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1,.25,.25), cross.material); arm.position.set(0,15.1,0);
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.4,3.4,.12), new THREE.MeshLambertMaterial({ color:0x49342b })); door.position.set(0,1.8,9.05);
    g.add(body,roof,steeple,cross,arm,door); g.position.set(p.x,0,p.z); setShadow(g); track(g); addObstacle(g, 7, 220, { halfX:6.2, halfZ:9.2 });
}

function addSchool(p){
    const g = new THREE.Group();
    const w = p.w || 25, d = p.d || 9, h = p.h || 4;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), detailMat(0xd8c9a8, plasterTexture('#d8c9a8','#9f8060'))); body.position.y=h/2;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w+1,.3,d+1), detailMat(0x6f5547,roofTexture('#6f5547'))); roof.position.y=h+.16;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(w+.05,.35,.08), new THREE.MeshBasicMaterial({color:0x4f7f55})); stripe.position.set(0,h*.66,d/2+.05);
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.6,2.4,.08), new THREE.MeshLambertMaterial({color:0x4b5d62})); door.position.set(0,1.25,d/2+.06);
    g.add(body,roof,stripe,door);
    for(let x=-w*.34;x<=w*.34;x+=3.4){const win=new THREE.Mesh(new THREE.BoxGeometry(1.5,1,.08),detailMat(0xffffff,windowTexture('#f2d487')));win.position.set(x,2.35,d/2+.06);g.add(win);}
    g.position.set(p.x,0,p.z);setShadow(g);track(g);addObstacle(g,w*.5,180,{halfX:w/2,halfZ:d/2});
}

function addMill(p){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(3.4,4,5.5,10), detailMat(0x9b6f4b,plasterTexture('#9b6f4b','#6f4b38'))); body.position.y=2.75;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.2,2.2,10), detailMat(0x6e4438,roofTexture('#6e4438'))); roof.position.y=6.6;
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(3.2,.18,8,18), new THREE.MeshBasicMaterial({color:0x6f8790})); wheel.rotation.y=Math.PI/2; wheel.position.set(0,2.8,3.1);
    const axle = new THREE.Mesh(new THREE.BoxGeometry(.2,.2,6.5), new THREE.MeshLambertMaterial({color:0x4b5563})); axle.rotation.x=Math.PI/2; axle.position.set(0,2.8,0);
    g.add(body,roof,wheel,axle);g.position.set(p.x,0,p.z);setShadow(g);track(g);addObstacle(g,4.2,180);
}

function addDiner(p){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(16,4.2,8), detailMat(0xf1d8b0, plasterTexture('#f1d8b0','#c36b4a'))); body.position.y=2.1;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(17,.3,9), detailMat(0x6f8790, metalTexture())); roof.position.y=4.35;
    const awning = new THREE.Mesh(new THREE.BoxGeometry(14,.22,1.6), new THREE.MeshBasicMaterial({ color:0xd94c42 })); awning.position.set(0,3.2,4.3); awning.rotation.x=-.08;
    const sign = new THREE.Mesh(new THREE.BoxGeometry(5,.7,.15), new THREE.MeshBasicMaterial({ color:0xffc857 })); sign.position.set(0,4.8,4.2);
    g.add(body,roof,awning,sign); for(let x=-5;x<=5;x+=2.5){ const w=new THREE.Mesh(new THREE.BoxGeometry(1.5,1.2,.08),detailMat(0xffffff,windowTexture('#f5c76b'))); w.position.set(x,2.3,4.05); g.add(w); }
    g.position.set(p.x,0,p.z); setShadow(g); track(g); addObstacle(g,8.2,200,{halfX:8,halfZ:4.2});
}

function addWaterTower(p){
    const g = new THREE.Group(), steel = detailMat(0x6b7280, metalTexture());
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(3.2,3.2,3.5,12), detailMat(0xd1a45c, metalTexture())); tank.position.y=9; tank.rotation.z=Math.PI/2;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(3.4,1.4,12), detailMat(0x8c4b38,roofTexture('#8c4b38'))); cap.position.y=11.5;
    for(const x of [-2,2]) for(const z of [-2,2]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.22,7,.22),steel);leg.position.set(x,3.5,z);g.add(leg);}
    g.add(tank,cap); g.position.set(p.x,0,p.z); setShadow(g); track(g); addObstacle(g,3.5,180);
}

function addFountain(p){
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.5,3.5,.5,16), detailMat(0xc9bca4,concreteTexture()));
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(2.4,1.6,.5,16), detailMat(0x8da1a2,concreteTexture())); bowl.position.y=.65;
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(.2,.35,1.8,8), new THREE.MeshBasicMaterial({color:0x78cbe8})); jet.position.y=1.6;
    g.add(base,bowl,jet);g.position.set(p.x,0,p.z);track(g);addObstacle(g,3.6,100);
}

function addBuilding(b){
    const wall = detailMat(b.c, plasterTexture('#' + b.c.toString(16).padStart(6,'0'), '#b78d70'));
    const roof = detailMat(b.roof, roofTexture('#' + b.roof.toString(16).padStart(6,'0')));
    const x = b.x, z = b.z, w = b.w, d = b.d, h = b.h;
    const t = 0.7;
    addWall(x - w / 2, z, t, d, h, wall);
    addWall(x + w / 2, z, t, d, h, wall);
    addWall(x, z - d / 2, w, t, h, wall);
    const doorGap = b.door === 'side' ? 0 : 3.2;
    if(doorGap){
        addWall(x - w / 2 + (w - doorGap) / 4, z + d / 2, (w - doorGap) / 2, t, h, wall);
        addWall(x + w / 2 - (w - doorGap) / 4, z + d / 2, (w - doorGap) / 2, t, h, wall);
    } else {
        addWall(x, z + d / 2, w, t, h, wall);
    }
    const top = new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 0.28, d + 0.8), roof);
    top.position.set(x, h + 0.14, z);
    top.castShadow = true; top.receiveShadow = true;
    track(top);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(Math.min(5, w * 0.48), 0.45, 0.08), new THREE.MeshBasicMaterial({ color:b.sign || 0xd7a05c }));
    sign.position.set(x, Math.min(h - 0.55, h * 0.72), z + d / 2 + 0.42);
    track(sign);
    for(let i = 0; i < Math.max(2, Math.floor(w / 6)); i++){
        const win = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.8, 0.06), detailMat(0xffffff, windowTexture(b.window || '#d7a05c')));
        win.position.set(x - w * 0.32 + i * 2.7, h * 0.58, z + d / 2 + 0.4);
        track(win);
    }
    if(b.awning){
        const awning = new THREE.Mesh(new THREE.BoxGeometry(Math.min(w - 2, 9), 0.16, 1.2), mat(b.awning, crateTexture()));
        awning.position.set(x, h * 0.58, z + d / 2 + 0.8); awning.rotation.x = -0.08; track(awning);
    }
    if(b.chimney){
        const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.8, 0.9), detailMat(0x594a46, concreteTexture()));
        chimney.position.set(x + w * .25, h + .8, z - d * .18); track(chimney);
    }
}

function addRoads(a){
    const asphalt = detailMat(0x4b5253, asphaltTexture());
    const line = new THREE.MeshBasicMaterial({ color:0xf4e2a1 });
    for(const r of a.roads){
        const road = new THREE.Mesh(new THREE.PlaneGeometry(r.w, r.d), asphalt);
        road.rotation.x = -Math.PI / 2; road.position.set(r.x, 0.015, r.z); track(road);
        const horizontal = r.w > r.d, length = horizontal ? r.w : r.d;
        for(let i = -length / 2 + 5; i < length / 2 - 2; i += 8){
            const stripe = new THREE.Mesh(new THREE.PlaneGeometry(horizontal ? 3.2 : .14, horizontal ? .14 : 3.2), line);
            stripe.rotation.x = -Math.PI / 2;
            stripe.position.set(r.x + (horizontal ? i : 0), .025, r.z + (horizontal ? 0 : i)); track(stripe);
        }
    }
}

function addCar(p){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 4.3), mat(0x5d6870, crateTexture()));
    body.position.y = 0.55;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.55, 1.8), new THREE.MeshLambertMaterial({ color:0x25333b, transparent:true, opacity:0.9 }));
    cabin.position.set(0, 1.05, -0.15);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.08), new THREE.MeshBasicMaterial({ color:0xffd58a }));
    lamp.position.set(0, 0.6, 2.17);
    g.add(body, cabin, lamp);
    g.position.set(p.x, 0, p.z); g.rotation.y = p.r || 0;
    g.traverse(o => { if(o.isMesh){ o.castShadow = true; o.receiveShadow = true; } });
    track(g);
    addObstacle(g, 2.2, 120);
}

function addTree(p){
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.24,.38,2.7,7), detailMat(0x5b4030, crateTexture())); trunk.position.y = 1.35;
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5,1), new THREE.MeshLambertMaterial({ color:p.color || 0x344f36, flatShading:true })); crown.position.y = 3.2; crown.scale.y = 1.25;
    g.add(trunk, crown); g.position.set(p.x,0,p.z); g.rotation.y = p.r || 0; setShadow(g); track(g);
}

function addDumpster(p){
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.2,1.15,1.25), detailMat(0x354247, metalTexture())); body.position.y = .62;
    const lid = new THREE.Mesh(new THREE.BoxGeometry(2.3,.12,1.32), detailMat(0x202d31, metalTexture())); lid.position.y = 1.25;
    g.add(body,lid); g.position.set(p.x,0,p.z); g.rotation.y = p.r || 0; setShadow(g); track(g); addObstacle(g,1.25,100);
}

function addBench(p){
    const g = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.6,.18,.55), detailMat(0x634533, crateTexture())); seat.position.y = 1;
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.6,.75,.14), detailMat(0x634533, crateTexture())); back.position.set(0,1.35,-.23);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(.14,1,.14), mat(0x262b2d));
    g.add(seat,back,leg.clone(),leg.clone()); g.children[2].position.set(-.9,.5,0); g.children[3].position.set(.9,.5,0);
    g.position.set(p.x,0,p.z); g.rotation.y = p.r || 0; setShadow(g); track(g); addObstacle(g,1.4,70);
}

function addLamp(p, color){
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.8, 0.12), mat(0x252b2e)); pole.position.y = 1.9;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.16, 0.45), new THREE.MeshBasicMaterial({ color })); head.position.y = 3.75;
    g.add(pole, head); g.position.set(p.x, 0, p.z); track(g);
    const light = new THREE.PointLight(color, 0.85, 12, 2); light.position.set(p.x, 3.4, p.z); track(light);
}

function addGround(a){
    const tile = 4, n = GROUND / tile;
    const ma = detailMat(a.groundA, groundTexture(true)), mb = detailMat(a.groundB, groundTexture(false));
    const geo = new THREE.BoxGeometry(tile, 0.5, tile);
    for(let i = 0; i < n; i++) for(let j = 0; j < n; j++){
        const m = new THREE.Mesh(geo, (i + j) % 2 ? mb : ma);
        m.position.set(-GROUND / 2 + i * tile + tile / 2, -0.25, -GROUND / 2 + j * tile + tile / 2);
        m.receiveShadow = true; track(m);
    }
    if(a.water){
        const water = new THREE.Mesh(new THREE.PlaneGeometry(a.water.w, a.water.d), new THREE.MeshPhongMaterial({ color:0x082f49, emissive:0x03131f, emissiveIntensity:.7, transparent:true, opacity:.86, shininess:90 }));
        water.rotation.x = -Math.PI / 2; water.position.set(a.water.x, .04, a.water.z); track(water);
        for(let x = -a.water.w / 2 + 4; x < a.water.w / 2; x += 8){
            const glint = new THREE.Mesh(new THREE.PlaneGeometry(2.5, .08), new THREE.MeshBasicMaterial({ color:0x38bdf8, transparent:true, opacity:.45 }));
            glint.rotation.x = -Math.PI / 2; glint.position.set(a.water.x + x, .06, a.water.z + Math.sin(x) * .8); track(glint);
        }
    }
}

function buildWorld(){ setArena('downtown'); }

export function setArena(id, force = false){
    const next = ARENAS.find(a => a.id === id) || ARENAS[0];
    if(currentArena && currentArena.id === next.id && !force) return currentArena;
    for(const obj of arenaObjects) scene.remove(obj);
    arenaObjects.length = 0; obstacles.length = 0; currentArena = next;
    addGround(next); addRoads(next);
    const stone = detailMat(0x62605b, concreteTexture());
    next.buildings.forEach(b => addBuilding(b));
    next.props.forEach(p => {
        if(p.kind === 'car') addCar(p);
        else if(p.kind === 'lamp') addLamp(p, next.neon);
        else if(p.kind === 'tree') addTree(p);
        else if(p.kind === 'dumpster') addDumpster(p);
        else if(p.kind === 'bench') addBench(p);
        else if(p.kind === 'station') addStation(p);
        else if(p.kind === 'railcar') addRailcar(p);
        else if(p.kind === 'container') addContainer(p);
        else if(p.kind === 'fence') addFence(p);
        else if(p.kind === 'generator') addGenerator(p);
        else if(p.kind === 'barrier') addBarrier(p);
        else if(p.kind === 'tank') addTank(p);
        else if(p.kind === 'tower') addTower(p);
        else if(p.kind === 'civic') addCivic(p);
        else if(p.kind === 'church') addChurch(p);
        else if(p.kind === 'diner') addDiner(p);
        else if(p.kind === 'watertower') addWaterTower(p);
        else if(p.kind === 'fountain') addFountain(p);
        else if(p.kind === 'school') addSchool(p);
        else if(p.kind === 'mill') addMill(p);
    });
    beaconPos.set(next.beacon.x, 0, next.beacon.z);
    if(beaconGroup) beaconGroup.position.copy(beaconPos);
    if(evacGroup) evacGroup.position.set(next.evac.x, 0, next.evac.z);
    if(evacGroup) evacGroup.visible = false;
    scene.background = makeSky();
    applyGfx();
    return currentArena;
}

export function setArenaForWave(wave, force = false){
    const id = G.mode === 'extraction'
        ? (wave <= 2 ? 'downtown' : wave <= 4 ? 'residential' : 'outskirts')
        : (wave % 3 === 1 ? 'downtown' : wave % 3 === 2 ? 'residential' : 'outskirts');
    return setArena(id, force);
}
export function getArena(){ return currentArena || ARENAS[0]; }
export function getArenaName(){ return getArena().name; }
export function getEvacPoint(){ return getArena().evac; }

export function getSpawnPoint(){
    const a = getArena();
    for(let attempt = 0; attempt < 24; attempt++){
        const angle = Math.random() * Math.PI * 2, distance = a.spawnRadius + Math.random() * 6;
        const x = Math.cos(angle) * distance, z = Math.sin(angle) * distance;
        const clear = obstacles.every(o => {
            if(!o.parent) return true;
            const dx = Math.abs(x - o.position.x), dz = Math.abs(z - o.position.z);
            if(o.userData.halfX !== undefined && o.userData.halfZ !== undefined) return dx > o.userData.halfX + 1.6 || dz > o.userData.halfZ + 1.6;
            return dx * dx + dz * dz > ((o.userData.radius || 1) + 1.6) ** 2;
        });
        if(clear) return { x, z };
    }
    return { x: a.spawnRadius, z: 0 };
}

export function buildBeacon(){
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.5, 2.8), mat(0x46535b)); base.position.y = 0.25;
    const coreMat = new THREE.MeshLambertMaterial({ color:0x66ccff, emissive:0x2266ff, emissiveIntensity:1.2 });
    const core = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 1.2), coreMat); core.position.y = 1.3;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.06, 6, 20), new THREE.MeshBasicMaterial({ color:0x66ccff })); ring.rotation.x = Math.PI / 2; ring.position.y = 1.05;
    g.add(base, core, ring); g.visible = false; scene.add(g); beaconGroup = g; g.position.copy(beaconPos);
}
export function showBeacon(on){ if(beaconGroup) beaconGroup.visible = on; }
export function buildEvac(){
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.4, 0.12), mat(0x252b2e)); pole.position.y = 1.7;
    const flare = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.1, 0.48), new THREE.MeshBasicMaterial({ color:0xff6644 })); flare.position.y = 3.35;
    const halo = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.07, 6, 24), new THREE.MeshBasicMaterial({ color:0xff8b55, transparent:true, opacity:0.9 })); halo.rotation.x = Math.PI / 2; halo.position.y = 0.08;
    g.add(pole, flare, halo); g.visible = false; scene.add(g); evacGroup = g;
}
export function showEvac(on){ if(evacGroup) evacGroup.visible = on; }
export function requestLock(){
    if(!renderer || matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) return;
    try { const p = renderer.domElement.requestPointerLock(); if(p && p.catch) p.catch(() => {}); } catch(e){}
}
export function collidePlayer(){
    const pr = G.player.radius;
    for(const o of obstacles){
        if(!o.parent) continue;
        const dx = G.player.pos.x - o.position.x, dz = G.player.pos.z - o.position.z;
        if(o.userData.halfX !== undefined && o.userData.halfZ !== undefined){
            const px = o.userData.halfX + pr - Math.abs(dx), pz = o.userData.halfZ + pr - Math.abs(dz);
            if(px > 0 && pz > 0){
                if(px < pz) G.player.pos.x += dx < 0 ? -px : px;
                else G.player.pos.z += dz < 0 ? -pz : pz;
            }
        } else {
            const r = (o.userData.radius || 1) + pr, d2 = dx * dx + dz * dz;
            if(d2 < r * r && d2 > 0.0001){ const d = Math.sqrt(d2), push = r - d; G.player.pos.x += dx / d * push; G.player.pos.z += dz / d * push; }
        }
    }
}
export function damageObstacle(o, dmg){
    if(o.userData.hp === undefined) o.userData.hp = 60;
    o.userData.hp -= dmg;
    if(o.userData.hp <= 0){ scene.remove(o); const i = obstacles.indexOf(o); if(i >= 0) obstacles.splice(i, 1); return true; }
    return false;
}
export function onResize(){ camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); }
