export function setupSoundtrack() {
    const playSoundtrackOnInteraction = () => {
        const soundtrack = new Audio('assets/sounds/soundtrack.mp3');
        soundtrack.volume = 0.7;
        soundtrack.loop = true; // Odtwarzanie w pętli
    
        // Odtworzenie dźwięku z obsługą błędów
        soundtrack.play().catch(error => {
            console.error('Audio playback failed:', error);
        });
        // Usunięcie nasłuchiwania po pierwszej interakcji
        document.removeEventListener('click', playSoundtrackOnInteraction);
        document.removeEventListener('keydown', playSoundtrackOnInteraction);
    };

    document.addEventListener('click', playSoundtrackOnInteraction);
    document.addEventListener('keydown', playSoundtrackOnInteraction);
}
export function explosionSound() {
    const explosionSound = new Audio('assets/sounds/enemyDead.mp3');
    explosionSound.volume = 0.2;
    explosionSound.play();
}
