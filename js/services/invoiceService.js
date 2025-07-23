// Invoice Service - Handles billing, GST calculations, and invoice generation
class InvoiceService {
    constructor() {
        this.currentInvoice = {
            items: [],
            customer: null,
            subtotal: 0,
            discount: 0,
            gstAmount: 0,
            total: 0
        };
        
        this.gstRate = 18; // Default GST rate
    }

    // Invoice Creation
    createNewInvoice() {
        this.currentInvoice = {
            items: [],
            customer: null,
            subtotal: 0,
            discount: 0,
            gstAmount: 0,
            total: 0
        };
        return this.currentInvoice;
    }

    setCustomer(customer) {
        this.currentInvoice.customer = customer;
        return this.currentInvoice;
    }

    addItem(inventoryItem, quantity) {
        try {
            // Validate stock availability
            if (inventoryItem.stock < quantity) {
                throw new Error(`Insufficient stock. Available: ${inventoryItem.stock}`);
            }

            // Check if item already exists in invoice
            const existingItemIndex = this.currentInvoice.items.findIndex(
                item => item.id === inventoryItem.id
            );

            if (existingItemIndex >= 0) {
                // Update existing item quantity
                const existingItem = this.currentInvoice.items[existingItemIndex];
                const newQuantity = existingItem.quantity + quantity;
                
                if (newQuantity > inventoryItem.stock) {
                    throw new Error(`Total quantity exceeds stock. Available: ${inventoryItem.stock}`);
                }
                
                existingItem.quantity = newQuantity;
                existingItem.total = existingItem.price * newQuantity;
            } else {
                // Add new item
                const invoiceItem = {
                    id: inventoryItem.id,
                    name: inventoryItem.name,
                    category: inventoryItem.category,
                    price: inventoryItem.sellPrice,
                    quantity: quantity,
                    unit: inventoryItem.unit,
                    total: inventoryItem.sellPrice * quantity,
                    batchNo: inventoryItem.batchNo || '',
                    expDate: inventoryItem.expDate || ''
                };
                
                this.currentInvoice.items.push(invoiceItem);
            }

            this.calculateTotals();
            return this.currentInvoice;
        } catch (error) {
            console.error('Error adding item to invoice:', error);
            throw error;
        }
    }

    removeItem(itemId) {
        this.currentInvoice.items = this.currentInvoice.items.filter(
            item => item.id !== itemId
        );
        this.calculateTotals();
        return this.currentInvoice;
    }

    updateItemQuantity(itemId, quantity) {
        try {
            const item = this.currentInvoice.items.find(item => item.id === itemId);
            if (!item) {
                throw new Error('Item not found in invoice');
            }

            // Get inventory item to check stock
            const inventoryItem = window.dataService.getInventory().find(
                inv => inv.id === itemId
            );
            
            if (inventoryItem && quantity > inventoryItem.stock) {
                throw new Error(`Insufficient stock. Available: ${inventoryItem.stock}`);
            }

            if (quantity <= 0) {
                this.removeItem(itemId);
            } else {
                item.quantity = quantity;
                item.total = item.price * quantity;
                this.calculateTotals();
            }

            return this.currentInvoice;
        } catch (error) {
            console.error('Error updating item quantity:', error);
            throw error;
        }
    }

    setDiscount(discount, isPercentage = false) {
        try {
            if (isPercentage) {
                if (discount < 0 || discount > 100) {
                    throw new Error('Percentage discount must be between 0 and 100');
                }
                this.currentInvoice.discount = (this.currentInvoice.subtotal * discount) / 100;
            } else {
                if (discount < 0 || discount > this.currentInvoice.subtotal) {
                    throw new Error('Discount cannot be negative or exceed subtotal');
                }
                this.currentInvoice.discount = discount;
            }

            this.calculateTotals();
            return this.currentInvoice;
        } catch (error) {
            console.error('Error setting discount:', error);
            throw error;
        }
    }

    calculateTotals() {
        // Calculate subtotal
        this.currentInvoice.subtotal = this.currentInvoice.items.reduce(
            (sum, item) => sum + item.total, 0
        );

        // Calculate GST on discounted amount
        const discountedAmount = this.currentInvoice.subtotal - this.currentInvoice.discount;
        this.currentInvoice.gstAmount = (discountedAmount * this.gstRate) / 100;

        // Calculate total
        this.currentInvoice.total = discountedAmount + this.currentInvoice.gstAmount;

        return this.currentInvoice;
    }

