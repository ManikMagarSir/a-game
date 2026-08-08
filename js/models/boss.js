import { boxMat, limb, fleshTex, metalTex } from './parts.js';

function part(scale, mat){
    return boxMat(scale, mat);
}

function finalize(g, scale, coreMat){
    const parts = g.userData.parts;
    parts.head.userData.part = 'head';
    parts.body.userData.part = 'body';
    g.hitMeshes = [parts.body, parts.chest, parts.head];
    g.scale.setScalar(scale);
    g.userData.formScale = scale;
    g.userData.coreMat = coreMat;
    g.userData.glowParts = [];
    if(parts.core) parts.core.userData.preserveGlow = true;
    g.traverse(o => {
        if(o.isMesh && o !== parts.core && o.material && o.material.emissive && o.material.emissiveIntensity > 0){
            g.userData.glowParts.push(o);
        }
    });
    return g;
}

/* Form 1 — THE ABOMINATION: armored purple brute, horns, fists. */
function buildForm1(){
    const g = new THREE.Group();
    const skin = new THREE.MeshLambertMaterial({ color: 0x7a2a9a, map: fleshTex, emissive: 0x000000 });
    const cloth = new THREE.MeshLambertMaterial({ color: 0x1f1524, emissive: 0x000000 });
    const armor = new THREE.MeshLambertMaterial({ color: 0x4a2a5a, map: metalTex });
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x0a000a, emissive: 0xff2244, emissiveIntensity: 1.2 });
    const coreMat = new THREE.MeshLambertMaterial({ color: 0x2a0033, emissive: 0xaa22ff, emissiveIntensity: 1 });

    const body = part({ x: 1.6, y: 1.7, z: 1.0 }, cloth); body.position.y = 1.7;
    const chest = part({ x: 1.15, y: 1.0, z: 1.1 }, skin); chest.position.y = 1.85;
    const head = part({ x: 0.8, y: 0.8, z: 0.8 }, skin); head.position.y = 2.85;
    const jaw = part({ x: 0.6, y: 0.26, z: 0.5 }, skin); jaw.position.set(0, 2.42, 0.42);
    const eyeL = part({ x: 0.22, y: 0.22, z: 0.12 }, eyeMat); eyeL.position.set(-0.24, 3.0, 0.42);
    const eyeR = part({ x: 0.22, y: 0.22, z: 0.12 }, eyeMat); eyeR.position.set(0.24, 3.0, 0.42);

    const armL = limb(-1.15, 2.5, 0, 0.5, 1.0, 0.5, armor, { shin: true, shinH: 0.7, bend: 0.55 });
    const armR = limb(1.15, 2.5, 0, 0.5, 1.0, 0.5, armor, { shin: true, shinH: 0.7, bend: 0.55 });
    const fistL = part({ x: 0.72, y: 0.55, z: 0.72 }, skin); fistL.position.set(0, -1.55, -0.8);
    const fistR = part({ x: 0.72, y: 0.55, z: 0.72 }, skin); fistR.position.set(0, -1.55, -0.8);
    armL.add(fistL); armR.add(fistR);

    const legL = limb(-0.5, 1.55, 0, 0.55, 0.85, 0.55, cloth, { shin: true, shinH: 0.7, bend: 0.12, foot: true, footH: 0.25, footL: 1.0 });
    const legR = limb(0.5, 1.55, 0, 0.55, 0.85, 0.55, cloth, { shin: true, shinH: 0.7, bend: 0.12, foot: true, footH: 0.25, footL: 1.0 });

    const spikeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    for(let i = 0; i < 6; i++){
        const sp = part({ x: 0.18, y: 0.6, z: 0.18 }, spikeMat);
        const a = i / 6 * Math.PI * 2;
        sp.position.set(Math.cos(a) * 0.5, 3.25, Math.sin(a) * 0.5);
        sp.rotation.y = a;
        g.add(sp);
    }
    const hornL = part({ x: 0.2, y: 0.9, z: 0.2 }, spikeMat); hornL.position.set(-0.42, 3.6, 0.1); hornL.rotation.z = 0.5;
    const hornR = part({ x: 0.2, y: 0.9, z: 0.2 }, spikeMat); hornR.position.set(0.42, 3.6, 0.1); hornR.rotation.z = -0.5;
    const padL = part({ x: 0.7, y: 0.4, z: 0.7 }, armor); padL.position.set(-1.5, 2.55, 0);
    const padR = part({ x: 0.7, y: 0.4, z: 0.7 }, armor); padR.position.set(1.5, 2.55, 0);
    const core = part({ x: 0.35, y: 0.35, z: 0.3 }, coreMat); core.position.set(0, 1.9, 0.6);

    g.add(body, chest, head, jaw, eyeL, eyeR, armL, armR, legL, legR, padL, padR, core, hornL, hornR);
    g.userData.parts = { body, head, chest, armL, armR, legL, legR, jaw, core };
    return finalize(g, 2.2, coreMat);
}

