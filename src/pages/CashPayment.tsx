import { useState, useEffect } from 'react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import DataTable from '../components/ui/DataTable';
import toast from 'react-hot-toast';
import { PageSkeleton } from '../components/ui/Skeleton';
import { FaMoneyCheckAlt } from 'react-icons/fa';

interface Supplier {
    id: number;
    name: string;
    ledger_balance: number;
}

interface Payment {
    id: number;
    supplier_id: number;
    supplier_name: string;
    amount: number;
    payment_type: string;
    reference: string;
    notes: string;
    created_at: string;
}

const CashPayment = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    
    const [formData, setFormData] = useState({
        supplier_id: '',
        amount: 0,
        reference: '',
        notes: '',
    });

    const fetchData = async () => {
        try {
            const [suppliersRes, paymentsRes] = await Promise.all([
                api.get('/suppliers'),
                api.get('/payments/supplier-payments')
            ]);
            setSuppliers(suppliersRes.data);
            setPayments(paymentsRes.data);
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
        
        if (!formData.supplier_id) {
            toast.error('Please select a supplier');
            return;
        }
        if (formData.amount <= 0) {
            toast.error('Amount must be greater than 0');
            return;
        }

        setLoading(true);
        try {
            await api.post('/payments/supplier-payment', {
                ...formData,
                payment_type: 'cash'
            });
            toast.success('Payment recorded successfully!');
            setIsModalOpen(false);
            setFormData({ supplier_id: '', amount: 0, reference: '', notes: '' });
            fetchData();
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to record payment';
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const selectedSupplier = suppliers.find(s => s.id.toString() === formData.supplier_id);

    const columns = [
        { header: 'Date', accessor: (item: Payment) => new Date(item.created_at).toLocaleDateString('en-PK') },
        { header: 'Supplier', accessor: 'supplier_name' as keyof Payment },
        { header: 'Amount', accessor: (item: Payment) => `Rs. ${Number(item.amount).toLocaleString()}` },
        { header: 'Reference', accessor: 'reference' as keyof Payment },
        { header: 'Notes', accessor: 'notes' as keyof Payment },
    ];

    if (pageLoading) {
        return <PageSkeleton rows={5} />;
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#242A2A' }}>
                        <FaMoneyCheckAlt className="inline mr-2" />
                        Cash Payment to Suppliers
                    </h1>
                    <p className="text-xs sm:text-sm mt-1" style={{ color: '#6B7280' }}>
                        Record cash payments made to suppliers
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    New Payment
                </Button>
            </div>

            <DataTable
                columns={columns}
                data={payments}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Record Cash Payment"
            >
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1" style={{ color: '#242A2A' }}>
                            Supplier
                        </label>
                        <select
                            value={formData.supplier_id}
                            onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#D1D5DB' }}
                            required
                        >
                            <option value="">Select Supplier</option>
                            {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} (Balance: Rs. {Number(s.ledger_balance).toLocaleString()})
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedSupplier && (
                        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#FEF3C7' }}>
                            <p className="text-sm font-medium" style={{ color: '#92400E' }}>
                                Outstanding Balance: Rs. {Number(selectedSupplier.ledger_balance).toLocaleString()}
                            </p>
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1" style={{ color: '#242A2A' }}>
                            Amount (PKR)
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
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1" style={{ color: '#242A2A' }}>
                            Reference (Check/Transaction No.)
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
                            {loading ? 'Recording...' : 'Record Payment'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CashPayment;
