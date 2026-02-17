'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Users, ArrowLeft, Copy, CopyCheck, Shield, UserMinus, Crown, LogOut } from 'lucide-react';
import { toast } from 'sonner';
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
    const [selectedGroup, setSelectedGroup] = useState<any>(null);
    const [showMembers, setShowMembers] = useState(false);
    const [members, setMembers] = useState<any[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);

    useEffect(() => {
        // Check initial auth
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
        });

        // Auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (!session) setSelectedGroup(null);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (showMembers && selectedGroup) {
            fetchMembers();
        }
    }, [showMembers, selectedGroup]);

    const fetchMembers = async () => {
        setMembersLoading(true);
        const { data, error } = await supabase
            .from('group_members')
            .select('joined_at, profile:profiles(*)')
            .eq('group_id', selectedGroup.id);

        if (data) {
            setMembers(data.map(d => d.profile));
        }
        setMembersLoading(false);
    };

    const removeMember = async (memberId: string) => {
        if (!confirm('Remove this member from the group?')) return;
        const { error } = await supabase
            .from('group_members')
            .delete()
            .eq('group_id', selectedGroup.id)
            .eq('user_id', memberId);

        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Member removed');
            fetchMembers();
        }
    };

    const copyCode = () => {
        if (selectedGroup?.join_code) {
            navigator.clipboard.writeText(selectedGroup.join_code);
            toast.success('Code copied to clipboard!');
        }
    };

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) toast.error(error.message);
        else toast.success('Signed out');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed right-0 top-0 h-full w-[350px] bg-black/40 backdrop-blur-2xl border-l border-white/10 z-[100] flex flex-col shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                        <div className="flex items-center gap-2">
                            {selectedGroup && (
                                <button
                                    onClick={() => setSelectedGroup(null)}
                                    className="p-1.5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                            )}
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {selectedGroup ? selectedGroup.name : 'Discussion Group'}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2">
                            {user && selectedGroup && (
                                <button
                                    onClick={() => setShowMembers(true)}
                                    className="text-[10px] bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white px-2 py-1 rounded-full transition-all flex items-center gap-1"
                                >
                                    <Users className="w-3 h-3" />
                                    Members
                                </button>
                            )}
                            {user && !selectedGroup && (
                                <button
                                    onClick={handleSignOut}
                                    className="p-1.5 hover:bg-red-500/10 rounded-full text-white/30 hover:text-red-500 transition-all"
                                    title="Sign Out"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            )}
                            <button onClick={onClose} className="text-white/50 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 relative overflow-hidden">
                        {!user ? (
                            <Auth onAuthSuccess={() => { }} />
                        ) : !selectedGroup ? (
                            <GroupManager onGroupSelected={setSelectedGroup} />
                        ) : (
                            <ChatRoom
                                groupId={selectedGroup.id}
                                currentWordData={currentWordData}
                                onViewSharedWord={(data) => {
                                    onLoadSharedWord(data);
                                }}
                            />
                        )}

                        {/* Members Modal Overlay */}
                        <AnimatePresence>
                            {showMembers && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="absolute inset-0 bg-black/95 z-50 flex flex-col"
                                >
                                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                                        <h4 className="font-bold">Group Members</h4>
                                        <button onClick={() => setShowMembers(false)} className="hover:bg-white/10 p-1 rounded">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                                        {/* Group Info / Code for Owner */}
                                        {user?.id === selectedGroup?.created_by && (
                                            <div className="bg-blue-600/10 border border-blue-500/20 p-3 rounded-xl mb-4">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] text-blue-400 uppercase tracking-widest font-mono">Join Code</span>
                                                    <button
                                                        onClick={copyCode}
                                                        className="text-white/40 hover:text-white transition-colors"
                                                        title="Copy Code"
                                                    >
                                                        <Copy className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                <p className="text-xl font-mono font-bold tracking-widest text-white">{selectedGroup.join_code}</p>
                                                <p className="text-[10px] text-white/30 mt-1">Only you can see this code. Share it to invite others.</p>
                                            </div>
                                        )}

                                        {membersLoading ? (
                                            <p className="text-center text-white/40 text-sm">Loading members...</p>
                                        ) : (
                                            members.map(member => {
                                                const isOwner = member.id === selectedGroup?.created_by;
                                                const isSelf = member.id === user?.id;
                                                const canRemove = user?.id === selectedGroup?.created_by && !isOwner;

                                                return (
                                                    <div key={member.id} className="flex items-center gap-3 bg-white/5 p-2 rounded-xl group/member">
                                                        <div className="relative">
                                                            <img
                                                                src={member.avatar_url || "https://img.freepik.com/premium-vector/male-face-avatar-icon-set-flat-design-social-media-profiles_1281173-3806.jpg"}
                                                                alt={member.display_name}
                                                                className={`w-10 h-10 rounded-full border border-white/10 ${isOwner ? 'ring-2 ring-yellow-500/50' : ''}`}
                                                            />
                                                            {isOwner && (
                                                                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5 border border-black shadow-lg" title="Group Owner">
                                                                    <Crown className="w-2.5 h-2.5 text-black" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-sm font-bold">{member.display_name || 'Anonymous'}</p>
                                                                {isOwner && <span className="text-[8px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-tight">Owner</span>}
                                                                {isSelf && <span className="text-[8px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded uppercase font-bold tracking-tight">You</span>}
                                                            </div>
                                                            <p className="text-[10px] text-white/40">@{member.username}</p>
                                                        </div>

                                                        {canRemove && (
                                                            <button
                                                                onClick={() => removeMember(member.id)}
                                                                className="opacity-0 group-hover/member:opacity-100 p-2 text-red-500/40 hover:text-red-500 transition-all rounded-lg hover:bg-red-500/10"
                                                                title="Remove from group"
                                                            >
                                                                <UserMinus className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