    // Invoice Generation and Saving
    generateInvoice(paymentMethod = 'cash', notes = '') {
        try {
            if (this.currentInvoice.items.length === 0) {
                throw new Error('Cannot generate invoice without items');
            }

            const invoice = {
                customerId: this.currentInvoice.customer?.id || null,
                customerName: this.currentInvoice.customer?.name || 'Walk-in Customer',
                items: [...this.currentInvoice.items],
                subtotal: this.currentInvoice.subtotal,
                discount: this.currentInvoice.discount,
                gstAmount: this.currentInvoice.gstAmount,
                total: this.currentInvoice.total,
                paymentMethod: paymentMethod,
                paymentStatus: 'paid',
                notes: notes
            };

            // Save invoice to data service
            const savedInvoice = window.dataService.addInvoice(invoice);
            
            // Clear current invoice
            this.createNewInvoice();
            
            return savedInvoice;
        } catch (error) {
            console.error('Error generating invoice:', error);
            throw error;
        }
    }

    // Invoice Actions
    markAsUnpaid(invoiceId, dueDate = null) {
        try {
            return window.dataService.updateInvoiceStatus(invoiceId, 'unpaid');
        } catch (error) {
            console.error('Error marking invoice as unpaid:', error);
            throw error;
        }
    }

    markAsPaid(invoiceId) {
        try {
            return window.dataService.updateInvoiceStatus(invoiceId, 'paid');
        } catch (error) {
            console.error('Error marking invoice as paid:', error);
            throw error;
        }
    }

    processReturn(invoiceId, returnItems) {
        try {
            const invoices = window.dataService.getInvoices();
            const invoice = invoices.find(inv => inv.id === invoiceId);
            
            if (!invoice) {
                throw new Error('Invoice not found');
            }

            // Process each return item
            returnItems.forEach(returnItem => {
                const originalItem = invoice.items.find(item => item.id === returnItem.id);
                if (!originalItem) {
                    throw new Error(`Item ${returnItem.id} not found in original invoice`);
                }

                if (returnItem.quantity > originalItem.quantity) {
                    throw new Error(`Return quantity cannot exceed original quantity`);
                }

                // Add stock back to inventory
                window.dataService.updateStock(returnItem.id, returnItem.quantity, 'add');
            });

            // Create return invoice record
            const returnInvoice = {
                originalInvoiceId: invoiceId,
                type: 'return',
                items: returnItems,
                returnDate: new Date().toISOString(),
                returnAmount: returnItems.reduce((sum, item) => 
                    sum + (item.price * item.quantity), 0
                )
            };

            // You could save this as a separate return record if needed
            console.log('Return processed:', returnInvoice);
            
            return returnInvoice;
        } catch (error) {
            console.error('Error processing return:', error);
            throw error;
        }
    }