/* Form 2 — THE TITAN: hulking rust brawler, huge fists, small sunken head. */
function buildForm2(){
    const g = new THREE.Group();
    const skin = new THREE.MeshLambertMaterial({ color: 0x8a2a22, map: fleshTex, emissive: 0x000000 });
    const cloth = new THREE.MeshLambertMaterial({ color: 0x221512, emissive: 0x000000 });
    const armor = new THREE.MeshLambertMaterial({ color: 0x5a3a2a, map: metalTex });
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x0a0000, emissive: 0xff4422, emissiveIntensity: 1.2 });
    const coreMat = new THREE.MeshLambertMaterial({ color: 0x330000, emissive: 0xff4400, emissiveIntensity: 1 });

    const body = part({ x: 2.0, y: 1.9, z: 1.3 }, cloth); body.position.y = 1.8;
    const chest = part({ x: 1.5, y: 1.15, z: 1.4 }, skin); chest.position.y = 2.0;
    const head = part({ x: 0.55, y: 0.6, z: 0.6 }, skin); head.position.set(0, 2.6, 0.15);
    const eyeL = part({ x: 0.2, y: 0.18, z: 0.1 }, eyeMat); eyeL.position.set(-0.18, 2.75, 0.45);
    const eyeR = part({ x: 0.2, y: 0.18, z: 0.1 }, eyeMat); eyeR.position.set(0.18, 2.75, 0.45);
    const jaw = part({ x: 0.5, y: 0.22, z: 0.4 }, skin); jaw.position.set(0, 2.2, 0.42);

    const armL = limb(-1.5, 2.6, 0, 0.7, 1.2, 0.7, armor, { shin: true, shinH: 0.9, bend: 0.5 });
    const armR = limb(1.5, 2.6, 0, 0.7, 1.2, 0.7, armor, { shin: true, shinH: 0.9, bend: 0.5 });
    const fistL = part({ x: 0.95, y: 0.65, z: 0.95 }, skin); fistL.position.set(0, -1.85, -0.9);
    const fistR = part({ x: 0.95, y: 0.65, z: 0.95 }, skin); fistR.position.set(0, -1.85, -0.9);
    armL.add(fistL); armR.add(fistR);

    const legL = limb(-0.65, 1.5, 0, 0.6, 0.8, 0.6, cloth, { shin: true, shinH: 0.6, bend: 0.1, foot: true, footH: 0.2, footL: 0.9 });
    const legR = limb(0.65, 1.5, 0, 0.6, 0.8, 0.6, cloth, { shin: true, shinH: 0.6, bend: 0.1, foot: true, footH: 0.2, footL: 0.9 });

    const padL = part({ x: 0.95, y: 0.5, z: 0.95 }, armor); padL.position.set(-1.95, 2.7, 0);
    const padR = part({ x: 0.95, y: 0.5, z: 0.95 }, armor); padR.position.set(1.95, 2.7, 0);

    const spikeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    for(let i = 0; i < 2; i++){
        const spL = part({ x: 0.2, y: 0.55, z: 0.2 }, spikeMat); spL.position.set(-1.95, 3.0, -0.3 + i * 0.6); spL.rotation.z = 0.5; g.add(spL);
        const spR = part({ x: 0.2, y: 0.55, z: 0.2 }, spikeMat); spR.position.set(1.95, 3.0, -0.3 + i * 0.6); spR.rotation.z = -0.5; g.add(spR);
    }
    const hornL = part({ x: 0.18, y: 0.5, z: 0.18 }, spikeMat); hornL.position.set(-0.3, 3.15, 0.2); hornL.rotation.z = 0.4;
    const hornR = part({ x: 0.18, y: 0.5, z: 0.18 }, spikeMat); hornR.position.set(0.3, 3.15, 0.2); hornR.rotation.z = -0.4;
    const core = part({ x: 0.55, y: 0.55, z: 0.4 }, coreMat); core.position.set(0, 2.2, 0.72);

    g.add(body, chest, head, eyeL, eyeR, jaw, armL, armR, legL, legR, padL, padR, core, hornL, hornR);
    g.userData.parts = { body, head, chest, armL, armR, legL, legR, jaw, core };
    return finalize(g, 2.4, coreMat);
}

