import * as THREE from '/assets/vendor/three.js-dev/build/three.module.js';
import { isInsideAsteroid } from './asteroids.js';

export function createEnemy(scene, asteroids, player) {
    const enemyGeometry = new THREE.BoxGeometry(1, 1, 4);
    const enemyMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const enemyMesh = new THREE.Mesh(enemyGeometry, enemyMaterial);

    let posX, posY, posZ;
    do {
        posX = Math.random() * 300 - 150;
        posY = Math.random() * 300 - 150;
        posZ = Math.random() * 300 - 150;
    } while (isInsideAsteroid(asteroids, posX, posY, posZ, 20));

    enemyMesh.position.set(posX, posY, posZ);

    const enemy = new THREE.Group();
    enemy.add(enemyMesh);

    enemy.userData = { bullets: [], lastShot: Math.random() * 1000 }; // Randomize initial shot time

    enemy.shoot = function() {
        const bulletGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8); // Promień początkowy, promień końcowy, wysokość, liczba segmentów
        const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);
    
        bulletMesh.position.copy(enemyMesh.position);
    
        const direction = new THREE.Vector3().subVectors(player.position, enemyMesh.position).normalize();
        bulletMesh.setRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()));
    
        if (!enemy.userData) {
            enemy.userData = { bullets: [] };
        }
    
        bulletMesh.userData = { direction: direction.clone() };
    
        enemy.userData.bullets.push(bulletMesh);
        scene.add(bulletMesh);
    };
    
    
    

    // Funkcja do teleportacji przeciwnika na nową pozycję
    enemy.teleport = function() {
        let newPos;
        do {
            newPos = new THREE.Vector3(
                Math.random() * 300 - 150,
                Math.random() * 300 - 150,
                Math.random() * 300 - 150
            );
        } while (isInsideAsteroid(asteroids, newPos.x, newPos.y, newPos.z, 20));

        enemy.position.copy(newPos);
    };

    scene.add(enemy);
    return enemy;
}
