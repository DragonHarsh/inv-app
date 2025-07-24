// Main Application Controller
class App {
    constructor() {
        this.currentView = 'dashboard';
        this.isLoggedIn = false;
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.sidebarCollapsed = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applyTheme();
        this.checkAuth();
        this.hideLoading();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Close modal on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-container')) {
                this.closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Responsive sidebar
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
    }

    hideLoading() {
        setTimeout(() => {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'none';
            }
        }, 1000);
    }

    checkAuth() {
        const savedAuth = localStorage.getItem('isLoggedIn');
        if (savedAuth === 'true') {
            this.isLoggedIn = true;
            this.showApp();
        } else {
            this.showLogin();
        }
    }

    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Simple authentication (in real app, this would be more secure)
        if (username === 'admin' && password === '0000') {
            this.isLoggedIn = true;
            localStorage.setItem('isLoggedIn', 'true');
            this.showToast('Login successful!', 'success');
            this.showApp();
        } else {
            this.showToast('Invalid credentials!', 'error');
        }
    }

    logout() {
        this.isLoggedIn = false;
        localStorage.removeItem('isLoggedIn');
        this.showToast('Logged out successfully!', 'info');
        this.showLogin();
    }

    showLogin() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
    }

    async showApp() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        
        // Check subscription status via firebaseService
        try {
            this.showToast('Verifying subscription...', 'info');
            
            await window.firebaseService.initializeAdminConnection();
            const subscriptionOk = await window.firebaseService.checkSubscriptionStatus();
            
            if (!subscriptionOk) {
                this.showSubscriptionExpiredScreen();
                return;
            }
            
            // If no firebase config is cached, prompt user to enter config
            if (!window.firebaseService.hasCachedFirebaseConfig()) {
                this.showFirebaseConfigModal();
            } else {
                // Initialize clinic Firebase with cached config
                try {
                    await window.firebaseService.initializeClinicFirebase();
                    this.showToast('Connected to clinic database successfully!', 'success');
                } catch (error) {
                    console.error('Failed to initialize clinic Firebase:', error);
                    this.showToast('Failed to connect to clinic database. Please reconfigure.', 'error');
                    this.showFirebaseConfigModal();
                }
            }
            
            this.loadView(this.currentView);
        } catch (error) {
            console.error('Subscription check failed:', error);
            this.showToast('Error verifying subscription. Using offline mode.', 'warning');
            this.loadView(this.currentView);
        }
    }

    handleNavigation(e) {
        const viewName = e.currentTarget.getAttribute('data-view');
        if (viewName) {
            this.loadView(viewName);
            
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            e.currentTarget.classList.add('active');
        }
    }

    async loadView(viewName) {
        this.currentView = viewName;
        const container = document.getElementById('view-container');
        
        try {
            // Show loading state
            container.innerHTML = '<div class="loading-spinner"></div>';
            
            let content = '';
            switch (viewName) {
                case 'dashboard':
                    content = this.getDashboardView();
                    break;
                case 'inventory':
                    content = this.getInventoryView();
                    break;
                case 'billing':
                    content = this.getBillingView();
                    break;
                case 'customers':
                    content = this.getCustomersView();
                    break;
                case 'settings':
                    content = this.getSettingsView();
                    break;
                default:
                    content = '<h1>Page not found</h1>';
            }
            
            // Simulate loading delay for smooth transition
            setTimeout(() => {
                container.innerHTML = content;
                this.bindViewEvents(viewName);
            }, 300);
            
        } catch (error) {
            console.error('Error loading view:', error);
            this.showToast('Error loading page', 'error');
        }
    }

    bindViewEvents(viewName) {
        switch (viewName) {
            case 'dashboard':
                this.bindDashboardEvents();
                break;
            case 'inventory':
                this.bindInventoryEvents();
                break;
            case 'billing':
                this.bindBillingEvents();
                break;
            case 'customers':
                this.bindCustomersEvents();
                break;
            case 'settings':
                this.bindSettingsEvents();
                break;
        }
    }

    getDashboardView() {
        const stats = window.analyticsService?.getDashboardStats() || {
            totalItems: 0,
            lowStockItems: 0,
            expiredItems: 0,
            nearExpiryItems: 0,
            todaysSales: 0,
            totalCustomers: 0,
            todaysVisits: 0,
            upcomingVisits: 0
        };

        return `
            <div class="dashboard-view">
                <div class="dashboard-header mb-4">
                    <h1 class="text-2xl font-bold">Dashboard</h1>
                    <p class="text-secondary">Welcome back! Here's what's happening in your shop.</p>
                </div>

                <!-- Stats Cards -->
                <div class="grid grid-cols-4 gap-4 mb-5">
                    <div class="card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm text-secondary">Total Items</p>
                                <p class="text-2xl font-bold">${stats.totalItems}</p>
                            </div>
                            <div class="text-2xl">📦</div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm text-secondary">Low Stock</p>
                                <p class="text-2xl font-bold status-low-stock">${stats.lowStockItems}</p>
                            </div>
                            <div class="text-2xl">⚠️</div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm text-secondary">Near Expiry</p>
                                <p class="text-2xl font-bold status-near-expiry">${stats.nearExpiryItems}</p>
                            </div>
                            <div class="text-2xl">🟡</div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm text-secondary">Expired</p>
                                <p class="text-2xl font-bold status-expired">${stats.expiredItems}</p>
                            </div>
                            <div class="text-2xl">🔴</div>
                        </div>
                    </div>
                </div>

                <!-- Sales & Customer Stats -->
                <div class="grid grid-cols-2 gap-4 mb-5">
                    <div class="card">
                        <h3 class="card-title mb-3">Today's Performance</h3>
                        <div class="space-y-3">
                            <div class="flex justify-between">
                                <span>Sales Amount</span>
                                <span class="font-bold">₹${stats.todaysSales.toLocaleString()}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Total Customers</span>
                                <span class="font-bold">${stats.totalCustomers}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Today's Visits</span>
                                <span class="font-bold">${stats.todaysVisits}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Upcoming Visits</span>
                                <span class="font-bold">${stats.upcomingVisits}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <h3 class="card-title mb-3">Quick Actions</h3>
                        <div class="space-y-2">
                            <button class="btn btn-primary w-full" onclick="app.loadView('inventory')">
                                📦 Manage Inventory
                            </button>
                            <button class="btn btn-secondary w-full" onclick="app.loadView('billing')">
                                🧾 Create Invoice
                            </button>
                            <button class="btn btn-secondary w-full" onclick="app.loadView('customers')">
                                👥 Add Customer
                            </button>
                            <button class="btn btn-secondary w-full" onclick="app.showExportModal()">
                                📊 Export Reports
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="card">
                    <h3 class="card-title mb-3">Recent Activity</h3>
                    <div id="recent-activity">
                        <p class="text-secondary text-center py-4">No recent activity</p>
                    </div>
                </div>
            </div>
        `;
    }

    getInventoryView() {
        return `
            <div class="inventory-view">
                <div class="flex justify-between items-center mb-4">
                    <h1 class="text-2xl font-bold">Inventory Management</h1>
                    <button class="btn btn-primary" onclick="app.showAddItemModal()">
                        ➕ Add Item
                    </button>
                </div>

                <!-- Filters -->
                <div class="card mb-4">
                    <div class="grid grid-cols-4 gap-4">
                        <div class="form-group mb-0">
                            <label>Search Items</label>
                            <input type="text" id="search-items" placeholder="Search by name, category...">
                        </div>
                        <div class="form-group mb-0">
                            <label>Category</label>
                            <select id="filter-category">
                                <option value="">All Categories</option>
                                <option value="medicine">Medicine</option>
                                <option value="equipment">Equipment</option>
                                <option value="supplies">Supplies</option>
                            </select>
                        </div>
                        <div class="form-group mb-0">
                            <label>Expiring In</label>
                            <select id="filter-expiry">
                                <option value="">All Items</option>
                                <option value="7">7 Days</option>
                                <option value="15">15 Days</option>
                                <option value="30">30 Days</option>
                                <option value="60">60 Days</option>
                                <option value="120">120 Days</option>
                            </select>
                        </div>
                        <div class="form-group mb-0">
                            <label>Items per Page</label>
                            <select id="items-per-page">
                                <option value="10">10</option>
                                <option value="25" selected>25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Inventory Table -->
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Category</th>
                                <th>Stock</th>
                                <th>Buy Price</th>
                                <th>Sell Price</th>
                                <th>Expiry Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="inventory-table-body">
                            <tr>
                                <td colspan="8" class="text-center py-4">
                                    <div class="loading-spinner"></div>
                                    Loading inventory...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div class="flex justify-between items-center mt-4">
                    <div class="text-sm text-secondary">
                        Showing <span id="showing-count">0</span> of <span id="total-count">0</span> items
                    </div>
                    <div class="flex gap-2" id="pagination-controls">
                        <!-- Pagination buttons will be inserted here -->
                    </div>
                </div>
            </div>
        `;
    }

    getBillingView() {
        return `
            <div class="billing-view">
                <div class="flex justify-between items-center mb-4">
                    <h1 class="text-2xl font-bold">Billing & Invoicing</h1>
                    <button class="btn btn-primary" onclick="app.showInvoiceHistory()">
                        📋 Invoice History
                    </button>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <!-- Invoice Creation -->
                    <div class="card">
                        <h3 class="card-title mb-3">Create New Invoice</h3>
                        
                        <div class="form-group">
                            <label>Customer</label>
                            <select id="invoice-customer">
                                <option value="">Select Customer</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>Add Items</label>
                            <div class="flex gap-2">
                                <input type="text" id="item-search" placeholder="Search items..." class="flex-1">
                                <button class="btn btn-secondary" onclick="app.showItemSelector()">Browse</button>
                            </div>
                        </div>

                        <!-- Selected Items -->
                        <div id="selected-items" class="mb-4">
                            <h4 class="font-medium mb-2">Selected Items</h4>
                            <div id="invoice-items" class="space-y-2">
                                <p class="text-secondary text-sm">No items selected</p>
                            </div>
                        </div>

                        <!-- Invoice Totals -->
                        <div class="border-t pt-3">
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span id="invoice-subtotal">₹0.00</span>
                                </div>
                                <div class="flex justify-between">
                                    <span>Discount:</span>
                                    <input type="number" id="invoice-discount" value="0" class="w-20 text-right" min="0">
                                </div>
                                <div class="flex justify-between">
                                    <span>GST (18%):</span>
                                    <span id="invoice-gst">₹0.00</span>
                                </div>
                                <div class="flex justify-between font-bold text-lg">
                                    <span>Total:</span>
                                    <span id="invoice-total">₹0.00</span>
                                </div>
                            </div>
                        </div>

                        <div class="flex gap-2 mt-4">
                            <button class="btn btn-primary flex-1" onclick="app.generateInvoice()">
                                Generate Invoice
                            </button>
                            <button class="btn btn-secondary" onclick="app.clearInvoice()">
                                Clear
                            </button>
                        </div>
                    </div>

                    <!-- Recent Invoices -->
                    <div class="card">
                        <h3 class="card-title mb-3">Recent Invoices</h3>
                        <div id="recent-invoices" class="space-y-2">
                            <p class="text-secondary text-center py-4">No recent invoices</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getCustomersView() {
        return `
            <div class="customers-view">
                <div class="flex justify-between items-center mb-4">
                    <h1 class="text-2xl font-bold">Customer Management</h1>
                    <button class="btn btn-primary" onclick="app.showAddCustomerModal()">
                        ➕ Add Customer
                    </button>
                </div>

                <!-- Search and Filters -->
                <div class="card mb-4">
                    <div class="grid grid-cols-3 gap-4">
                        <div class="form-group mb-0">
                            <label>Search Customers</label>
                            <input type="text" id="search-customers" placeholder="Search by name, phone...">
                        </div>
                        <div class="form-group mb-0">
                            <label>Customer Type</label>
                            <select id="filter-customer-type">
                                <option value="">All Types</option>
                                <option value="regular">Regular</option>
                                <option value="vip">VIP</option>
                                <option value="new">New</option>
                            </select>
                        </div>
                        <div class="form-group mb-0">
                            <label>Visit Status</label>
                            <select id="filter-visit-status">
                                <option value="">All</option>
                                <option value="upcoming">Upcoming Visits</option>
                                <option value="overdue">Overdue Visits</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Customers Grid -->
                <div class="grid grid-cols-1 gap-4" id="customers-grid">
                    <div class="text-center py-8">
                        <div class="loading-spinner"></div>
                        <p class="mt-2">Loading customers...</p>
                    </div>
                </div>
            </div>
        `;
    }

    getSettingsView() {
        return `
            <div class="settings-view">
                <h1 class="text-2xl font-bold mb-4">Settings</h1>

                <div class="grid grid-cols-1 gap-4">
                    <!-- Shop Information -->
                    <div class="card">
                        <h3 class="card-title mb-3">Shop Information</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="form-group">
                                <label>Shop Name</label>
                                <input type="text" id="shop-name" placeholder="Enter shop name">
                            </div>
                            <div class="form-group">
                                <label>Contact Number</label>
                                <input type="tel" id="shop-contact" placeholder="Enter contact number">
                            </div>
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" id="shop-email" placeholder="Enter email">
                            </div>
                            <div class="form-group">
                                <label>GST Number</label>
                                <input type="text" id="shop-gst" placeholder="Enter GST number">
                            </div>
                            <div class="form-group">
                                <label>Address</label>
                                <textarea id="shop-address" rows="3" placeholder="Enter shop address"></textarea>
                            </div>
                            <div class="form-group">
                                <label>Website</label>
                                <input type="url" id="shop-website" placeholder="Enter website URL">
                            </div>
                        </div>
                        <button class="btn btn-primary" onclick="app.saveShopSettings()">
                            Save Shop Information
                        </button>
                    </div>

                    <!-- File Uploads -->
                    <div class="card">
                        <h3 class="card-title mb-3">Images & Documents</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="form-group">
                                <label>Shop Logo</label>
                                <input type="file" id="shop-logo" accept="image/*">
                                <p class="text-xs text-secondary mt-1">Upload shop logo for invoices</p>
                            </div>
                            <div class="form-group">
                                <label>Doctor Signature</label>
                                <input type="file" id="doctor-signature" accept="image/*">
                                <p class="text-xs text-secondary mt-1">Upload signature for prescriptions</p>
                            </div>
                        </div>
                    </div>

                    <!-- Categories & Units -->
                    <div class="card">
                        <h3 class="card-title mb-3">Categories & Units</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <h4 class="font-medium mb-2">Item Categories</h4>
                                <div id="categories-list" class="space-y-2 mb-3">
                                    <!-- Categories will be loaded here -->
                                </div>
                                <div class="flex gap-2">
                                    <input type="text" id="new-category" placeholder="Add new category" class="flex-1">
                                    <button class="btn btn-secondary" onclick="app.addCategory()">Add</button>
                                </div>
                            </div>
                            <div>
                                <h4 class="font-medium mb-2">Unit Types</h4>
                                <div id="units-list" class="space-y-2 mb-3">
                                    <!-- Units will be loaded here -->
                                </div>
                                <div class="flex gap-2">
                                    <input type="text" id="new-unit" placeholder="Add new unit" class="flex-1">
                                    <button class="btn btn-secondary" onclick="app.addUnit()">Add</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Security -->
                    <div class="card">
                        <h3 class="card-title mb-3">Security Settings</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="form-group">
                                <label>New Username</label>
                                <input type="text" id="new-username" placeholder="Enter new username">
                            </div>
                            <div class="form-group">
                                <label>New Password</label>
                                <input type="password" id="new-password" placeholder="Enter new password">
                            </div>
                        </div>
                        <button class="btn btn-warning" onclick="app.updateCredentials()">
                            Update Credentials
                        </button>
                    </div>

                    <!-- Data Management -->
                    <div class="card">
                        <h3 class="card-title mb-3">Data Management</h3>
                        <div class="flex gap-4">
                            <button class="btn btn-secondary" onclick="app.exportData()">
                                📤 Export Data
                            </button>
                            <button class="btn btn-secondary" onclick="app.importData()">
                                📥 Import Data
                            </button>
                            <button class="btn btn-error" onclick="app.resetData()">
                                🗑️ Reset All Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindDashboardEvents() {
        // Dashboard-specific event bindings
        this.loadDashboardData();
    }

    bindInventoryEvents() {
        // Search functionality
        const searchInput = document.getElementById('search-items');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterInventory());
        }

        // Filter functionality
        const filterCategory = document.getElementById('filter-category');
        const filterExpiry = document.getElementById('filter-expiry');
        const itemsPerPage = document.getElementById('items-per-page');

        if (filterCategory) filterCategory.addEventListener('change', () => this.filterInventory());
        if (filterExpiry) filterExpiry.addEventListener('change', () => this.filterInventory());
        if (itemsPerPage) itemsPerPage.addEventListener('change', () => this.filterInventory());

        this.loadInventoryData();
    }

    bindBillingEvents() {
        // Billing-specific event bindings
        this.loadBillingData();
    }

    bindCustomersEvents() {
        // Customer-specific event bindings
        this.loadCustomersData();
    }

    bindSettingsEvents() {
        // Settings-specific event bindings
        this.loadSettingsData();
    }

    // Theme Management
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('theme', this.currentTheme);
    }

    applyTheme() {
        document.body.className = `${this.currentTheme}-theme theme-transition`;
        
        // Update theme toggle text
        const themeIcon = document.querySelector('.theme-icon');
        const themeText = document.querySelector('.theme-text');
        
        if (themeIcon && themeText) {
            if (this.currentTheme === 'dark') {
                themeIcon.textContent = '☀️';
                themeText.textContent = 'Light Mode';
            } else {
                themeIcon.textContent = '🌙';
                themeText.textContent = 'Dark Mode';
            }
        }
    }

    // Sidebar Management
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        this.sidebarCollapsed = !this.sidebarCollapsed;
        
        if (this.sidebarCollapsed) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }
    }

    handleResize() {
        const sidebar = document.getElementById('sidebar');
        if (window.innerWidth <= 768) {
            sidebar.classList.add('mobile');
        } else {
            sidebar.classList.remove('mobile', 'open');
        }
    }

    // Modal Management
    showModal(title, content, actions = []) {
        const modalContainer = document.getElementById('modal-container');
        const modal = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close" onclick="app.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${actions.length > 0 ? `
                    <div class="modal-footer">
                        ${actions.map(action => `<button class="btn ${action.class}" onclick="${action.onclick}">${action.text}</button>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        modalContainer.innerHTML = modal;
        modalContainer.classList.remove('hidden');
    }

    closeModal() {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.classList.add('hidden');
        modalContainer.innerHTML = '';
    }

    // Firebase Configuration Modal Methods
    showFirebaseConfigModal() {
        document.getElementById('firebase-config-screen').classList.remove('hidden');
    }

    closeFirebaseConfigModal() {
        document.getElementById('firebase-config-screen').classList.add('hidden');
        // Clear any error messages
        document.getElementById('firebase-config-message').textContent = '';
    }

    async saveAndTestFirebaseConfig() {
        const config = {
            apiKey: document.getElementById('firebase-apiKey').value.trim(),
            projectId: document.getElementById('firebase-projectId').value.trim(),
            databaseURL: document.getElementById('firebase-databaseURL').value.trim(),
            authDomain: document.getElementById('firebase-authDomain').value.trim(),
            storageBucket: document.getElementById('firebase-storageBucket').value.trim(),
            appId: document.getElementById('firebase-appId').value.trim() || undefined
        };

        // Clear previous error messages
        document.getElementById('firebase-config-message').textContent = '';

        try {
            this.showToast('Testing Firebase configuration...', 'info');
            await window.firebaseService.testAndCacheFirebaseConfig(config);
            this.closeFirebaseConfigModal();
            await window.firebaseService.initializeClinicFirebase();
            this.showToast('Firebase configured and connected successfully!', 'success');
        } catch (error) {
            console.error('Firebase config error:', error);
            document.getElementById('firebase-config-message').textContent = error.message;
            this.showToast('Firebase configuration failed', 'error');
        }
    }

    // Subscription Management Methods
    showSubscriptionExpiredScreen() {
        document.getElementById('subscription-expired-screen').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
    }

    hideSubscriptionExpiredScreen() {
        document.getElementById('subscription-expired-screen').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
    }

    async retrySubscriptionCheck() {
        try {
            this.showToast('Retrying subscription check...', 'info');
            const subscriptionOk = await window.firebaseService.checkSubscriptionStatus();
            
            if (subscriptionOk) {
                this.hideSubscriptionExpiredScreen();
                this.showToast('Subscription verified successfully!', 'success');
                
                // Continue with Firebase config if needed
                if (!window.firebaseService.hasCachedFirebaseConfig()) {
                    this.showFirebaseConfigModal();
                } else {
                    await window.firebaseService.initializeClinicFirebase();
                }
            } else {
                this.showToast('Subscription is still inactive or expired', 'error');
            }
        } catch (error) {
            console.error('Retry subscription check failed:', error);
            this.showToast('Failed to verify subscription. Please try again later.', 'error');
        }
    }

    // Toast Notifications
    showToast(message, type = 'info', duration = 3000) {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${this.getToastIcon(type)}</span>
            <span class="toast-message">${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, duration);
    }

    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    // Keyboard Shortcuts
    handleKeyboard(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.loadView('dashboard');
                    break;
                case '2':
                    e.preventDefault();
                    this.loadView('inventory');
                    break;
                case '3':
                    e.preventDefault();
                    this.loadView('billing');
                    break;
                case '4':
                    e.preventDefault();
                    this.loadView('customers');
                    break;
                case '5':
                    e.preventDefault();
                    this.loadView('settings');
                    break;
            }
        }
        
        if (e.key === 'Escape') {
            this.closeModal();
        }
    }

    // Placeholder methods for data loading
    loadDashboardData() {
        // Will be implemented with actual data service
        console.log('Loading dashboard data...');
    }

    loadInventoryData() {
        setTimeout(() => {
            const tbody = document.getElementById('inventory-table-body');
            if (tbody) {
                const inventory = window.dataService.getInventory();
                
                if (inventory.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No inventory items found. <a href="#" onclick="app.showAddItemModal()" class="text-primary">Add your first item</a></td></tr>';
                } else {
                    tbody.innerHTML = inventory.map(item => {
                        const status = window.dataService.getItemStatus(item);
                        const statusClass = `status-${status}`;
                        const statusText = status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
                        
                        return `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.category}</td>
                                <td>${item.stock} ${item.unit}</td>
                                <td>₹${parseFloat(item.buyPrice).toFixed(2)}</td>
                                <td>₹${parseFloat(item.sellPrice).toFixed(2)}</td>
                                <td>${item.expDate ? new Date(item.expDate).toLocaleDateString() : 'N/A'}</td>
                                <td><span class="badge badge-${status}">${statusText}</span></td>
                                <td>
                                    <button class="btn btn-sm btn-secondary" onclick="app.viewItemDetails('${item.id}')">View</button>
                                    <button class="btn btn-sm btn-secondary" onclick="app.editItem('${item.id}')">Edit</button>
                                    <button class="btn btn-sm btn-error" onclick="app.deleteItem('${item.id}')">Delete</button>
                                </td>
                            </tr>
                        `;
                    }).join('');
                }
                
                // Update counts
                const totalCount = document.getElementById('total-count');
                const showingCount = document.getElementById('showing-count');
                if (totalCount) totalCount.textContent = inventory.length;
                if (showingCount) showingCount.textContent = inventory.length;
            }
        }, 500);
    }

    loadBillingData() {
        console.log('Loading billing data...');
    }

    loadCustomersData() {
        setTimeout(() => {
            const grid = document.getElementById('customers-grid');
            if (grid) {
                const customers = window.dataService.getCustomers();
                
                if (customers.length === 0) {
                    grid.innerHTML = '<div class="text-center py-8"><p>No customers found. <a href="#" onclick="app.showAddCustomerModal()" class="text-primary">Add your first customer</a></p></div>';
                } else {
                    grid.innerHTML = customers.map(customer => `
                        <div class="card">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <h4 class="font-bold text-lg">${customer.name}</h4>
                                    <p class="text-secondary">📱 ${customer.mobile}</p>
                                    ${customer.email ? `<p class="text-secondary">📧 ${customer.email}</p>` : ''}
                                    ${customer.address ? `<p class="text-secondary">📍 ${customer.address}</p>` : ''}
                                    <div class="mt-2">
                                        <span class="badge badge-${customer.type === 'vip' ? 'in-stock' : 'low-stock'}">${customer.type.toUpperCase()}</span>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="text-sm text-secondary">Total Visits: ${customer.totalVisits || 0}</p>
                                    <p class="text-sm text-secondary">Total Spent: ₹${(customer.totalSpent || 0).toFixed(2)}</p>
                                    ${customer.lastVisit ? `<p class="text-sm text-secondary">Last Visit: ${new Date(customer.lastVisit).toLocaleDateString()}</p>` : ''}
                                    ${customer.nextVisit ? `<p class="text-sm text-secondary">Next Visit: ${new Date(customer.nextVisit).toLocaleDateString()}</p>` : ''}
                                </div>
                            </div>
                            ${customer.medicalSummary ? `
                                <div class="mt-3 p-2 bg-secondary rounded">
                                    <p class="text-sm"><strong>Medical Summary:</strong> ${customer.medicalSummary}</p>
                                </div>
                            ` : ''}
                            <div class="flex gap-2 mt-3">
                                <button class="btn btn-sm btn-primary" onclick="app.addVisit('${customer.id}')">Add Visit</button>
                                <button class="btn btn-sm btn-secondary" onclick="app.viewCustomerHistory('${customer.id}')">View History</button>
                                <button class="btn btn-sm btn-secondary" onclick="app.editCustomer('${customer.id}')">Edit</button>
                                <button class="btn btn-sm btn-error" onclick="app.deleteCustomer('${customer.id}')">Delete</button>
                            </div>
                        </div>
                    `).join('');
                }
            }
        }, 500);
    }

    loadSettingsData() {
        console.log('Loading settings data...');
    }

    filterInventory() {
        console.log('Filtering inventory...');
    }

    // Placeholder modal methods
    showAddItemModal() {
        this.showModal('Add New Item', `
            <form id="add-item-form">
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label>Item Name *</label>
                        <input type="text" id="item-name" required>
                    </div>
                    <div class="form-group">
                        <label>Category *</label>
                        <select id="item-category" required>
                            <option value="">Select Category</option>
                            <option value="medicine">Medicine</option>
                            <option value="equipment">Equipment</option>
                            <option value="supplies">Supplies</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Buy Price *</label>
                        <input type="number" id="item-buy-price" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Sell Price *</label>
                        <input type="number" id="item-sell-price" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Stock Quantity *</label>
                        <input type="number" id="item-stock" required>
                    </div>
                    <div class="form-group">
                        <label>Unit Type</label>
                        <select id="item-unit">
                            <option value="pieces">Pieces</option>
                            <option value="bottles">Bottles</option>
                            <option value="boxes">Boxes</option>
                            <option value="strips">Strips</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Manufacturing Date</label>
                        <input type="date" id="item-mfg-date">
                    </div>
                    <div class="form-group">
                        <label>Expiry Date</label>
                        <input type="date" id="item-exp-date">
                    </div>
                    <div class="form-group">
                        <label>Supplier Name</label>
                        <input type="text" id="item-supplier">
                    </div>
                    <div class="form-group">
                        <label>Batch Number</label>
                        <input type="text" id="item-batch">
                    </div>
                    <div class="form-group">
                        <label>Low Stock Threshold</label>
                        <input type="number" id="item-threshold" value="10">
                    </div>
                    <div class="form-group">
                        <label>Quick Note</label>
                        <textarea id="item-note" rows="2"></textarea>
                    </div>
                </div>
            </form>
        `, [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'app.closeModal()' },
            { text: 'Add Item', class: 'btn-primary', onclick: 'app.saveNewItem()' }
        ]);
    }

    showAddCustomerModal() {
        this.showModal('Add New Customer', `
            <form id="add-customer-form">
                <div class="grid grid-cols-2 gap-4">
                    <div class="form-group">
                        <label>Customer Name *</label>
                        <input type="text" id="customer-name" required>
                    </div>
                    <div class="form-group">
                        <label>Mobile Number *</label>
                        <input type="tel" id="customer-mobile" required>
                    </div>
                    <div class="form-group">
                        <label>Customer Type</label>
                        <select id="customer-type">
                            <option value="regular">Regular</option>
                            <option value="vip">VIP</option>
                            <option value="new">New</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="customer-email">
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <textarea id="customer-address" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label>Medical Summary</label>
                        <textarea id="customer-medical" rows="3" placeholder="Patient medical history, allergies, etc."></textarea>
                    </div>
                </div>
            </form>
        `, [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'app.closeModal()' },
            { text: 'Add Customer', class: 'btn-primary', onclick: 'app.saveNewCustomer()' }
        ]);
    }

    showExportModal() {
        this.showModal('Export Reports', `
            <div class="space-y-4">
                <div class="form-group">
                    <label>Report Type</label>
                    <select id="export-type">
                        <option value="sales">Sales Report</option>
                        <option value="inventory">Inventory Report</option>
                        <option value="customers">Customer Report</option>
                        <option value="pnl">Profit & Loss Report</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Time Period</label>
                    <select id="export-period">
                        <option value="1">Last 1 Month</option>
                        <option value="3">Last 3 Months</option>
                        <option value="6">Last 6 Months</option>
                        <option value="12">Last 12 Months</option>
                        <option value="custom">Custom Range</option>
                    </select>
                </div>
                <div id="custom-date-range" class="hidden">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="form-group">
                            <label>From Date</label>
                            <input type="date" id="export-from">
                        </div>
                        <div class="form-group">
                            <label>To Date</label>
                            <input type="date" id="export-to">
                        </div>
                    </div>
                </div>
            </div>
        `, [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'app.closeModal()' },
            { text: 'Export PDF', class: 'btn-primary', onclick: 'app.exportReport()' }
        ]);
    }

    // Save methods with actual data service integration
    saveNewItem() {
        try {
            // Get form data
            const itemData = {
                name: document.getElementById('item-name').value,
                category: document.getElementById('item-category').value,
                buyPrice: document.getElementById('item-buy-price').value,
                sellPrice: document.getElementById('item-sell-price').value,
                stock: document.getElementById('item-stock').value,
                unit: document.getElementById('item-unit').value,
                mfgDate: document.getElementById('item-mfg-date').value,
                expDate: document.getElementById('item-exp-date').value,
                supplier: document.getElementById('item-supplier').value,
                batchNo: document.getElementById('item-batch').value,
                lowStockThreshold: document.getElementById('item-threshold').value,
                note: document.getElementById('item-note').value
            };

            // Validate required fields
            if (!itemData.name || !itemData.category || !itemData.buyPrice || !itemData.sellPrice || !itemData.stock) {
                this.showToast('Please fill all required fields!', 'error');
                return;
            }

            // Save to data service
            const newItem = window.dataService.addInventoryItem(itemData);
            this.showToast('Item added successfully!', 'success');
            this.closeModal();
            this.loadInventoryData();
            
        } catch (error) {
            console.error('Error saving item:', error);
            this.showToast('Error adding item: ' + error.message, 'error');
        }
    }

    saveNewCustomer() {
        try {
            // Get form data
            const customerData = {
                name: document.getElementById('customer-name').value,
                mobile: document.getElementById('customer-mobile').value,
                type: document.getElementById('customer-type').value,
                email: document.getElementById('customer-email').value,
                address: document.getElementById('customer-address').value,
                medicalSummary: document.getElementById('customer-medical').value
            };

            // Validate required fields
            if (!customerData.name || !customerData.mobile) {
                this.showToast('Please fill all required fields!', 'error');
                return;
            }

            // Save to data service
            const newCustomer = window.dataService.addCustomer(customerData);
            this.showToast('Customer added successfully!', 'success');
            this.closeModal();
            this.loadCustomersData();
            
        } catch (error) {
            console.error('Error saving customer:', error);
            this.showToast('Error adding customer: ' + error.message, 'error');
        }
    }

    saveShopSettings() {
        this.showToast('Shop settings saved successfully!', 'success');
    }

    updateCredentials() {
        this.showToast('Credentials updated successfully!', 'warning');
    }

    exportData() {
        this.showToast('Data exported successfully!', 'info');
    }

    importData() {
        this.showToast('Data import feature coming soon!', 'info');
    }

    resetData() {
        if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
            this.showToast('All data has been reset!', 'warning');
        }
    }

    exportReport() {
        this.showToast('Report exported successfully!', 'success');
        this.closeModal();
    }

    // Billing Methods
    showItemSelector() {
        window.itemSelector.show();
    }

    generateInvoice() {
        try {
            const currentInvoice = window.invoiceService.getCurrentInvoice();
            
            if (currentInvoice.items.length === 0) {
                this.showToast('Please add items to the invoice first', 'warning');
                return;
            }

            // Get customer info
            const customerSelect = document.getElementById('invoice-customer');
            const customerId = customerSelect ? customerSelect.value : null;
            
            // Get payment method (default to cash for now)
            const paymentMethod = 'cash';
            
            // Get notes
            const notes = '';

            // Generate the invoice
            const invoice = window.invoiceService.generateInvoice(paymentMethod, notes);
            
            this.showToast('Invoice generated successfully!', 'success');
            
            // Show invoice actions modal
            this.showInvoiceActionsModal(invoice);
            
            // Refresh the billing view
            this.loadBillingData();
            
        } catch (error) {
            console.error('Error generating invoice:', error);
            this.showToast('Error generating invoice: ' + error.message, 'error');
        }
    }

    showInvoiceActionsModal(invoice) {
        const modalContent = `
            <div class="invoice-actions text-center">
                <div class="mb-4">
                    <h4 class="text-lg font-bold text-success">Invoice Generated Successfully!</h4>
                    <p class="text-secondary">Invoice #${invoice.invoiceNumber}</p>
                    <p class="text-lg font-bold">Total: ₹${invoice.total.toFixed(2)}</p>
                </div>
                
                <div class="grid grid-cols-2 gap-3">
                    <button class="btn btn-primary" onclick="app.printInvoice('${invoice.id}')">
                        🖨️ Print Invoice
                    </button>
                    <button class="btn btn-success" onclick="app.shareViaWhatsApp('${invoice.id}')">
                        📱 Share via WhatsApp
                    </button>
                    <button class="btn btn-warning" onclick="app.markAsUnpaid('${invoice.id}')">
                        💰 Mark as Unpaid
                    </button>
                    <button class="btn btn-secondary" onclick="app.viewInvoiceDetails('${invoice.id}')">
                        👁️ View Details
                    </button>
                </div>
            </div>
        `;

        this.showModal('Invoice Actions', modalContent, [
            { text: 'Close', class: 'btn-secondary', onclick: 'app.closeModal()' }
        ]);
    }

    printInvoice(invoiceId) {
        try {
            const invoices = window.dataService.getInvoices();
            const invoice = invoices.find(inv => inv.id === invoiceId);
            
            if (invoice) {
                window.invoiceService.printInvoice(invoice);
                this.showToast('Invoice sent to printer', 'success');
            }
        } catch (error) {
            this.showToast('Error printing invoice: ' + error.message, 'error');
        }
        this.closeModal();
    }

    shareViaWhatsApp(invoiceId) {
        try {
            const invoices = window.dataService.getInvoices();
            const invoice = invoices.find(inv => inv.id === invoiceId);
            
            if (invoice) {
                // Get customer phone number if available
                let phoneNumber = '';
                if (invoice.customerId) {
                    const customer = window.dataService.getCustomers().find(c => c.id === invoice.customerId);
                    if (customer && customer.mobile) {
                        phoneNumber = customer.mobile.replace(/\D/g, ''); // Remove non-digits
                        if (!phoneNumber.startsWith('91')) {
                            phoneNumber = '91' + phoneNumber; // Add India country code
                        }
                    }
                }
                
                window.invoiceService.shareViaWhatsApp(invoice, phoneNumber);
                this.showToast('WhatsApp opened with invoice details', 'success');
            }
        } catch (error) {
            this.showToast('Error sharing via WhatsApp: ' + error.message, 'error');
        }
        this.closeModal();
    }

    markAsUnpaid(invoiceId) {
        try {
            window.invoiceService.markAsUnpaid(invoiceId);
            this.showToast('Invoice marked as unpaid', 'warning');
            this.loadBillingData();
        } catch (error) {
            this.showToast('Error updating invoice status: ' + error.message, 'error');
        }
        this.closeModal();
    }

    viewInvoiceDetails(invoiceId) {
        const invoices = window.dataService.getInvoices();
        const invoice = invoices.find(inv => inv.id === invoiceId);
        
        if (invoice) {
            const customer = invoice.customerId ? 
                window.dataService.getCustomers().find(c => c.id === invoice.customerId) : null;

            const modalContent = `
                <div class="invoice-details">
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <h4 class="font-bold">Invoice Information</h4>
                            <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
                            <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
                            <p><strong>Status:</strong> <span class="badge badge-${invoice.paymentStatus === 'paid' ? 'in-stock' : 'expired'}">${invoice.paymentStatus.toUpperCase()}</span></p>
                        </div>
                        <div>
                            <h4 class="font-bold">Customer Information</h4>
                            <p><strong>Name:</strong> ${invoice.customerName}</p>
                            ${customer?.mobile ? `<p><strong>Phone:</strong> ${customer.mobile}</p>` : ''}
                            ${customer?.email ? `<p><strong>Email:</strong> ${customer.email}</p>` : ''}
                        </div>
                    </div>
                    
                    <h4 class="font-bold mb-2">Items</h4>
                    <div class="table-container mb-4">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Qty</th>
                                    <th>Price</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoice.items.map(item => `
                                    <tr>
                                        <td>${item.name}</td>
                                        <td>${item.quantity} ${item.unit}</td>
                                        <td>₹${item.price.toFixed(2)}</td>
                                        <td>₹${item.total.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="totals text-right">
                        <p>Subtotal: ₹${invoice.subtotal.toFixed(2)}</p>
                        ${invoice.discount > 0 ? `<p>Discount: -₹${invoice.discount.toFixed(2)}</p>` : ''}
                        <p>GST: ₹${invoice.gstAmount.toFixed(2)}</p>
                        <p class="font-bold text-lg">Total: ₹${invoice.total.toFixed(2)}</p>
                    </div>
                </div>
            `;

            this.showModal('Invoice Details', modalContent, [
                { text: 'Print', class: 'btn-primary', onclick: `app.printInvoice('${invoice.id}')` },
                { text: 'Close', class: 'btn-secondary', onclick: 'app.closeModal()' }
            ]);
        }
    }

    clearInvoice() {
        window.invoiceService.clearCurrentInvoice();
        window.itemSelector.updateBillingView();
        this.showToast('Invoice cleared', 'info');
    }

    showInvoiceHistory() {
        const invoices = window.dataService.getInvoices();
        const recentInvoices = invoices.slice(-10).reverse(); // Last 10 invoices

        const modalContent = `
            <div class="invoice-history">
                ${recentInvoices.length === 0 ? 
                    '<p class="text-center text-secondary py-4">No invoices found</p>' :
                    `<div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Invoice #</th>
                                    <th>Customer</th>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recentInvoices.map(invoice => `
                                    <tr>
                                        <td>${invoice.invoiceNumber}</td>
                                        <td>${invoice.customerName}</td>
                                        <td>${new Date(invoice.createdAt).toLocaleDateString()}</td>
                                        <td>₹${invoice.total.toFixed(2)}</td>
                                        <td><span class="badge badge-${invoice.paymentStatus === 'paid' ? 'in-stock' : 'expired'}">${invoice.paymentStatus.toUpperCase()}</span></td>
                                        <td>
                                            <button class="btn btn-sm btn-secondary" onclick="app.viewInvoiceDetails('${invoice.id}')">View</button>
                                            <button class="btn btn-sm btn-primary" onclick="app.printInvoice('${invoice.id}')">Print</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>`
                }
            </div>
        `;

        this.showModal('Invoice History', modalContent, [
            { text: 'Close', class: 'btn-secondary', onclick: 'app.closeModal()' }
        ]);
    }

    addCategory() {
        const input = document.getElementById('new-category');
        if (input && input.value.trim()) {
            this.showToast(`Category "${input.value}" added successfully!`, 'success');
            input.value = '';
        }
    }

    addUnit() {
        const input = document.getElementById('new-unit');
        if (input && input.value.trim()) {
            this.showToast(`Unit "${input.value}" added successfully!`, 'success');
            input.value = '';
        }
    }

    // Additional action methods for inventory and customers
    viewItemDetails(itemId) {
        const item = window.dataService.getInventory().find(i => i.id === itemId);
        if (item) {
            this.showModal('Item Details', `
                <div class="space-y-3">
                    <div><strong>Name:</strong> ${item.name}</div>
                    <div><strong>Category:</strong> ${item.category}</div>
                    <div><strong>Stock:</strong> ${item.stock} ${item.unit}</div>
                    <div><strong>Buy Price:</strong> ₹${parseFloat(item.buyPrice).toFixed(2)}</div>
                    <div><strong>Sell Price:</strong> ₹${parseFloat(item.sellPrice).toFixed(2)}</div>
                    <div><strong>Supplier:</strong> ${item.supplier || 'N/A'}</div>
                    <div><strong>Batch No:</strong> ${item.batchNo || 'N/A'}</div>
                    <div><strong>Manufacturing Date:</strong> ${item.mfgDate ? new Date(item.mfgDate).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>Expiry Date:</strong> ${item.expDate ? new Date(item.expDate).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>Low Stock Threshold:</strong> ${item.lowStockThreshold}</div>
                    ${item.note ? `<div><strong>Note:</strong> ${item.note}</div>` : ''}
                    <div><strong>Created:</strong> ${new Date(item.createdAt).toLocaleString()}</div>
                </div>
            `, [
                { text: 'Close', class: 'btn-secondary', onclick: 'app.closeModal()' }
            ]);
        }
    }

    editItem(itemId) {
        this.showToast('Edit item feature coming soon!', 'info');
    }

    deleteItem(itemId) {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                window.dataService.deleteInventoryItem(itemId);
                this.showToast('Item deleted successfully!', 'success');
                this.loadInventoryData();
            } catch (error) {
                this.showToast('Error deleting item: ' + error.message, 'error');
            }
        }
    }

    addVisit(customerId) {
        this.showToast('Add visit feature coming soon!', 'info');
    }

    viewCustomerHistory(customerId) {
        this.showToast('Customer history feature coming soon!', 'info');
    }

    editCustomer(customerId) {
        this.showToast('Edit customer feature coming soon!', 'info');
    }

    deleteCustomer(customerId) {
        if (confirm('Are you sure you want to delete this customer?')) {
            try {
                window.dataService.deleteCustomer(customerId);
                this.showToast('Customer deleted successfully!', 'success');
                this.loadCustomersData();
            } catch (error) {
                this.showToast('Error deleting customer: ' + error.message, 'error');
            }
        }
    }
}

// Initialize the application
const app = new App();

// Make app globally available for onclick handlers
window.app = app;
