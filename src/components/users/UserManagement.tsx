import { useState, useEffect } from 'react';
import { User } from '../../types';
import UserCard from './UserCard';
import BalanceModal from './BalanceModal';
import { Search, Users } from 'lucide-react';
import { fetchWithAuth as fetch } from '../../lib/api';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) {
        console.error('Failed to fetch users');
        return;
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateBalance = async (discordId: string, amount: number) => {
    try {
      await fetch('/api/users/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discordId, amount })
      });
      await fetchUsers(); // Refresh the list
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.accountName.toLowerCase().includes(search.toLowerCase()) || 
    u.discordId.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Manajemen User
          </h2>
          <p className="text-slate-400 text-sm mt-1">Kelola saldo dan data pengguna bot Anda.</p>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari User / ID Discord..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-3xl p-12 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Belum ada user</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">Tidak ada pengguna yang mendaftar atau cocok dengan pencarian Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers.map(user => (
            <UserCard
              key={user.discordId}
              user={user}
              onManageBalance={(u) => setSelectedUser(u)}
            />
          ))}
        </div>
      )}

      {selectedUser && (
        <BalanceModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdateBalance={handleUpdateBalance}
        />
      )}
    </div>
  );
}
