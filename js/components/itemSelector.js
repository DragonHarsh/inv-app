// Item Selector Component for Billing
class ItemSelector {
    constructor() {
        this.selectedItems = [];
        this.currentInvoice = window.invoiceService.getCurrentInvoice();
    }

    show() {
        const inventory = window.dataService.getInventory();
        const availableItems = inventory.filter(item => item.stock > 0);

        const modalContent = `
            <div class="item-selector">
                <div class="search-bar mb-4">
                    <input type="text" id="item-selector-search" placeholder="Search items..." class="w-full">
                </div>
                
                <div class="items-grid" style="max-height: 400px; overflow-y: auto;">
                    ${availableItems.map(item => `
                        <div class="item-card card mb-2" data-item-id="${item.id}">
                            <div class="flex justify-between items-center">
                                <div class="flex-1">
                                    <h4 class="font-bold">${item.name}</h4>
                                    <p class="text-sm text-secondary">${item.category} • Stock: ${item.stock} ${item.unit}</p>
                                    <p class="text-sm font-bold">₹${parseFloat(item.sellPrice).toFixed(2)}</p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <input type="number" 
                                           class="quantity-input w-16 text-center" 
                                           min="1" 
                                           max="${item.stock}" 
                                           value="1"
                                           data-item-id="${item.id}">
                                    <button class="btn btn-sm btn-primary add-item-btn" 
                                            data-item-id="${item.id}">
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="selected-items-summary mt-4 p-3 bg-secondary rounded">
                    <h4 class="font-bold mb-2">Selected Items: <span id="selected-count">0</span></h4>
                    <div id="selected-items-list"></div>
                </div>
            </div>
        `;

        window.app.showModal('Select Items for Invoice', modalContent, [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'window.itemSelector.close()' },
            { text: 'Add to Invoice', class: 'btn-primary', onclick: 'window.itemSelector.addToInvoice()' }
        ]);

        this.bindEvents();
    }

    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('item-selector-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterItems(e.target.value));
        }

        // Add item buttons
        document.querySelectorAll('.add-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.getAttribute('data-item-id');
                const quantityInput = document.querySelector(`input[data-item-id="${itemId}"]`);
                const quantity = parseInt(quantityInput.value) || 1;
                this.selectItem(itemId, quantity);
            });
        });
    }

    selectItem(itemId, quantity) {
        const inventory = window.dataService.getInventory();
        const item = inventory.find(i => i.id === itemId);
        
        if (!item) return;

        // Check if item already selected
        const existingIndex = this.selectedItems.findIndex(si => si.id === itemId);
        
        if (existingIndex >= 0) {
            // Update quantity
            this.selectedItems[existingIndex].quantity = quantity;
            this.selectedItems[existingIndex].total = item.sellPrice * quantity;
        } else {
            // Add new item
            this.selectedItems.push({
                id: item.id,
                name: item.name,
                price: item.sellPrice,
                quantity: quantity,
                unit: item.unit,
                total: item.sellPrice * quantity
            });
        }

        this.updateSelectedItemsDisplay();
        window.app.showToast(`${item.name} added to selection`, 'success');
    }

    updateSelectedItemsDisplay() {
        const countElement = document.getElementById('selected-count');
        const listElement = document.getElementById('selected-items-list');
        
        if (countElement) {
            countElement.textContent = this.selectedItems.length;
        }

        if (listElement) {
            listElement.innerHTML = this.selectedItems.map(item => `
                <div class="flex justify-between items-center py-1">
                    <span>${item.name} x ${item.quantity}</span>
                    <span class="font-bold">₹${item.total.toFixed(2)}</span>
                </div>
            `).join('');
        }
    }

    filterItems(searchTerm) {
        const itemCards = document.querySelectorAll('.item-card');
        const term = searchTerm.toLowerCase();

        itemCards.forEach(card => {
            const itemName = card.querySelector('h4').textContent.toLowerCase();
            const itemCategory = card.querySelector('.text-secondary').textContent.toLowerCase();
            
            if (itemName.includes(term) || itemCategory.includes(term)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    addToInvoice() {
        if (this.selectedItems.length === 0) {
            window.app.showToast('Please select at least one item', 'warning');
            return;
        }

        // Add items to invoice service
        this.selectedItems.forEach(item => {
            const inventoryItem = window.dataService.getInventory().find(i => i.id === item.id);
            if (inventoryItem) {
                window.invoiceService.addItem(inventoryItem, item.quantity);
            }
        });

        // Update billing view
        this.updateBillingView();
        this.close();
        window.app.showToast(`${this.selectedItems.length} items added to invoice`, 'success');
    }

    updateBillingView() {
        const currentInvoice = window.invoiceService.getCurrentInvoice();
        
        // Update invoice items display
        const invoiceItemsContainer = document.getElementById('invoice-items');
        if (invoiceItemsContainer) {
            if (currentInvoice.items.length === 0) {
                invoiceItemsContainer.innerHTML = '<p class="text-secondary text-sm">No items selected</p>';
            } else {
                invoiceItemsContainer.innerHTML = currentInvoice.items.map(item => `
                    <div class="invoice-item flex justify-between items-center p-2 border rounded mb-2">
                        <div class="flex-1">
                            <h5 class="font-medium">${item.name}</h5>
                            <p class="text-sm text-secondary">${item.quantity} ${item.unit} × ₹${item.price.toFixed(2)}</p>
                        </div>
                        <div class="text-right">
                            <p class="font-bold">₹${item.total.toFixed(2)}</p>
                            <button class="btn btn-sm btn-error" onclick="window.itemSelector.removeFromInvoice('${item.id}')">
                                Remove
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }

        // Update totals
        this.updateInvoiceTotals();
    }

    updateInvoiceTotals() {
        const currentInvoice = window.invoiceService.getCurrentInvoice();
        
        // Update subtotal
        const subtotalElement = document.getElementById('invoice-subtotal');
        if (subtotalElement) {
            subtotalElement.textContent = `₹${currentInvoice.subtotal.toFixed(2)}`;
        }

        // Update GST
        const gstElement = document.getElementById('invoice-gst');
        if (gstElement) {
            gstElement.textContent = `₹${currentInvoice.gstAmount.toFixed(2)}`;
        }

        // Update total
        const totalElement = document.getElementById('invoice-total');
        if (totalElement) {
            totalElement.textContent = `₹${currentInvoice.total.toFixed(2)}`;
        }
    }

    removeFromInvoice(itemId) {
        window.invoiceService.removeItem(itemId);
        this.updateBillingView();
        window.app.showToast('Item removed from invoice', 'info');
    }

    close() {
        this.selectedItems = [];
        window.app.closeModal();
    }
}

// Initialize and make globally available
window.itemSelector = new ItemSelector();
