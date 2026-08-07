import { G } from './state.js';
import { camera, renderer, requestLock } from './world.js';
import { tryShoot, meleeAttack, throwGrenade, cycleWeapon, selectWeapon } from './weapons.js';

function rendererDom(){ return renderer ? renderer.domElement : null; }

export function initInput(handlers){
    addEventListener('keydown', e => {
        G.keys[e.code] = true;
        if(G.state !== 'playing' && G.state !== 'shop' && G.state !== 'sandbox') return;
        if(e.code === 'KeyB'){ if(G.state === 'shop') handlers.closeShop(); else handlers.openShop(); return; }
        if(e.code === 'Digit1') selectWeapon(0);
        else if(e.code === 'Digit2') selectWeapon(1);
        else if(e.code === 'Digit3') selectWeapon(2);
        else if(e.code === 'Digit4') selectWeapon(3);
        else if(e.code === 'Digit5') selectWeapon(4);
        else if(e.code === 'Digit6') selectWeapon(5);
        else if(e.code === 'Digit7') selectWeapon(6);
        else if(e.code === 'Digit8') selectWeapon(7);
        else if(e.code === 'KeyF') meleeAttack();
        else if(e.code === 'KeyG') throwGrenade();
        else if(e.code === 'KeyT' && G.mode === 'sandbox'){ if(G.state === 'sandbox') handlers.closeSandbox(); else handlers.openSandbox(); }
    });
    addEventListener('keyup', e => { G.keys[e.code] = false; });

    addEventListener('mousemove', e => {
        if(document.pointerLockElement !== rendererDom()) return;
        G.yaw   -= e.movementX * 0.0022 * G.settings.sensitivity;
        G.pitch = Math.max(-1.45, Math.min(1.45, G.pitch - e.movementY * 0.0022 * G.settings.sensitivity));
    });

    addEventListener('mousedown', e => {
        if(G.state !== 'playing') return;
        if(document.pointerLockElement !== rendererDom()){ requestLock(); return; }
        if(e.button === 0){ G.firing = true; if(!G.weapons[G.curWeapon].auto) tryShoot(); }
        else if(e.button === 2){ G.aiming = true; camera.fov = G.curWeapon === 5 ? 25 : (G.attach.scope ? 38 : 55); camera.updateProjectionMatrix(); document.getElementById('crosshair').classList.add('aim'); }
    });
    addEventListener('mouseup', e => {
        if(e.button === 0) G.firing = false;
        else if(e.button === 2){ G.aiming = false; camera.fov = 75; camera.updateProjectionMatrix(); document.getElementById('crosshair').classList.remove('aim'); }
    });
    addEventListener('contextmenu', e => e.preventDefault());
    addEventListener('wheel', e => { if(G.state === 'playing') cycleWeapon(e.deltaY > 0 ? 1 : -1); });
    document.addEventListener('pointerlockchange', () => handlers.onLockChange(document.pointerLockElement === rendererDom()));
}
