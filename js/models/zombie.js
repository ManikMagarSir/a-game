import { ZTYPES } from '../config.js';
import { boxMat, limb, fleshTex, metalTex } from './parts.js';

const skinMat = c => new THREE.MeshLambertMaterial({ color: c, map: fleshTex, emissive: 0x000000 });
const eyeMat = new THREE.MeshLambertMaterial({ color: 0x111111, emissive: 0xdd2222, emissiveIntensity: 0.9 });
const boneMat = new THREE.MeshLambertMaterial({ color: 0xddd8c8, emissive: 0x000000 });

export function buildZombieMesh(type){
    if(type === 'crawler') return buildCrawlerMesh();
    const t = ZTYPES[type];
    const g = new THREE.Group();
    const rig = new THREE.Group();
    g.add(rig);
    const skin = skinMat(t.color);
    const cloth = new THREE.MeshLambertMaterial({ color: 0x2e2a28, emissive: 0x000000 });
    const metal = new THREE.MeshLambertMaterial({ color: 0x4a3a2a, map: metalTex });

    const body = boxMat({ x: 0.95, y: 1.05, z: 0.55 }, cloth); body.position.y = 1.05;
    const chest = boxMat({ x: 0.72, y: 0.55, z: 0.6 }, skin); chest.position.y = 1.28;
    const head = boxMat({ x: 0.55, y: 0.55, z: 0.55 }, skin); head.position.y = 1.85;
    const jaw = boxMat({ x: 0.42, y: 0.14, z: 0.32 }, skin); jaw.position.set(0, 1.6, 0.3);
    const eyeL = boxMat({ x: 0.14, y: 0.14, z: 0.08 }, eyeMat); eyeL.position.set(-0.15, 1.93, 0.29);
    const eyeR = boxMat({ x: 0.14, y: 0.14, z: 0.08 }, eyeMat); eyeR.position.set(0.15, 1.93, 0.29);
    const neck = boxMat({ x: 0.3, y: 0.22, z: 0.3 }, skin); neck.position.set(0, 1.58, 0);
    const spine = boxMat({ x: 0.16, y: 0.7, z: 0.12 }, boneMat); spine.position.set(0, 1.5, -0.34);

    const armL = limb(-0.6, 1.5, 0, 0.26, 0.6, 0.26, cloth, { shin: true, shinH: 0.52, bend: 0.7 });
    const armR = limb(0.6, 1.5, 0, 0.26, 0.6, 0.26, cloth, { shin: true, shinH: 0.52, bend: 0.7 });
    const legL = limb(-0.24, 0.95, 0, 0.3, 0.5, 0.3, cloth, { shin: true, shinH: 0.45, bend: 0.12, foot: true, footH: 0.12, footL: 0.5 });
    const legR = limb(0.24, 0.95, 0, 0.3, 0.5, 0.3, cloth, { shin: true, shinH: 0.45, bend: 0.12, foot: true, footH: 0.12, footL: 0.5 });

    let lean = 0.08;
    if(type === 'brute'){
        lean = 0.16;
        const padL = boxMat({ x: 0.55, y: 0.4, z: 0.35 }, metal); padL.position.set(-0.68, 1.55, 0);
        const padR = boxMat({ x: 0.55, y: 0.4, z: 0.35 }, metal); padR.position.set(0.68, 1.55, 0);
        const hornL = boxMat({ x: 0.14, y: 0.5, z: 0.14 }, boneMat); hornL.position.set(-0.3, 2.25, 0.05); hornL.rotation.z = 0.55;
        const hornR = boxMat({ x: 0.14, y: 0.5, z: 0.14 }, boneMat); hornR.position.set(0.3, 2.25, 0.05); hornR.rotation.z = -0.55;
        rig.add(padL, padR, hornL, hornR);
    }
    if(type === 'shield'){
        const shield = boxMat({ x: 1.1, y: 1.5, z: 0.14 }, metal);
        shield.position.set(0, 1.25, 0.55);
        rig.add(shield);
        g.userData.shieldMesh = shield;
    }
    if(type === 'screamer'){
        const maw = boxMat({ x: 0.34, y: 0.16, z: 0.1 }, eyeMat); maw.position.set(0, 1.78, 0.3);
        const toothU = boxMat({ x: 0.3, y: 0.05, z: 0.05 }, boneMat); toothU.position.set(0, 1.85, 0.28);
        const toothL = boxMat({ x: 0.3, y: 0.05, z: 0.05 }, boneMat); toothL.position.set(0, 1.72, 0.28);
        rig.add(maw, toothU, toothL);
        head.scale.set(1.2, 0.9, 1.2);
    }
    if(type === 'exploder'){
        const core = boxMat({ x: 0.28, y: 0.28, z: 0.24 },
            new THREE.MeshLambertMaterial({ color: 0x332200, emissive: 0xff7722, emissiveIntensity: 1 }));
        core.position.set(0, 1.15, 0.35);
        rig.add(core);
    }
    if(type === 'spitter'){
        const snout = boxMat({ x: 0.2, y: 0.2, z: 0.28 }, skin); snout.position.set(0, 1.9, 0.45);
        const sac = boxMat({ x: 0.5, y: 0.42, z: 0.42 },
            new THREE.MeshLambertMaterial({ color: 0x2a5a2a, emissive: 0x1a7a3a, emissiveIntensity: 0.55 }));
        sac.position.set(0, 1.0, -0.5);
        rig.add(snout, sac);
    }
    if(type === 'runner'){
        lean = 0.3;
        const clawL = boxMat({ x: 0.12, y: 0.42, z: 0.18 }, boneMat); clawL.position.set(-0.72, 1.02, 0.28); clawL.rotation.z = 0.35;
        const clawR = boxMat({ x: 0.12, y: 0.42, z: 0.18 }, boneMat); clawR.position.set(0.72, 1.02, 0.28); clawR.rotation.z = -0.35;
        rig.add(clawL, clawR);
    }

    rig.add(body, chest, head, jaw, eyeL, eyeR, neck, spine, armL, armR, legL, legR);
    rig.rotation.x = lean;
    g.scale.setScalar(t.scale || 1);
    g.userData.tilt = 0;
    g.userData.parts = { body, head, chest, armL, armR, legL, legR, jaw };
    g.userData.glowParts = [eyeL, eyeR];
    g.userData.walk = Math.random() * Math.PI * 2;
    head.userData.part = 'head';
    body.userData.part = 'body';
    g.hitMeshes = [body, head];
    return g;
}

