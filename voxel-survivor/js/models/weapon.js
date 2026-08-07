import { boxMat, metalTex } from './parts.js';
import { glowTexture } from '../textures.js';

const glow = glowTexture();

export function buildViewModel(weaponId){
    const g = new THREE.Group();
    const mBody = new THREE.MeshLambertMaterial({ color: 0x33363c, map: metalTex });
    const mGrip = new THREE.MeshLambertMaterial({ color: 0x4a3420, map: metalTex });

    const len = weaponId === 2 ? 0.9 : weaponId === 3 ? 1.0 : weaponId === 5 ? 1.15 : 0.7;
    const body = boxMat({ x: 0.18, y: 0.18, z: len }, mBody); body.position.z = -len / 2;
    const barrel = boxMat({ x: 0.09, y: 0.09, z: len * 0.6 }, mBody); barrel.position.set(0, 0.04, -len * 0.9);
    const handle = boxMat({ x: 0.14, y: 0.34, z: 0.16 }, mGrip); handle.position.set(0, -0.22, 0.02); handle.rotation.x = 0.25;
    const mag = boxMat({ x: 0.1, y: 0.26, z: 0.12 }, mBody); mag.position.set(0, -0.2, -0.18);
    const sight = boxMat({ x: 0.06, y: 0.1, z: 0.08 }, mBody); sight.position.set(0, 0.16, -len * 0.5);
    g.add(body, barrel, handle, mag, sight);

    if(weaponId === 5){
        const scope = boxMat({ x: 0.1, y: 0.1, z: 0.4 }, new THREE.MeshLambertMaterial({ color: 0x1c1f24, map: metalTex }));
        scope.position.set(0, 0.2, -len * 0.55);
        g.add(scope);
    }
    if(weaponId === 7){
        const tank = boxMat({ x: 0.22, y: 0.3, z: 0.3 }, mBody);
        tank.position.set(0, -0.05, 0.12);
        g.add(tank);
    }

    const muzzle = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55),
        new THREE.MeshBasicMaterial({ map: glow, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, color: 0xffffff }));
    muzzle.position.set(0, 0.05, -len * 1.2);
    g.add(muzzle);

    g.position.set(0.32, -0.3, -0.55);
    g.rotation.y = 0.04;
    g.userData.basePos = g.position.clone();
    g.userData.baseRot = g.rotation.clone();
    return { group: g, muzzle };
}
