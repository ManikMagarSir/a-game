import { G } from './state.js';
import { CAREER_UPGRADES } from './config.js';
import { buyCareerUpgrade } from './progression.js';
import { audio } from './audio.js';
import { persist, getProfiles, createProfile, deleteProfile, hydrate, setActiveProfile } from './storage.js';
import { applyGfx, serializeWorld, loadWorld } from './world.js';

let el = {};

export function initLobby(beginCb){
    el = {
        playBtn: document.getElementById('playBtn'),
        sensRange: document.getElementById('sensRange'),
        volRange: document.getElementById('volRange'),
        sensVal: document.getElementById('sensVal'),
        volVal: document.getElementById('volVal'),
        gfxSelect: document.getElementById('gfxSelect'),
        modeSelect: document.getElementById('modeSelect'),
        profileSelect: document.getElementById('profileSelect'),
        profileName: document.getElementById('profileName'),
        profileAdd: document.getElementById('profileAdd'),
        profileDel: document.getElementById('profileDel'),
        profileTag: document.getElementById('profileTag'),
        careerOpen: document.getElementById('careerOpen'),
        careerClose: document.getElementById('careerClose'),
        careerShop: document.getElementById('careerShop'),
        careerList: document.getElementById('careerList'),
        lobbyBestScore: document.getElementById('lobbyBestScore'),
        lobbyBestWave: document.getElementById('lobbyBestWave'),
        lobbyCredits: document.getElementById('lobbyCredits'),
        careerCredits2: document.getElementById('careerCredits2'),
        lbList: document.getElementById('lbList'),
        mapExport: document.getElementById('mapExport'),
        mapImport: document.getElementById('mapImport'),
        mapFile: document.getElementById('mapFile'),
    };

    el.playBtn.onclick = () => { audio.init(); beginCb(); };

    el.profileSelect.onchange = () => {
        if(el.profileSelect.value === G.profile) return;
        G.profile = el.profileSelect.value;
        setActiveProfile(G.profile);
        hydrate(G);
        syncControls();
        refreshLobby();
    };
    el.profileAdd.onclick = () => {
        const n = createProfile(el.profileName.value);
        if(!n){ alert('Enter a profile name (max 16 chars).'); return; }
        el.profileName.value = '';
        G.profile = n;
        hydrate(G);
        syncControls();
        refreshLobby();
    };
    el.profileDel.onclick = () => {
        if(!confirm('Delete profile "' + G.profile + '"? This cannot be undone.')) return;
        G.profile = deleteProfile(G.profile);
        hydrate(G);
        syncControls();
        refreshLobby();
    };

    el.sensRange.oninput = () => {
        G.settings.sensitivity = parseFloat(el.sensRange.value);
        el.sensVal.textContent = G.settings.sensitivity.toFixed(1);
        persist(G);
    };
    el.volRange.oninput = () => {
        G.settings.volume = parseFloat(el.volRange.value);
        el.volVal.textContent = G.settings.volume.toFixed(2);
        audio.setVolume(G.settings.volume);
        persist(G);
    };

    el.gfxSelect.onchange = () => {
        G.settings.gfx = el.gfxSelect.value;
        applyGfx();
        persist(G);
    };
    el.modeSelect.onchange = () => { G.mode = el.modeSelect.value; };

    el.careerOpen.onclick = () => { el.careerShop.classList.remove('hidden'); renderCareer(); };
    el.careerClose.onclick = () => el.careerShop.classList.add('hidden');

    el.mapExport.onclick = () => {
        const blob = new Blob([serializeWorld()], { type:'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'voxel-map.json';
        a.click();
        URL.revokeObjectURL(a.href);
        audio.click();
    };
    el.mapImport.onclick = () => el.mapFile.click();
    el.mapFile.onchange = (e) => {
        const f = e.target.files[0];
        if(!f) return;
        const r = new FileReader();
        r.onload = () => {
            try { loadWorld(r.result); audio.click(); }
            catch(err){ console.error('MAP IMPORT FAILED', err); alert('Map import failed: ' + err.message); }
        };
        r.readAsText(f);
        e.target.value = '';
    };

    const bootModal = document.getElementById('profileModal');
    const bootName = document.getElementById('profileNameBoot');
    function createBoot(){
        const n = createProfile(bootName.value);
        if(!n){ alert('Enter a profile name (max 16 chars).'); return; }
        bootName.value = '';
        G.profile = n;
        hydrate(G);
        bootModal.classList.add('hidden');
        syncControls();
        refreshLobby();
        audio.click();
    }
    document.getElementById('profileCreateBoot').onclick = createBoot;
    bootName.addEventListener('keydown', e => { if(e.key === 'Enter') createBoot(); });
    if(!G.profile){
        bootModal.classList.remove('hidden');
        bootName.focus();
    }

    syncControls();
    refreshLobby();
}

function syncControls(){
    el.sensRange.value = G.settings.sensitivity;
    el.volRange.value = G.settings.volume;
    el.sensVal.textContent = (+G.settings.sensitivity).toFixed(1);
    el.volVal.textContent = (+G.settings.volume).toFixed(2);
    el.gfxSelect.value = G.settings.gfx || 'medium';
    el.modeSelect.value = G.mode || 'endless';
    if(el.profileTag) el.profileTag.textContent = G.profile || '—';
}

function fillProfiles(){
    el.profileSelect.innerHTML = '';
    getProfiles().forEach(n => {
        const o = document.createElement('option');
        o.value = n; o.textContent = n;
        if(n === G.profile) o.selected = true;
        el.profileSelect.appendChild(o);
    });
}

export function refreshLobby(){
    fillProfiles();
    if(el.profileTag) el.profileTag.textContent = G.profile;
    el.lobbyBestScore.textContent = G.best.score || 0;
    el.lobbyBestWave.textContent = G.best.wave || 0;
    el.lobbyCredits.textContent = G.career.credits || 0;
    el.careerCredits2.textContent = G.career.credits || 0;
    el.lbList.innerHTML = G.leaderboard.length
        ? G.leaderboard.map((r,i) => (i+1) + '. ' + r.score + ' (' + r.wave + 'W, ' + r.mode + ')').join('<br>')
        : 'No runs yet — play a game!';
    if(!el.careerShop.classList.contains('hidden')) renderCareer();
}

function renderCareer(){
    el.careerList.innerHTML = '';
    CAREER_UPGRADES.forEach((up, idx) => {
        const lvl = up.id === 'rifle' ? G.career.upg.rifle : G.career.upg[up.id];
        const maxed = lvl >= up.max;
        const cost = up.cost(lvl);
        const div = document.createElement('div'); div.className = 'shop-item';
        const lvlText = up.max > 1 ? `LVL ${lvl}/${up.max}` : (lvl ? 'OWNED' : 'LOCKED');
        div.innerHTML = `<div class="top"><span class="iname">${up.ico} ${up.name}</span><span class="credits">${maxed ? '—' : '💎 '+cost}</span></div>
                         <div class="idesc">${up.desc}</div><div class="idesc" style="color:#9cf">${lvlText}</div>`;
        const btn = document.createElement('button'); btn.className = 'ibuy';
        btn.textContent = maxed ? 'MAX' : 'BUY';
        btn.disabled = maxed || G.career.credits < cost;
        btn.onclick = () => { if(buyCareerUpgrade(idx)) refreshLobby(); };
        div.appendChild(btn);
        el.careerList.appendChild(div);
    });
}
