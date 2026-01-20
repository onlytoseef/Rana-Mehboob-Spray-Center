import { useState, useEffect, useRef } from 'react';
import api, { cachedGet } from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import DataTable from '../components/ui/DataTable';
import PrintInvoice from '../components/PrintInvoice';
import useCurrencyConverter from '../hooks/useCurrencyConverter';
import toast from 'react-hot-toast';
import { exportToPDF } from '../utils/pdfExport';
import { FaFilePdf, FaPlus, FaTrash } from 'react-icons/fa';
import { InvoiceSkeleton } from '../components/ui/Skeleton';

interface SalesInvoice {
    id: number;
    invoice_no?: string;
    customer_id: number;
    customer_name: string;
    type: string;
    total_amount: number;
    discount_percent: number;
    discount_amount: number;
    status: string;
    created_at: string;
}

interface Customer {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
    current_stock: number;
}

interface Batch {
    batch_id: number;
    batch_number: string;
    expiry_date: string | null;
    quantity: number;
}

interface SalesItem {
    id: number;
    product_id: number;
    product_name: string;
    batch_id: number | null;
    batch_number: string | null;
    expiry_date: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    current_stock: number;
}

// For the new invoice modal
interface TempItem {
    product_id: string;
    product_name: string;
    batch_id: number | null;
    batch_number: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    current_stock: number;
}

