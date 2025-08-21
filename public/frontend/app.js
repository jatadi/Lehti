// Lehti Health Tracker - Frontend Application
class LehtiApp {
    constructor() {
        this.baseURL = 'http://localhost:8000/api';
        this.token = localStorage.getItem('auth_token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.currentPage = 'dashboard';
        
        this.initializeApp();
    }

    // Initialize the application
    initializeApp() {
        this.bindEvents();
        this.loadSavedCredentials();
        this.checkAuthStatus();
    }

    // Bind event listeners
    bindEvents() {
        // Auth form submissions
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('register-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Auth page switching
        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterPage();
        });

        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginPage();
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;
                this.navigateTo(page);
            });
        });
    }

    // Check if user is authenticated
    checkAuthStatus() {
        if (this.token && this.user) {
            this.showApp();
            this.loadDashboard();
        } else {
            this.showAuth();
        }
    }

    // Authentication Methods
    async handleLogin() {
        const form = document.getElementById('login-form');
        const submitBtn = form.querySelector('button[type="submit"]');
        const formData = new FormData(form);
        
        const credentials = {
            email: formData.get('email').trim(),
            password: formData.get('password')
        };

        // Basic validation
        if (!credentials.email || !credentials.password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        if (!this.isValidEmail(credentials.email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        // Disable form during submission
        this.setFormLoading(form, true);
        submitBtn.textContent = 'Signing in...';

        try {
            const response = await this.apiCall('POST', '/auth/login', credentials);
            
            if (response.token) {
                this.token = response.token;
                this.user = response.user;
                
                localStorage.setItem('auth_token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                // Handle "Remember Me"
                const rememberMe = form.querySelector('#remember-me').checked;
                if (rememberMe) {
                    localStorage.setItem('remembered_email', credentials.email);
                } else {
                    localStorage.removeItem('remembered_email');
                }
                
                this.showToast(`Welcome back, ${this.user.name}!`, 'success');
                this.showApp();
                this.loadDashboard();
                
                // Clear form
                form.reset();
            }
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'Login failed. Please try again.';
            
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                errorMessage = 'Invalid email or password. Please check your credentials.';
            } else if (error.message.includes('422') || error.message.includes('validation')) {
                errorMessage = 'Please check your input and try again.';
            } else if (error.message.includes('500')) {
                errorMessage = 'Server error. Please try again later.';
            }
            
            this.showToast(errorMessage, 'error');
        } finally {
            this.setFormLoading(form, false);
            submitBtn.textContent = 'Sign In';
        }
    }

    async handleRegister() {
        const form = document.getElementById('register-form');
        const submitBtn = form.querySelector('button[type="submit"]');
        const formData = new FormData(form);
        
        const userData = {
            name: formData.get('name').trim(),
            email: formData.get('email').trim(),
            password: formData.get('password')
        };

        // Validation
        if (!userData.name || !userData.email || !userData.password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        if (userData.name.length < 2) {
            this.showToast('Name must be at least 2 characters long', 'error');
            return;
        }

        if (!this.isValidEmail(userData.email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        if (userData.password.length < 6) {
            this.showToast('Password must be at least 6 characters long', 'error');
            return;
        }

        // Disable form during submission
        this.setFormLoading(form, true);
        submitBtn.textContent = 'Creating Account...';

        try {
            const response = await this.apiCall('POST', '/auth/register', userData);
            
            if (response.token) {
                this.token = response.token;
                this.user = response.user;
                
                localStorage.setItem('auth_token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                
                this.showToast(`Welcome to Lehti, ${this.user.name}!`, 'success');
                this.showApp();
                this.loadDashboard();
                
                // Clear form
                form.reset();
            }
        } catch (error) {
            console.error('Registration error:', error);
            let errorMessage = 'Registration failed. Please try again.';
            
            if (error.message.includes('422') || error.message.includes('validation')) {
                errorMessage = 'Please check your input. Email might already be in use.';
            } else if (error.message.includes('email') && error.message.includes('taken')) {
                errorMessage = 'This email is already registered. Please use a different email or try logging in.';
            } else if (error.message.includes('500')) {
                errorMessage = 'Server error. Please try again later.';
            }
            
            this.showToast(errorMessage, 'error');
        } finally {
            this.setFormLoading(form, false);
            submitBtn.textContent = 'Create Account';
        }
    }

    logout() {
        this.token = null;
        this.user = null;
        
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        
        this.showToast('Logged out successfully', 'success');
        this.showAuth();
    }

    // UI State Management
    showAuth() {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
    }

    showApp() {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        
        // Update user name in header
        document.getElementById('user-name').textContent = this.user.name;
    }

    showLoginPage() {
        document.getElementById('login-page').classList.add('active');
        document.getElementById('register-page').classList.remove('active');
    }

    showRegisterPage() {
        document.getElementById('register-page').classList.add('active');
        document.getElementById('login-page').classList.remove('active');
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }

    // Navigation
    navigateTo(page) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');
        
        this.currentPage = page;
        
        // Load page content
        switch (page) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'symptoms':
                this.loadSymptoms();
                break;
            case 'treatments':
                this.loadTreatments();
                break;
            case 'alerts':
                this.loadAlerts();
                break;
        }
    }

    // Page Loading Methods
    async loadDashboard() {
        const content = document.getElementById('page-content');
        content.innerHTML = `
            <div class="page-header">
                <h1>Dashboard</h1>
                <p>Overview of your health data</p>
            </div>
            
            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <h3>Quick Actions</h3>
                    <div class="quick-actions">
                        <button class="btn btn-primary" onclick="app.navigateTo('symptoms')">Log Symptom</button>
                        <button class="btn btn-outline" onclick="app.navigateTo('treatments')">Add Treatment</button>
                    </div>
                </div>
                
                <div class="dashboard-card">
                    <h3>Recent Activity</h3>
                    <div id="recent-activity">Loading...</div>
                </div>
                
                <div class="dashboard-card">
                    <h3>Active Alerts</h3>
                    <div id="active-alerts">Loading...</div>
                </div>
            </div>
        `;

        this.addDashboardStyles();
        this.loadRecentActivity();
        this.loadActiveAlerts();
    }

    async loadRecentActivity() {
        try {
            const [symptoms, treatments] = await Promise.all([
                this.apiCall('GET', '/symptom-logs?limit=3'),
                this.apiCall('GET', '/treatments?limit=3')
            ]);

            const activityContainer = document.getElementById('recent-activity');
            const recentItems = [
                ...symptoms.data.map(s => ({ type: 'symptom', ...s })),
                ...treatments.data.map(t => ({ type: 'treatment', ...t }))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

            if (recentItems.length > 0) {
                activityContainer.innerHTML = recentItems.map(item => `
                    <div class="activity-item">
                        <span class="activity-icon">${item.type === 'symptom' ? '📝' : '💊'}</span>
                        <div class="activity-content">
                            <div class="activity-title">
                                ${item.type === 'symptom' ? item.type : item.name}
                            </div>
                            <div class="activity-time">
                                ${this.formatDate(item.created_at)}
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                activityContainer.innerHTML = '<p class="text-muted">No recent activity</p>';
            }
        } catch (error) {
            document.getElementById('recent-activity').innerHTML = '<p class="text-error">Failed to load activity</p>';
        }
    }

    async loadActiveAlerts() {
        try {
            const alerts = await this.apiCall('GET', '/alerts');
            const alertsContainer = document.getElementById('active-alerts');

            if (alerts.data.length > 0) {
                alertsContainer.innerHTML = alerts.data.slice(0, 3).map(alert => `
                    <div class="alert-item severity-${alert.severity}">
                        <div class="alert-content">
                            <div class="alert-summary">${alert.summary}</div>
                            <div class="alert-time">${this.formatDate(alert.generated_at)}</div>
                        </div>
                    </div>
                `).join('');
            } else {
                alertsContainer.innerHTML = '<p class="text-muted">No active alerts</p>';
            }
        } catch (error) {
            document.getElementById('active-alerts').innerHTML = '<p class="text-error">Failed to load alerts</p>';
        }
    }

    loadSymptoms() {
        const content = document.getElementById('page-content');
        content.innerHTML = `
            <div class="page-header">
                <h1>Symptoms</h1>
                <p>Track and manage your symptoms</p>
            </div>
            <div class="page-content">
                <p>Symptom logging interface coming soon...</p>
            </div>
        `;
    }

    loadTreatments() {
        const content = document.getElementById('page-content');
        content.innerHTML = `
            <div class="page-header">
                <h1>Treatments</h1>
                <p>Manage your treatments and medications</p>
            </div>
            <div class="page-content">
                <p>Treatment management interface coming soon...</p>
            </div>
        `;
    }

    loadAlerts() {
        const content = document.getElementById('page-content');
        content.innerHTML = `
            <div class="page-header">
                <h1>Alerts</h1>
                <p>View and manage health alerts</p>
            </div>
            <div class="page-content">
                <p>Alerts interface coming soon...</p>
            </div>
        `;
    }

    // API Methods
    async apiCall(method, endpoint, data = null) {
        const url = `${this.baseURL}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        if (this.token) {
            options.headers['Authorization'] = `Bearer ${this.token}`;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `HTTP ${response.status}`);
            }

            return result;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    // Load saved credentials for "Remember Me" functionality
    loadSavedCredentials() {
        const rememberedEmail = localStorage.getItem('remembered_email');
        if (rememberedEmail) {
            const emailInput = document.getElementById('login-email');
            const rememberCheckbox = document.getElementById('remember-me');
            
            if (emailInput) {
                emailInput.value = rememberedEmail;
            }
            if (rememberCheckbox) {
                rememberCheckbox.checked = true;
            }
        }
    }

    // Utility Methods
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    setFormLoading(form, loading) {
        const inputs = form.querySelectorAll('input');
        const button = form.querySelector('button[type="submit"]');
        
        inputs.forEach(input => {
            input.disabled = loading;
        });
        
        if (button) {
            button.disabled = loading;
            if (loading) {
                button.classList.add('loading');
            } else {
                button.classList.remove('loading');
            }
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <p>${message}</p>
            </div>
        `;

        container.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    addDashboardStyles() {
        const styles = `
            <style>
            .page-header {
                margin-bottom: 2rem;
            }
            
            .page-header h1 {
                font-size: 2rem;
                font-weight: 700;
                color: var(--gray-900);
                margin-bottom: 0.5rem;
            }
            
            .page-header p {
                color: var(--gray-600);
                font-size: 1.125rem;
            }
            
            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1.5rem;
            }
            
            .dashboard-card {
                background: var(--white);
                border-radius: var(--radius-lg);
                padding: 1.5rem;
                box-shadow: var(--shadow-sm);
                border: 1px solid var(--gray-200);
            }
            
            .dashboard-card h3 {
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--gray-900);
                margin-bottom: 1rem;
            }
            
            .quick-actions {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }
            
            .quick-actions .btn {
                flex: 1;
                min-width: 120px;
            }
            
            .activity-item, .alert-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 0;
                border-bottom: 1px solid var(--gray-100);
            }
            
            .activity-item:last-child, .alert-item:last-child {
                border-bottom: none;
            }
            
            .activity-icon {
                font-size: 1.25rem;
            }
            
            .activity-content {
                flex: 1;
            }
            
            .activity-title {
                font-weight: 500;
                color: var(--gray-900);
                text-transform: capitalize;
            }
            
            .activity-time, .alert-time {
                font-size: 0.875rem;
                color: var(--gray-600);
            }
            
            .alert-content {
                flex: 1;
            }
            
            .alert-summary {
                font-weight: 500;
                color: var(--gray-900);
            }
            
            .text-muted {
                color: var(--gray-600);
                font-style: italic;
            }
            
            .text-error {
                color: var(--error);
            }
            
            .severity-high {
                border-left: 3px solid var(--error);
                padding-left: 0.75rem;
            }
            
            .severity-medium {
                border-left: 3px solid var(--warning);
                padding-left: 0.75rem;
            }
            
            .severity-low {
                border-left: 3px solid var(--info);
                padding-left: 0.75rem;
            }
            </style>
        `;
        
        if (!document.querySelector('#dashboard-styles')) {
            const styleElement = document.createElement('div');
            styleElement.id = 'dashboard-styles';
            styleElement.innerHTML = styles;
            document.head.appendChild(styleElement);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LehtiApp();
});
