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

    async loadSymptoms() {
        const content = document.getElementById('page-content');
        content.innerHTML = `
            <div class="page-header">
                <h1>Symptoms</h1>
                <p>Track and manage your symptoms</p>
            </div>
            
            <div class="symptoms-container">
                <!-- Quick Log Section -->
                <div class="symptoms-card">
                    <h3>📝 Log New Symptom</h3>
                    <form id="symptom-form" class="symptom-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="symptom-type">Symptom Type</label>
                                <select id="symptom-type" name="symptom" required>
                                    <option value="">Select symptom type</option>
                                    <option value="fatigue">💤 Fatigue</option>
                                    <option value="pain">⚡ Pain</option>
                                    <option value="nausea">🤢 Nausea</option>
                                    <option value="headache">🤕 Headache</option>
                                    <option value="dizziness">💫 Dizziness</option>
                                    <option value="insomnia">🌙 Insomnia</option>
                                    <option value="anxiety">😰 Anxiety</option>
                                    <option value="fever">🌡️ Fever</option>
                                    <option value="mood">😔 Mood</option>
                                    <option value="sleep_quality">🛏️ Sleep Quality</option>
                                    <option value="appetite">🍽️ Appetite</option>
                                    <option value="energy">⚡ Energy</option>
                                    <option value="other">📋 Other</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="symptom-severity">Severity (1-10)</label>
                                <div class="severity-slider">
                                    <input type="range" id="symptom-severity" name="severity" min="1" max="10" value="5" required>
                                    <div class="severity-labels">
                                        <span>1<br><small>Mild</small></span>
                                        <span>5<br><small>Moderate</small></span>
                                        <span>10<br><small>Severe</small></span>
                                    </div>
                                    <div class="severity-value">
                                        <span id="severity-display">5</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="symptom-notes">Notes (Optional)</label>
                            <textarea id="symptom-notes" name="notes" rows="3" placeholder="Describe what you're experiencing, triggers, location, etc."></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="symptom-date">Date & Time</label>
                                <input type="datetime-local" id="symptom-date" name="occurred_at" required>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary">
                            <span class="btn-icon">✅</span>
                            Log Symptom
                        </button>
                    </form>
                </div>
                
                <!-- Recent Symptoms -->
                <div class="symptoms-card">
                    <div class="card-header">
                        <h3>📊 Recent Symptoms</h3>
                        <div class="filter-controls">
                            <select id="symptom-filter" class="filter-select">
                                <option value="">All symptoms</option>
                                <option value="fatigue">💤 Fatigue</option>
                                <option value="pain">⚡ Pain</option>
                                <option value="nausea">🤢 Nausea</option>
                                <option value="headache">🤕 Headache</option>
                                <option value="dizziness">💫 Dizziness</option>
                                <option value="insomnia">🌙 Insomnia</option>
                                <option value="anxiety">😰 Anxiety</option>
                                <option value="fever">🌡️ Fever</option>
                                <option value="mood">😔 Mood</option>
                                <option value="sleep_quality">🛏️ Sleep Quality</option>
                                <option value="appetite">🍽️ Appetite</option>
                                <option value="energy">⚡ Energy</option>
                                <option value="other">📋 Other</option>
                            </select>
                        </div>
                    </div>
                    <div id="symptoms-list" class="symptoms-list">
                        <div class="loading-placeholder">Loading symptoms...</div>
                    </div>
                </div>
            </div>
        `;

        this.addSymptomsStyles();
        this.bindSymptomEvents();
        this.setDefaultDateTime();
        this.loadSymptomsList();
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

    // Symptom Management Methods
    bindSymptomEvents() {
        // Severity slider
        const severitySlider = document.getElementById('symptom-severity');
        const severityDisplay = document.getElementById('severity-display');
        
        if (severitySlider && severityDisplay) {
            severitySlider.addEventListener('input', (e) => {
                severityDisplay.textContent = e.target.value;
                this.updateSeverityColor(e.target.value);
            });
        }

        // Symptom form submission
        const symptomForm = document.getElementById('symptom-form');
        if (symptomForm) {
            symptomForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSymptomSubmit();
            });
        }

        // Filter change
        const filterSelect = document.getElementById('symptom-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterSymptoms(e.target.value);
            });
        }
    }

    setDefaultDateTime() {
        const dateInput = document.getElementById('symptom-date');
        if (dateInput) {
            const now = new Date();
            const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            dateInput.value = localDateTime;
        }
    }

    updateSeverityColor(value) {
        const severityDisplay = document.getElementById('severity-display');
        if (!severityDisplay) return;

        const severity = parseInt(value);
        let backgroundColor = 'var(--primary-green)';
        let textColor = 'var(--white)';
        
        if (severity <= 3) {
            backgroundColor = '#22C55E'; // bright green
            textColor = 'var(--white)';
        } else if (severity <= 6) {
            backgroundColor = 'var(--warning)';
            textColor = 'var(--white)';
        } else {
            backgroundColor = 'var(--error)';
            textColor = 'var(--white)';
        }
        
        severityDisplay.style.backgroundColor = backgroundColor;
        severityDisplay.style.color = textColor;
        severityDisplay.style.fontWeight = '600';
    }

    async handleSymptomSubmit() {
        const form = document.getElementById('symptom-form');
        const submitBtn = form.querySelector('button[type="submit"]');
        const formData = new FormData(form);

        const symptomData = {
            symptom: formData.get('symptom'),
            severity: parseInt(formData.get('severity')),
            notes: formData.get('notes') || null,
            occurred_at: formData.get('occurred_at')
        };

        // Debug logging
        console.log('Form data being submitted:', symptomData);

        // Validation
        if (!symptomData.symptom || !symptomData.severity || !symptomData.occurred_at) {
            this.showToast('Please fill in all required fields', 'error');
            console.log('Validation failed:', {
                symptom: !!symptomData.symptom,
                severity: !!symptomData.severity,
                occurred_at: !!symptomData.occurred_at
            });
            return;
        }

        // Convert datetime to proper format for Laravel
        const formattedData = {
            ...symptomData,
            occurred_at: new Date(symptomData.occurred_at).toISOString().slice(0, 19).replace('T', ' ')
        };

        console.log('Formatted data for API:', formattedData);

        this.setFormLoading(form, true);
        submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Logging...';

        try {
            const response = await this.apiCall('POST', '/symptom-logs', formattedData);
            
            if (response) {
                this.showToast('Symptom logged successfully!', 'success');
                form.reset();
                this.setDefaultDateTime();
                this.loadSymptomsList();
                
                // Reset severity display
                document.getElementById('severity-display').textContent = '5';
                this.updateSeverityColor(5);
            }
        } catch (error) {
            console.error('Symptom submission error:', error);
            console.error('Full error response:', error.message);
            
            let errorMessage = 'Failed to log symptom. Please try again.';
            
            if (error.message.includes('422')) {
                errorMessage = 'Validation error. Check the browser console for details.';
            } else if (error.message.includes('500')) {
                errorMessage = 'Server error. Please try again later.';
            } else if (error.message.includes('401')) {
                errorMessage = 'Authentication error. Please login again.';
            }
            
            this.showToast(errorMessage, 'error');
        } finally {
            this.setFormLoading(form, false);
            submitBtn.innerHTML = '<span class="btn-icon">✅</span> Log Symptom';
        }
    }

    async loadSymptomsList() {
        const listContainer = document.getElementById('symptoms-list');
        
        try {
            const response = await this.apiCall('GET', '/symptom-logs?per_page=10');
            
            if (response.data && response.data.length > 0) {
                listContainer.innerHTML = response.data.map(symptom => `
                    <div class="symptom-item" data-symptom="${symptom.symptom}">
                        <div class="symptom-icon">${this.getSymptomEmoji(symptom.symptom)}</div>
                        <div class="symptom-content">
                            <div class="symptom-header">
                                <span class="symptom-type">${this.formatSymptomName(symptom.symptom)}</span>
                                <span class="symptom-severity severity-${this.getSeverityLevel(symptom.severity)}">${symptom.severity}/10</span>
                            </div>
                            <div class="symptom-time">${this.formatDate(symptom.occurred_at)}</div>
                            ${symptom.notes ? `<div class="symptom-notes">${symptom.notes}</div>` : ''}
                        </div>
                        <div class="symptom-actions">
                            <button class="btn-icon-small" onclick="app.deleteSymptom(${symptom.id})" title="Delete">🗑️</button>
                        </div>
                    </div>
                `).join('');
            } else {
                listContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📝</div>
                        <h3>No symptoms logged yet</h3>
                        <p>Start tracking your symptoms to identify patterns and triggers.</p>
                    </div>
                `;
            }
        } catch (error) {
            listContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <h3>Failed to load symptoms</h3>
                    <p>Please try refreshing the page.</p>
                </div>
            `;
        }
    }

    filterSymptoms(symptom) {
        const symptoms = document.querySelectorAll('.symptom-item');
        symptoms.forEach(item => {
            if (!symptom || item.dataset.symptom === symptom) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    async deleteSymptom(id) {
        if (!confirm('Are you sure you want to delete this symptom log?')) {
            return;
        }

        try {
            await this.apiCall('DELETE', `/symptom-logs/${id}`);
            this.showToast('Symptom deleted successfully', 'success');
            this.loadSymptomsList();
        } catch (error) {
            this.showToast('Failed to delete symptom', 'error');
        }
    }

    getSymptomEmoji(symptom) {
        const emojis = {
            'fatigue': '💤',
            'pain': '⚡',
            'nausea': '🤢',
            'headache': '🤕',
            'dizziness': '💫',
            'insomnia': '🌙',
            'anxiety': '😰',
            'fever': '🌡️',
            'mood': '😔',
            'sleep_quality': '🛏️',
            'appetite': '🍽️',
            'energy': '⚡',
            'other': '📋'
        };
        return emojis[symptom] || '📋';
    }

    formatSymptomName(symptom) {
        const names = {
            'fatigue': 'Fatigue',
            'pain': 'Pain',
            'nausea': 'Nausea',
            'headache': 'Headache',
            'dizziness': 'Dizziness',
            'insomnia': 'Insomnia',
            'anxiety': 'Anxiety',
            'fever': 'Fever',
            'mood': 'Mood',
            'sleep_quality': 'Sleep Quality',
            'appetite': 'Appetite',
            'energy': 'Energy',
            'other': 'Other'
        };
        return names[symptom] || this.capitalizeFirst(symptom);
    }

    getSeverityLevel(severity) {
        if (severity <= 3) return 'low';
        if (severity <= 6) return 'medium';
        return 'high';
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

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
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

    addSymptomsStyles() {
        const styles = `
            <style>
            .symptoms-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 2rem;
                max-width: 1200px;
                margin: 0 auto;
            }

            .symptoms-card {
                background: var(--white);
                border-radius: var(--radius-lg);
                padding: 1.5rem;
                box-shadow: var(--shadow-sm);
                border: 1px solid var(--gray-200);
            }

            .symptoms-card h3 {
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--gray-900);
                margin-bottom: 1.5rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
            }

            .filter-controls {
                display: flex;
                gap: 0.5rem;
            }

            .filter-select {
                padding: 0.5rem 0.75rem;
                border: 1px solid var(--gray-300);
                border-radius: var(--radius-md);
                font-size: 0.875rem;
                background: var(--white);
                cursor: pointer;
            }

            .filter-select:focus {
                outline: none;
                border-color: var(--primary-green);
                box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
            }

            .symptom-form {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
            }

            .symptom-form select,
            .symptom-form textarea,
            .symptom-form input[type="datetime-local"] {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid var(--gray-200);
                border-radius: var(--radius-lg);
                font-size: var(--font-size-base);
                transition: all 0.2s ease;
            }

            .symptom-form select:focus,
            .symptom-form textarea:focus,
            .symptom-form input[type="datetime-local"]:focus {
                outline: none;
                border-color: var(--primary-green);
                box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
            }

            .symptom-form textarea {
                resize: vertical;
                min-height: 80px;
            }

            .severity-slider {
                position: relative;
                padding: 1rem 0;
            }

            .severity-slider input[type="range"] {
                width: 100%;
                height: 6px;
                border-radius: 3px;
                background: var(--gray-200);
                outline: none;
                -webkit-appearance: none;
                appearance: none;
                margin: 0.5rem 0;
            }

            .severity-slider input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: var(--primary-green);
                cursor: pointer;
                border: 2px solid var(--white);
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }

            .severity-slider input[type="range"]::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: var(--primary-green);
                cursor: pointer;
                border: 2px solid var(--white);
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }

            .severity-labels {
                display: flex;
                justify-content: space-between;
                font-size: 0.75rem;
                color: var(--gray-600);
                margin-top: 0.5rem;
            }

            .severity-labels small {
                font-size: 0.625rem;
                color: var(--gray-500);
            }

            .severity-value {
                position: absolute;
                top: -0.5rem;
                left: 50%;
                transform: translateX(-50%);
                background: var(--primary-green);
                color: var(--white);
                padding: 0.25rem 0.5rem;
                border-radius: var(--radius-md);
                font-size: 0.875rem;
                font-weight: 600;
            }

            .btn-icon {
                margin-right: 0.5rem;
            }

            .symptoms-list {
                max-height: 500px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }

            .symptom-item {
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
                padding: 1rem;
                background: var(--green-50);
                border-radius: var(--radius-lg);
                border: 1px solid var(--green-100);
                transition: all 0.2s ease;
            }

            .symptom-item:hover {
                background: var(--green-100);
                transform: translateY(-1px);
                box-shadow: var(--shadow-sm);
            }

            .symptom-icon {
                font-size: 1.5rem;
                flex-shrink: 0;
            }

            .symptom-content {
                flex: 1;
                min-width: 0;
            }

            .symptom-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.25rem;
            }

            .symptom-type {
                font-weight: 600;
                color: var(--gray-900);
                font-size: 1rem;
            }

            .symptom-severity {
                font-size: 0.875rem;
                font-weight: 600;
                padding: 0.25rem 0.5rem;
                border-radius: var(--radius-sm);
                background: var(--white);
            }

            .symptom-severity.severity-low {
                color: var(--success);
                background: rgba(16, 185, 129, 0.1);
            }

            .symptom-severity.severity-medium {
                color: var(--warning);
                background: rgba(245, 158, 11, 0.1);
            }

            .symptom-severity.severity-high {
                color: var(--error);
                background: rgba(239, 68, 68, 0.1);
            }

            .symptom-time {
                font-size: 0.875rem;
                color: var(--gray-600);
                margin-bottom: 0.5rem;
            }

            .symptom-notes {
                font-size: 0.875rem;
                color: var(--gray-700);
                background: var(--white);
                padding: 0.5rem;
                border-radius: var(--radius-md);
                border-left: 3px solid var(--primary-green);
            }

            .symptom-actions {
                display: flex;
                gap: 0.25rem;
                flex-shrink: 0;
            }

            .btn-icon-small {
                background: none;
                border: none;
                padding: 0.25rem;
                border-radius: var(--radius-sm);
                cursor: pointer;
                font-size: 0.875rem;
                opacity: 0.7;
                transition: all 0.2s ease;
            }

            .btn-icon-small:hover {
                opacity: 1;
                background: var(--white);
                transform: scale(1.1);
            }

            .empty-state,
            .error-state {
                text-align: center;
                padding: 2rem;
                color: var(--gray-600);
            }

            .empty-icon,
            .error-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
            }

            .empty-state h3,
            .error-state h3 {
                color: var(--gray-800);
                margin-bottom: 0.5rem;
            }

            .loading-placeholder {
                text-align: center;
                padding: 2rem;
                color: var(--gray-600);
                font-style: italic;
            }

            @media (max-width: 768px) {
                .symptoms-container {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }

                .form-row {
                    grid-template-columns: 1fr;
                }

                .card-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 1rem;
                }

                .symptom-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.5rem;
                }
            }
            </style>
        `;
        
        if (!document.querySelector('#symptoms-styles')) {
            const styleElement = document.createElement('div');
            styleElement.id = 'symptoms-styles';
            styleElement.innerHTML = styles;
            document.head.appendChild(styleElement);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LehtiApp();
});
