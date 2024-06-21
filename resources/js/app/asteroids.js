import * as THREE from '/assets/vendor/three.js-dev/build/three.module.js';

export function createAsteroids(scene) {
    const asteroids = new THREE.Group();

    const asteroidCount = 50;
    const minSize = 5;
    const maxSize = 30;

    const asteroidMaterial = new THREE.MeshBasicMaterial({ color: 0xa0a0a0 });

    for (let i = 0; i < asteroidCount; i++) {
        const asteroidSize = Math.random() * (maxSize - minSize) + minSize;

        const asteroidGeometry = new THREE.SphereGeometry(asteroidSize, 16, 16);
        const asteroidMesh = new THREE.Mesh(asteroidGeometry, asteroidMaterial);

        asteroidMesh.userData.collider = new THREE.Sphere(new THREE.Vector3(), asteroidSize);

        const posX = Math.random() * 400 - 200;
        const posY = Math.random() * 400 - 200;
        const posZ = Math.random() * 400 - 200;
        asteroidMesh.position.set(posX, posY, posZ);

        asteroids.add(asteroidMesh);
    }

    scene.add(asteroids);

    return asteroids;
}

export function isInsideAsteroid(asteroids, x, y, z, minDistance) {
    for (let asteroid of asteroids.children) {
        const asteroidPos = asteroid.position;
        const distance = Math.sqrt((x - asteroidPos.x) ** 2 + (y - asteroidPos.y) ** 2 + (z - asteroidPos.z) ** 2);
        if (distance < minDistance) {
            return true;
        }
    }
    return false;
}
