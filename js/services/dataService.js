// Data Service - Handles all CRUD operations and local storage
class DataService {
    constructor() {
        this.storageKeys = {
            inventory: 'shop_inventory',
            customers: 'shop_customers',
            invoices: 'shop_invoices',
            settings: 'shop_settings',
            categories: 'shop_categories',
            units: 'shop_units',
            visits: 'shop_visits'
        };
        
        this.initializeDefaultData();
    }

    // Initialize default data if not exists
    initializeDefaultData() {
        if (!this.getFromStorage(this.storageKeys.categories)) {
            this.saveToStorage(this.storageKeys.categories, [
                'Medicine',
                'Equipment',
                'Supplies',
                'Consumables'
            ]);
        }

        if (!this.getFromStorage(this.storageKeys.units)) {
            this.saveToStorage(this.storageKeys.units, [
                'Pieces',
                'Bottles',
                'Boxes',
                'Strips',
                'Tablets',
                'Capsules',
                'ML',
                'Grams',
                'KG'
            ]);
        }

        if (!this.getFromStorage(this.storageKeys.settings)) {
            this.saveToStorage(this.storageKeys.settings, {
                shopName: '',
                address: '',
                contact: '',
                email: '',
                gst: '',
                website: '',
                logo: '',
                signature: '',
                defaultLowStockThreshold: 10,
                gstRate: 18,
                username: 'admin',
                password: '0000'
            });
        }

        // Initialize empty arrays if not exists
        ['inventory', 'customers', 'invoices', 'visits'].forEach(key => {
            if (!this.getFromStorage(this.storageKeys[key])) {
                this.saveToStorage(this.storageKeys[key], []);
            }
        });
    }

