export default function(voxel){
    const { G, log } = voxel;
    log('Example mod loaded. Player moves 10% faster.');
    G.player.baseSpeed *= 1.1;
    G.player.sprint *= 1.1;
}
