import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import DataTable from '../components/ui/DataTable';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';
import { PageSkeleton } from '../components/ui/Skeleton';
import { FaArrowLeft, FaUser, FaFileInvoice, FaMoneyBillWave, FaTimes, FaBox, FaEye, FaUndo } from 'react-icons/fa';
import { exportToPDF } from '../utils/pdfExport';

interface CustomerInfo {
    id: number;
    name: string;
    phone: string;
}

interface Invoice {
    id: number;
    invoice_number: string;
    date: string;
    type: string;
    total_amount: number;
    items_count: number;
}

interface Payment {
    id: number;
    amount: number;
    payment_type: string;
    reference: string;
    notes: string;
    created_at: string;
}

interface Return {
    id: number;
    return_no: string;
    total_amount: number;
    reason: string;
    refund_type: string;
    created_at: string;
}

interface LedgerSummary {
    total_invoices: number;
    total_purchase: number;
    total_cash: number;
    total_credit: number;
    total_paid: number;
    total_returns: number;
    balance: number;
}

interface InvoiceItem {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface InvoiceDetails {
    id: number;
    customer_name: string;
    type: string;
    total_amount: number;
    discount: number;
    created_at: string;
    items: InvoiceItem[];
}

const CustomerLedgerDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<CustomerInfo | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [returns, setReturns] = useState<Return[]>([]);
    const [summary, setSummary] = useState<LedgerSummary | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'returns'>('invoices');
    
