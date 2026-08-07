import { G } from './state.js';
import { audio } from './audio.js';

const BPM = 128;
const STEP = 60 / BPM / 4;
const BASS = [110.0, 130.81, 146.83, 164.81, 98.0];
const BASS_PAT = [0,0,2,0, 3,0,2,0, 0,0,2,0, 3,4,2,0];
const LEAD = [440.0, 523.25, 587.33, 659.25, 783.99, 880.0];
const LEAD_PAT = [0,2,1,3, 2,4,3,5, 3,2,4,3, 1,3,2,0];

export const music = {
    timer: null, step: 0, nextTime: 0, intensity: 0.2, running: false,

    start(){
        if(this.running) return;
        if(!audio.ctx){ audio.init(); if(!audio.ctx) return; }
        this.running = true;
        this.step = 0;
        this.nextTime = audio.ctx.currentTime + 0.12;
        this.timer = setInterval(() => this.scheduler(), 30);
    },
    stop(){
        this.running = false;
        if(this.timer) clearInterval(this.timer);
        this.timer = null;
    },
    setIntensity(v){ this.intensity = Math.max(0, Math.min(1, v)); },

    scheduler(){
        if(!audio.ctx || !this.running) return;
        while(this.nextTime < audio.ctx.currentTime + 0.14){
            this.scheduleStep(this.step, this.nextTime);
            this.nextTime += STEP;
            this.step = (this.step + 1) % 16;
        }
    },

    scheduleStep(step, t){
        const i = this.intensity;
        const beat = step % 4;
        if(beat === 0 && i > 0.30) this.kick(t, i);
        if(step % 8 === 4 && i > 0.45) this.snare(t, i);
        if(step % 2 === 1 && i > 0.55) this.hat(t, i);
        if(beat === 0) this.bass(t, BASS[BASS_PAT[step]], i > 0.6 ? 1 : 0.55);
        else if(beat === 2 && i > 0.4) this.bass(t, BASS[BASS_PAT[step]], 0.4);
        if(i > 0.55 && step % 2 === 0) this.lead(t, LEAD[LEAD_PAT[step]], i);
        if(beat === 0 && i > 0.25) this.pad(t, i);
    },

    kick(t, i){
        const o = audio.ctx.createOscillator(), g = audio.ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(150, t);
        o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
        g.gain.setValueAtTime(0.5 * i, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        o.connect(g); g.connect(audio.master);
        o.start(t); o.stop(t + 0.24);
    },
    snare(t, i){
        const len = Math.floor(audio.ctx.sampleRate * 0.12);
        const buf = audio.ctx.createBuffer(1, len, audio.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for(let k=0;k<len;k++) d[k] = (Math.random()*2-1) * (1 - k/len);
        const src = audio.ctx.createBufferSource(); src.buffer = buf;
        const f = audio.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2000; f.Q.value = 0.8;
        const g = audio.ctx.createGain(); g.gain.value = 0.3 * i;
        src.connect(f); f.connect(g); g.connect(audio.master);
        src.start(t);
        this.tone(t, 220, 0.06, 'triangle', 0.12 * i, 130);
    },
    hat(t, i){
        const len = Math.floor(audio.ctx.sampleRate * 0.04);
        const buf = audio.ctx.createBuffer(1, len, audio.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for(let k=0;k<len;k++) d[k] = (Math.random()*2-1) * (1 - k/len);
        const src = audio.ctx.createBufferSource(); src.buffer = buf;
        const f = audio.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
        const g = audio.ctx.createGain(); g.gain.value = 0.16 * i;
        src.connect(f); f.connect(g); g.connect(audio.master);
        src.start(t);
    },
    bass(t, freq, vol){
        const o = audio.ctx.createOscillator(), g = audio.ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.value = freq;
        const f = audio.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 340 + this.intensity * 400;
        g.gain.setValueAtTime(0.22 * vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + STEP * 0.9);
        o.connect(f); f.connect(g); g.connect(audio.master);
        o.start(t); o.stop(t + STEP);
    },
    lead(t, freq, i){
        const o = audio.ctx.createOscillator(), g = audio.ctx.createGain();
        o.type = 'square';
        o.frequency.value = freq;
        const f = audio.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400 + i * 1200;
        g.gain.setValueAtTime(0.07 * i, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + STEP * 1.6);
        o.connect(f); f.connect(g); g.connect(audio.master);
        o.start(t); o.stop(t + STEP * 1.7);
    },
    pad(t, i){
        [220, 329.63, 392].forEach((freq, n) => {
            const o = audio.ctx.createOscillator(), g = audio.ctx.createGain();
            o.type = 'sine';
            o.frequency.value = freq;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(0.05 * i, t + 0.6);
            g.gain.setValueAtTime(0.05 * i, t + STEP * 2.2);
            g.gain.linearRampToValueAtTime(0.0001, t + STEP * 3.6);
            o.connect(g); g.connect(audio.master);
            o.start(t); o.stop(t + STEP * 3.7);
        });
    },
    tone(t, freq, dur, type, vol, slideTo){
        const o = audio.ctx.createOscillator(), g = audio.ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(freq, t);
        if(slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(audio.master);
        o.start(t); o.stop(t + dur);
    },
};

export function combatIntensity(){
    const n = G.game.wave;
    return Math.min(1, 0.35 + n * 0.06 + G.game.toSpawn * 0.01);
}
