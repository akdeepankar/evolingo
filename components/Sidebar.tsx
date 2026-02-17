'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

interface SidebarProps {
    data: any;
    currentYear?: number;
    onYearSelect?: (year: number) => void;
}

export default function Sidebar({ data, currentYear = 2024, onYearSelect }: SidebarProps) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const activeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        checkIfSaved();
    }, [data]);

    const checkIfSaved = async () => {
        if (!data) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: existing } = await supabase
            .from('saved_words')
            .select('id')
            .eq('user_id', user.id)
            .eq('word_data->current->>word', data.current.word)
            .eq('word_data->current->>language', data.current.language)
            .maybeSingle();

        setIsSaved(!!existing);
    };

    useEffect(() => {
        if (activeRef.current) {
            activeRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [currentYear]);

    if (!data) return null;

    // Helper to check if a step is "active" (happened in the past relative to currentYear)
    const isActive = (stepYear: number) => stepYear <= currentYear;
    const isCurrent = (stepYear: number) => stepYear === currentYear;

    // Helper for handling click
    const handleClick = (year?: number) => {
        if (year !== undefined && onYearSelect) {
            onYearSelect(year);
        }
    };

    const saveWordData = async () => {
        if (!data) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error('You must be signed in to save words');
            return;
        }

        if (isSaved) {
            const { error } = await supabase
                .from('saved_words')
                .delete()
                .eq('user_id', user.id)
                .eq('word_data->current->>word', data.current.word)
                .eq('word_data->current->>language', data.current.language);

            if (error) {
                toast.error('Failed to remove word');
            } else {
                setIsSaved(false);
                toast.success('Removed from collection');
            }
        } else {
            const { error } = await supabase.from('saved_words').insert({
                user_id: user.id,
                word_data: data
            });

            if (error) {
                toast.error('Failed to save word');
            } else {
                setIsSaved(true);
                toast.success('Saved to collection!');
            }
        }
    };

    return (
        <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{
                x: isMinimized ? '-100%' : 0,
                opacity: 1
            }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-4 top-24 bottom-6 w-96 bg-black/60 backdrop-blur-xl border border-white/10 z-40 flex flex-col shadow-2xl rounded-2xl"
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="absolute -right-12 top-2 bg-black/80 backdrop-blur border border-l-0 border-white/20 p-2 rounded-r-xl text-white shadow-lg flex items-center justify-center hover:bg-black hover:text-blue-400 transition-all"
                title={isMinimized ? "Expand Sidebar" : "Minimize Sidebar"}
            >
                {isMinimized ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
            </button>

            <div className={`flex-1 flex flex-col h-full overflow-hidden ${isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-200`}>


                {/* Fixed Current Word Info */}
                <div
                    ref={isCurrent(data.current.year ?? 2024) ? activeRef : null}
                    className={`p-6 border-b border-white/10 relative transition-all duration-300 shrink-0 ${isActive(data.current.year ?? 2024) ? 'opacity-100' : 'opacity-50'} ${isCurrent(data.current.year ?? 2024) ? 'bg-blue-500/20 border-l-4 border-l-blue-400' : ''}`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-xs font-mono uppercase text-blue-400 tracking-widest">Current</div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                saveWordData();
                            }}
                            className={`p-2 rounded-lg transition-all ${isSaved ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-white/10 text-white/40 hover:text-blue-400'}`}
                            title={isSaved ? "Remove from Collection" : "Save to Collection"}
                        >
                            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                    <div onClick={() => handleClick(data.current.year)} className="cursor-pointer">
                        <div className="text-4xl font-bold text-white font-serif mb-1">{data.current.word}</div>
                        <div className="text-sm text-white/60 mb-2">{data.current.language} {data.current.year ? `(${data.current.year})` : ''}</div>
                        <div className="text-base text-white/80 italic">"{data.current.meaning}"</div>
                    </div>
                </div>

                {/* Scrollable Evolution Path */}
                <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                    <div>
                        <h3 className="text-xs font-mono uppercase text-white/50 mb-4 tracking-widest sticky top-0 bg-black/80 backdrop-blur py-3 px-6 z-10 w-full border-b border-white/5">Evolutionary Path</h3>
                        <div className="relative border-l-2 border-white/10 ml-9 pl-6 py-4 space-y-8 pr-4">
                            {/* Root */}
                            <div
                                onClick={() => handleClick(data.root.year)}
                                ref={isCurrent(data.root.year ?? -3000) ? activeRef : null}
                                className={`relative group cursor-pointer transition-all duration-300 rounded-xl p-3 -ml-3 ${isActive(data.root.year ?? -3000) ? 'opacity-100' : 'opacity-40 grayscale'} ${isCurrent(data.root.year ?? -3000) ? 'bg-blue-500/20 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/10' : 'hover:bg-white/5'}`}
                            >
                                <div className={`absolute -left-[41px] top-6 w-4 h-4 rounded-full border-4 border-black box-content transition-colors ${isActive(data.root.year ?? -3000) ? 'bg-blue-600 scale-110' : 'bg-white/20'} group-hover:scale-125`} />
                                <div className="text-xl font-bold text-white font-serif group-hover:text-blue-400 transition-colors">{data.root.word}</div>
                                <div className="text-xs text-blue-400 font-medium mb-1">{data.root.language} {data.root.year ? `(${data.root.year})` : ''}</div>
                                <div className="text-sm text-white/60 italic">"{data.root.meaning}"</div>
                            </div>

                            {/* Middle Steps */}
                            {data.path.map((step: any, index: number) => {
                                const active = isActive(step.year ?? 0);
                                const current = isCurrent(step.year ?? 0);
                                return (
                                    <div
                                        key={index}
                                        onClick={() => handleClick(step.year)}
                                        ref={current ? activeRef : null}
                                        className={`relative group cursor-pointer transition-all duration-300 rounded-xl p-3 -ml-3 ${active ? 'opacity-100' : 'opacity-40 grayscale'} ${current ? 'bg-blue-500/20 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/10' : 'hover:bg-white/5'}`}
                                    >
                                        <div className={`absolute -left-[39px] top-6 w-2 h-2 rounded-full transition-colors ${active ? 'bg-white shadow-[0_0_10px_white]' : 'bg-white/20'} group-hover:scale-150`} />
                                        <div className="text-lg font-medium text-white/90 font-serif group-hover:text-blue-300 transition-colors">{step.word}</div>
                                        <div className="text-xs text-white/40 mb-1">{step.language} {step.year ? `(${step.year})` : ''}</div>
                                        <div className="text-sm text-white/50 italic">"{step.meaning}"</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
