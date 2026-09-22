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
    supplier_balance?: number;
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

const numberToWords = (value: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const convert = (number: number): string => {
        if (number < 20) return ones[number];
        if (number < 100) return `${tens[Math.floor(number / 10)]}${number % 10 ? ` ${ones[number % 10]}` : ''}`;
        if (number < 1000) return `${ones[Math.floor(number / 100)]} Hundred${number % 100 ? ` ${convert(number % 100)}` : ''}`;
        if (number < 1000000) return `${convert(Math.floor(number / 1000))} Thousand${number % 1000 ? ` ${convert(number % 1000)}` : ''}`;
        return `${convert(Math.floor(number / 1000000))} Million${number % 1000000 ? ` ${convert(number % 1000000)}` : ''}`;
    };
    return value === 0 ? 'Zero Rupees' : `${convert(Math.floor(value))} Rupees`;
};

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
            name: 'POS SYSTEM',
            address: 'Your Business Address',
            phone: 'Your Contact Number',
            email: 'your@email.com',
        };

        const partnerLabel = invoiceType === 'import' ? 'Supplier' : 'Customer';
        const partnerName = invoiceType === 'import' ? invoice.supplier_name : invoice.customer_name;
        const partnerBalance = invoiceType === 'import' ? Number(invoice.supplier_balance || 0) : null;

        return (
            <div
                ref={ref}
                className="print-invoice"
                style={{
                    width: '190mm',
                    minHeight: '270mm',
                    padding: '6mm',
                    backgroundColor: '#ffffff',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '10px',
                    color: '#000000',
                    boxSizing: 'border-box',
                }}
            >
                <div style={{ textAlign: 'center', border: '1px solid #000', padding: '2px', marginBottom: '5px' }}>
                    <h1 style={{ margin: 0, fontSize: '25px', fontWeight: 'bold', letterSpacing: '1px' }}>{company.name}</h1>
                    <p style={{ margin: '2px 0', fontSize: '9px' }}>{company.address} | {company.phone} | {company.email}</p>
                </div>
                <h2 style={{ margin: '0 0 7px', padding: '3px', border: '1px solid #000', textAlign: 'center', fontSize: '22px', fontWeight: 'bold' }}>
                    {invoiceType === 'import' ? 'PURCHASE INVOICE' : 'SALES INVOICE'}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1.5fr', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                    <span style={{ padding: '5px 3px' }}>Date</span><span style={{ background: '#eee', padding: '5px 8px' }}>{formatDate(invoice.created_at)}</span>
                    <span style={{ padding: '5px 3px', textAlign: 'right' }}>Invoice No.</span><span style={{ background: '#eee', padding: '5px 8px', textAlign: 'right' }}>{invoice.invoice_no}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '85px 1fr', lineHeight: '1.2', fontSize: '12px', fontWeight: 'bold' }}>
                    <span style={{ padding: '5px 3px', textDecoration: 'underline' }}>Dist. Code</span><span style={{ background: '#eee', padding: '5px 8px' }}>&nbsp;</span>
                    <span style={{ padding: '5px 3px', textDecoration: 'underline' }}>{partnerLabel}</span><span style={{ background: '#eee', padding: '5px 8px' }}>{partnerName || ''}</span>
                    <span style={{ padding: '5px 3px', textDecoration: 'underline' }}>Bilty #</span><span style={{ background: '#eee', padding: '5px 8px' }}>&nbsp;</span>
                </div>
                {invoiceType === 'import' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '14px 0 8px' }}>
                        <div style={{ width: '48%', border: '3px double #000', display: 'grid', gridTemplateColumns: '1fr 1.2fr', fontSize: '18px', fontWeight: 'bold' }}>
                            <div style={{ padding: '9px', borderRight: '2px dotted #000', textAlign: 'center' }}>BALANCE</div>
                            <div style={{ padding: '9px', textAlign: 'center' }}>{formatCurrency(partnerBalance || 0)}</div>
                        </div>
                    </div>
                )}

                {/* Items Table */}
                <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse', 
                    margin: '8px 0 0',
                    fontSize: '10px',
                    border: '2px solid #000'
                }}>
                    <thead style={{ background: '#eee' }}>
                        <tr style={{ backgroundColor: '#242A2A', color: '#FFFFFF' }}>
                            <th style={{ padding: '5px', border: '1px solid #000', width: '7%' }}>Sr.<br />No.</th>
                            <th style={{ padding: '5px', border: '1px solid #000', width: '10%' }}>Prod.<br />Code.</th>
                            <th style={{ padding: '5px', border: '1px solid #000' }}>Product Name</th>
                            <th style={{ padding: '5px', border: '1px solid #000', width: '9%' }}>Qty.</th>
                            <th style={{ padding: '5px', border: '1px solid #000', width: '14%' }}>Rate</th>
                            <th style={{ padding: '5px', border: '1px solid #000', width: '24%' }}>Total<br />Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr 
                                key={item.id} 
                                style={{ 
                                    height: '27px'
                                }}
                            >
                                <td style={{ padding: '5px', border: '1px solid #000', textAlign: 'center' }}>{index + 1}</td>
                                <td style={{ padding: '5px', border: '1px solid #000', textAlign: 'center' }}>&nbsp;</td>
                                <td style={{ padding: '5px', border: '1px solid #000' }}>{item.product_name}</td>
                                <td style={{ padding: '5px', border: '1px solid #000', textAlign: 'center' }}>{item.quantity}</td>
                                <td style={{ padding: '5px', border: '1px solid #000', textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                                <td style={{ padding: '5px', border: '1px solid #000', textAlign: 'right' }}>{formatCurrency(item.total_price)}</td>
                            </tr>
                        ))}
                        {/* Empty rows to fill space if needed */}
                        {items.length < 5 && [...Array(5 - items.length)].map((_, i) => (
                            <tr key={`empty-${i}`} style={{ height: '27px' }}>
                                <td style={{ border: '1px solid #000' }}>&nbsp;</td><td style={{ border: '1px solid #000' }}></td><td style={{ border: '1px solid #000' }}></td><td style={{ border: '1px solid #000' }}></td><td style={{ border: '1px solid #000' }}></td><td style={{ border: '1px solid #000' }}></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '7px' }}>
                    <div style={{ fontWeight: 'bold', textDecoration: 'underline', padding: '8px 3px' }}>{numberToWords(invoice.total_amount)}</div>
                    <div style={{ width: '42%', border: '2px solid #000', display: 'grid', gridTemplateColumns: '1fr 1fr', fontSize: '14px', fontWeight: 'bold' }}>
                        <div style={{ padding: '10px', borderRight: '2px solid #000' }}>TOTAL</div><div style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(invoice.total_amount)}</div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ 
                    paddingTop: '30px',
                    marginTop: 'auto'
                }}>
                    <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '11px', letterSpacing: '2px' }}>E &amp; O E</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '35px' }}><div style={{ width: '35%', borderTop: '1px solid #000', paddingTop: '5px', textAlign: 'center', fontSize: '10px' }}>Authorized Signature</div></div>
                </div>
            </div>
        );
    }
);

PrintInvoice.displayName = 'PrintInvoice';

export default PrintInvoice;
