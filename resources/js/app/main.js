import * as THREE from '/assets/vendor/three.js-dev/build/three.module.js';
import { setupSoundtrack, explosionSound } from './functions.js';
import { createAsteroids } from './asteroids.js';
import { createEnemy } from './enemies.js';
import { createPlayer, createBullet, addTemporaryRedLight } from './player.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const textureLoader = new THREE.TextureLoader();
const backgroundTexture = textureLoader.load('assets/img/background.jpg'); 
const backgroundSphere = new THREE.Mesh(
    new THREE.SphereGeometry(500, 32, 32), // Duża sfera, aby otoczyć całą scenę
    new THREE.MeshBasicMaterial({ map: backgroundTexture, side: THREE.BackSide }) // Użyj tekstury jako tła
);
scene.add(backgroundSphere);

// Dodanie światła kierunkowego (słonecznego)
const sunlight = new THREE.DirectionalLight(0xffffff, 1.2); // Kolor biały, intensywność 1
sunlight.position.set(2, -2, 0); // Ustawienie pozycji światła (np. nad sceną)
scene.add(sunlight);

const baseSpeed = .25;
const boostedSpeed = .75;
const slowSpeed = .05;
let playerSpeed = baseSpeed;
const rotationSpeed = .015;

const player = createPlayer(camera);
scene.add(player);

const keys = {};
const bullets = [];
let playerScore = 0;
let playerLives = 3;
const scoresTable = document.querySelector('.scoresTable');
const playerLifeSpans = document.querySelectorAll('.scoresTable__playerLife span');
const gameOverScreen = document.querySelector('.gameOver');
let gamePaused = false;

const asteroids = createAsteroids(scene);

const enemies = [];
for (let i = 0; i < 15; i++) {
    const enemy = createEnemy(scene, asteroids, player);
    enemies.push(enemy);
}

function checkCollisions() {
    // Sprawdzenie kolizji gracza z asteroidami
    player.children.forEach(child => {
        const playerMesh = child;
        const playerBox = new THREE.Box3().setFromObject(playerMesh);

        asteroids.children.forEach(asteroidMesh => {
            const asteroidSphere = asteroidMesh.userData.collider;

            // Sprawdzenie kolizji Box vs Sphere
            const playerToAsteroidDistance = playerBox.distanceToPoint(asteroidMesh.position);
            if (playerToAsteroidDistance < asteroidSphere.radius) {
                endGame();
            }
        });
    });

    // Sprawdzenie kolizji przeciwników z pociskami gracza oraz z główną bryłą gracza
    enemies.forEach(enemy => {
        if (!enemy.ready) return; // Jeśli model nie jest jeszcze gotowy, pomiń ten przeciwnik

        const enemyMesh = enemy.children[0]; // Zakładamy, że pierwsze dziecko przeciwnika to jego geometryczna bryła
        const enemyBox = new THREE.Box3().setFromObject(enemyMesh);

        bullets.forEach((bullet, index) => {
            const bulletMesh = bullet;
            const bulletBox = new THREE.Box3().setFromObject(bulletMesh);

            if (enemyBox.intersectsBox(bulletBox)) {
                scene.remove(bulletMesh);
                bullets.splice(index, 1);
                explosionSound();
                enemy.teleport(); // Teleportacja przeciwnika po trafieniu
                updatePlayerScore(); // Aktualizacja wyniku gracza
            }
        });

        player.children.forEach(child => {
            const playerMesh = child;
            const playerBox = new THREE.Box3().setFromObject(playerMesh);

            if (enemyBox.intersectsBox(playerBox)) {
                console.log('Kolizja z przeciwnikiem!');
                endGame(); // Koniec gry po kolizji z przeciwnikiem
            }
        });
    });
}

function restartGame() {
    // Reset player position
    player.position.set(0, 0, 0);
    player.rotation.set(0, 0, 0);
    playerSpeed = baseSpeed;

    // Reset player score and lives
    playerScore = -1;
    playerLives = 3;
    updatePlayerScore();
    updateLifeDisplay();

    // Remove existing bullets
    bullets.forEach(bullet => scene.remove(bullet));
    bullets.length = 0;

    // Remove existing enemies
    enemies.forEach(enemy => {
        enemy.userData.bullets.forEach(bullet => scene.remove(bullet));
        scene.remove(enemy);
    });
    enemies.length = 0;

    // Recreate enemies
    for (let i = 0; i < 7; i++) {
        const enemy = createEnemy(scene, asteroids, player);
        enemies.push(enemy);
    }

    // Hide game over screen and unpause the game
    gameOverScreen.style.display = 'none';
    gamePaused = false;

    // Resume animation
    animate();
}

function updatePlayerScore() {
    playerScore++;
    scoresTable.querySelector('.scoresTable__playerScore span').textContent = playerScore;
}

function updatePlayerLife() {
    addTemporaryRedLight(player);
    playerLives--;
    if (playerLives < 1) {
        playerLives = 0; // Zabezpieczenie przed ujemnym życiem
        endGame(); // Wywołanie końca gry
    }
    updateLifeDisplay();
}
function updateLifeDisplay(){
        var svg = `
        <svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 9.1371C2 14 6.01943 16.5914 8.96173 18.9109C10 19.7294 11 20.5 12 20.5C13 20.5 14 19.7294 15.0383 18.9109C17.9806 16.5914 22 14 22 9.1371C22 4.27416 16.4998 0.825464 12 5.50063C7.50016 0.825464 2 4.27416 2 9.1371Z" fill="#1C274C"/>
        </svg>
    `;
    playerLifeSpans.forEach((span, index) => {
        if (index < playerLives) {
            span.innerHTML = svg;
        } else {
            span.textContent = ''; // Ukrycie pustych slotów życia
        }
    });
}
function endGame() {

    const explosionSound = new Audio('assets/sounds/playerDead.mp3');
    explosionSound.volume = 1;
    explosionSound.play();

    gamePaused = true; // Pauzowanie gry
    gameOverScreen.style.display = 'flex'; // Wyświetlenie ekranu game over
}

