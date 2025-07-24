// Firebase Service - Handles dual Firebase setup and subscription management
class FirebaseService {
    constructor() {
        // Admin Firebase configuration (managed by you)
        this.adminConfig = {
            apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Replace with your admin Firebase config
            authDomain: "admin-clinic-manager.firebaseapp.com",
            databaseURL: "https://admin-clinic-manager-default-rtdb.firebaseio.com",
            projectId: "admin-clinic-manager",
            storageBucket: "admin-clinic-manager.appspot.com",
            messagingSenderId: "123456789012",
            appId: "1:123456789012:web:abcdefghijklmnop"
        };
        
        this.clinicApp = null;
        this.adminApp = null;
        this.clinicConfigKey = 'clinic_firebase_config';
        this.clinicIdKey = 'clinic_id';
        
        // Get or generate clinic ID
        this.clinicID = localStorage.getItem(this.clinicIdKey) || this.generateClinicId();
        if (!localStorage.getItem(this.clinicIdKey)) {
            localStorage.setItem(this.clinicIdKey, this.clinicID);
        }
        
        this.isInitialized = false;
        this.subscriptionData = null;
    }

    // Generate a unique clinic ID
    generateClinicId() {
        return 'clinic_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Initialize Admin Firebase connection
    async initializeAdminConnection() {
        try {
            // Check if admin app already exists
            if (!firebase.apps.some(app => app.name === "adminApp")) {
                this.adminApp = firebase.initializeApp(this.adminConfig, "adminApp");
            } else {
                this.adminApp = firebase.app("adminApp");
            }
            
            // Test connection by reading a test document
            const firestore = firebase.firestore(this.adminApp);
            await firestore.collection('test').doc('connection').get();
            
            console.log('Admin Firebase connection initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize admin Firebase:', error);
            // For demo purposes, we'll simulate a successful connection
            // In production, you'd want to handle this error properly
            this.adminApp = { name: 'adminApp' }; // Mock admin app
            return true;
        }
    }

    // Check subscription status from Admin Firebase
    async checkSubscriptionStatus() {
        try {
            if (!this.adminApp) {
                await this.initializeAdminConnection();
            }

            // For demo purposes, we'll simulate the subscription check
            // In production, this would read from your admin Firebase
            const mockSubscriptionData = {
                name: "Demo Clinic",
                email: "demo@clinic.com",
                subscriptionActive: true,
                plan: "premium",
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
                firebaseConfig: null
            };

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check if subscription is active and not expired
            const now = new Date();
            const endDate = new Date(mockSubscriptionData.endDate);
            const isValid = mockSubscriptionData.subscriptionActive && now <= endDate;

            this.subscriptionData = mockSubscriptionData;
            
            if (!isValid) {
                console.log('Subscription check failed:', {
                    active: mockSubscriptionData.subscriptionActive,
                    expired: now > endDate,
                    endDate: mockSubscriptionData.endDate
                });
            }

            return isValid;

            /* 
            // Production code would look like this:
            const firestore = firebase.firestore(this.adminApp);
            const docRef = firestore.collection('clinics').doc(this.clinicID);
            const doc = await docRef.get();
            
            if (!doc.exists) {
                throw new Error("Clinic subscription data not found.");
            }
            
            const data = doc.data();
            const now = new Date();
            const endDate = new Date(data.endDate);
            
            this.subscriptionData = data;
            return data.subscriptionActive === true && now <= endDate;
            */
        } catch (error) {
            console.error('Subscription check failed:', error);
            throw new Error("Unable to verify subscription status: " + error.message);
        }
    }

    // Check if Firebase config is cached locally
    hasCachedFirebaseConfig() {
        const config = localStorage.getItem(this.clinicConfigKey);
        return config && config !== 'null' && config !== 'undefined';
    }

    // Get cached Firebase config
    getCachedFirebaseConfig() {
        try {
            const configStr = localStorage.getItem(this.clinicConfigKey);
            return configStr ? JSON.parse(configStr) : null;
        } catch (error) {
            console.error('Error reading cached Firebase config:', error);
            return null;
        }
    }

    // Test Firebase configuration and cache if successful
    async testAndCacheFirebaseConfig(config) {
        return new Promise(async (resolve, reject) => {
            let tempApp = null;
            try {
                // Validate required fields
                const requiredFields = ['apiKey', 'projectId', 'databaseURL', 'authDomain', 'storageBucket'];
                for (const field of requiredFields) {
                    if (!config[field] || config[field].trim() === '') {
                        throw new Error(`${field} is required`);
                    }
                }

                // Initialize a temporary Firebase app for testing
                const tempAppName = "tempClinicApp_" + Date.now();
                tempApp = firebase.initializeApp(config, tempAppName);
                
                // Test connection by trying to access Firestore
                const firestore = firebase.firestore(tempApp);
                
                // Try to read from a test collection (this will fail gracefully if collection doesn't exist)
                try {
                    await firestore.collection('test').doc('connection_test').get();
                } catch (firestoreError) {
                    // If it's a permission error, that's actually good - it means we connected
                    if (firestoreError.code === 'permission-denied') {
                        console.log('Firebase connection successful (permission denied is expected for test)');
                    } else {
                        throw firestoreError;
                    }
                }

                // If we get here, the config is valid - cache it
                localStorage.setItem(this.clinicConfigKey, JSON.stringify(config));
                
                console.log('Firebase config tested and cached successfully');
                resolve(true);
            } catch (error) {
                console.error('Firebase config test failed:', error);
                let errorMessage = "Firebase configuration test failed: ";
                
                if (error.code === 'auth/invalid-api-key') {
                    errorMessage += "Invalid API key";
                } else if (error.code === 'auth/project-not-found') {
                    errorMessage += "Project not found";
                } else if (error.message.includes('fetch')) {
                    errorMessage += "Network error - check your internet connection";
                } else {
                    errorMessage += error.message;
                }
                
                reject(new Error(errorMessage));
            } finally {
                // Clean up temporary app
                if (tempApp) {
                    try {
                        await tempApp.delete();
                    } catch (cleanupError) {
                        console.warn('Error cleaning up temp app:', cleanupError);
                    }
                }
            }
        });
    }

    // Initialize clinic-specific Firebase app
    async initializeClinicFirebase() {
        try {
            const config = this.getCachedFirebaseConfig();
            if (!config) {
                throw new Error("No cached Firebase config found");
            }

            // Initialize clinic Firebase app if not already done
            if (!firebase.apps.some(app => app.name === "clinicApp")) {
                this.clinicApp = firebase.initializeApp(config, "clinicApp");
                console.log('Clinic Firebase app initialized successfully');
            } else {
                this.clinicApp = firebase.app("clinicApp");
                console.log('Using existing clinic Firebase app');
            }

            // Test the connection
            const firestore = firebase.firestore(this.clinicApp);
            await firestore.collection('test').doc('init_test').get();

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize clinic Firebase:', error);
            throw new Error("Failed to connect to your clinic database: " + error.message);
        }
    }

    // Get Firestore instance for clinic operations
    getClinicFirestore() {
        if (!this.clinicApp) {
            throw new Error("Clinic Firebase not initialized");
        }
        return firebase.firestore(this.clinicApp);
    }

    // Get Auth instance for clinic operations
    getClinicAuth() {
        if (!this.clinicApp) {
            throw new Error("Clinic Firebase not initialized");
        }
        return firebase.auth(this.clinicApp);
    }

    // Clear cached configuration (for logout or reset)
    clearCachedConfig() {
        localStorage.removeItem(this.clinicConfigKey);
        if (this.clinicApp) {
            try {
                this.clinicApp.delete();
                this.clinicApp = null;
            } catch (error) {
                console.warn('Error deleting clinic app:', error);
            }
        }
        this.isInitialized = false;
    }

    // Get subscription information
    getSubscriptionInfo() {
        return this.subscriptionData;
    }

    // Check if clinic Firebase is ready for operations
    isClinicFirebaseReady() {
        return this.isInitialized && this.clinicApp !== null;
    }

    // Sync data between local storage and Firebase (utility method)
    async syncLocalDataToFirebase() {
        if (!this.isClinicFirebaseReady()) {
            throw new Error("Clinic Firebase not ready");
        }

        try {
            const firestore = this.getClinicFirestore();
            
            // Get local data
            const inventory = window.dataService.getInventory();
            const customers = window.dataService.getCustomers();
            const invoices = window.dataService.getInvoices();
            const visits = window.dataService.getVisits();
            const settings = window.dataService.getSettings();

            // Batch write to Firebase
            const batch = firestore.batch();

            // Sync inventory
            inventory.forEach(item => {
                const docRef = firestore.collection('inventory').doc(item.id);
                batch.set(docRef, item);
            });

            // Sync customers
            customers.forEach(customer => {
                const docRef = firestore.collection('customers').doc(customer.id);
                batch.set(docRef, customer);
            });

            // Sync invoices
            invoices.forEach(invoice => {
                const docRef = firestore.collection('invoices').doc(invoice.id);
                batch.set(docRef, invoice);
            });

            // Sync visits
            visits.forEach(visit => {
                const docRef = firestore.collection('visits').doc(visit.id);
                batch.set(docRef, visit);
            });

            // Sync settings
            const settingsRef = firestore.collection('settings').doc('clinic_settings');
            batch.set(settingsRef, settings);

            await batch.commit();
            console.log('Local data synced to Firebase successfully');
            return true;
        } catch (error) {
            console.error('Error syncing data to Firebase:', error);
            throw error;
        }
    }

    // Load data from Firebase to local storage (utility method)
    async loadDataFromFirebase() {
        if (!this.isClinicFirebaseReady()) {
            throw new Error("Clinic Firebase not ready");
        }

        try {
            const firestore = this.getClinicFirestore();
            
            // Load inventory
            const inventorySnapshot = await firestore.collection('inventory').get();
            const inventory = inventorySnapshot.docs.map(doc => doc.data());
            
            // Load customers
            const customersSnapshot = await firestore.collection('customers').get();
            const customers = customersSnapshot.docs.map(doc => doc.data());
            
            // Load invoices
            const invoicesSnapshot = await firestore.collection('invoices').get();
            const invoices = invoicesSnapshot.docs.map(doc => doc.data());
            
            // Load visits
            const visitsSnapshot = await firestore.collection('visits').get();
            const visits = visitsSnapshot.docs.map(doc => doc.data());
            
            // Load settings
            const settingsDoc = await firestore.collection('settings').doc('clinic_settings').get();
            const settings = settingsDoc.exists ? settingsDoc.data() : window.dataService.getSettings();

            // Update local storage
            localStorage.setItem('shop_inventory', JSON.stringify(inventory));
            localStorage.setItem('shop_customers', JSON.stringify(customers));
            localStorage.setItem('shop_invoices', JSON.stringify(invoices));
            localStorage.setItem('shop_visits', JSON.stringify(visits));
            localStorage.setItem('shop_settings', JSON.stringify(settings));

            console.log('Data loaded from Firebase successfully');
            return true;
        } catch (error) {
            console.error('Error loading data from Firebase:', error);
            throw error;
        }
    }

    // Get connection status
    getConnectionStatus() {
        return {
            adminConnected: !!this.adminApp,
            clinicConnected: this.isClinicFirebaseReady(),
            subscriptionValid: this.subscriptionData?.subscriptionActive || false,
            clinicId: this.clinicID
        };
    }
}

// Initialize and make globally available
