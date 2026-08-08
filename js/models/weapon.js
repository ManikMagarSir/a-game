import { boxMat, metalTex } from './parts.js';
import { glowTexture } from '../textures.js';

const glow = glowTexture();

const mBody = new THREE.MeshLambertMaterial({ color: 0x33363c, map: metalTex });
const mDark = new THREE.MeshLambertMaterial({ color: 0x1c1f24, map: metalTex });
const mGrip = new THREE.MeshLambertMaterial({ color: 0x4a3420, map: metalTex });
const mWood = new THREE.MeshLambertMaterial({ color: 0x6b4a2b, map: metalTex });
const mAccent = new THREE.MeshLambertMaterial({ color: 0x7fd8ff, map: metalTex });
const mOlive = new THREE.MeshLambertMaterial({ color: 0x5a6b3a, map: metalTex });
const mRed = new THREE.MeshLambertMaterial({ color: 0x8a2a2a, map: metalTex });
const mBright = new THREE.MeshLambertMaterial({ color: 0xcfcfcf, map: metalTex });

function part(sx, sy, sz, mat, x, y, z, rx = 0, rz = 0){
    const m = boxMat({ x: sx, y: sy, z: sz }, mat);
    m.position.set(x, y, z);
    if(rx) m.rotation.x = rx;
    if(rz) m.rotation.z = rz;
    return m;
}

function addMuzzle(g, x, y, z){
    const muzzle = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55),
        new THREE.MeshBasicMaterial({ map: glow, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xffffff }));
    muzzle.position.set(x, y, z);
    g.add(muzzle);
    g.userData.muzzle = muzzle;
    return g;
}

function pistol(){
    const g = new THREE.Group();
    g.add(
        part(0.13, 0.08, 0.24, mDark, 0, 0, -0.1),
        part(0.11, 0.06, 0.26, mBody, 0, 0.07, -0.12),
        part(0.05, 0.05, 0.16, mDark, 0, 0.07, -0.32),
        part(0.1, 0.2, 0.11, mGrip, 0, -0.16, 0.03, 0.35),
        part(0.08, 0.13, 0.07, mAccent, 0, -0.1, -0.2, -0.1),
        part(0.04, 0.04, 0.04, mAccent, 0, 0.13, -0.14),
    );
    return addMuzzle(g, 0, 0.07, -0.42);
}

function smg(){
    const g = new THREE.Group();
    g.add(
        part(0.16, 0.12, 0.46, mBody, 0, 0, -0.24),
        part(0.08, 0.08, 0.26, mDark, 0, 0.02, -0.6),
        part(0.09, 0.03, 0.2, mAccent, 0, 0.07, -0.62),
        part(0.09, 0.26, 0.1, mOlive, 0, -0.2, -0.16, -0.12),
        part(0.09, 0.16, 0.08, mGrip, 0, -0.19, 0, 0.3),
        part(0.11, 0.08, 0.16, mDark, 0, -0.08, -0.52),
        part(0.12, 0.16, 0.18, mDark, 0, -0.01, 0.24, -0.12),
        part(0.03, 0.06, 0.04, mAccent, 0, 0.1, -0.32),
    );
    return addMuzzle(g, 0, 0.04, -0.74);
}

function shotgun(){
    const g = new THREE.Group();
    g.add(
        part(0.16, 0.13, 0.28, mBody, 0, 0, -0.12),
        part(0.1, 0.1, 0.6, mDark, 0, 0.03, -0.55),
        part(0.13, 0.08, 0.26, mGrip, 0, -0.03, -0.5),
        part(0.12, 0.28, 0.13, mGrip, 0, -0.15, 0.02, 0.3),
        part(0.15, 0.1, 0.3, mWood, 0, 0.02, 0.24),
        part(0.03, 0.05, 0.03, mAccent, 0, 0.14, -0.34),
    );
    return addMuzzle(g, 0, 0.06, -0.86);
}

function rifle(){
    const g = new THREE.Group();
    g.add(
        part(0.17, 0.14, 0.4, mBody, 0, 0, -0.18),
        part(0.06, 0.06, 0.36, mDark, 0, 0.03, -0.56),
        part(0.11, 0.1, 0.26, mOlive, 0, 0.01, -0.46),
        part(0.1, 0.24, 0.1, mDark, 0, -0.18, -0.12, -0.15),
        part(0.1, 0.16, 0.09, mGrip, 0, -0.17, 0.01, 0.32),
        part(0.13, 0.11, 0.24, mOlive, 0, -0.01, 0.22),
        part(0.05, 0.03, 0.16, mDark, 0, 0.09, -0.26),
        part(0.04, 0.05, 0.05, mAccent, 0, 0.14, -0.12),
        part(0.03, 0.06, 0.04, mAccent, 0, 0.12, -0.42),
    );
    return addMuzzle(g, 0, 0.05, -0.74);
}