/* Form 3 — THE OCULUS: crowned caster, tall and hunched, giant glowing core. */
function buildForm3(){
    const g = new THREE.Group();
    const skin = new THREE.MeshLambertMaterial({ color: 0x5a2a7a, map: fleshTex, emissive: 0x000000 });
    const cloth = new THREE.MeshLambertMaterial({ color: 0x1a1020, emissive: 0x000000 });
    const armor = new THREE.MeshLambertMaterial({ color: 0x3a2a4a, map: metalTex });
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x0a000a, emissive: 0xcc66ff, emissiveIntensity: 1.4 });
    const coreMat = new THREE.MeshLambertMaterial({ color: 0x2a0033, emissive: 0xbb55ff, emissiveIntensity: 1 });

    const body = part({ x: 1.3, y: 1.9, z: 1.1 }, cloth); body.position.y = 2.0;
    const chest = part({ x: 1.0, y: 1.3, z: 1.2 }, skin); chest.position.y = 2.2;
    const head = part({ x: 0.7, y: 0.75, z: 0.7 }, skin); head.position.y = 3.45;
    const eyeL = part({ x: 0.2, y: 0.2, z: 0.12 }, eyeMat); eyeL.position.set(-0.22, 3.65, 0.42);
    const eyeR = part({ x: 0.2, y: 0.2, z: 0.12 }, eyeMat); eyeR.position.set(0.22, 3.65, 0.42);
    const jaw = part({ x: 0.55, y: 0.24, z: 0.45 }, skin); jaw.position.set(0, 3.05, 0.45);

    const armL = limb(-0.95, 2.9, 0, 0.4, 1.3, 0.4, armor, { shin: true, shinH: 1.0, bend: 0.6 });
    const armR = limb(0.95, 2.9, 0, 0.4, 1.3, 0.4, armor, { shin: true, shinH: 1.0, bend: 0.6 });
    const handL = part({ x: 0.4, y: 0.5, z: 0.4 }, skin); handL.position.set(0, -2.25, -0.6);
    const handR = part({ x: 0.4, y: 0.5, z: 0.4 }, skin); handR.position.set(0, -2.25, -0.6);
    armL.add(handL); armR.add(handR);

    const legL = limb(-0.45, 1.6, 0, 0.5, 0.7, 0.5, cloth, { shin: true, shinH: 0.55, bend: 0.1 });
    const legR = limb(0.45, 1.6, 0, 0.5, 0.7, 0.5, cloth, { shin: true, shinH: 0.55, bend: 0.1 });
    const robe = part({ x: 1.7, y: 0.6, z: 1.3 }, cloth); robe.position.y = 0.85;

    const spikeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const crown = new THREE.Group();
    for(let i = 0; i < 5; i++){
        const c = part({ x: 0.16, y: 0.6 + (i % 2) * 0.35, z: 0.16 }, spikeMat);
        c.position.set(-0.4 + i * 0.2, 3.95, 0.05);
        c.rotation.x = 0.12;
        crown.add(c);
    }
    const core = part({ x: 0.6, y: 0.6, z: 0.45 }, coreMat); core.position.set(0, 2.5, 0.65);

    g.add(body, chest, head, eyeL, eyeR, jaw, armL, armR, legL, legR, robe, crown, core);
    g.userData.parts = { body, head, chest, armL, armR, legL, legR, jaw, core };
    return finalize(g, 2.1, coreMat);
}

