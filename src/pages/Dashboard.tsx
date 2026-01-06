import { useState, useEffect } from 'react';
import { cachedGet } from '../services/api';
import useCurrencyConverter from '../hooks/useCurrencyConverter';
import { FaChartLine, FaFileImport, FaBoxes, FaHandHoldingUsd, FaMoneyCheckAlt, FaWallet, FaFilePdf, FaMoneyBillWave, FaCreditCard } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import { exportDashboardPDF } from '../utils/pdfExport';
import { DashboardSkeleton } from '../components/ui/Skeleton';

interface DashboardStats {
    todaySales: number;
    todayImports: number;
    stockValue: number;
    totalReceivables: number;
    totalPayables: number;
    todayCash: number;
    cashSales: number;
    creditSales: number;
    creditCashReceived: number;
}

const Dashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const { formatPKR } = useCurrencyConverter();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await cachedGet<DashboardStats>('/dashboard/stats');
                setStats(data);
            } catch (err: any) {
                if (err.code === 'ERR_NETWORK') {
                    toast.error('Cannot connect to server. Please ensure the server is running.');
                } else {
                    toast.error('Failed to load dashboard data');
                }
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return <DashboardSkeleton />;
    }

    const cards = [
        { title: "Today's Sales", value: formatPKR(stats?.todaySales || 0), icon: <FaChartLine />, accent: '#10B981' },
        { title: "Cash Sale", value: formatPKR(stats?.cashSales || 0), icon: <FaMoneyBillWave />, accent: '#22C55E' },
        { title: "Credit Sale (To Receive)", value: formatPKR(stats?.creditSales || 0), icon: <FaCreditCard />, accent: '#F97316' },
        { title: "Credit Cash Received", value: formatPKR(stats?.creditCashReceived || 0), icon: <FaHandHoldingUsd />, accent: '#14B8A6' },
        { title: "Today's Imports", value: formatPKR(stats?.todayImports || 0), icon: <FaFileImport />, accent: '#3B82F6' },
        { title: "Stock Value", value: formatPKR(stats?.stockValue || 0), icon: <FaBoxes />, accent: '#8B5CF6' },
        { title: "Total Receivables", value: formatPKR(stats?.totalReceivables || 0), icon: <FaHandHoldingUsd />, accent: '#F59E0B' },
        { title: "Total Payables", value: formatPKR(stats?.totalPayables || 0), icon: <FaMoneyCheckAlt />, accent: '#EF4444' },
    ];

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6 lg:mb-8">
                <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#0F172A' }}>Dashboard Overview</h1>
                    <p className="text-xs sm:text-sm mt-1" style={{ color: '#64748B' }}>Monitor your business performance at a glance</p>
                </div>
                <Button variant="secondary" onClick={() => {
                    exportDashboardPDF(stats);
                    toast.success('Dashboard PDF exported!');
                }}>
                    <FaFilePdf className="inline mr-1" /> Export Report
                </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                {cards.map((card, index) => (
                    <div 
                        key={index} 
                        className="relative rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 group"
                        style={{ 
                            background: `linear-gradient(145deg, ${card.accent} 0%, ${card.accent}DD 100%)`,
                        }}
                    >
                        {/* Glass overlay */}
                        <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{ 
                                background: 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)'
                            }}
                        />
                        
                        <div className="p-5 sm:p-6 relative z-10">
                            {/* Header with icon */}
                            <div className="flex items-center justify-between mb-4">
                                <div 
                                    className="w-11 h-11 rounded-xl flex items-center justify-center text-lg backdrop-blur-sm"
                                    style={{ 
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        color: '#FFFFFF'
                                    }}
                                >
                                    {card.icon}
                                </div>
                                <div 
                                    className="w-2 h-2 rounded-full animate-pulse"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
                                />
                            </div>
                            
                            {/* Value - Large */}
                            <p className="text-2xl sm:text-3xl font-bold text-white mb-1">
                                {card.value}
                            </p>
                            
                            {/* Title */}
                            <h3 className="text-sm font-medium text-white/80">
                                {card.title}
                            </h3>
                        </div>
                        
                        {/* Background pattern */}
                        <div 
                            className="absolute -right-8 -top-8 w-32 h-32 rounded-full"
                            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                        />
                        <div 
                            className="absolute -right-4 -top-4 w-20 h-20 rounded-full"
                            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
