export const WEAPONS = [
    { id:0, name:'PISTOL',  auto:false, dmg:34, cd:0.22,  pellets:1, spread:0.012, mag:12, reload:1.1, range:200, recoil:0.020, sfx:'pistol' },
    { id:1, name:'SMG',     auto:true,  dmg:16, cd:0.060, pellets:1, spread:0.030, mag:32, reload:1.4, range:170, recoil:0.012, sfx:'smg' },
    { id:2, name:'SHOTGUN', auto:false, dmg:11, cd:0.72,  pellets:9, spread:0.11,  mag:7,  reload:1.9, range:85,  recoil:0.055, sfx:'shotgun' },
    { id:3, name:'RIFLE',   auto:true,  dmg:42, cd:0.11,  pellets:1, spread:0.014, mag:25, reload:1.6, range:260, recoil:0.030, sfx:'rifle' },
    { id:4, name:'LMG',     auto:true,  dmg:22, cd:0.075, pellets:1, spread:0.035, mag:80, reload:2.4, range:220, recoil:0.018, sfx:'smg' },
    { id:5, name:'SNIPER',  auto:false, dmg:150, cd:1.1,  pellets:1, spread:0.001, mag:6,  reload:2.2, range:400, recoil:0.090, sfx:'rifle' },
    { id:6, name:'CROSSBOW',auto:false, dmg:90, cd:0.9,   pellets:1, spread:0.003, mag:1,  reload:1.8, range:300, recoil:0.020, sfx:'pistol' },
    { id:7, name:'FLAMER',  auto:true,  dmg:8,  cd:0.05,  pellets:1, spread:0.05,  mag:100,reload:2.0, range:40,  recoil:0.008, sfx:'flamer' },
];

export function effMag(w, G){ return w.mag + (G ? G.mult.mag + (G.attach ? G.attach.mag : 0) : 0); }

export const ABILITIES = [
    { id:'dmg',    ico:'🔥', name:'High Caliber',  desc:'+25% bullet damage.',         apply:G=>{ G.mult.damage *= 1.25; } },
    { id:'rof',    ico:'⚡', name:'Rapid Fire',     desc:'+18% fire rate.',            apply:G=>{ G.mult.fireRate *= 0.82; } },
    { id:'hp',     ico:'❤️', name:'Vitality',       desc:'+30 max health & heal.',     apply:G=>{ G.player.maxHealth+=30; G.player.health=Math.min(G.player.maxHealth,G.player.health+30); } },
    { id:'speed',  ico:'🏃', name:'Adrenaline',     desc:'+13% move speed.',           apply:G=>{ G.mult.speed *= 1.13; } },
    { id:'multi',  ico:'🌀', name:'Multishot',      desc:'+1 pellet to all guns.',      apply:G=>{ G.mult.pellets += 1; } },
    { id:'pierce', ico:'➡️', name:'Piercing Rounds',desc:'Bullets pierce +1 zombie.',  apply:G=>{ G.mult.pierce += 1; } },
    { id:'head',   ico:'🎯', name:'Sharpshooter',   desc:'+40% headshot damage.',      apply:G=>{ G.mult.head += 0.4; } },
    { id:'vamp',   ico:'🩸', name:'Vampire',        desc:'Heal 3 HP per kill.',        apply:G=>{ G.mult.lifesteal += 3; } },
];

export const ZTYPES = {
    normal: { hp:60,  speed:1.7,  scale:1.0,  color:0x4a7a3a, dmg:8,  score:10,  cash:8,   groan:[60,90] },
    runner: { hp:32,  speed:3.4,  scale:0.85, color:0xb6a23a, dmg:6,  score:14,  cash:12,  groan:[90,130] },
    brute:  { hp:180, speed:1.05, scale:1.7,  color:0x7a2a2a, dmg:18, score:26,  cash:24,  groan:[45,70] },
    boss:   { hp:1600, speed:2.0, scale:2.8,  color:0x7a2a9a, dmg:40, score:200, cash:220, groan:[40,60] },
    spitter:{ hp:45,  speed:2.2,  scale:0.95, color:0x3a9a5a, dmg:10, score:18,  cash:16,  groan:[70,110], ranged:true },
    exploder:{ hp:50, speed:2.6,  scale:0.9,  color:0x9a4a2a, dmg:26, score:20,  cash:18,  groan:[50,80], boom:true },
    screamer:{ hp:70, speed:1.5,  scale:1.1,  color:0x7a5a9a, dmg:5,  score:30,  cash:26,  groan:[120,180], summon:true },
    shield: { hp:220, speed:1.0,  scale:1.5,  color:0x5a6a7a, dmg:14, score:32,  cash:28,  groan:[40,60], shielded:true },
};

