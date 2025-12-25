// Firebase Authentication and Cloud Sync System
class AuthSystem {
    constructor(game) {
        this.game = game;
        this.user = null;
        this.db = null;
        this.auth = null;

        // Check if user was previously logged in
        const savedUser = localStorage.getItem('dungeonaut_logged_in_user');
        if (savedUser) {
            try {
                this.user = JSON.parse(savedUser);
            } catch (e) {
                console.error('Failed to load saved user:', e);
            }
        }
    }

    // Initialize Firebase
    initFirebase() {
        // Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyCL002zCojl9Av94F5Pkt0rPwZ6A0ehRAg",
            authDomain: "dungeonaut-b25af.firebaseapp.com",
            projectId: "dungeonaut-b25af",
            storageBucket: "dungeonaut-b25af.firebasestorage.app",
            messagingSenderId: "521383389352",
            appId: "1:521383389352:web:6aaa7e7784f2c4da923a9d",
            measurementId: "G-1BQD8Z2S2Q"
        };

        // Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
            console.warn('Firebase not loaded. Authentication disabled.');
            alert('Firebase libraries not loaded. Please check your internet connection and reload the page.');
            return false;
        }

        try {
            firebase.initializeApp(firebaseConfig);
            this.auth = firebase.auth();
            this.db = firebase.firestore();

            console.log('✅ Firebase initialized successfully');

            // Listen for auth state changes
            this.auth.onAuthStateChanged((user) => {
                if (user) {
                    this.onUserLoggedIn(user);
                } else {
                    this.onUserLoggedOut();
                }
            });

            return true;
        } catch (error) {
            console.error('❌ Firebase initialization error:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                projectId: firebaseConfig.projectId
            });

            // Show helpful error message to user
            if (error.code === 'auth/configuration-not-found') {
                console.error('⚠️ Firebase Authentication is not properly configured.');
                console.error('Please ensure:');
                console.error('1. Firebase Authentication is enabled in Firebase Console');
                console.error('2. Email/Password sign-in method is enabled');
                console.error('3. The API key has the correct permissions');
            }

            return false;
        }
    }

    // Show login screen
    showLoginScreen() {
        this.game.showScreen('login-screen');
    }

    // Register new user
    async register(email, password, username) {
        if (!this.auth) {
            alert('Authentication not available. Playing in offline mode.');
            return false;
        }

        try {
            // Create user account
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update display name
            await user.updateProfile({
                displayName: username
            });

            // Create user document in Firestore
            await this.db.collection('users').doc(user.uid).set({
                username: username,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Initialize empty stats
            await this.saveStatsToCloud({
                arenaStats: this.game.arenaStats,
                achievements: this.game.achievements,
                pvpLoadouts: this.game.pvpLoadouts
            });

            return true;
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed: ' + error.message);
            return false;
        }
    }

    // Login existing user
    async login(email, password) {
        if (!this.auth) {
            alert('Authentication not available. Playing in offline mode.');
            return false;
        }

        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update last login
            await this.db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed: ' + error.message);
            return false;
        }
    }

    // Logout
    async logout() {
        if (!this.auth) return;

        try {
            await this.auth.signOut();
            localStorage.removeItem('dungeonaut_logged_in_user');
            this.user = null;

            // Clear local data
            this.game.arenaStats = this.game.loadArenaStats();
            this.game.achievements = this.game.loadAchievements();

            this.game.showMainMenu();
        } catch (error) {
            console.error('Logout error:', error);
            alert('Logout failed: ' + error.message);
        }
    }

    // Called when user logs in
    async onUserLoggedIn(user) {
        this.user = {
            uid: user.uid,
            email: user.email,
            username: user.displayName || user.email
        };

        localStorage.setItem('dungeonaut_logged_in_user', JSON.stringify(this.user));

        // Load stats from cloud
        await this.loadStatsFromCloud();

        // Update UI
        this.updateAuthUI();

        console.log('User logged in:', this.user.username);
    }

    // Called when user logs out
    onUserLoggedOut() {
        this.user = null;
        localStorage.removeItem('dungeonaut_logged_in_user');
        this.updateAuthUI();
        console.log('User logged out');
    }

    // Save stats to cloud
    async saveStatsToCloud(data = null) {
        if (!this.user || !this.db) return;

        const statsToSave = data || {
            arenaStats: this.game.arenaStats,
            achievements: this.game.achievements,
            pvpLoadouts: this.game.pvpLoadouts
        };

        try {
            // Sanitize data to remove functions (Firestore doesn't support functions)
            const sanitizedStats = this.sanitizeForFirestore(statsToSave);

            await this.db.collection('playerStats').doc(this.user.uid).set({
                ...sanitizedStats,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log('Stats saved to cloud');
        } catch (error) {
            console.error('Error saving stats to cloud:', error);
        }
    }

    // Helper function to remove functions and other non-serializable data
    sanitizeForFirestore(obj) {
        return JSON.parse(JSON.stringify(obj, (key, value) => {
            // Skip functions
            if (typeof value === 'function') {
                return undefined;
            }
            // Skip undefined values
            if (value === undefined) {
                return null;
            }
            return value;
        }));
    }

    // Load stats from cloud
    async loadStatsFromCloud() {
        if (!this.user || !this.db) return;

        try {
            const doc = await this.db.collection('playerStats').doc(this.user.uid).get();

            if (doc.exists) {
                const data = doc.data();

                // Merge cloud data with local
                if (data.arenaStats) {
                    this.game.arenaStats = data.arenaStats;
                    this.game.saveArenaStats();
                }

                if (data.achievements) {
                    this.game.achievements = data.achievements;
                    this.game.saveAchievements();
                }

                if (data.pvpLoadouts) {
                    this.game.pvpLoadouts = data.pvpLoadouts;
                    localStorage.setItem('dungeonaut_pvp_loadouts', JSON.stringify(data.pvpLoadouts));
                }

                console.log('Stats loaded from cloud');
            } else {
                console.log('No cloud stats found, using local data');
                // Save current local stats to cloud
                await this.saveStatsToCloud();
            }
        } catch (error) {
            console.error('Error loading stats from cloud:', error);
        }
    }

    // Update UI based on auth state
    updateAuthUI() {
        const loginBtn = document.getElementById('auth-login-btn');
        const logoutBtn = document.getElementById('auth-logout-btn');
        const userDisplay = document.getElementById('auth-user-display');

        if (this.user) {
            // Logged in
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline-block';
            if (userDisplay) {
                userDisplay.textContent = `Logged in as: ${this.user.username}`;
                userDisplay.style.display = 'block';
            }
        } else {
            // Logged out
            if (loginBtn) loginBtn.style.display = 'inline-block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (userDisplay) {
                userDisplay.textContent = 'Not logged in (stats are local only)';
                userDisplay.style.display = 'block';
            }
        }
    }

    // Guest mode (offline play)
    playAsGuest() {
        this.game.showMainMenu();
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.user !== null && this.auth && this.auth.currentUser !== null;
    }
}