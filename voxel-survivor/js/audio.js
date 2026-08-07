import { G } from './state.js';

export const audio = {
    ctx: null, master: null, ready: false,
    init(){
        if(this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.master = this.ctx.createGain();
            this.master.gain.value = G.settings.volume;
            this.master.connect(this.ctx.destination);
            this.ready = true;
        } catch(e){ this.ready = false; }
    },
    resume(){ if(this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    setVolume(v){ if(this.master) this.master.gain.value = v; },

    tone(freq, dur, type='square', vol=0.05, slideTo=null){
        if(!this.ready) return;
        const t = this.ctx.currentTime;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = type; o.frequency.setValueAtTime(freq, t);
        if(slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1,slideTo), t+dur);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t+dur);
        o.connect(g); g.connect(this.master);
        o.start(t); o.stop(t+dur);
    },
    noise(dur, vol=0.05, filterFreq=900, type='lowpass'){
        if(!this.ready) return;
        const t = this.ctx.currentTime;
        const len = Math.floor(this.ctx.sampleRate * dur);
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for(let i=0;i<len;i++) data[i] = (Math.random()*2-1) * (1 - i/len);
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = filterFreq;
        const g = this.ctx.createGain(); g.gain.value = vol;
        src.connect(f); f.connect(g); g.connect(this.master);
        src.start(t);
    },

    shoot(kind){
        if(!this.ready) return;
        switch(kind){
            case 'pistol':  this.tone(680, 0.06, 'square', 0.05, 220); this.noise(0.05,0.04,1400); break;
            case 'smg':     this.tone(520, 0.04, 'square', 0.04, 180); this.noise(0.035,0.03,1600); break;
            case 'shotgun': this.tone(180, 0.18, 'sawtooth', 0.07, 70); this.noise(0.18,0.07,800); break;
            case 'rifle':   this.tone(820, 0.07, 'square', 0.06, 260); this.noise(0.06,0.045,1800); break;
            case 'flamer':  this.noise(0.05,0.03,700); this.tone(220,0.05,'sawtooth',0.02,140); break;
            default:        this.tone(600, 0.05, 'square', 0.05, 200);
        }
    },
    hit(){ this.tone(900, 0.03, 'square', 0.025); },
    headshot(){ this.tone(1500, 0.05, 'square', 0.04, 2200); this.tone(700,0.05,'sine',0.03); },
    zombieDie(){ this.tone(160, 0.2, 'sawtooth', 0.05, 60); this.noise(0.2,0.05,500); },
    explosion(){ this.tone(90, 0.4, 'sawtooth', 0.09, 35); this.noise(0.4, 0.1, 600); },
    pickup(){ this.tone(660, 0.1, 'sine', 0.05); this.tone(990, 0.12, 'sine', 0.04); },
    levelup(){ [523,659,784,1046].forEach((f,i)=>setTimeout(()=>this.tone(f,0.18,'triangle',0.05),i*90)); },
    wave(){ this.tone(330,0.25,'sawtooth',0.05,440); },
    click(){ this.tone(440,0.04,'square',0.04); },
    buy(){ this.tone(880,0.08,'square',0.05); this.tone(1320,0.1,'square',0.045, 1760); },
    shieldBreak(){ this.tone(300,0.3,'sawtooth',0.07,120); this.noise(0.25,0.06,1400,'bandpass'); },
    summon(){ this.tone(240,0.5,'sawtooth',0.04,90); this.tone(480,0.4,'square',0.03,120); },
    heartbeat(){ this.tone(70,0.14,'sine',0.07,45); setTimeout(()=>this.tone(60,0.12,'sine',0.05,40),140); },
    gameOverSting(){ [330,262,220,165].forEach((f,i)=>setTimeout(()=>this.tone(f,0.4,'sawtooth',0.05,f*0.9),i*180)); },
    groan(lo,hi){ this.tone(lo + Math.random()*(hi-lo), 0.25, 'sawtooth', 0.02, lo*0.6); },
    hurt(){ this.tone(140,0.15,'square',0.05,80); this.noise(0.1,0.03,400); },
    whoosh(){
        if(!this.ready) return;
        const t = this.ctx.currentTime, len = 0.7;
        const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate*len), this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for(let i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * (1 - i/d.length);
        const src = this.ctx.createBufferSource(); src.buffer = buf;
        const f = this.ctx.createBiquadFilter(); f.type = 'bandpass';
        f.frequency.setValueAtTime(220, t); f.frequency.exponentialRampToValueAtTime(2600, t+len); f.Q.value = 5;
        const g = this.ctx.createGain(); g.gain.value = 0.05;
        src.connect(f); f.connect(g); g.connect(this.master);
        src.start(t); src.stop(t+len);
    },
    thud(){ if(!this.ready) return; this.tone(60,0.5,'sine',0.09,28); this.noise(0.4,0.045,320); },
};
