import * as THREE from '/assets/vendor/three.js-dev/build/three.module.js';

// Inicjalizacja sceny, kamery i renderera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Stała prędkości poruszania się gracza do przodu
const playerSpeed = 0.1;

// Funkcja do generowania asteroid
function createAsteroids() {
    const asteroids = new THREE.Group();

    const asteroidCount = 50;
    const asteroidSizes = [2, 3, 4]; // Rozmiary asteroid

    const asteroidGeometry = new THREE.SphereGeometry(1, 16, 16); // Geometria asteroidy (kula)
    const asteroidMaterial = new THREE.MeshBasicMaterial({ color: 0xa0a0a0 }); // Szary kolor dla asteroid

    for (let i = 0; i < asteroidCount; i++) {
        const asteroidSize = asteroidSizes[Math.floor(Math.random() * asteroidSizes.length)];
        const asteroidMesh = new THREE.Mesh(asteroidGeometry.clone().scale(asteroidSize, asteroidSize, asteroidSize), asteroidMaterial);

        // Losowe pozycje asteroid w przestrzeni
        asteroidMesh.position.x = Math.random() * 100 - 50; // x od -50 do 50
        asteroidMesh.position.y = Math.random() * 100 - 50; // y od -50 do 50
        asteroidMesh.position.z = Math.random() * 100 - 50; // z od -50 do 50

        // Upewnienie się, że asteroida jest większa niż player
        asteroidMesh.scale.multiplyScalar(asteroidSize);

        asteroids.add(asteroidMesh);
    }

    return asteroids;
}

// Dodanie asteroid do sceny
const asteroids = createAsteroids();
scene.add(asteroids);

// Tworzenie playera
function createPlayer() {
    // Tworzenie bryły dla gracza
    const playerGeometry = new THREE.BoxGeometry(1, 1, 4); // Bryła prostokątna (4 ściany są prostokątami)
    const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Biały kolor
    const playerMesh = new THREE.Mesh(playerGeometry, playerMaterial);

    // Ustawienie kamery
    camera.position.z = 5; // Przesunięcie kamery wzdłuż osi z
    camera.position.y = 1; // Przesunięcie kamery wzdłuż osi y
    camera.lookAt(playerMesh.position); // Kamera patrzy na pozycję gracza

    // Utworzenie grupy obiektów "player"
    const player = new THREE.Group();
    player.add(playerMesh);
    player.add(camera); // Dodanie kamery do grupy "player"
    return player;
}

// Dodanie playera do sceny
const player = createPlayer();
scene.add(player);

// Aktualizacja położenia gracza w każdej klatce animacji
function animate() {
    requestAnimationFrame(animate);

    // Przesunięcie playera względem kamery (do przodu)
    player.position.z -= playerSpeed;

    // Renderowanie sceny
    renderer.render(scene, camera);
}
animate();