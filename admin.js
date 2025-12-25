// Admin Dashboard System with Role-Based Access Control (RBAC)
class AdminSystem {
    constructor(game) {
        this.game = game;
        this.currentUser = null;
        this.userRole = null;

        // Role hierarchy: higher number = more permissions
        this.roles = {
            'player': { level: 0, name: 'Player' },
            'tester': { level: 1, name: 'Tester' },
            'moderator': { level: 2, name: 'Moderator' },
            'admin': { level: 3, name: 'Admin' }
        };

        // Permission definitions
        this.permissions = {
            // Player management
            'viewPlayers': ['moderator', 'admin'],
            'banPlayer': ['moderator', 'admin'],
            'unbanPlayer': ['admin'],
            'editPlayerStats': ['admin'],

            // Content moderation
            'viewReports': ['moderator', 'admin'],
            'resolveReports': ['moderator', 'admin'],
            'deleteContent': ['moderator', 'admin'],

            // Game settings
            'viewGameSettings': ['admin'],
            'editGameSettings': ['admin'],
            'createGlobalEvent': ['admin'],

            // Testing
            'accessTestEnvironment': ['tester', 'admin'],
            'viewStagingFeatures': ['tester', 'admin'],
            'debugMode': ['tester', 'admin'],

            // Analytics
            'viewAnalytics': ['moderator', 'admin'],
            'exportData': ['admin']
        };
    }

    // Check if current user has a specific permission
    hasPermission(permission) {
        if (!this.userRole) return false;

        const allowedRoles = this.permissions[permission] || [];
        return allowedRoles.includes(this.userRole);
    }

    // Check if user has minimum role level
    hasRoleLevel(requiredRole) {
        if (!this.userRole) return false;

        const userLevel = this.roles[this.userRole]?.level || 0;
        const requiredLevel = this.roles[requiredRole]?.level || 0;

        return userLevel >= requiredLevel;
    }

    // Load user role from Firestore
    async loadUserRole(userId) {
        if (!this.game.authSystem.db) return null;

        try {
            const doc = await this.game.authSystem.db
                .collection('userRoles')
                .doc(userId)
                .get();

            if (doc.exists) {
                const data = doc.data();
                this.userRole = data.role || 'player';
                this.currentUser = userId;
                console.log(`User role loaded: ${this.userRole}`);
                return this.userRole;
            } else {
                // Default to player role
                this.userRole = 'player';
                return 'player';
            }
        } catch (error) {
            console.error('Error loading user role:', error);
            this.userRole = 'player';
            return 'player';
        }
    }

    // Show admin dashboard (only if user has permissions)
    async showAdminDashboard() {
        if (!this.game.authSystem.isLoggedIn()) {
            alert('You must be logged in to access the admin dashboard.');
            return;
        }

        // Load user role
        await this.loadUserRole(this.game.authSystem.user.uid);

        // Check if user has any admin permissions
        if (!this.hasRoleLevel('tester')) {
            alert('You do not have permission to access the admin dashboard.');
            return;
        }

        this.game.showScreen('admin-dashboard-screen');
        this.renderAdminDashboard();
    }

    // Render admin dashboard UI
    renderAdminDashboard() {
        const container = document.getElementById('admin-dashboard-content');
        if (!container) return;

        const roleName = this.roles[this.userRole]?.name || 'Player';
        const roleColor = this.getRoleColor(this.userRole);

        let html = `
            <div class="admin-header">
                <h2>Admin Dashboard</h2>
                <div class="admin-role-badge" style="background: ${roleColor}">
                    ${roleName}
                </div>
            </div>

            <div class="admin-sections">
        `;

        // Player Management Section
        if (this.hasPermission('viewPlayers')) {
            html += this.renderPlayerManagementSection();
        }

        // Content Moderation Section
        if (this.hasPermission('viewReports')) {
            html += this.renderModerationSection();
        }

        // Game Settings Section
        if (this.hasPermission('viewGameSettings')) {
            html += this.renderGameSettingsSection();
        }

        // Test Environment Section
        if (this.hasPermission('accessTestEnvironment')) {
            html += this.renderTestEnvironmentSection();
        }

        // Analytics Section
        if (this.hasPermission('viewAnalytics')) {
            html += this.renderAnalyticsSection();
        }

        html += `
            </div>
            <div class="admin-actions">
                <button class="btn btn-secondary" onclick="adminSystem.closeAdminDashboard()">
                    Close Dashboard
                </button>
            </div>
        `;

        container.innerHTML = html;
    }

