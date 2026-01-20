import { useState, useEffect } from 'react';
import api from '../services/api';
import Button from '../components/ui/Button';
import DataTable from '../components/ui/DataTable';
import SelectInput from '../components/ui/SelectInput';
import Input from '../components/ui/Input';
import DatePicker from '../components/ui/DatePicker';
import toast from 'react-hot-toast';
import useCurrencyConverter from '../hooks/useCurrencyConverter';
import { FaPlus, FaUndo, FaUser, FaTruck, FaFileInvoice, FaBoxOpen, FaTimes, FaFilter, FaEye } from 'react-icons/fa';

interface Return {
    id: number;
    return_no: string;
    return_type: 'customer' | 'supplier';
    invoice_id: number;
    party_id: number;
    party_name: string;
    original_invoice_no: string;
    total_amount: number;
    reason: string;
    refund_type: string;
    notes: string;
    status: string;
    created_at: string;
}

interface Customer {
    id: number;
    name: string;
}

interface Supplier {
    id: number;
    name: string;
}

interface Invoice {
    id: number;
    invoice_no: string;
    customer_name?: string;
    supplier_name?: string;
    total_amount: number;
    created_at: string;
    type?: string;
}

interface InvoiceItem {
    id: number;
    product_id: number;
    product_name: string;
    batch_id: number | null;
    batch_number: string | null;
    expiry_date: string | null;
    sold_quantity?: number;
    purchased_quantity?: number;
    unit_price: number;
    already_returned: number;
    returnable_quantity: number;
}

interface ReturnItem {
    product_id: number;
    product_name: string;
    batch_id: number | null;
    batch_number: string | null;
    quantity: number;
    max_quantity: number;
    unit_price: number;
}

const RETURN_REASONS = [
    { value: 'defective', label: 'Defective / Faulty Item' },
    { value: 'wrong_item', label: 'Wrong Item Delivered' },
    { value: 'changed_mind', label: 'Customer Changed Mind' },
    { value: 'damaged', label: 'Damaged in Transit' },
    { value: 'quality', label: 'Quality Not Satisfactory' },
    { value: 'other', label: 'Other' },
];

const REFUND_TYPES = [
    { value: 'credit', label: 'Credit Note (Adjust in Balance)' },
    { value: 'cash', label: 'Cash Refund' },
    { value: 'exchange', label: 'Exchange (Manual Adjustment)' },
];

