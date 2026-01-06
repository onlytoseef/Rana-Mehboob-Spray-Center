import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaBox, FaTruck, FaUsers, FaFileInvoiceDollar, FaMoneyBillWave, FaChartBar, FaTimes, FaUserCog, FaChevronDown, FaMoneyCheckAlt, FaReceipt, FaHandHoldingUsd, FaBook, FaUndo } from 'react-icons/fa';
import clsx from 'clsx';
import logo from '../assets/logo.png';

interface SidebarProps {
    onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
    const location = useLocation();
    const [paymentOpen, setPaymentOpen] = useState(
        location.pathname.startsWith('/payments') || location.pathname.startsWith('/ledger')
    );

    const mainLinks = [
        { name: 'Dashboard', path: '/', icon: <FaHome /> },
        { name: 'Products', path: '/products', icon: <FaBox /> },
        { name: 'Suppliers', path: '/suppliers', icon: <FaTruck /> },
        { name: 'Customers', path: '/customers', icon: <FaUsers /> },
        { name: 'Imports', path: '/imports', icon: <FaFileInvoiceDollar /> },
        { name: 'Sales', path: '/sales', icon: <FaFileInvoiceDollar /> },
        { name: 'Returns', path: '/returns', icon: <FaUndo /> },
    ];

    const paymentLinks = [
        { name: 'Cash Payment', path: '/payments/cash', icon: <FaMoneyCheckAlt /> },
        { name: 'Credit Voucher', path: '/payments/credit-voucher', icon: <FaReceipt /> },
        { name: 'Cash Received', path: '/payments/cash-received', icon: <FaHandHoldingUsd /> },
        { name: 'General Ledger', path: '/ledger', icon: <FaBook /> },
    ];

    const bottomLinks = [
        { name: 'Reports', path: '/reports', icon: <FaChartBar /> },
        { name: 'Profile', path: '/profile', icon: <FaUserCog /> },
    ];

    const handleLinkClick = () => {
        if (onClose) onClose();
    };

    const isPaymentActive = paymentLinks.some(link => location.pathname === link.path) || location.pathname.startsWith('/ledger');

    return (
        <div className="w-56 sm:w-64 h-screen flex flex-col shadow-xl" style={{ backgroundColor: '#0F172A' }}>
            <div className="p-3 sm:p-4 md:p-5 border-b flex justify-center items-center relative" style={{ borderColor: '#1E293B' }}>
                <img src={logo} alt="Logo" className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 object-contain" />
                <button 
                    onClick={onClose}
                    className="lg:hidden p-1 rounded hover:bg-white/10 transition-colors absolute right-3 top-3"
                    style={{ color: '#E2E8F0' }}
                >
                    <FaTimes />
                </button>
            </div>
            <nav className="flex-1 p-2 sm:p-3 space-y-1 overflow-y-auto">
                {/* Main Links */}
                {mainLinks.map((link) => (
                    <Link
                        key={link.name}
                        to={link.path}
                        onClick={handleLinkClick}
                        className={clsx(
                            "flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-lg transition-all duration-200 text-sm sm:text-base",
                            location.pathname === link.path 
                                ? "font-semibold shadow-md" 
                                : "hover:bg-white/10"
                        )}
                        style={{
                            backgroundColor: location.pathname === link.path ? '#6366F1' : 'transparent',
                            color: location.pathname === link.path ? '#FFFFFF' : '#E2E8F0'
                        }}
                    >
                        <span className="text-base sm:text-lg">{link.icon}</span>
                        <span>{link.name}</span>
                    </Link>
                ))}

                {/* Payment Submenu */}
                <div>
                    <button
                        onClick={() => setPaymentOpen(!paymentOpen)}
                        className={clsx(
                            "w-full flex items-center justify-between gap-3 px-3 py-2.5 sm:py-3 rounded-lg transition-all duration-200 text-sm sm:text-base",
                            isPaymentActive ? "font-semibold" : "hover:bg-white/10"
                        )}
                        style={{
                            backgroundColor: isPaymentActive ? '#1E293B' : 'transparent',
                            color: '#E2E8F0'
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-base sm:text-lg"><FaMoneyBillWave /></span>
                            <span>Payments</span>
                        </div>
                        <FaChevronDown 
                            className={clsx(
                                "text-xs transition-transform duration-200",
                                paymentOpen ? "rotate-180" : ""
                            )}
                        />
                    </button>
                    
                    {/* Submenu Items */}
                    <div className={clsx(
                        "overflow-hidden transition-all duration-300",
                        paymentOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                    )}>
                        <div className="ml-4 mt-1 space-y-1 border-l-2" style={{ borderColor: '#334155' }}>
                            {paymentLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    onClick={handleLinkClick}
                                    className={clsx(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-xs sm:text-sm ml-2",
                                        location.pathname === link.path 
                                            ? "font-semibold" 
                                            : "hover:bg-white/10"
                                    )}
                                    style={{
                                        backgroundColor: location.pathname === link.path ? '#6366F1' : 'transparent',
                                        color: location.pathname === link.path ? '#FFFFFF' : '#E2E8F0'
                                    }}
                                >
                                    <span className="text-sm">{link.icon}</span>
                                    <span>{link.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Links */}
                {bottomLinks.map((link) => (
                    <Link
                        key={link.name}
                        to={link.path}
                        onClick={handleLinkClick}
                        className={clsx(
                            "flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-lg transition-all duration-200 text-sm sm:text-base",
                            location.pathname === link.path 
                                ? "font-semibold shadow-md" 
                                : "hover:bg-white/10"
                        )}
                        style={{
                            backgroundColor: location.pathname === link.path ? '#6366F1' : 'transparent',
                            color: location.pathname === link.path ? '#FFFFFF' : '#E2E8F0'
                        }}
                    >
                        <span className="text-base sm:text-lg">{link.icon}</span>
                        <span>{link.name}</span>
                    </Link>
                ))}
            </nav>
            <div className="p-3 border-t text-xs text-center" style={{ borderColor: '#1E293B', color: '#94A3B8' }}>
                © {new Date().getFullYear()} Mehboob Spray Center
            </div>
        </div>
    );
};

export default Sidebar;
