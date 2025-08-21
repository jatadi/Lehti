// Lehti Health Tracker - Frontend Application
class LehtiApp {
    constructor() {
        this.baseURL = 'http://192.168.100.172:8000/api';
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
                <p>Your personalized health insights at a glance</p>
            </div>
            
            <div class="dashboard-container">
                <!-- Quick Stats -->
                <div class="dashboard-section">
                    <h3>📊 Health Overview</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">🤒</div>
                            <div class="stat-info">
                                <span class="stat-number" id="total-symptoms">-</span>
                                <span class="stat-label">Symptoms Logged</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">💊</div>
                            <div class="stat-info">
                                <span class="stat-number" id="total-treatments">-</span>
                                <span class="stat-label">Treatments Taken</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🔔</div>
                            <div class="stat-info">
                                <span class="stat-number" id="active-alerts">-</span>
                                <span class="stat-label">Active Insights</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">📈</div>
                            <div class="stat-info">
                                <span class="stat-number" id="days-tracking">-</span>
                                <span class="stat-label">Days Tracking</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="dashboard-section">
                    <h3>⚡ Quick Actions</h3>
                    <div class="quick-actions">
                        <button class="action-card" onclick="app.navigateTo('symptoms')">
                            <div class="action-icon">🤒</div>
                            <div class="action-content">
                                <h4>Log Symptom</h4>
                                <p>Track how you're feeling right now</p>
                            </div>
                        </button>
                        <button class="action-card" onclick="app.navigateTo('treatments')">
                            <div class="action-icon">💊</div>
                            <div class="action-content">
                                <h4>Add Treatment</h4>
                                <p>Record medications or therapies</p>
                            </div>
                        </button>
                        <button class="action-card" onclick="app.navigateTo('alerts')">
                            <div class="action-icon">🔔</div>
                            <div class="action-content">
                                <h4>View Insights</h4>
                                <p>See AI-powered health patterns</p>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Getting Started Guide -->
                <div class="dashboard-section" id="getting-started">
                    <h3>🚀 Getting Started</h3>
                    <div class="guide-steps">
                        <div class="step-card" id="step-symptoms">
                            <div class="step-number">1</div>
                            <div class="step-content">
                                <h4>Start Logging Symptoms</h4>
                                <p>Track how you feel daily - pain, fatigue, mood, etc. The more data you provide, the better insights you'll get.</p>
                                <button class="step-action" onclick="app.navigateTo('symptoms')">Log First Symptom</button>
                            </div>
                        </div>
                        <div class="step-card" id="step-treatments">
                            <div class="step-number">2</div>
                            <div class="step-content">
                                <h4>Record Treatments</h4>
                                <p>Log medications, therapies, exercises, and lifestyle changes to find what works best for you.</p>
                                <button class="step-action" onclick="app.navigateTo('treatments')">Add Treatment</button>
                            </div>
                        </div>
                        <div class="step-card" id="step-patterns">
                            <div class="step-number">3</div>
                            <div class="step-content">
                                <h4>Discover Patterns</h4>
                                <p>After a few days of data, AI will identify patterns and give you personalized health insights.</p>
                                <button class="step-action" onclick="app.navigateTo('alerts'); app.recomputeAlerts()">Generate Insights</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.addDashboardStyles();
        this.loadDashboardStats();
    }

