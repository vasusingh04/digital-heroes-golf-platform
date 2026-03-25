'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [draws, setDraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningDraw, setRunningDraw] = useState(false);

  useEffect(() => {
    checkAdminAndFetchData();
  }, []);

  const checkAdminAndFetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/login';
      return;
    }

    // Check if user is actually an admin
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    
    if (profile?.role === 'admin') {
      setIsAdmin(true);
      fetchUsers();
      fetchDraws();
    } else {
      alert("Access Denied: You are not an administrator.");
      window.location.href = '/dashboard';
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    // Fetch users along with their scores (nested query)
    const { data } = await supabase.from('users').select(`
      id,
      subscription_status,
      charity_contribution_percent,
      scores (score, date)
    `);
    if (data) setUsers(data);
  };

  const fetchDraws = async () => {
    const { data } = await supabase.from('draws').select('*').order('created_at', { ascending: false });
    if (data) setDraws(data);
  };

  // The Custom Draw Engine (Random Generation)
  const executeMonthlyDraw = async () => {
    setRunningDraw(true);
    
    // Generate 5 unique random numbers between 1 and 45
    const winningNumbers = new Set<number>();
    while(winningNumbers.size < 5) {
      winningNumbers.add(Math.floor(Math.random() * 45) + 1);
    }
    
    const numbersArray = Array.from(winningNumbers).sort((a, b) => a - b);
    
    // Calculate total prize pool based on active subscribers (Example: $5 per active sub)
    const activeSubs = users.filter(u => u.subscription_status === 'active').length;
    const totalPool = activeSubs * 5.00; 

    const { error } = await supabase.from('draws').insert({
      draw_month: new Date().toISOString().split('T')[0], // Today's date
      logic_type: 'random',
      status: 'simulation', // Starts as simulation per PRD
      winning_numbers: numbersArray,
      total_prize_pool: totalPool
    });

    if (error) {
      alert("Error running draw: " + error.message);
    } else {
      alert(`Draw complete! Winning numbers: ${numbersArray.join(', ')}`);
      fetchDraws();
    }
    setRunningDraw(false);
  };

  if (loading) return <div className="min-h-screen bg-gray-900 text-white p-8 flex justify-center items-center">Loading Admin Panel...</div>;
  if (!isAdmin) return null; // Safety fallback

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">Admin Control Center</h1>
          <button onClick={() => window.location.href = '/dashboard'} className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Back to User Dashboard
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Quick Stats & Draw Engine */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 lg:col-span-1 h-fit">
            <h2 className="text-xl font-semibold mb-6">Draw Engine</h2>
            
            <div className="bg-gray-700 p-4 rounded-lg mb-6 flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total Users:</span>
                <span className="font-bold">{users.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Active Subscribers:</span>
                <span className="font-bold text-green-400">{users.filter(u => u.subscription_status === 'active').length}</span>
              </div>
            </div>

            <button 
              onClick={executeMonthlyDraw}
              disabled={runningDraw}
              className="w-full bg-purple-600 hover:bg-purple-700 p-4 rounded-lg font-bold transition-colors mb-4"
            >
              {runningDraw ? 'Generating...' : 'Execute Monthly Draw (Random)'}
            </button>
            <p className="text-xs text-gray-500 text-center">Executes a standard lottery-style 5-number draw.</p>
          </div>

          {/* User Management Table */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 lg:col-span-2 overflow-x-auto">
            <h2 className="text-xl font-semibold mb-6">User Database</h2>
            
            <table className="w-full text-left text-sm">
              <thead className="text-gray-400 border-b border-gray-700">
                <tr>
                  <th className="pb-3">User ID</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Charity %</th>
                  <th className="pb-3">Scores Logged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-4 text-xs font-mono text-gray-500">{u.id.substring(0, 8)}...</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded text-xs ${u.subscription_status === 'active' ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'}`}>
                        {u.subscription_status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4">{u.charity_contribution_percent}%</td>
                    <td className="py-4 text-blue-400 font-bold">{u.scores ? u.scores.length : 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Draw History */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 lg:col-span-3">
             <h2 className="text-xl font-semibold mb-6">Draw History</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {draws.length === 0 ? <p className="text-gray-500 text-sm">No draws executed yet.</p> : draws.map(d => (
                  <div key={d.id} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm text-gray-400">{d.draw_month}</span>
                      <span className="text-xs px-2 py-1 rounded bg-yellow-600/20 text-yellow-400 border border-yellow-600/50">{d.status.toUpperCase()}</span>
                    </div>
                    <div className="flex gap-2 mb-3">
                      {d.winning_numbers.map((num: number, i: number) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
                          {num}
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-gray-300">Prize Pool: <span className="text-green-400 font-bold">${d.total_prize_pool}</span></div>
                  </div>
                ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}