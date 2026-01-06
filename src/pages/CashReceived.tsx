import { useState, useEffect } from 'react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import DataTable from '../components/ui/DataTable';
import toast from 'react-hot-toast';
import { PageSkeleton } from '../components/ui/Skeleton';
import { FaHandHoldingUsd } from 'react-icons/fa';

interface Customer {
    id: number;
    name: string;
    ledger_balance: number;
}

interface Receipt {
    id: number;
    customer_id: number;
    customer_name: string;
    amount: number;
    payment_type: string;
    reference: string;
    notes: string;
    created_at: string;
}

const CashReceived = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        customer_id: '',
        amount: 0,
        reference: '',
        notes: '',
    });

    const fetchData = async () => {
        try {
            const [customersRes, receiptsRes] = await Promise.all([
                api.get('/customers'),
                api.get('/payments/cash-received')
            ]);
            setCustomers(customersRes.data);
            setReceipts(receiptsRes.data);
        } catch (err: any) {
            toast.error('Failed to load data');
            console.error(err);
        } finally {
            setPageLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.customer_id) {
            toast.error('Please select a customer');
            return;
        }
        if (formData.amount <= 0) {
            toast.error('Amount must be greater than 0');
            return;
        }

        setLoading(true);
        try {
            await api.post('/payments/cash-received', formData);
            toast.success('Cash receipt recorded successfully!');
            setIsModalOpen(false);
            setFormData({ customer_id: '', amount: 0, reference: '', notes: '' });
            fetchData();
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to record receipt';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const selectedCustomer = customers.find(c => c.id.toString() === formData.customer_id);

    const columns = [
        { header: 'Date', accessor: (item: Receipt) => new Date(item.created_at).toLocaleDateString('en-PK') },
        { header: 'Customer', accessor: 'customer_name' as keyof Receipt },
        { header: 'Amount', accessor: (item: Receipt) => `Rs. ${Number(item.amount).toLocaleString()}` },
        { header: 'Reference', accessor: 'reference' as keyof Receipt },
        { header: 'Notes', accessor: 'notes' as keyof Receipt },
    ];

    if (pageLoading) {
        return <PageSkeleton rows={5} />;
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#242A2A' }}>
                        <FaHandHoldingUsd className="inline mr-2" />
                        Cash Received
                    </h1>
                    <p className="text-xs sm:text-sm mt-1" style={{ color: '#6B7280' }}>
                        Record cash payments received from customers
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    New Receipt
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={receipts}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Record Cash Received"
            >
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1" style={{ color: '#242A2A' }}>
                            Customer
                        </label>
                        <select
                            value={formData.customer_id}
                            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#D1D5DB' }}
                            required
                        >
                            <option value="">Select Customer</option>
                            {customers.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} (Balance: Rs. {Number(c.ledger_balance).toLocaleString()})
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedCustomer && (
                        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: selectedCustomer.ledger_balance > 0 ? '#FEE2E2' : '#D1FAE5' }}>
                            <p className="text-sm font-medium" style={{ color: selectedCustomer.ledger_balance > 0 ? '#991B1B' : '#065F46' }}>
                                {selectedCustomer.ledger_balance > 0 
                                    ? `Outstanding: Rs. ${Number(selectedCustomer.ledger_balance).toLocaleString()}`
                                    : 'No outstanding balance'
                                }
                            </p>
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1" style={{ color: '#242A2A' }}>
                            Amount Received (PKR)
                        </label>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#D1D5DB' }}
                            min="1"
                            required
                        />
                        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
                            This will reduce customer's receivable balance
                        </p>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1" style={{ color: '#242A2A' }}>
                            Reference (Receipt/Check No.)
                        </label>
                        <input
                            type="text"
                            value={formData.reference}
                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#D1D5DB' }}
                            placeholder="Optional"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1" style={{ color: '#242A2A' }}>
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#D1D5DB' }}
                            rows={2}
                            placeholder="Optional notes"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 mt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Recording...' : 'Record Receipt'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CashReceived;
