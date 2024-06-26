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

            // Znajdź odpowiednie warstwy na podstawie ich nazw
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
                            // Domyślny materiał lub inne ustawienia dla innych warstw
                            break;
                    }
                }
            });

            // Znajdź wymiary modelu i wykonaj inne operacje jak wcześniej
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

                // Pobierz pozycję pocisku z odpowiedniego miejsca na modelu przeciwnika
                const bulletStartPosition = new THREE.Vector3();
                enemyModel.getWorldPosition(bulletStartPosition);
                bulletMesh.position.copy(bulletStartPosition);

                // Ustaw kierunek strzału w kierunku gracza
                const direction = new THREE.Vector3().subVectors(player.position, bulletStartPosition).normalize();
                bulletMesh.setRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()));

                // Przypisz kierunek pociskowi
                bulletMesh.userData = { 
                    direction: direction.clone() 
                };

                // Obróć model przeciwnika w kierunku strzału
                const enemyDirection = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
                enemyModel.quaternion.copy(enemyDirection);

                // Dodaj pocisk do sceny i do listy pocisków przeciwnika
                enemy.userData.bullets.push(bulletMesh);
                scene.add(bulletMesh);

                // Dodaj dźwięk przestrzenny do pocisku
                addPositionalAudioToBullet(bulletMesh, camera);
            };

            function addPositionalAudioToBullet(bulletMesh, camera) {
                // Utwórz listener dla dźwięku
                const listener = new THREE.AudioListener();
                camera.add(listener);

                // Załaduj dźwięk za pomocą AudioLoader
                const audioLoader = new THREE.AudioLoader();
                audioLoader.load('assets/sounds/enemyShot.mp3', function(buffer) {
                    // Utwórz PositionalAudio i przypisz do niego załadowany dźwięk
                    const sound = new THREE.PositionalAudio(listener);
                    sound.setBuffer(buffer);
                    sound.setRefDistance(20);  // Ustaw odległość, z jakiej dźwięk będzie słyszalny
                    sound.setVolume(.7);
                    sound.play();

                    // Dodaj dźwięk do pocisku
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

    enemy.userData = { bullets: [], lastShot: Math.random() * 1000 }; // Randomize initial shot time

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