    // Generic storage methods
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);
            return false;
        }
    }

    getFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading from storage:', error);
            return null;
        }
    }

    // Inventory Management
    getInventory() {
        return this.getFromStorage(this.storageKeys.inventory) || [];
    }

    addInventoryItem(item) {
        try {
            const inventory = this.getInventory();
            const newItem = {
                id: this.generateId(),
                name: item.name,
                category: item.category,
                buyPrice: parseFloat(item.buyPrice),
                sellPrice: parseFloat(item.sellPrice),
                stock: parseInt(item.stock),
                unit: item.unit || 'pieces',
                supplier: item.supplier || '',
                batchNo: item.batchNo || '',
                mfgDate: item.mfgDate || '',
                expDate: item.expDate || '',
                lowStockThreshold: parseInt(item.lowStockThreshold) || 10,
                note: item.note || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            inventory.push(newItem);
            this.saveToStorage(this.storageKeys.inventory, inventory);
            return newItem;
        } catch (error) {
            console.error('Error adding inventory item:', error);
            throw error;
        }
    }

    updateInventoryItem(id, updates) {
        try {
            const inventory = this.getInventory();
            const index = inventory.findIndex(item => item.id === id);
            
            if (index === -1) {
                throw new Error('Item not found');
            }
            
            inventory[index] = {
                ...inventory[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            this.saveToStorage(this.storageKeys.inventory, inventory);
            return inventory[index];
        } catch (error) {
            console.error('Error updating inventory item:', error);
            throw error;
        }
    }

    deleteInventoryItem(id) {
        try {
            const inventory = this.getInventory();
            const filteredInventory = inventory.filter(item => item.id !== id);
            this.saveToStorage(this.storageKeys.inventory, filteredInventory);
            return true;
        } catch (error) {
            console.error('Error deleting inventory item:', error);
            throw error;
        }
    }

    updateStock(id, quantity, operation = 'subtract') {
        try {
            const inventory = this.getInventory();
            const item = inventory.find(item => item.id === id);
            
            if (!item) {
                throw new Error('Item not found');
            }
            
            if (operation === 'subtract') {
                if (item.stock < quantity) {
                    throw new Error('Insufficient stock');
                }
                item.stock -= quantity;
            } else if (operation === 'add') {
                item.stock += quantity;
            }
            
            item.updatedAt = new Date().toISOString();
            this.saveToStorage(this.storageKeys.inventory, inventory);
            return item;
        } catch (error) {
            console.error('Error updating stock:', error);
            throw error;
        }
    }

    // Customer Management
    getCustomers() {
        return this.getFromStorage(this.storageKeys.customers) || [];
    }

    addCustomer(customer) {
        try {
            const customers = this.getCustomers();
            const newCustomer = {
                id: this.generateId(),
                name: customer.name,
                mobile: customer.mobile,
                email: customer.email || '',
                address: customer.address || '',
                type: customer.type || 'regular',
                medicalSummary: customer.medicalSummary || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastVisit: null,
                nextVisit: null,
                totalVisits: 0,
                totalSpent: 0
            };
            
            customers.push(newCustomer);
            this.saveToStorage(this.storageKeys.customers, customers);
            return newCustomer;
        } catch (error) {
            console.error('Error adding customer:', error);
            throw error;
        }
    }

    updateCustomer(id, updates) {
        try {
            const customers = this.getCustomers();
            const index = customers.findIndex(customer => customer.id === id);
            
            if (index === -1) {
                throw new Error('Customer not found');
            }
            
            customers[index] = {
                ...customers[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            this.saveToStorage(this.storageKeys.customers, customers);
            return customers[index];
        } catch (error) {
            console.error('Error updating customer:', error);
            throw error;
        }
    }

    deleteCustomer(id) {
        try {
            const customers = this.getCustomers();
            const filteredCustomers = customers.filter(customer => customer.id !== id);
            this.saveToStorage(this.storageKeys.customers, filteredCustomers);
            return true;
        } catch (error) {
            console.error('Error deleting customer:', error);
            throw error;
        }
    }

    // Visit Management
    getVisits() {
        return this.getFromStorage(this.storageKeys.visits) || [];
    }

    addVisit(visit) {
        try {
            const visits = this.getVisits();
            const newVisit = {
                id: this.generateId(),
                customerId: visit.customerId,
                date: visit.date || new Date().toISOString(),
                type: visit.type || 'consultation',
                notes: visit.notes || '',
                nextVisitDate: visit.nextVisitDate || null,
                status: visit.status || 'completed',
                createdAt: new Date().toISOString()
            };
            
            visits.push(newVisit);
            this.saveToStorage(this.storageKeys.visits, visits);
            
            // Update customer's visit info
            this.updateCustomer(visit.customerId, {
                lastVisit: newVisit.date,
                nextVisit: newVisit.nextVisitDate,
                totalVisits: this.getCustomerVisits(visit.customerId).length
            });
            
            return newVisit;
        } catch (error) {
            console.error('Error adding visit:', error);
            throw error;
        }
    }

    getCustomerVisits(customerId) {
        const visits = this.getVisits();
        return visits.filter(visit => visit.customerId === customerId);
    }

    // Invoice Management
    getInvoices() {
        return this.getFromStorage(this.storageKeys.invoices) || [];
    }

    addInvoice(invoice) {
        try {
            const invoices = this.getInvoices();
            const newInvoice = {
                id: this.generateId(),
                invoiceNumber: this.generateInvoiceNumber(),
                customerId: invoice.customerId || null,
                customerName: invoice.customerName || 'Walk-in Customer',
                items: invoice.items || [],
                subtotal: parseFloat(invoice.subtotal) || 0,
                discount: parseFloat(invoice.discount) || 0,
                gstAmount: parseFloat(invoice.gstAmount) || 0,
                total: parseFloat(invoice.total) || 0,
                paymentStatus: invoice.paymentStatus || 'paid',
                paymentMethod: invoice.paymentMethod || 'cash',
                notes: invoice.notes || '',
                createdAt: new Date().toISOString(),
                dueDate: invoice.dueDate || null
            };
            
            invoices.push(newInvoice);
            this.saveToStorage(this.storageKeys.invoices, invoices);
            
            // Update stock for each item
            newInvoice.items.forEach(item => {
                this.updateStock(item.id, item.quantity, 'subtract');
            });
            
            // Update customer's total spent
            if (newInvoice.customerId) {
                const customer = this.getCustomers().find(c => c.id === newInvoice.customerId);
                if (customer) {
                    this.updateCustomer(newInvoice.customerId, {
                        totalSpent: (customer.totalSpent || 0) + newInvoice.total
                    });
                }
            }
            
            return newInvoice;
        } catch (error) {
            console.error('Error adding invoice:', error);
            throw error;
        }
    }

    updateInvoiceStatus(id, status) {
        try {
            const invoices = this.getInvoices();
            const invoice = invoices.find(inv => inv.id === id);
            
            if (!invoice) {
                throw new Error('Invoice not found');
            }
            
            invoice.paymentStatus = status;
            invoice.updatedAt = new Date().toISOString();
            
            this.saveToStorage(this.storageKeys.invoices, invoices);
            return invoice;
        } catch (error) {
            console.error('Error updating invoice status:', error);
            throw error;
        }
    }

    // Settings Management
    getSettings() {
        return this.getFromStorage(this.storageKeys.settings) || {};
    }

    updateSettings(updates) {
        try {
            const settings = this.getSettings();
            const updatedSettings = { ...settings, ...updates };
            this.saveToStorage(this.storageKeys.settings, updatedSettings);
            return updatedSettings;
        } catch (error) {
            console.error('Error updating settings:', error);
            throw error;
        }
    }

    // Categories and Units
    getCategories() {
        return this.getFromStorage(this.storageKeys.categories) || [];
    }

    addCategory(category) {
        try {
            const categories = this.getCategories();
            if (!categories.includes(category)) {
                categories.push(category);
                this.saveToStorage(this.storageKeys.categories, categories);
            }
            return categories;
        } catch (error) {
            console.error('Error adding category:', error);
            throw error;
        }
    }

    removeCategory(category) {
        try {
            const categories = this.getCategories();
            const filteredCategories = categories.filter(cat => cat !== category);
            this.saveToStorage(this.storageKeys.categories, filteredCategories);
            return filteredCategories;
        } catch (error) {
            console.error('Error removing category:', error);
            throw error;
        }
    }

    getUnits() {
        return this.getFromStorage(this.storageKeys.units) || [];
    }

    addUnit(unit) {
        try {
            const units = this.getUnits();
            if (!units.includes(unit)) {
                units.push(unit);
                this.saveToStorage(this.storageKeys.units, units);
            }
            return units;
        } catch (error) {
            console.error('Error adding unit:', error);
            throw error;
        }
    }

    removeUnit(unit) {
        try {
            const units = this.getUnits();
            const filteredUnits = units.filter(u => u !== unit);
            this.saveToStorage(this.storageKeys.units, filteredUnits);
            return filteredUnits;
        } catch (error) {
            console.error('Error removing unit:', error);
            throw error;
        }
    }

    // Utility Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    generateInvoiceNumber() {
        const invoices = this.getInvoices();
        const today = new Date();
        const year = today.getFullYear().toString().substr(-2);
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const prefix = `INV${year}${month}`;
        
        const todayInvoices = invoices.filter(inv => 
            inv.invoiceNumber.startsWith(prefix)
        );
        
        const nextNumber = (todayInvoices.length + 1).toString().padStart(4, '0');
        return `${prefix}${nextNumber}`;
    }

    // Search and Filter Methods
    searchInventory(query, filters = {}) {
        let inventory = this.getInventory();
        
        // Text search
        if (query) {
            const searchTerm = query.toLowerCase();
            inventory = inventory.filter(item => 
                item.name.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm) ||
                item.supplier.toLowerCase().includes(searchTerm) ||
                item.batchNo.toLowerCase().includes(searchTerm)
            );
        }
        
        // Category filter
        if (filters.category) {
            inventory = inventory.filter(item => item.category === filters.category);
        }
        
        // Expiry filter
        if (filters.expiryDays) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() + parseInt(filters.expiryDays));
            
            inventory = inventory.filter(item => {
                if (!item.expDate) return false;
                const expDate = new Date(item.expDate);
                return expDate <= targetDate;
            });
        }
        
        return inventory;
    }

    searchCustomers(query, filters = {}) {
        let customers = this.getCustomers();
        
        // Text search
        if (query) {
            const searchTerm = query.toLowerCase();
            customers = customers.filter(customer => 
                customer.name.toLowerCase().includes(searchTerm) ||
                customer.mobile.includes(searchTerm) ||
                customer.email.toLowerCase().includes(searchTerm)
            );
        }
        
        // Type filter
        if (filters.type) {
            customers = customers.filter(customer => customer.type === filters.type);
        }
        
        return customers;
    }

    // Data Export/Import
    exportAllData() {
        try {
            const data = {
                inventory: this.getInventory(),
                customers: this.getCustomers(),
                invoices: this.getInvoices(),
                visits: this.getVisits(),
                settings: this.getSettings(),
                categories: this.getCategories(),
                units: this.getUnits(),
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
            
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    importAllData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Validate data structure
            if (!data.version) {
                throw new Error('Invalid data format');
            }
            
            // Import each data type
            if (data.inventory) this.saveToStorage(this.storageKeys.inventory, data.inventory);
            if (data.customers) this.saveToStorage(this.storageKeys.customers, data.customers);
            if (data.invoices) this.saveToStorage(this.storageKeys.invoices, data.invoices);
            if (data.visits) this.saveToStorage(this.storageKeys.visits, data.visits);
            if (data.settings) this.saveToStorage(this.storageKeys.settings, data.settings);
            if (data.categories) this.saveToStorage(this.storageKeys.categories, data.categories);
            if (data.units) this.saveToStorage(this.storageKeys.units, data.units);
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }

    clearAllData() {
        try {
            Object.values(this.storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });
            this.initializeDefaultData();
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            throw error;
        }
    }

    // Status helpers
    getItemStatus(item) {
        const now = new Date();
        const expDate = item.expDate ? new Date(item.expDate) : null;
        
        // Check if expired
        if (expDate && expDate < now) {
            return 'expired';
        }
        
        // Check if near expiry (within 30 days)
        if (expDate) {
            const daysUntilExpiry = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry <= 30) {
                return 'near-expiry';
            }
        }
        
        // Check if low stock
        if (item.stock <= item.lowStockThreshold) {
            return 'low-stock';
        }
        
        return 'in-stock';
    }
}

// Initialize and make globally available
window.dataService = new DataService();
