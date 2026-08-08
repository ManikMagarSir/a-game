import { G } from './state.js';
import { SHOP_ITEMS, CAREER_UPGRADES, shopOwned } from './config.js';
import { openLevelUp as uiOpenLevelUp, hideLevelUp, renderShop, updateHUD } from './ui.js';
import { audio } from './audio.js';
import { requestLock } from './world.js';
import { persist } from './storage.js';

export function gainXp(amount){
    G.game.xp += amount;
    while(G.game.xp >= G.game.xpToNext){
        G.game.xp -= G.game.xpToNext;
        G.game.level++;
        G.game.xpToNext = Math.floor(G.game.xpToNext * 1.3 + 25);
        G.pendingLevelUps++;
    }
    if(G.pendingLevelUps > 0 && G.state === 'playing'){
        G.state = 'levelup';
        document.exitPointerLock();
        uiOpenLevelUp();
        audio.levelup();
    }
}

export function chooseAbility(a){
    a.apply(G);
    G.game.perks.push(a.ico + ' ' + a.name);
    G.pendingLevelUps--;
    updateHUD();
    if(G.pendingLevelUps > 0){
        uiOpenLevelUp();
    } else {
        hideLevelUp();
        G.state = 'playing';
        if(!G.touchDevice) requestLock();
    }
}

export function buyShopItem(index){
    const it = SHOP_ITEMS[index];
    if(!it) return;
    if(shopOwned(it, G)) return;
    if(G.game.cash < it.cost) return;
    G.game.cash -= it.cost;
    it.apply(G);
    if(!['medkit','ammo','nade'].includes(it.id)) G.game.bought.push(it.ico + ' ' + it.name);
    audio.buy();
    renderShop();
    updateHUD();
}

export function buyCareerUpgrade(index){
    const up = CAREER_UPGRADES[index];
    const lvl = up.id === 'rifle' ? G.career.upg.rifle : G.career.upg[up.id];
    if(lvl >= up.max) return false;
    const cost = up.cost(lvl);
    if(G.career.credits < cost) return false;
    G.career.credits -= cost;
    if(up.id === 'rifle') G.career.upg.rifle = 1; else G.career.upg[up.id] = lvl + 1;
    persist(G);
    audio.click();
    return true;
}

export function applyCareerEffects(){
    for(let i=0;i<G.career.upg.health;i++) CAREER_UPGRADES[0].effect(G);
    for(let i=0;i<G.career.upg.cash;i++)   CAREER_UPGRADES[1].effect(G);
    for(let i=0;i<G.career.upg.grenades;i++) CAREER_UPGRADES[2].effect(G);
    if(G.career.upg.rifle) CAREER_UPGRADES[3].effect(G);
}
