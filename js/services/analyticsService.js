// Analytics Service - Handles reports, statistics, and business analytics
class AnalyticsService {
    constructor() {
        this.reportTypes = {
            SALES: 'sales',
            INVENTORY: 'inventory',
            CUSTOMERS: 'customers',
            PNL: 'pnl',
            VISITS: 'visits'
        };
    }

    // Dashboard Statistics
    getDashboardStats() {
        try {
            const inventory = window.dataService.getInventory();
            const customers = window.dataService.getCustomers();
            const invoices = window.dataService.getInvoices();
            const visits = window.dataService.getVisits();
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Inventory stats
            const totalItems = inventory.length;
            const lowStockItems = inventory.filter(item => 
                item.stock <= item.lowStockThreshold
            ).length;
            
            const expiredItems = inventory.filter(item => {
                if (!item.expDate) return false;
                return new Date(item.expDate) < today;
            }).length;
            
            const nearExpiryItems = inventory.filter(item => {
                if (!item.expDate) return false;
                const expDate = new Date(item.expDate);
                const daysUntilExpiry = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
                return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
            }).length;

            // Sales stats
            const todaysInvoices = invoices.filter(invoice => {
                const invoiceDate = new Date(invoice.createdAt);
                return invoiceDate >= today && invoiceDate < tomorrow;
            });
            
            const todaysSales = todaysInvoices.reduce((sum, inv) => sum + inv.total, 0);

            // Customer stats
            const totalCustomers = customers.length;
            
            const todaysVisits = visits.filter(visit => {
                const visitDate = new Date(visit.date);
                return visitDate >= today && visitDate < tomorrow;
            }).length;

            const upcomingVisits = visits.filter(visit => {
                if (!visit.nextVisitDate) return false;
                const nextVisit = new Date(visit.nextVisitDate);
                return nextVisit >= today;
            }).length;

            return {
                totalItems,
                lowStockItems,
                expiredItems,
                nearExpiryItems,
                todaysSales,
                totalCustomers,
                todaysVisits,
                upcomingVisits,
                totalInvoices: invoices.length,
                totalVisits: visits.length
            };
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            return {
                totalItems: 0,
                lowStockItems: 0,
                expiredItems: 0,
                nearExpiryItems: 0,
                todaysSales: 0,
                totalCustomers: 0,
                todaysVisits: 0,
                upcomingVisits: 0,
                totalInvoices: 0,
                totalVisits: 0
            };
        }
    }

