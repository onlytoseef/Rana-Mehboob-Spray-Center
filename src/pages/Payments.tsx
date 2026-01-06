import React, { useState, useEffect } from 'react';
import api, { cachedGet } from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import SelectInput from '../components/ui/SelectInput';
import NumberInput from '../components/ui/NumberInput';
import DataTable from '../components/ui/DataTable';
import useCurrencyConverter from '../hooks/useCurrencyConverter';
import toast from 'react-hot-toast';

interface Payment {
    id: number;
    type: string;
    partner_id: number;
    partner_name: string;
    amount: number;
    method: string;
    created_at: string;
}

interface Customer {
    id: number;
    name: string;
    ledger_balance: number;
}

interface Supplier {
    id: number;
    name: string;
    ledger_balance: number;
}

const Payments = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { formatPKR } = useCurrencyConverter();

    const [formData, setFormData] = useState({
        type: 'customer',
        partner_id: '',
        amount: 0,
        method: 'cash',
    });

    const fetchPayments = async () => {
        try {
            const res = await api.get('/payments');
            setPayments(res.data);
        } catch (err: any) {
            toast.error('Failed to load payments');
            console.error(err);
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

    const fetchSuppliers = async () => {
        try {
            const data = await cachedGet<Supplier[]>('/suppliers');
            setSuppliers(data);
        } catch (err: any) {
            toast.error('Failed to load suppliers');
            console.error(err);
        }
    };

    useEffect(() => {
        fetchPayments();
        fetchCustomers();
        fetchSuppliers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!formData.partner_id) {
            toast.error(`Please select a ${formData.type === 'customer' ? 'customer' : 'supplier'}`);
            return;
        }
        if (formData.amount <= 0) {
            toast.error('Amount must be greater than 0');
            return;
        }

        // Check if payment exceeds balance
        if (formData.type === 'customer') {
            const customer = customers.find(c => c.id === Number(formData.partner_id));
            if (customer && formData.amount > customer.ledger_balance) {
                toast.error(`Warning: Amount exceeds customer balance (${formatPKR(customer.ledger_balance)})`);
            }
        } else {
            const supplier = suppliers.find(s => s.id === Number(formData.partner_id));
            if (supplier && formData.amount > supplier.ledger_balance) {
                toast.error(`Warning: Amount exceeds supplier payable (${formatPKR(supplier.ledger_balance)})`);
            }
        }

        setLoading(true);
        try {
            await api.post('/payments', formData);
            const partnerName = formData.type === 'customer' 
                ? customers.find(c => c.id === Number(formData.partner_id))?.name 
                : suppliers.find(s => s.id === Number(formData.partner_id))?.name;
            toast.success(`Payment of ${formatPKR(formData.amount)} ${formData.type === 'customer' ? 'received from' : 'paid to'} ${partnerName} recorded!`);
            setIsModalOpen(false);
            setFormData({ type: 'customer', partner_id: '', amount: 0, method: 'cash' });
            fetchPayments();
            fetchCustomers();
            fetchSuppliers();
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to record payment';
            toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to record payment');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getPartnerOptions = () => {
        if (formData.type === 'customer') {
            return customers.map(c => ({ 
                value: c.id, 
                label: `${c.name} (Balance: ${formatPKR(c.ledger_balance)})` 
            }));
        } else {
            return suppliers.map(s => ({ 
                value: s.id, 
                label: `${s.name} (Payable: ${formatPKR(s.ledger_balance)})` 
            }));
        }
    };

    const columns = [
        { header: 'ID', accessor: 'id' as keyof Payment },
        { header: 'Type', accessor: (item: Payment) => (
            <span className={`px-2 py-1 rounded text-xs ${item.type === 'customer' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {item.type === 'customer' ? 'From Customer' : 'To Supplier'}
            </span>
        )},
        { header: 'Partner', accessor: 'partner_name' as keyof Payment },
        { header: 'Amount', accessor: (item: Payment) => formatPKR(item.amount) },
        { header: 'Method', accessor: (item: Payment) => (
            <span className={`px-2 py-1 rounded text-xs ${item.method === 'cash' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                {item.method}
            </span>
        )},
        { header: 'Date', accessor: (item: Payment) => new Date(item.created_at).toLocaleDateString() },
    ];

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#242A2A' }}>Payments</h1>
                    <p className="text-xs sm:text-sm mt-1" style={{ color: '#6B7280' }}>Track receipts and payments</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>Record Payment</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className="rounded-xl shadow-md p-4 sm:p-6 border-2" style={{ backgroundColor: '#FFFFFF', borderColor: '#EBE0C0' }}>
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: '#242A2A' }}>Customer Balances (Receivables)</h3>
                    <ul className="space-y-2 text-sm sm:text-base max-h-48 overflow-y-auto">
                        {customers.filter(c => c.ledger_balance > 0).map(c => (
                            <li key={c.id} className="flex justify-between py-1 border-b" style={{ borderColor: '#EBE0C0' }}>
                                <span className="truncate mr-2" style={{ color: '#242A2A' }}>{c.name}</span>
                                <span className="font-semibold whitespace-nowrap" style={{ color: '#10B981' }}>{formatPKR(c.ledger_balance)}</span>
                            </li>
                        ))}
                        {customers.filter(c => c.ledger_balance > 0).length === 0 && (
                            <li style={{ color: '#6B7280' }}>No outstanding receivables</li>
                        )}
                    </ul>
                </div>
                <div className="rounded-xl shadow-md p-4 sm:p-6 border-2" style={{ backgroundColor: '#FFFFFF', borderColor: '#EBE0C0' }}>
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4" style={{ color: '#242A2A' }}>Supplier Balances (Payables)</h3>
                    <ul className="space-y-2 text-sm sm:text-base max-h-48 overflow-y-auto">
                        {suppliers.filter(s => s.ledger_balance > 0).map(s => (
                            <li key={s.id} className="flex justify-between py-1 border-b" style={{ borderColor: '#EBE0C0' }}>
                                <span className="truncate mr-2" style={{ color: '#242A2A' }}>{s.name}</span>
                                <span className="font-semibold whitespace-nowrap" style={{ color: '#EF4444' }}>{formatPKR(s.ledger_balance)}</span>
                            </li>
                        ))}
                        {suppliers.filter(s => s.ledger_balance > 0).length === 0 && (
                            <li style={{ color: '#6B7280' }}>No outstanding payables</li>
                        )}
                    </ul>
                </div>
            </div>

            <DataTable columns={columns} data={payments} />

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Payment">
                <form onSubmit={handleSubmit}>
                    <SelectInput
                        label="Payment Type"
                        options={[
                            { value: 'customer', label: 'Receive from Customer' },
                            { value: 'supplier', label: 'Pay to Supplier' },
                        ]}
                        value={formData.type}
                        onChange={(v) => setFormData({ ...formData, type: v, partner_id: '' })}
                    />
                    <SelectInput
                        label={formData.type === 'customer' ? 'Customer' : 'Supplier'}
                        options={getPartnerOptions()}
                        value={formData.partner_id}
                        onChange={(v) => setFormData({ ...formData, partner_id: v })}
                    />
                    <NumberInput
                        label="Amount (PKR)"
                        value={formData.amount}
                        onChange={(v) => setFormData({ ...formData, amount: v })}
                        min={0}
                        step={0.01}
                    />
                    <SelectInput
                        label="Payment Method"
                        options={[
                            { value: 'cash', label: 'Cash' },
                            { value: 'bank', label: 'Bank Transfer' },
                        ]}
                        value={formData.method}
                        onChange={(v) => setFormData({ ...formData, method: v })}
                    />
                    <div className="flex justify-end space-x-3 mt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Recording...' : 'Record Payment'}</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Payments;
