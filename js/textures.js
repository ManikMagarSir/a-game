function tex(w, h, fn){
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    fn(ctx, w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.NearestFilter;
    return t;
}

export function crateTexture(){
    return tex(128, 128, (ctx,w,h)=>{
        const rows = 4;
        for(let r=0;r<rows;r++){
            ctx.fillStyle = r % 2 ? '#6b4a2b' : '#57371f';
            ctx.fillRect(0, r*h/rows, w, h/rows);
        }
        ctx.strokeStyle = 'rgba(24,14,6,0.85)';
        ctx.lineWidth = 2;
        for(let r=1;r<rows;r++){ ctx.beginPath(); ctx.moveTo(0, r*h/rows); ctx.lineTo(w, r*h/rows); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        for(let x=1;x<4;x++){ ctx.beginPath(); ctx.moveTo(x*w/4, 0); ctx.lineTo(x*w/4, h); ctx.stroke(); }
        ctx.fillStyle = '#26262b';
        for(let r=0;r<rows;r++) for(let x=0;x<3;x++){
            ctx.beginPath();
            ctx.arc(w*0.14 + x*w*0.36, r*h/rows + h/rows*0.5, 2.5, 0, Math.PI*2);
            ctx.fill();
        }
        for(let i=0;i<500;i++){
            ctx.fillStyle = 'rgba(16,10,4,' + (Math.random()*0.3) + ')';
            ctx.fillRect(Math.random()*w, Math.random()*h, 3, 3);
        }
    });
}

export function groundTexture(a){
    return tex(64, 64, (ctx,w,h)=>{
        ctx.fillStyle = a ? '#7e9a62' : '#91aa70';
        ctx.fillRect(0,0,w,h);
        for(let i=0;i<260;i++){
            ctx.fillStyle = 'rgba(' + (Math.random()<0.5 ? '96,126,63' : '48,72,38') + ',' + Math.random()*0.45 + ')';
            ctx.fillRect(Math.random()*w, Math.random()*h, 2, 2);
        }
        for(let i=0;i<40;i++){
            ctx.fillStyle = 'rgba(174,194,119,0.35)';
            ctx.fillRect(Math.random()*w, Math.random()*h, 6, 2);
        }
    });
}

export function rockTexture(){
    return tex(64, 64, (ctx,w,h)=>{
        ctx.fillStyle = '#5e6367';
        ctx.fillRect(0,0,w,h);
        for(let i=0;i<300;i++){
            ctx.fillStyle = 'rgba(' + (Math.random()<0.5 ? '120,125,130' : '40,44,48') + ',' + Math.random()*0.4 + ')';
            ctx.fillRect(Math.random()*w, Math.random()*h, 3, 2);
        }
    });
}

export function fleshTexture(){
    return tex(64, 64, (ctx,w,h)=>{
        ctx.fillStyle = '#71805a';
        ctx.fillRect(0,0,w,h);
        for(let i=0;i<700;i++){
            ctx.fillStyle = 'rgba(' + (Math.random()<0.5 ? '40,58,34' : '120,140,95') + ',' + Math.random()*0.4 + ')';
            ctx.fillRect(Math.random()*w, Math.random()*h, 2, 2);
        }
        for(let i=0;i<60;i++){
            ctx.fillStyle = 'rgba(20,30,16,0.35)';
            ctx.beginPath();
            ctx.arc(Math.random()*w, Math.random()*h, 1.5+Math.random()*2, 0, Math.PI*2);
            ctx.fill();
        }
    });
}

export function metalTexture(){
    return tex(64, 64, (ctx,w,h)=>{
        ctx.fillStyle = '#33363c';
        ctx.fillRect(0,0,w,h);
        for(let i=0;i<320;i++){
            ctx.fillStyle = 'rgba(' + (Math.random()<0.5 ? '255,255,255' : '0,0,0') + ',' + (Math.random()*0.14) + ')';
            ctx.fillRect(Math.random()*w, Math.random()*h, 2, 1);
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(2,2,w-4,h-4);
        ctx.beginPath(); ctx.moveTo(0,h/2); ctx.lineTo(w,h/2); ctx.stroke();
    });
}

export function glowTexture(){
    return tex(64, 64, (ctx,w,h)=>{
        const g = ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.35, 'rgba(255,220,120,0.85)');
        g.addColorStop(1, 'rgba(255,150,50,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0,0,w,h);
    });
}

export function asphaltTexture(){
    return tex(128, 128, (ctx,w,h)=>{
        ctx.fillStyle = '#25282c';
        ctx.fillRect(0,0,w,h);
        for(let i=0;i<900;i++){
            const v = 22 + Math.floor(Math.random()*28);
            ctx.fillStyle = `rgba(${v},${v+2},${v+4},${0.18 + Math.random()*0.22})`;
            ctx.fillRect(Math.random()*w, Math.random()*h, 1 + Math.random()*3, 1 + Math.random()*2);
        }
        ctx.strokeStyle = 'rgba(8,10,12,.35)';
        ctx.lineWidth = 1;
        for(let i=0;i<8;i++){
            const y = Math.random()*h;
            ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y + (Math.random()-.5)*8); ctx.stroke();
        }
    });
}

export function plasterTexture(base='#8c6654', accent='#b4876b'){
    return tex(128, 128, (ctx,w,h)=>{
        ctx.fillStyle = base; ctx.fillRect(0,0,w,h);
        for(let i=0;i<650;i++){
            const light = Math.random() > .5;
            ctx.fillStyle = light ? 'rgba(255,235,210,.08)' : 'rgba(20,10,8,.12)';
            ctx.fillRect(Math.random()*w, Math.random()*h, 2+Math.random()*8, 1+Math.random()*4);
        }
        ctx.strokeStyle = accent; ctx.globalAlpha = .28; ctx.lineWidth = 2;
        for(let y=18;y<h;y+=27){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y + 2); ctx.stroke(); }
        ctx.globalAlpha = 1;
    });
}

export function roofTexture(base='#292b32'){
    return tex(128, 128, (ctx,w,h)=>{
        ctx.fillStyle = base; ctx.fillRect(0,0,w,h);
        ctx.strokeStyle = 'rgba(0,0,0,.32)'; ctx.lineWidth = 3;
        for(let x=-h;x<w+h;x+=14){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x+h,h); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,255,255,.08)';
        for(let i=0;i<70;i++) ctx.fillRect(Math.random()*w,Math.random()*h,1,1);
    });
}