export const SHOP_ITEMS = [
    { id:'medkit',  name:'Medkit',        ico:'➕', desc:'Heal 50 HP',            cost:150, apply:G=>{ G.player.health=Math.min(G.player.maxHealth,G.player.health+50); } },
    { id:'nade',    name:'Grenades x3',   ico:'💣', desc:'+3 grenades',           cost:120, apply:G=>{ G.player.grenades+=3; } },
    { id:'dmg',     name:'Damage +10%',   ico:'🔥', desc:'Permanent +10% damage',  cost:200, apply:G=>{ G.mult.damage*=1.10; } },
    { id:'rof',     name:'Fire Rate +8%', ico:'⚡', desc:'Permanent +8% RoF',      cost:200, apply:G=>{ G.mult.fireRate*=0.92; } },
    { id:'hp',      name:'Max HP +20',    ico:'❤️', desc:'+20 max HP & heal',     cost:160, apply:G=>{ G.player.maxHealth+=20; G.player.health+=20; } },
    { id:'spd',     name:'Speed +8%',     ico:'🏃', desc:'+8% move speed',         cost:160, apply:G=>{ G.mult.speed*=1.08; } },
    { id:'unlock1', name:'Unlock SMG',    ico:'🔫', desc:'Add SMG to loadout',     cost:300, once:true, key:'w1', apply:G=>{ G.ownedWeapons[1]=true; } },
    { id:'unlock2', name:'Unlock Shotgun',ico:'🔫', desc:'Add Shotgun to loadout', cost:400, once:true, key:'w2', apply:G=>{ G.ownedWeapons[2]=true; } },
    { id:'unlock3', name:'Unlock Rifle',  ico:'🔫', desc:'Add Rifle to loadout',   cost:500, once:true, key:'w3', apply:G=>{ G.ownedWeapons[3]=true; } },
    { id:'unlock4', name:'Unlock LMG',    ico:'🔫', desc:'Add LMG to loadout',     cost:600, once:true, key:'w4', apply:G=>{ G.ownedWeapons[4]=true; } },
    { id:'unlock5', name:'Unlock Sniper', ico:'🔫', desc:'Add Sniper to loadout',  cost:700, once:true, key:'w5', apply:G=>{ G.ownedWeapons[5]=true; } },
    { id:'unlock6', name:'Unlock Crossbow',ico:'🏹',desc:'Add Crossbow to loadout',cost:550, once:true, key:'w6', apply:G=>{ G.ownedWeapons[6]=true; } },
    { id:'unlock7', name:'Unlock Flamethrower',ico:'🔥',desc:'Add Flamethrower to loadout', cost:800, once:true, key:'w7', apply:G=>{ G.ownedWeapons[7]=true; } },
    { id:'attSup',  name:'Suppressor',    ico:'🔇', desc:'-40% recoil, quieter shots', cost:400, once:true, key:'sup', apply:G=>{ G.attach.sup = 1; } },
    { id:'attScope',name:'Tactical Scope',ico:'🔭', desc:'Deeper aim zoom',        cost:450, once:true, key:'scope', apply:G=>{ G.attach.scope = 1; } },
];

export function shopOwned(it, G){
    if(!it.once || !it.key) return false;
    if(it.key[0] === 'w') return !!G.ownedWeapons[+it.key[1]];
    return !!G.attach[it.key];
}

export const CAREER_UPGRADES = [
    { id:'health', name:'Toughness', ico:'❤️', desc:'+20 starting HP',        max:5, cost:l=>200+l*150, effect:G=>{ G.player.maxHealth+=20; G.player.health+=20; } },
    { id:'cash',   name:'War Chest', ico:'💰', desc:'+100 starting cash',     max:5, cost:l=>150+l*100, effect:G=>{ G.game.cash+=100; } },
    { id:'grenades', name:'Demo Man',  ico:'💣', desc:'+1 starting grenade',    max:3, cost:l=>250+l*200, effect:G=>{ G.player.grenades+=1; } },
    { id:'rifle',  name:'Veteran',   ico:'🎖️', desc:'Start with Rifle unlocked', max:1, cost:()=>600,    effect:G=>{ G.ownedWeapons[3]=true; } },
];

export const MODES = {
    endless:  { name:'ENDLESS HORDE',  desc:'Survive escalating waves as long as you can.' },
    time:     { name:'TIME ATTACK',    desc:'Survive 3 minutes. Score big before time runs out.' },
    bossrush: { name:'BOSS RUSH',      desc:'A boss every wave. How many can you down?' },
    defense:  { name:'WAVE DEFENSE',   desc:'Protect the beacon from the horde.' },
    sandbox:  { name:'SANDBOX',        desc:'God mode + spawn menu (T). No challenge, all chaos.' },
};
