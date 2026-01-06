import React, { useState, useEffect, useRef } from 'react';
import api, { cachedGet } from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import SelectInput from '../components/ui/SelectInput';
import NumberInput from '../components/ui/NumberInput';
import DataTable from '../components/ui/DataTable';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import PrintInvoice from '../components/PrintInvoice';
import useCurrencyConverter from '../hooks/useCurrencyConverter';
import toast from 'react-hot-toast';
import { exportToPDF } from '../utils/pdfExport';
import { FaFilePdf } from 'react-icons/fa';
import { InvoiceSkeleton } from '../components/ui/Skeleton';

interface ImportInvoice {
    id: number;
    supplier_id: number;
    supplier_name: string;
    invoice_no: string;
    type: string;
    price: number;
    total_amount: number;
    status: string;
    created_at: string;
}

interface Supplier {
    id: number;
    name: string;
}

interface Product {
    id: number;
    name: string;
}

interface ImportItem {
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

const Imports = () => {
    const [invoices, setInvoices] = useState<ImportInvoice[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<ImportInvoice | null>(null);
    const [invoiceItems, setInvoiceItems] = useState<ImportItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const { formatPKR } = useCurrencyConverter();
    const printRef = useRef<HTMLDivElement>(null);

    // Filter states
    const [filterSupplier, setFilterSupplier] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterType, setFilterType] = useState('');

    const [formData, setFormData] = useState({
        supplier_id: '',
        type: 'cash',
    });

    // New supplier inline form
    const [showNewSupplierForm, setShowNewSupplierForm] = useState(false);
    const [newSupplierData, setNewSupplierData] = useState({
        name: '',
        phone: '',
    });

    const [itemFormData, setItemFormData] = useState({
        product_id: '',
        quantity: 0,
        unit_price: 0,
    });

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/imports');
            setInvoices(res.data);
        } catch (err: any) {
            toast.error('Failed to load import invoices');
            console.error(err);
        } finally {
            setPageLoading(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const data = await cachedGet<Supplier[]>('/suppliers');
            setSuppliers(data);
        } catch (err: any) {
            toast.error('Failed to load suppliers');
            console.error(err);
        }
    };

    const fetchProducts = async () => {
        try {
            const data = await cachedGet<Product[]>('/products');
            setProducts(data);
        } catch (err: any) {
            toast.error('Failed to load products');
            console.error(err);
        }
    };

    const fetchInvoiceDetails = async (id: number) => {
        try {
            const res = await api.get(`/imports/${id}`);
            setSelectedInvoice(res.data.invoice);
            setInvoiceItems(res.data.items);
        } catch (err: any) {
            toast.error('Failed to load invoice details');
            console.error(err);
        }
    };

    useEffect(() => {
        fetchInvoices();
        fetchSuppliers();
        fetchProducts();
    }, []);

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // If adding new supplier inline
        if (showNewSupplierForm) {
            if (!newSupplierData.name.trim()) {
                toast.error('Please enter supplier name');
                return;
            }
            
            setLoading(true);
            try {
                // Create supplier first
                const supplierRes = await api.post('/suppliers', newSupplierData);
                const newSupplierId = supplierRes.data.id;
                
                // Then create invoice with new supplier
                const res = await api.post('/imports', { supplier_id: newSupplierId, type: formData.type });
                toast.success(`Supplier added & Import invoice #${res.data.invoice_no} created!`);
                setIsModalOpen(false);
                setFormData({ supplier_id: '', type: 'cash' });
                setNewSupplierData({ name: '', phone: '' });
                setShowNewSupplierForm(false);
                fetchSuppliers();
                fetchInvoices();
                fetchInvoiceDetails(res.data.id);
            } catch (err: any) {
                const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to create';
                toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to create invoice');
                console.error(err);
            } finally {
                setLoading(false);
            }
            return;
        }
        