export function concreteTexture(){
    return tex(128, 128, (ctx,w,h)=>{
        ctx.fillStyle = '#77766f'; ctx.fillRect(0,0,w,h);
        for(let i=0;i<500;i++){
            const a = .08 + Math.random()*.2;
            ctx.fillStyle = Math.random()>.5 ? `rgba(255,255,255,${a})` : `rgba(25,25,25,${a})`;
            ctx.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*5,1+Math.random()*3);
        }
        ctx.strokeStyle = 'rgba(35,35,32,.28)'; ctx.lineWidth = 1;
        for(let y=32;y<h;y+=32){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
    });
}

export function windowTexture(glow='#d7a05c'){
    return tex(64, 64, (ctx,w,h)=>{
        ctx.fillStyle = '#11181d'; ctx.fillRect(0,0,w,h);
        ctx.fillStyle = glow; ctx.globalAlpha = .82; ctx.fillRect(6,6,w-12,h-12);
        ctx.globalAlpha = .22; ctx.fillStyle = '#fff3bd'; ctx.fillRect(10,9,w-20,9);
        ctx.globalAlpha = 1; ctx.fillStyle = '#263039'; ctx.fillRect(w/2-2,5,4,h-10); ctx.fillRect(5,h/2-2,w-10,4);
    });
}

export function skyTexture(){
    return tex(2, 512, (ctx,w,h)=>{
        const g = ctx.createLinearGradient(0,0,0,h);
        g.addColorStop(0,   '#55a8d9');
        g.addColorStop(0.42,'#8bd0ed');
        g.addColorStop(0.78, '#d7edf0');
        g.addColorStop(1,   '#b3c99e');
        ctx.fillStyle = g;
        ctx.fillRect(0,0,w,h);
    });
}