    // Invoice Formatting and Sharing
    generateInvoiceHTML(invoice) {
        const settings = window.dataService.getSettings();
        const customer = invoice.customerId ? 
            window.dataService.getCustomers().find(c => c.id === invoice.customerId) : null;

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Invoice ${invoice.invoiceNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .shop-info { text-align: center; margin-bottom: 20px; }
                    .invoice-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .customer-info { margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    .totals { text-align: right; }
                    .total-row { font-weight: bold; }
                    .footer { margin-top: 30px; text-align: center; font-size: 12px; }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    ${settings.logo ? `<img src="${settings.logo}" alt="Logo" style="max-height: 60px;">` : ''}
                    <h1>${settings.shopName || 'Local Shop'}</h1>
                </div>
                
                <div class="shop-info">
                    ${settings.address ? `<p>${settings.address}</p>` : ''}
                    ${settings.contact ? `<p>Phone: ${settings.contact}</p>` : ''}
                    ${settings.email ? `<p>Email: ${settings.email}</p>` : ''}
                    ${settings.gst ? `<p>GST No: ${settings.gst}</p>` : ''}
                </div>
                
                <div class="invoice-info">
                    <div>
                        <h3>INVOICE</h3>
                        <p><strong>Invoice No:</strong> ${invoice.invoiceNumber}</p>
                        <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <h4>Bill To:</h4>
                        <p><strong>${invoice.customerName}</strong></p>
                        ${customer?.mobile ? `<p>Phone: ${customer.mobile}</p>` : ''}
                        ${customer?.address ? `<p>${customer.address}</p>` : ''}
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Batch</th>
                            <th>Qty</th>
                            <th>Unit</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.batchNo || '-'}</td>
                                <td>${item.quantity}</td>
                                <td>${item.unit}</td>
                                <td>₹${item.price.toFixed(2)}</td>
                                <td>₹${item.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="totals">
                    <p>Subtotal: ₹${invoice.subtotal.toFixed(2)}</p>
                    ${invoice.discount > 0 ? `<p>Discount: -₹${invoice.discount.toFixed(2)}</p>` : ''}
                    <p>GST (${this.gstRate}%): ₹${invoice.gstAmount.toFixed(2)}</p>
                    <p class="total-row">Total: ₹${invoice.total.toFixed(2)}</p>
                </div>
                
                ${invoice.notes ? `<div><strong>Notes:</strong> ${invoice.notes}</div>` : ''}
                
                <div class="footer">
                    <p>Thank you for your business!</p>
                    ${settings.website ? `<p>Visit us: ${settings.website}</p>` : ''}
                </div>
                
                <div class="no-print" style="margin-top: 20px; text-align: center;">
                    <button onclick="window.print()">Print Invoice</button>
                    <button onclick="window.close()">Close</button>
                </div>
            </body>
            </html>
        `;
    }

    printInvoice(invoice) {
        const invoiceHTML = this.generateInvoiceHTML(invoice);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
        printWindow.focus();
    }

    generateWhatsAppMessage(invoice) {
        const settings = window.dataService.getSettings();
        const itemsList = invoice.items.map(item => 
            `${item.name} - ${item.quantity} ${item.unit} @ ₹${item.price} = ₹${item.total}`
        ).join('\n');

        return `*${settings.shopName || 'Invoice'}*
Invoice No: ${invoice.invoiceNumber}
Date: ${new Date(invoice.createdAt).toLocaleDateString()}

*Items:*
${itemsList}

*Total Details:*
Subtotal: ₹${invoice.subtotal.toFixed(2)}
${invoice.discount > 0 ? `Discount: -₹${invoice.discount.toFixed(2)}\n` : ''}GST (${this.gstRate}%): ₹${invoice.gstAmount.toFixed(2)}
*Total: ₹${invoice.total.toFixed(2)}*

Thank you for your business!
${settings.contact ? `Contact: ${settings.contact}` : ''}`;
    }

    shareViaWhatsApp(invoice, phoneNumber = '') {
        const message = this.generateWhatsAppMessage(invoice);
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = phoneNumber ? 
            `https://wa.me/${phoneNumber}?text=${encodedMessage}` :
            `https://wa.me/?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
    }

    // Invoice Search and Filtering
    searchInvoices(query, filters = {}) {
        let invoices = window.dataService.getInvoices();

        // Text search
        if (query) {
            const searchTerm = query.toLowerCase();
            invoices = invoices.filter(invoice => 
                invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
                invoice.customerName.toLowerCase().includes(searchTerm) ||
                invoice.items.some(item => item.name.toLowerCase().includes(searchTerm))
            );
        }

        // Date range filter
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            invoices = invoices.filter(invoice => 
                new Date(invoice.createdAt) >= startDate
            );
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999); // End of day
            invoices = invoices.filter(invoice => 
                new Date(invoice.createdAt) <= endDate
            );
        }

        // Payment status filter
        if (filters.paymentStatus) {
            invoices = invoices.filter(invoice => 
                invoice.paymentStatus === filters.paymentStatus
            );
        }

        // Customer filter
        if (filters.customerId) {
            invoices = invoices.filter(invoice => 
                invoice.customerId === filters.customerId
            );
        }

        return invoices;
    }

    // Quick Stats
    getTodaysStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaysInvoices = window.dataService.getInvoices().filter(invoice => {
            const invoiceDate = new Date(invoice.createdAt);
            return invoiceDate >= today && invoiceDate < tomorrow;
        });

        return {
            totalSales: todaysInvoices.reduce((sum, inv) => sum + inv.total, 0),
            totalInvoices: todaysInvoices.length,
            paidInvoices: todaysInvoices.filter(inv => inv.paymentStatus === 'paid').length,
            unpaidInvoices: todaysInvoices.filter(inv => inv.paymentStatus === 'unpaid').length,
            averageInvoiceValue: todaysInvoices.length > 0 ? 
                todaysInvoices.reduce((sum, inv) => sum + inv.total, 0) / todaysInvoices.length : 0
        };
    }

    getCurrentInvoice() {
        return this.currentInvoice;
    }

    clearCurrentInvoice() {
        this.createNewInvoice();
    }
}

// Initialize and make globally available
window.invoiceService = new InvoiceService();
