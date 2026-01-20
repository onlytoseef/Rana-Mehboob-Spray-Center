import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import DataTable from '../components/ui/DataTable';
import toast from 'react-hot-toast';
import { PageSkeleton } from '../components/ui/Skeleton';
import { FaArrowLeft, FaTruck, FaFileInvoice, FaMoneyBillWave, FaUndo, FaEye, FaTimes, FaBox } from 'react-icons/fa';
import { exportToPDF } from '../utils/pdfExport';

interface SupplierInfo {
    id: number;
    name: string;
    phone: string;
}

interface Invoice {
    id: number;
    invoice_no: string;
    date: string;
    total_amount: number;
    status: string;
    items_count: number;
}

interface Payment {
    id: number;
    amount: number;
    payment_type: string;
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
    total_imports: number;
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
    invoice_no: string;
    supplier_name: string;
    total_amount: number;
    created_at: string;
    items: InvoiceItem[];
}

const SupplierLedgerDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [supplier, setSupplier] = useState<SupplierInfo | null>(null);
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
            const res = await api.get(`/ledger/supplier/${id}`);
            setSupplier(res.data.supplier);
            setInvoices(res.data.invoices);
            setPayments(res.data.payments);
            setReturns(res.data.returns || []);
            setSummary(res.data.summary);
        } catch (err: any) {
            toast.error('Failed to load supplier ledger');
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
            const res = await api.get(`/imports/${invoiceId}`);
            const invoiceData = res.data.invoice || res.data;
            const itemsData = res.data.items || [];
            
            setInvoiceDetails({
                id: invoiceData.id,
                invoice_no: invoiceData.invoice_no,
                supplier_name: invoiceData.supplier_name,
                total_amount: parseFloat(invoiceData.total_amount) || 0,
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
        if (!supplier || !summary) return;

        const pdfColumns = [
            { header: 'Invoice #', accessor: 'invoice_no' },
            { header: 'Date', accessor: 'date' },
            { header: 'Items', accessor: 'items_count' },
            { header: 'Amount', accessor: 'total_amount' }
        ];
        
        const data = invoices.map(inv => ({
            invoice_no: inv.invoice_no,
            date: new Date(inv.date).toLocaleDateString('en-PK'),
            items_count: inv.items_count.toString(),
            total_amount: `Rs. ${Number(inv.total_amount).toLocaleString()}`
        }));

        // Add summary rows
        data.push({ invoice_no: '', date: '', items_count: '', total_amount: '' });
        data.push({ invoice_no: '', date: '', items_count: 'Total Imports:', total_amount: `Rs. ${Number(summary.total_imports).toLocaleString()}` });
        data.push({ invoice_no: '', date: '', items_count: 'Total Paid:', total_amount: `Rs. ${Number(summary.total_paid).toLocaleString()}` });
        data.push({ invoice_no: '', date: '', items_count: 'Total Returns:', total_amount: `Rs. ${Number(summary.total_returns).toLocaleString()}` });
        data.push({ invoice_no: '', date: '', items_count: 'Balance:', total_amount: `Rs. ${Number(summary.balance).toLocaleString()}` });

        exportToPDF({
            title: `Supplier Ledger - ${supplier.name}`,
            columns: pdfColumns,
            data,
            filename: `supplier-ledger-${supplier.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
        });
    };

    const invoiceColumns = [
        { header: 'Invoice #', accessor: 'invoice_no' as keyof Invoice },
        { header: 'Date', accessor: (item: Invoice) => new Date(item.date).toLocaleDateString('en-PK') },
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
            accessor: () => (
                <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                    Payment to Supplier
                </span>
            )
        },
        { 
            header: 'Amount', 
            accessor: (item: Payment) => (
                <span className="font-medium text-red-700">
                    Rs. {Number(item.amount).toLocaleString()}
                </span>
            )
        },
        { header: 'Notes', accessor: (item: Payment) => item.notes || '-' },
    ];

    const returnColumns = [
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
    ];

    if (pageLoading) {
        return <PageSkeleton rows={6} />;
    }

    if (!supplier || !summary) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Supplier not found</p>
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
                            <FaTruck className="inline mr-2" />
                            {supplier.name}
                        </h1>
                        <p className="text-xs sm:text-sm mt-1" style={{ color: '#64748B' }}>
                            {supplier.phone}
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

            {/* Supplier Info Card */}
            <div className="p-4 rounded-lg shadow mb-6" style={{ backgroundColor: '#F8FAFC' }}>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <p className="text-xs" style={{ color: '#64748B' }}>Phone</p>
                        <p className="font-medium" style={{ color: '#0F172A' }}>{supplier.phone || '-'}</p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="p-4 rounded-lg shadow bg-blue-50">
                    <div className="flex items-center gap-2 mb-2">
                        <FaFileInvoice className="text-blue-600" />
                        <p className="text-xs text-blue-600">Total Invoices</p>
                    </div>
                    <p className="text-xl font-bold text-blue-700">{summary.total_invoices}</p>
                </div>
                <div className="p-4 rounded-lg shadow bg-purple-50">
                    <div className="flex items-center gap-2 mb-2">
                        <FaTruck className="text-purple-600" />
                        <p className="text-xs text-purple-600">Total Imports</p>
                    </div>
                    <p className="text-xl font-bold text-purple-700">
                        Rs. {Number(summary.total_imports).toLocaleString()}
                    </p>
                </div>
                <div className="p-4 rounded-lg shadow bg-red-50">
                    <div className="flex items-center gap-2 mb-2">
                        <FaMoneyBillWave className="text-red-600" />
                        <p className="text-xs text-red-600">Total Paid</p>
                    </div>
                    <p className="text-xl font-bold text-red-700">
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
                        Balance (To Pay)
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
                    columns={returnColumns}
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
                                    Invoice Details - {invoiceDetails?.invoice_no}
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
                        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                            {loadingDetails ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#6366F1' }}></div>
                                </div>
                            ) : invoiceDetails ? (
                                <div>
                                    {/* Invoice Info */}
                                    <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-lg" style={{ backgroundColor: '#F8FAFC' }}>
                                        <div>
                                            <p className="text-xs" style={{ color: '#64748B' }}>Supplier</p>
                                            <p className="font-medium" style={{ color: '#0F172A' }}>{invoiceDetails.supplier_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs" style={{ color: '#64748B' }}>Date</p>
                                            <p className="font-medium" style={{ color: '#0F172A' }}>
                                                {new Date(invoiceDetails.created_at).toLocaleDateString('en-PK')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs" style={{ color: '#64748B' }}>Total Amount</p>
                                            <p className="font-bold text-lg" style={{ color: '#6366F1' }}>
                                                Rs. {invoiceDetails.total_amount.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Products List */}
                                    <h3 className="font-semibold mb-3 flex items-center gap-2" style={{ color: '#0F172A' }}>
                                        <FaBox style={{ color: '#6366F1' }} />
                                        Products ({invoiceDetails.items.length})
                                    </h3>
                                    <div className="border rounded-lg overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
                                        <table className="min-w-full">
                                            <thead style={{ backgroundColor: '#F8FAFC' }}>
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#64748B' }}>Product</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium" style={{ color: '#64748B' }}>Qty</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: '#64748B' }}>Unit Price</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium" style={{ color: '#64748B' }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {invoiceDetails.items.map((item, idx) => (
                                                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : ''} style={{ backgroundColor: idx % 2 !== 0 ? '#F8FAFC' : '' }}>
                                                        <td className="px-4 py-3 text-sm" style={{ color: '#0F172A' }}>{item.product_name}</td>
                                                        <td className="px-4 py-3 text-sm text-center" style={{ color: '#0F172A' }}>{item.quantity}</td>
                                                        <td className="px-4 py-3 text-sm text-right" style={{ color: '#64748B' }}>Rs. {item.unit_price.toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-sm text-right font-medium" style={{ color: '#0F172A' }}>Rs. {item.total_price.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupplierLedgerDetails;
