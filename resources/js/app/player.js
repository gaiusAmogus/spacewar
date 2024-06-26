import * as THREE from '/assets/vendor/three.js-dev/build/three.module.js';
import { GLTFLoader } from '/assets/vendor/three.js-dev/loaders/GLTFLoader.js';


export function createPlayer(camera) {
    const player = new THREE.Group();

    // Załaduj model Spaceship z pliku GLB
    const loader = new GLTFLoader();
    loader.load(
        'assets/vendor/models/Spaceship.glb',
        (gltf) => {
            const spaceship = gltf.scene;

            // Znajdź wymiary modelu
            const bbox = new THREE.Box3().setFromObject(spaceship);
            const size = new THREE.Vector3();
            bbox.getSize(size);

            const desiredWidth = 4;
            const scale = desiredWidth / size.x;
            spaceship.scale.set(scale, scale, scale);

            // Obróć model o 180 stopni wokół osi Y (jeśli jest to konieczne)
            spaceship.rotation.y = Math.PI; // Obrót o 180 stopni

            // Przejdź przez wszystkie meshy w modelu i zmień ich kolory
            spaceship.traverse((child) => {
                if (child.isMesh) {
                    // Przykładowe zmiany kolorów dla poszczególnych części modelu
                    let material;
                    switch (child.name) {
                        case 'Lo_poly_Spaceship_01_by_Liz_Reddington_1':
                            material = new THREE.MeshStandardMaterial({ color: 0xd9d9d9 });
                            break;
                        case 'Lo_poly_Spaceship_01_by_Liz_Reddington_1_1':
                            material = new THREE.MeshStandardMaterial({ color: 0x262626 });
                            break;
                        case 'Lo_poly_Spaceship_01_by_Liz_Reddington_1_2':
                            material = new THREE.MeshStandardMaterial({ color: 0xffbb99 }); 
                            break;
                    }
                    child.material = material;
                }
            });

            // Dodaj model do grupy gracza
            player.add(spaceship);
        },
        undefined,
        (error) => {
            console.error('Failed to load Spaceship model:', error);
        }
    );

    const light = new THREE.PointLight(0x3333ff, .5);
    light.position.set(0, 1, 1); // Przesunięcie światła do tyłu modelu
    player.add(light);

    camera.position.z = 5;
    camera.position.y = 1.3;
    camera.lookAt(player.position);

    // Dodaj kamerę do grupy gracza
    player.add(camera);

    return player;
}

export function playPlayerShotSound() {
    const playerShotSound = new Audio('assets/sounds/playerShot.mp3');
    playerShotSound.volume = 0.3;
    playerShotSound.play();
}
export function createBullet(player, bullets, scene) {
    // Utworzenie geometrii walca
    const bulletGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 16);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0x32AAE1 });
    const bulletMesh = new THREE.Mesh(bulletGeometry, bulletMaterial);

    // Ustawienie pozycji na pozycji gracza
    bulletMesh.position.copy(player.position);

    // Ustawienie rotacji
    // Kierunek pocisku to kierunek wektora ruchu gracza
    bulletMesh.quaternion.copy(player.quaternion);

    const light = new THREE.PointLight(0x3333ff, .5);
    light.position.set(0, 1, 1); // Przesunięcie światła do tyłu modelu
    bulletMesh.add(light);

    // Dodanie pocisku do listy pocisków
    bullets.push(bulletMesh);

    // Dodanie pocisku do sceny
    scene.add(bulletMesh);

    playPlayerShotSound();

    setTimeout(() => {
        bulletMesh.remove(light); // Usunięcie światła z pocisku po .1 s bo zasoby żre
    }, 100); 
}
export function addTemporaryRedLight(player) {
    const redLight = new THREE.PointLight(0xff3333, 1); // Światło czerwone
    redLight.position.set(0, 1, 1); // Przesunięcie światła do tyłu modelu

    player.add(redLight); // Dodaj światło do grupy gracza

    // Usunięcie światła po 0.3 sekundy
    setTimeout(() => {
        player.remove(redLight); // Usunięcie światła z grupy gracza
    }, 100); // Czas w milisekundach (0.3 sekundy = 300 milisekund)

    const explosionSound = new Audio('assets/sounds/playerHit.mp3');
    explosionSound.volume = 1;
    explosionSound.play();
}
