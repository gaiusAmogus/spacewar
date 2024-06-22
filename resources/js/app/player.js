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

            // Oblicz skalę, aby szerokość modelu była 2.5 jednostki
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
    camera.position.y = 1.5;
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
