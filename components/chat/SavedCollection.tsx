'use client';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect } from 'react';
import { Trash2, ChevronRight, Bookmark, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface SavedCollectionProps {
    isOpen: boolean;
    onClose: () => void;
    onViewWord: (data: any) => void;
}

export default function SavedCollection({ isOpen, onClose, onViewWord }: SavedCollectionProps) {
    const [savedWords, setSavedWords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchSavedWords();
        }
    }, [isOpen]);

    const fetchSavedWords = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('saved_words')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data) {
            setSavedWords(data);
        }
        setLoading(false);
    };

    const deleteSavedWord = async (id: string) => {
        const { error } = await supabase
            .from('saved_words')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Failed to remove word');
        } else {
            setSavedWords(prev => prev.filter(w => w.id !== id));
            toast.success('Word removed from collection');
        }
    };

    const filteredWords = savedWords.filter(item =>
        item.word_data.current?.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.word_data.current?.language.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed right-0 top-0 h-full w-[350px] bg-black/60 backdrop-blur-2xl border-l border-white/10 z-[110] flex flex-col shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Bookmark className="w-4 h-4 text-blue-400" />
                            My Collection
                        </h3>
                        <button onClick={onClose} className="text-white/50 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-all">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="p-4">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                <Search className="w-3.5 h-3.5 text-white/30 group-focus-within:text-blue-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search your collection..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                        {loading && savedWords.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 gap-3">
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Synchronizing...</p>
                            </div>
                        ) : filteredWords.length === 0 ? (
                            <div className="text-center py-10">
                                <Bookmark className="w-8 h-8 text-white/5 mx-auto mb-3" />
                                <p className="text-white/30 text-xs font-medium">
                                    {searchTerm ? 'No matches found' : 'Your collection is empty'}
                                </p>
                                <p className="text-[10px] text-white/20 mt-1 px-10">
                                    Save words from the discussion group to view them here later.
                                </p>
                            </div>
                        ) : (
                            filteredWords.map((item) => (
                                <div
                                    key={item.id}
                                    className="group relative bg-white/5 border border-white/10 p-3 rounded-2xl hover:bg-white/10 hover:border-blue-500/30 transition-all cursor-pointer shadow-lg"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                                                {item.word_data.current?.word}
                                            </h4>
                                            <p className="text-[10px] text-white/40">{item.word_data.current?.language}</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteSavedWord(item.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => {
                                            onViewWord(item.word_data);
                                            onClose();
                                        }}
                                        className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                                    >
                                        Visualize
                                        <ChevronRight className="w-3 h-3" />
                                    </button>

                                    <div className="absolute top-2 right-2 text-[8px] text-white/10 font-mono">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
