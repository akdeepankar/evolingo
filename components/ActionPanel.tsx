'use client';

import { Search, Loader2, Settings, MessageSquare, LogOut, Bookmark, ChevronDown, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';
import { SUPPORTED_LANGUAGES } from '@/lib/constants';

interface ActionPanelProps {
    onSearch: (term: string) => void;
    onOpenSettings: () => void;
    onOpenCollection: () => void;
    onToggleChat: () => void;
    onLogoClick?: () => void;
    isCompact?: boolean;
    isLoading?: boolean;
    currentLanguage?: string;
    onLanguageChange?: (lang: string) => void;
    translations?: {
        title: string;
        subtitle: string;
        placeholder: string;
    };
}

export default function ActionPanel({
    onSearch,
    onOpenSettings,
    onOpenCollection,
    onToggleChat,
    onLogoClick,
    isCompact = false,
    isLoading = false,
    currentLanguage = 'en',
    onLanguageChange,
    translations = {
        title: "Every word has a journey.",
        subtitle: "Trace the origins through time and space.",
        placeholder: "Enter a word (e.g. 'Robot', 'Tea', 'Galaxy')..."
    }
}: ActionPanelProps) {
    const [term, setTerm] = useState('');
    const [user, setUser] = useState<any>(null);
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) toast.error(error.message);
        else toast.success('Signed out successfully');
    };

    useEffect(() => {
        if (!isCompact) {
            setTerm('');
        }
    }, [isCompact]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (term.trim()) {
            onSearch(term);
        }
    };

    return (
        <>
            {/* Navbar Mode */}
            {isCompact ? (
                <motion.div
                    className="fixed z-50 top-0 left-0 w-full flex items-center justify-between px-6 py-3 bg-black/60 backdrop-blur-xl border-b border-white/10"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                >
                    <motion.h1
                        layoutId="logo"
                        onClick={onLogoClick}
                        className="font-serif font-bold text-white tracking-tighter text-2xl cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        Etymo
                    </motion.h1>

                    <div className="flex-1 flex justify-center px-6">
                        <motion.form
                            layoutId="search-container"
                            onSubmit={handleSubmit}
                            className="relative group w-full max-w-sm"
                        >
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                <Search className="w-4 h-4 text-white/50" />
                            </div>
                            <input
                                type="text"
                                value={term}
                                onChange={(e) => setTerm(e.target.value)}
                                placeholder={translations.placeholder}
                                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-lg rounded-full py-2 pl-10 pr-10 text-sm"
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center">
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                                ) : (
                                    <button type="submit" className={`hidden`}></button>
                                )}
                            </div>
                        </motion.form>
                    </div>

                    <motion.div layoutId="buttons" className="flex items-center gap-2">
                        {/* Language Selector Compact */}
                        <div className="relative">
                            <button
                                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                                className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-1"
                            >
                                <Globe className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase w-5">{currentLanguage}</span>
                            </button>

                            {isLangMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsLangMenuOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-40 bg-black/90 border border-white/10 rounded-xl shadow-xl z-50 py-1 overflow-hidden backdrop-blur-md max-h-60 overflow-y-auto custom-scrollbar">
                                        {SUPPORTED_LANGUAGES.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    onLanguageChange?.(lang.code);
                                                    setIsLangMenuOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors flex justify-between items-center ${currentLanguage === lang.code ? 'text-blue-400 font-bold' : 'text-white/70'}`}
                                            >
                                                {lang.name}
                                                {currentLanguage === lang.code && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <button onClick={onToggleChat} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                            <MessageSquare className="w-5 h-5" />
                        </button>
                        {user && (
                            <button
                                onClick={onOpenCollection}
                                className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                                title="My Collection"
                            >
                                <Bookmark className="w-5 h-5" />
                            </button>
                        )}
                        <button onClick={onOpenSettings} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                            <Settings className="w-5 h-5" />
                        </button>
                        {user && (
                            <button
                                onClick={handleSignOut}
                                className="p-2 rounded-full hover:bg-red-500/10 text-white/30 hover:text-red-500 transition-all ml-2"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        )}
                    </motion.div>
                </motion.div>
            ) : (
                /* Landing Mode */
                <div className="fixed inset-0 z-50 pointer-events-none">
                    {/* Logo and Language */}
                    <div className="absolute top-6 left-6 pointer-events-auto flex items-center gap-6">
                        <motion.h1
                            layoutId="logo"
                            onClick={onLogoClick}
                            className="font-serif font-bold text-white tracking-tighter text-3xl drop-shadow-lg cursor-pointer hover:opacity-80 transition-opacity"
                        >
                            Etymo
                        </motion.h1>

                        {/* Language Selector Landing */}
                        <div className="relative">
                            <button
                                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all text-white/60 hover:text-white"
                            >
                                <Globe className="w-4 h-4" />
                                <span className="text-xs font-medium uppercase">{SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage)?.name || currentLanguage}</span>
                                <ChevronDown className="w-3 h-3 opacity-50" />
                            </button>

                            {isLangMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsLangMenuOpen(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-40 bg-black/90 border border-white/10 rounded-xl shadow-xl z-50 py-1 overflow-hidden backdrop-blur-md max-h-60 overflow-y-auto custom-scrollbar">
                                        {SUPPORTED_LANGUAGES.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    onLanguageChange?.(lang.code);
                                                    setIsLangMenuOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 transition-colors flex justify-between items-center ${currentLanguage === lang.code ? 'text-blue-400 font-bold' : 'text-white/70'}`}
                                            >
                                                {lang.name}
                                                {currentLanguage === lang.code && <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Buttons */}
                    <motion.div layoutId="buttons" className="absolute top-6 right-6 flex items-center gap-2 pointer-events-auto">
                        <button onClick={onToggleChat} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                            <MessageSquare className="w-5 h-5" />
                        </button>
                        {user && (
                            <button
                                onClick={onOpenCollection}
                                className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                                title="My Collection"
                            >
                                <Bookmark className="w-5 h-5" />
                            </button>
                        )}
                        <button onClick={onOpenSettings} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                            <Settings className="w-5 h-5" />
                        </button>
                        {user && (
                            <button
                                onClick={handleSignOut}
                                className="p-2 rounded-full hover:bg-red-500/10 text-white/30 hover:text-red-500 transition-all ml-2"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        )}
                    </motion.div>

                    {/* Center Content */}
                    <div className="flex flex-col items-center justify-center h-full w-full px-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center mb-8 pointer-events-auto relative"
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={translations.title}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-center"
                                >
                                    <h2 className="text-5xl md:text-6xl font-serif text-white mb-4 drop-shadow-2xl text-center tracking-tight">
                                        {translations.title}
                                    </h2>
                                    <p className="text-xl text-white/60 font-light tracking-wide">
                                        {translations.subtitle}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </motion.div>

                        <motion.form
                            layoutId="search-container"
                            onSubmit={handleSubmit}
                            className="relative group w-full max-w-xl pointer-events-auto"
                        >
                            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-white/50 group-focus-within:text-blue-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={term}
                                onChange={(e) => setTerm(e.target.value)}
                                placeholder={translations.placeholder}
                                className="w-full bg-black/40 backdrop-blur-xl border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-2xl rounded-2xl py-5 pl-14 pr-14 text-lg"
                                autoFocus
                            />
                            <div className="absolute inset-y-0 right-4 flex items-center">
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                                ) : (
                                    <button
                                        type="submit"
                                        className={`p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all ${!term && 'opacity-0 pointer-events-none'}`}
                                    >
                                        <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center text-[10px] font-mono">↵</div>
                                    </button>
                                )}
                            </div>
                        </motion.form>
                    </div>
                </div>
            )}
        </>
    );
}