function lmg(){
    const g = new THREE.Group();
    g.add(
        part(0.19, 0.16, 0.48, mBody, 0, 0, -0.24),
        part(0.09, 0.09, 0.5, mDark, 0, 0.04, -0.62),
        part(0.13, 0.1, 0.34, mOlive, 0, 0.05, -0.6),
        part(0.2, 0.16, 0.12, mOlive, 0, -0.18, -0.2, -0.1),
        part(0.12, 0.18, 0.09, mGrip, 0, -0.2, 0, 0.32),
        part(0.15, 0.12, 0.28, mOlive, 0, -0.02, 0.22),
        part(0.05, 0.14, 0.03, mAccent, 0, 0.02, 0.16),
        part(0.04, 0.05, 0.05, mAccent, 0, 0.17, -0.26),
    );
    return addMuzzle(g, 0, 0.07, -0.88);
}

function sniper(){
    const g = new THREE.Group();
    g.add(
        part(0.14, 0.12, 0.44, mBody, 0, 0, -0.18),
        part(0.05, 0.05, 0.68, mDark, 0, 0.02, -0.68),
        part(0.1, 0.1, 0.46, mDark, 0, 0.2, -0.34),
        part(0.05, 0.05, 0.3, mAccent, 0, 0.2, -0.48),
        part(0.06, 0.09, 0.16, mBody, 0.1, 0.04, -0.14),
        part(0.04, 0.12, 0.04, mAccent, 0.13, 0.1, -0.16),
        part(0.12, 0.1, 0.3, mWood, 0, -0.02, 0.24),
        part(0.1, 0.16, 0.09, mGrip, 0, -0.16, 0, 0.35),
        part(0.05, 0.34, 0.05, mDark, -0.12, -0.26, -0.34, 0, 0.4),
        part(0.05, 0.34, 0.05, mDark, 0.12, -0.26, -0.34, 0, -0.4),
    );
    return addMuzzle(g, 0, 0.05, -1.02);
}

function crossbow(){
    const g = new THREE.Group();
    g.add(
        part(0.12, 0.13, 0.32, mWood, 0, 0, -0.16),
        part(0.42, 0.06, 0.06, mDark, 0, 0.02, -0.44),
        part(0.05, 0.08, 0.16, mDark, 0, 0.06, -0.44),
        part(0.02, 0.02, 0.32, mBright, 0, 0.11, -0.36),
        part(0.04, 0.04, 0.42, mBody, 0, 0.13, -0.24),
        part(0.1, 0.16, 0.09, mGrip, 0, -0.16, 0, 0.3),
        part(0.05, 0.03, 0.06, mAccent, 0, 0.17, -0.32),
    );
    return addMuzzle(g, 0, 0.13, -0.55);
}

function flamer(){
    const g = new THREE.Group();
    g.add(
        part(0.24, 0.28, 0.4, mRed, 0, 0, 0.08),
        part(0.2, 0.22, 0.36, mDark, 0, 0, 0.1),
        part(0.1, 0.1, 0.3, mDark, 0, -0.02, -0.3),
        part(0.08, 0.08, 0.14, mAccent, 0, -0.02, -0.5),
        part(0.05, 0.05, 0.34, mRed, 0.16, -0.05, -0.18, -0.6),
        part(0.08, 0.1, 0.08, mAccent, 0, 0.2, 0.06),
        part(0.1, 0.16, 0.09, mGrip, 0, -0.18, 0.02, 0.35),
        part(0.09, 0.09, 0.12, mGrip, 0, 0, -0.16, -0.2),
    );
    return addMuzzle(g, 0, -0.02, -0.57);
}

export function buildViewModel(weaponId){
    const builders = [pistol, smg, shotgun, rifle, lmg, sniper, crossbow, flamer];
    const g = (builders[weaponId] || pistol)();
    g.position.set(0.32, -0.3, -0.55);
    g.rotation.y = 0.04;
    g.userData.basePos = g.position.clone();
    g.userData.baseRot = g.rotation.clone();
    return { group: g, muzzle: g.userData.muzzle };
}
