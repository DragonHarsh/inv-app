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

    showApp() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        this.loadView(this.currentView);
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
        // Will be implemented with actual data service
        setTimeout(() => {
            const tbody = document.getElementById('inventory-table-body');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No inventory items found. <a href="#" onclick="app.showAddItemModal()" class="text-primary">Add your first item</a></td></tr>';
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
                grid.innerHTML = '<div class="text-center py-8"><p>No customers found. <a href="#" onclick="app.showAddCustomerModal()" class="text-primary">Add your first customer</a></p></div>';
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

    // Placeholder save methods
    saveNewItem() {
        this.showToast('Item added successfully!', 'success');
        this.closeModal();
        this.loadInventoryData();
    }

    saveNewCustomer() {
        this.showToast('Customer added successfully!', 'success');
        this.closeModal();
        this.loadCustomersData();
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
}

// Initialize the application
const app = new App();

// Make app globally available for onclick handlers
window.app = app;
