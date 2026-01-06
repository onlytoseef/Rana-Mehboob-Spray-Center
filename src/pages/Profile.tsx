import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import { FaUser, FaEnvelope, FaCalendar, FaLock, FaKey, FaShieldAlt } from 'react-icons/fa';
import { PageSkeleton } from '../components/ui/Skeleton';

interface UserProfile {
    id: number;
    name: string;
    email: string;
    created_at: string;
}

const Profile = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/profile');
            setProfile(res.data);
            setProfileForm({
                name: res.data.name,
                email: res.data.email,
            });
        } catch (err: any) {
            toast.error('Failed to load profile');
            console.error(err);
        } finally {
            setPageLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!profileForm.name.trim()) {
            toast.error('Name is required');
            return;
        }
        if (!profileForm.email.trim()) {
            toast.error('Email is required');
            return;
        }

        setProfileLoading(true);
        try {
            await api.put('/auth/profile', profileForm);
            toast.success('Profile updated successfully!');
            fetchProfile();
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to update profile';
            toast.error(errorMsg);
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!passwordForm.currentPassword) {
            toast.error('Current password is required');
            return;
        }
        if (!passwordForm.newPassword) {
            toast.error('New password is required');
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        setPasswordLoading(true);
        try {
            await api.put('/auth/change-password', passwordForm);
            toast.success('Password changed successfully!');
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to change password';
            toast.error(errorMsg);
        } finally {
            setPasswordLoading(false);
        }
    };

    if (pageLoading) {
        return <PageSkeleton rows={4} />;
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ color: '#0F172A' }}>
                    Admin Profile
                </h1>
                <p className="text-xs sm:text-sm mt-1" style={{ color: '#64748B' }}>
                    Manage your account settings and change password
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Summary Card */}
                <div className="lg:col-span-1">
                    <div 
                        className="rounded-xl shadow-md overflow-hidden border"
                        style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
                    >
                        <div className="h-24" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}></div>
                        <div className="relative px-6 pb-6">
                            <div 
                                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold -mt-10 border-4 shadow-lg"
                                style={{ 
                                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', 
                                    color: '#FFFFFF',
                                    borderColor: '#FFFFFF'
                                }}
                            >
                                {profile?.name.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-xl font-bold mt-4" style={{ color: '#0F172A' }}>
                                {profile?.name}
                            </h2>
                            <p className="text-sm" style={{ color: '#64748B' }}>Administrator</p>
                            
                            <div className="mt-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <FaEnvelope className="text-sm" style={{ color: '#6366F1' }} />
                                    <span className="text-sm" style={{ color: '#0F172A' }}>{profile?.email}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <FaCalendar className="text-sm" style={{ color: '#6366F1' }} />
                                    <span className="text-sm" style={{ color: '#0F172A' }}>
                                        Member since {new Date(profile?.created_at || '').toLocaleDateString('en-PK', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings Panel */}
                <div className="lg:col-span-2">
                    <div 
                        className="rounded-xl shadow-md overflow-hidden border"
                        style={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}
                    >
                        {/* Tabs */}
                        <div className="flex border-b" style={{ borderColor: '#E2E8F0' }}>
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                                    activeTab === 'profile' ? 'border-b-2' : ''
                                }`}
                                style={{
                                    color: activeTab === 'profile' ? '#6366F1' : '#64748B',
                                    borderColor: activeTab === 'profile' ? '#6366F1' : 'transparent',
                                    backgroundColor: activeTab === 'profile' ? '#F8FAFC' : 'transparent',
                                }}
                            >
                                <FaUser /> Profile Settings
                            </button>
                            <button
                                onClick={() => setActiveTab('password')}
                                className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                                    activeTab === 'password' ? 'border-b-2' : ''
                                }`}
                                style={{
                                    color: activeTab === 'password' ? '#6366F1' : '#64748B',
                                    borderColor: activeTab === 'password' ? '#6366F1' : 'transparent',
                                    backgroundColor: activeTab === 'password' ? '#F8FAFC' : 'transparent',
                                }}
                            >
                                <FaLock /> Change Password
                            </button>
                        </div>

                        <div className="p-6">
                            {activeTab === 'profile' ? (
                                <form onSubmit={handleProfileUpdate}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div 
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: '#EEF2FF' }}
                                        >
                                            <FaUser style={{ color: '#6366F1' }} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold" style={{ color: '#0F172A' }}>
                                                Profile Information
                                            </h3>
                                            <p className="text-xs" style={{ color: '#64748B' }}>
                                                Update your account details
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Input
                                            label="Full Name"
                                            value={profileForm.name}
                                            onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                            placeholder="Enter your name"
                                        />
                                        <Input
                                            label="Email Address"
                                            type="email"
                                            value={profileForm.email}
                                            onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                            placeholder="Enter your email"
                                        />
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <Button type="submit" disabled={profileLoading}>
                                            {profileLoading ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handlePasswordChange}>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div 
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: '#EEF2FF' }}
                                        >
                                            <FaShieldAlt style={{ color: '#6366F1' }} />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold" style={{ color: '#0F172A' }}>
                                                Security Settings
                                            </h3>
                                            <p className="text-xs" style={{ color: '#64748B' }}>
                                                Change your password to keep your account secure
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative">
                                            <Input
                                                label="Current Password"
                                                type={showPasswords.current ? 'text' : 'password'}
                                                value={passwordForm.currentPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                placeholder="Enter current password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                                className="absolute right-3 top-8 text-sm"
                                                style={{ color: '#6366F1' }}
                                            >
                                                {showPasswords.current ? 'Hide' : 'Show'}
                                            </button>
                                        </div>

                                        <div className="relative">
                                            <Input
                                                label="New Password"
                                                type={showPasswords.new ? 'text' : 'password'}
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                placeholder="Enter new password (min 6 characters)"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                className="absolute right-3 top-8 text-sm"
                                                style={{ color: '#6366F1' }}
                                            >
                                                {showPasswords.new ? 'Hide' : 'Show'}
                                            </button>
                                        </div>

                                        <div className="relative">
                                            <Input
                                                label="Confirm New Password"
                                                type={showPasswords.confirm ? 'text' : 'password'}
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                placeholder="Confirm new password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                                className="absolute right-3 top-8 text-sm"
                                                style={{ color: '#6366F1' }}
                                            >
                                                {showPasswords.confirm ? 'Hide' : 'Show'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Password Requirements */}
                                    <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#F8FAFC' }}>
                                        <p className="text-xs font-medium mb-2" style={{ color: '#0F172A' }}>
                                            Password Requirements:
                                        </p>
                                        <ul className="text-xs space-y-1" style={{ color: '#64748B' }}>
                                            <li className="flex items-center gap-2">
                                                <span className={passwordForm.newPassword.length >= 6 ? 'text-green-600' : ''}>
                                                    {passwordForm.newPassword.length >= 6 ? '✓' : '○'}
                                                </span>
                                                At least 6 characters
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <span className={passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.confirmPassword ? 'text-green-600' : ''}>
                                                    {passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.confirmPassword ? '✓' : '○'}
                                                </span>
                                                Passwords match
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <Button type="submit" disabled={passwordLoading}>
                                            <FaKey className="inline mr-2" />
                                            {passwordLoading ? 'Changing...' : 'Change Password'}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
