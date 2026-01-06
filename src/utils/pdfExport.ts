import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Column {
    header: string;
    accessor: string;
}

interface ExportOptions {
    title: string;
    columns: Column[];
    data: any[];
    filename: string;
    subtitle?: string;
    orientation?: 'portrait' | 'landscape';
    showTotal?: { column: string; label: string };
}

export const exportToPDF = (options: ExportOptions) => {
    const {
        title,
        columns,
        data,
        filename,
        subtitle,
        orientation = 'portrait',
        showTotal
    } = options;

    const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Company Header
    doc.setFillColor(99, 102, 241); // #6366F1 Indigo
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255); // White
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('MEHBOOB SPRAY CENTER', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Quality Spray Products & Services', pageWidth / 2, 22, { align: 'center' });
    doc.text('Phone: +92-XXX-XXXXXXX | Email: info@mehboobspraycenter.com', pageWidth / 2, 28, { align: 'center' });

    // Report Title
    doc.setTextColor(36, 42, 42);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, 45, { align: 'center' });

    // Subtitle (date range, filters, etc.)
    if (subtitle) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(subtitle, pageWidth / 2, 52, { align: 'center' });
    }

    // Report date
    const reportDate = new Date().toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.setFontSize(8);
    doc.text(`Generated: ${reportDate}`, pageWidth - margin, 45, { align: 'right' });

    // Prepare table data
    const tableColumns = columns.map(col => col.header);
    const tableRows = data.map(row => 
        columns.map(col => {
            const value = row[col.accessor];
            // Format numbers with commas
            if (typeof value === 'number') {
                return value.toLocaleString('en-PK');
            }
            return value ?? '-';
        })
    );

    // Calculate totals if needed
    let totalValue = 0;
    if (showTotal) {
        const colIndex = columns.findIndex(c => c.accessor === showTotal.column);
        if (colIndex !== -1) {
            totalValue = data.reduce((sum, row) => {
                const val = parseFloat(row[showTotal.column]) || 0;
                return sum + val;
            }, 0);
        }
    }

    // Add table
    autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: subtitle ? 58 : 52,
        margin: { left: margin, right: margin },
        styles: {
            fontSize: 9,
            cellPadding: 3,
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
        },
        headStyles: {
            fillColor: [99, 102, 241], // #6366F1 Indigo
            textColor: [255, 255, 255], // White
            fontStyle: 'bold',
            halign: 'center',
        },
        alternateRowStyles: {
            fillColor: [248, 248, 248],
        },
        columnStyles: {
            0: { halign: 'left' },
        },
        didDrawPage: () => {
            // Footer
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(
                `Page ${doc.getCurrentPageInfo().pageNumber}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
        },
    });

    // Add total row if needed
    if (showTotal && totalValue > 0) {
        const finalY = (doc as any).lastAutoTable.finalY || 100;
        doc.setFillColor(36, 42, 42);
        doc.rect(margin, finalY + 2, pageWidth - margin * 2, 10, 'F');
        doc.setTextColor(235, 224, 192);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${showTotal.label}: Rs. ${totalValue.toLocaleString('en-PK')}`, pageWidth - margin - 5, finalY + 8, { align: 'right' });
    }

    // Add summary stats at bottom
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Records: ${data.length}`, margin, finalY + 20);

    // Save PDF
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Export for Dashboard Summary
export const exportDashboardPDF = (dashboardData: any) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Company Header
    doc.setFillColor(99, 102, 241); // #6366F1 Indigo
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255); // White
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('MEHBOOB SPRAY CENTER', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Quality Spray Products & Services', pageWidth / 2, 22, { align: 'center' });
    doc.text('Phone: +92-XXX-XXXXXXX | Email: info@mehboobspraycenter.com', pageWidth / 2, 28, { align: 'center' });

    // Report Title
    doc.setTextColor(15, 23, 42); // #0F172A
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BUSINESS SUMMARY REPORT', pageWidth / 2, 48, { align: 'center' });

    const reportDate = new Date().toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Report Date: ${reportDate}`, pageWidth / 2, 55, { align: 'center' });

    let yPos = 70;

    // Summary Cards
    const cards = [
        { label: "Today's Sales", value: `Rs. ${Number(dashboardData.todaySales || 0).toLocaleString()}` },
        { label: "Today's Cash", value: `Rs. ${Number(dashboardData.todayCash || 0).toLocaleString()}` },
        { label: 'Total Products', value: dashboardData.totalProducts || 0 },
        { label: 'Stock Value', value: `Rs. ${Number(dashboardData.stockValue || 0).toLocaleString()}` },
        { label: 'Supplier Payables', value: `Rs. ${Number(dashboardData.supplierPayables || 0).toLocaleString()}` },
        { label: 'Customer Receivables', value: `Rs. ${Number(dashboardData.customerReceivables || 0).toLocaleString()}` },
    ];

    // Draw cards in 2 columns
    const cardWidth = (pageWidth - margin * 3) / 2;
    const cardHeight = 25;

    cards.forEach((card, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = margin + col * (cardWidth + margin);
        const y = yPos + row * (cardHeight + 5);

        doc.setFillColor(248, 248, 248);
        doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');
        
        doc.setFillColor(36, 42, 42);
        doc.rect(x, y, 3, cardHeight, 'F');

        doc.setTextColor(100, 100, 100);
        doc.setFontSize(9);
        doc.text(card.label, x + 8, y + 8);

        doc.setTextColor(36, 42, 42);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(String(card.value), x + 8, y + 18);
        doc.setFont('helvetica', 'normal');
    });

    yPos += Math.ceil(cards.length / 2) * (cardHeight + 5) + 15;

    // Recent Activity Tables
    if (dashboardData.recentImports?.length > 0) {
        doc.setTextColor(36, 42, 42);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Recent Imports', margin, yPos);
        yPos += 5;

        autoTable(doc, {
            head: [['Invoice No', 'Supplier', 'Amount', 'Date']],
            body: dashboardData.recentImports.slice(0, 5).map((imp: any) => [
                imp.invoice_no || '-',
                imp.supplier_name || '-',
                `Rs. ${Number(imp.total_amount || 0).toLocaleString()}`,
                new Date(imp.created_at).toLocaleDateString('en-PK')
            ]),
            startY: yPos,
            margin: { left: margin, right: margin },
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [36, 42, 42], textColor: [235, 224, 192] },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    if (dashboardData.recentSales?.length > 0) {
        doc.setTextColor(36, 42, 42);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Recent Sales', margin, yPos);
        yPos += 5;

        autoTable(doc, {
            head: [['Invoice No', 'Customer', 'Amount', 'Date']],
            body: dashboardData.recentSales.slice(0, 5).map((sale: any) => [
                sale.invoice_no || '-',
                sale.customer_name || '-',
                `Rs. ${Number(sale.total_amount || 0).toLocaleString()}`,
                new Date(sale.created_at).toLocaleDateString('en-PK')
            ]),
            startY: yPos,
            margin: { left: margin, right: margin },
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [36, 42, 42], textColor: [235, 224, 192] },
        });
    }

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('This is a computer-generated report.', pageWidth / 2, pageHeight - 15, { align: 'center' });

    doc.save(`Dashboard_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
