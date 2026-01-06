import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FaBars, FaSignOutAlt, FaUserCircle, FaUserCog, FaChevronDown } from 'react-icons/fa';

interface HeaderProps {
    onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const { logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="shadow-sm p-3 sm:p-4 flex justify-between items-center" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="flex items-center gap-3">
                <button 
                    onClick={onMenuClick}
                    className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    style={{ color: '#0F172A' }}
                >
                    <FaBars className="text-lg sm:text-xl" />
                </button>
                <div>
                    <h2 className="text-base sm:text-lg lg:text-xl font-bold" style={{ color: '#0F172A' }}>Welcome Back!</h2>
                    <p className="text-xs sm:text-sm hidden sm:block" style={{ color: '#64748B' }}>Mehboob Spray Center</p>
                </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:opacity-90"
                        style={{ backgroundColor: '#6366F1' }}
                    >
                        <FaUserCircle className="text-lg" style={{ color: '#FFFFFF' }} />
                        <span className="text-sm font-medium hidden sm:inline" style={{ color: '#FFFFFF' }}>Admin</span>
                        <FaChevronDown 
                            className={`text-xs transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} 
                            style={{ color: '#FFFFFF' }} 
                        />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {dropdownOpen && (
                        <div 
                            className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg overflow-hidden z-50 border"
                            style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
                        >
                            <Link 
                                to="/profile"
                                onClick={() => setDropdownOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                                style={{ color: '#0F172A' }}
                            >
                                <FaUserCog />
                                <span className="text-sm">Profile Settings</span>
                            </Link>
                            <div className="border-t" style={{ borderColor: '#E2E8F0' }}></div>
                            <button 
                                onClick={() => {
                                    setDropdownOpen(false);
                                    logout();
                                }}
                                className="flex items-center gap-3 px-4 py-3 w-full hover:bg-red-50 transition-colors text-red-600"
                            >
                                <FaSignOutAlt />
                                <span className="text-sm">Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
