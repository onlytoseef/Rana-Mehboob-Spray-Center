import { forwardRef } from 'react';

interface InvoiceItem {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface InvoiceData {
    invoice_no: string;
    type: string;
    supplier_name?: string;
    customer_name?: string;
    price?: number;
    total_amount: number;
    status: string;
    created_at: string;
}

interface PrintInvoiceProps {
    invoice: InvoiceData;
    items: InvoiceItem[];
    invoiceType: 'import' | 'sales';
    companyInfo?: {
        name: string;
        address: string;
        phone: string;
        email?: string;
    };
}

const PrintInvoice = forwardRef<HTMLDivElement, PrintInvoiceProps>(
    ({ invoice, items, invoiceType, companyInfo }, ref) => {
        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('en-PK', {
                style: 'currency',
                currency: 'PKR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(amount || 0);
        };

        const formatDate = (dateString: string) => {
            return new Date(dateString).toLocaleDateString('en-PK', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        };

        const company = companyInfo || {
            name: 'Mehboob Spray Center',
            address: 'Main GT Road, Gujranwala, Punjab, Pakistan',
            phone: '+92 300 1234567',
            email: 'info@mehboobspraycenter.com',
        };

        const partnerLabel = invoiceType === 'import' ? 'Supplier' : 'Customer';
        const partnerName = invoiceType === 'import' ? invoice.supplier_name : invoice.customer_name;

        return (
            <div
                ref={ref}
                className="print-invoice"
                style={{
                    width: '148mm',
                    minHeight: '210mm',
                    padding: '10mm',
                    backgroundColor: '#ffffff',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '11px',
                    color: '#0F172A',
                    boxSizing: 'border-box',
                }}
            >
                {/* Header */}
                <div style={{ borderBottom: '3px solid #6366F1', paddingBottom: '8px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ 
                                margin: 0, 
                                fontSize: '20px', 
                                fontWeight: 'bold', 
                                color: '#6366F1',
                                letterSpacing: '1px'
                            }}>
                                {company.name}
                            </h1>
                            <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#64748B' }}>
                                {company.address}
                            </p>
                            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#64748B' }}>
                                Phone: {company.phone}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h2 style={{ 
                                margin: 0, 
                                fontSize: '16px', 
                                fontWeight: 'bold',
                                color: invoiceType === 'import' ? '#6366F1' : '#8B5CF6',
                                textTransform: 'uppercase'
                            }}>
                                {invoiceType === 'import' ? 'Purchase Invoice' : 'Sales Invoice'}
                            </h2>
                            <p style={{ 
                                margin: '4px 0 0 0', 
                                fontSize: '12px', 
                                fontWeight: 'bold',
                                color: '#0F172A'
                            }}>
                                #{invoice.invoice_no}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Invoice Info */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '15px',
                    padding: '10px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '4px'
                }}>
                    <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '10px', color: '#6B7280', textTransform: 'uppercase' }}>
                            {partnerLabel}
                        </p>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#242A2A' }}>
                            {partnerName || 'N/A'}
                        </p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '10px', color: '#6B7280', textTransform: 'uppercase' }}>
                            Date
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: '500', color: '#242A2A' }}>
                            {formatDate(invoice.created_at)}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '10px', color: '#6B7280', textTransform: 'uppercase' }}>
                            Payment Type
                        </p>
                        <p style={{ 
                            margin: 0, 
                            fontSize: '12px', 
                            fontWeight: 'bold',
                            color: invoice.type === 'cash' ? '#047857' : '#DC2626',
                            textTransform: 'uppercase'
                        }}>
                            {invoice.type === 'cash' ? 'CASH' : 'CREDIT'}
                        </p>
                    </div>
                </div>

                {/* Items Table */}
                <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse', 
                    marginBottom: '15px',
                    fontSize: '10px'
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#242A2A', color: '#FFFFFF' }}>
                            <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: '600' }}>#</th>
                            <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: '600' }}>Product</th>
                            <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: '600' }}>Qty</th>
                            <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: '600' }}>Unit Price</th>
                            <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: '600' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr 
                                key={item.id} 
                                style={{ 
                                    borderBottom: '1px solid #E5E7EB',
                                    backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F9FAFB'
                                }}
                            >
                                <td style={{ padding: '8px 6px', color: '#6B7280' }}>{index + 1}</td>
                                <td style={{ padding: '8px 6px', fontWeight: '500' }}>{item.product_name}</td>
                                <td style={{ padding: '8px 6px', textAlign: 'center' }}>{item.quantity}</td>
                                <td style={{ padding: '8px 6px', textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                                <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: '500' }}>{formatCurrency(item.total_price)}</td>
                            </tr>
                        ))}
                        {/* Empty rows to fill space if needed */}
                        {items.length < 5 && [...Array(5 - items.length)].map((_, i) => (
                            <tr key={`empty-${i}`} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                <td style={{ padding: '8px 6px' }}>&nbsp;</td>
                                <td style={{ padding: '8px 6px' }}></td>
                                <td style={{ padding: '8px 6px' }}></td>
                                <td style={{ padding: '8px 6px' }}></td>
                                <td style={{ padding: '8px 6px' }}></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end',
                    marginBottom: '20px'
                }}>
                    <div style={{ width: '50%' }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            padding: '6px 10px',
                            borderBottom: '1px solid #E5E7EB'
                        }}>
                            <span style={{ color: '#6B7280' }}>Subtotal:</span>
                            <span style={{ fontWeight: '500' }}>{formatCurrency(invoice.total_amount)}</span>
                        </div>
                        {invoice.price && invoice.price > 0 && (
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                padding: '6px 10px',
                                borderBottom: '1px solid #E5E7EB'
                            }}>
                                <span style={{ color: '#6B7280' }}>Additional Charges:</span>
                                <span style={{ fontWeight: '500' }}>{formatCurrency(invoice.price)}</span>
                            </div>
                        )}
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            padding: '10px',
                            backgroundColor: '#242A2A',
                            color: '#FFFFFF',
                            fontWeight: 'bold',
                            fontSize: '13px'
                        }}>
                            <span>GRAND TOTAL:</span>
                            <span>{formatCurrency(invoice.total_amount + (invoice.price || 0))}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ 
                    borderTop: '1px solid #E5E7EB', 
                    paddingTop: '15px',
                    marginTop: 'auto'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ borderTop: '1px solid #242A2A', width: '80%', margin: '0 auto', paddingTop: '5px' }}>
                                <p style={{ margin: 0, fontSize: '10px', color: '#6B7280' }}>Authorized Signature</p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ borderTop: '1px solid #242A2A', width: '80%', margin: '0 auto', paddingTop: '5px' }}>
                                <p style={{ margin: 0, fontSize: '10px', color: '#6B7280' }}>Receiver Signature</p>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ textAlign: 'center', fontSize: '9px', color: '#9CA3AF' }}>
                        <p style={{ margin: '0 0 2px 0' }}>Thank you for your business!</p>
                        <p style={{ margin: 0 }}>This is a computer-generated invoice.</p>
                    </div>
                </div>
            </div>
        );
    }
);

PrintInvoice.displayName = 'PrintInvoice';

export default PrintInvoice;
