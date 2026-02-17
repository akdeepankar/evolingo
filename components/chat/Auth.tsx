'use client';
import { supabase } from '@/lib/supabaseClient';
import { useState } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

const AVATARS = [
    "https://img.freepik.com/premium-vector/beautiful-positive-young-woman-semi-flat-vector-character-head-red-hair-curly-bangs-editable-cartoon-avatar-icon-face-emotion-colorful-spot-illustration-web-graphic-design-animation_151150-16783.jpg?semt=ais_user_personalization&w=740&q=80",
    "https://img.freepik.com/premium-vector/serious-caucasian-woman-with-trendy-bob-haircut-semi-flat-vector-character-head-editable-cartoon-avatar-icon-face-emotion-colorful-spot-illustration-web-graphic-design-animation_151150-16189.jpg?semt=ais_hybrid&w=740&q=80",
    "https://img.freepik.com/premium-vector/top-knot-bun-latina-pretty-smiling-2d-vector-avatar-illustration-headshot-hispanic-woman-big-earring-cartoon-character-face-portrait-relaxed-pose-flat-color-user-profile-image-isolated-white_151150-19794.jpg?semt=ais_wordcount_boost&w=740&q=80",
    "https://img.freepik.com/premium-vector/wavy-hair-caucasian-man-relaxed-standing-2d-vector-avatar-illustration-cheerful-western-european-male-cartoon-character-face-confident-headshot-posing-flat-color-user-profile-image-isolated-white_151150-21132.jpg?semt=ais_user_personalization&w=740&q=80",
    "https://img.freepik.com/premium-vector/person-with-blue-shirt-that-says-name-person_1029948-7040.jpg?semt=ais_user_personalization&w=740&q=80",
    "https://img.freepik.com/premium-vector/male-face-avatar-icon-set-flat-design-social-media-profiles_1281173-3806.jpg?w=360"
];

export default function Auth({ onAuthSuccess }: { onAuthSuccess: () => void }) {
    const [view, setView] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Welcome back!');
            onAuthSuccess();
        }
        setLoading(false);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!displayName.trim()) {
            toast.error('Please enter a display name.');
            return;
        }

        setLoading(true);

        const signUpPromise = (async () => {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: email.split('@')[0],
                        display_name: displayName,
                        avatar_url: selectedAvatar
                    }
                }
            });
            if (error) throw error;
            return data;
        })();

        toast.promise(signUpPromise, {
            loading: 'Creating your account...',
            success: () => {
                setView('login');
                setPassword('');
                return 'Account created! Please log in.';
            },
            error: (err) => err.message || 'Failed to create account',
        });

        signUpPromise.finally(() => setLoading(false));
    };

    return (
        <div className="flex flex-col h-full text-white px-5 pb-5 pt-2">
            {/* Tabs */}
            <div className="flex border-b border-white/10 mb-3">
                <button
                    onClick={() => setView('login')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${view === 'login' ? 'text-white border-b-2 border-blue-500' : 'text-white/50 hover:text-white'}`}
                >
                    Sign In
                </button>
                <button
                    onClick={() => setView('signup')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${view === 'signup' ? 'text-white border-b-2 border-blue-500' : 'text-white/50 hover:text-white'}`}
                >
                    Register
                </button>
            </div>

            <form onSubmit={view === 'login' ? handleLogin : handleSignUp} className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3 min-h-0 flex flex-col">

                <div className="flex-1 space-y-3">
                    {view === 'signup' && (
                        <>
                            {/* Avatar Selection */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Avatar</label>
                                <div className="grid grid-cols-6 gap-2">
                                    {AVATARS.map((url) => (
                                        <button
                                            key={url}
                                            type="button"
                                            onClick={() => setSelectedAvatar(url)}
                                            className={`relative aspect-square rounded-full overflow-hidden border transition-all ${selectedAvatar === url ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-transparent hover:border-white/20 opacity-70 hover:opacity-100'}`}
                                        >
                                            <img src={url} alt="Avatar" className="w-full h-full object-cover" />
                                            {selectedAvatar === url && (
                                                <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-white drop-shadow-md" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Display Name</label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-sm placeholder:text-white/20 outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                                    placeholder="e.g. Explorer"
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Email</label>
                        <input
                            className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-sm placeholder:text-white/20 outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                            placeholder="email@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            type="email"
                            disabled={loading}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Password</label>
                        <input
                            className="w-full bg-white/5 border border-white/10 p-2.5 rounded-lg text-sm placeholder:text-white/20 outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                            placeholder="••••••••"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="pt-3 mt-2 border-t border-white/5 shrink-0 sticky bottom-0 bg-transparent">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-all shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 text-sm"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </span>
                        ) : (
                            view === 'login' ? 'Sign In' : 'Create Account'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
