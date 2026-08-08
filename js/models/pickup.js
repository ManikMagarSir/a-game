import { box } from './parts.js';

export function buildPickup(type){
    const g = new THREE.Group();
    if(type === 'health'){
        const mat = new THREE.MeshLambertMaterial({ color: 0x33ff66, emissive: 0x114422 });
        const a = box({ x: 0.5, y: 0.16, z: 0.16 }, 0x000000); a.material = mat;
        const b = box({ x: 0.16, y: 0.5, z: 0.16 }, 0x000000); b.material = mat;
        g.add(a, b);
    } else {
        const mat = new THREE.MeshLambertMaterial({ color: 0x335522, emissive: 0x112200 });
        const g1 = box({ x: 0.3, y: 0.3, z: 0.3 }, 0x000000); g1.material = mat;
        g1.position.set(-0.12, 0, 0.1); g1.rotation.x = 0.4; g1.rotation.z = 0.3;
        const g2 = box({ x: 0.3, y: 0.3, z: 0.3 }, 0x000000); g2.material = mat;
        g2.position.set(0.12, 0, -0.1); g2.rotation.x = -0.3; g2.rotation.z = -0.4;
        const cap = box({ x: 0.1, y: 0.08, z: 0.1 }, 0xffbb33);
        cap.position.set(-0.12, 0.2, 0.1);
        g.add(g1, g2, cap);
    }
    g.traverse(o => { if(o.isMesh) o.castShadow = true; });
    return g;
}
