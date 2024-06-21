import * as THREE from '/assets/vendor/three.js-dev/build/three.module.js';
import { createAsteroids } from './asteroids.js';
import { createEnemy } from './enemies.js';
import { createPlayer } from './player.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const baseSpeed = .25;
const boostedSpeed = .75;
const slowSpeed = .05;
let playerSpeed = baseSpeed;
const rotationSpeed = .025;

const player = createPlayer(camera);
scene.add(player);

const keys = {};
const bullets = [];
let playerScore = 0; // Licznik trafionych przeciwników
let playerLives = 3; // Życie gracza
const scoresTable = document.querySelector('.scoresTable');
const playerLifeSpans = document.querySelectorAll('.scoresTable__playerLife span');
const gameOverScreen = document.querySelector('.gameOver');
let gamePaused = false;

document.addEventListener('keydown', (event) => {
    keys[event.code] = true;
    updatePlayerSpeed();
});

document.addEventListener('keyup', (event) => {
    keys[event.code] = false;
    updatePlayerSpeed();
});

function updatePlayerSpeed() {
    if (keys['ShiftLeft'] || keys['ShiftRight']) {
        playerSpeed = boostedSpeed;
    } else if (keys['KeyR']) {
        playerSpeed = slowSpeed;
    } else {
        playerSpeed = baseSpeed;
    }
}

function createBullet() {
    // Utworzenie geometrii walca
    const bulletGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 16);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0x32AAE1});
    const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);

    // Ustawienie pozycji na pozycji gracza
    bulletMesh.position.copy(player.position);

    // Ustawienie rotacji
    // Kierunek pocisku to kierunek wektora ruchu gracza
    bulletMesh.quaternion.copy(player.quaternion);

    // Dodanie pocisku do listy pocisków
    bullets.push(bulletMesh);

    // Dodanie pocisku do sceny
    scene.add(bulletMesh);
}


function checkCollisions() {
    // Iteracja przez dzieci gracza (np. bryły kolizyjne)
    player.children.forEach(child => {
        const playerBox = new THREE.Box3().setFromObject(child);

        asteroids.children.forEach(asteroid => {
            const asteroidBox = new THREE.Box3().setFromObject(asteroid);

            if (playerBox.intersectsBox(asteroidBox)) {
                console.log('Kolizja z asteroidą!');
                endGame(); // Koniec gry po kolizji z asteroidą

                // Można dodać dodatkowe działania po kolizji, np. przesunięcie gracza
                const collisionNormal = new THREE.Vector3().subVectors(player.position, asteroid.position).normalize();
                player.position.add(collisionNormal.multiplyScalar(playerSpeed * 2));
            }
        });
    });

    enemies.forEach(enemy => {
        const enemyBox = new THREE.Box3().setFromObject(enemy);

        bullets.forEach((bullet, index) => {
            const bulletBox = new THREE.Box3().setFromObject(bullet);

            if (enemyBox.intersectsBox(bulletBox)) {
                scene.remove(bullet);
                bullets.splice(index, 1);
                enemy.teleport(); // Teleportacja przeciwnika po trafieniu
                updatePlayerScore(); // Aktualizacja wyniku gracza
            }
        });

        // Sprawdzenie kolizji z główną bryłą gracza
        player.children.forEach(child => {
            const playerBox = new THREE.Box3().setFromObject(child);

            if (playerBox.intersectsBox(enemyBox)) {
                console.log('Kolizja z przeciwnikiem!');
                endGame(); // Koniec gry po kolizji z przeciwnikiem
            }
        });
    });
}

function animate() {
    if (gamePaused) return; // Pauzowanie gry

    requestAnimationFrame(animate);

    player.translateZ(-playerSpeed);

    if (keys['ArrowUp'] || keys['KeyS']) {
        player.rotateX(rotationSpeed);
    }
    if (keys['ArrowDown'] || keys['KeyW']) {
        player.rotateX(-rotationSpeed);
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
        createBullet();
        keys['Space'] = false;
    }

    bullets.forEach((bullet, index) => {
        bullet.translateZ(-2);
        if (bullet.position.z < -400) {
            scene.remove(bullet);
            bullets.splice(index, 1);
        }
    });

    const now = performance.now();

    enemies.forEach(enemy => {
        if (now - enemy.userData.lastShot > 1000 + Math.random() * 1000) { // Randomize shooting intervals
            enemy.shoot();
            enemy.userData.lastShot = now;
        }

        enemy.userData.bullets.forEach((bullet, index) => {
            bullet.position.add(bullet.userData.direction.clone().multiplyScalar(0.5));
            if (bullet.position.distanceTo(player.position) < 0.5) {
                console.log('Player hit!');
                scene.remove(bullet);
                enemy.userData.bullets.splice(index, 1);
                updatePlayerLife(); // Odejmowanie życia gracza po trafieniu
            }
            if (bullet.position.distanceTo(enemy.position) > 500) {
                scene.remove(bullet);
                enemy.userData.bullets.splice(index, 1);
            }
        });
    });

    checkCollisions();

    renderer.render(scene, camera);
}

const asteroids = createAsteroids(scene);

const enemies = [];
for (let i = 0; i < 15; i++) {
    const enemy = createEnemy(scene, asteroids, player);
    enemies.push(enemy);
}

function updatePlayerScore() {
    playerScore++;
    scoresTable.querySelector('.scoresTable__playerScore span').textContent = playerScore;
}

function updatePlayerLife() {
    playerLives--;
    if (playerLives < 0) {
        playerLives = 0; // Zabezpieczenie przed ujemnym życiem
        endGame(); // Wywołanie końca gry
    }
    updateLifeDisplay();
}

function updateLifeDisplay() {
    playerLifeSpans.forEach((span, index) => {
        if (index < playerLives) {
            span.textContent = '<3';
        } else {
            span.textContent = ''; // Ukrycie pustych slotów życia
        }
    });
}

function endGame() {
    console.log('Koniec gry!');
    gamePaused = true; // Pauzowanie gry
    gameOverScreen.style.display = 'flex'; // Wyświetlenie ekranu game over
}

animate();
