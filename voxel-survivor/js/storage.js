const PROFILES_KEY = 'voxelProfiles';
const LEGACY_KEY = 'voxelSurvivor';
const ACTIVE_KEY = 'voxelActiveProfile';
const DEFAULT_NAME = 'SURVIVOR';

function dataKey(name){ return 'voxelProfile_' + name; }

function blankData(){
    return {
        career: { credits:0, upg:{ health:0, cash:0, grenades:0, rifle:0 } },
        settings: { sensitivity:1, volume:0.6, gfx:'medium' },
        best: { score:0, wave:0 },
        ownedWeapons: { 0:true, 1:false, 2:false, 3:false, 4:false, 5:false, 6:false, 7:false },
        leaderboard: [],
    };
}

function legacyData(){
    try {
        const raw = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
        if(!raw || typeof raw !== 'object') return null;
        return {
            career: raw.career, settings: raw.settings, best: raw.best,
            ownedWeapons: raw.ownedWeapons, leaderboard: raw.leaderboard,
        };
    } catch(e){ return null; }
}

export function getProfiles(){
    try {
        const l = JSON.parse(localStorage.getItem(PROFILES_KEY) || 'null');
        return (Array.isArray(l) && l.length) ? l : [];
    } catch(e){ return []; }
}

function saveProfiles(list){
    try { localStorage.setItem(PROFILES_KEY, JSON.stringify(list)); } catch(e){}
}

export function profileExists(name){
    return getProfiles().includes(name);
}

export function ensureProfile(){
    let list = getProfiles();
    if(!list.length){
        const legacy = legacyData();
        if(legacy){
            saveProfileData(DEFAULT_NAME, legacy);
            list = [DEFAULT_NAME];
            saveProfiles(list);
        } else {
            return null;
        }
    }
    let active = null;
    try { active = localStorage.getItem(ACTIVE_KEY); } catch(e){}
    if(!active || !list.includes(active)) active = list[0];
    try { localStorage.setItem(ACTIVE_KEY, active); } catch(e){}
    return active;
}

export function setActiveProfile(name){
    try { localStorage.setItem(ACTIVE_KEY, name); } catch(e){}
}

export function createProfile(name){
    name = (name || '').trim().toUpperCase().slice(0, 16);
    if(!name) return null;
    const list = getProfiles();
    if(list.includes(name)) return name;
    list.push(name);
    saveProfiles(list);
    saveProfileData(name, blankData());
    setActiveProfile(name);
    return name;
}

export function deleteProfile(name){
    let list = getProfiles();
    const i = list.indexOf(name);
    if(i < 0) return list[0];
    list.splice(i, 1);
    try { localStorage.removeItem(dataKey(name)); } catch(e){}
    if(!list.length) list = [DEFAULT_NAME];
    saveProfiles(list);
    if(!profileExists(list[0])) saveProfileData(list[0], blankData());
    setActiveProfile(list[0]);
    return list[0];
}

function num(v){ const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0; }

function sanitize(d){
    if(!d || typeof d !== 'object') return blankData();
    const c = d.career && typeof d.career === 'object' ? d.career : {};
    const u = c.upg && typeof c.upg === 'object' ? c.upg : {};
    d.career = {
        credits: num(c.credits),
        upg: { health: num(u.health), cash: num(u.cash), grenades: Math.max(num(u.grenades), num(u.nade)), rifle: num(u.rifle) },
    };
    if(!d.settings || typeof d.settings !== 'object') d.settings = blankData().settings;
    if(!d.best || typeof d.best !== 'object') d.best = blankData().best;
    if(!Array.isArray(d.ownedWeapons)) d.ownedWeapons = blankData().ownedWeapons;
    if(!Array.isArray(d.leaderboard)) d.leaderboard = [];
    return d;
}

export function loadProfileData(name){
    try {
        const d = JSON.parse(localStorage.getItem(dataKey(name)) || 'null');
        return sanitize(d);
    } catch(e){}
    return blankData();
}

function saveProfileData(name, data){
    try { localStorage.setItem(dataKey(name), JSON.stringify(data)); } catch(e){}
}

export function hydrate(G){
    if(!G.profile) return;
    const d = loadProfileData(G.profile);
    if(d.career) G.career = d.career;
    if(d.settings){
        const { kids, ...rest } = d.settings;
        G.settings = Object.assign({}, G.settings, rest);
    }
    if(d.best) G.best = d.best;
    if(d.ownedWeapons) G.ownedWeapons = d.ownedWeapons;
    if(d.leaderboard) G.leaderboard = d.leaderboard;
}

export function persist(G){
    saveProfileData(G.profile, {
        career: G.career,
        settings: G.settings,
        best: G.best,
        ownedWeapons: G.ownedWeapons,
        leaderboard: G.leaderboard,
    });
}