        // Validation for existing supplier
        if (!formData.supplier_id) {
            toast.error('Please select a supplier');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/imports', formData);
            toast.success(`Import invoice #${res.data.invoice_no} created successfully!`);
            setIsModalOpen(false);
            setFormData({ supplier_id: '', type: 'cash' });
            fetchInvoices();
            fetchInvoiceDetails(res.data.id);
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to create invoice';
            toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to create invoice');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInvoice) return;
        
        // Validation
        if (!itemFormData.product_id) {
            toast.error('Please select a product');
            return;
        }
        if (itemFormData.quantity <= 0) {
            toast.error('Quantity must be greater than 0');
            return;
        }
        if (itemFormData.unit_price < 0) {
            toast.error('Unit price cannot be negative');
            return;
        }

        setLoading(true);
        try {
            await api.post(`/imports/${selectedInvoice.id}/items`, itemFormData);
            toast.success('Item added to invoice successfully!');
            setIsItemModalOpen(false);
            setItemFormData({ product_id: '', quantity: 0, unit_price: 0 });
            fetchInvoiceDetails(selectedInvoice.id);
            fetchInvoices();
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to add item';
            toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to add item');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFinalize = async () => {
        if (!selectedInvoice) return;
        setLoading(true);
        try {
            await api.post(`/imports/${selectedInvoice.id}/finalize`);
            toast.success(`Invoice #${selectedInvoice.invoice_no} finalized! Stock updated and supplier ledger affected.`);
            setIsConfirmOpen(false);
            fetchInvoiceDetails(selectedInvoice.id);
            fetchInvoices();
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to finalize invoice';
            toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to finalize invoice');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteItem = async (itemId: number) => {
        if (!selectedInvoice) return;
        try {
            await api.delete(`/imports/${selectedInvoice.id}/items/${itemId}`);
            toast.success('Item removed from invoice');
            fetchInvoiceDetails(selectedInvoice.id);
            fetchInvoices();
        } catch (err: any) {
            toast.error('Failed to remove item');
            console.error(err);
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
        const matchSupplier = !filterSupplier || invoice.supplier_id.toString() === filterSupplier;
        const matchDate = !filterDate || invoice.created_at.slice(0, 10) === filterDate;
        const matchType = !filterType || invoice.type === filterType;
        return matchSupplier && matchDate && matchType;
    });

    const clearFilters = () => {
        setFilterSupplier('');
        setFilterDate('');
        setFilterType('');
    };

    const handleExportPDF = () => {
        const exportData = filteredInvoices.map(inv => ({
            invoice_no: inv.invoice_no,
            supplier_name: inv.supplier_name,
            type: inv.type === 'cash' ? 'Cash' : 'Credit',
            price: inv.price,
            total_amount: inv.total_amount,
            status: inv.status,
            date: new Date(inv.created_at).toLocaleDateString('en-PK'),
        }));
        
        let subtitle = `Total ${exportData.length} invoices`;
        if (filterSupplier || filterDate || filterType) {
            const filters = [];
            if (filterSupplier) {
                const sup = suppliers.find(s => s.id.toString() === filterSupplier);
                if (sup) filters.push(`Supplier: ${sup.name}`);
            }
            if (filterDate) filters.push(`Date: ${filterDate}`);
            if (filterType) filters.push(`Type: ${filterType}`);
            subtitle = filters.join(' | ') + ` | ${exportData.length} invoices`;
        }

        exportToPDF({
            title: 'Import Invoices Report',
            columns: [
                { header: 'Invoice #', accessor: 'invoice_no' },
                { header: 'Supplier', accessor: 'supplier_name' },
                { header: 'Type', accessor: 'type' },
                { header: 'Total (PKR)', accessor: 'total_amount' },
                { header: 'Status', accessor: 'status' },
                { header: 'Date', accessor: 'date' },
            ],
            data: exportData,
            filename: 'Import_Invoices_Report',
            subtitle,
            orientation: 'landscape',
            showTotal: { column: 'total_amount', label: 'Grand Total' },
        });
        toast.success('PDF exported successfully!');
    };

    const columns = [
        { header: 'Invoice #', accessor: 'invoice_no' as keyof ImportInvoice },
        { header: 'Supplier', accessor: 'supplier_name' as keyof ImportInvoice },
        { header: 'Type', accessor: (item: ImportInvoice) => (
            <span className={`px-2 py-1 rounded text-xs font-medium ${item.type === 'cash' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {item.type === 'cash' ? 'Cash' : 'Credit'}
            </span>
        )},
        { header: 'Total', accessor: (item: ImportInvoice) => formatPKR(item.total_amount) },
        { header: 'Status', accessor: (item: ImportInvoice) => (
            <span className={`px-2 py-1 rounded text-xs ${item.status === 'finalized' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {item.status}
            </span>
        )},
    ];

    const itemColumns = [
        { header: 'Product', accessor: 'product_name' as keyof ImportItem },
        { header: 'Quantity', accessor: 'quantity' as keyof ImportItem },
        { header: 'Unit Price', accessor: 'unit_price' as keyof ImportItem },
        { header: 'Total', accessor: 'total_price' as keyof ImportItem },
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
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#242A2A' }}>Import Invoices</h1>
                        <p className="text-xs sm:text-sm mt-1" style={{ color: '#6B7280' }}>Manage purchase invoices from suppliers</p>
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
                            <label className="block text-xs font-medium mb-1" style={{ color: '#6B7280' }}>Supplier</label>
                            <select
                                value={filterSupplier}
                                onChange={(e) => setFilterSupplier(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border-2 text-sm focus:outline-none focus:ring-2"
                                style={{ borderColor: '#EBE0C0', backgroundColor: '#FAFAF5' }}
                            >
                                <option value="">All Suppliers</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
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
                        {(filterSupplier || filterDate || filterType) && (
                            <button
                                onClick={clearFilters}
                                className="px-3 py-2 text-sm rounded-lg hover:bg-gray-100 transition-colors"
                                style={{ color: '#6B7280' }}
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                    {(filterSupplier || filterDate || filterType) && (
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
                            <h2 className="text-lg sm:text-xl font-bold" style={{ color: '#242A2A' }}>Invoice #{selectedInvoice.invoice_no}</h2>
                            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${selectedInvoice.status === 'finalized' ? '' : ''}`}
                                style={{ 
                                    backgroundColor: selectedInvoice.status === 'finalized' ? '#D1FAE5' : '#FEF3C7', 
                                    color: selectedInvoice.status === 'finalized' ? '#065F46' : '#92400E' 
                                }}>
                                {selectedInvoice.status}
                            </span>
                        </div>
                        <div className="mb-4">
                            <p className="text-sm sm:text-base" style={{ color: '#6B7280' }}>Supplier: <span style={{ color: '#242A2A' }}>{selectedInvoice.supplier_name}</span></p>
                        </div>

                        {selectedInvoice.status === 'draft' && (
                            <Button onClick={() => setIsItemModalOpen(true)} className="mb-4" size="sm">Add Item</Button>
                        )}

                        <DataTable
                            columns={itemColumns}
                            data={invoiceItems}
                            onDelete={selectedInvoice.status === 'draft' ? (item) => handleDeleteItem(item.id) : undefined}
                        />

                        <div className="mt-4 text-right">
                            <p className="text-base sm:text-lg font-bold" style={{ color: '#242A2A' }}>Total: {formatPKR(selectedInvoice.total_amount)}</p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {selectedInvoice.status === 'draft' && invoiceItems.length > 0 && (
                                <Button onClick={() => setIsConfirmOpen(true)}>
                                    Finalize Invoice
                                </Button>
                            )}
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

            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setShowNewSupplierForm(false); setNewSupplierData({ name: '', phone: '' }); }} title="New Import Invoice">
                <form onSubmit={handleCreateInvoice}>
                    {/* Add New Supplier Toggle */}
                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={() => {
                                setShowNewSupplierForm(!showNewSupplierForm);
                                if (!showNewSupplierForm) {
                                    setFormData({ ...formData, supplier_id: '' });
                                }
                            }}
                            className="w-full px-4 py-2 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 transition-colors hover:bg-gray-50"
                            style={{ 
                                borderColor: showNewSupplierForm ? '#242A2A' : '#EBE0C0',
                                backgroundColor: showNewSupplierForm ? '#F5F5F0' : 'transparent',
                                color: '#242A2A'
                            }}
                        >
                            <span className="text-lg">+</span>
                            <span>{showNewSupplierForm ? 'Adding New Supplier' : 'Add New Supplier'}</span>
                        </button>
                    </div>

                    {showNewSupplierForm ? (
                        /* New Supplier Form */
                        <div className="space-y-3 p-4 rounded-lg border-2 mb-4" style={{ borderColor: '#EBE0C0', backgroundColor: '#FAFAF5' }}>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: '#242A2A' }}>
                                    Supplier Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newSupplierData.name}
                                    onChange={(e) => setNewSupplierData({ ...newSupplierData, name: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                                    style={{ borderColor: '#EBE0C0' }}
                                    placeholder="Enter supplier name"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" style={{ color: '#242A2A' }}>
                                    Phone <span className="text-gray-400 text-xs">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={newSupplierData.phone}
                                    onChange={(e) => setNewSupplierData({ ...newSupplierData, phone: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                                    style={{ borderColor: '#EBE0C0' }}
                                    placeholder="Enter phone number"
                                />
                            </div>
                        </div>
                    ) : (
                        /* Existing Supplier Dropdown */
                        <SelectInput
                            label="Supplier"
                            options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                            value={formData.supplier_id}
                            onChange={(v) => setFormData({ ...formData, supplier_id: v })}
                        />
                    )}

                    <SelectInput
                        label="Payment Type"
                        options={[
                            { value: 'cash', label: 'Cash' },
                            { value: 'credit', label: 'Credit (Udhar)' },
                        ]}
                        value={formData.type}
                        onChange={(v) => setFormData({ ...formData, type: v })}
                    />
                    <p className="text-xs text-gray-500 mb-3">Invoice number will be auto-generated. Total will be calculated from items.</p>
                    <div className="flex justify-end space-x-3 mt-4">
                        <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); setShowNewSupplierForm(false); setNewSupplierData({ name: '', phone: '' }); }}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title="Add Item">
                <form onSubmit={handleAddItem}>
                    <SelectInput
                        label="Product"
                        options={products.map(p => ({ value: p.id, label: p.name }))}
                        value={itemFormData.product_id}
                        onChange={(v) => setItemFormData({ ...itemFormData, product_id: v })}
                    />
                    <NumberInput
                        label="Quantity"
                        value={itemFormData.quantity}
                        onChange={(v) => setItemFormData({ ...itemFormData, quantity: Math.floor(v) })}
                        min={1}
                        step={1}
                    />
                    <NumberInput
                        label="Unit Price (PKR)"
                        value={itemFormData.unit_price}
                        onChange={(v) => setItemFormData({ ...itemFormData, unit_price: Math.floor(v) })}
                        min={0}
                        step={1}
                    />
                    <div className="flex justify-end space-x-3 mt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsItemModalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add'}</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleFinalize}
                title="Finalize Invoice"
                message="Are you sure you want to finalize this invoice? This action cannot be undone. Stock will be updated and supplier ledger will be affected."
                confirmText="Finalize"
                variant="warning"
            />

            {/* Print Modal */}
            {isPrintModalOpen && selectedInvoice && (
                <div className="fixed inset-0 z-50 bg-white">
                    <div className="no-print p-4 bg-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold">Print Preview</h2>
                        <div className="flex gap-2">
                            <Button onClick={() => window.print()}>
                                Print
                            </Button>
                            <Button variant="secondary" onClick={() => setIsPrintModalOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                    <div className="print-container flex justify-center p-4 bg-gray-200 min-h-screen">
                        <PrintInvoice
                            ref={printRef}
                            invoice={selectedInvoice}
                            items={invoiceItems}
                            invoiceType="import"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Imports;
