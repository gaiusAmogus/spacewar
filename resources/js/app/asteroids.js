import * as THREE from '/assets/vendor/three.js-dev/build/three.module.js';
import { GLTFLoader } from '/assets/vendor/three.js-dev/loaders/GLTFLoader.js';

export function createAsteroids(scene) {
    const asteroids = new THREE.Group();

    const asteroidCount = 50;
    const minSize = 1;
    const maxSize = 10;
    const minDistanceFromCenter = 50;

    // Funkcja do generowania losowej pozycji asteroidy
    function generateRandomPosition() {
        let posX, posY, posZ;
        do {
            posX = Math.random() * 400 - 200; // Pozycja od -200 do 200 w każdym wymiarze
            posY = Math.random() * 400 - 200;
            posZ = Math.random() * 400 - 200;
        } while (Math.sqrt(posX * posX + posY * posY + posZ * posZ) < minDistanceFromCenter); // Minimalna odległość od punktu startowego

        return new THREE.Vector3(posX, posY, posZ);
    }

    const loader = new GLTFLoader();

    const asteroidModels = [
        'assets/vendor/models/planets/Planet_1.glb',
        'assets/vendor/models/planets/Planet_2.glb',
        'assets/vendor/models/planets/Planet_3.glb',
    ];

    // Funkcja do losowego wyboru modelu asteroidy
    function getRandomAsteroidModel() {
        const index = Math.floor(Math.random() * asteroidModels.length);
        return asteroidModels[index];
    }

    // Funkcja do generowania losowego rozmiaru asteroidy
    function getRandomSize() {
        return Math.random() * (maxSize - minSize) + minSize;
    }

    // Dodawanie asteroid do sceny
    for (let i = 0; i < asteroidCount; i++) {
        const randomPosition = generateRandomPosition();
        const asteroidModelPath = getRandomAsteroidModel();
        const asteroidSize = getRandomSize();

        loader.load(
            asteroidModelPath,
            (gltf) => {
                const asteroid = gltf.scene;

                asteroid.scale.set(asteroidSize, asteroidSize, asteroidSize);
                asteroid.position.copy(randomPosition);
                const bbox = new THREE.Box3().setFromObject(asteroid);
                const size = new THREE.Vector3();
                bbox.getSize(size);
                const radius = Math.max(size.x, size.y, size.z) / 2;
                const collider = new THREE.Sphere(randomPosition, radius);
                asteroid.userData.collider = collider;

                asteroids.add(asteroid);
            },
            undefined,
            (error) => {
                console.error('Failed to load asteroid model:', error);
            }
        );
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