function buildCrawlerMesh(){
    const t = ZTYPES.crawler;
    const g = new THREE.Group();
    const skin = skinMat(t.color);
    const metal = new THREE.MeshLambertMaterial({ color: 0x4a3a2a, map: metalTex });

    const torso = boxMat({ x: 0.72, y: 0.32, z: 1.0 }, skin); torso.position.set(0, 0.3, 0);
    const head = boxMat({ x: 0.4, y: 0.3, z: 0.42 }, skin); head.position.set(0, 0.42, 0.6);
    const jaw = boxMat({ x: 0.3, y: 0.1, z: 0.24 }, skin); jaw.position.set(0, 0.3, 0.7);
    const eyeL = boxMat({ x: 0.1, y: 0.1, z: 0.06 }, eyeMat); eyeL.position.set(-0.12, 0.47, 0.8);
    const eyeR = boxMat({ x: 0.1, y: 0.1, z: 0.06 }, eyeMat); eyeR.position.set(0.12, 0.47, 0.8);
    const ridge = boxMat({ x: 0.2, y: 0.2, z: 0.55 }, metal); ridge.position.set(0, 0.5, 0);

    const fL = limb(-0.46, 0.32, 0.5, 0.12, 0.4, 0.12, skin); fL.rotation.x = -0.8;
    const fR = limb(0.46, 0.32, 0.5, 0.12, 0.4, 0.12, skin); fR.rotation.x = -0.8;
    const bL = limb(-0.46, 0.32, -0.5, 0.14, 0.45, 0.14, skin); bL.rotation.x = 1.0;
    const bR = limb(0.46, 0.32, -0.5, 0.14, 0.45, 0.14, skin); bR.rotation.x = 1.0;

    g.add(torso, head, jaw, eyeL, eyeR, ridge, fL, fR, bL, bR);
    g.scale.setScalar(t.scale || 1);
    g.userData.tilt = 0;
    g.userData.parts = { body: torso, head, chest: torso, armL: fL, armR: fR, legL: bL, legR: bR, jaw };
    g.userData.glowParts = [eyeL, eyeR];
    g.userData.walk = Math.random() * Math.PI * 2;
    g.userData.crawler = true;
    head.userData.part = 'head';
    torso.userData.part = 'body';
    g.hitMeshes = [torso, head];
    return g;
}
