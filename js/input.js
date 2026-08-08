import { G } from './state.js';
import { camera, renderer, requestLock } from './world.js';
import { tryShoot, meleeAttack, throwGrenade, cycleWeapon, selectWeapon } from './weapons.js';
import { zombies } from './zombies.js';
import { setAim } from './ui.js';
import { aimFov } from './config.js';

function rendererDom(){ return renderer ? renderer.domElement : null; }

const coarse = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

function touchPoint(e){ return e.changedTouches ? e.changedTouches[0] : e; }
function setTouchButton(id, down, fn){
    const el = document.getElementById(id);
    if(!el) return;
    const onDown = e => { e.preventDefault(); if(el.setPointerCapture && e.pointerId !== undefined) el.setPointerCapture(e.pointerId); down(true); if(fn) fn(); };
    const onUp = e => { e.preventDefault(); if(!fn) down(false); };
    el.addEventListener('pointerdown', onDown, { passive:false });
    if(!fn){ el.addEventListener('pointerup', onUp, { passive:false }); el.addEventListener('pointercancel', onUp, { passive:false }); el.addEventListener('pointerleave', onUp, { passive:false }); }
}

function setupTouch(){
    if(!coarse) return;
    G.touchDevice = true;
    const root = document.getElementById('touchControls');
    const stick = document.getElementById('moveStick');
    const knob = document.getElementById('moveKnob');
    const lookPad = document.getElementById('touchLookPad');
    if(!root || !stick || !knob) return;
    let active = false, id = null, cx = 0, cy = 0;
    let lookActive = false, lookId = null, lastLookX = 0, lastLookY = 0;
    const radius = 52;
    const update = e => {
        const p = touchPoint(e), dx = p.clientX - cx, dy = p.clientY - cy;
        const len = Math.hypot(dx, dy), scale = len > radius ? radius / len : 1;
        const x = dx * scale, y = dy * scale;
        knob.style.transform = `translate(${x}px,${y}px)`;
        G.touch.moveX = x / radius;
        G.touch.moveZ = y / radius;
    };
    stick.addEventListener('pointerdown', e => { e.preventDefault(); active = true; id = e.pointerId; const r = stick.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; stick.setPointerCapture(id); update(e); }, { passive:false });
    stick.addEventListener('pointermove', e => { if(active && e.pointerId === id) update(e); }, { passive:false });
    const reset = e => { if(e.pointerId !== id) return; active = false; G.touch.moveX = 0; G.touch.moveZ = 0; knob.style.transform = 'translate(0,0)'; };
    stick.addEventListener('pointerup', reset); stick.addEventListener('pointercancel', reset);
    if(lookPad){
        lookPad.addEventListener('pointerdown', e => {
            e.preventDefault(); lookActive = true; lookId = e.pointerId;
            lastLookX = e.clientX; lastLookY = e.clientY; lookPad.setPointerCapture(lookId);
        }, { passive:false });
        lookPad.addEventListener('pointermove', e => {
            if(!lookActive || e.pointerId !== lookId) return;
            e.preventDefault();
            const dx = e.clientX - lastLookX, dy = e.clientY - lastLookY;
            lastLookX = e.clientX; lastLookY = e.clientY;
            G.yaw -= dx * 0.012 * G.settings.sensitivity;
            G.pitch = Math.max(-1.45, Math.min(1.45, G.pitch - dy * 0.012 * G.settings.sensitivity));
        }, { passive:false });
        const resetLook = e => { if(e.pointerId !== lookId) return; lookActive = false; lookId = null; };
        lookPad.addEventListener('pointerup', resetLook); lookPad.addEventListener('pointercancel', resetLook);
    }
    setTouchButton('touchAim', on => {
        G.aiming = on;
        camera.fov = on ? aimFov(G.curWeapon, G) : 75;
        camera.updateProjectionMatrix();
        document.getElementById('crosshair').classList.toggle('aim', on);
        setAim(on);
    });
    setTouchButton('touchFire', on => { G.touch.fire = on; G.firing = on; if(on && !G.weapons[G.curWeapon].auto) tryShoot(); });
    setTouchButton('touchSprint', on => { G.touch.sprint = on; });
    setTouchButton('touchMelee', () => meleeAttack(), () => {});
    setTouchButton('touchGrenade', () => throwGrenade(), () => {});
    setTouchButton('touchSwap', () => cycleWeapon(1), () => {});
    root.classList.add('hidden');
}

export function setTouchVisible(on){
    const root = document.getElementById('touchControls');
    if(root && G.touchDevice) root.classList.toggle('hidden', !on);
}

export function initInput(handlers){
    setupTouch();
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
        if(coarse) return;
        if(G.state !== 'playing') return;
        if(document.pointerLockElement !== rendererDom()){ requestLock(); return; }
        if(e.button === 0){ G.firing = true; if(!G.weapons[G.curWeapon].auto) tryShoot(); }
        else if(e.button === 2){ G.aiming = true; camera.fov = aimFov(G.curWeapon, G); camera.updateProjectionMatrix(); document.getElementById('crosshair').classList.add('aim'); setAim(true); }
    });
    addEventListener('mouseup', e => {
        if(e.button === 0) G.firing = false;
        else if(e.button === 2){ G.aiming = false; camera.fov = 75; camera.updateProjectionMatrix(); document.getElementById('crosshair').classList.remove('aim'); setAim(false); }
    });
    addEventListener('contextmenu', e => e.preventDefault());
    addEventListener('wheel', e => { if(!coarse && G.state === 'playing') cycleWeapon(e.deltaY > 0 ? 1 : -1); });
    document.addEventListener('pointerlockchange', () => { if(!G.touchDevice) handlers.onLockChange(document.pointerLockElement === rendererDom()); });
}