    // Player Management Section
    renderPlayerManagementSection() {
        return `
            <div class="admin-section">
                <h3>👥 Player Management</h3>
                <div class="admin-controls">
                    <button class="admin-btn" onclick="adminSystem.showPlayerList()">
                        View All Players
                    </button>
                    ${this.hasPermission('banPlayer') ? `
                        <button class="admin-btn admin-btn-warning" onclick="adminSystem.showBanPlayer()">
                            Ban Player
                        </button>
                    ` : ''}
                    ${this.hasPermission('unbanPlayer') ? `
                        <button class="admin-btn admin-btn-success" onclick="adminSystem.showUnbanPlayer()">
                            Unban Player
                        </button>
                    ` : ''}
                    ${this.hasPermission('editPlayerStats') ? `
                        <button class="admin-btn" onclick="adminSystem.showEditPlayerStats()">
                            Edit Player Stats
                        </button>
                    ` : ''}
                </div>
                <div id="player-management-output" class="admin-output"></div>
            </div>
        `;
    }

    // Content Moderation Section
    renderModerationSection() {
        return `
            <div class="admin-section">
                <h3>🛡️ Content Moderation</h3>
                <div class="admin-controls">
                    <button class="admin-btn" onclick="adminSystem.showReports()">
                        View Reports (0)
                    </button>
                    ${this.hasPermission('deleteContent') ? `
                        <button class="admin-btn admin-btn-danger" onclick="adminSystem.showDeleteContent()">
                            Delete Content
                        </button>
                    ` : ''}
                </div>
                <div id="moderation-output" class="admin-output"></div>
            </div>
        `;
    }

    // Game Settings Section
    renderGameSettingsSection() {
        return `
            <div class="admin-section">
                <h3>⚙️ Game Settings</h3>
                <div class="admin-controls">
                    <button class="admin-btn" onclick="adminSystem.showGameSettings()">
                        View Settings
                    </button>
                    ${this.hasPermission('createGlobalEvent') ? `
                        <button class="admin-btn admin-btn-primary" onclick="adminSystem.createGlobalEvent()">
                            Create Global Event
                        </button>
                    ` : ''}
                    ${this.hasPermission('editGameSettings') ? `
                        <button class="admin-btn" onclick="adminSystem.editMaintenanceMode()">
                            Toggle Maintenance Mode
                        </button>
                    ` : ''}
                </div>
                <div id="game-settings-output" class="admin-output"></div>
            </div>
        `;
    }

    // Test Environment Section
    renderTestEnvironmentSection() {
        return `
            <div class="admin-section">
                <h3>🧪 Test Environment</h3>
                <div class="admin-controls">
                    <button class="admin-btn" onclick="adminSystem.toggleDebugMode()">
                        Toggle Debug Mode
                    </button>
                    <button class="admin-btn" onclick="adminSystem.resetPlayerStats()">
                        Reset Test Stats
                    </button>
                    <button class="admin-btn" onclick="adminSystem.unlockAllAchievements()">
                        Unlock All Achievements (Test)
                    </button>
                    <button class="admin-btn" onclick="adminSystem.simulateBattle()">
                        Simulate Battle
                    </button>
                </div>
                <div id="test-output" class="admin-output"></div>
            </div>
        `;
    }