const Returns = () => {
    // List State
    const [returns, setReturns] = useState<Return[]>([]);
    const [filterType, setFilterType] = useState('all');
    const [pageLoading, setPageLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewReturn, setViewReturn] = useState<Return | null>(null);
    const [viewItems, setViewItems] = useState<any[]>([]);

    // Form State - Step by Step
    const [step, setStep] = useState(1);
    const [returnType, setReturnType] = useState<'customer' | 'supplier' | ''>('');
    
    // Party Selection
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedPartyId, setSelectedPartyId] = useState('');
    
    // Date Filter
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    
    // Invoice Selection
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [invoicePage, setInvoicePage] = useState(1);
    const invoicesPerPage = 10;
    
    // Return Items
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
    const [reason, setReason] = useState('defective');
    const [refundType, setRefundType] = useState('credit');
    const [notes, setNotes] = useState('');
    
    const [loading, setLoading] = useState(false);
    const { formatPKR } = useCurrencyConverter();

    // Fetch all returns
    const fetchReturns = async () => {
        try {
            const endpoint = filterType === 'all' ? '/returns' : `/returns?return_type=${filterType}`;
            const res = await api.get(endpoint);
            setReturns(res.data);
        } catch (err: any) {
            toast.error('Failed to load returns');
            console.error(err);
        } finally {
            setPageLoading(false);
        }
    };

    // Fetch customers and suppliers
    const fetchPartiesData = async () => {
        try {
            const [custRes, suppRes] = await Promise.all([
                api.get('/customers'),
                api.get('/suppliers')
            ]);
            setCustomers(custRes.data);
            setSuppliers(suppRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchReturns();
        fetchPartiesData();
    }, []);

    useEffect(() => {
        fetchReturns();
    }, [filterType]);

    // Fetch invoices when party is selected
    const fetchInvoices = async () => {
        if (!returnType || !selectedPartyId) return;
        
        setLoadingInvoices(true);
        setInvoicePage(1); // Reset to first page
        try {
            let endpoint = returnType === 'customer' 
                ? `/returns/invoices/customer/${selectedPartyId}`
                : `/returns/invoices/supplier/${selectedPartyId}`;
            
            const params = new URLSearchParams();
            if (fromDate) params.append('from_date', fromDate);
            if (toDate) params.append('to_date', toDate);
            
            if (params.toString()) {
                endpoint += `?${params.toString()}`;
            }
            
            const res = await api.get(endpoint);
            setInvoices(res.data);
        } catch (err: any) {
            toast.error('Failed to load invoices');
            console.error(err);
        } finally {
            setLoadingInvoices(false);
        }
    };

    useEffect(() => {
        if (selectedPartyId) {
            fetchInvoices();
        }
    }, [selectedPartyId, fromDate, toDate]);

    // Fetch invoice items when invoice is selected
    const fetchInvoiceItems = async (invoiceId: string) => {
        try {
            const endpoint = returnType === 'customer'
                ? `/returns/invoice/customer/${invoiceId}`
                : `/returns/invoice/supplier/${invoiceId}`;
            
            const res = await api.get(endpoint);
            setSelectedInvoice(res.data.invoice);
            setInvoiceItems(res.data.items.filter((item: InvoiceItem) => item.returnable_quantity > 0));
            setReturnItems([]);
        } catch (err: any) {
            toast.error('Failed to load invoice items');
            console.error(err);
        }
    };

    useEffect(() => {
        if (selectedInvoiceId) {
            fetchInvoiceItems(selectedInvoiceId);
        }
    }, [selectedInvoiceId]);

    // Handle quantity change for return item
    const handleQuantityChange = (productId: number, batchId: number | null, quantity: number, item: InvoiceItem) => {
        const maxQty = item.returnable_quantity;
        const validQty = Math.min(Math.max(0, quantity), maxQty);
        
        setReturnItems(prev => {
            const existing = prev.find(i => i.product_id === productId && i.batch_id === batchId);
            if (validQty === 0) {
                return prev.filter(i => !(i.product_id === productId && i.batch_id === batchId));
            }
            if (existing) {
                return prev.map(i => (i.product_id === productId && i.batch_id === batchId) ? { ...i, quantity: validQty } : i);
            }
            return [...prev, {
                product_id: productId,
                product_name: item.product_name,
                batch_id: batchId,
                batch_number: item.batch_number,
                quantity: validQty,
                max_quantity: maxQty,
                unit_price: parseFloat(item.unit_price.toString())
            }];
        });
    };

    // Calculate total return amount
    const totalReturnAmount = returnItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    // Reset form
    const resetForm = () => {
        setStep(1);
        setReturnType('');
        setSelectedPartyId('');
        setFromDate('');
        setToDate('');
        setInvoices([]);
        setSelectedInvoiceId('');
        setSelectedInvoice(null);
        setInvoiceItems([]);
        setReturnItems([]);
        setReason('defective');
        setRefundType('credit');
        setNotes('');
    };

    // Open create modal
    const openCreateModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    // Submit return
    const handleSubmit = async () => {
        if (returnItems.length === 0) {
            toast.error('Please select at least one item to return');
            return;
        }
        
        setLoading(true);
        try {
            const res = await api.post('/returns', {
                return_type: returnType,
                invoice_id: parseInt(selectedInvoiceId),
                party_id: parseInt(selectedPartyId),
                items: returnItems.map(item => ({
                    product_id: item.product_id,
                    batch_id: item.batch_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                })),
                reason,
                refund_type: refundType,
                notes
            });
            
            toast.success(`Return ${res.data.return_no} created successfully!`);
            setIsModalOpen(false);
            resetForm();
            fetchReturns();
        } catch (err: any) {
            toast.error(err.response?.data || 'Failed to create return');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // View return details
    const viewReturnDetails = async (ret: Return) => {
        try {
            const res = await api.get(`/returns/${ret.id}`);
            setViewReturn(res.data.return);
            setViewItems(res.data.items);
            setIsViewModalOpen(true);
        } catch (err: any) {
            toast.error('Failed to load return details');
            console.error(err);
        }
    };

    // Table columns
    const columns = [
        { header: 'Return #', accessor: (item: Return) => item.return_no },
        { 
            header: 'Type', 
            accessor: (item: Return) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.return_type === 'customer' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-orange-100 text-orange-800'
                }`}>
                    {item.return_type === 'customer' ? 'Customer' : 'Supplier'}
                </span>
            )
        },
        { header: 'Party', accessor: (item: Return) => item.party_name },
        { header: 'Invoice', accessor: (item: Return) => item.original_invoice_no },
        { header: 'Amount', accessor: (item: Return) => formatPKR(item.total_amount) },
        { header: 'Reason', accessor: (item: Return) => RETURN_REASONS.find(r => r.value === item.reason)?.label || item.reason },
        { 
            header: 'Date', 
            accessor: (item: Return) => new Date(item.created_at).toLocaleDateString('en-PK') 
        },
        {
            header: 'Actions',
            accessor: (item: Return) => (
                <button
                    onClick={() => viewReturnDetails(item)}
                    className="text-indigo-600 hover:text-indigo-800 p-1"
                    title="View Details"
                >
                    <FaEye />
                </button>
            )
        }
    ];

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#0F172A' }}>
                        Returns Management
                    </h1>
                    <p className="text-xs sm:text-sm mt-1" style={{ color: '#64748B' }}>
                        Manage customer and supplier returns
                    </p>
                </div>
                <Button onClick={openCreateModal}>
                    <FaPlus className="mr-2" /> New Return
                </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4">
                {['all', 'customer', 'supplier'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            filterType === type 
                                ? 'text-white' 
                                : 'bg-white text-gray-600 border hover:bg-gray-50'
                        }`}
                        style={filterType === type ? { background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' } : { borderColor: '#E2E8F0' }}
                    >
                        {type === 'all' ? 'All Returns' : type === 'customer' ? 'Customer Returns' : 'Supplier Returns'}
                    </button>
                ))}
            </div>

            {/* Returns Table */}
            <div className="rounded-xl shadow-md p-4 sm:p-6 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                {pageLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#6366F1' }}></div>
                    </div>
                ) : (
                    <DataTable columns={columns} data={returns} />
                )}
            </div>

            {/* Create Return Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div 
                        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
                        style={{ border: '1px solid #E2E8F0' }}
                    >
                        {/* Modal Header */}
                        <div 
                            className="flex justify-between items-center px-6 py-4"
                            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
                        >
                            <div className="flex items-center gap-3">
                                <FaUndo className="text-white text-xl" />
                                <h2 className="text-lg font-bold text-white">Create New Return</h2>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Progress Steps */}
                        <div className="px-6 py-4 border-b" style={{ borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}>
                            <div className="flex items-center justify-between max-w-2xl mx-auto">
                                {[
                                    { num: 1, label: 'Return Type' },
                                    { num: 2, label: 'Select Party' },
                                    { num: 3, label: 'Select Invoice' },
                                    { num: 4, label: 'Return Items' }
                                ].map((s, idx) => (
                                    <div key={s.num} className="flex items-center">
                                        <div 
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                                step >= s.num ? 'text-white' : 'bg-gray-200 text-gray-500'
                                            }`}
                                            style={step >= s.num ? { background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' } : {}}
                                        >
                                            {s.num}
                                        </div>
                                        <span className={`ml-2 text-xs hidden sm:block ${step >= s.num ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>
                                            {s.label}
                                        </span>
                                        {idx < 3 && (
                                            <div className={`w-8 sm:w-16 h-1 mx-2 rounded ${step > s.num ? 'bg-indigo-500' : 'bg-gray-200'}`}></div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 250px)' }}>
                            
                            {/* Step 1: Select Return Type */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold" style={{ color: '#0F172A' }}>
                                        What type of return is this?
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => { setReturnType('customer'); setStep(2); }}
                                            className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                                                returnType === 'customer' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                                            }`}
                                        >
                                            <FaUser className="text-3xl mb-3" style={{ color: '#6366F1' }} />
                                            <h4 className="font-bold text-lg" style={{ color: '#0F172A' }}>Customer Return</h4>
                                            <p className="text-sm mt-1" style={{ color: '#64748B' }}>
                                                Customer is returning items to you.<br/>
                                                Stock will be <span className="text-green-600 font-medium">ADDED</span> back.
                                            </p>
                                        </button>
                                        <button
                                            onClick={() => { setReturnType('supplier'); setStep(2); }}
                                            className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                                                returnType === 'supplier' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                                            }`}
                                        >
                                            <FaTruck className="text-3xl mb-3" style={{ color: '#F97316' }} />
                                            <h4 className="font-bold text-lg" style={{ color: '#0F172A' }}>Supplier Return</h4>
                                            <p className="text-sm mt-1" style={{ color: '#64748B' }}>
                                                You are returning items to supplier.<br/>
                                                Stock will be <span className="text-red-600 font-medium">DEDUCTED</span>.
                                            </p>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Select Party */}
                            {step === 2 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <button onClick={() => setStep(1)} className="text-indigo-600 hover:underline text-sm">
                                            ← Back
                                        </button>
                                    </div>
                                    <h3 className="text-lg font-semibold" style={{ color: '#0F172A' }}>
                                        Select {returnType === 'customer' ? 'Customer' : 'Supplier'}
                                    </h3>
                                    <SelectInput
                                        label={returnType === 'customer' ? 'Customer' : 'Supplier'}
                                        options={
                                            returnType === 'customer'
                                                ? customers.map(c => ({ value: c.id, label: c.name }))
                                                : suppliers.map(s => ({ value: s.id, label: s.name }))
                                        }
                                        value={selectedPartyId}
                                        onChange={(val) => {
                                            setSelectedPartyId(val);
                                            setSelectedInvoiceId('');
                                            setInvoices([]);
                                        }}
                                    />
                                    
                                    {selectedPartyId && (
                                        <div className="flex justify-end mt-4">
                                            <Button onClick={() => setStep(3)}>
                                                Next: Select Invoice →
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Select Invoice */}
                            {step === 3 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <button onClick={() => setStep(2)} className="text-indigo-600 hover:underline text-sm">
                                            ← Back
                                        </button>
                                    </div>
                                    
                                    <h3 className="text-lg font-semibold" style={{ color: '#0F172A' }}>
                                        Select Invoice
                                    </h3>
                                    
                                    {/* Date Filter */}
                                    <div className="p-4 rounded-lg border" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <FaFilter style={{ color: '#6366F1' }} />
                                            <span className="font-medium text-sm" style={{ color: '#0F172A' }}>Filter by Date</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <DatePicker
                                                label="From Date"
                                                value={fromDate}
                                                onChange={setFromDate}
                                            />
                                            <DatePicker
                                                label="To Date"
                                                value={toDate}
                                                onChange={setToDate}
                                            />
                                            <div className="flex items-end">
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    onClick={() => { setFromDate(''); setToDate(''); }}
                                                >
                                                    Clear Filters
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Invoices List */}
                                    <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
                                        <div className="p-3 border-b flex justify-between items-center" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                                            <span className="font-medium text-sm" style={{ color: '#0F172A' }}>
                                                {invoices.length} Invoice(s) Found
                                            </span>
                                            {invoices.length > invoicesPerPage && (
                                                <span className="text-xs" style={{ color: '#64748B' }}>
                                                    Page {invoicePage} of {Math.ceil(invoices.length / invoicesPerPage)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="max-h-96 overflow-y-auto">
                                            {loadingInvoices ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#6366F1' }}></div>
                                                </div>
                                            ) : invoices.length === 0 ? (
                                                <div className="text-center py-8 text-sm" style={{ color: '#64748B' }}>
                                                    No finalized invoices found for this {returnType}
                                                </div>
                                            ) : (
                                                invoices
                                                    .slice((invoicePage - 1) * invoicesPerPage, invoicePage * invoicesPerPage)
                                                    .map(inv => (
                                                    <div
                                                        key={inv.id}
                                                        onClick={() => { setSelectedInvoiceId(inv.id.toString()); setStep(4); }}
                                                        className={`p-3 border-b cursor-pointer hover:bg-indigo-50 transition-colors ${
                                                            selectedInvoiceId === inv.id.toString() ? 'bg-indigo-100' : ''
                                                        }`}
                                                        style={{ borderColor: '#E2E8F0' }}
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <span className="font-medium" style={{ color: '#0F172A' }}>
                                                                    {inv.invoice_no}
                                                                </span>
                                                                <span className="text-xs ml-2 px-2 py-0.5 rounded bg-gray-100" style={{ color: '#64748B' }}>
                                                                    {new Date(inv.created_at).toLocaleDateString('en-PK')}
                                                                </span>
                                                            </div>
                                                            <span className="font-bold" style={{ color: '#6366F1' }}>
                                                                {formatPKR(inv.total_amount)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        {/* Pagination Controls */}
                                        {invoices.length > invoicesPerPage && (
                                            <div className="p-3 border-t flex justify-between items-center" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => setInvoicePage(p => Math.max(1, p - 1))}
                                                    disabled={invoicePage === 1}
                                                >
                                                    ← Previous
                                                </Button>
                                                <span className="text-sm" style={{ color: '#64748B' }}>
                                                    Showing {((invoicePage - 1) * invoicesPerPage) + 1} - {Math.min(invoicePage * invoicesPerPage, invoices.length)} of {invoices.length}
                                                </span>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => setInvoicePage(p => Math.min(Math.ceil(invoices.length / invoicesPerPage), p + 1))}
                                                    disabled={invoicePage >= Math.ceil(invoices.length / invoicesPerPage)}
                                                >
                                                    Next →
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Select Items & Submit */}
                            {step === 4 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <button onClick={() => setStep(3)} className="text-indigo-600 hover:underline text-sm">
                                            ← Back to Invoices
                                        </button>
                                    </div>
                                    
                                    {/* Invoice Info */}
                                    {selectedInvoice && (
                                        <div className="p-4 rounded-lg border" style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <FaFileInvoice style={{ color: '#6366F1' }} />
                                                <span className="font-semibold" style={{ color: '#0F172A' }}>
                                                    Invoice: {returnType === 'customer' ? `INV-${selectedInvoice.id}` : selectedInvoice.invoice_no}
                                                </span>
                                            </div>
                                            <div className="text-sm" style={{ color: '#64748B' }}>
                                                {returnType === 'customer' ? selectedInvoice.customer_name : selectedInvoice.supplier_name} | 
                                                Total: {formatPKR(selectedInvoice.total_amount)} | 
                                                Date: {new Date(selectedInvoice.created_at).toLocaleDateString('en-PK')}
                                            </div>
                                        </div>
                                    )}

                                    {/* Items to Return */}
                                    <div>
                                        <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#0F172A' }}>
                                            <FaBoxOpen style={{ color: '#6366F1' }} />
                                            Select Items to Return
                                        </h4>
                                        
                                        {invoiceItems.length === 0 ? (
                                            <div className="text-center py-8 text-sm border rounded-lg" style={{ color: '#64748B', borderColor: '#E2E8F0' }}>
                                                No returnable items (all items may have been returned already)
                                            </div>
                                        ) : (
                                            <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
                                                <table className="min-w-full">
                                                    <thead style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}>
                                                        <tr>
                                                            <th className="py-3 px-4 text-left text-sm font-semibold text-white">Product</th>
                                                            <th className="py-3 px-4 text-left text-sm font-semibold text-white">Batch</th>
                                                            <th className="py-3 px-4 text-center text-sm font-semibold text-white">
                                                                {returnType === 'customer' ? 'Sold' : 'Purchased'}
                                                            </th>
                                                            <th className="py-3 px-4 text-center text-sm font-semibold text-white">Already Returned</th>
                                                            <th className="py-3 px-4 text-center text-sm font-semibold text-white">Returnable</th>
                                                            <th className="py-3 px-4 text-center text-sm font-semibold text-white">Return Qty</th>
                                                            <th className="py-3 px-4 text-right text-sm font-semibold text-white">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {invoiceItems.map((item, idx) => {
                                                            const returnItem = returnItems.find(r => r.product_id === item.product_id && r.batch_id === item.batch_id);
                                                            const qty = returnItem?.quantity || 0;
                                                            return (
                                                                <tr 
                                                                    key={`${item.id}-${item.batch_id}`}
                                                                    className="border-b"
                                                                    style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderColor: '#E2E8F0' }}
                                                                >
                                                                    <td className="py-3 px-4 text-sm" style={{ color: '#0F172A' }}>
                                                                        {item.product_name}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-sm" style={{ color: '#64748B' }}>
                                                                        {item.batch_number || '-'}
                                                                        {item.expiry_date && (
                                                                            <span className="block text-xs text-gray-400">
                                                                                Exp: {new Date(item.expiry_date).toLocaleDateString()}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-sm text-center" style={{ color: '#0F172A' }}>
                                                                        {item.sold_quantity || item.purchased_quantity}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-sm text-center" style={{ color: '#EF4444' }}>
                                                                        {item.already_returned}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-sm text-center font-medium" style={{ color: '#10B981' }}>
                                                                        {item.returnable_quantity}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-center">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max={item.returnable_quantity}
                                                                            value={qty}
                                                                            onChange={(e) => handleQuantityChange(item.product_id, item.batch_id, parseInt(e.target.value) || 0, item)}
                                                                            className="w-20 px-2 py-1 border rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                                            style={{ borderColor: '#E2E8F0' }}
                                                                        />
                                                                    </td>
                                                                    <td className="py-3 px-4 text-sm text-right font-medium" style={{ color: qty > 0 ? '#6366F1' : '#64748B' }}>
                                                                        {formatPKR(qty * item.unit_price)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    {/* Return Details */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <SelectInput
                                            label="Return Reason"
                                            options={RETURN_REASONS}
                                            value={reason}
                                            onChange={setReason}
                                        />
                                        <SelectInput
                                            label="Refund Type"
                                            options={REFUND_TYPES}
                                            value={refundType}
                                            onChange={setRefundType}
                                        />
                                    </div>
                                    
                                    <Input
                                        label="Notes (Optional)"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Any additional notes..."
                                    />

                                    {/* Total */}
                                    <div className="p-4 rounded-lg border-2" style={{ backgroundColor: '#F0FDF4', borderColor: '#10B981' }}>
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold" style={{ color: '#0F172A' }}>
                                                Total Return Amount:
                                            </span>
                                            <span className="text-2xl font-bold" style={{ color: '#10B981' }}>
                                                {formatPKR(totalReturnAmount)}
                                            </span>
                                        </div>
                                        <p className="text-xs mt-2" style={{ color: '#64748B' }}>
                                            {returnType === 'customer' 
                                                ? '→ Stock will be ADDED back | Customer balance will be CREDITED'
                                                : '→ Stock will be DEDUCTED | Supplier balance will be REDUCED'
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        {step === 4 && (
                            <div className="px-6 py-4 border-t flex justify-between" style={{ borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}>
                                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleSubmit} disabled={loading || returnItems.length === 0}>
                                    {loading ? 'Processing...' : 'Create Return'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* View Return Modal */}
            {isViewModalOpen && viewReturn && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div 
                        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                        style={{ border: '1px solid #E2E8F0' }}
                    >
                        <div 
                            className="flex justify-between items-center px-6 py-4"
                            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
                        >
                            <h2 className="text-lg font-bold text-white">Return Details - {viewReturn.return_no}</h2>
                            <button 
                                onClick={() => setIsViewModalOpen(false)}
                                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                            <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-lg" style={{ backgroundColor: '#F8FAFC' }}>
                                <div>
                                    <p className="text-xs" style={{ color: '#64748B' }}>Return Type</p>
                                    <p className="font-semibold" style={{ color: '#0F172A' }}>
                                        {viewReturn.return_type === 'customer' ? 'Customer Return' : 'Supplier Return'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs" style={{ color: '#64748B' }}>Party</p>
                                    <p className="font-semibold" style={{ color: '#0F172A' }}>{viewReturn.party_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs" style={{ color: '#64748B' }}>Reason</p>
                                    <p className="font-semibold" style={{ color: '#0F172A' }}>
                                        {RETURN_REASONS.find(r => r.value === viewReturn.reason)?.label}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs" style={{ color: '#64748B' }}>Refund Type</p>
                                    <p className="font-semibold" style={{ color: '#0F172A' }}>
                                        {REFUND_TYPES.find(r => r.value === viewReturn.refund_type)?.label}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs" style={{ color: '#64748B' }}>Date</p>
                                    <p className="font-semibold" style={{ color: '#0F172A' }}>
                                        {new Date(viewReturn.created_at).toLocaleDateString('en-PK')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs" style={{ color: '#64748B' }}>Total Amount</p>
                                    <p className="font-bold" style={{ color: '#6366F1' }}>{formatPKR(viewReturn.total_amount)}</p>
                                </div>
                            </div>
                            
                            <h4 className="font-semibold mb-3" style={{ color: '#0F172A' }}>Returned Items</h4>
                            <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
                                <table className="min-w-full">
                                    <thead style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}>
                                        <tr>
                                            <th className="py-3 px-4 text-left text-sm font-semibold text-white">Product</th>
                                            <th className="py-3 px-4 text-center text-sm font-semibold text-white">Qty</th>
                                            <th className="py-3 px-4 text-right text-sm font-semibold text-white">Rate</th>
                                            <th className="py-3 px-4 text-right text-sm font-semibold text-white">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewItems.map((item, idx) => (
                                            <tr 
                                                key={item.id}
                                                className="border-b"
                                                style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderColor: '#E2E8F0' }}
                                            >
                                                <td className="py-3 px-4 text-sm" style={{ color: '#0F172A' }}>{item.product_name}</td>
                                                <td className="py-3 px-4 text-sm text-center" style={{ color: '#0F172A' }}>{item.quantity}</td>
                                                <td className="py-3 px-4 text-sm text-right" style={{ color: '#0F172A' }}>{formatPKR(item.unit_price)}</td>
                                                <td className="py-3 px-4 text-sm text-right font-medium" style={{ color: '#0F172A' }}>{formatPKR(item.total_price)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            {viewReturn.notes && (
                                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#F8FAFC' }}>
                                    <p className="text-xs font-medium" style={{ color: '#64748B' }}>Notes:</p>
                                    <p className="text-sm" style={{ color: '#0F172A' }}>{viewReturn.notes}</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}>
                            <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Returns;
