import { readdirSync, readFileSync, existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const jsDir = join(root, 'js');

function walkJs(dir, out = []){
    for(const entry of readdirSync(dir, { withFileTypes: true })){
        const p = join(dir, entry.name);
        if(entry.isDirectory()) walkJs(p, out);
        else if(entry.name.endsWith('.js')) out.push(p);
    }
    return out;
}
const files = walkJs(jsDir);

let failed = 0;

function collectExports(src){
    const set = new Set();
    const re = /export\s+(?:const|let|var)\s+([^;=]+)/g;
    let m;
    while((m = re.exec(src))) m[1].split(',').forEach(s => { const n = s.trim(); if(n) set.add(n); });
    const re2 = /export\s+(?:async\s+)?(?:function|class)\s+([A-Za-z_$][\w$]*)/g;
    while((m = re2.exec(src))) set.add(m[1]);
    const re3 = /export\s*\{([^}]*)\}/g;
    while((m = re3.exec(src))) m[1].split(',').forEach(s => { const n = s.trim().split(/\s+as\s+/)[0].trim(); if(n) set.add(n); });
    return set;
}

const exportCache = {};
function exportsOf(file){
    if(!exportCache[file]) exportCache[file] = collectExports(readFileSync(file, 'utf8'));
    return exportCache[file];
}

for(const f of files){
    const src = readFileSync(f, 'utf8');
    const importRe = /import\s+(?:\{([^}]*)\}\s+|\*\s+as\s+\w+\s+)from\s+['"](\.[^'"]+)['"]/g;
    let m;
    while((m = importRe.exec(src))){
        const target = join(dirname(f), m[2]);
        if(!existsSync(target)){
            console.error('MISSING FILE: ' + f + " imports '" + m[2] + "' which does not exist");
            failed++;
            continue;
        }
        if(m[1] === undefined) continue;
        const names = m[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
        const targetExports = exportsOf(target);
        for(const name of names){
            if(!targetExports.has(name)){
                console.error('MISSING EXPORT: ' + f + " imports '" + name + "' from '" + m[2] + "' but it is not exported");
                failed++;
            }
        }
    }
}

const pkgPath = join(root, 'package.json');
const hadPkg = existsSync(pkgPath);
const orig = hadPkg ? readFileSync(pkgPath, 'utf8') : null;
writeFileSync(pkgPath, '{"type":"module"}\n');
try {
    for(const f of files){
        try {
            execSync('node --check "' + f + '"', { stdio: 'pipe' });
        } catch(e){
            console.error('SYNTAX: ' + f + ' failed\n' + e.stderr);
            failed++;
        }
    }
} finally {
    if(hadPkg) writeFileSync(pkgPath, orig);
    else unlinkSync(pkgPath);
}

if(failed > 0){
    console.error('\n' + failed + ' issue(s) found.');
    process.exit(1);
}
console.log('All ' + files.length + ' modules valid.');
