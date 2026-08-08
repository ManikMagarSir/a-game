import { G } from './state.js';
import { spawnZombie, zombies, clearTransientEntities } from './zombies.js';
import { audio } from './audio.js';
import { showBanner, updateHUD } from './ui.js';
import { EXTRACTION } from './config.js';
import { setArenaForWave, getArenaName, getEvacPoint, showEvac } from './world.js';

export function startWave(){
    if(G.mode === 'extraction' && G.game.wave >= EXTRACTION.waves) return;

    const previousArena = G.game.arena;
    G.game.wave++;
    const arena = setArenaForWave(G.game.wave);
    G.game.arena = arena.id;
    if(previousArena !== arena.id){
        clearTransientEntities();
        G.player.pos.set(0, G.player.y, 0);
        showBanner('ENTERING · ' + arena.name);
    }
    G.game.waveActive = true;
    G.game.extracting = false;
    showEvac(false);

    const bossWave = G.mode === 'hunt'
        || (G.mode === 'extraction' && G.game.wave === EXTRACTION.waves)
        || (G.mode === 'survival' && G.game.wave % 5 === 0);
    if(bossWave){
        spawnZombie('boss');
        G.game.toSpawn = G.mode === 'extraction' ? 7 + G.game.wave : 6 + G.game.wave;
    } else {
        G.game.toSpawn = G.mode === 'extraction' ? 5 + G.game.wave * 2 : 5 + G.game.wave * 3;
    }
    G.game.spawnTimer = 0;
    showBanner((bossWave ? 'BOSS WAVE ' : 'WAVE ') + G.game.wave + ' · ' + getArenaName());
    audio.wave();
    updateHUD();
}

export function updateWaves(dt){
    if(G.game.waveActive){
        if(G.game.toSpawn > 0){
            G.game.spawnTimer -= dt;
            if(G.game.spawnTimer <= 0){
                spawnZombie(pickSpawnType());
                G.game.toSpawn--;
                G.game.spawnTimer = Math.max(0.25, 1.1 - G.game.wave * 0.05);
            }
        } else if(zombies.length === 0){
            if(G.mode === 'extraction' && G.game.wave >= EXTRACTION.waves){
                G.game.waveActive = false;
                G.game.extracting = true;
                showEvac(true);
                showBanner('DISTRICT CLEAR · REACH THE FLARE');
                updateHUD();
                return;
            }
            G.game.waveActive = false;
            G.game.intermission = 4;
            showBanner('DISTRICT CLEAR · ' + getArenaName());
        }
    } else if(G.game.extracting){
        const evac = getEvacPoint();
        const dx = G.player.pos.x - evac.x;
        const dz = G.player.pos.z - evac.z;
        if(dx * dx + dz * dz < 16){
            G.game.extracting = false;
            showEvac(false);
            G.overTitle = 'EXTRACTION COMPLETE';
            G._onDeath && G._onDeath();
        }
    } else {
        G.game.intermission -= dt;
        if(G.game.intermission <= 0) startWave();
    }
}

function pickSpawnType(){
    const r = Math.random();
    const w = G.game.wave;
    if(G.mode === 'sandbox') return 'normal';
    if(w >= 6 && r < 0.12) return 'screamer';
    if(w >= 5 && r < 0.24) return 'shield';
    if(w >= 4 && r < 0.34) return 'spitter';
    if(w >= 5 && r < 0.42) return 'exploder';
    if(w >= 4 && r < 0.50) return 'brute';
    if(w >= 3 && r < 0.62) return 'runner';
    if(w >= 3 && r < 0.72) return 'crawler';
    return 'normal';
}
