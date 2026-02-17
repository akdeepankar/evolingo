'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Users } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import Auth from './Auth';
import GroupManager from './GroupManager';
import ChatRoom from './ChatRoom';

interface ChatSidebarProps {
    currentWordData: any;
    onLoadSharedWord: (data: any) => void;
    isOpen: boolean;
    onClose: () => void;
}

export default function ChatSidebar({ currentWordData, onLoadSharedWord, isOpen, onClose }: ChatSidebarProps) {
    const [user, setUser] = useState<any>(null);
    const [groupId, setGroupId] = useState<string | null>(null);

    useEffect(() => {
        // Check initial auth
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
        });

        // Auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session) setGroupId(null);
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: 400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 400, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed right-6 top-24 bottom-44 w-full max-w-md bg-black/80 backdrop-blur-xl border border-white/10 z-40 flex flex-col shadow-2xl rounded-2xl overflow-hidden"
                >
                    <div className="p-3 border-b border-white/10 flex justify-between items-center bg-black/40">
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Discussion Group
                        </h3>
                        <div className="flex items-center gap-3">
                            {user && (
                                <button
                                    onClick={() => supabase.auth.signOut()}
                                    className="text-[10px] text-white/40 hover:text-white"
                                >
                                    Sign Out
                                </button>
                            )}
                            <button onClick={onClose} className="text-white/50 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {!user ? (
                        <Auth onAuthSuccess={() => { }} />
                    ) : !groupId ? (
                        <GroupManager onGroupSelected={setGroupId} />
                    ) : (
                        <ChatRoom
                            groupId={groupId}
                            currentWordData={currentWordData}
                            onViewSharedWord={(data) => {
                                onLoadSharedWord(data);
                                // Optionally close chat on mobile? No, keeping it open is fine.
                            }}
                        />
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
