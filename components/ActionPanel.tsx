'use client';

import { Search, Loader2, Settings, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionPanelProps {
    onSearch: (term: string) => void;
    onOpenSettings: () => void;
    onToggleChat: () => void;
    onLogoClick?: () => void;
    isCompact?: boolean;
    isLoading?: boolean;
}

export default function ActionPanel({ onSearch, onOpenSettings, onToggleChat, onLogoClick, isCompact = false, isLoading = false }: ActionPanelProps) {
    const [term, setTerm] = useState('');

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
                        EvoLingo
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
                                placeholder="Search..."
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
                        <button onClick={onToggleChat} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                            <MessageSquare className="w-5 h-5" />
                        </button>
                        <button onClick={onOpenSettings} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                            <Settings className="w-5 h-5" />
                        </button>
                    </motion.div>
                </motion.div>
            ) : (
                /* Landing Mode */
                <div className="fixed inset-0 z-50 pointer-events-none">
                    {/* Logo */}
                    <motion.h1
                        layoutId="logo"
                        onClick={onLogoClick}
                        className="absolute top-6 left-6 font-serif font-bold text-white tracking-tighter text-3xl drop-shadow-lg pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        EvoLingo
                    </motion.h1>

                    {/* Buttons */}
                    <motion.div layoutId="buttons" className="absolute top-6 right-6 flex items-center gap-2 pointer-events-auto">
                        <button onClick={onToggleChat} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                            <MessageSquare className="w-5 h-5" />
                        </button>
                        <button onClick={onOpenSettings} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                            <Settings className="w-5 h-5" />
                        </button>
                    </motion.div>

                    {/* Center Content */}
                    <div className="flex flex-col items-center justify-center h-full w-full px-4">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center mb-8 pointer-events-auto"
                        >
                            <h2 className="text-5xl md:text-6xl font-serif text-white mb-4 drop-shadow-2xl text-center tracking-tight">
                                Every word has a journey.
                            </h2>
                            <p className="text-xl text-white/60 font-light tracking-wide">
                                Trace the origins through time and space.
                            </p>
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
                                placeholder="Enter a word (e.g. 'Robot', 'Tea', 'Galaxy')..."
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
