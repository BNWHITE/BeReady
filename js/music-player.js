// Gestionnaire de musique globale
class MusicPlayer {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.volume = 0.5;
        this.init();
    }

    init() {
        this.createAudioElement();
        this.setupEventListeners();
        this.loadSavedState();
    }

    createAudioElement() {
        this.audio = new Audio('audio/music.mp3');
        this.audio.loop = true;
        this.audio.volume = this.volume;
        
        // Gestion des erreurs
        this.audio.addEventListener('error', (e) => {
            console.error('Erreur audio:', e);
            this.showError();
        });
        
        this.audio.addEventListener('canplaythrough', () => {
            console.log('Musique prête à être jouée');
        });
    }

    setupEventListeners() {
        // Bouton play/pause
        document.getElementById('playPauseBtn').addEventListener('click', () => {
            this.toggle();
        });

        // Contrôle du volume
        document.getElementById('volumeControl').addEventListener('input', (e) => {
            this.setVolume(e.target.value);
        });

        // Gérer la visibilité de la page (pause quand la page n'est pas visible)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isPlaying) {
                this.pause();
                // Marquer pour redémarrage automatique
                this.autoResume = true;
            } else if (!document.hidden && this.autoResume) {
                this.play();
                this.autoResume = false;
            }
        });

        // Sauvegarder l'état avant fermeture
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });
    }

    async play() {
        try {
            await this.audio.play();
            this.isPlaying = true;
            this.updateUI();
            console.log('Musique démarrée');
        } catch (error) {
            console.log('Erreur de lecture:', error);
            this.showPlayError();
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.updateUI();
    }

    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    setVolume(volume) {
        this.volume = parseFloat(volume);
        this.audio.volume = this.volume;
        this.updateVolumeUI();
    }

    updateUI() {
        const btn = document.getElementById('playPauseBtn');
        const icon = document.getElementById('playIcon');
        
        if (this.isPlaying) {
            btn.classList.add('playing');
            icon.className = 'fas fa-pause';
        } else {
            btn.classList.remove('playing');
            icon.className = 'fas fa-play';
        }
    }

    updateVolumeUI() {
        const volumeControl = document.getElementById('volumeControl');
        if (volumeControl) {
            volumeControl.value = this.volume;
        }
    }

    loadSavedState() {
        try {
            const savedVolume = localStorage.getItem('musicVolume');
            const savedPlaying = localStorage.getItem('musicPlaying');
            
            if (savedVolume) {
                this.setVolume(savedVolume);
            }
            
            // Ne pas redémarrer automatiquement - attendre l'interaction utilisateur
            if (savedPlaying === 'true') {
                // Marquer comme devant redémarrer après interaction
                this.shouldAutoPlay = true;
            }
        } catch (error) {
            console.log('Erreur chargement état:', error);
        }
    }

    saveState() {
        try {
            localStorage.setItem('musicVolume', this.volume);
            localStorage.setItem('musicPlaying', this.isPlaying);
        } catch (error) {
            console.log('Erreur sauvegarde état:', error);
        }
    }

    showError() {
        const player = document.querySelector('.music-player');
        if (player) {
            player.style.background = 'rgba(231, 76, 60, 0.9)';
            const info = player.querySelector('.music-info');
            if (info) {
                info.textContent = 'Erreur audio';
            }
        }
    }

    showPlayError() {
        alert('Impossible de lire la musique. Vérifiez que le fichier music.mp3 existe dans le dossier audio/');
    }
}

// Initialisation quand la page est chargée
document.addEventListener('DOMContentLoaded', function() {
    window.musicPlayer = new MusicPlayer();
    
    // Démarrer après première interaction utilisateur
    function startAfterInteraction() {
        if (window.musicPlayer.shouldAutoPlay) {
            window.musicPlayer.play();
        }
        document.removeEventListener('click', startAfterInteraction);
        document.removeEventListener('keydown', startAfterInteraction);
        document.removeEventListener('touchstart', startAfterInteraction);
    }
    
    document.addEventListener('click', startAfterInteraction);
    document.addEventListener('keydown', startAfterInteraction);
    document.addEventListener('touchstart', startAfterInteraction);
});
