'use client';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect, useRef } from 'react';
import { Send, Share2, Trash2, Check, X, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ChatRoomProps {
    groupId: string;
    currentWordData: any; // The whole object (root, path, current)
    onViewSharedWord: (data: any) => void;
}

export default function ChatRoom({ groupId, currentWordData, onViewSharedWord }: ChatRoomProps) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [groupCode, setGroupCode] = useState('');
    const [showShareConfirm, setShowShareConfirm] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isSharing, setIsSharing] = useState(false);
    const [savedWordKeys, setSavedWordKeys] = useState<Set<string>>(new Set());

    useEffect(() => {
        // Get current user id
        supabase.auth.getUser().then(({ data }) => {
            setCurrentUserId(data.user?.id || null);
            if (data.user) fetchSavedWords(data.user.id);
        });

        // Fetch group details
        supabase.from('groups').select('join_code').eq('id', groupId).single()
            .then(({ data }) => setGroupCode(data?.join_code || ''));

        // Fetch initial messages
        fetchMessages();

        // Subscribe to realtime changes
        const channel = supabase
            .channel(`group:${groupId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `group_id=eq.${groupId}`
            }, async (payload) => {
                console.log('Realtime message received:', payload);
                // Fetch full message with profile data for the new message
                const { data, error } = await supabase
                    .from('messages')
                    .select('*, profile:profiles(*)')
                    .eq('id', payload.new.id)
                    .single();

                if (error) {
                    console.error('Error fetching new message profile:', error);
                    return;
                }

                if (data) {
                    setMessages(prev => {
                        // Avoid duplicates if optimistic update is added later
                        if (prev.some(m => m.id === data.id)) return prev;
                        return [...prev, data];
                    });
                    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
            })
            .subscribe((status) => {
                console.log('Realtime status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId]);

    const fetchSavedWords = async (userId: string) => {
        const { data } = await supabase
            .from('saved_words')
            .select('word_data')
            .eq('user_id', userId);

        if (data) {
            const keys = new Set(data.map(item => `${item.word_data.current.word}|${item.word_data.current.language}`));
            setSavedWordKeys(keys);
        }
    };

    const fetchMessages = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*, profile:profiles(*)')
            .eq('group_id', groupId)
            .order('created_at', { ascending: true });
        if (data) setMessages(data);
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
    };

    const sendMessage = async () => {
        if (!input.trim()) return;
        const user = await supabase.auth.getUser();
        const { error } = await supabase.from('messages').insert({
            group_id: groupId,
            user_id: user.data.user?.id,
            content: input
        });

        if (error) {
            toast.error('Failed to send message');
            console.error(error);
        } else {
            setInput('');
        }
    };

    const shareWord = () => {
        if (!currentWordData) return;
        setShowShareConfirm(true);
    };

    const confirmShare = async () => {
        if (!currentWordData || isSharing) return;
        setIsSharing(true);
        const user = await supabase.auth.getUser();
        const { error } = await supabase.from('messages').insert({
            group_id: groupId,
            user_id: user.data.user?.id,
            content: `Shared a word: ${currentWordData.current?.word || 'Unknown'}`,
            is_shared_word: true,
            word_data: currentWordData
        });
        setIsSharing(false);
        setShowShareConfirm(false);
    };

    const saveWordData = async (data: any) => {
        if (!currentUserId) {
            toast.error('You must be signed in to save words');
            return;
        }

        const wordKey = `${data.current.word}|${data.current.language}`;
        const isAlreadySaved = savedWordKeys.has(wordKey);

        if (isAlreadySaved) {
            const { error } = await supabase
                .from('saved_words')
                .delete()
                .eq('user_id', currentUserId)
                .eq('word_data->current->>word', data.current.word)
                .eq('word_data->current->>language', data.current.language);

            if (error) {
                toast.error('Failed to remove word');
            } else {
                setSavedWordKeys(prev => {
                    const next = new Set(prev);
                    next.delete(wordKey);
                    return next;
                });
                toast.success('Removed from collection');
            }
        } else {
            const { error } = await supabase.from('saved_words').insert({
                user_id: currentUserId,
                word_data: data
            });

            if (error) {
                toast.error('Failed to save word');
            } else {
                setSavedWordKeys(prev => {
                    const next = new Set(prev);
                    next.add(wordKey);
                    return next;
                });
                toast.success('Saved to collection!');
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/90 text-white">
            {/* Header */}
            <div className="p-3 border-b border-white/10 flex justify-between items-center text-xs text-white/50">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setMessages([])}
                        className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white px-2 py-1 rounded transition-colors"
                        title="Clear chat for me"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                    <button
                        onClick={shareWord}
                        disabled={!currentWordData}
                        className="flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 px-2 py-1 rounded transition-colors disabled:opacity-30"
                        title="Share current word to group"
                    >
                        <Share2 className="w-3 h-3" />
                        Share Word
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                {messages.map((msg) => {
                    const isOwn = msg.user_id === currentUserId;
                    const profile = msg.profile;

                    return (
                        <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                            {!isOwn && profile && (
                                <div className="flex items-center gap-2 mb-1.5 ml-1">
                                    <img
                                        src={profile.avatar_url || "https://img.freepik.com/premium-vector/male-face-avatar-icon-set-flat-design-social-media-profiles_1281173-3806.jpg"}
                                        alt={profile.display_name}
                                        className="w-5 h-5 rounded-full border border-white/10"
                                    />
                                    <span className="text-[10px] text-white/40 font-bold">{profile.display_name}</span>
                                </div>
                            )}
                            <div className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${isOwn
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white/10 text-white/90 rounded-tl-none'
                                } ${msg.is_shared_word ? 'border border-blue-400/30' : ''}`}>
                                {msg.content}
                                {msg.is_shared_word && msg.word_data && (
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => onViewSharedWord(msg.word_data)}
                                            className={`flex-1 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-xl text-center transition-all ${isOwn ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-500'
                                                }`}
                                        >
                                            View on Globe
                                        </button>
                                        <button
                                            onClick={() => saveWordData(msg.word_data)}
                                            className={`p-2 rounded-xl transition-all ${savedWordKeys.has(`${msg.word_data.current.word}|${msg.word_data.current.language}`)
                                                ? 'bg-white text-blue-600 shadow-inner'
                                                : 'bg-white/10 text-white hover:bg-white/20'
                                                }`}
                                            title={savedWordKeys.has(`${msg.word_data.current.word}|${msg.word_data.current.language}`) ? "Remove from Collection" : "Save to Collection"}
                                        >
                                            <Bookmark className={`w-3.5 h-3.5 ${savedWordKeys.has(`${msg.word_data.current.word}|${msg.word_data.current.language}`) ? 'fill-current' : ''}`} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10 flex gap-2 relative">
                <AnimatePresence>
                    {showShareConfirm && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="absolute inset-x-0 bottom-full bg-blue-600 p-4 flex items-center justify-between z-10 rounded-t-xl shadow-2xl"
                        >
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-100 opacity-60">Ready to share?</span>
                                <span className="text-sm font-bold text-white truncate max-w-[150px]">
                                    {currentWordData.current?.word}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowShareConfirm(false)}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                                <button
                                    onClick={confirmShare}
                                    disabled={isSharing}
                                    className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isSharing ? (
                                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Check className="w-4 h-4" />
                                    )}
                                    {isSharing ? 'Sharing...' : 'Share Now'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <input
                    className="flex-1 bg-white/5 rounded-full px-4 py-2 text-sm outline-none focus:bg-white/10 transition-colors"
                    placeholder="Message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <button onClick={sendMessage} className="bg-blue-600 p-2 rounded-full hover:bg-blue-500 text-white">
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