function updatePlayerSpeed() {

    // Definicja zmiennych globalnych (lub dostępnych w odpowiednim zakresie)
    let targetCameraPositionZ = camera.position.z; // Inicjalnie ustawiamy docelową pozycję kamery na jej aktualną pozycję
    const animationDuration = 700; // Czas trwania animacji w milisekundach
    let animationStartTime = null; // Czas rozpoczęcia animacji

    function startCameraAnimation(targetZ) {
        // Ustawiamy nową docelową pozycję kamery
        targetCameraPositionZ = targetZ;
    
        // Rozpoczynamy animację tylko jeśli zmienia się pozycja kamery
        if (camera.position.z !== targetCameraPositionZ) {
            animationStartTime = performance.now(); // Ustalamy czas rozpoczęcia animacji
    
            // Rozpoczynamy animację przy użyciu requestAnimationFrame
            requestAnimationFrame(animateCameraPosition);
        }
    }
    
    function animateCameraPosition(currentTime) {
        if (!animationStartTime) {
            animationStartTime = currentTime;
        }
    
        const elapsedTime = currentTime - animationStartTime;
        const progress = Math.min(elapsedTime / animationDuration, 1); // Postęp animacji jako wartość z zakresu [0, 1]
    
        // Interpolacja pozycji kamery
        const currentPositionZ = camera.position.z;
        const newPositionZ = currentPositionZ * (1 - progress) + targetCameraPositionZ * progress;
        camera.position.z = newPositionZ;
    
        // Kontynuujemy animację, jeśli nie osiągnęliśmy jeszcze końca
        if (progress < 1) {
            requestAnimationFrame(animateCameraPosition);
        } else {
            animationStartTime = null; // Resetujemy czas rozpoczęcia animacji po jej zakończeniu
        }
    }

    if (keys['ShiftLeft'] || keys['ShiftRight']) {
        playerSpeed = boostedSpeed;
        startCameraAnimation(6);
    } else if (keys['KeyR']) {
        playerSpeed = slowSpeed;
        startCameraAnimation(4);
    } else {
        playerSpeed = baseSpeed;
        startCameraAnimation(5);
    }
}

document.addEventListener('keydown', (event) => {
    keys[event.code] = true;
    updatePlayerSpeed();
    if (event.code === 'Enter' && gamePaused) {
        restartGame();
    }
});

document.addEventListener('keyup', (event) => {
    keys[event.code] = false;
    updatePlayerSpeed();
});

function animate() {
    if (gamePaused) return; // Pauzowanie gry

    requestAnimationFrame(animate);

    // Aktualizacja ruchu gracza
    player.translateZ(-playerSpeed);

    if (keys['ArrowUp'] || keys['KeyS']) {
        player.rotateX(-rotationSpeed);
    }
    if (keys['ArrowDown'] || keys['KeyW']) {
        player.rotateX(rotationSpeed);
    }
    if (keys['ArrowLeft'] || keys['KeyA']) {
        player.rotateY(rotationSpeed);
    }
    if (keys['ArrowRight'] || keys['KeyD']) {
        player.rotateY(-rotationSpeed);
    }
    if (keys['KeyQ']) {
        player.rotateZ(rotationSpeed);
    }
    if (keys['KeyE']) {
        player.rotateZ(-rotationSpeed);
    }
    if (keys['Space']) {
        createBullet(player, bullets, scene);
        keys['Space'] = false;
    }

    // Aktualizacja pozycji backgroundSphere
    backgroundSphere.position.copy(player.position);

    // Aktualizacja ruchu pocisków
    bullets.forEach((bullet, index) => {
        bullet.translateZ(-2);
        if (bullet.position.z < -250) {
            scene.remove(bullet);
            bullets.splice(index, 1);
        }
    });

    const now = performance.now();

    // Strzelanie przeciwników
    enemies.forEach(enemy => {
        if (!enemy.ready) return; // Jeśli model nie jest jeszcze gotowy, pomiń ten przeciwnik

        if (now - enemy.userData.lastShot > 500 + Math.random() * 500) { // Randomize shooting intervals
            enemy.shoot(camera);
            enemy.userData.lastShot = now;
        }

        // Aktualizacja ruchu pocisków przeciwników
        enemy.userData.bullets.forEach((bullet, index) => {
            bullet.position.add(bullet.userData.direction.clone().multiplyScalar(0.5));
            if (bullet.position.distanceTo(player.position) < 0.5) {
                scene.remove(bullet);
                enemy.userData.bullets.splice(index, 1);
                updatePlayerLife(); // Odejmowanie życia gracza po trafieniu
            }
            if (bullet.position.distanceTo(enemy.position) > 150) {
                scene.remove(bullet);
                enemy.userData.bullets.splice(index, 1);
            }
        });
    });

    // Sprawdzenie kolizji
    checkCollisions();

    // Renderowanie sceny
    renderer.render(scene, camera);
}

setupSoundtrack();
animate();

