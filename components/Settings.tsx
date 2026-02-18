'use client';

import { Settings as SettingsIcon, X, User, Key, Globe, Trash2, ShieldAlert } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
    const [activeTab, setActiveTab] = useState<'general' | 'profile'>('general');
    const [openaiKey, setOpenaiKey] = useState('');
    const [lingoKey, setLingoKey] = useState('');
    const [mapboxKey, setMapboxKey] = useState('');

    // Profile State
    const [user, setUser] = useState<any>(null);
    const [displayName, setDisplayName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const storedOpenAI = localStorage.getItem('openai_api_key');
        const storedLingo = localStorage.getItem('lingo_dev_api_key');
        const storedMapbox = localStorage.getItem('mapbox_access_token');

        // If localStorage has a value, use it. Otherwise, keep the env var value.
        if (storedOpenAI) setOpenaiKey(storedOpenAI);
        if (storedLingo) setLingoKey(storedLingo);
        if (storedMapbox) setMapboxKey(storedMapbox);

        // Fetch user profile
        fetchProfile();
    }, [isOpen]);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser(user);
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            if (profile) {
                setDisplayName(profile.display_name || '');
                setAvatarUrl(profile.avatar_url || '');
            }
        }
    };

    const saveKeys = () => {
        localStorage.setItem('openai_api_key', openaiKey);
        localStorage.setItem('lingo_dev_api_key', lingoKey);
        localStorage.setItem('mapbox_access_token', mapboxKey);
        toast.success('API Keys saved! Reloading...');
        setTimeout(() => window.location.reload(), 1000);
    };

    const updateProfile = async () => {
        if (!user) return;
        setIsSavingProfile(true);
        const { error } = await supabase
            .from('profiles')
            .update({
                display_name: displayName,
                avatar_url: avatarUrl
            })
            .eq('id', user.id);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Profile updated successfully');
        }
        setIsSavingProfile(false);
    };

    const deleteAccount = async () => {
        if (!user) return;
        const confirmDelete = confirm("⚠️ PERMANENT ACTION: This will delete your profile, owned regions/groups, and all data. You cannot undo this. Proceed?");
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            // Delete messages (cascade handles if set up, but let's be explicit if needed)
            // Delete groups owned by user
            const { data: ownedGroups } = await supabase.from('groups').select('id').eq('created_by', user.id);
            if (ownedGroups && ownedGroups.length > 0) {
                const groupIds = ownedGroups.map(g => g.id);
                // messages and members will cascade delete from groups
                await supabase.from('groups').delete().in('id', groupIds);
            }

            // Finally delete the profile
            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', user.id);

            if (profileError) throw profileError;

            // Sign out
            await supabase.auth.signOut();
            toast.success('Account and all data deleted.');
            onClose();
            window.location.reload();
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete account');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-0 w-full max-w-md shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between p-6 pb-4 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white">Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-white/50 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="flex p-1 bg-white/5 mx-6 mt-4 rounded-xl border border-white/5">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${activeTab === 'general' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                    >
                        <Key className="w-3.5 h-3.5" />
                        API Keys
                    </button>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${activeTab === 'profile' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                    >
                        <User className="w-3.5 h-3.5" />
                        Profile
                    </button>
                </div>

                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                    {activeTab === 'general' ? (
                        <div className="space-y-6">
                            <div className="bg-blue-600/5 border border-blue-500/10 p-4 rounded-xl">
                                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                    < Globe className="w-3 h-3" /> External Services
                                </p>
                                <p className="text-xs text-white/50 leading-relaxed">Configuring these keys enables advanced features like live map updates and AI-driven etymology.</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-white/40 mb-2 uppercase tracking-widest">Mapbox Access Token</label>
                                    {!mapboxKey && process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? (
                                        <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5">
                                            <span className="text-sm text-green-400 font-medium">✅ Configured via Environment</span>
                                            <button
                                                onClick={() => setMapboxKey(' ')}
                                                className="text-[10px] text-white/40 hover:text-white underline"
                                            >
                                                Override
                                            </button>
                                        </div>
                                    ) : (
                                        <input
                                            type="password"
                                            value={mapboxKey}
                                            onChange={(e) => setMapboxKey(e.target.value)}
                                            placeholder="pk.eyJ..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-white/40 mb-2 uppercase tracking-widest">OpenAI API Key</label>
                                    {!openaiKey && process.env.NEXT_PUBLIC_OPENAI_API_KEY ? (
                                        <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5">
                                            <span className="text-sm text-green-400 font-medium">✅ Configured via Environment</span>
                                            <button
                                                onClick={() => setOpenaiKey(' ')}
                                                className="text-[10px] text-white/40 hover:text-white underline"
                                            >
                                                Override
                                            </button>
                                        </div>
                                    ) : (
                                        <input
                                            type="password"
                                            value={openaiKey}
                                            onChange={(e) => setOpenaiKey(e.target.value)}
                                            placeholder="sk-..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-white/40 mb-2 uppercase tracking-widest">Lingo.dev API Key</label>
                                    {!lingoKey && process.env.NEXT_PUBLIC_LINGO_DEV_API_KEY ? (
                                        <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5">
                                            <span className="text-sm text-green-400 font-medium">✅ Configured via Environment</span>
                                            <button
                                                onClick={() => setLingoKey(' ')}
                                                className="text-[10px] text-white/40 hover:text-white underline"
                                            >
                                                Override
                                            </button>
                                        </div>
                                    ) : (
                                        <input
                                            type="password"
                                            value={lingoKey}
                                            onChange={(e) => setLingoKey(e.target.value)}
                                            placeholder="lingo-..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                                        />
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={saveKeys}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95"
                            >
                                Save Keys & Refresh
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {user ? (
                                <>
                                    <div className="flex flex-col items-center gap-4 py-4">
                                        <div className="relative group">
                                            <img
                                                src={avatarUrl || "https://img.freepik.com/premium-vector/male-face-avatar-icon-set-flat-design-social-media-profiles_1281173-3806.jpg"}
                                                className="w-24 h-24 rounded-full border-4 border-white/5 shadow-2xl object-cover"
                                                alt="Avatar"
                                            />
                                        </div>
                                        <p className="text-xs text-white/40 font-mono">User ID: {user.id.slice(0, 8)}...</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-white/40 mb-2 uppercase tracking-widest">Display Name</label>
                                            <input
                                                type="text"
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                placeholder="e.g. Explorer"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold text-white/40 mb-2 uppercase tracking-widest">Avatar URL</label>
                                            <input
                                                type="text"
                                                value={avatarUrl}
                                                onChange={(e) => setAvatarUrl(e.target.value)}
                                                placeholder="https://..."
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={updateProfile}
                                        disabled={isSavingProfile}
                                        className="w-full bg-white text-black font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                    >
                                        {isSavingProfile ? 'Saving...' : 'Update Profile'}
                                    </button>

                                    <div className="pt-6 border-t border-white/5">
                                        <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-xl">
                                            <div className="flex items-start gap-3 mb-4">
                                                <ShieldAlert className="w-5 h-5 text-red-500 mt-1" />
                                                <div>
                                                    <p className="text-sm font-bold text-red-500">Danger Zone</p>
                                                    <p className="text-[10px] text-red-500/60 leading-relaxed uppercase tracking-wider font-bold">Delete Account & Data</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={deleteAccount}
                                                disabled={isDeleting}
                                                className="w-full py-3 px-4 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 group"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                {isDeleting ? 'Deleting...' : 'Delete Everything'}
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-white/40 text-sm">Please sign in to manage your profile.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
