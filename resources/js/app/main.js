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
    new THREE.SphereGeometry(500, 32, 32),
    new THREE.MeshBasicMaterial({ map: backgroundTexture, side: THREE.BackSide }) 
);
scene.add(backgroundSphere);

// Dodanie światła kierunkowego
const sunlight = new THREE.DirectionalLight(0xffffff, 1.2); 
sunlight.position.set(2, -2, 0); 
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
//liczba przeciwników
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

    // Sprawdzenie kolizji przeciwników z pociskami gracza oraz z graczem
    enemies.forEach(enemy => {
        if (!enemy.ready) return; // Jeśli model nie jest jeszcze gotowy, pomiń ten przeciwnik

        const enemyMesh = enemy.children[0];
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
                endGame(); 
            }
        });
    });
}

function restartGame() {
    player.position.set(0, 0, 0);
    player.rotation.set(0, 0, 0);
    playerSpeed = baseSpeed;

    playerScore = -1;
    playerLives = 3;
    updatePlayerScore();
    updateLifeDisplay();

    bullets.forEach(bullet => scene.remove(bullet));
    bullets.length = 0;

    enemies.forEach(enemy => {
        enemy.userData.bullets.forEach(bullet => scene.remove(bullet));
        scene.remove(enemy);
    });
    enemies.length = 0;

    for (let i = 0; i < 15; i++) {
        const enemy = createEnemy(scene, asteroids, player);
        enemies.push(enemy);
    }

    gameOverScreen.style.display = 'none';
    gamePaused = false;

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
        playerLives = 0; 
        endGame(); 
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
            span.textContent = '';
        }
    });
}
function endGame() {

    const explosionSound = new Audio('assets/sounds/playerDead.mp3');
    explosionSound.volume = 1;
    explosionSound.play();

    gamePaused = true; 
    gameOverScreen.style.display = 'flex';
}

function updatePlayerSpeed() {

    let targetCameraPositionZ = camera.position.z;
    const animationDuration = 700;
    let animationStartTime = null; 

    function startCameraAnimation(targetZ) {
        targetCameraPositionZ = targetZ;
    
        if (camera.position.z !== targetCameraPositionZ) {
            animationStartTime = performance.now(); 
    
            requestAnimationFrame(animateCameraPosition);
        }
    }
    
    function animateCameraPosition(currentTime) {
        if (!animationStartTime) {
            animationStartTime = currentTime;
        }
    
        const elapsedTime = currentTime - animationStartTime;
        const progress = Math.min(elapsedTime / animationDuration, 1);
    
        const currentPositionZ = camera.position.z;
        const newPositionZ = currentPositionZ * (1 - progress) + targetCameraPositionZ * progress;
        camera.position.z = newPositionZ;
    
        if (progress < 1) {
            requestAnimationFrame(animateCameraPosition);
        } else {
            animationStartTime = null; 
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
    if (gamePaused) return; 

    requestAnimationFrame(animate);

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

    // Aktualizacja ruchu tła wraz z graczem
    backgroundSphere.position.copy(player.position);

    // Aktualizacja ruchu pocisków gracza
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
        if (!enemy.ready) return; // jeżeli nie gotowy to pomiń

        if (now - enemy.userData.lastShot > 1000 + Math.random() * 1000) { // strzał losowo ale mniej więcej co sekunde
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

    checkCollisions();
    renderer.render(scene, camera);
}

setupSoundtrack();
animate();