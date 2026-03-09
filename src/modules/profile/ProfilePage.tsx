import { useState } from 'react';
import { User, Mail, Shield, Calendar, Save, Camera, Lock } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface UserData {
    uid: string;
    email: string;
    name: string;
    role: string;
}

const loadUserData = (): UserData | null => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        try {
            return JSON.parse(userData) as UserData;
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }
    return null;
};

export default function ProfilePage() {
    const [currentUser, setCurrentUser] = useState<UserData | null>(() => loadUserData());
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState(() => {
        const user = loadUserData();
        return {
            name: user?.name || '',
            email: user?.email || '',
            role: user?.role || 'admin',
        };
    });

    const handleSave = async () => {
        if (!currentUser) return;
        
        setLoading(true);
        setError('');
        setSuccess('');
        
        try {
            // Update Firestore
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                name: formData.name,
            });

            // Update localStorage
            const updatedUser: UserData = { 
                ...currentUser, 
                name: formData.name,
                email: formData.email,
                role: formData.role
            };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            setCurrentUser(updatedUser);
            setEditing(false);
            setSuccess('Profile updated successfully!');
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role.toLowerCase()) {
            case 'admin':
                return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
            case 'teacher':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'student':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            default:
                return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    if (!currentUser) {
        return (
            <div className="p-6 flex items-center justify-center">
                <p className="text-slate-400">Loading...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white mb-1">Profile</h1>
                <p className="text-sm text-slate-400">Manage your account information</p>
            </div>

            {/* Profile Card */}
            <div className="bg-[#0d0f1a] border border-white/10 rounded-2xl overflow-hidden">
                {/* Banner */}
                <div className="h-32 bg-gradient-to-br from-violet-500/20 via-indigo-500/20 to-purple-500/20 relative">
                    <div className="absolute -bottom-16 left-8">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-[#0d0f1a] shadow-xl">
                                {getInitials(formData.name || 'User')}
                            </div>
                            <button className="absolute bottom-2 right-2 w-8 h-8 rounded-lg bg-violet-500 hover:bg-violet-600 text-white flex items-center justify-center shadow-lg transition-colors">
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="pt-20 pb-6 px-8">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">{formData.name}</h2>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-lg border text-xs font-medium ${getRoleBadgeColor(formData.role)}`}>
                                    {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
                                </span>
                                <span className="text-sm text-slate-400 flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    Joined {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                        {!editing && (
                            <button
                                onClick={() => setEditing(true)}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors"
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {/* Profile Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2">Full Name</label>
                            {editing ? (
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-white">
                                    <User className="w-4 h-4 text-slate-500" />
                                    <span>{formData.name}</span>
                                </div>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2">Email Address</label>
                            <div className="flex items-center gap-2 text-slate-400">
                                <Mail className="w-4 h-4 text-slate-500" />
                                <span>{formData.email}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                        </div>

                        {/* Role */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2">Role</label>
                            <div className="flex items-center gap-2 text-slate-400">
                                <Shield className="w-4 h-4 text-slate-500" />
                                <span className="capitalize">{formData.role}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Role is assigned by administrator</p>
                        </div>

                        {/* User ID */}
                        <div>
                            <label className="block text-xs font-medium text-slate-400 mb-2">User ID</label>
                            <div className="text-slate-400 font-mono text-sm">
                                {currentUser.uid?.slice(0, 20)}...
                            </div>
                        </div>
                    </div>

                    {/* Error/Success Messages */}
                    {(error || success) && (
                        <div className="mt-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                                    {success}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    {editing && (
                        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/10">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-4 h-4" />
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => {
                                                                        setError('');
                                                                        setSuccess('');
                                    setEditing(false);
                                    setFormData({
                                        name: currentUser.name || '',
                                        email: currentUser.email || '',
                                        role: currentUser.role || 'admin',
                                    });
                                }}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Security Card */}
            <div className="bg-[#0d0f1a] border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Security
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white font-medium">Password</p>
                            <p className="text-xs text-slate-400 mt-0.5">Last changed 30 days ago</p>
                        </div>
                        <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs transition-colors">
                            Change Password
                        </button>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div>
                            <p className="text-sm text-white font-medium">Two-Factor Authentication</p>
                            <p className="text-xs text-slate-400 mt-0.5">Add an extra layer of security</p>
                        </div>
                        <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-xs transition-colors">
                            Enable
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
