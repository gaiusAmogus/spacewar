import * as THREE from '/assets/vendor/three.js-dev/build/three.module.js';

export function createPlayer(camera) {
    const playerGeometry = new THREE.BoxGeometry(1, 1, 4);
    const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);

    camera.position.z = 5;
    camera.position.y = 1.5;
    camera.lookAt(playerMesh.position);

    const player = new THREE.Group();
    player.add(playerMesh);
    player.add(camera);
    return player;
}
