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

interface Product {
    id: number;
    name: string;
    category: string;
    unit: string;
    opening_stock: number;
    opening_cost: number;
    current_stock: number;
}

interface Category {
    id: number;
    name: string;
}

const Products = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        unit: '',
        opening_stock: 0,
        opening_cost: 0,
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    
    // Category management state
    const [newCategory, setNewCategory] = useState('');
    const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [categoryLoading, setCategoryLoading] = useState(false);

    const fetchProducts = async () => {
        try {
            const data = await cachedGet<Product[]>('/products');
            setProducts(data);
        } catch (err: any) {
            toast.error('Failed to load products. Please refresh the page.');
            console.error(err);
        } finally {
            setPageLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await cachedGet<Category[]>('/categories');
            setCategories(data);
        } catch (err: any) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!formData.name.trim()) {
            toast.error('Product name is required');
            return;
        }
        if (!editingId && formData.opening_stock < 0) {
            toast.error('Opening stock cannot be negative');
            return;
        }
        if (!editingId && formData.opening_cost < 0) {
            toast.error('Opening cost cannot be negative');
            return;
        }

        setLoading(true);
        try {
            if (editingId) {
                await api.put(`/products/${editingId}`, formData);
                toast.success(`Product "${formData.name}" updated successfully!`);
            } else {
                await api.post('/products', formData);
                toast.success(`Product "${formData.name}" added successfully!`);
            }
            setIsModalOpen(false);
            setFormData({ name: '', category: '', unit: '', opening_stock: 0, opening_cost: 0 });
            setEditingId(null);
            fetchProducts();
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.response?.data || 'Operation failed';
            toast.error(typeof errorMsg === 'string' ? errorMsg : 'Failed to save product');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product: Product) => {
        setFormData({
            name: product.name,
            category: product.category,
            unit: product.unit,
            opening_stock: product.opening_stock,
            opening_cost: product.opening_cost,
        });
        setEditingId(product.id);
        setIsModalOpen(true);
    };

    const handleDelete = async (product: Product) => {
        if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
            try {
                await api.delete(`/products/${product.id}`);
                toast.success(`Product "${product.name}" deleted successfully!`);
                fetchProducts();
            } catch (err: any) {
                const errorMsg = err.response?.data?.message || err.response?.data || 'Failed to delete product';
                toast.error(typeof errorMsg === 'string' ? errorMsg : 'Cannot delete this product');
                console.error(err);
            }
        }
    };

    // Category management functions
    const handleAddCategory = async () => {
        if (!newCategory.trim()) {
            toast.error('Category name is required');
            return;
        }
        setCategoryLoading(true);
        try {
            await api.post('/categories', { name: newCategory.trim() });
            toast.success(`Category "${newCategory}" added successfully!`);
            setNewCategory('');
            fetchCategories();
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to add category';
            toast.error(errorMsg);
        } finally {
            setCategoryLoading(false);
        }
    };

    const handleUpdateCategory = async (id: number) => {
        if (!editingCategoryName.trim()) {
            toast.error('Category name is required');
            return;
        }
        setCategoryLoading(true);
        try {
            await api.put(`/categories/${id}`, { name: editingCategoryName.trim() });
            toast.success('Category updated successfully!');
            setEditingCategoryId(null);
            setEditingCategoryName('');
            fetchCategories();
            fetchProducts(); // Refresh products as category name might have changed
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to update category';
            toast.error(errorMsg);
        } finally {
            setCategoryLoading(false);
        }
    };

    const handleDeleteCategory = async (category: Category) => {
        if (window.confirm(`Are you sure you want to delete category "${category.name}"?`)) {
            try {
                await api.delete(`/categories/${category.id}`);
                toast.success(`Category "${category.name}" deleted successfully!`);
                fetchCategories();
            } catch (err: any) {
                const errorMsg = err.response?.data?.message || 'Failed to delete category';
                toast.error(errorMsg);
            }
        }
    };

    const columns = [
        { header: 'Name', accessor: 'name' as keyof Product },
        { header: 'Category', accessor: 'category' as keyof Product },
        { header: 'Unit', accessor: 'unit' as keyof Product },
        { header: 'Current Stock', accessor: 'current_stock' as keyof Product },
    ];

    const handleExportPDF = () => {
        exportToPDF({
            title: 'Products Report',
            columns: [
                { header: 'Name', accessor: 'name' },
                { header: 'Category', accessor: 'category' },
                { header: 'Unit', accessor: 'unit' },
                { header: 'Opening Stock', accessor: 'opening_stock' },
                { header: 'Opening Cost', accessor: 'opening_cost' },
                { header: 'Current Stock', accessor: 'current_stock' },
            ],
            data: products,
            filename: 'Products_Report',
            subtitle: `Total ${products.length} products`,
        });
        toast.success('PDF exported successfully!');
    };

    if (pageLoading) {
        return <PageSkeleton rows={6} />;
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#242A2A' }}>Products</h1>
                    <p className="text-xs sm:text-sm mt-1" style={{ color: '#6B7280' }}>Manage your inventory items</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button variant="secondary" onClick={handleExportPDF}>
                        <FaFilePdf className="inline mr-1" /> Export PDF
                    </Button>
                    <Button variant="secondary" onClick={() => setIsCategoryModalOpen(true)}>
                        Manage Categories
                    </Button>
                    <Button onClick={() => {
                        setEditingId(null);
                        setFormData({ name: '', category: '', unit: '', opening_stock: 0, opening_cost: 0 });
                        setIsModalOpen(true);
                    }}>
                        Add Product
                    </Button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={products}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? 'Edit Product' : 'Add Product'}
            >
                <form onSubmit={handleSubmit}>
                    <Input
                        label="Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <div className="mb-3">
                        <label className="block text-sm font-medium mb-1" style={{ color: '#242A2A' }}>
                            Category
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#D1D5DB', backgroundColor: 'white' }}
                        >
                            <option value="">Select Category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <Input
                        label="Unit"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    />
                    {!editingId && (
                        <>
                            <Input
                                label="Opening Stock"
                                type="number"
                                value={formData.opening_stock}
                                onChange={(e) => setFormData({ ...formData, opening_stock: Number(e.target.value) })}
                            />
                            <Input
                                label="Opening Cost"
                                type="number"
                                value={formData.opening_cost}
                                onChange={(e) => setFormData({ ...formData, opening_cost: Number(e.target.value) })}
                            />
                        </>
                    )}
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

            {/* Category Management Modal */}
            <Modal
                isOpen={isCategoryModalOpen}
                onClose={() => {
                    setIsCategoryModalOpen(false);
                    setEditingCategoryId(null);
                    setEditingCategoryName('');
                    setNewCategory('');
                }}
                title="Manage Categories"
            >
                <div className="space-y-4">
                    {/* Add New Category */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="New category name"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#D1D5DB' }}
                        />
                        <Button 
                            onClick={handleAddCategory} 
                            disabled={categoryLoading || !newCategory.trim()}
                        >
                            Add
                        </Button>
                    </div>

                    {/* Categories List */}
                    <div className="border rounded-lg divide-y max-h-64 overflow-y-auto" style={{ borderColor: '#D1D5DB' }}>
                        {categories.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                No categories yet. Add one above.
                            </div>
                        ) : (
                            categories.map((category) => (
                                <div key={category.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                    {editingCategoryId === category.id ? (
                                        <div className="flex gap-2 flex-1">
                                            <input
                                                type="text"
                                                value={editingCategoryName}
                                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory(category.id)}
                                                className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2"
                                                style={{ borderColor: '#D1D5DB' }}
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleUpdateCategory(category.id)}
                                                disabled={categoryLoading}
                                                className="px-2 py-1 text-sm rounded"
                                                style={{ backgroundColor: '#242A2A', color: '#EBE0C0' }}
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingCategoryId(null);
                                                    setEditingCategoryName('');
                                                }}
                                                className="px-2 py-1 text-sm border rounded"
                                                style={{ borderColor: '#D1D5DB' }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <span style={{ color: '#242A2A' }}>{category.name}</span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingCategoryId(category.id);
                                                        setEditingCategoryName(category.name);
                                                    }}
                                                    className="text-sm px-2 py-1 rounded hover:bg-gray-200"
                                                    style={{ color: '#242A2A' }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCategory(category)}
                                                    className="text-sm px-2 py-1 rounded hover:bg-red-100 text-red-600"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex justify-end mt-4">
                        <Button variant="secondary" onClick={() => {
                            setIsCategoryModalOpen(false);
                            setEditingCategoryId(null);
                            setEditingCategoryName('');
                            setNewCategory('');
                        }}>
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Products;
