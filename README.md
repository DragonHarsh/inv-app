# Local Shop Inventory & Billing System

A comprehensive inventory management and billing application designed for local shops, clinics, pharmacies, and small businesses.

## 🚀 Features

- **Inventory Management**: Track items with expiry dates, stock levels, and categories
- **Billing System**: Create invoices with GST calculations and WhatsApp sharing
- **Customer Management**: Maintain customer records with visit history
- **Firebase Integration**: Cloud sync with subscription-based access
- **Analytics**: Business insights and reporting
- **Modern UI**: Responsive design with dark/light themes

## 📋 Prerequisites

- Web browser (Chrome, Firefox, Safari, Edge)
- Python 3.x (for local development server)
- Firebase account (for cloud features)

## 🛠️ Installation & Setup

### Method 1: Local Development Server (Recommended)

1. **Download/Clone the project files**
   ```bash
   # If you have git
   git clone <repository-url>
   cd inventory-management-system
   
   # Or download and extract the ZIP file
   ```

2. **Start the local server**
   ```bash
   # Navigate to project directory
   cd /path/to/your/project
   
   # Start Python server
   python3 -m http.server 8000
   
   # Or if you have Python 2
   python -m SimpleHTTPServer 8000
   ```

3. **Access the application**
   - Open your browser
   - Go to: `http://localhost:8000`
   - Login with: **Username:** `admin` **Password:** `0000`

### Method 2: Direct File Access

1. **Open index.html directly**
   - Navigate to the project folder
   - Double-click `index.html`
   - The app will open in your default browser

## 🔧 Configuration

### Firebase Setup (Optional but Recommended)

1. **Admin Firebase Project** (for subscription management)
   - Already configured with your credentials
   - Manages clinic subscriptions and access control

2. **Clinic Firebase Project** (for data storage)
   - Each clinic needs their own Firebase project
   - Configure through the app's Firebase Configuration screen

### First Time Setup

1. **Login**: Use `admin` / `0000`
2. **Firebase Config**: Enter your clinic's Firebase credentials when prompted
3. **Shop Settings**: Go to Settings → Shop Information to configure your business details
4. **Add Categories**: Add your product categories in Settings
5. **Add Inventory**: Start adding your inventory items

## 📱 How to Use

### Adding Inventory Items
1. Go to **Inventory** → **Add Item**
2. Fill in item details (name, category, prices, stock, expiry date)
3. Set low stock threshold for alerts
4. Save the item

### Creating Invoices
1. Go to **Billing** → **Create New Invoice**
2. Select customer (optional)
3. Click **Browse** to select items
4. Adjust quantities and discount
5. **Generate Invoice**
6. **Share via WhatsApp** or **Print**

### Managing Customers
1. Go to **Customers** → **Add Customer**
2. Enter customer details and medical summary
3. Track visits and schedule follow-ups
4. View customer history and spending

### Analytics & Reports
1. **Dashboard**: View real-time business metrics
2. **Export Reports**: Generate PDF reports for taxation
3. **Filter Data**: Use date ranges and categories
4. **Business Insights**: Get automated recommendations

## 🌐 Deployment Options

### Option 1: Web Hosting (Recommended)

1. **Upload to Web Host**
   ```bash
   # Upload all files to your web hosting provider
   # Popular options: Netlify, Vercel, GitHub Pages, Hostinger
   ```

2. **Netlify Deployment** (Free)
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop your project folder
   - Get instant live URL

3. **Vercel Deployment** (Free)
   - Go to [vercel.com](https://vercel.com)
   - Import your project
   - Deploy with one click

### Option 2: Local Network Access

1. **Find your IP address**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. **Start server with network access**
   ```bash
   python3 -m http.server 8000 --bind 0.0.0.0
   ```

3. **Access from other devices**
   - Use: `http://YOUR_IP_ADDRESS:8000`
   - Example: `http://192.168.1.100:8000`

### Option 3: Mobile App (PWA)

The application is PWA-ready:
1. Open in mobile browser
2. Add to Home Screen
3. Use like a native app

## 🔒 Security & Data

### Data Storage
- **Local Storage**: Data stored in browser (offline capable)
- **Firebase Sync**: Optional cloud backup and sync
- **Export/Import**: Backup data as JSON files

### Security Features
- Login authentication
- Subscription-based access control
- Local data encryption (browser security)
- Firebase security rules

## 🛠️ Troubleshooting

### Common Issues

1. **Port 8000 already in use**
   ```bash
   # Kill existing process
   fuser -k 8000/tcp
   
   # Or use different port
   python3 -m http.server 8080
   ```

2. **Firebase connection issues**
   - Check internet connection
   - Verify Firebase credentials
   - Check Firebase project settings

3. **Browser compatibility**
   - Use modern browsers (Chrome 80+, Firefox 75+, Safari 13+)
   - Enable JavaScript
   - Clear browser cache if needed

### Performance Tips
- Use Chrome for best performance
- Clear browser data periodically
- Export data regularly for backup
- Use Firebase sync for multi-device access

## 📞 Support

### Default Login
- **Username**: `admin`
- **Password**: `0000`

### File Structure
```
inventory-management-system/
├── index.html              # Main application file
├── assets/
│   ├── style.css           # Main styles
│   └── themes.css          # Theme configurations
├── js/
│   ├── app.js              # Main application logic
│   ├── components/
│   │   └── itemSelector.js # Item selection component
│   └── services/
│       ├── dataService.js      # Data management
│       ├── firebaseService.js  # Firebase integration
│       ├── invoiceService.js   # Billing logic
│       └── analyticsService.js # Reports & analytics
└── README.md               # This file
```

## 🔄 Updates & Maintenance

### Regular Maintenance
1. **Backup Data**: Export data regularly
2. **Update Firebase**: Keep Firebase SDK updated
3. **Browser Updates**: Use latest browser versions
4. **Security**: Change default password

### Feature Requests
The application is modular and can be extended with:
- Additional report types
- More payment methods
- Advanced inventory features
- Multi-location support
- Staff management

---

## 🎯 Quick Start Guide

1. **Download** the project files
2. **Run** `python3 -m http.server 8000`
3. **Open** `http://localhost:8000`
4. **Login** with `admin` / `0000`
5. **Configure** Firebase (optional)
6. **Start** adding inventory and customers!

Your inventory management system is ready to use! 🎉
