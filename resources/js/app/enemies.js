import * as THREE from '/assets/vendor/three.js-dev/build/three.module.js';
import { isInsideAsteroid } from './asteroids.js';
import { GLTFLoader } from '/assets/vendor/three.js-dev/loaders/GLTFLoader.js';

export function createEnemy(scene, asteroids, player) {
    const enemy = new THREE.Group();

    const loader = new GLTFLoader();
    loader.load(
        'assets/vendor/models/Enemy.glb',
        (gltf) => {
            const enemyModel = gltf.scene;

            enemyModel.traverse((child) => {
                if (child.isMesh) {
                    switch (child.name) {
                        case 'Lo_poly_Spaceship_04_by_Liz_Reddington_1':
                            child.material = new THREE.MeshBasicMaterial({ color: 0x330000 }); 
                            break;
                        case 'Lo_poly_Spaceship_04_by_Liz_Reddington_1_1':
                            child.material = new THREE.MeshBasicMaterial({ color: 0xb30000 }); 
                            break;
                        case 'Lo_poly_Spaceship_04_by_Liz_Reddington_1_2':
                            child.material = new THREE.MeshBasicMaterial({ color: 0x800000 }); 
                            break;
                        default:
                            break;
                    }
                }
            });

            const bbox = new THREE.Box3().setFromObject(enemyModel);
            const size = new THREE.Vector3();
            bbox.getSize(size);

            const desiredWidth = 3;
            const scale = desiredWidth / size.x;
            enemyModel.scale.set(scale, scale, scale);
            enemyModel.position.set(0, 0, 0);
            enemyModel.rotation.y = Math.PI;

            enemy.add(enemyModel);
            enemy.ready = true;
            
            // Funkcja, która będzie odpowiedzialna za strzelanie przeciwnika
            enemy.shoot = function(camera) {
                const bulletGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8); // Promień początkowy, promień końcowy, wysokość, liczba segmentów
                const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);

                const bulletStartPosition = new THREE.Vector3();
                enemyModel.getWorldPosition(bulletStartPosition);
                bulletMesh.position.copy(bulletStartPosition);

                // Ustaw kierunek strzału w kierunku gracza
                const direction = new THREE.Vector3().subVectors(player.position, bulletStartPosition).normalize();
                bulletMesh.setRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()));
                bulletMesh.userData = { 
                    direction: direction.clone() 
                };

                const enemyDirection = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
                enemyModel.quaternion.copy(enemyDirection);

                enemy.userData.bullets.push(bulletMesh);
                scene.add(bulletMesh);

                addPositionalAudioToBullet(bulletMesh, camera);
            };

            function addPositionalAudioToBullet(bulletMesh, camera) {
                const listener = new THREE.AudioListener();
                camera.add(listener);

                const audioLoader = new THREE.AudioLoader();
                audioLoader.load('assets/sounds/enemyShot.mp3', function(buffer) {
                    const sound = new THREE.PositionalAudio(listener);
                    sound.setBuffer(buffer);
                    sound.setRefDistance(20);  
                    sound.setVolume(.7);
                    sound.play();
                    bulletMesh.add(sound);
                });
            }

            
        },
        undefined,
        (error) => {
            console.error('Failed to load Enemy model:', error);
        }
    );

    let posX, posY, posZ;
    do {
        posX = Math.random() * 300 - 150;
        posY = Math.random() * 300 - 150;
        posZ = Math.random() * 300 - 150;
    } while (isInsideAsteroid(asteroids, posX, posY, posZ, 20));

    enemy.position.set(posX, posY, posZ);

    enemy.userData = { bullets: [], lastShot: Math.random() * 1000 };

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