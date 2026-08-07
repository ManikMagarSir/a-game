import { box } from './parts.js';

export function buildPickup(type){
    const g = new THREE.Group();
    if(type === 'health'){
        const mat = new THREE.MeshLambertMaterial({ color: 0x33ff66, emissive: 0x114422 });
        const a = box({ x: 0.5, y: 0.16, z: 0.16 }, 0x000000); a.material = mat;
        const b = box({ x: 0.16, y: 0.5, z: 0.16 }, 0x000000); b.material = mat;
        g.add(a, b);
    } else {
        const mat = new THREE.MeshLambertMaterial({ color: 0xffcc33, emissive: 0x443300 });
        const crate = box({ x: 0.5, y: 0.4, z: 0.5 }, 0x000000); crate.material = mat;
        const stripe = box({ x: 0.52, y: 0.1, z: 0.52 }, 0xff5500);
        g.add(crate, stripe);
    }
    g.traverse(o => { if(o.isMesh) o.castShadow = true; });
    return g;
}