const Sales = () => {
    const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
    const [invoiceItems, setInvoiceItems] = useState<SalesItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const { formatPKR } = useCurrencyConverter();
    const printRef = useRef<HTMLDivElement>(null);

    // Filter states
    const [filterCustomer, setFilterCustomer] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterType, setFilterType] = useState('');

    // New Invoice Modal States
    const [customerId, setCustomerId] = useState('');
    const [invoiceType, setInvoiceType] = useState('cash');
    const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [tempItems, setTempItems] = useState<TempItem[]>([]);
    const [discountPercent, setDiscountPercent] = useState(0);

    // Add Item Row States
    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [availableBatches, setAvailableBatches] = useState<Batch[]>([]);
    const [itemQuantity, setItemQuantity] = useState(1);
    const [itemPrice, setItemPrice] = useState(0);

    // Fetch batches when product is selected
    const fetchBatchesForProduct = async (productId: string) => {
        if (!productId) {
            setAvailableBatches([]);
            setSelectedBatchId('');
            return;
        }
        try {
            const res = await api.get(`/batches/product/${productId}`);
            setAvailableBatches(res.data);
            setSelectedBatchId('');
        } catch (err: any) {
            console.error('Failed to fetch batches:', err);
            setAvailableBatches([]);
        }
    };

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/sales');
            setInvoices(res.data);
        } catch (err: any) {
            toast.error('Failed to load sales invoices');
            console.error(err);
        } finally {
            setPageLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const data = await cachedGet<Customer[]>('/customers');
            setCustomers(data);
        } catch (err: any) {
            toast.error('Failed to load customers');
            console.error(err);
        }
    };

    const fetchProducts = async (forceRefresh = false) => {
        try {
            if (forceRefresh) {
                // Force fresh data from API, bypass cache
                const res = await api.get<Product[]>('/products');
                setProducts(res.data);
            } else {
                const data = await cachedGet<Product[]>('/products');
                setProducts(data);
            }
        } catch (err: any) {
            toast.error('Failed to load products');
            console.error(err);
        }
    };

    const fetchInvoiceDetails = async (id: number) => {
        try {
            const res = await api.get(`/sales/${id}`);
            setSelectedInvoice(res.data.invoice);
            setInvoiceItems(res.data.items);
        } catch (err: any) {
            toast.error('Failed to load invoice details');
            console.error(err);
        }
    };

    useEffect(() => {
        fetchInvoices();
        fetchCustomers();
        fetchProducts();
    }, []);

    // Calculate totals for the modal
    const subtotal = tempItems.reduce((sum, item) => sum + item.total_price, 0);
    const discountAmount = Math.round((subtotal * discountPercent) / 100);
    const grandTotal = subtotal - discountAmount;

    // Add item to temp list
    const handleAddItemToList = () => {
        if (!selectedProductId) {
            toast.error('Please select a product');
            return;
        }
        if (!selectedBatchId) {
            toast.error('Please select a batch');
            return;
        }
        if (itemQuantity <= 0) {
            toast.error('Quantity must be greater than 0');
            return;
        }
        if (itemPrice <= 0) {
            toast.error('Price must be greater than 0');
            return;
        }

        const product = products.find(p => p.id === Number(selectedProductId));
        if (!product) return;

        const batch = availableBatches.find(b => b.batch_id === Number(selectedBatchId));
        if (!batch) return;

        // Check if same product+batch already in list
        const existingIndex = tempItems.findIndex(
            item => item.product_id === selectedProductId && item.batch_id === Number(selectedBatchId)
        );
        if (existingIndex !== -1) {
            toast.error('This product with same batch already added. Remove it first to change.');
            return;
        }

        // Check batch stock
        if (itemQuantity > batch.quantity) {
            toast.error(`Insufficient batch stock! Available in this batch: ${batch.quantity}`);
            return;
        }

        const newItem: TempItem = {
            product_id: selectedProductId,
            product_name: product.name,
            batch_id: Number(selectedBatchId),
            batch_number: batch.batch_number,
            quantity: itemQuantity,
            unit_price: itemPrice,
            total_price: itemQuantity * itemPrice,
            current_stock: batch.quantity,
        };

        setTempItems([...tempItems, newItem]);
        setSelectedProductId('');
        setSelectedBatchId('');
        setAvailableBatches([]);
        setItemQuantity(1);
        setItemPrice(0);
        toast.success('Item added');
    };

    // Remove item from temp list
    const handleRemoveItemFromList = (productId: string, batchId: number | null) => {
        setTempItems(tempItems.filter(item => !(item.product_id === productId && item.batch_id === batchId)));
    };

    // Reset modal
    const resetModal = () => {
        setCustomerId('');
        setInvoiceType('cash');
        setShowNewCustomerForm(false);
        setNewCustomerName('');
        setNewCustomerPhone('');
        setTempItems([]);
        setDiscountPercent(0);
        setSelectedProductId('');
        setSelectedBatchId('');
        setAvailableBatches([]);
        setItemQuantity(1);
        setItemPrice(0);
    };

    // Create and finalize invoice
    const handleCreateInvoice = async () => {
        // Validation
        if (!showNewCustomerForm && !customerId) {
            toast.error('Please select a customer');
            return;
        }
        if (showNewCustomerForm && !newCustomerName.trim()) {
            toast.error('Please enter customer name');
            return;
        }
        if (tempItems.length === 0) {
            toast.error('Please add at least one item');
            return;
        }

        setLoading(true);
        try {
            let finalCustomerId = customerId;

            // Create new customer if needed
            if (showNewCustomerForm) {
                const customerRes = await api.post('/customers', {
                    name: newCustomerName,
                    phone: newCustomerPhone,
                });
                finalCustomerId = customerRes.data.id;
                fetchCustomers();
            }

            // Create invoice with items and discount
            const res = await api.post('/sales/create-complete', {
                customer_id: finalCustomerId,
                type: invoiceType,
                items: tempItems.map(item => ({
                    product_id: item.product_id,
                    batch_id: item.batch_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                })),
                discount_percent: discountPercent,
            });

            toast.success('Invoice created and finalized!');
            setIsModalOpen(false);
            resetModal();
            fetchInvoices();
            fetchProducts(true); // Force refresh to get updated stock
            fetchInvoiceDetails(res.data.id);
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to create invoice';
            toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to create invoice');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        if (!selectedInvoice) return;
        setIsPrintModalOpen(true);
        setTimeout(() => {
            window.print();
        }, 300);
    };

    // Filter invoices
    const filteredInvoices = invoices.filter(invoice => {
        const matchCustomer = !filterCustomer || invoice.customer_id.toString() === filterCustomer;
        const matchDate = !filterDate || invoice.created_at.slice(0, 10) === filterDate;
        const matchType = !filterType || invoice.type === filterType;
        return matchCustomer && matchDate && matchType;
    });

    const clearFilters = () => {
        setFilterCustomer('');
        setFilterDate('');
        setFilterType('');
    };

    const handleExportPDF = () => {
        const exportData = filteredInvoices.map(inv => ({
            id: inv.id,
            customer_name: inv.customer_name,
            type: inv.type === 'cash' ? 'Cash' : 'Credit',
            total_amount: inv.total_amount,
            status: inv.status,
            date: new Date(inv.created_at).toLocaleDateString('en-PK'),
        }));
        
        let subtitle = `Total ${exportData.length} invoices`;
        if (filterCustomer || filterDate || filterType) {
            const filters = [];
            if (filterCustomer) {
                const cust = customers.find(c => c.id.toString() === filterCustomer);
                if (cust) filters.push(`Customer: ${cust.name}`);
            }
            if (filterDate) filters.push(`Date: ${filterDate}`);
            if (filterType) filters.push(`Type: ${filterType}`);
            subtitle = filters.join(' | ') + ` | ${exportData.length} invoices`;
        }

        exportToPDF({
            title: 'Sales Invoices Report',
            columns: [
                { header: 'Invoice ID', accessor: 'id' },
                { header: 'Customer', accessor: 'customer_name' },
                { header: 'Type', accessor: 'type' },
                { header: 'Total (PKR)', accessor: 'total_amount' },
                { header: 'Status', accessor: 'status' },
                { header: 'Date', accessor: 'date' },
            ],
            data: exportData,
            filename: 'Sales_Invoices_Report',
            subtitle,
            orientation: 'landscape',
            showTotal: { column: 'total_amount', label: 'Grand Total' },
        });
        toast.success('PDF exported successfully!');
    };

    const columns = [
        { header: 'Invoice #', accessor: (item: SalesInvoice) => `INV-${String(item.id).padStart(5, '0')}` },
        { header: 'Customer', accessor: 'customer_name' as keyof SalesInvoice },
        { header: 'Type', accessor: (item: SalesInvoice) => (
            <span className={`px-2 py-1 rounded text-xs font-medium ${item.type === 'cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {item.type === 'cash' ? 'Cash' : 'Credit'}
            </span>
        )},
        { header: 'Total', accessor: (item: SalesInvoice) => formatPKR(item.total_amount) },
        { header: 'Status', accessor: (item: SalesInvoice) => (
            <span className={`px-2 py-1 rounded text-xs font-medium ${item.status === 'finalized' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {item.status}
            </span>
        )},
    ];

    const itemColumns = [
        { header: 'Product', accessor: 'product_name' as keyof SalesItem },
        { header: 'Batch', accessor: (item: SalesItem) => item.batch_number || '-' },
        { header: 'Expiry', accessor: (item: SalesItem) => item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '-' },
        { header: 'Quantity', accessor: 'quantity' as keyof SalesItem },
        { header: 'Unit Price', accessor: (item: SalesItem) => formatPKR(item.unit_price) },
        { header: 'Total', accessor: (item: SalesItem) => formatPKR(item.total_price) },
    ];

    if (pageLoading) {
        return <InvoiceSkeleton />;
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Invoice List Section */}
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#242A2A' }}>Sales Invoices</h1>
                        <p className="text-xs sm:text-sm mt-1" style={{ color: '#6B7280' }}>Manage sales and customer orders</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={handleExportPDF}>
                            <FaFilePdf className="inline mr-1" /> Export PDF
                        </Button>
                        <Button onClick={() => setIsModalOpen(true)}>New Invoice</Button>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="mb-4 p-4 rounded-xl border-2" style={{ backgroundColor: '#FFFFFF', borderColor: '#EBE0C0' }}>
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Customer</label>
                            <select
                                value={filterCustomer}
                                onChange={(e) => setFilterCustomer(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border-2 text-sm focus:outline-none focus:ring-2"
                                style={{ borderColor: '#EBE0C0', backgroundColor: '#FAFAF5' }}
                            >
                                <option value="">All Customers</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Date</label>
                            <input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border-2 text-sm focus:outline-none focus:ring-2"
                                style={{ borderColor: '#EBE0C0', backgroundColor: '#FAFAF5' }}
                            />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Type</label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border-2 text-sm focus:outline-none focus:ring-2"
                                style={{ borderColor: '#EBE0C0', backgroundColor: '#FAFAF5' }}
                            >
                                <option value="">All Types</option>
                                <option value="cash">Cash</option>
                                <option value="credit">Credit</option>
                            </select>
                        </div>
                        {(filterCustomer || filterDate || filterType) && (
                            <button
                                onClick={clearFilters}
                                className="px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                                style={{ color: '#6B7280' }}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                    {(filterCustomer || filterDate || filterType) && (
                        <p className="mt-2 text-xs" style={{ color: '#6B7280' }}>
                            Showing {filteredInvoices.length} of {invoices.length} invoices
                        </p>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    data={filteredInvoices}
                    onEdit={(invoice) => fetchInvoiceDetails(invoice.id)}
                />
            </div>

            {/* Invoice Details Section */}
            <div>
                {selectedInvoice ? (
                    <div className="rounded-xl shadow-md p-4 sm:p-6 border-2" style={{ backgroundColor: '#FFFFFF', borderColor: '#EBE0C0' }}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4">
                            <h2 className="text-lg sm:text-xl font-bold" style={{ color: '#242A2A' }}>Invoice #INV-{String(selectedInvoice.id).padStart(5, '0')}</h2>
                            <span className="px-3 py-1 rounded-lg text-sm font-medium"
                                style={{ 
                                    backgroundColor: selectedInvoice.status === 'finalized' ? '#D1FAE5' : '#FEF3C7', 
                                    color: selectedInvoice.status === 'finalized' ? '#065F46' : '#92400E' 
                                }}>
                                {selectedInvoice.status}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                            <p className="text-sm sm:text-base" style={{ color: '#6B7280' }}>Customer: <span style={{ color: '#242A2A' }}>{selectedInvoice.customer_name}</span></p>
                            <p className="text-sm sm:text-base" style={{ color: '#6B7280' }}>
                                Type: <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${selectedInvoice.type === 'cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {selectedInvoice.type === 'cash' ? 'Cash' : 'Credit'}
                                </span>
                            </p>
                        </div>

                        <DataTable
                            columns={itemColumns}
                            data={invoiceItems}
                        />

                        <div className="mt-4 text-right space-y-1">
                            {selectedInvoice.discount_percent > 0 && (
                                <>
                                    <p className="text-sm" style={{ color: '#6B7280' }}>
                                        Subtotal: {formatPKR(selectedInvoice.total_amount + (selectedInvoice.discount_amount || 0))}
                                    </p>
                                    <p className="text-sm text-red-600">
                                        Discount ({selectedInvoice.discount_percent}%): -{formatPKR(selectedInvoice.discount_amount || 0)}
                                    </p>
                                </>
                            )}
                            <p className="text-base sm:text-lg font-bold" style={{ color: '#242A2A' }}>Total: {formatPKR(selectedInvoice.total_amount)}</p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {selectedInvoice.status === 'finalized' && (
                                <Button 
                                    onClick={handlePrint}
                                    className="flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                    Print Invoice
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl shadow-md p-4 sm:p-6 text-center border-2" style={{ backgroundColor: '#FFFFFF', borderColor: '#EBE0C0', color: '#6B7280' }}>
                        Select an invoice to view details
                    </div>
                )}
            </div>

            {/* New Invoice Modal - All in One */}
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetModal(); }} title="Create Sales Invoice" size="lg">
                <div className="space-y-4">
                    {/* Customer Section */}
                    <div className="p-4 rounded-lg border-2" style={{ borderColor: '#EBE0C0', backgroundColor: '#FAFAF5' }}>
                        <h3 className="font-medium mb-3" style={{ color: '#242A2A' }}>Customer Details</h3>
                        
                        <button
                            type="button"
                            onClick={() => {
                                setShowNewCustomerForm(!showNewCustomerForm);
                                if (!showNewCustomerForm) setCustomerId('');
                            }}
                            className="w-full mb-3 px-4 py-2 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 transition-colors hover:bg-white"
                            style={{ 
                                borderColor: showNewCustomerForm ? '#242A2A' : '#D1D5DB',
                                backgroundColor: showNewCustomerForm ? '#fff' : 'transparent',
                            }}
                        >
                            <FaPlus size={12} />
                            <span>{showNewCustomerForm ? 'Adding New Customer' : 'Add New Customer'}</span>
                        </button>

                        {showNewCustomerForm ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1">Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={newCustomerName}
                                        onChange={(e) => setNewCustomerName(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none"
                                        style={{ borderColor: '#D1D5DB' }}
                                        placeholder="Customer name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1">Phone <span className="text-gray-400">(optional)</span></label>
                                    <input
                                        type="text"
                                        value={newCustomerPhone}
                                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none"
                                        style={{ borderColor: '#D1D5DB' }}
                                        placeholder="Phone number"
                                    />
                                </div>
                            </div>
                        ) : (
                            <select
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none"
                                style={{ borderColor: '#D1D5DB' }}
                            >
                                <option value="">Select Customer</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        )}

                        <div className="mt-3">
                            <label className="block text-xs font-medium mb-1">Payment Type</label>
                            <select
                                value={invoiceType}
                                onChange={(e) => setInvoiceType(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none"
                                style={{ borderColor: '#D1D5DB' }}
                            >
                                <option value="cash">Cash</option>
                                <option value="credit">Credit (Udhar)</option>
                            </select>
                        </div>
                    </div>

                    {/* Add Items Section */}
                    <div className="p-4 rounded-lg border-2" style={{ borderColor: '#EBE0C0', backgroundColor: '#FAFAF5' }}>
                        <h3 className="font-medium mb-3" style={{ color: '#242A2A' }}>Add Items</h3>
                        
                        <div className="space-y-3">
                            <div className="grid grid-cols-12 gap-2 items-end">
                                <div className="col-span-12 sm:col-span-6">
                                    <label className="block text-xs font-medium mb-1">Product</label>
                                    <select
                                        value={selectedProductId}
                                        onChange={(e) => {
                                            setSelectedProductId(e.target.value);
                                            fetchBatchesForProduct(e.target.value);
                                        }}
                                        className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none text-sm"
                                        style={{ borderColor: '#D1D5DB' }}
                                    >
                                        <option value="">Select Product</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id} disabled={p.current_stock === 0}>
                                                {p.name} (Stock: {p.current_stock})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-12 sm:col-span-6">
                                    <label className="block text-xs font-medium mb-1">Batch</label>
                                    <select
                                        value={selectedBatchId}
                                        onChange={(e) => setSelectedBatchId(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none text-sm"
                                        style={{ borderColor: '#D1D5DB' }}
                                        disabled={!selectedProductId || availableBatches.length === 0}
                                    >
                                        <option value="">
                                            {!selectedProductId ? 'Select product first' : 
                                             availableBatches.length === 0 ? 'No batches available' : 'Select Batch'}
                                        </option>
                                        {availableBatches.map(b => (
                                            <option key={b.batch_id} value={b.batch_id} disabled={b.quantity === 0}>
                                                {b.batch_number} (Stock: {b.quantity}) {b.expiry_date ? `- Exp: ${new Date(b.expiry_date).toLocaleDateString()}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-12 gap-2 items-end">
                                <div className="col-span-4 sm:col-span-3">
                                    <label className="block text-xs font-medium mb-1">Qty</label>
                                    <input
                                        type="number"
                                        value={itemQuantity}
                                        onChange={(e) => setItemQuantity(Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none text-sm"
                                        style={{ borderColor: '#D1D5DB' }}
                                        min={1}
                                    />
                                </div>
                                <div className="col-span-4 sm:col-span-4">
                                    <label className="block text-xs font-medium mb-1">Price</label>
                                    <input
                                        type="number"
                                        value={itemPrice}
                                        onChange={(e) => setItemPrice(Number(e.target.value))}
                                        className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none text-sm"
                                        style={{ borderColor: '#D1D5DB' }}
                                        min={0}
                                    />
                                </div>
                                <div className="col-span-4 sm:col-span-5">
                                    <Button type="button" onClick={handleAddItemToList} size="sm" className="w-full">
                                        <FaPlus className="mr-1" /> Add Item
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Items List */}
                        {tempItems.length > 0 && (
                            <div className="mt-4">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b" style={{ borderColor: '#EBE0C0' }}>
                                            <th className="text-left py-2">Product</th>
                                            <th className="text-left py-2">Batch</th>
                                            <th className="text-center py-2">Qty</th>
                                            <th className="text-right py-2">Price</th>
                                            <th className="text-right py-2">Total</th>
                                            <th className="w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tempItems.map((item) => (
                                            <tr key={`${item.product_id}-${item.batch_id}`} className="border-b" style={{ borderColor: '#EBE0C0' }}>
                                                <td className="py-2">{item.product_name}</td>
                                                <td className="py-2 text-xs text-gray-600">{item.batch_number}</td>
                                                <td className="text-center py-2">{item.quantity}</td>
                                                <td className="text-right py-2">{formatPKR(item.unit_price)}</td>
                                                <td className="text-right py-2 font-medium">{formatPKR(item.total_price)}</td>
                                                <td className="py-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItemFromList(item.product_id, item.batch_id)}
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                    >
                                                        <FaTrash size={12} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Totals Section */}
                    {tempItems.length > 0 && (
                        <div className="p-4 rounded-lg border-2" style={{ borderColor: '#242A2A', backgroundColor: '#fff' }}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm" style={{ color: '#6B7280' }}>Subtotal:</span>
                                <span className="font-medium">{formatPKR(subtotal)}</span>
                            </div>
                            
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm" style={{ color: '#6B7280' }}>Discount:</span>
                                    <input
                                        type="number"
                                        value={discountPercent}
                                        onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value))))}
                                        className="w-16 px-2 py-1 rounded border text-sm text-center"
                                        style={{ borderColor: '#D1D5DB' }}
                                        min={0}
                                        max={100}
                                    />
                                    <span className="text-sm">%</span>
                                </div>
                                <span className="text-red-600">-{formatPKR(discountAmount)}</span>
                            </div>
                            
                            <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: '#EBE0C0' }}>
                                <span className="font-bold text-lg" style={{ color: '#242A2A' }}>Grand Total:</span>
                                <span className="font-bold text-lg" style={{ color: '#242A2A' }}>{formatPKR(grandTotal)}</span>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => { setIsModalOpen(false); resetModal(); }}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateInvoice} disabled={loading || tempItems.length === 0}>
                            {loading ? 'Creating...' : 'Create & Finalize Invoice'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Print Modal */}
            {isPrintModalOpen && selectedInvoice && (
                <div className="fixed inset-0 z-50 bg-white">
                    <div className="no-print p-4 bg-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold">Print Preview</h2>
                        <div className="flex gap-2">
                            <Button onClick={() => window.print()}>Print</Button>
                            <Button variant="secondary" onClick={() => setIsPrintModalOpen(false)}>Close</Button>
                        </div>
                    </div>
                    <div className="print-container flex justify-center p-4 bg-gray-200 min-h-screen">
                        <PrintInvoice
                            ref={printRef}
                            invoice={{
                                ...selectedInvoice,
                                invoice_no: selectedInvoice.invoice_no || `INV-${selectedInvoice.id.toString().padStart(5, '0')}`
                            }}
                            items={invoiceItems}
                            invoiceType="sales"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;
