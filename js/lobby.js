import { G } from './state.js';
import { CAREER_UPGRADES, MODES } from './config.js';
import { buyCareerUpgrade } from './progression.js';
import { audio } from './audio.js';
import { persist, getProfiles, createProfile, deleteProfile, hydrate, setActiveProfile } from './storage.js';
import { applyGfx } from './world.js';

let el = {};

export function initLobby(beginCb){
    el = {
        playBtn: document.getElementById('playBtn'),
        sensBtn: document.getElementById('sensBtn'),
        volBtn: document.getElementById('volBtn'),
        gfxBtn: document.getElementById('gfxBtn'),
        sensVal: document.getElementById('sensVal'),
        volVal: document.getElementById('volVal'),
        gfxVal: document.getElementById('gfxVal'),
        modeBtn: document.getElementById('modeBtn'),
        modePick: document.getElementById('modePick'),
        modePickClose: document.getElementById('modePickClose'),
        modeList: document.getElementById('modeList'),
        settingsOpen: document.getElementById('settingsOpen'),
        settingsClose: document.getElementById('settingsClose'),
        settingsPanel: document.getElementById('settingsPanel'),
        profileOpen: document.getElementById('profileOpen'),
        profileClose: document.getElementById('profileClose'),
        profilePanel: document.getElementById('profilePanel'),
        profilePanelTag: document.getElementById('profilePanelTag'),
        historyOpen: document.getElementById('historyOpen'),
        historyClose: document.getElementById('historyClose'),
        historyPanel: document.getElementById('historyPanel'),
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

    el.sensBtn.onclick = () => {
        const steps = [0.6, 1, 1.4, 1.8];
        const current = steps.indexOf(+G.settings.sensitivity);
        G.settings.sensitivity = steps[(current + 1) % steps.length];
        syncControls();
        persist(G);
        audio.click();
    };
    el.volBtn.onclick = () => {
        G.settings.volume = G.settings.volume > 0 ? 0 : 0.6;
        syncControls();
        audio.setVolume(G.settings.volume);
        persist(G);
        audio.click();
    };
    el.gfxBtn.onclick = () => {
        const steps = ['low', 'medium', 'high'];
        const current = steps.indexOf(G.settings.gfx || 'medium');
        G.settings.gfx = steps[(current + 1) % steps.length];
        applyGfx();
        syncControls();
        persist(G);
        audio.click();
    };
    const closePanels = () => [el.settingsPanel, el.profilePanel, el.historyPanel, el.careerShop, el.modePick].forEach(panel => panel?.classList.add('hidden'));
    const openPanel = panel => { closePanels(); panel?.classList.remove('hidden'); audio.click(); };
    el.settingsOpen.onclick = () => openPanel(el.settingsPanel);
    el.settingsClose.onclick = closePanels;
    el.profileOpen.onclick = () => openPanel(el.profilePanel);
    el.profileClose.onclick = closePanels;
    el.historyOpen.onclick = () => openPanel(el.historyPanel);
    el.historyClose.onclick = closePanels;
    el.modeBtn.onclick = () => { renderModes(); openPanel(el.modePick); };
    el.modePickClose.onclick = closePanels;

    el.careerOpen.onclick = () => { openPanel(el.careerShop); renderCareer(); };
    el.careerClose.onclick = closePanels;

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
    const aimLabels = { 0.6:'LOW', 1:'NORMAL', 1.4:'FAST', 1.8:'VERY FAST' };
    const quality = (G.settings.gfx || 'medium').toUpperCase();
    el.sensVal.textContent = aimLabels[+G.settings.sensitivity] || 'NORMAL';
    el.volVal.textContent = G.settings.volume > 0 ? 'ON' : 'OFF';
    el.gfxVal.textContent = quality;
    if(el.modeBtn && MODES[G.mode]) {
        const value = el.modeBtn.querySelector('.mode-value');
        if(value) value.textContent = MODES[G.mode].name;
        else el.modeBtn.innerHTML = '<span class="quick-setting-label">MODE</span><strong class="mode-value">' + MODES[G.mode].name + '</strong><span class="mode-chev">▾</span>';
    }
    if(el.profileTag) el.profileTag.textContent = G.profile || '—';
    if(el.profilePanelTag) el.profilePanelTag.textContent = G.profile || '—';
}

function renderModes(){
    el.modeList.innerHTML = '';
    Object.entries(MODES).forEach(([key, m]) => {
        const div = document.createElement('div');
        div.className = 'mode-card' + (key === G.mode ? ' selected' : '');
        div.innerHTML = `<div class="mode-ico">${m.ico}</div>
            <div class="mode-name">${m.name}</div>
            <div class="mode-desc">${m.desc}</div>
            <div class="mode-state">${key === G.mode ? 'SELECTED' : 'CLICK TO SELECT'}</div>`;
        div.onclick = () => {
            if(key !== G.mode){ G.mode = key; persist(G); }
            syncControls();
            el.modePick.classList.add('hidden');
            audio.click();
        };
        el.modeList.appendChild(div);
    });
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
    if(el.profilePanelTag) el.profilePanelTag.textContent = G.profile;
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
