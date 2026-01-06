import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import DataTable from '../components/ui/DataTable';
import toast from 'react-hot-toast';
import { PageSkeleton } from '../components/ui/Skeleton';
import { FaBook, FaEye, FaUser, FaTruck } from 'react-icons/fa';
import { exportToPDF } from '../utils/pdfExport';

interface CustomerLedger {
    id: number;
    name: string;
    phone: string;
    total_invoices: number;
    total_purchase: number;
    total_cash: number;
    total_credit: number;
    total_paid: number;
    balance: number;
}

interface SupplierLedger {
    id: number;
    name: string;
    phone: string;
    total_invoices: number;
    total_imports: number;
    total_paid: number;
    balance: number;
}

const GeneralLedger = () => {
    const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
    const [customers, setCustomers] = useState<CustomerLedger[]>([]);
    const [suppliers, setSuppliers] = useState<SupplierLedger[]>([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const fetchCustomers = async () => {
        try {
            const res = await api.get('/ledger/customers');
            setCustomers(res.data);
        } catch (err: any) {
            toast.error('Failed to load customer ledger');
            console.error(err);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/ledger/suppliers');
            setSuppliers(res.data);
        } catch (err: any) {
            toast.error('Failed to load supplier ledger');
            console.error(err);
        }
    };

    const fetchData = async () => {
        setPageLoading(true);
        await Promise.all([fetchCustomers(), fetchSuppliers()]);
        setPageLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleViewCustomerDetails = (customerId: number) => {
        navigate(`/ledger/customer/${customerId}`);
    };

    const handleViewSupplierDetails = (supplierId: number) => {
        navigate(`/ledger/supplier/${supplierId}`);
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
    );

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone?.includes(searchTerm)
    );

    const handleExportCustomersPDF = () => {
        const pdfColumns = [
            { header: 'Customer', accessor: 'name' },
            { header: 'Phone', accessor: 'phone' },
            { header: 'Invoices', accessor: 'total_invoices' },
            { header: 'Total Purchase', accessor: 'total_purchase' },
            { header: 'Cash', accessor: 'total_cash' },
            { header: 'Credit', accessor: 'total_credit' },
            { header: 'Paid', accessor: 'total_paid' },
            { header: 'Balance', accessor: 'balance' }
        ];
        const data = filteredCustomers.map(c => ({
            name: c.name,
            phone: c.phone || '-',
            total_invoices: c.total_invoices.toString(),
            total_purchase: `Rs. ${Number(c.total_purchase).toLocaleString()}`,
            total_cash: `Rs. ${Number(c.total_cash).toLocaleString()}`,
            total_credit: `Rs. ${Number(c.total_credit).toLocaleString()}`,
            total_paid: `Rs. ${Number(c.total_paid).toLocaleString()}`,
            balance: `Rs. ${Number(c.balance).toLocaleString()}`
        }));
        exportToPDF({
            title: 'General Ledger - Customer Summary',
            columns: pdfColumns,
            data,
            filename: `customer-ledger-${new Date().toISOString().split('T')[0]}.pdf`
        });
    };

    const handleExportSuppliersPDF = () => {
        const pdfColumns = [
            { header: 'Supplier', accessor: 'name' },
            { header: 'Phone', accessor: 'phone' },
            { header: 'Invoices', accessor: 'total_invoices' },
            { header: 'Total Imports', accessor: 'total_imports' },
            { header: 'Total Paid', accessor: 'total_paid' },
            { header: 'Balance', accessor: 'balance' }
        ];
        const data = filteredSuppliers.map(s => ({
            name: s.name,
            phone: s.phone || '-',
            total_invoices: s.total_invoices.toString(),
            total_imports: `Rs. ${Number(s.total_imports).toLocaleString()}`,
            total_paid: `Rs. ${Number(s.total_paid).toLocaleString()}`,
            balance: `Rs. ${Number(s.balance).toLocaleString()}`
        }));
        exportToPDF({
            title: 'General Ledger - Supplier Summary',
            columns: pdfColumns,
            data,
            filename: `supplier-ledger-${new Date().toISOString().split('T')[0]}.pdf`
        });
    };

    const customerColumns = [
        { header: 'Customer', accessor: 'name' as keyof CustomerLedger },
        { header: 'Phone', accessor: (item: CustomerLedger) => item.phone || '-' },
        { header: 'Invoices', accessor: 'total_invoices' as keyof CustomerLedger },
        { 
            header: 'Total Purchase', 
            accessor: (item: CustomerLedger) => `Rs. ${Number(item.total_purchase).toLocaleString()}` 
        },
        { 
            header: 'Cash Purchases', 
            accessor: (item: CustomerLedger) => (
                <span style={{ color: '#065F46' }}>
                    Rs. {Number(item.total_cash).toLocaleString()}
                </span>
            )
        },
        { 
            header: 'Credit Purchases', 
            accessor: (item: CustomerLedger) => (
                <span style={{ color: '#B45309' }}>
                    Rs. {Number(item.total_credit).toLocaleString()}
                </span>
            )
        },
        { 
            header: 'Total Paid', 
            accessor: (item: CustomerLedger) => (
                <span style={{ color: '#059669' }}>
                    Rs. {Number(item.total_paid).toLocaleString()}
                </span>
            )
        },
        { 
            header: 'Balance (To Receive)', 
            accessor: (item: CustomerLedger) => (
                <span style={{ 
                    color: Number(item.balance) > 0 ? '#DC2626' : '#059669',
                    fontWeight: 'bold'
                }}>
                    Rs. {Number(item.balance).toLocaleString()}
                </span>
            )
        },
        {
            header: 'Actions',
            accessor: (item: CustomerLedger) => (
                <button
                    onClick={() => handleViewCustomerDetails(item.id)}
                    className="px-3 py-1 rounded text-white flex items-center gap-1"
                    style={{ backgroundColor: '#6366F1' }}
                >
                    <FaEye /> View
                </button>
            )
        }
    ];

    const supplierColumns = [
        { header: 'Supplier', accessor: 'name' as keyof SupplierLedger },
        { header: 'Phone', accessor: (item: SupplierLedger) => item.phone || '-' },
        { header: 'Invoices', accessor: 'total_invoices' as keyof SupplierLedger },
        { 
            header: 'Total Imports', 
            accessor: (item: SupplierLedger) => (
                <span style={{ color: '#7C3AED' }}>
                    Rs. {Number(item.total_imports).toLocaleString()}
                </span>
            )
        },
        { 
            header: 'Total Paid', 
            accessor: (item: SupplierLedger) => (
                <span style={{ color: '#DC2626' }}>
                    Rs. {Number(item.total_paid).toLocaleString()}
                </span>
            )
        },
        { 
            header: 'Balance (To Pay)', 
            accessor: (item: SupplierLedger) => (
                <span style={{ 
                    color: Number(item.balance) > 0 ? '#DC2626' : '#059669',
                    fontWeight: 'bold'
                }}>
                    Rs. {Number(item.balance).toLocaleString()}
                </span>
            )
        },
        {
            header: 'Actions',
            accessor: (item: SupplierLedger) => (
                <button
                    onClick={() => handleViewSupplierDetails(item.id)}
                    className="px-3 py-1 rounded text-white flex items-center gap-1"
                    style={{ backgroundColor: '#8B5CF6' }}
                >
                    <FaEye /> View
                </button>
            )
        }
    ];

    // Calculate totals
    const customerTotals = filteredCustomers.reduce((acc, c) => ({
        total_purchase: acc.total_purchase + Number(c.total_purchase),
        total_cash: acc.total_cash + Number(c.total_cash),
        total_credit: acc.total_credit + Number(c.total_credit),
        total_paid: acc.total_paid + Number(c.total_paid),
        balance: acc.balance + Number(c.balance),
    }), { total_purchase: 0, total_cash: 0, total_credit: 0, total_paid: 0, balance: 0 });

    const supplierTotals = filteredSuppliers.reduce((acc, s) => ({
        total_imports: acc.total_imports + Number(s.total_imports),
        total_paid: acc.total_paid + Number(s.total_paid),
        balance: acc.balance + Number(s.balance),
    }), { total_imports: 0, total_paid: 0, balance: 0 });

    if (pageLoading) {
        return <PageSkeleton rows={6} />;
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#0F172A' }}>
                        <FaBook className="inline mr-2" />
                        General Ledger
                    </h1>
                    <p className="text-xs sm:text-sm mt-1" style={{ color: '#6B7280' }}>
                        View all customer and supplier accounts
                    </p>
                </div>
                <button
                    onClick={activeTab === 'customers' ? handleExportCustomersPDF : handleExportSuppliersPDF}
                    className="px-4 py-2 rounded-lg text-white flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
                >
                    Export PDF
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-6" style={{ borderColor: '#E5E7EB' }}>
                <button
                    onClick={() => { setActiveTab('customers'); setSearchTerm(''); }}
                    className={`px-6 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === 'customers'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FaUser />
                    Customers ({customers.length})
                </button>
                <button
                    onClick={() => { setActiveTab('suppliers'); setSearchTerm(''); }}
                    className={`px-6 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                        activeTab === 'suppliers'
                            ? 'border-purple-500 text-purple-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <FaTruck />
                    Suppliers ({suppliers.length})
                </button>
            </div>

            {/* Customer Tab Content */}
            {activeTab === 'customers' && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        <div className="p-4 rounded-lg shadow bg-gray-50">
                            <p className="text-xs" style={{ color: '#6B7280' }}>Total Purchase</p>
                            <p className="text-lg font-bold" style={{ color: '#0F172A' }}>
                                Rs. {customerTotals.total_purchase.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg shadow bg-green-50">
                            <p className="text-xs" style={{ color: '#6B7280' }}>Cash Purchases</p>
                            <p className="text-lg font-bold text-green-700">
                                Rs. {customerTotals.total_cash.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg shadow bg-amber-50">
                            <p className="text-xs" style={{ color: '#6B7280' }}>Credit Purchases</p>
                            <p className="text-lg font-bold text-amber-700">
                                Rs. {customerTotals.total_credit.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg shadow bg-emerald-50">
                            <p className="text-xs" style={{ color: '#6B7280' }}>Total Received</p>
                            <p className="text-lg font-bold text-emerald-700">
                                Rs. {customerTotals.total_paid.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg shadow" style={{ backgroundColor: customerTotals.balance > 0 ? '#FEE2E2' : '#D1FAE5' }}>
                            <p className="text-xs" style={{ color: '#6B7280' }}>Total Receivable</p>
                            <p className="text-lg font-bold" style={{ color: customerTotals.balance > 0 ? '#DC2626' : '#059669' }}>
                                Rs. {customerTotals.balance.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search by customer name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-96 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            style={{ borderColor: '#D1D5DB' }}
                        />
                    </div>

                    <DataTable
                        columns={customerColumns}
                        data={filteredCustomers}
                    />
                </>
            )}

            {/* Supplier Tab Content */}
            {activeTab === 'suppliers' && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                        <div className="p-4 rounded-lg shadow bg-purple-50">
                            <p className="text-xs" style={{ color: '#6B7280' }}>Total Imports</p>
                            <p className="text-lg font-bold text-purple-700">
                                Rs. {supplierTotals.total_imports.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg shadow bg-red-50">
                            <p className="text-xs" style={{ color: '#6B7280' }}>Total Paid</p>
                            <p className="text-lg font-bold text-red-700">
                                Rs. {supplierTotals.total_paid.toLocaleString()}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg shadow" style={{ backgroundColor: supplierTotals.balance > 0 ? '#FEE2E2' : '#D1FAE5' }}>
                            <p className="text-xs" style={{ color: '#6B7280' }}>Total Payable</p>
                            <p className="text-lg font-bold" style={{ color: supplierTotals.balance > 0 ? '#DC2626' : '#059669' }}>
                                Rs. {supplierTotals.balance.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search by supplier name or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-96 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            style={{ borderColor: '#D1D5DB' }}
                        />
                    </div>

                    <DataTable
                        columns={supplierColumns}
                        data={filteredSuppliers}
                    />
                </>
            )}
        </div>
    );
};

export default GeneralLedger;