    // Sales Analytics
    getSalesReport(startDate, endDate) {
        try {
            const invoices = window.dataService.getInvoices();
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            const filteredInvoices = invoices.filter(invoice => {
                const invoiceDate = new Date(invoice.createdAt);
                return invoiceDate >= start && invoiceDate <= end;
            });

            const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
            const totalInvoices = filteredInvoices.length;
            const totalDiscount = filteredInvoices.reduce((sum, inv) => sum + inv.discount, 0);
            const totalGST = filteredInvoices.reduce((sum, inv) => sum + inv.gstAmount, 0);
            
            // Payment status breakdown
            const paidInvoices = filteredInvoices.filter(inv => inv.paymentStatus === 'paid');
            const unpaidInvoices = filteredInvoices.filter(inv => inv.paymentStatus === 'unpaid');
            
            // Top selling items
            const itemSales = {};
            filteredInvoices.forEach(invoice => {
                invoice.items.forEach(item => {
                    if (!itemSales[item.id]) {
                        itemSales[item.id] = {
                            name: item.name,
                            category: item.category,
                            totalQuantity: 0,
                            totalRevenue: 0,
                            invoiceCount: 0
                        };
                    }
                    itemSales[item.id].totalQuantity += item.quantity;
                    itemSales[item.id].totalRevenue += item.total;
                    itemSales[item.id].invoiceCount++;
                });
            });

            const topSellingItems = Object.values(itemSales)
                .sort((a, b) => b.totalRevenue - a.totalRevenue)
                .slice(0, 10);

            // Daily sales breakdown
            const dailySales = {};
            filteredInvoices.forEach(invoice => {
                const date = new Date(invoice.createdAt).toDateString();
                if (!dailySales[date]) {
                    dailySales[date] = {
                        date,
                        sales: 0,
                        invoices: 0
                    };
                }
                dailySales[date].sales += invoice.total;
                dailySales[date].invoices++;
            });

            const dailySalesArray = Object.values(dailySales)
                .sort((a, b) => new Date(a.date) - new Date(b.date));

            return {
                period: { startDate, endDate },
                summary: {
                    totalSales,
                    totalInvoices,
                    totalDiscount,
                    totalGST,
                    averageInvoiceValue: totalInvoices > 0 ? totalSales / totalInvoices : 0,
                    paidAmount: paidInvoices.reduce((sum, inv) => sum + inv.total, 0),
                    unpaidAmount: unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0)
                },
                topSellingItems,
                dailySales: dailySalesArray,
                invoices: filteredInvoices
            };
        } catch (error) {
            console.error('Error generating sales report:', error);
            throw error;
        }
    }

    // Inventory Analytics
    getInventoryReport() {
        try {
            const inventory = window.dataService.getInventory();
            const today = new Date();

            const totalItems = inventory.length;
            const totalValue = inventory.reduce((sum, item) => sum + (item.buyPrice * item.stock), 0);
            const totalSellingValue = inventory.reduce((sum, item) => sum + (item.sellPrice * item.stock), 0);
            const potentialProfit = totalSellingValue - totalValue;

            // Category breakdown
            const categoryStats = {};
            inventory.forEach(item => {
                if (!categoryStats[item.category]) {
                    categoryStats[item.category] = {
                        category: item.category,
                        itemCount: 0,
                        totalStock: 0,
                        totalValue: 0,
                        lowStockItems: 0,
                        expiredItems: 0,
                        nearExpiryItems: 0
                    };
                }
                
                const cat = categoryStats[item.category];
                cat.itemCount++;
                cat.totalStock += item.stock;
                cat.totalValue += item.buyPrice * item.stock;
                
                if (item.stock <= item.lowStockThreshold) cat.lowStockItems++;
                
                if (item.expDate) {
                    const expDate = new Date(item.expDate);
                    if (expDate < today) {
                        cat.expiredItems++;
                    } else {
                        const daysUntilExpiry = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
                        if (daysUntilExpiry <= 30) cat.nearExpiryItems++;
                    }
                }
            });

            // Stock alerts
            const lowStockItems = inventory.filter(item => item.stock <= item.lowStockThreshold);
            const expiredItems = inventory.filter(item => {
                if (!item.expDate) return false;
                return new Date(item.expDate) < today;
            });
            const nearExpiryItems = inventory.filter(item => {
                if (!item.expDate) return false;
                const expDate = new Date(item.expDate);
                const daysUntilExpiry = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
                return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
            });

            // Top value items
            const topValueItems = [...inventory]
                .sort((a, b) => (b.sellPrice * b.stock) - (a.sellPrice * a.stock))
                .slice(0, 10);

            return {
                summary: {
                    totalItems,
                    totalValue,
                    totalSellingValue,
                    potentialProfit,
                    profitMargin: totalValue > 0 ? ((potentialProfit / totalValue) * 100) : 0
                },
                categoryStats: Object.values(categoryStats),
                alerts: {
                    lowStockItems,
                    expiredItems,
                    nearExpiryItems
                },
                topValueItems,
                inventory
            };
        } catch (error) {
            console.error('Error generating inventory report:', error);
            throw error;
        }
    }

    // Customer Analytics
    getCustomerReport() {
        try {
            const customers = window.dataService.getCustomers();
            const invoices = window.dataService.getInvoices();
            const visits = window.dataService.getVisits();

            const totalCustomers = customers.length;
            const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);

            // Customer type breakdown
            const typeStats = {};
            customers.forEach(customer => {
                if (!typeStats[customer.type]) {
                    typeStats[customer.type] = {
                        type: customer.type,
                        count: 0,
                        totalSpent: 0,
                        averageSpent: 0
                    };
                }
                typeStats[customer.type].count++;
                typeStats[customer.type].totalSpent += customer.totalSpent || 0;
            });

            Object.values(typeStats).forEach(stat => {
                stat.averageSpent = stat.count > 0 ? stat.totalSpent / stat.count : 0;
            });

            // Top customers by spending
            const topCustomers = [...customers]
                .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
                .slice(0, 10);

            // Visit statistics
            const totalVisits = visits.length;
            const averageVisitsPerCustomer = totalCustomers > 0 ? totalVisits / totalCustomers : 0;

            // Monthly customer acquisition
            const monthlyAcquisition = {};
            customers.forEach(customer => {
                const month = new Date(customer.createdAt).toISOString().substr(0, 7);
                monthlyAcquisition[month] = (monthlyAcquisition[month] || 0) + 1;
            });

            return {
                summary: {
                    totalCustomers,
                    totalRevenue,
                    averageCustomerValue: totalCustomers > 0 ? totalRevenue / totalCustomers : 0,
                    totalVisits,
                    averageVisitsPerCustomer
                },
                typeStats: Object.values(typeStats),
                topCustomers,
                monthlyAcquisition,
                customers
            };
        } catch (error) {
            console.error('Error generating customer report:', error);
            throw error;
        }
    }

    // Profit & Loss Report
    getPnLReport(startDate, endDate) {
        try {
            const invoices = window.dataService.getInvoices();
            const inventory = window.dataService.getInventory();
            
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            const filteredInvoices = invoices.filter(invoice => {
                const invoiceDate = new Date(invoice.createdAt);
                return invoiceDate >= start && invoiceDate <= end;
            });

            // Revenue calculation
            const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
            const totalDiscount = filteredInvoices.reduce((sum, inv) => sum + inv.discount, 0);
            const netRevenue = totalRevenue - totalDiscount;

            // Cost of Goods Sold (COGS)
            let totalCOGS = 0;
            filteredInvoices.forEach(invoice => {
                invoice.items.forEach(item => {
                    const inventoryItem = inventory.find(inv => inv.id === item.id);
                    if (inventoryItem) {
                        totalCOGS += inventoryItem.buyPrice * item.quantity;
                    }
                });
            });

            // Gross Profit
            const grossProfit = netRevenue - totalCOGS;
            const grossProfitMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

            // Operating Expenses (placeholder - in real app, you'd track these)
            const operatingExpenses = {
                rent: 0,
                utilities: 0,
                salaries: 0,
                marketing: 0,
                other: 0
            };
            const totalOperatingExpenses = Object.values(operatingExpenses).reduce((sum, exp) => sum + exp, 0);

            // Net Profit
            const netProfit = grossProfit - totalOperatingExpenses;
            const netProfitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

            // Item-wise profit analysis
            const itemProfits = {};
            filteredInvoices.forEach(invoice => {
                invoice.items.forEach(item => {
                    const inventoryItem = inventory.find(inv => inv.id === item.id);
                    if (inventoryItem) {
                        if (!itemProfits[item.id]) {
                            itemProfits[item.id] = {
                                name: item.name,
                                category: item.category,
                                totalRevenue: 0,
                                totalCost: 0,
                                totalProfit: 0,
                                quantitySold: 0,
                                profitMargin: 0
                            };
                        }
                        
                        const profit = itemProfits[item.id];
                        profit.totalRevenue += item.total;
                        profit.totalCost += inventoryItem.buyPrice * item.quantity;
                        profit.quantitySold += item.quantity;
                    }
                });
            });

            Object.values(itemProfits).forEach(profit => {
                profit.totalProfit = profit.totalRevenue - profit.totalCost;
                profit.profitMargin = profit.totalRevenue > 0 ? 
                    (profit.totalProfit / profit.totalRevenue) * 100 : 0;
            });

            const topProfitableItems = Object.values(itemProfits)
                .sort((a, b) => b.totalProfit - a.totalProfit)
                .slice(0, 10);

            return {
                period: { startDate, endDate },
                revenue: {
                    totalRevenue,
                    totalDiscount,
                    netRevenue
                },
                costs: {
                    totalCOGS,
                    operatingExpenses,
                    totalOperatingExpenses
                },
                profit: {
                    grossProfit,
                    grossProfitMargin,
                    netProfit,
                    netProfitMargin
                },
                itemProfits: topProfitableItems,
                summary: {
                    totalInvoices: filteredInvoices.length,
                    averageInvoiceValue: filteredInvoices.length > 0 ? 
                        totalRevenue / filteredInvoices.length : 0
                }
            };
        } catch (error) {
            console.error('Error generating P&L report:', error);
            throw error;
        }
    }

    // Visit Analytics
    getVisitReport(startDate, endDate) {
        try {
            const visits = window.dataService.getVisits();
            const customers = window.dataService.getCustomers();
            
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            const filteredVisits = visits.filter(visit => {
                const visitDate = new Date(visit.date);
                return visitDate >= start && visitDate <= end;
            });

            const totalVisits = filteredVisits.length;
            const uniqueCustomers = new Set(filteredVisits.map(v => v.customerId)).size;

            // Visit type breakdown
            const typeStats = {};
            filteredVisits.forEach(visit => {
                typeStats[visit.type] = (typeStats[visit.type] || 0) + 1;
            });

            // Daily visit pattern
            const dailyVisits = {};
            filteredVisits.forEach(visit => {
                const date = new Date(visit.date).toDateString();
                dailyVisits[date] = (dailyVisits[date] || 0) + 1;
            });

            // Customer visit frequency
            const customerVisitCount = {};
            filteredVisits.forEach(visit => {
                customerVisitCount[visit.customerId] = (customerVisitCount[visit.customerId] || 0) + 1;
            });

            const frequentCustomers = Object.entries(customerVisitCount)
                .map(([customerId, visitCount]) => {
                    const customer = customers.find(c => c.id === customerId);
                    return {
                        customer: customer ? customer.name : 'Unknown',
                        customerId,
                        visitCount
                    };
                })
                .sort((a, b) => b.visitCount - a.visitCount)
                .slice(0, 10);

            return {
                period: { startDate, endDate },
                summary: {
                    totalVisits,
                    uniqueCustomers,
                    averageVisitsPerCustomer: uniqueCustomers > 0 ? totalVisits / uniqueCustomers : 0
                },
                typeStats,
                dailyVisits: Object.entries(dailyVisits).map(([date, count]) => ({ date, count })),
                frequentCustomers,
                visits: filteredVisits
            };
        } catch (error) {
            console.error('Error generating visit report:', error);
            throw error;
        }
    }

    // Report Export Functions
    generateReportHTML(reportType, reportData) {
        const settings = window.dataService.getSettings();
        const reportTitle = this.getReportTitle(reportType);
        
        let reportContent = '';
        
        switch (reportType) {
            case this.reportTypes.SALES:
                reportContent = this.generateSalesReportHTML(reportData);
                break;
            case this.reportTypes.INVENTORY:
                reportContent = this.generateInventoryReportHTML(reportData);
                break;
            case this.reportTypes.CUSTOMERS:
                reportContent = this.generateCustomerReportHTML(reportData);
                break;
            case this.reportTypes.PNL:
                reportContent = this.generatePnLReportHTML(reportData);
                break;
            case this.reportTypes.VISITS:
                reportContent = this.generateVisitReportHTML(reportData);
                break;
            default:
                reportContent = '<p>Report type not supported</p>';
        }

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${reportTitle} - ${settings.shopName || 'Shop Report'}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                    .shop-info { text-align: center; margin-bottom: 20px; }
                    .report-meta { margin-bottom: 30px; background: #f5f5f5; padding: 15px; border-radius: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .summary-box { background: #e8f4fd; padding: 15px; margin: 20px 0; border-radius: 5px; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .font-bold { font-weight: bold; }
                    .mb-20 { margin-bottom: 20px; }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${settings.shopName || 'Local Shop'}</h1>
                    <h2>${reportTitle}</h2>
                </div>
                
                <div class="shop-info">
                    ${settings.address ? `<p>${settings.address}</p>` : ''}
                    ${settings.contact ? `<p>Phone: ${settings.contact}</p>` : ''}
                    ${settings.gst ? `<p>GST No: ${settings.gst}</p>` : ''}
                </div>
                
                <div class="report-meta">
                    <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
                    ${reportData.period ? `<p><strong>Period:</strong> ${new Date(reportData.period.startDate).toLocaleDateString()} to ${new Date(reportData.period.endDate).toLocaleDateString()}</p>` : ''}
                </div>
                
                ${reportContent}
                
                <div class="no-print" style="margin-top: 30px; text-align: center;">
                    <button onclick="window.print()">Print Report</button>
                    <button onclick="window.close()">Close</button>
                </div>
            </body>
            </html>
        `;
    }

    generateSalesReportHTML(data) {
        return `
            <div class="summary-box">
                <h3>Sales Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                    <div>
                        <p><strong>Total Sales:</strong> ₹${data.summary.totalSales.toFixed(2)}</p>
                        <p><strong>Total Invoices:</strong> ${data.summary.totalInvoices}</p>
                    </div>
                    <div>
                        <p><strong>Total Discount:</strong> ₹${data.summary.totalDiscount.toFixed(2)}</p>
                        <p><strong>Total GST:</strong> ₹${data.summary.totalGST.toFixed(2)}</p>
                    </div>
                    <div>
                        <p><strong>Average Invoice:</strong> ₹${data.summary.averageInvoiceValue.toFixed(2)}</p>
                        <p><strong>Unpaid Amount:</strong> ₹${data.summary.unpaidAmount.toFixed(2)}</p>
                    </div>
                </div>
            </div>
            
            <h3>Top Selling Items</h3>
            <table>
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Quantity Sold</th>
                        <th>Revenue</th>
                        <th>Invoices</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.topSellingItems.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.category}</td>
                            <td>${item.totalQuantity}</td>
                            <td>₹${item.totalRevenue.toFixed(2)}</td>
                            <td>${item.invoiceCount}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    generateInventoryReportHTML(data) {
        return `
            <div class="summary-box">
                <h3>Inventory Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                    <div>
                        <p><strong>Total Items:</strong> ${data.summary.totalItems}</p>
                        <p><strong>Total Value:</strong> ₹${data.summary.totalValue.toFixed(2)}</p>
                    </div>
                    <div>
                        <p><strong>Selling Value:</strong> ₹${data.summary.totalSellingValue.toFixed(2)}</p>
                        <p><strong>Potential Profit:</strong> ₹${data.summary.potentialProfit.toFixed(2)}</p>
                    </div>
                    <div>
                        <p><strong>Profit Margin:</strong> ${data.summary.profitMargin.toFixed(2)}%</p>
                    </div>
                </div>
            </div>
            
            <h3>Stock Alerts</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px;">
                <div>
                    <h4>Low Stock (${data.alerts.lowStockItems.length})</h4>
                    ${data.alerts.lowStockItems.slice(0, 5).map(item => 
                        `<p>${item.name}: ${item.stock} ${item.unit}</p>`
                    ).join('')}
                </div>
                <div>
                    <h4>Near Expiry (${data.alerts.nearExpiryItems.length})</h4>
                    ${data.alerts.nearExpiryItems.slice(0, 5).map(item => 
                        `<p>${item.name}: ${new Date(item.expDate).toLocaleDateString()}</p>`
                    ).join('')}
                </div>
                <div>
                    <h4>Expired (${data.alerts.expiredItems.length})</h4>
                    ${data.alerts.expiredItems.slice(0, 5).map(item => 
                        `<p>${item.name}: ${new Date(item.expDate).toLocaleDateString()}</p>`
                    ).join('')}
                </div>
            </div>
        `;
    }

    generateCustomerReportHTML(data) {
        return `
            <div class="summary-box">
                <h3>Customer Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                    <div>
                        <p><strong>Total Customers:</strong> ${data.summary.totalCustomers}</p>
                        <p><strong>Total Revenue:</strong> ₹${data.summary.totalRevenue.toFixed(2)}</p>
                    </div>
                    <div>
                        <p><strong>Average Customer Value:</strong> ₹${data.summary.averageCustomerValue.toFixed(2)}</p>
                        <p><strong>Average Visits per Customer:</strong> ${data.summary.averageVisitsPerCustomer.toFixed(1)}</p>
                    </div>
                </div>
            </div>
            
            <h3>Top Customers</h3>
            <table>
                <thead>
                    <tr>
                        <th>Customer Name</th>
                        <th>Type</th>
                        <th>Total Spent</th>
                        <th>Total Visits</th>
                        <th>Last Visit</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.topCustomers.map(customer => `
                        <tr>
                            <td>${customer.name}</td>
                            <td>${customer.type}</td>
                            <td>₹${(customer.totalSpent || 0).toFixed(2)}</td>
                            <td>${customer.totalVisits || 0}</td>
                            <td>${customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'Never'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    generatePnLReportHTML(data) {
        return `
            <div class="summary-box">
                <h3>Profit & Loss Summary</h3>
                <table style="width: 60%; margin: 0 auto;">
                    <tr>
                        <td><strong>Total Revenue</strong></td>
                        <td class="text-right">₹${data.revenue.totalRevenue.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Less: Discount</td>
                        <td class="text-right">₹${data.revenue.totalDiscount.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Net Revenue</strong></td>
                        <td class="text-right">₹${data.revenue.netRevenue.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Less: Cost of Goods Sold</td>
                        <td class="text-right">₹${data.costs.totalCOGS.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Gross Profit</strong></td>
                        <td class="text-right">₹${data.profit.grossProfit.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Less: Operating Expenses</td>
                        <td class="text-right">₹${data.costs.totalOperatingExpenses.toFixed(2)}</td>
                    </tr>
                    <tr style="border-top: 2px solid #333;">
                        <td><strong>Net Profit</strong></td>
                        <td class="text-right font-bold">₹${data.profit.netProfit.toFixed(2)}</td>
                    </tr>
                </table>
            </div>
            
            <h3>Top Profitable Items</h3>
            <table>
                <thead>
                    <tr>
                        <th>Item Name</th>
                        <th>Category</th>
                        <th>Revenue</th>
                        <th>Cost</th>
                        <th>Profit</th>
                        <th>Margin %</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.itemProfits.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.category}</td>
                            <td>₹${item.totalRevenue.toFixed(2)}</td>
                            <td>₹${item.totalCost.toFixed(2)}</td>
                            <td>₹${item.totalProfit.toFixed(2)}</td>
                            <td>${item.profitMargin.toFixed(2)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    generateVisitReportHTML(data) {
        return `
            <div class="summary-box">
                <h3>Visit Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                    <div>
                        <p><strong>Total Visits:</strong> ${data.summary.totalVisits}</p>
                    </div>
                    <div>
                        <p><strong>Unique Customers:</strong> ${data.summary.uniqueCustomers}</p>
                    </div>
                    <div>
                        <p><strong>Avg Visits/Customer:</strong> ${data.summary.averageVisitsPerCustomer.toFixed(1)}</p>
                    </div>
                </div>
            </div>
            
            <h3>Frequent Customers</h3>
            <table>
                <thead>
                    <tr>
                        <th>Customer Name</th>
                        <th>Visit Count</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.frequentCustomers.map(customer => `
                        <tr>
                            <td>${customer.customer}</td>
                            <td>${customer.visitCount}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    getReportTitle(reportType) {
        const titles = {
            [this.reportTypes.SALES]: 'Sales Report',
            [this.reportTypes.INVENTORY]: 'Inventory Report',
            [this.reportTypes.CUSTOMERS]: 'Customer Report',
            [this.reportTypes.PNL]: 'Profit & Loss Report',
            [this.reportTypes.VISITS]: 'Visit Report'
        };
        return titles[reportType] || 'Report';
    }

    // Export report as HTML file
    exportReport(reportType, reportData) {
        try {
            const html = this.generateReportHTML(reportType, reportData);
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.getReportTitle(reportType)}_${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Error exporting report:', error);
            throw error;
        }
    }

    // Print report
    printReport(reportType, reportData) {
        try {
            const html = this.generateReportHTML(reportType, reportData);
            const printWindow = window.open('', '_blank');
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            return true;
        } catch (error) {
            console.error('Error printing report:', error);
            throw error;
        }
    }

    // Quick date range helpers
    getDateRange(period) {
        const end = new Date();
        const start = new Date();
        
        switch (period) {
            case '1':
                start.setMonth(start.getMonth() - 1);
                break;
            case '3':
                start.setMonth(start.getMonth() - 3);
                break;
            case '6':
                start.setMonth(start.getMonth() - 6);
                break;
            case '12':
                start.setFullYear(start.getFullYear() - 1);
                break;
            default:
                start.setMonth(start.getMonth() - 1);
        }
        
        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        };
    }

    // Business insights
    getBusinessInsights() {
        try {
            const inventory = window.dataService.getInventory();
            const invoices = window.dataService.getInvoices();
            const customers = window.dataService.getCustomers();
            
            const insights = [];
            
            // Low stock insights
            const lowStockItems = inventory.filter(item => item.stock <= item.lowStockThreshold);
            if (lowStockItems.length > 0) {
                insights.push({
                    type: 'warning',
                    title: 'Low Stock Alert',
                    message: `${lowStockItems.length} items are running low on stock`,
                    action: 'Review inventory and reorder items',
                    priority: 'high'
                });
            }
            
            // Expiry insights
            const today = new Date();
            const expiredItems = inventory.filter(item => {
                if (!item.expDate) return false;
                return new Date(item.expDate) < today;
            });
            
            if (expiredItems.length > 0) {
                insights.push({
                    type: 'error',
                    title: 'Expired Items',
                    message: `${expiredItems.length} items have expired`,
                    action: 'Remove expired items from inventory',
                    priority: 'critical'
                });
            }
            
            // Sales trend insights
            const last30Days = invoices.filter(inv => {
                const invoiceDate = new Date(inv.createdAt);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return invoiceDate >= thirtyDaysAgo;
            });
            
            const previous30Days = invoices.filter(inv => {
                const invoiceDate = new Date(inv.createdAt);
                const sixtyDaysAgo = new Date();
                sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return invoiceDate >= sixtyDaysAgo && invoiceDate < thirtyDaysAgo;
            });
            
            const currentSales = last30Days.reduce((sum, inv) => sum + inv.total, 0);
            const previousSales = previous30Days.reduce((sum, inv) => sum + inv.total, 0);
            
            if (previousSales > 0) {
                const growthRate = ((currentSales - previousSales) / previousSales) * 100;
                if (growthRate > 10) {
                    insights.push({
                        type: 'success',
                        title: 'Sales Growth',
                        message: `Sales increased by ${growthRate.toFixed(1)}% compared to last month`,
                        action: 'Continue current strategies',
                        priority: 'low'
                    });
                } else if (growthRate < -10) {
                    insights.push({
                        type: 'warning',
                        title: 'Sales Decline',
                        message: `Sales decreased by ${Math.abs(growthRate).toFixed(1)}% compared to last month`,
                        action: 'Review sales strategies and customer engagement',
                        priority: 'medium'
                    });
                }
            }
            
            // Customer insights
            const inactiveCustomers = customers.filter(customer => {
                if (!customer.lastVisit) return true;
                const lastVisit = new Date(customer.lastVisit);
                const threeMonthsAgo = new Date();
                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                return lastVisit < threeMonthsAgo;
            });
            
            if (inactiveCustomers.length > 0) {
                insights.push({
                    type: 'info',
                    title: 'Inactive Customers',
                    message: `${inactiveCustomers.length} customers haven't visited in 3+ months`,
                    action: 'Consider reaching out with special offers or reminders',
                    priority: 'medium'
                });
            }
            
            return insights.sort((a, b) => {
                const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            });
            
        } catch (error) {
            console.error('Error generating business insights:', error);
            return [];
        }
    }
}

// Initialize and make globally available
window.analyticsService = new AnalyticsService();
