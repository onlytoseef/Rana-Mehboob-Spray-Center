import { useState, useEffect } from 'react';
import api from '../services/api';
import Button from '../components/ui/Button';
import DatePicker from '../components/ui/DatePicker';
import SelectInput from '../components/ui/SelectInput';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import useCurrencyConverter from '../hooks/useCurrencyConverter';
import toast from 'react-hot-toast';
import { FaTimes, FaBox, FaFileInvoice } from 'react-icons/fa';

interface Supplier {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    name: string;
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
    type: 'sale' | 'import';
    invoice_no?: string;
    customer_name?: string;
    supplier_name?: string;
    total_amount: number;
    discount?: number;
    created_at: string;
    items: InvoiceItem[];
}

const Reports = () => {
    const [reportType, setReportType] = useState('daily');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [invoiceModal, setInvoiceModal] = useState(false);
    const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const { formatPKR } = useCurrencyConverter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [suppRes, custRes] = await Promise.all([
                    api.get('/suppliers'),
                    api.get('/customers'),
                ]);
                setSuppliers(suppRes.data);
                setCustomers(custRes.data);
            } catch (err: any) {
                toast.error('Failed to load data');
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const fetchReport = async () => {
        // Validation
        if (reportType === 'supplier' && !selectedSupplier) {
            toast.error('Please select a supplier');
            return;
        }
        if (reportType === 'customer' && !selectedCustomer) {
            toast.error('Please select a customer');
            return;
        }

        setLoading(true);
        try {
            let endpoint = '';
            if (reportType === 'daily') {
                endpoint = `/dashboard/daily?date=${selectedDate}`;
            } else if (reportType === 'supplier' && selectedSupplier) {
                endpoint = `/dashboard/supplier/${selectedSupplier}`;
            } else if (reportType === 'customer' && selectedCustomer) {
                endpoint = `/dashboard/customer/${selectedCustomer}`;
            }
            
            if (endpoint) {
                const res = await api.get(endpoint);
                setReportData(res.data);
                toast.success('Report generated successfully!');
            }
        } catch (err: any) {
            toast.error('Failed to generate report');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = (data: any[], filename: string) => {
        if (!data || data.length === 0) {
            toast.error('No data to export');
            return;
        }
        
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => 
            Object.values(row).map(val => 
                typeof val === 'string' ? `"${val}"` : val
            ).join(',')
        );
        
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.csv`;
        a.click();
        toast.success(`${filename}.csv exported successfully!`);
    };

    // Fetch invoice details (sale or import)
    const fetchInvoiceDetails = async (invoice: any, type: 'sale' | 'import') => {
        setLoadingDetails(true);
        setInvoiceModal(true);
        try {
            const endpoint = type === 'sale' ? `/sales/${invoice.id}` : `/imports/${invoice.id}`;
            const res = await api.get(endpoint);
            const invoiceData = res.data.invoice || res.data;
            const itemsData = res.data.items || [];
            
            setInvoiceDetails({
                id: invoiceData.id,
                type,
                invoice_no: invoiceData.invoice_no,
                customer_name: invoiceData.customer_name,
                supplier_name: invoiceData.supplier_name,
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

    const salesColumns = [
        { header: 'ID', accessor: 'id' },
        { header: 'Customer', accessor: 'customer_name' },
        { header: 'Type', accessor: 'type' },
        { header: 'Total', accessor: (item: any) => formatPKR(item.total_amount) },
    ];

    const importColumns = [
        { header: 'ID', accessor: 'id' },
        { header: 'Supplier', accessor: 'supplier_name' },
        { header: 'Invoice #', accessor: 'invoice_no' },
        { header: 'Total', accessor: (item: any) => formatPKR(item.total_amount) },
    ];

    const paymentColumns = [
        { header: 'ID', accessor: 'id' },
        { header: 'Type', accessor: 'type' },
        { header: 'Partner', accessor: 'partner_name' },
        { header: 'Amount', accessor: (item: any) => formatPKR(item.amount) },
        { header: 'Method', accessor: 'method' },
    ];

    return (
        <div>
            <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#0F172A' }}>Reports</h1>
                <p className="text-xs sm:text-sm mt-1" style={{ color: '#64748B' }}>Generate daily, supplier, and customer reports</p>
            </div>

            <div className="rounded-xl shadow-md p-4 sm:p-6 mb-4 sm:mb-6 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
                    <SelectInput
                        label="Report Type"
                        options={[
                            { value: 'daily', label: 'Daily Report' },
                            { value: 'supplier', label: 'Supplier Report' },
                            { value: 'customer', label: 'Customer Report' },
                        ]}
                        value={reportType}
                        onChange={setReportType}
                    />

                    {reportType === 'daily' && (
                        <DatePicker
                            label="Select Date"
                            value={selectedDate}
                            onChange={setSelectedDate}
                        />
                    )}

                    {reportType === 'supplier' && (
                        <SelectInput
                            label="Select Supplier"
                            options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                            value={selectedSupplier}
                            onChange={setSelectedSupplier}
                        />
                    )}

                    {reportType === 'customer' && (
                        <SelectInput
                            label="Select Customer"
                            options={customers.map(c => ({ value: c.id, label: c.name }))}
                            value={selectedCustomer}
                            onChange={setSelectedCustomer}
                        />
                    )}

                    <Button onClick={fetchReport} disabled={loading}>
                        {loading ? 'Loading...' : 'Generate Report'}
                    </Button>
                </div>
            </div>

            {reportData && reportType === 'daily' && (
                <div className="space-y-4 sm:space-y-6">
                    <div className="rounded-xl shadow-md p-4 sm:p-6 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4">
                            <h2 className="text-lg sm:text-xl font-bold" style={{ color: '#0F172A' }}>Sales - {selectedDate}</h2>
                            <Button variant="secondary" size="sm" onClick={() => exportToCSV(reportData.sales || [], `sales-${selectedDate}`)}>
                                Export CSV
                            </Button>
                        </div>
                        <DataTable 
                            columns={salesColumns} 
                            data={reportData.sales || []} 
                            onRowClick={(item: any) => fetchInvoiceDetails(item, 'sale')}
                        />
                        <p className="mt-4 text-right font-bold text-sm sm:text-base" style={{ color: '#0F172A' }}>
                            Total: {formatPKR((reportData.sales || []).reduce((sum: number, s: any) => sum + parseFloat(s.total_amount || 0), 0))}
                        </p>
                    </div>

                    <div className="rounded-xl shadow-md p-4 sm:p-6 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4">
                            <h2 className="text-lg sm:text-xl font-bold" style={{ color: '#0F172A' }}>Imports - {selectedDate}</h2>
                            <Button variant="secondary" size="sm" onClick={() => exportToCSV(reportData.imports || [], `imports-${selectedDate}`)}>
                                Export CSV
                            </Button>
                        </div>
                        <DataTable 
                            columns={importColumns} 
                            data={reportData.imports || []} 
                            onRowClick={(item: any) => fetchInvoiceDetails(item, 'import')}
                        />
                    </div>

                    <div className="rounded-xl shadow-md p-4 sm:p-6 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4">
                            <h2 className="text-lg sm:text-xl font-bold" style={{ color: '#0F172A' }}>Payments - {selectedDate}</h2>
                            <Button variant="secondary" size="sm" onClick={() => exportToCSV(reportData.payments || [], `payments-${selectedDate}`)}>
                                Export CSV
                            </Button>
                        </div>
                        <DataTable columns={paymentColumns} data={reportData.payments || []} />
                    </div>
                </div>
            )}

            {reportData && reportType === 'supplier' && (
                <div className="space-y-4 sm:space-y-6">
                    <div className="rounded-xl shadow-md p-4 sm:p-6 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                        <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4" style={{ color: '#0F172A' }}>Supplier: {reportData.supplier?.name}</h2>
                        <p className="text-base sm:text-lg" style={{ color: '#64748B' }}>Outstanding Balance: <span className="font-bold" style={{ color: '#EF4444' }}>{formatPKR(reportData.supplier?.ledger_balance || 0)}</span></p>
                    </div>
                    
                    <div className="rounded-xl shadow-md p-4 sm:p-6 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4">
                            <h3 className="text-base sm:text-lg font-bold" style={{ color: '#0F172A' }}>Import History</h3>
                            <Button variant="secondary" size="sm" onClick={() => exportToCSV(reportData.invoices || [], `supplier-imports`)}>
                                Export CSV
                            </Button>
                        </div>
                        <DataTable 
                            columns={importColumns} 
                            data={reportData.invoices || []} 
                            onRowClick={(item: any) => fetchInvoiceDetails(item, 'import')}
                        />
                    </div>

                    <div className="rounded-xl shadow-md p-4 sm:p-6 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4">
                            <h3 className="text-base sm:text-lg font-bold" style={{ color: '#0F172A' }}>Payment History</h3>
                            <Button variant="secondary" size="sm" onClick={() => exportToCSV(reportData.payments || [], `supplier-payments`)}>
                                Export CSV
                            </Button>
                        </div>
                        <DataTable columns={paymentColumns} data={reportData.payments || []} />
                    </div>
                </div>
            )}

            {reportData && reportType === 'customer' && (
                <div className="space-y-4 sm:space-y-6">
                    <div className="rounded-xl shadow-md p-4 sm:p-6 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                        <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-4" style={{ color: '#0F172A' }}>Customer: {reportData.customer?.name}</h2>
                        <p className="text-base sm:text-lg" style={{ color: '#64748B' }}>Outstanding Balance: <span className="font-bold" style={{ color: '#10B981' }}>{formatPKR(reportData.customer?.ledger_balance || 0)}</span></p>
                    </div>
                    
                    <div className="rounded-xl shadow-md p-4 sm:p-6 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4">
                            <h3 className="text-base sm:text-lg font-bold" style={{ color: '#0F172A' }}>Sales History</h3>
                            <Button variant="secondary" size="sm" onClick={() => exportToCSV(reportData.invoices || [], `customer-sales`)}>
                                Export CSV
                            </Button>
                        </div>
                        <DataTable 
                            columns={salesColumns} 
                            data={reportData.invoices || []} 
                            onRowClick={(item: any) => fetchInvoiceDetails(item, 'sale')}
                        />
                    </div>

                    <div className="rounded-xl shadow-md p-4 sm:p-6 border" style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-4">
                            <h3 className="text-base sm:text-lg font-bold" style={{ color: '#0F172A' }}>Payment History</h3>
                            <Button variant="secondary" size="sm" onClick={() => exportToCSV(reportData.payments || [], `customer-payments`)}>
                                Export CSV
                            </Button>
                        </div>
                        <DataTable columns={paymentColumns} data={reportData.payments || []} />
                    </div>
                </div>
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
                                    {invoiceDetails?.type === 'sale' ? 'Sale' : 'Import'} Invoice Details
                                </h2>
                            </div>
                            <button 
                                onClick={() => { setInvoiceModal(false); setInvoiceDetails(null); }}
                                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
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
                                                {invoiceDetails.type === 'sale' ? `SALE-${invoiceDetails.id}` : invoiceDetails.invoice_no || `IMP-${invoiceDetails.id}`}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs" style={{ color: '#64748B' }}>
                                                {invoiceDetails.type === 'sale' ? 'Customer' : 'Supplier'}
                                            </p>
                                            <p className="font-semibold" style={{ color: '#0F172A' }}>
                                                {invoiceDetails.customer_name || invoiceDetails.supplier_name || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs" style={{ color: '#64748B' }}>Date</p>
                                            <p className="font-semibold" style={{ color: '#0F172A' }}>
                                                {new Date(invoiceDetails.created_at).toLocaleDateString('en-PK')}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs" style={{ color: '#64748B' }}>Total Amount</p>
                                            <p className="font-bold" style={{ color: '#6366F1' }}>
                                                {formatPKR(invoiceDetails.total_amount)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Products Table */}
                                    <div className="mb-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FaBox style={{ color: '#6366F1' }} />
                                            <h3 className="font-semibold" style={{ color: '#0F172A' }}>Products</h3>
                                        </div>
                                        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: '#E2E8F0' }}>
                                            <table className="min-w-full">
                                                <thead style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}>
                                                    <tr>
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
                                                                <td className="py-3 px-4 text-sm" style={{ color: '#0F172A' }}>
                                                                    {item.product_name}
                                                                </td>
                                                                <td className="py-3 px-4 text-sm text-right" style={{ color: '#0F172A' }}>
                                                                    {item.quantity}
                                                                </td>
                                                                <td className="py-3 px-4 text-sm text-right" style={{ color: '#0F172A' }}>
                                                                    {formatPKR(item.unit_price)}
                                                                </td>
                                                                <td className="py-3 px-4 text-sm text-right font-medium" style={{ color: '#0F172A' }}>
                                                                    {formatPKR(item.total_price)}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={4} className="py-8 text-center text-sm" style={{ color: '#64748B' }}>
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
                                            {invoiceDetails.discount && invoiceDetails.discount > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span style={{ color: '#64748B' }}>Discount:</span>
                                                    <span style={{ color: '#EF4444' }}>-{formatPKR(invoiceDetails.discount)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between font-bold border-t pt-2" style={{ borderColor: '#E2E8F0' }}>
                                                <span style={{ color: '#0F172A' }}>Total:</span>
                                                <span style={{ color: '#6366F1' }}>{formatPKR(invoiceDetails.total_amount)}</span>
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

export default Reports;