/* Form 4 — THE REAPER: lean lacerator, blade arms, angular head crest. */
function buildForm4(){
    const g = new THREE.Group();
    const skin = new THREE.MeshLambertMaterial({ color: 0x2a2a3a, map: fleshTex, emissive: 0x000000 });
    const cloth = new THREE.MeshLambertMaterial({ color: 0x101018, emissive: 0x000000 });
    const armor = new THREE.MeshLambertMaterial({ color: 0x3a3a4a, map: metalTex });
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a, emissive: 0xffcc44, emissiveIntensity: 1.4 });
    const coreMat = new THREE.MeshLambertMaterial({ color: 0x111122, emissive: 0x66aaff, emissiveIntensity: 1 });

    const body = part({ x: 1.2, y: 1.8, z: 0.8 }, cloth); body.position.y = 2.0;
    const chest = part({ x: 0.9, y: 1.1, z: 0.9 }, skin); chest.position.y = 2.2;
    const head = part({ x: 0.65, y: 1.0, z: 0.6 }, skin); head.position.y = 3.6;
    const eyeL = part({ x: 0.18, y: 0.2, z: 0.1 }, eyeMat); eyeL.position.set(-0.2, 3.85, 0.35);
    const eyeR = part({ x: 0.18, y: 0.2, z: 0.1 }, eyeMat); eyeR.position.set(0.2, 3.85, 0.35);

    const spikeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const crest = new THREE.Group();
    const cL = part({ x: 0.9, y: 0.12, z: 0.14 }, spikeMat); cL.position.set(-0.6, 4.15, 0); cL.rotation.z = 0.3; crest.add(cL);
    const cR = part({ x: 0.9, y: 0.12, z: 0.14 }, spikeMat); cR.position.set(0.6, 4.15, 0); cR.rotation.z = -0.3; crest.add(cR);

    const armL = limb(-1.05, 2.8, 0, 0.45, 1.1, 0.45, armor, { shin: false });
    const armR = limb(1.05, 2.8, 0, 0.45, 1.1, 0.45, armor, { shin: false });
    const bladeL = part({ x: 0.24, y: 1.6, z: 0.36 }, spikeMat); bladeL.position.set(0, -1.9, -0.35); armL.add(bladeL);
    const bladeR = part({ x: 0.24, y: 1.6, z: 0.36 }, spikeMat); bladeR.position.set(0, -1.9, -0.35); armR.add(bladeR);

    const legL = limb(-0.5, 1.5, 0, 0.5, 0.7, 0.5, cloth, { shin: true, shinH: 0.55, bend: 0.08, foot: true, footH: 0.18, footL: 0.8 });
    const legR = limb(0.5, 1.5, 0, 0.5, 0.7, 0.5, cloth, { shin: true, shinH: 0.55, bend: 0.08, foot: true, footH: 0.18, footL: 0.8 });

    for(let i = 0; i < 4; i++){
        const sp = part({ x: 0.14, y: 0.7, z: 0.14 }, spikeMat);
        const a = i / 4 * Math.PI * 2;
        sp.position.set(Math.cos(a) * 0.4, 3.2, Math.sin(a) * 0.4);
        sp.rotation.y = a;
        g.add(sp);
    }
    const core = part({ x: 0.32, y: 0.32, z: 0.28 }, coreMat); core.position.set(0, 2.3, 0.55);

    g.add(body, chest, head, eyeL, eyeR, crest, armL, armR, legL, legR, core);
    g.userData.parts = { body, head, chest, armL, armR, legL, legR, core };
    return finalize(g, 2.25, coreMat);
}

