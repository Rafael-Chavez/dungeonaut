// ===== AUDIO SYSTEM =====

class AudioSystem {
    constructor(game) {
        this.game = game;

        // Audio elements
        this.music = document.getElementById('background-music');

        // Volume settings (0-1 range)
        this.masterVolume = 0.7;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.7;

        // Music state
        this.isMusicPlaying = false;
        this.isFading = false;

        // Fade settings
        this.fadeInDuration = 2000; // 2 seconds
        this.fadeOutDuration = 2000; // 2 seconds
        this.fadeOutTiming = 5000; // Start fade out 5 seconds before end

        // Load saved settings
        this.loadSettings();

        // Initialize music
        if (this.music) {
            this.music.volume = 0; // Start at 0 for fade-in
            this.setupMusicLoop();
        }
    }

    // Setup music looping with fade effects
    setupMusicLoop() {
        if (!this.music) return;

        // Listen for time updates to trigger fade out before loop
        this.music.addEventListener('timeupdate', () => {
            if (!this.music.duration || !this.isMusicPlaying) return;

            const timeRemaining = this.music.duration - this.music.currentTime;

            // Start fade out before the end
            if (timeRemaining <= (this.fadeOutTiming / 1000) && timeRemaining > 0 && !this.isFading) {
                this.fadeOut();
            }
        });

        // When music ends, reset and fade in
        this.music.addEventListener('ended', () => {
            if (this.isMusicPlaying) {
                this.music.currentTime = 0;
                this.fadeIn();
            }
        });

        // Handle errors
        this.music.addEventListener('error', (e) => {
            console.error('Music playback error:', e);
        });
    }

    // Fade in effect
    fadeIn() {
        if (!this.music || this.isFading) return;

        this.isFading = true;
        const targetVolume = this.masterVolume * this.musicVolume;
        const startVolume = 0;
        const startTime = Date.now();

        const fade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / this.fadeInDuration, 1);

            // Ease-in-out curve
            const easedProgress = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            this.music.volume = startVolume + (targetVolume - startVolume) * easedProgress;

            if (progress < 1) {
                requestAnimationFrame(fade);
            } else {
                this.isFading = false;
            }
        };

        requestAnimationFrame(fade);
    }

    // Fade out effect
    fadeOut() {
        if (!this.music || this.isFading) return;

        this.isFading = true;
        const startVolume = this.music.volume;
        const targetVolume = 0;
        const startTime = Date.now();

        const fade = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / this.fadeOutDuration, 1);

            // Ease-in-out curve
            const easedProgress = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            this.music.volume = startVolume - (startVolume - targetVolume) * easedProgress;

            if (progress < 1) {
                requestAnimationFrame(fade);
            } else {
                this.isFading = false;
            }
        };

        requestAnimationFrame(fade);
    }

    // Toggle music playback
    async toggleMusic() {
        if (!this.music) return;

        const statusText = document.getElementById('music-status');

        if (this.isMusicPlaying) {
            // Stop music with fade out
            this.isFading = true;
            const startVolume = this.music.volume;
            const startTime = Date.now();

            const fade = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / this.fadeOutDuration, 1);

                this.music.volume = startVolume * (1 - progress);

                if (progress < 1) {
                    requestAnimationFrame(fade);
                } else {
                    this.music.pause();
                    this.isMusicPlaying = false;
                    this.isFading = false;
                    if (statusText) statusText.textContent = '▶️ Play';
                }
            };

            requestAnimationFrame(fade);
        } else {
            // Start music with fade in
            try {
                this.music.volume = 0;
                await this.music.play();
                this.isMusicPlaying = true;
                this.fadeIn();
                if (statusText) statusText.textContent = '⏸️ Pause';
            } catch (error) {
                console.error('Failed to play music:', error);
                alert('Unable to play music. Please check your browser settings and ensure autoplay is allowed.');
            }
        }
    }

    // Set master volume (0-100)
    setMasterVolume(value) {
        this.masterVolume = value / 100;
        this.updateMusicVolume();
        this.updateVolumeDisplay('master-volume-value', value);
        this.saveSettings();
    }

    // Set music volume (0-100)
    setMusicVolume(value) {
        this.musicVolume = value / 100;
        this.updateMusicVolume();
        this.updateVolumeDisplay('music-volume-value', value);
        this.saveSettings();
    }

    // Set SFX volume (0-100)
    setSFXVolume(value) {
        this.sfxVolume = value / 100;
        this.updateVolumeDisplay('sfx-volume-value', value);
        this.saveSettings();
    }

    // Update music volume based on master and music settings
    updateMusicVolume() {
        if (!this.music || this.isFading) return;
        this.music.volume = this.masterVolume * this.musicVolume;
    }

    // Update volume display
    updateVolumeDisplay(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = `${Math.round(value)}%`;
        }
    }

    // Play sound effect
    playSFX(soundId) {
        // Future implementation for sound effects
        const volume = this.masterVolume * this.sfxVolume;
        console.log(`Playing SFX: ${soundId} at volume ${volume}`);

        // You can add individual sound effects here
        // Example:
        // const sfx = new Audio(`sounds/${soundId}.wav`);
        // sfx.volume = volume;
        // sfx.play();
    }

    // Save settings to localStorage
    saveSettings() {
        const settings = {
            masterVolume: this.masterVolume,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            isMusicPlaying: this.isMusicPlaying
        };

        localStorage.setItem('dungeonaut_audio_settings', JSON.stringify(settings));
    }

    // Load settings from localStorage
    loadSettings() {
        const saved = localStorage.getItem('dungeonaut_audio_settings');

        if (saved) {
            try {
                const settings = JSON.parse(saved);
                this.masterVolume = settings.masterVolume || 0.7;
                this.musicVolume = settings.musicVolume || 0.5;
                this.sfxVolume = settings.sfxVolume || 0.7;

                // Update UI
                this.updateVolumeDisplay('master-volume-value', this.masterVolume * 100);
                this.updateVolumeDisplay('music-volume-value', this.musicVolume * 100);
                this.updateVolumeDisplay('sfx-volume-value', this.sfxVolume * 100);

                // Update sliders
                const masterSlider = document.getElementById('master-volume');
                const musicSlider = document.getElementById('music-volume');
                const sfxSlider = document.getElementById('sfx-volume');

                if (masterSlider) masterSlider.value = this.masterVolume * 100;
                if (musicSlider) musicSlider.value = this.musicVolume * 100;
                if (sfxSlider) sfxSlider.value = this.sfxVolume * 100;

                // Auto-play music if it was playing before
                if (settings.isMusicPlaying && this.music) {
                    // Delay auto-play slightly to ensure user interaction
                    setTimeout(() => {
                        this.toggleMusic();
                    }, 500);
                }
            } catch (e) {
                console.error('Failed to load audio settings:', e);
            }
        }
    }

    // Initialize audio on user interaction (required by browsers)
    initializeOnUserAction() {
        if (!this.music) return;

        // Try to play and pause immediately to unlock audio
        const unlockAudio = async () => {
            try {
                await this.music.play();
                this.music.pause();
                this.music.currentTime = 0;
                console.log('✅ Audio unlocked');
            } catch (e) {
                console.log('Audio not yet unlocked:', e.message);
            }
        };

        unlockAudio();
    }

    // Stop all audio
    stopAll() {
        if (this.music && this.isMusicPlaying) {
            this.toggleMusic();
        }
    }
}