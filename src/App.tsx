import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Suppliers from './pages/Suppliers';
import Customers from './pages/Customers';
import Imports from './pages/Imports';
import Sales from './pages/Sales';
import Returns from './pages/Returns';
import Payments from './pages/Payments';
import CashPayment from './pages/CashPayment';
import CreditVoucher from './pages/CreditVoucher';
import CashReceived from './pages/CashReceived';
import GeneralLedger from './pages/GeneralLedger';
import CustomerLedgerDetails from './pages/CustomerLedgerDetails';
import SupplierLedgerDetails from './pages/SupplierLedgerDetails';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Login from './pages/Login';
import SetupWizard from './pages/SetupWizard';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Backup Confirmation Modal Component
const BackupModal = ({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  isBackingUp,
  backupComplete 
}: { 
  isOpen: boolean; 
  onConfirm: () => void; 
  onCancel: () => void;
  isBackingUp: boolean;
  backupComplete: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 transform transition-all">
        {backupComplete ? (
          // Success State
          <>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">✅ Backup Complete!</h3>
              <p className="text-gray-600 mb-6">Database backup has been created successfully.</p>
              <button
                onClick={onCancel}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Close Window
              </button>
            </div>
          </>
        ) : isBackingUp ? (
          // Loading State
          <>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Creating Backup...</h3>
              <p className="text-gray-600">Please wait while the database backup is being created.</p>
              <p className="text-sm text-gray-400 mt-2">Do not close this window</p>
            </div>
          </>
        ) : (
          // Confirmation State
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Create Backup Before Closing?</h3>
                <p className="text-sm text-gray-500">Mehboob Spray Center</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Do you want to create a database backup before closing the application?
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                No, Just Close
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                Yes, Backup & Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

function App() {
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupComplete, setBackupComplete] = useState(false);
  const [shouldClose, setShouldClose] = useState(false);

  // Auto backup on window close
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // If backup is complete or user chose to skip, allow close
      if (shouldClose) {
        return;
      }
      
      // Prevent default close and show our modal
      e.preventDefault();
      e.returnValue = '';
      
      // Show backup modal
      setShowBackupModal(true);
      
      return '';
    };

    // Add event listener
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldClose]);

  // Handle backup confirmation
  const handleBackupConfirm = async () => {
    setIsBackingUp(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/backup`
      );
      const data = await response.json();
      
      if (data.success) {
        setBackupComplete(true);
        toast.success('✅ Database backup created successfully!', {
          duration: 3000,
          icon: '💾'
        });
      } else {
        toast.error('Backup failed: ' + data.message);
        setShowBackupModal(false);
      }
    } catch (err) {
      console.error('Backup failed:', err);
      toast.error('Failed to create backup');
      setShowBackupModal(false);
    } finally {
      setIsBackingUp(false);
    }
  };

  // Handle close without backup or after backup complete
  const handleClose = () => {
    setShowBackupModal(false);
    setShouldClose(true);
    
    // Small delay to ensure state is updated, then close
    setTimeout(() => {
      window.close();
      // If window.close() doesn't work (most browsers block it), 
      // show message to user
      toast('You can now close this tab safely', {
        icon: '👋',
        duration: 5000
      });
    }, 100);
  };

  return (
    <AuthProvider>
      {/* Backup Modal */}
      <BackupModal
        isOpen={showBackupModal}
        onConfirm={handleBackupConfirm}
        onCancel={handleClose}
        isBackingUp={isBackingUp}
        backupComplete={backupComplete}
      />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#0F172A',
            color: '#F1F5F9',
            borderRadius: '12px',
            padding: '14px 20px',
            fontSize: '14px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FFFFFF',
            },
            duration: 5000,
          },
        }}
      />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<SetupWizard />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="suppliers" element={<Suppliers />} />
              <Route path="customers" element={<Customers />} />
              <Route path="imports" element={<Imports />} />
              <Route path="sales" element={<Sales />} />
              <Route path="returns" element={<Returns />} />
              <Route path="payments" element={<Payments />} />
              <Route path="payments/cash" element={<CashPayment />} />
              <Route path="payments/credit-voucher" element={<CreditVoucher />} />
              <Route path="payments/cash-received" element={<CashReceived />} />
              <Route path="ledger" element={<GeneralLedger />} />
              <Route path="ledger/customer/:id" element={<CustomerLedgerDetails />} />
              <Route path="ledger/supplier/:id" element={<SupplierLedgerDetails />} />
              <Route path="reports" element={<Reports />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