    async loadDashboardStats() {
        try {
            // Load all stats in parallel
            const [symptomsRes, treatmentsRes, alertsRes] = await Promise.all([
                this.apiCall('GET', '/symptom-logs'),
                this.apiCall('GET', '/treatments'),
                this.apiCall('GET', '/alerts?resolved=all')
            ]);

            const symptoms = symptomsRes.data || [];
            const treatments = treatmentsRes.data || [];
            const alerts = alertsRes.data || [];

            // Calculate stats
            const totalSymptoms = symptoms.length;
            const totalTreatments = treatments.length;
            const activeAlerts = alerts.filter(a => !a.resolved_at).length;
            
            // Calculate days tracking (based on earliest entry)
            const allDates = [
                ...symptoms.map(s => new Date(s.occurred_at)),
                ...treatments.map(t => new Date(t.administered_at))
            ];
            
            let daysTracking = 0;
            if (allDates.length > 0) {
                const earliestDate = new Date(Math.min(...allDates));
                const daysDiff = Math.floor((new Date() - earliestDate) / (1000 * 60 * 60 * 24));
                daysTracking = Math.max(1, daysDiff);
            }

            // Update UI
            document.getElementById('total-symptoms').textContent = totalSymptoms;
            document.getElementById('total-treatments').textContent = totalTreatments;
            document.getElementById('active-alerts').textContent = activeAlerts;
            document.getElementById('days-tracking').textContent = daysTracking;

        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        }
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
            const alerts = await this.apiCall('GET', '/alerts?resolved=false');
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

    async loadTreatments() {
        const content = document.getElementById('page-content');
        content.innerHTML = `
            <div class="page-header">
                <h1>Treatments</h1>
                <p>Manage your treatments and medications</p>
            </div>
            
            <div class="treatments-container">
                <!-- Add Treatment Section -->
                <div class="treatments-card">
                    <h3>💊 Add New Treatment</h3>
                    <form id="treatment-form" class="treatment-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="treatment-name">Treatment Name</label>
                                <input type="text" id="treatment-name" name="name" required placeholder="e.g., Ibuprofen, Physical Therapy">
                            </div>
                            
                            <div class="form-group">
                                <label for="treatment-type">Type</label>
                                <select id="treatment-type" name="type" required>
                                    <option value="">Select treatment type</option>
                                    <option value="medication">💊 Medication</option>
                                    <option value="therapy">🧘 Therapy</option>
                                    <option value="exercise">🏃 Exercise</option>
                                    <option value="diet">🥗 Diet</option>
                                    <option value="supplement">🌿 Supplement</option>
                                    <option value="procedure">🏥 Procedure</option>
                                    <option value="lifestyle">🏡 Lifestyle</option>
                                    <option value="other">📋 Other</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="treatment-dosage">Dosage/Frequency</label>
                                <input type="text" id="treatment-dosage" name="dosage" placeholder="e.g., 200mg twice daily, 30 minutes daily">
                            </div>
                            
                            <div class="form-group">
                                <label for="treatment-date">Date & Time</label>
                                <input type="datetime-local" id="treatment-date" name="administered_at" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="treatment-notes">Notes (Optional)</label>
                            <textarea id="treatment-notes" name="notes" rows="3" placeholder="Additional details, side effects, effectiveness, etc."></textarea>
                        </div>
                        
                        <button type="submit" class="btn btn-primary">
                            <span class="btn-icon">✅</span>
                            Add Treatment
                        </button>
                    </form>
                </div>
                
                <!-- Recent Treatments -->
                <div class="treatments-card">
                    <div class="card-header">
                        <h3>📋 Recent Treatments</h3>
                        <div class="filter-controls">
                            <select id="treatment-filter" class="filter-select">
                                <option value="">All treatments</option>
                                <option value="medication">💊 Medication</option>
                                <option value="therapy">🧘 Therapy</option>
                                <option value="exercise">🏃 Exercise</option>
                                <option value="diet">🥗 Diet</option>
                                <option value="supplement">🌿 Supplement</option>
                                <option value="procedure">🏥 Procedure</option>
                                <option value="lifestyle">🏡 Lifestyle</option>
                                <option value="other">📋 Other</option>
                            </select>
                        </div>
                    </div>
                    <div id="treatments-list" class="treatments-list">
                        <div class="loading-placeholder">Loading treatments...</div>
                    </div>
                </div>
            </div>
        `;

        this.addTreatmentsStyles();
        this.bindTreatmentEvents();
        this.setDefaultTreatmentDateTime();
        this.loadTreatmentsList();
    }

    async loadAlerts() {
        const content = document.getElementById('page-content');
        content.innerHTML = `
            <div class="page-header">
                <h1>Alerts</h1>
                <p>AI-powered insights from your health data</p>
            </div>
            
            <div class="alerts-container">
                <!-- Alert Actions -->
                <div class="alerts-card">
                    <h3>🔔 Alert Management</h3>
                    <div class="alert-actions">
                        <button id="recompute-alerts" class="btn btn-primary">
                            <span class="btn-icon">🔄</span>
                            Recompute Alerts
                        </button>
                        <div class="alert-filters">
                            <select id="alert-filter" class="filter-select">
                                <option value="">All alerts</option>
                                <option value="unresolved" selected>🔴 Unresolved</option>
                                <option value="resolved">✅ Resolved</option>
                            </select>
                            <select id="alert-severity" class="filter-select">
                                <option value="">All severity</option>
                                <option value="high">🔴 High</option>
                                <option value="medium">🟡 Medium</option>
                                <option value="low">🟢 Low</option>
                            </select>
                        </div>
                    </div>
                    <div class="alert-stats">
                        <div class="stat-item">
                            <span class="stat-number" id="total-alerts">-</span>
                            <span class="stat-label">Total Alerts</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number" id="unresolved-alerts">-</span>
                            <span class="stat-label">Unresolved</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number" id="high-severity-alerts">-</span>
                            <span class="stat-label">High Priority</span>
                        </div>
                    </div>
                </div>
                
                <!-- Alerts List -->
                <div class="alerts-card full-width">
                    <div class="card-header">
                        <h3>📊 Health Insights & Patterns</h3>
                        <div class="alert-legend">
                            <span class="legend-item">🔴 High</span>
                            <span class="legend-item">🟡 Medium</span>
                            <span class="legend-item">🟢 Low</span>
                        </div>
                    </div>
                    <div id="alerts-list" class="alerts-list">
                        <div class="loading-placeholder">Loading health insights...</div>
                    </div>
                </div>
            </div>
        `;

        this.addAlertsStyles();
        this.bindAlertEvents();
        this.loadAlertsList();
        this.updateAlertStats();
        
        // Apply default filter after loading
        setTimeout(() => {
            this.filterAlerts();
        }, 100);
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

    // Treatment Management Methods
    bindTreatmentEvents() {
        // Treatment form submission
        const treatmentForm = document.getElementById('treatment-form');
        if (treatmentForm) {
            treatmentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTreatmentSubmit();
            });
        }

        // Filter change
        const filterSelect = document.getElementById('treatment-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterTreatments(e.target.value);
            });
        }
    }

    setDefaultTreatmentDateTime() {
        const dateInput = document.getElementById('treatment-date');
        if (dateInput) {
            const now = new Date();
            const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            dateInput.value = localDateTime;
        }
    }

    async handleTreatmentSubmit() {
        const form = document.getElementById('treatment-form');
        const submitBtn = form.querySelector('button[type="submit"]');
        const formData = new FormData(form);

        const treatmentData = {
            name: formData.get('name').trim(),
            type: formData.get('type'),
            dosage: formData.get('dosage').trim() || null,
            notes: formData.get('notes').trim() || null,
            administered_at: formData.get('administered_at')
        };

        // Debug logging
        console.log('Treatment data being submitted:', treatmentData);

        // Validation
        if (!treatmentData.name || !treatmentData.type || !treatmentData.administered_at) {
            this.showToast('Please fill in all required fields', 'error');
            console.log('Validation failed:', {
                name: !!treatmentData.name,
                type: !!treatmentData.type,
                administered_at: !!treatmentData.administered_at
            });
            return;
        }

        // Convert datetime to proper format for Laravel
        const formattedData = {
            ...treatmentData,
            administered_at: new Date(treatmentData.administered_at).toISOString().slice(0, 19).replace('T', ' ')
        };

        console.log('Formatted treatment data for API:', formattedData);

        this.setFormLoading(form, true);
        submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Adding...';

        try {
            const response = await this.apiCall('POST', '/treatments', formattedData);
            
            if (response) {
                this.showToast('Treatment added successfully!', 'success');
                form.reset();
                this.setDefaultTreatmentDateTime();
                this.loadTreatmentsList();
            }
        } catch (error) {
            console.error('Treatment submission error:', error);
            console.error('Full error response:', error.message);
            
            let errorMessage = 'Failed to add treatment. Please try again.';
            
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
            submitBtn.innerHTML = '<span class="btn-icon">✅</span> Add Treatment';
        }
    }

    async loadTreatmentsList() {
        const listContainer = document.getElementById('treatments-list');
        
        try {
            console.log('Loading treatments list...');
            const response = await this.apiCall('GET', '/treatments?per_page=10');
            console.log('Treatments API response:', response);
            
            if (response.data && response.data.length > 0) {
                listContainer.innerHTML = response.data.map(treatment => `
                    <div class="treatment-item" data-type="${treatment.type || 'other'}">
                        <div class="treatment-icon">${this.getTreatmentEmoji(treatment.type || 'other')}</div>
                        <div class="treatment-content">
                            <div class="treatment-header">
                                <span class="treatment-name">${treatment.name}</span>
                                ${treatment.type ? `<span class="treatment-type">${this.formatTreatmentType(treatment.type)}</span>` : ''}
                            </div>
                            <div class="treatment-time">${this.formatDate(treatment.administered_at)}</div>
                            ${treatment.dose ? `<div class="treatment-dosage">📏 ${treatment.dose}</div>` : ''}
                            ${treatment.notes ? `<div class="treatment-notes">${treatment.notes}</div>` : ''}
                        </div>
                        <div class="treatment-actions">
                            <button class="btn-icon-small" onclick="app.deleteTreatment(${treatment.id})" title="Delete">🗑️</button>
                        </div>
                    </div>
                `).join('');
            } else {
                listContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">💊</div>
                        <h3>No treatments recorded yet</h3>
                        <p>Start tracking your medications, therapies, and treatments.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Failed to load treatments:', error);
            listContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <h3>Failed to load treatments</h3>
                    <p>Error: ${error.message}</p>
                    <p>Check the browser console for details.</p>
                </div>
            `;
        }
    }

    filterTreatments(type) {
        const treatments = document.querySelectorAll('.treatment-item');
        treatments.forEach(item => {
            if (!type || item.dataset.type === type) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    async deleteTreatment(id) {
        if (!confirm('Are you sure you want to delete this treatment record?')) {
            return;
        }

        try {
            await this.apiCall('DELETE', `/treatments/${id}`);
            this.showToast('Treatment deleted successfully', 'success');
            this.loadTreatmentsList();
        } catch (error) {
            this.showToast('Failed to delete treatment', 'error');
        }
    }

    getTreatmentEmoji(type) {
        const emojis = {
            'medication': '💊',
            'therapy': '🧘',
            'exercise': '🏃',
            'diet': '🥗',
            'supplement': '🌿',
            'procedure': '🏥',
            'lifestyle': '🏡',
            'other': '📋'
        };
        return emojis[type] || '📋';
    }

    formatTreatmentType(type) {
        const names = {
            'medication': 'Medication',
            'therapy': 'Therapy',
            'exercise': 'Exercise',
            'diet': 'Diet',
            'supplement': 'Supplement',
            'procedure': 'Procedure',
            'lifestyle': 'Lifestyle',
            'other': 'Other'
        };
        return names[type] || this.capitalizeFirst(type);
    }

    // Alert Management Methods
    bindAlertEvents() {
        // Recompute alerts button
        const recomputeBtn = document.getElementById('recompute-alerts');
        if (recomputeBtn) {
            recomputeBtn.addEventListener('click', () => {
                this.recomputeAlerts();
            });
        }

        // Filter change handlers
        const alertFilter = document.getElementById('alert-filter');
        const severityFilter = document.getElementById('alert-severity');
        
        if (alertFilter) {
            alertFilter.addEventListener('change', () => {
                this.filterAlerts();
            });
        }
        
        if (severityFilter) {
            severityFilter.addEventListener('change', () => {
                this.filterAlerts();
            });
        }
    }

    async recomputeAlerts() {
        const btn = document.getElementById('recompute-alerts');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="btn-icon">⏳</span> Computing...';
        btn.disabled = true;

        try {
            await this.apiCall('POST', '/alerts/recompute');
            this.showToast('Alerts recomputed successfully!', 'success');
            this.loadAlertsList();
            this.updateAlertStats();
        } catch (error) {
            console.error('Failed to recompute alerts:', error);
            this.showToast('Failed to recompute alerts. Please try again.', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    async loadAlertsList() {
        const listContainer = document.getElementById('alerts-list');
        
        try {
            console.log('Loading alerts list...');
            const response = await this.apiCall('GET', '/alerts?resolved=all');
            console.log('Alerts API response:', response);
            
            if (response.data && response.data.length > 0) {
                listContainer.innerHTML = response.data.map(alert => `
                    <div class="alert-item" data-alert-id="${alert.id}" data-severity="${this.getSeverityName(alert.severity)}" data-resolved="${alert.resolved_at ? 'resolved' : 'unresolved'}">
                        <div class="alert-indicator severity-${this.getSeverityName(alert.severity)}"></div>
                        <div class="alert-content">
                            <div class="alert-header">
                                <span class="alert-title">${alert.summary}</span>
                                <div class="alert-meta">
                                    <span class="alert-severity severity-${this.getSeverityName(alert.severity)}">${this.getSeverityName(alert.severity).toUpperCase()}</span>
                                    <span class="alert-time">${this.formatDate(alert.generated_at)}</span>
                                </div>
                            </div>
                            ${alert.details ? `<div class="alert-description">${this.formatAlertDetails(alert.details)}</div>` : ''}
                            <div class="alert-recommendation">💡 ${this.generateRecommendation(alert)}</div>
                        </div>
                        <div class="alert-actions">
                            ${!alert.resolved_at ? `
                                <button class="btn-icon-small resolve-btn" onclick="app.resolveAlert(${alert.id})" title="Mark as resolved">
                                    ✅
                                </button>
                            ` : `
                                <span class="resolved-indicator" title="Resolved ${this.formatDate(alert.resolved_at)}">✅</span>
                            `}
                        </div>
                    </div>
                `).join('');
            } else {
                listContainer.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <h3>No alerts yet</h3>
                        <p>Add more symptom and treatment data to get personalized health insights.</p>
                        <button onclick="app.recomputeAlerts()" class="btn btn-outline">
                            <span class="btn-icon">🔄</span>
                            Generate Insights
                        </button>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Failed to load alerts:', error);
            listContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <h3>Failed to load alerts</h3>
                    <p>Error: ${error.message}</p>
                    <p>Check the browser console for details.</p>
                </div>
            `;
        }
    }

    async updateAlertStats() {
        try {
            const response = await this.apiCall('GET', '/alerts?resolved=all');
            const alerts = response.data || [];
            
            const totalAlerts = alerts.length;
            const unresolvedAlerts = alerts.filter(a => !a.resolved_at).length;
            const highSeverityAlerts = alerts.filter(a => this.getSeverityName(a.severity) === 'high' && !a.resolved_at).length;
            
            document.getElementById('total-alerts').textContent = totalAlerts;
            document.getElementById('unresolved-alerts').textContent = unresolvedAlerts;
            document.getElementById('high-severity-alerts').textContent = highSeverityAlerts;
        } catch (error) {
            console.error('Failed to update alert stats:', error);
        }
    }

    filterAlerts() {
        const statusFilter = document.getElementById('alert-filter').value;
        const severityFilter = document.getElementById('alert-severity').value;
        const alerts = document.querySelectorAll('.alert-item');
        
        alerts.forEach(alert => {
            let showAlert = true;
            
            // Filter by status
            if (statusFilter && alert.dataset.resolved !== statusFilter) {
                showAlert = false;
            }
            
            // Filter by severity
            if (severityFilter && alert.dataset.severity !== severityFilter) {
                showAlert = false;
            }
            
            alert.style.display = showAlert ? 'flex' : 'none';
        });
    }

    async resolveAlert(id) {
        try {
            await this.apiCall('POST', `/alerts/${id}/resolve`);
            this.showToast('Alert marked as resolved', 'success');
            
            // Update the specific alert item in the DOM
            const alertElement = document.querySelector(`[data-alert-id="${id}"]`);
            if (alertElement) {
                // Update the data attribute
                alertElement.setAttribute('data-resolved', 'resolved');
                
                // Replace the resolve button with resolved indicator
                const actionsDiv = alertElement.querySelector('.alert-actions');
                if (actionsDiv) {
                    const now = new Date().toISOString();
                    actionsDiv.innerHTML = `<span class="resolved-indicator" title="Resolved ${this.formatDate(now)}">✅</span>`;
                }
                
                // Apply current filters to show/hide the alert
                this.filterAlerts();
            }
            
            this.updateAlertStats();
        } catch (error) {
            console.error('Failed to resolve alert:', error);
            this.showToast('Failed to resolve alert', 'error');
        }
    }

    getSeverityName(severityNumber) {
        if (severityNumber >= 7) return 'high';
        if (severityNumber >= 4) return 'medium';
        return 'low';
    }

    formatAlertDetails(details) {
        if (!details) return '';
        
        try {
            const detailsObj = typeof details === 'string' ? JSON.parse(details) : details;
            let formatted = '';
            
            if (detailsObj.evidence) {
                formatted += `Based on ${detailsObj.evidence.matches} out of ${detailsObj.evidence.trials} occurrences. `;
            }
            
            if (detailsObj.confidence) {
                formatted += `Confidence: ${Math.round(detailsObj.confidence * 100)}%. `;
            }
            
            if (detailsObj.window_hours) {
                formatted += `Typically occurs ${detailsObj.window_hours[0]}-${detailsObj.window_hours[1]} hours after treatment.`;
            }
            
            return formatted;
        } catch (e) {
            return 'Additional details available.';
        }
    }

    generateRecommendation(alert) {
        const severity = this.getSeverityName(alert.severity);
        
        switch (alert.type) {
            case 'post_treatment':
                if (severity === 'high') {
                    return 'Consider discussing this pattern with your healthcare provider. This treatment may not be optimal for you.';
                } else {
                    return 'Monitor this pattern. Consider logging symptoms more frequently around treatment times.';
                }
            case 'pre_symptom':
                return 'Track potential triggers leading up to this symptom to identify preventive measures.';
            case 'effectiveness':
                return 'This treatment appears to be helping. Continue as prescribed and monitor consistency.';
            default:
                return 'Review this pattern with your healthcare provider for personalized advice.';
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
            
            .dashboard-container {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                flex-direction: column;
                gap: 2rem;
            }

            .dashboard-section {
                background: var(--white);
                border-radius: var(--radius-lg);
                padding: 1.5rem;
                box-shadow: var(--shadow-sm);
                border: 1px solid var(--gray-200);
            }

            .dashboard-section h3 {
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--gray-900);
                margin-bottom: 1.5rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }

            .stat-card {
                background: var(--green-50);
                border: 1px solid var(--green-100);
                border-radius: var(--radius-lg);
                padding: 1.5rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }

            .stat-card:hover {
                transform: translateY(-2px);
                box-shadow: var(--shadow-md);
            }

            .stat-icon {
                font-size: 2rem;
                flex-shrink: 0;
            }

            .stat-info {
                flex: 1;
            }

            .stat-number {
                display: block;
                font-size: 2rem;
                font-weight: 700;
                color: var(--primary-green);
                line-height: 1;
                margin-bottom: 0.25rem;
            }

            .stat-label {
                font-size: 0.875rem;
                color: var(--gray-600);
                font-weight: 500;
            }

            .quick-actions {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1rem;
            }

            .action-card {
                background: var(--white);
                border: 2px solid var(--gray-200);
                border-radius: var(--radius-lg);
                padding: 1.5rem;
                display: flex;
                align-items: center;
                gap: 1rem;
                text-align: left;
                cursor: pointer;
                transition: all 0.2s ease;
                text-decoration: none;
                color: inherit;
            }

            .action-card:hover {
                border-color: var(--primary-green);
                transform: translateY(-2px);
                box-shadow: var(--shadow-md);
            }

            .action-icon {
                font-size: 2rem;
                flex-shrink: 0;
            }

            .action-content h4 {
                font-size: 1.125rem;
                font-weight: 600;
                color: var(--gray-900);
                margin-bottom: 0.25rem;
            }

            .action-content p {
                font-size: 0.875rem;
                color: var(--gray-600);
                margin: 0;
            }

            .guide-steps {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .step-card {
                display: flex;
                align-items: flex-start;
                gap: 1rem;
                padding: 1.5rem;
                background: var(--gray-50);
                border-radius: var(--radius-lg);
                border: 1px solid var(--gray-200);
            }

            .step-number {
                width: 2.5rem;
                height: 2.5rem;
                background: var(--primary-green);
                color: var(--white);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 1.125rem;
                flex-shrink: 0;
            }

            .step-content {
                flex: 1;
            }

            .step-content h4 {
                font-size: 1.125rem;
                font-weight: 600;
                color: var(--gray-900);
                margin-bottom: 0.5rem;
            }

            .step-content p {
                font-size: 0.875rem;
                color: var(--gray-600);
                margin-bottom: 1rem;
                line-height: 1.5;
            }

            .step-action {
                background: var(--primary-green);
                color: var(--white);
                border: none;
                padding: 0.5rem 1rem;
                border-radius: var(--radius-md);
                font-size: 0.875rem;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.2s ease;
            }

            .step-action:hover {
                background: var(--primary-green-dark);
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

    addTreatmentsStyles() {
        const styles = `
            <style>
            .treatments-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 2rem;
                max-width: 1200px;
                margin: 0 auto;
            }

            .treatments-card {
                background: var(--white);
                border-radius: var(--radius-lg);
                padding: 1.5rem;
                box-shadow: var(--shadow-sm);
                border: 1px solid var(--gray-200);
            }

            .treatments-card h3 {
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--gray-900);
                margin-bottom: 1.5rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .treatment-form {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .treatment-form select,
            .treatment-form input,
            .treatment-form textarea {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid var(--gray-200);
                border-radius: var(--radius-lg);
                font-size: var(--font-size-base);
                transition: all 0.2s ease;
            }

            .treatment-form select:focus,
            .treatment-form input:focus,
            .treatment-form textarea:focus {
                outline: none;
                border-color: var(--primary-green);
                box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
            }

            .treatment-form textarea {
                resize: vertical;
                min-height: 80px;
            }

            .treatments-list {
                max-height: 500px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }

            .treatment-item {
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
                padding: 1rem;
                background: var(--green-50);
                border-radius: var(--radius-lg);
                border: 1px solid var(--green-100);
                transition: all 0.2s ease;
            }

            .treatment-item:hover {
                background: var(--green-100);
                transform: translateY(-1px);
                box-shadow: var(--shadow-sm);
            }

            .treatment-icon {
                font-size: 1.5rem;
                flex-shrink: 0;
            }

            .treatment-content {
                flex: 1;
                min-width: 0;
            }

            .treatment-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.25rem;
                flex-wrap: wrap;
                gap: 0.5rem;
            }

            .treatment-name {
                font-weight: 600;
                color: var(--gray-900);
                font-size: 1rem;
            }

            .treatment-type {
                font-size: 0.875rem;
                font-weight: 500;
                padding: 0.25rem 0.5rem;
                border-radius: var(--radius-sm);
                background: var(--primary-green);
                color: var(--white);
                white-space: nowrap;
            }

            .treatment-time {
                font-size: 0.875rem;
                color: var(--gray-600);
                margin-bottom: 0.5rem;
            }

            .treatment-dosage {
                font-size: 0.875rem;
                color: var(--gray-700);
                background: rgba(16, 185, 129, 0.1);
                padding: 0.25rem 0.5rem;
                border-radius: var(--radius-sm);
                margin-bottom: 0.5rem;
                display: inline-block;
            }

            .treatment-notes {
                font-size: 0.875rem;
                color: var(--gray-700);
                background: var(--white);
                padding: 0.5rem;
                border-radius: var(--radius-md);
                border-left: 3px solid var(--primary-green);
            }

            .treatment-actions {
                display: flex;
                gap: 0.25rem;
                flex-shrink: 0;
            }

            @media (max-width: 768px) {
                .treatments-container {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }

                .treatment-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.5rem;
                }
            }
            </style>
        `;
        
        if (!document.querySelector('#treatments-styles')) {
            const styleElement = document.createElement('div');
            styleElement.id = 'treatments-styles';
            styleElement.innerHTML = styles;
            document.head.appendChild(styleElement);
        }
    }

    addAlertsStyles() {
        const styles = `
            <style>
            .alerts-container {
                display: grid;
                grid-template-columns: 1fr;
                gap: 2rem;
                max-width: 1200px;
                margin: 0 auto;
            }

            .alerts-card {
                background: var(--white);
                border-radius: var(--radius-lg);
                padding: 1.5rem;
                box-shadow: var(--shadow-sm);
                border: 1px solid var(--gray-200);
            }

            .alerts-card.full-width {
                grid-column: 1 / -1;
            }

            .alerts-card h3 {
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--gray-900);
                margin-bottom: 1.5rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .alert-actions {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                margin-bottom: 1.5rem;
            }

            .alert-filters {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }

            .alert-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }

            .stat-item {
                text-align: center;
                padding: 1rem;
                background: var(--green-50);
                border-radius: var(--radius-lg);
                border: 1px solid var(--green-100);
            }

            .stat-number {
                display: block;
                font-size: 2rem;
                font-weight: 700;
                color: var(--primary-green);
                line-height: 1;
            }

            .stat-label {
                display: block;
                font-size: 0.875rem;
                color: var(--gray-600);
                margin-top: 0.25rem;
            }

            .alert-legend {
                display: flex;
                gap: 1rem;
                align-items: center;
            }

            .legend-item {
                font-size: 0.875rem;
                color: var(--gray-600);
            }

            .alerts-list {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                max-height: 600px;
                overflow-y: auto;
            }

            .alert-item {
                display: flex;
                align-items: flex-start;
                gap: 1rem;
                padding: 1.5rem;
                background: var(--white);
                border-radius: var(--radius-lg);
                border: 1px solid var(--gray-200);
                transition: all 0.2s ease;
                position: relative;
            }

            .alert-item:hover {
                transform: translateY(-1px);
                box-shadow: var(--shadow-md);
                border-color: var(--primary-green);
            }

            .alert-indicator {
                width: 8px;
                height: 100%;
                border-radius: var(--radius-sm);
                flex-shrink: 0;
                min-height: 60px;
            }

            .alert-indicator.severity-high {
                background: var(--error);
                box-shadow: 0 0 8px rgba(239, 68, 68, 0.3);
            }

            .alert-indicator.severity-medium {
                background: var(--warning);
                box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
            }

            .alert-indicator.severity-low {
                background: var(--success);
                box-shadow: 0 0 8px rgba(16, 185, 129, 0.3);
            }

            .alert-content {
                flex: 1;
                min-width: 0;
            }

            .alert-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 0.75rem;
                gap: 1rem;
            }

            .alert-title {
                font-weight: 600;
                color: var(--gray-900);
                font-size: 1.125rem;
                line-height: 1.4;
            }

            .alert-meta {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 0.25rem;
                flex-shrink: 0;
            }

            .alert-severity {
                font-size: 0.75rem;
                font-weight: 600;
                padding: 0.25rem 0.5rem;
                border-radius: var(--radius-sm);
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .alert-severity.severity-high {
                background: rgba(239, 68, 68, 0.1);
                color: var(--error);
            }

            .alert-severity.severity-medium {
                background: rgba(245, 158, 11, 0.1);
                color: var(--warning);
            }

            .alert-severity.severity-low {
                background: rgba(16, 185, 129, 0.1);
                color: var(--success);
            }

            .alert-time {
                font-size: 0.875rem;
                color: var(--gray-500);
            }

            .alert-description {
                font-size: 0.875rem;
                color: var(--gray-700);
                line-height: 1.5;
                margin-bottom: 0.75rem;
            }

            .alert-recommendation {
                font-size: 0.875rem;
                color: var(--primary-green);
                background: var(--green-50);
                padding: 0.75rem;
                border-radius: var(--radius-md);
                border-left: 3px solid var(--primary-green);
                line-height: 1.5;
            }

            .alert-actions {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                flex-shrink: 0;
            }

            .resolve-btn {
                background: var(--success);
                color: var(--white);
                border: none;
                padding: 0.5rem;
                border-radius: var(--radius-md);
                cursor: pointer;
                font-size: 1rem;
                transition: all 0.2s ease;
            }

            .resolve-btn:hover {
                background: #16A34A;
                transform: scale(1.05);
            }

            .resolved-indicator {
                color: var(--success);
                font-size: 1.25rem;
                opacity: 0.7;
            }

            .empty-state {
                text-align: center;
                padding: 3rem 2rem;
                color: var(--gray-600);
            }

            .empty-state .empty-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
                opacity: 0.5;
            }

            .empty-state h3 {
                color: var(--gray-800);
                margin-bottom: 0.5rem;
                font-size: 1.25rem;
            }

            .empty-state p {
                margin-bottom: 1.5rem;
                color: var(--gray-600);
            }

            @media (min-width: 768px) {
                .alerts-container {
                    grid-template-columns: 1fr 2fr;
                }
                
                .alert-actions {
                    flex-direction: row;
                    align-items: center;
                    justify-content: space-between;
                }
                
                .alert-filters {
                    flex-direction: row;
                }
            }

            @media (max-width: 768px) {
                .alert-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.5rem;
                }
                
                .alert-meta {
                    flex-direction: row;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .alert-filters {
                    flex-direction: column;
                }
                
                .alerts-container {
                    gap: 1rem;
                }
                
                .stat-item {
                    padding: 0.75rem;
                }
                
                .stat-number {
                    font-size: 1.5rem;
                }
            }
            </style>
        `;
        
        if (!document.querySelector('#alerts-styles')) {
            const styleElement = document.createElement('div');
            styleElement.id = 'alerts-styles';
            styleElement.innerHTML = styles;
            document.head.appendChild(styleElement);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LehtiApp();
});
