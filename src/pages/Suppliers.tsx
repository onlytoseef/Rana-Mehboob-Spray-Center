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

interface Supplier {
    id: number;
    name: string;
    phone: string;
    currency: string;
    ledger_balance: number;
}

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        currency: 'PKR',
    });
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchSuppliers = async () => {
        try {
            const data = await cachedGet<Supplier[]>('/suppliers');
            setSuppliers(data);
        } catch (err: any) {
            toast.error('Failed to load suppliers. Please refresh the page.');
            console.error(err);
        } finally {
            setPageLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!formData.name.trim()) {
            toast.error('Supplier name is required');
            return;
        }
        if (formData.phone && !/^[\d\s\-+()]+$/.test(formData.phone)) {
            toast.error('Please enter a valid phone number');
            return;
        }

        setLoading(true);
        try {
            if (editingId) {
                await api.put(`/suppliers/${editingId}`, formData);
                toast.success(`Supplier "${formData.name}" updated successfully!`);
            } else {
                await api.post('/suppliers', formData);
                toast.success(`Supplier "${formData.name}" added successfully!`);
            }
            setIsModalOpen(false);
            setFormData({ name: '', phone: '', currency: 'PKR' });
            setEditingId(null);
            fetchSuppliers();
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.response?.data || 'Operation failed';
            toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to save supplier');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (supplier: Supplier) => {
        setFormData({
            name: supplier.name,
            phone: supplier.phone,
            currency: supplier.currency,
        });
        setEditingId(supplier.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (supplier: Supplier) => {
        if (supplier.ledger_balance > 0) {
            toast.error(`Cannot delete "${supplier.name}" - there is an outstanding balance`);
            return;
        }
        if (window.confirm(`Are you sure you want to delete "${supplier.name}"?`)) {
            try {
                await api.delete(`/suppliers/${supplier.id}`);
                toast.success(`Supplier "${supplier.name}" deleted successfully!`);
                fetchSuppliers();
            } catch (err: any) {
                const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to delete supplier';
                toast.error(typeof errorMsg === 'string' ? errorMsg : 'Cannot delete this supplier');
                console.error(err);
            }
        }
    };

    const columns = [
        { header: 'Name', accessor: 'name' as keyof Supplier },
        { header: 'Phone', accessor: 'phone' as keyof Supplier },
        { header: 'Currency', accessor: 'currency' as keyof Supplier },
        { header: 'Ledger Balance', accessor: 'ledger_balance' as keyof Supplier },
    ];

    const handleExportPDF = () => {
        exportToPDF({
            title: 'Suppliers Report',
            columns: [
                { header: 'Name', accessor: 'name' },
                { header: 'Phone', accessor: 'phone' },
                { header: 'Currency', accessor: 'currency' },
                { header: 'Ledger Balance (PKR)', accessor: 'ledger_balance' },
            ],
            data: suppliers,
            filename: 'Suppliers_Report',
            subtitle: `Total ${suppliers.length} suppliers`,
            showTotal: { column: 'ledger_balance', label: 'Total Payables' },
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
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#242A2A' }}>Suppliers</h1>
                    <p className="text-xs sm:text-sm mt-1" style={{ color: '#6B7280' }}>Manage your supplier relationships</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleExportPDF}>
                        <FaFilePdf className="inline mr-1" /> Export PDF
                    </Button>
                    <Button onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '', phone: '', currency: 'PKR' });
                        setIsModalOpen(true);
                    }}>
                        Add Supplier
                    </Button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={suppliers}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Edit Supplier' : 'Add Supplier'}
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
                    <Input
                        label="Currency"
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
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

export default Suppliers;
