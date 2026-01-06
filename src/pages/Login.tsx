import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaLock, FaEnvelope, FaSprayCan } from 'react-icons/fa';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!email.trim()) {
            toast.error('Please enter your email address');
            return;
        }
        if (!password.trim()) {
            toast.error('Please enter your password');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            toast.error('Please enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            if (response.data.token) {
                login(response.data.token);
                toast.success('Welcome back! Login successful');
                navigate('/');
            }
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data;
            if (typeof errorMsg === 'string') {
                toast.error(errorMsg);
            } else if (errorMsg?.message) {
                toast.error(errorMsg.message);
            } else if (err.code === 'ERR_NETWORK') {
                toast.error('Cannot connect to server. Please check if the server is running.');
            } else {
                toast.error('Login failed. Please check your credentials.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden" 
            style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)' }}
        >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 animate-pulse" 
                    style={{ background: 'radial-gradient(circle, #6366F1 0%, transparent 70%)' }} 
                />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-20 animate-pulse" 
                    style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)', animationDelay: '1s' }} 
                />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-5" 
                    style={{ background: 'radial-gradient(circle, #6366F1 0%, transparent 50%)' }} 
                />
            </div>

            {/* Glass Card */}
            <div className="relative z-10 w-full max-w-md">
                {/* Top Glow Effect */}
                <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-40 h-40 rounded-full opacity-30 blur-3xl"
                    style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
                />
                
                <div 
                    className="p-8 sm:p-10 rounded-3xl shadow-2xl backdrop-blur-xl border"
                    style={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        borderColor: 'rgba(99, 102, 241, 0.2)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.1)'
                    }}
                >
                    {/* Logo Section */}
                    <div className="text-center mb-8">
                        <div 
                            className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center text-3xl shadow-lg relative group"
                            style={{ 
                                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                                boxShadow: '0 10px 40px -10px rgba(99, 102, 241, 0.5)'
                            }}
                        >
                            <FaSprayCan className="text-white" />
                            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 100%)' }}
                            />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent"
                            style={{ backgroundImage: 'linear-gradient(135deg, #F1F5F9 0%, #94A3B8 100%)' }}
                        >
                            Mehboob Spray Center
                        </h2>
                        <p className="text-sm mt-2" style={{ color: '#64748B' }}>
                            Sign in to manage your business
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10" style={{ color: '#6366F1' }}>
                                <FaEnvelope />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email Address"
                                className="w-full pl-12 pr-4 py-4 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:ring-2"
                                style={{ 
                                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                                    color: '#F1F5F9',
                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                }}
                            />
                        </div>
                        
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10" style={{ color: '#6366F1' }}>
                                <FaLock />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full pl-12 pr-4 py-4 rounded-xl text-sm transition-all duration-300 focus:outline-none focus:ring-2"
                                style={{ 
                                    backgroundColor: 'rgba(30, 41, 59, 0.8)',
                                    color: '#F1F5F9',
                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                }}
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-4 rounded-xl text-white font-semibold text-sm uppercase tracking-wider transition-all duration-300 hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                            style={{ 
                                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                                boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.5)'
                            }}
                        >
                            <span className="relative z-10">
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : 'Sign In'}
                            </span>
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)' }}
                            />
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t" style={{ borderColor: 'rgba(99, 102, 241, 0.1)' }}>
                        <p className="text-center text-xs" style={{ color: '#475569' }}>
                            © {new Date().getFullYear()} Mehboob Spray Center
                        </p>
                        <p className="text-center text-xs mt-1" style={{ color: '#334155' }}>
                            Business Management System
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
