'use client';
import { supabase } from '@/lib/supabaseClient';
import { useState, useEffect, useRef } from 'react';
import { Send, Share2, Trash2 } from 'lucide-react';

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

    useEffect(() => {
        // Fetch group details (code)
        supabase.from('groups').select('join_code').eq('id', groupId).single()
            .then(({ data }) => setGroupCode(data?.join_code || ''));

        // Fetch initial messages
        fetchMessages();

        // Subscribe to realtime changes
        const channel = supabase
            .channel(`group:${groupId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` },
                (payload) => {
                    setMessages(prev => [...prev, payload.new]);
                    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId]);

    const fetchMessages = async () => {
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at', { ascending: true });
        if (data) setMessages(data);
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'auto' }), 100);
    };

    const sendMessage = async () => {
        if (!input.trim()) return;
        const user = await supabase.auth.getUser();
        await supabase.from('messages').insert({
            group_id: groupId,
            user_id: user.data.user?.id,
            content: input
        });
        setInput('');
    };

    const shareWord = async () => {
        if (!currentWordData) return;
        const user = await supabase.auth.getUser();
        await supabase.from('messages').insert({
            group_id: groupId,
            user_id: user.data.user?.id,
            content: `Shared a word: ${currentWordData.current?.word || 'Unknown'}`,
            is_shared_word: true,
            word_data: currentWordData
        });
    };

    return (
        <div className="flex flex-col h-full bg-black/90 text-white">
            {/* Header with Code */}
            <div className="p-3 border-b border-white/10 flex justify-between items-center text-xs text-white/50">
                <span>Code: <span className="text-blue-400 font-mono select-all ml-1 bg-white/5 px-1 rounded">{groupCode}</span></span>
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

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.user_id ? 'items-start' : 'items-center'}`}>
                        <div className={`p-2 rounded-lg max-w-[85%] text-sm ${msg.is_shared_word ? 'bg-blue-900/40 border border-blue-500/30' : 'bg-white/10'}`}>
                            {msg.content}
                            {msg.is_shared_word && msg.word_data && (
                                <button
                                    onClick={() => onViewSharedWord(msg.word_data)}
                                    className="block mt-2 text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded w-full text-center"
                                >
                                    View on Globe
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10 flex gap-2">
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