/* Form 5 — THE COLOSSUS: enraged endgame, wings, crown, blades, red aura. */
function buildForm5(){
    const g = new THREE.Group();
    const skin = new THREE.MeshLambertMaterial({ color: 0x9a2a2a, map: fleshTex, emissive: 0x000000 });
    const cloth = new THREE.MeshLambertMaterial({ color: 0x1a0f0f, emissive: 0x000000 });
    const armor = new THREE.MeshLambertMaterial({ color: 0x5a2a2a, map: metalTex });
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x0a0000, emissive: 0xff2200, emissiveIntensity: 1.8 });
    const coreMat = new THREE.MeshLambertMaterial({ color: 0x440000, emissive: 0xff2200, emissiveIntensity: 1 });

    const body = part({ x: 2.3, y: 2.1, z: 1.4 }, cloth); body.position.y = 2.0;
    const chest = part({ x: 1.7, y: 1.3, z: 1.6 }, skin); chest.position.y = 2.3;
    const head = part({ x: 0.85, y: 0.9, z: 0.85 }, skin); head.position.y = 3.4;
    const eyeL = part({ x: 0.24, y: 0.24, z: 0.14 }, eyeMat); eyeL.position.set(-0.26, 3.65, 0.48);
    const eyeR = part({ x: 0.24, y: 0.24, z: 0.14 }, eyeMat); eyeR.position.set(0.26, 3.65, 0.48);
    const jaw = part({ x: 0.65, y: 0.28, z: 0.55 }, skin); jaw.position.set(0, 2.98, 0.5);

    const armL = limb(-1.75, 2.9, 0, 0.75, 1.3, 0.75, armor, { shin: true, shinH: 1.0, bend: 0.55 });
    const armR = limb(1.75, 2.9, 0, 0.75, 1.3, 0.75, armor, { shin: true, shinH: 1.0, bend: 0.55 });
    const fistL = part({ x: 1.0, y: 0.7, z: 1.0 }, skin); fistL.position.set(0, -2.0, -1.0);
    const fistR = part({ x: 1.0, y: 0.7, z: 1.0 }, skin); fistR.position.set(0, -2.0, -1.0);
    armL.add(fistL); armR.add(fistR);

    const spikeMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const bladeL = part({ x: 0.26, y: 1.1, z: 0.4 }, spikeMat); bladeL.position.set(0, -2.3, -0.6); armL.add(bladeL);
    const bladeR = part({ x: 0.26, y: 1.1, z: 0.4 }, spikeMat); bladeR.position.set(0, -2.3, -0.6); armR.add(bladeR);

    const legL = limb(-0.7, 1.6, 0, 0.65, 0.9, 0.65, cloth, { shin: true, shinH: 0.7, bend: 0.1, foot: true, footH: 0.25, footL: 1.0 });
    const legR = limb(0.7, 1.6, 0, 0.65, 0.9, 0.65, cloth, { shin: true, shinH: 0.7, bend: 0.1, foot: true, footH: 0.25, footL: 1.0 });

    const wings = new THREE.Group();
    for(let s = 0; s < 2; s++){
        for(let i = 0; i < 4; i++){
            const w = part({ x: 0.16, y: 1.0, z: 0.16 }, spikeMat);
            const sx = s === 0 ? -1.55 : 1.55;
            w.position.set(sx - (s === 0 ? -1 : 1) * 0.35 * i, 2.7 + i * 0.25, -0.55);
            w.rotation.z = s === 0 ? -0.5 : 0.5;
            wings.add(w);
        }
    }
    const crown = new THREE.Group();
    for(let i = 0; i < 4; i++){
        const c = part({ x: 0.2, y: 0.7 + (i % 2) * 0.35, z: 0.2 }, spikeMat);
        c.position.set(-0.5 + i * 0.34, 4.2, -0.05);
        c.rotation.x = 0.12;
        crown.add(c);
    }
    for(let i = 0; i < 3; i++){
        const spL = part({ x: 0.2, y: 0.5, z: 0.2 }, spikeMat); spL.position.set(-1.9, 3.1, -0.4 + i * 0.4); spL.rotation.z = 0.4; g.add(spL);
        const spR = part({ x: 0.2, y: 0.5, z: 0.2 }, spikeMat); spR.position.set(1.9, 3.1, -0.4 + i * 0.4); spR.rotation.z = -0.4; g.add(spR);
    }
    const core = part({ x: 0.6, y: 0.6, z: 0.5 }, coreMat); core.position.set(0, 2.6, 0.85);

    const auraMat = new THREE.MeshLambertMaterial({ color: 0xff0000, emissive: 0xff2200, emissiveIntensity: 1, transparent: true, opacity: 0.18 });
    const aura5 = part({ x: 3.2, y: 7.4, z: 2.8 }, auraMat);
    aura5.position.y = 2.6;
    aura5.visible = false;
    aura5.castShadow = false;
    aura5.receiveShadow = false;

    g.add(body, chest, head, eyeL, eyeR, jaw, armL, armR, legL, legR, wings, crown, core, aura5);
    g.userData.parts = { body, head, chest, armL, armR, legL, legR, jaw, core };
    g.userData.aura = aura5;
    return finalize(g, 2.9, coreMat);
}

export function buildBossForm(form){
    const g = form === 2 ? buildForm2() : form === 3 ? buildForm3() : form === 4 ? buildForm4() : form === 5 ? buildForm5() : buildForm1();
    g.userData.walk = Math.random() * Math.PI * 2;
    return g;
}

export function buildBossMesh(){
    return buildBossForm(1);
}
