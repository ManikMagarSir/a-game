import { G } from './state.js';
import { spawnZombie } from './zombies.js';
import { audio } from './audio.js';
import { showBanner, updateHUD } from './ui.js';

export function startWave(){
    G.game.wave++;
    G.game.waveActive = true;
    const bossWave = G.mode === 'bossrush' || G.game.wave % 5 === 0;
    if(bossWave){
        spawnZombie('boss');
        G.game.toSpawn = 6 + G.game.wave;
    } else {
        G.game.toSpawn = 5 + G.game.wave*3;
    }
    G.game.spawnTimer = 0;
    showBanner(bossWave ? ('BOSS WAVE ' + G.game.wave) : ('WAVE ' + G.game.wave));
    audio.wave();
    updateHUD();
}

export function updateWaves(dt){
    if(G.mode === 'time' && G.game.timer > 0){
        G.game.timer -= dt;
        if(G.game.timer <= 0){
            G.game.timer = 0;
            G.overTitle = 'TIME UP!';
            G._onDeath && G._onDeath();
            return;
        }
    }
    if(G.game.waveActive){
        if(G.game.toSpawn > 0){
            G.game.spawnTimer -= dt;
            if(G.game.spawnTimer <= 0){
                let type = pickSpawnType();
                spawnZombie(type);
                G.game.toSpawn--;
                G.game.spawnTimer = Math.max(0.25, 1.1 - G.game.wave*0.05);
            }
        } else if(zombieCount() === 0){
            G.game.waveActive = false;
            G.game.intermission = 4;
            showBanner('WAVE CLEARED');
        }
    } else {
        G.game.intermission -= dt;
        if(G.game.intermission <= 0) startWave();
    }
}

function pickSpawnType(){
    const r = Math.random(), w = G.game.wave;
    if(G.mode === 'sandbox') return 'normal';
    if(w >= 6 && r < 0.12) return 'screamer';
    if(w >= 5 && r < 0.24) return 'shield';
    if(w >= 4 && r < 0.34) return 'spitter';
    if(w >= 5 && r < 0.42) return 'exploder';
    if(w >= 4 && r < 0.50) return 'brute';
    if(w >= 3 && r < 0.62) return 'runner';
    return 'normal';
}

import { zombies } from './zombies.js';
function zombieCount(){ return zombies.length; }
