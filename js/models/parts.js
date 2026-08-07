import { fleshTexture, metalTexture } from '../textures.js';

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
export const fleshTex = fleshTexture();
export const metalTex = metalTexture();

export function box(scale, color, opts = {}){
    const m = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({ color, ...opts }));
    if(scale) m.scale.set(scale.x || scale, scale.y || scale, scale.z || scale);
    m.castShadow = true;
    return m;
}

export function boxMat(scale, mat){
    const m = new THREE.Mesh(boxGeo, mat);
    if(scale) m.scale.set(scale.x || scale, scale.y || scale, scale.z || scale);
    m.castShadow = true;
    return m;
}

export function limb(px, py, pz, w, h, d, mat, opts = {}){
    const g = new THREE.Group();
    g.position.set(px, py, pz);
    const upper = boxMat({ x: w, y: h, z: d }, mat);
    upper.position.y = -h / 2;
    g.add(upper);
    if(opts.shin){
        const lh = opts.shinH || h * 0.95;
        const lo = boxMat({ x: w * 0.8, y: lh, z: d * 0.85 }, mat);
        lo.position.y = -h - lh / 2;
        lo.rotation.x = opts.bend || 0;
        g.add(lo);
        g.userData.lower = lo;
        if(opts.foot){
            const fh = opts.footH || 0.12;
            const foot = boxMat({ x: w * 1.15, y: fh, z: opts.footL || 0.5 }, mat);
            foot.position.set(0, -(h + lh + fh / 2), 0.08);
            g.add(foot);
        }
    }
    g.userData.upper = upper;
    return g;
}
