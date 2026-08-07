import { ZTYPES } from '../config.js';
import { boxMat, limb, fleshTex, metalTex } from './parts.js';

const skinMat = c => new THREE.MeshLambertMaterial({ color: c, map: fleshTex, emissive: 0x000000 });
const eyeMat = new THREE.MeshLambertMaterial({ color: 0x111111, emissive: 0xdd2222, emissiveIntensity: 0.9 });

export function buildZombieMesh(type){
    const t = ZTYPES[type];
    const g = new THREE.Group();
    const skin = skinMat(t.color);
    const cloth = new THREE.MeshLambertMaterial({ color: 0x2e2a28, emissive: 0x000000 });
    const metal = new THREE.MeshLambertMaterial({ color: 0x4a3a2a, map: metalTex });

    const body = boxMat({ x: 0.95, y: 1.05, z: 0.55 }, cloth); body.position.y = 1.05;
    const chest = boxMat({ x: 0.72, y: 0.55, z: 0.6 }, skin); chest.position.y = 1.28;
    const head = boxMat({ x: 0.55, y: 0.55, z: 0.55 }, skin); head.position.y = 1.85;
    const jaw = boxMat({ x: 0.42, y: 0.14, z: 0.32 }, skin); jaw.position.set(0, 1.6, 0.3);
    const eyeL = boxMat({ x: 0.14, y: 0.14, z: 0.08 }, eyeMat); eyeL.position.set(-0.15, 1.93, 0.29);
    const eyeR = boxMat({ x: 0.14, y: 0.14, z: 0.08 }, eyeMat); eyeR.position.set(0.15, 1.93, 0.29);

    const armL = limb(-0.6, 1.5, 0, 0.26, 0.6, 0.26, cloth, { shin: true, shinH: 0.52, bend: 0.7 });
    const armR = limb(0.6, 1.5, 0, 0.26, 0.6, 0.26, cloth, { shin: true, shinH: 0.52, bend: 0.7 });
    const legL = limb(-0.24, 0.95, 0, 0.3, 0.5, 0.3, cloth, { shin: true, shinH: 0.45, bend: 0.12, foot: true, footH: 0.12, footL: 0.5 });
    const legR = limb(0.24, 0.95, 0, 0.3, 0.5, 0.3, cloth, { shin: true, shinH: 0.45, bend: 0.12, foot: true, footH: 0.12, footL: 0.5 });

    if(type === 'brute'){
        g.rotation.x = 0.18;
        const padL = boxMat({ x: 0.55, y: 0.4, z: 0.35 }, metal); padL.position.set(-0.68, 1.55, 0);
        const padR = boxMat({ x: 0.55, y: 0.4, z: 0.35 }, metal); padR.position.set(0.68, 1.55, 0);
        g.add(padL, padR);
    }
    if(type === 'shield'){
        const shield = boxMat({ x: 1.1, y: 1.5, z: 0.14 }, metal);
        shield.position.set(0, 1.25, 0.55);
        g.add(shield);
        g.userData.shieldMesh = shield;
    }
    if(type === 'screamer'){
        const maw = boxMat({ x: 0.34, y: 0.16, z: 0.1 }, eyeMat); maw.position.set(0, 1.78, 0.3);
        g.add(maw);
        head.scale.set(1.2, 0.9, 1.2);
    }
    if(type === 'exploder'){
        const core = boxMat({ x: 0.28, y: 0.28, z: 0.24 },
            new THREE.MeshLambertMaterial({ color: 0x332200, emissive: 0xff7722, emissiveIntensity: 1 }));
        core.position.set(0, 1.15, 0.35);
        g.add(core);
    }
    if(type === 'spitter'){
        const snout = boxMat({ x: 0.2, y: 0.2, z: 0.28 }, skin); snout.position.set(0, 1.9, 0.45);
        g.add(snout);
    }
    if(type === 'runner') g.rotation.x = 0.3;

    g.add(body, chest, head, jaw, eyeL, eyeR, armL, armR, legL, legR);
    g.scale.setScalar(t.scale || 1);
    g.userData.tilt = g.rotation.x;
    g.userData.parts = { body, head, chest, armL, armR, legL, legR, jaw };
    g.userData.walk = Math.random() * Math.PI * 2;
    head.userData.part = 'head';
    body.userData.part = 'body';
    g.hitMeshes = [body, head];
    return g;
}
