import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaDatabase, FaServer, FaUser, FaLock, FaPlug, FaCheck, FaSpinner, FaTimes, FaCog, FaSprayCan } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface DbConfig {
    host: string;
    port: string;
    name: string;
    user: string;
    password: string;
}

const SetupWizard: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    
    const [config, setConfig] = useState<DbConfig>({
        host: 'localhost',
        port: '5432',
        name: 'spraycenter',
        user: 'postgres',
        password: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfig({ ...config, [e.target.name]: e.target.value });
        setMessage(null);
    };

    const testConnection = async () => {
        setLoading(true);
        setMessage(null);
        
        try {
            const response = await fetch(`${API_URL}/config/test-connection`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            
            const data = await response.json();
            
            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                return true;
            } else {
                setMessage({ type: 'error', text: data.message });
                return false;
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to connect to server. Make sure the backend is running.' });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const createDatabase = async () => {
        setLoading(true);
        setMessage({ type: 'info', text: 'Creating database...' });
        
        try {
            const response = await fetch(`${API_URL}/config/create-database`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            
            const data = await response.json();
            
            if (data.success || response.ok) {
                setMessage({ type: 'success', text: data.message });
                return true;
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to create database' });
                return false;
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to create database' });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const saveConfiguration = async () => {
        setLoading(true);
        setMessage({ type: 'info', text: 'Saving configuration...' });
        
        try {
            const response = await fetch(`${API_URL}/config/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            
            const data = await response.json();
            
            if (data.success) {
                setMessage({ type: 'success', text: 'Configuration saved!' });
                return true;
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save configuration' });
                return false;
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to save configuration' });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const initializeDatabase = async () => {
        setLoading(true);
        setMessage({ type: 'info', text: 'Creating tables...' });
        
        try {
            const response = await fetch(`${API_URL}/config/init-database`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (data.success) {
                setMessage({ type: 'success', text: 'Database initialized successfully!' });
                return true;
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to initialize database' });
                return false;
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to initialize database' });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleTestConnection = async () => {
        const success = await testConnection();
        if (success) {
            setTimeout(() => setStep(2), 1500);
        }
    };

    const handleCreateDatabase = async () => {
        const success = await createDatabase();
        if (success) {
            setTimeout(() => setStep(3), 1500);
        }
    };

    const handleSaveAndInitialize = async () => {
        const saved = await saveConfiguration();
        if (saved) {
            setMessage({ type: 'info', text: 'Initializing database tables...' });
            await new Promise(r => setTimeout(r, 500));
            const initialized = await initializeDatabase();
            if (initialized) {
                setStep(4);
            }
        }
    };

    const handleFinish = () => {
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-xl">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl mb-4">
                        <FaSprayCan className="text-4xl text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Mehboob Spray Center</h1>
                    <p className="text-indigo-300">Database Setup Wizard</p>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center space-x-4">
                        {[1, 2, 3, 4].map((s) => (
                            <React.Fragment key={s}>
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all duration-300 ${
                                    step >= s 
                                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg' 
                                        : 'bg-slate-700/50 text-slate-400'
                                }`}>
                                    {step > s ? <FaCheck /> : s}
                                </div>
                                {s < 4 && (
                                    <div className={`w-12 h-1 rounded ${
                                        step > s ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-slate-700/50'
                                    }`}></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Wizard Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
                    {/* Step 1: Connection Details */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <FaPlug className="text-4xl text-indigo-400 mx-auto mb-3" />
                                <h2 className="text-2xl font-bold text-white">Database Connection</h2>
                                <p className="text-slate-400 mt-2">Enter your PostgreSQL database details</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        <FaServer className="inline mr-2" />Host
                                    </label>
                                    <input
                                        type="text"
                                        name="host"
                                        value={config.host}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder="localhost"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Port
                                    </label>
                                    <input
                                        type="text"
                                        name="port"
                                        value={config.port}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder="5432"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <FaDatabase className="inline mr-2" />Database Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={config.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                    placeholder="spraycenter"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <FaUser className="inline mr-2" />Username
                                </label>
                                <input
                                    type="text"
                                    name="user"
                                    value={config.user}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                    placeholder="postgres"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <FaLock className="inline mr-2" />Password
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={config.password}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                    placeholder="••••••••"
                                />
                            </div>

                            {message && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 ${
                                    message.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                    message.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                    'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                }`}>
                                    {message.type === 'success' ? <FaCheck /> : 
                                     message.type === 'error' ? <FaTimes /> : 
                                     <FaSpinner className="animate-spin" />}
                                    {message.text}
                                </div>
                            )}

                            <button
                                onClick={handleTestConnection}
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <FaSpinner className="animate-spin" />
                                        Testing Connection...
                                    </>
                                ) : (
                                    <>
                                        <FaPlug />
                                        Test Connection
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step 2: Create Database */}
                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <FaDatabase className="text-4xl text-indigo-400 mx-auto mb-3" />
                                <h2 className="text-2xl font-bold text-white">Create Database</h2>
                                <p className="text-slate-400 mt-2">We'll create the database for you</p>
                            </div>

                            <div className="bg-slate-800/50 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-slate-300">
                                    <span>Host:</span>
                                    <span className="text-white font-medium">{config.host}:{config.port}</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span>Database:</span>
                                    <span className="text-white font-medium">{config.name}</span>
                                </div>
                                <div className="flex justify-between text-slate-300">
                                    <span>User:</span>
                                    <span className="text-white font-medium">{config.user}</span>
                                </div>
                            </div>

                            {message && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 ${
                                    message.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                    message.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                    'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                }`}>
                                    {message.type === 'success' ? <FaCheck /> : 
                                     message.type === 'error' ? <FaTimes /> : 
                                     <FaSpinner className="animate-spin" />}
                                    {message.text}
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-4 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleCreateDatabase}
                                    disabled={loading}
                                    className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <FaDatabase />
                                            Create Database
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Save & Initialize */}
                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <FaCog className="text-4xl text-indigo-400 mx-auto mb-3" />
                                <h2 className="text-2xl font-bold text-white">Initialize System</h2>
                                <p className="text-slate-400 mt-2">Save configuration and create tables</p>
                            </div>

                            <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-3 text-slate-300">
                                    <FaCheck className="text-green-400" />
                                    <span>Connection verified</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-300">
                                    <FaCheck className="text-green-400" />
                                    <span>Database created/verified</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-300">
                                    <div className="w-4 h-4 rounded-full border-2 border-indigo-400"></div>
                                    <span>Save configuration & create tables</span>
                                </div>
                            </div>

                            {message && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 ${
                                    message.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                                    message.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                    'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                }`}>
                                    {message.type === 'success' ? <FaCheck /> : 
                                     message.type === 'error' ? <FaTimes /> : 
                                     <FaSpinner className="animate-spin" />}
                                    {message.text}
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex-1 py-4 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSaveAndInitialize}
                                    disabled={loading}
                                    className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <FaSpinner className="animate-spin" />
                                            Initializing...
                                        </>
                                    ) : (
                                        <>
                                            <FaCog />
                                            Initialize
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Complete */}
                    {step === 4 && (
                        <div className="space-y-6 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-4">
                                <FaCheck className="text-4xl text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Setup Complete!</h2>
                            <p className="text-slate-400">
                                Your database has been configured and initialized successfully.
                            </p>

                            <div className="bg-slate-800/50 rounded-xl p-4 space-y-2 text-left">
                                <div className="flex items-center gap-3 text-green-300">
                                    <FaCheck /> Database connection configured
                                </div>
                                <div className="flex items-center gap-3 text-green-300">
                                    <FaCheck /> Database created
                                </div>
                                <div className="flex items-center gap-3 text-green-300">
                                    <FaCheck /> Tables initialized
                                </div>
                            </div>

                            <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4 text-amber-300 text-sm text-left">
                                <strong>Next Step:</strong> Create your first user account by registering in the login page, or use the seedUser.js script to create an admin account.
                            </div>

                            <button
                                onClick={handleFinish}
                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                            >
                                Go to Login
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-slate-500 mt-6 text-sm">
                    Mehboob Spray Center © {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
};

export default SetupWizard;
