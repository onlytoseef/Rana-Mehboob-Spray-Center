import React, { useState, useEffect } from 'react';
import api, { cachedGet } from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import DataTable from '../components/ui/DataTable';
import toast from 'react-hot-toast';
import { exportToPDF } from '../utils/pdfExport';
import { FaFilePdf } from 'react-icons/fa';
import { PageSkeleton } from '../components/ui/Skeleton';

interface Customer {
    id: number;
    name: string;
    phone: string;
    ledger_balance: number;
}

const Customers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
    });
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchCustomers = async () => {
        try {
            const data = await cachedGet<Customer[]>('/customers');
            setCustomers(data);
        } catch (err: any) {
            toast.error('Failed to load customers. Please refresh the page.');
            console.error(err);
        } finally {
            setPageLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!formData.name.trim()) {
            toast.error('Customer name is required');
            return;
        }
        if (formData.phone && !/^[\d\s\-+()]+$/.test(formData.phone)) {
            toast.error('Please enter a valid phone number');
            return;
        }

        setLoading(true);
        try {
            if (editingId) {
                await api.put(`/customers/${editingId}`, formData);
                toast.success(`Customer "${formData.name}" updated successfully!`);
            } else {
                await api.post('/customers', formData);
                toast.success(`Customer "${formData.name}" added successfully!`);
            }
            setIsModalOpen(false);
            setFormData({ name: '', phone: '' });
            setEditingId(null);
            fetchCustomers();
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.response?.data || 'Operation failed';
            toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to save customer');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (customer: Customer) => {
        setFormData({
            name: customer.name,
            phone: customer.phone,
        });
        setEditingId(customer.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (customer: Customer) => {
        if (customer.ledger_balance > 0) {
            toast.error(`Cannot delete "${customer.name}" - there is an outstanding balance`);
            return;
        }
        if (window.confirm(`Are you sure you want to delete "${customer.name}"?`)) {
            try {
                await api.delete(`/customers/${customer.id}`);
                toast.success(`Customer "${customer.name}" deleted successfully!`);
                fetchCustomers();
            } catch (err: any) {
                const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to delete customer';
                toast.error(typeof errorMsg === 'string' ? errorMsg : 'Cannot delete this customer');
                console.error(err);
            }
        }
    };

    const columns = [
        { header: 'Name', accessor: 'name' as keyof Customer },
        { header: 'Phone', accessor: 'phone' as keyof Customer },
        { header: 'Ledger Balance', accessor: 'ledger_balance' as keyof Customer },
    ];

    const handleExportPDF = () => {
        exportToPDF({
            title: 'Customers Report',
            columns: [
                { header: 'Name', accessor: 'name' },
                { header: 'Phone', accessor: 'phone' },
                { header: 'Ledger Balance (PKR)', accessor: 'ledger_balance' },
            ],
            data: customers,
            filename: 'Customers_Report',
            subtitle: `Total ${customers.length} customers`,
            showTotal: { column: 'ledger_balance', label: 'Total Receivables' },
        });
        toast.success('PDF exported successfully!');
    };

    if (pageLoading) {
        return <PageSkeleton rows={5} />;
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#242A2A' }}>Customers</h1>
                    <p className="text-xs sm:text-sm mt-1" style={{ color: '#6B7280' }}>Manage your customer database</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleExportPDF}>
                        <FaFilePdf className="inline mr-1" /> Export PDF
                    </Button>
                    <Button onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '', phone: '' });
                        setIsModalOpen(true);
                    }}>
                        Add Customer
                    </Button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={customers}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Edit Customer' : 'Add Customer'}
            >
                <form onSubmit={handleSubmit}>
                    <Input
                        label="Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <div className="flex justify-end space-x-3 mt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : (editingId ? 'Update' : 'Save')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Customers;
