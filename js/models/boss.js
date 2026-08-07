import { boxMat, limb, fleshTex, metalTex } from './parts.js';

export function buildBossMesh(){
    const g = new THREE.Group();
    const skin = new THREE.MeshLambertMaterial({ color: 0x7a2a9a, map: fleshTex, emissive: 0x000000 });
    const cloth = new THREE.MeshLambertMaterial({ color: 0x1f1524, emissive: 0x000000 });
    const armor = new THREE.MeshLambertMaterial({ color: 0x4a2a5a, map: metalTex });
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x0a000a, emissive: 0xff2244, emissiveIntensity: 1.2 });
    const coreMat = new THREE.MeshLambertMaterial({ color: 0x2a0033, emissive: 0xaa22ff, emissiveIntensity: 1 });

    const body = boxMat({ x: 1.6, y: 1.7, z: 1.0 }, cloth); body.position.y = 1.7;
    const chest = boxMat({ x: 1.15, y: 1.0, z: 1.1 }, skin); chest.position.y = 1.85;
    const head = boxMat({ x: 0.8, y: 0.8, z: 0.8 }, skin); head.position.y = 2.85;
    const jaw = boxMat({ x: 0.6, y: 0.26, z: 0.5 }, skin); jaw.position.set(0, 2.42, 0.42);
    const eyeL = boxMat({ x: 0.22, y: 0.22, z: 0.12 }, eyeMat); eyeL.position.set(-0.24, 3.0, 0.42);
    const eyeR = boxMat({ x: 0.22, y: 0.22, z: 0.12 }, eyeMat); eyeR.position.set(0.24, 3.0, 0.42);

    const armL = limb(-1.15, 2.5, 0, 0.5, 1.0, 0.5, armor, { shin: true, shinH: 0.7, bend: 0.55 });
    const armR = limb(1.15, 2.5, 0, 0.5, 1.0, 0.5, armor, { shin: true, shinH: 0.7, bend: 0.55 });
    const fistL = boxMat({ x: 0.72, y: 0.55, z: 0.72 }, skin); fistL.position.set(0, -1.55, -0.8);
    const fistR = boxMat({ x: 0.72, y: 0.55, z: 0.72 }, skin); fistR.position.set(0, -1.55, -0.8);
    armL.add(fistL); armR.add(fistR);

    const legL = limb(-0.5, 1.55, 0, 0.55, 0.85, 0.55, cloth, { shin: true, shinH: 0.7, bend: 0.12, foot: true, footH: 0.25, footL: 1.0 });
    const legR = limb(0.5, 1.55, 0, 0.55, 0.85, 0.55, cloth, { shin: true, shinH: 0.7, bend: 0.12, foot: true, footH: 0.25, footL: 1.0 });

    const spikeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    for(let i = 0; i < 6; i++){
        const sp = boxMat({ x: 0.18, y: 0.6, z: 0.18 }, spikeMat);
        const a = i / 6 * Math.PI * 2;
        sp.position.set(Math.cos(a) * 0.5, 3.25, Math.sin(a) * 0.5);
        sp.rotation.y = a;
        g.add(sp);
    }
    const padL = boxMat({ x: 0.7, y: 0.4, z: 0.7 }, armor); padL.position.set(-1.5, 2.55, 0);
    const padR = boxMat({ x: 0.7, y: 0.4, z: 0.7 }, armor); padR.position.set(1.5, 2.55, 0);
    const core = boxMat({ x: 0.35, y: 0.35, z: 0.3 }, coreMat); core.position.set(0, 1.9, 0.6);

    g.add(body, chest, head, jaw, eyeL, eyeR, armL, armR, legL, legR, padL, padR, core);
    g.scale.setScalar(2.2);
    g.userData.parts = { body, head, chest, armL, armR, legL, legR, jaw, core };
    g.userData.walk = Math.random() * Math.PI * 2;
    head.userData.part = 'head';
    body.userData.part = 'body';
    g.hitMeshes = [body, chest, head];
    return g;
}
