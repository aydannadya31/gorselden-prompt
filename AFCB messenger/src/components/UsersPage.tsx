import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { UserProfile } from '../types';
import { cn } from '../lib/utils';
import { MessageSquarePlus, Search, Loader2 } from 'lucide-react';

interface UsersPageProps {
  onSelectChat: (chatId: string) => void;
}

const statusLabels: Record<string, string> = {
  online: 'Çevrimiçi',
  away: 'Uzakta',
  busy: 'Meşgul',
};

const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  away: 'bg-amber-500',
  busy: 'bg-red-500',
};

const statusBadge: Record<string, string> = {
  online: 'bg-green-100 text-green-600',
  away: 'bg-amber-100 text-amber-600',
  busy: 'bg-red-100 text-red-600',
};

export const UsersPage: React.FC<UsersPageProps> = ({ onSelectChat }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (snapshot) => {
      const allUsers = snapshot.docs
        .map(d => ({ ...d.data(), uid: d.id } as UserProfile))
        .filter(u => u.uid !== user.uid);
      // Sort: online first, then by displayName
      allUsers.sort((a, b) => {
        const statusOrder = (s?: string) => s === 'online' ? 0 : s === 'away' ? 1 : s === 'busy' ? 2 : 3;
        const aOrder = statusOrder(a.onlineStatus);
        const bOrder = statusOrder(b.onlineStatus);
        if (aOrder !== bOrder) return aOrder - bOrder;
        return (a.displayName || '').localeCompare(b.displayName || '');
      });
      setUsers(allUsers);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user]);

  const handleUserClick = async (targetUid: string) => {
    if (!user) return;
    // Find existing private chat or create a new one
    const chatQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      where('type', '==', 'private')
    );
    const chatSnap = await getDocs(chatQuery);
    let foundId: string | null = null;
    chatSnap.forEach(d => {
      const data = d.data();
      if (data.participants.includes(targetUid)) foundId = d.id;
    });
    if (foundId) {
      onSelectChat(foundId);
    } else {
      const newRef = await addDoc(collection(db, 'chats'), {
        participants: [user.uid, targetUid],
        type: 'private',
        updatedAt: serverTimestamp(),
        lastMessage: null,
      });
      onSelectChat(newRef.id);
    }
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.displayName?.toLowerCase().includes(q)) ||
      (u.nickname?.toLowerCase().includes(q)) ||
      (u.uin?.includes(q)) ||
      (u.country?.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-w-0">
      {/* Header */}
      <header className="min-h-14 sm:h-20 bg-white border-b border-slate-200 flex items-center px-4 sm:px-8 shrink-0">
        <h2 className="text-lg font-black text-slate-900 tracking-tight">Kullanıcılar</h2>
        <span className="ml-2 text-xs font-bold text-slate-400">({users.length})</span>
      </header>

      {/* Search */}
      <div className="px-4 sm:px-8 py-3 bg-white border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Kullanıcı ara..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 transition-all"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              {searchQuery ? (
                <Search size={28} className="text-slate-400" />
              ) : (
                <Loader2 size={28} className="text-slate-400" />
              )}
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              {searchQuery ? 'Kullanıcı bulunamadı' : 'Henüz kullanıcı yok'}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              {searchQuery ? 'Farklı bir arama dene' : 'Yeni kullanıcılar kaydoldukça burada görünecek'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredUsers.map(u => (
              <div
                key={u.uid}
                onClick={() => handleUserClick(u.uid!)}
                className="flex items-center gap-4 px-4 sm:px-8 py-4 cursor-pointer transition-all hover:bg-white active:scale-[0.99]"
              >
                <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0 relative shadow-sm overflow-hidden">
                  <img
                    src={u.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.uid}`}
                    alt={u.displayName}
                    className="w-full h-full object-cover"
                  />
                  {statusColors[u.onlineStatus || ''] && (
                    <div className={cn(
                      "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white",
                      statusColors[u.onlineStatus || '']
                    )} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {u.displayName || 'İsimsiz'}
                    </h3>
                    {u.onlineStatus && statusLabels[u.onlineStatus] && (
                      <span className={cn(
                        "text-[8px] px-1.5 py-0.5 font-bold uppercase tracking-tighter shrink-0 rounded",
                        statusBadge[u.onlineStatus]
                      )}>
                        {statusLabels[u.onlineStatus]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {u.uin && (
                      <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded tracking-tighter">
                        #{u.uin}
                      </span>
                    )}
                    {u.country && (
                      <span className="text-[10px] text-slate-500 font-medium">{u.country}</span>
                    )}
                    {u.about && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{u.about}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleUserClick(u.uid!); }}
                  className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all active:scale-95 shrink-0"
                  title="Mesaj Gönder"
                >
                  <MessageSquarePlus size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
