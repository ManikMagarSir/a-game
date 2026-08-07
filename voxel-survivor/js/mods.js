export async function loadMods(list){
    for(const name of list){
        try {
            const mod = await import('../mods/' + name);
            if(typeof mod.default === 'function') mod.default(window.Voxel);
            else console.error('MOD SKIPPED (no default export): ' + name);
        } catch(e){
            console.error('MOD FAILED: ' + name, e);
        }
    }
}