    // Analytics Section
    renderAnalyticsSection() {
        return `
            <div class="admin-section">
                <h3>📊 Analytics</h3>
                <div class="admin-stats-grid">
                    <div class="admin-stat-card">
                        <div class="admin-stat-label">Total Players</div>
                        <div class="admin-stat-value" id="total-players">-</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="admin-stat-label">Active Today</div>
                        <div class="admin-stat-value" id="active-today">-</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="admin-stat-label">Total Matches</div>
                        <div class="admin-stat-value" id="total-matches">-</div>
                    </div>
                    <div class="admin-stat-card">
                        <div class="admin-stat-label">Banned Players</div>
                        <div class="admin-stat-value" id="banned-players">-</div>
                    </div>
                </div>
                <div class="admin-controls">
                    <button class="admin-btn" onclick="adminSystem.loadAnalytics()">
                        Refresh Analytics
                    </button>
                    ${this.hasPermission('exportData') ? `
                        <button class="admin-btn" onclick="adminSystem.exportAnalytics()">
                            Export Data
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Helper: Get role color
    getRoleColor(role) {
        const colors = {
            'player': '#64748b',
            'tester': '#22c55e',
            'moderator': '#3b82f6',
            'admin': '#ef4444'
        };
        return colors[role] || colors.player;
    }

    // Player Management Actions
    async showPlayerList() {
        const output = document.getElementById('player-management-output');
        if (!output) return;

        output.innerHTML = '<p>Loading players...</p>';

        try {
            const snapshot = await this.game.authSystem.db
                .collection('users')
                .limit(50)
                .get();

            let html = '<div class="player-list">';
            snapshot.forEach(doc => {
                const data = doc.data();
                html += `
                    <div class="player-item">
                        <strong>${data.username || data.email}</strong>
                        <span>${data.email}</span>
                        <span class="player-id">ID: ${doc.id.substring(0, 8)}...</span>
                    </div>
                `;
            });
            html += '</div>';

            output.innerHTML = html || '<p>No players found.</p>';
        } catch (error) {
            console.error('Error loading players:', error);
            output.innerHTML = '<p class="error">Error loading players.</p>';
        }
    }

    async showBanPlayer() {
        if (!this.hasPermission('banPlayer')) {
            alert('You do not have permission to ban players.');
            return;
        }

        const userId = prompt('Enter the user ID or email to ban:');
        if (!userId) return;

        const reason = prompt('Enter ban reason:');
        if (!reason) return;

        try {
            // Add to banned users collection
            await this.game.authSystem.db.collection('bannedUsers').doc(userId).set({
                bannedBy: this.game.authSystem.user.uid,
                bannedByName: this.game.authSystem.user.username,
                reason: reason,
                bannedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert('User has been banned successfully.');
            this.showPlayerList();
        } catch (error) {
            console.error('Error banning user:', error);
            alert('Error banning user: ' + error.message);
        }
    }

    async showUnbanPlayer() {
        if (!this.hasPermission('unbanPlayer')) {
            alert('You do not have permission to unban players.');
            return;
        }

        const userId = prompt('Enter the user ID to unban:');
        if (!userId) return;

        try {
            await this.game.authSystem.db.collection('bannedUsers').doc(userId).delete();
            alert('User has been unbanned successfully.');
        } catch (error) {
            console.error('Error unbanning user:', error);
            alert('Error unbanning user: ' + error.message);
        }
    }

    // Test Environment Actions
    toggleDebugMode() {
        this.game.debugMode = !this.game.debugMode;
        const output = document.getElementById('test-output');
        if (output) {
            output.innerHTML = `<p>Debug mode: <strong>${this.game.debugMode ? 'ON' : 'OFF'}</strong></p>`;
        }
        console.log('Debug mode:', this.game.debugMode);
    }

    resetPlayerStats() {
        if (confirm('Are you sure you want to reset your test stats?')) {
            this.game.arenaStats = this.game.loadArenaStats();
            this.game.achievements = this.game.loadAchievements();
            localStorage.removeItem('dungeonaut_arena_stats');
            localStorage.removeItem('dungeonaut_achievements');

            const output = document.getElementById('test-output');
            if (output) {
                output.innerHTML = '<p>Stats reset successfully!</p>';
            }
        }
    }

    unlockAllAchievements() {
        const allAchievements = this.game.getAllAchievements();
        allAchievements.forEach(ach => {
            this.game.achievements[ach.id] = {
                unlocked: true,
                unlockedAt: new Date().toISOString()
            };
        });
        this.game.saveAchievements();

        const output = document.getElementById('test-output');
        if (output) {
            output.innerHTML = `<p>Unlocked ${allAchievements.length} achievements!</p>`;
        }
    }

    simulateBattle() {
        const output = document.getElementById('test-output');
        if (output) {
            output.innerHTML = '<p>Simulating battle with random stats...</p>';
        }

        // Simulate a quick battle
        setTimeout(() => {
            const randomDamage = Math.floor(Math.random() * 500) + 100;
            const randomTurns = Math.floor(Math.random() * 20) + 5;

            if (output) {
                output.innerHTML = `
                    <p>Battle simulated!</p>
                    <p>Damage dealt: ${randomDamage}</p>
                    <p>Turns: ${randomTurns}</p>
                `;
            }
        }, 1000);
    }

    // Game Settings Actions
    async showGameSettings() {
        const output = document.getElementById('game-settings-output');
        if (!output) return;

        try {
            const doc = await this.game.authSystem.db
                .collection('gameSettings')
                .doc('global')
                .get();

            if (doc.exists) {
                const settings = doc.data();
                output.innerHTML = `
                    <div class="settings-display">
                        <p><strong>Maintenance Mode:</strong> ${settings.maintenanceMode ? 'ON' : 'OFF'}</p>
                        <p><strong>Server Status:</strong> ${settings.serverStatus || 'Online'}</p>
                        <p><strong>Max Players:</strong> ${settings.maxPlayers || 'Unlimited'}</p>
                    </div>
                `;
            } else {
                output.innerHTML = '<p>No settings found.</p>';
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            output.innerHTML = '<p class="error">Error loading settings.</p>';
        }
    }

    async createGlobalEvent() {
        if (!this.hasPermission('createGlobalEvent')) {
            alert('You do not have permission to create global events.');
            return;
        }

        const eventName = prompt('Enter event name:');
        if (!eventName) return;

        const eventDescription = prompt('Enter event description:');
        if (!eventDescription) return;

        try {
            await this.game.authSystem.db.collection('globalEvents').add({
                name: eventName,
                description: eventDescription,
                createdBy: this.game.authSystem.user.uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                active: true
            });

            alert('Global event created successfully!');
        } catch (error) {
            console.error('Error creating event:', error);
            alert('Error creating event: ' + error.message);
        }
    }

    // Analytics Actions
    async loadAnalytics() {
        try {
            // Total players
            const usersSnapshot = await this.game.authSystem.db
                .collection('users')
                .get();
            document.getElementById('total-players').textContent = usersSnapshot.size;

            // Banned players
            const bannedSnapshot = await this.game.authSystem.db
                .collection('bannedUsers')
                .get();
            document.getElementById('banned-players').textContent = bannedSnapshot.size;

            // Mock data for other stats (would need proper implementation)
            document.getElementById('active-today').textContent = Math.floor(usersSnapshot.size * 0.3);
            document.getElementById('total-matches').textContent = Math.floor(usersSnapshot.size * 5);
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    exportAnalytics() {
        if (!this.hasPermission('exportData')) {
            alert('You do not have permission to export data.');
            return;
        }

        const data = {
            exportedAt: new Date().toISOString(),
            exportedBy: this.game.authSystem.user.username,
            totalPlayers: document.getElementById('total-players').textContent,
            activeToday: document.getElementById('active-today').textContent,
            totalMatches: document.getElementById('total-matches').textContent,
            bannedPlayers: document.getElementById('banned-players').textContent
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dungeonaut-analytics-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Close dashboard
    closeAdminDashboard() {
        this.game.showMainMenu();
    }
}

// Initialize global instance (will be created when game loads)
let adminSystem = null;