'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { supabase } from '../../lib/supabase';

function SuccessBanner() {
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('success');
  if (!isSuccess) return null;
  return (
    <div className="bg-green-600/20 border border-green-500 text-green-400 p-4 rounded-lg mb-8">
      🎉 Payment successful! Thank you for your subscription. Your account is now active.
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [newScore, setNewScore] = useState('');
  const [scoreDate, setScoreDate] = useState('');
  
  // Charity State
  const [charities, setCharities] = useState<any[]>([]);
  const [selectedCharity, setSelectedCharity] = useState('');
  const [contribution, setContribution] = useState<number>(10); // Default to 10% minimum
  const [savingCharity, setSavingCharity] = useState(false);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        fetchScores(user.id);
        fetchCharities();
        fetchUserProfile(user.id);
      } else {
        window.location.href = '/login';
      }
    };
    initData();
  }, []);

  const fetchCharities = async () => {
    const { data } = await supabase.from('charities').select('*');
    if (data) setCharities(data);
  };

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single();
    if (data) {
      if (data.charity_id) setSelectedCharity(data.charity_id);
      if (data.charity_contribution_percent) setContribution(data.charity_contribution_percent);
    }
  };

  const fetchScores = async (userId: string) => {
    const { data } = await supabase.from('scores').select('*').eq('user_id', userId).order('date', { ascending: false });
    if (data) setScores(data);
  };

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newScore || !scoreDate) return;
    setLoading(true);

    const scoreValue = parseInt(newScore);
    if (scoreValue < 1 || scoreValue > 45) {
      alert('Score must be between 1 and 45 (Stableford format).');
      setLoading(false);
      return;
    }

    const { data: userProfile } = await supabase.from('users').select('id').eq('id', user.id).single();
    if (!userProfile) {
      await supabase.from('users').insert({ id: user.id });
    }

    const { error: insertError } = await supabase.from('scores').insert({
      user_id: user.id, score: scoreValue, date: scoreDate,
    });

    if (insertError) {
      alert("Failed to save score: " + insertError.message);
      setLoading(false); return;
    }

    const { data: currentScores } = await supabase.from('scores').select('*').eq('user_id', user.id).order('date', { ascending: false }).order('created_at', { ascending: false });
    if (currentScores && currentScores.length > 5) {
      const scoresToDelete = currentScores.slice(5); 
      for (const s of scoresToDelete) await supabase.from('scores').delete().eq('id', s.id);
    }

    setNewScore(''); setScoreDate('');
    await fetchScores(user.id);
    setLoading(false);
  };

  const handleSaveCharity = async () => {
    if (!user || !selectedCharity) return alert("Please select a charity first.");
    if (contribution < 10) return alert("Minimum contribution is 10%.");
    
    setSavingCharity(true);
    
    // Ensure profile exists before updating
    const { data: userProfile } = await supabase.from('users').select('id').eq('id', user.id).single();
    if (!userProfile) await supabase.from('users').insert({ id: user.id });

    const { error } = await supabase.from('users').update({
      charity_id: selectedCharity,
      charity_contribution_percent: contribution
    }).eq('id', user.id);

    if (error) alert("Error saving charity preferences.");
    else alert("Charity preferences saved successfully!");
    
    setSavingCharity(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">User Dashboard</h1>
        <p className="text-gray-400 mb-6">Welcome back, {user?.email}</p>
        
        <Suspense fallback={null}><SuccessBanner /></Suspense>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Score Entry Module */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Your Scores</h2>
            <form onSubmit={handleScoreSubmit} className="flex flex-col gap-3 mb-6">
              <input type="number" min="1" max="45" placeholder="Stableford Score (1-45)" value={newScore} onChange={(e) => setNewScore(e.target.value)} className="p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500" required />
              <input type="date" value={scoreDate} onChange={(e) => setScoreDate(e.target.value)} className="p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500 text-white dark:[color-scheme:dark]" required />
              <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-semibold transition-colors">
                {loading ? 'Saving...' : 'Add Score'}
              </button>
            </form>
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Latest 5 Scores:</h3>
            <ul className="space-y-2">
              {scores.length === 0 ? <li className="text-sm text-gray-500">No scores logged yet.</li> : scores.map((s) => (
                <li key={s.id} className="bg-gray-700 p-3 rounded flex justify-between items-center border border-gray-600">
                  <span className="text-sm text-gray-300">{new Date(s.date).toLocaleDateString()}</span>
                  <span className="font-bold text-blue-400">{s.score} pts</span>
                </li>
              ))}
            </ul>
          </div>

         {/* Subscription & Charity Module */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col gap-6">
            
            {/* Charity Selection */}
            <div>
              <h2 className="text-xl font-semibold mb-2">Charity Impact</h2>
              <p className="text-sm text-gray-400 mb-4">Choose where your funds go.</p>
              
              <div className="flex flex-col gap-3">
                <select 
                  value={selectedCharity} 
                  onChange={(e) => setSelectedCharity(e.target.value)}
                  className="p-3 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:border-blue-500 text-white"
                >
                  <option value="" disabled>Select a Charity</option>
                  {charities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-300">Contribution: {contribution}%</label>
                  <input 
                    type="range" 
                    min="10" max="100" 
                    value={contribution} 
                    onChange={(e) => setContribution(parseInt(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                  <span className="text-xs text-gray-500">(Minimum 10% required)</span>
                </div>

                <button 
                  onClick={handleSaveCharity}
                  disabled={savingCharity}
                  className="w-full bg-gray-700 hover:bg-gray-600 border border-gray-500 p-2 rounded-lg font-semibold transition-colors mt-2"
                >
                  {savingCharity ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>

            <hr className="border-gray-700" />

            {/* Subscriptions */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Upgrade Subscription</h2>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={async () => {
                    if (!user) return; setLoading(true);
                    try {
                      const res = await fetch('/api/checkout', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ priceId: 'price_1TEuFFCzMXyZ42SzC9mx1LV8', userId: user.id, email: user.email })
                      });
                      const data = await res.json();
                      if (data.url) window.location.href = data.url;
                    } catch (err) { console.error(err); }
                    setLoading(false);
                  }}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded-lg font-semibold transition-colors flex justify-between items-center"
                >
                  <span>Monthly Plan</span><span>$10/mo</span>
                </button>
                <button 
                  onClick={async () => {
                    if (!user) return; setLoading(true);
                    try {
                      const res = await fetch('/api/checkout', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ priceId: 'price_1TEuFpCzMXyZ42SzEtGLe3Gi', userId: user.id, email: user.email })
                      });
                      const data = await res.json();
                      if (data.url) window.location.href = data.url;
                    } catch (err) { console.error(err); }
                    setLoading(false);
                  }}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 p-3 rounded-lg font-semibold transition-colors flex justify-between items-center"
                >
                  <span>Yearly Plan</span><span>$100/yr</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}