    // Invoice Details Modal State
    const [invoiceModal, setInvoiceModal] = useState(false);
    const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const fetchData = async () => {
        try {
            const res = await api.get(`/ledger/customer/${id}`);
            setCustomer(res.data.customer);
            setInvoices(res.data.invoices);
            setPayments(res.data.payments);
            setReturns(res.data.returns || []);
            setSummary(res.data.summary);
        } catch (err: any) {
            toast.error('Failed to load customer ledger');
            console.error(err);
        } finally {
            setPageLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    // Fetch invoice details
    const fetchInvoiceDetails = async (invoiceId: number) => {
        setLoadingDetails(true);
        setInvoiceModal(true);
        try {
            const res = await api.get(`/sales/${invoiceId}`);
            const invoiceData = res.data.invoice || res.data;
            const itemsData = res.data.items || [];
            
            setInvoiceDetails({
                id: invoiceData.id,
                customer_name: invoiceData.customer_name,
                type: invoiceData.type,
                total_amount: parseFloat(invoiceData.total_amount) || 0,
                discount: parseFloat(invoiceData.discount) || 0,
                created_at: invoiceData.created_at,
                items: itemsData.map((item: any) => ({
                    id: item.id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    unit_price: parseFloat(item.unit_price) || 0,
                    total_price: parseFloat(item.total_price) || 0
                }))
            });
        } catch (err: any) {
            toast.error('Failed to load invoice details');
            console.error(err);
            setInvoiceModal(false);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleExportPDF = () => {
        if (!customer || !summary) return;

        const pdfColumns = [
            { header: 'Invoice #', accessor: 'invoice_number' },
            { header: 'Date', accessor: 'date' },
            { header: 'Type', accessor: 'type' },
            { header: 'Items', accessor: 'items_count' },
            { header: 'Amount', accessor: 'total_amount' }
        ];
        
        const data = invoices.map(inv => ({
            invoice_number: inv.invoice_number,
            date: new Date(inv.date).toLocaleDateString('en-PK'),
            type: inv.type,
            items_count: inv.items_count.toString(),
            total_amount: `Rs. ${Number(inv.total_amount).toLocaleString()}`
        }));

        // Add summary rows
        data.push({ invoice_number: '', date: '', type: '', items_count: '', total_amount: '' });
        data.push({ invoice_number: '', date: '', type: '', items_count: 'Total Purchase:', total_amount: `Rs. ${Number(summary.total_purchase).toLocaleString()}` });
        data.push({ invoice_number: '', date: '', type: '', items_count: 'Cash Purchases:', total_amount: `Rs. ${Number(summary.total_cash).toLocaleString()}` });
        data.push({ invoice_number: '', date: '', type: '', items_count: 'Credit Purchases:', total_amount: `Rs. ${Number(summary.total_credit).toLocaleString()}` });
        data.push({ invoice_number: '', date: '', type: '', items_count: 'Total Paid:', total_amount: `Rs. ${Number(summary.total_paid).toLocaleString()}` });
        data.push({ invoice_number: '', date: '', type: '', items_count: 'Balance:', total_amount: `Rs. ${Number(summary.balance).toLocaleString()}` });

        exportToPDF({
            title: `Customer Ledger - ${customer.name}`,
            columns: pdfColumns,
            data,
            filename: `customer-ledger-${customer.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
        });
    };

    const invoiceColumns = [
        { header: 'Invoice #', accessor: 'invoice_number' as keyof Invoice },
        { header: 'Date', accessor: (item: Invoice) => new Date(item.date).toLocaleDateString('en-PK') },
        { 
            header: 'Type', 
            accessor: (item: Invoice) => (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.type === 'cash' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}>
                    {item.type}
                </span>
            )
        },
        { header: 'Items', accessor: 'items_count' as keyof Invoice },
        { 
            header: 'Amount', 
            accessor: (item: Invoice) => `Rs. ${Number(item.total_amount).toLocaleString()}` 
        },
        {
            header: 'Details',
            accessor: (item: Invoice) => (
                <button
                    onClick={(e) => { e.stopPropagation(); fetchInvoiceDetails(item.id); }}
                    className="text-indigo-600 hover:text-indigo-800 p-1 flex items-center gap-1"
                    title="View Details"
                >
                    <FaEye /> View
                </button>
            )
        }
    ];

    const paymentColumns = [
        { header: 'Date', accessor: (item: Payment) => new Date(item.created_at).toLocaleDateString('en-PK') },
        { 
            header: 'Type', 
            accessor: (item: Payment) => (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.payment_type === 'credit_voucher' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                }`}>
                    {item.payment_type === 'credit_voucher' ? 'Credit Voucher' : 'Cash Received'}
                </span>
            )
        },
        { 
            header: 'Amount', 
            accessor: (item: Payment) => (
                <span className="font-medium text-green-700">
                    Rs. {Number(item.amount).toLocaleString()}
                </span>
            )
        },
        { header: 'Reference', accessor: (item: Payment) => item.reference || '-' },
        { header: 'Notes', accessor: (item: Payment) => item.notes || '-' },
    ];

    if (pageLoading) {
        return <PageSkeleton rows={6} />;
    }

    if (!customer || !summary) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Customer not found</p>
                <button
                    onClick={() => navigate('/ledger')}
                    className="mt-4 px-4 py-2 rounded text-white"
                    style={{ backgroundColor: '#0F172A' }}
                >
                    Back to Ledger
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/ledger')}
                        className="p-2 rounded-lg hover:bg-gray-100"
                        style={{ color: '#0F172A' }}
                    >
                        <FaArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#0F172A' }}>
                            <FaUser className="inline mr-2" />
                            {customer.name}
                        </h1>
                        <p className="text-xs sm:text-sm mt-1" style={{ color: '#64748B' }}>
                            {customer.phone}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleExportPDF}
                    className="px-4 py-2 rounded-lg text-white flex items-center gap-2"
                    style={{ backgroundColor: '#0F172A' }}
                >
                    Export PDF
                </button>
            </div>

            {/* Customer Info Card */}
            <div className="p-4 rounded-lg shadow mb-6" style={{ backgroundColor: '#F8FAFC' }}>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <p className="text-xs" style={{ color: '#64748B' }}>Phone</p>
                        <p className="font-medium" style={{ color: '#0F172A' }}>{customer.phone || '-'}</p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                <div className="p-4 rounded-lg shadow bg-blue-50">
                    <div className="flex items-center gap-2 mb-2">
                        <FaFileInvoice className="text-blue-600" />
                        <p className="text-xs text-blue-600">Total Invoices</p>
                    </div>
                    <p className="text-xl font-bold text-blue-700">{summary.total_invoices}</p>
                </div>
                <div className="p-4 rounded-lg shadow bg-gray-50">
                    <div className="flex items-center gap-2 mb-2">
                        <FaMoneyBillWave className="text-gray-600" />
                        <p className="text-xs text-gray-600">Total Purchase</p>
                    </div>
                    <p className="text-xl font-bold text-gray-700">
                        Rs. {Number(summary.total_purchase).toLocaleString()}
                    </p>
                </div>
                <div className="p-4 rounded-lg shadow bg-green-50">
                    <p className="text-xs text-green-600 mb-2">Cash Purchases</p>
                    <p className="text-xl font-bold text-green-700">
                        Rs. {Number(summary.total_cash).toLocaleString()}
                    </p>
                </div>
                <div className="p-4 rounded-lg shadow bg-amber-50">
                    <p className="text-xs text-amber-600 mb-2">Credit Purchases</p>
                    <p className="text-xl font-bold text-amber-700">
                        Rs. {Number(summary.total_credit).toLocaleString()}
                    </p>
                </div>
                <div className="p-4 rounded-lg shadow bg-emerald-50">
                    <p className="text-xs text-emerald-600 mb-2">Total Paid</p>
                    <p className="text-xl font-bold text-emerald-700">
                        Rs. {Number(summary.total_paid).toLocaleString()}
                    </p>
                </div>
                <div className="p-4 rounded-lg shadow bg-orange-50">
                    <div className="flex items-center gap-2 mb-2">
                        <FaUndo className="text-orange-600" />
                        <p className="text-xs text-orange-600">Total Returns</p>
                    </div>
                    <p className="text-xl font-bold text-orange-700">
                        Rs. {Number(summary.total_returns || 0).toLocaleString()}
                    </p>
                </div>
                <div className="p-4 rounded-lg shadow" style={{ backgroundColor: Number(summary.balance) > 0 ? '#FEE2E2' : '#D1FAE5' }}>
                    <p className="text-xs mb-2" style={{ color: Number(summary.balance) > 0 ? '#DC2626' : '#059669' }}>
                        Balance
                    </p>
                    <p className="text-xl font-bold" style={{ color: Number(summary.balance) > 0 ? '#DC2626' : '#059669' }}>
                        Rs. {Number(summary.balance).toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-4" style={{ borderColor: '#E5E7EB' }}>
                <button
                    onClick={() => setActiveTab('invoices')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                        activeTab === 'invoices'
                            ? 'border-[#0F172A] text-[#0F172A]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FaFileInvoice className="inline mr-2" />
                    Invoices ({invoices.length})
                </button>
                <button
                    onClick={() => setActiveTab('payments')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                        activeTab === 'payments'
                            ? 'border-[#0F172A] text-[#0F172A]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FaMoneyBillWave className="inline mr-2" />
                    Payments ({payments.length})
                </button>
                <button
                    onClick={() => setActiveTab('returns')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                        activeTab === 'returns'
                            ? 'border-[#0F172A] text-[#0F172A]'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FaUndo className="inline mr-2" />
                    Returns ({returns.length})
                </button>
            </div>

            {/* Data Tables */}
            {activeTab === 'invoices' ? (
                <DataTable
                    columns={invoiceColumns}
                    data={invoices}
                    onRowClick={(item: Invoice) => fetchInvoiceDetails(item.id)}
                />
            ) : activeTab === 'payments' ? (
                <DataTable
                    columns={paymentColumns}
                    data={payments}
                />
            ) : (
                <DataTable
                    columns={[
                        { header: 'Return #', accessor: 'return_no' as keyof Return },
                        { header: 'Date', accessor: (item: Return) => new Date(item.created_at).toLocaleDateString('en-PK') },
                        { 
                            header: 'Amount', 
                            accessor: (item: Return) => (
                                <span className="font-medium text-orange-700">
                                    Rs. {Number(item.total_amount).toLocaleString()}
                                </span>
                            )
                        },
                        { 
                            header: 'Reason', 
                            accessor: (item: Return) => {
                                const reasons: { [key: string]: string } = {
                                    'defective': 'Defective',
                                    'wrong_item': 'Wrong Item',
                                    'changed_mind': 'Changed Mind',
                                    'damaged': 'Damaged',
                                    'quality': 'Quality Issue',
                                    'other': 'Other'
                                };
                                return reasons[item.reason] || item.reason;
                            }
                        },
                        { 
                            header: 'Refund Type', 
                            accessor: (item: Return) => (
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    item.refund_type === 'cash' ? 'bg-green-100 text-green-800' : 
                                    item.refund_type === 'credit' ? 'bg-purple-100 text-purple-800' : 
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {item.refund_type === 'cash' ? 'Cash Refund' : 
                                     item.refund_type === 'credit' ? 'Credit Note' : 'Exchange'}
                                </span>
                            )
                        }
                    ]}
                    data={returns}
                />
            )}

            {/* Invoice Details Modal */}
            {invoiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div 
                        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                        style={{ border: '1px solid #E2E8F0' }}
                    >
                        {/* Modal Header */}
                        <div 
                            className="flex justify-between items-center px-6 py-4"
                            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
                        >
                            <div className="flex items-center gap-3">
                                <FaFileInvoice className="text-white text-xl" />
                                <h2 className="text-lg font-bold text-white">
                                    Invoice Details - INV-{invoiceDetails?.id}
                                </h2>
                            </div>
                            <button 
                                onClick={() => { setInvoiceModal(false); setInvoiceDetails(null); }}
                                className="text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                            {loadingDetails ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#6366F1' }}></div>
                                </div>
                            ) : invoiceDetails ? (
                                <>
                                    {/* Invoice Info */}
                                    <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-lg" style={{ backgroundColor: '#F8FAFC' }}>
                                        <div>
                                            <p className="text-xs" style={{ color: '#64748B' }}>Invoice #</p>
                                            <p className="font-semibold" style={{ color: '#0F172A' }}>
                                                INV-{invoiceDetails.id}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs" style={{ color: '#64748B' }}>Customer</p>
                                            <p className="font-semibold" style={{ color: '#0F172A' }}>
                                                {invoiceDetails.customer_name || customer?.name}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs" style={{ color: '#64748B' }}>Date</p>
                                            <p className="font-semibold" style={{ color: '#0F172A' }}>
                                                {new Date(invoiceDetails.created_at).toLocaleDateString('en-PK', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs" style={{ color: '#64748B' }}>Type</p>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                invoiceDetails.type === 'cash' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                            }`}>
                                                {invoiceDetails.type?.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Products Table */}
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FaBox style={{ color: '#6366F1' }} />
                                            <h3 className="font-semibold" style={{ color: '#0F172A' }}>Products Sold</h3>
                                        </div>
                                        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: '#E2E8F0' }}>
                                            <table className="min-w-full">
                                                <thead style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}>
                                                    <tr>
                                                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">#</th>
                                                        <th className="py-3 px-4 text-left text-sm font-semibold text-white">Product</th>
                                                        <th className="py-3 px-4 text-right text-sm font-semibold text-white">Qty</th>
                                                        <th className="py-3 px-4 text-right text-sm font-semibold text-white">Rate</th>
                                                        <th className="py-3 px-4 text-right text-sm font-semibold text-white">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {invoiceDetails.items && invoiceDetails.items.length > 0 ? (
                                                        invoiceDetails.items.map((item, idx) => (
                                                            <tr 
                                                                key={item.id || idx}
                                                                className="border-b"
                                                                style={{ backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderColor: '#E2E8F0' }}
                                                            >
                                                                <td className="py-3 px-4 text-sm" style={{ color: '#64748B' }}>
                                                                    {idx + 1}
                                                                </td>
                                                                <td className="py-3 px-4 text-sm font-medium" style={{ color: '#0F172A' }}>
                                                                    {item.product_name}
                                                                </td>
                                                                <td className="py-3 px-4 text-sm text-right" style={{ color: '#0F172A' }}>
                                                                    {item.quantity}
                                                                </td>
                                                                <td className="py-3 px-4 text-sm text-right" style={{ color: '#0F172A' }}>
                                                                    Rs. {item.unit_price.toLocaleString()}
                                                                </td>
                                                                <td className="py-3 px-4 text-sm text-right font-medium" style={{ color: '#0F172A' }}>
                                                                    Rs. {item.total_price.toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={5} className="py-8 text-center text-sm" style={{ color: '#64748B' }}>
                                                                No items found
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className="flex justify-end">
                                        <div className="w-64 space-y-2 p-4 rounded-lg" style={{ backgroundColor: '#F8FAFC' }}>
                                            <div className="flex justify-between text-sm">
                                                <span style={{ color: '#64748B' }}>Subtotal:</span>
                                                <span style={{ color: '#0F172A' }}>
                                                    Rs. {(invoiceDetails.items?.reduce((sum, item) => sum + item.total_price, 0) || 0).toLocaleString()}
                                                </span>
                                            </div>
                                            {invoiceDetails.discount > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span style={{ color: '#64748B' }}>Discount:</span>
                                                    <span style={{ color: '#EF4444' }}>-Rs. {invoiceDetails.discount.toLocaleString()}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between font-bold border-t pt-2" style={{ borderColor: '#E2E8F0' }}>
                                                <span style={{ color: '#0F172A' }}>Total:</span>
                                                <span style={{ color: '#6366F1' }}>Rs. {invoiceDetails.total_amount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' }}>
                            <Button variant="secondary" onClick={() => { setInvoiceModal(false); setInvoiceDetails(null); }}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerLedgerDetails;
