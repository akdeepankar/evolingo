'use client';
import { supabase } from '@/lib/supabaseClient';
import { useState } from 'react';

export default function Auth({ onAuthSuccess }: { onAuthSuccess: () => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setMsg(error.message);
        } else {
            onAuthSuccess();
        }
        setLoading(false);
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username: email.split('@')[0] } // temp username
            }
        });
        if (error) {
            setMsg(error.message);
        } else {
            setMsg('Account created! Please log in.');
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col gap-4 p-4 text-white">
            <h2 className="text-lg font-bold">Sign In / Join</h2>
            {msg && <p className="text-red-400 text-xs">{msg}</p>}
            <input
                className="bg-white/10 p-2 rounded text-sm placeholder:text-white/30 outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
            />
            <input
                className="bg-white/10 p-2 rounded text-sm placeholder:text-white/30 outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />
            <div className="flex gap-2 text-xs">
                <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 py-2 rounded transition-colors disabled:opacity-50"
                >
                    {loading ? '...' : 'Login'}
                </button>
                <button
                    onClick={handleSignUp}
                    disabled={loading}
                    className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded transition-colors disabled:opacity-50"
                >
                    Sign Up
                </button>
            </div>
        </div>
    );
}
