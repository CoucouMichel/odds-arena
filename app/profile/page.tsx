"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import BottomNav from "../components/BottomNav";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [bets, setBets] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchData(session.user.id);
      }
    });
  }, []);

  const fetchData = async (userId: string) => {
    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (profileData) setProfile(profileData);

    // Récupérer les paris avec les infos du match associé
    const { data: betsData } = await supabase
      .from("bets")
      .select("*, matches(*)")
      .eq("user_id", userId)
      .order("id", { ascending: false });
    
    if (betsData) setBets(betsData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!user) return <div className="p-10 text-center text-white">Connectez-vous pour voir votre profil.</div>;

  return (
    <div className="min-h-screen bg-[#121212] text-gray-200 font-sans pb-24">
      <header className="bg-[#1e1e1e] p-6 border-b border-[#333] text-center">
        <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-black text-black shadow-lg shadow-emerald-500/30">
          {user.email[0].toUpperCase()}
        </div>
        <h2 className="text-xl font-bold text-white">{user.email.split('@')[0]}</h2>
        <div className="mt-4 flex justify-center gap-4">
          <div className="bg-[#252525] px-4 py-2 rounded-lg border border-[#333]">
            <div className="text-xs text-gray-500 uppercase font-bold">Points</div>
            <div className="text-xl font-black text-emerald-400">{profile?.total_points ? parseFloat(profile.total_points).toFixed(1) : 0}</div>
          </div>
          <div className="bg-[#252525] px-4 py-2 rounded-lg border border-[#333]">
            <div className="text-xs text-gray-500 uppercase font-bold">Paris</div>
            <div className="text-xl font-black text-white">{bets.length}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="mt-6 text-xs text-red-400 border border-red-900/50 bg-red-900/10 px-4 py-2 rounded-full">Se déconnecter</button>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Historique</h3>
        {bets.map((bet) => {
          const isWin = bet.points_earned > 0;
          const isFinished = bet.matches.status === 'FINISHED';
          
          return (
            <div key={bet.id} className="bg-[#1e1e1e] p-4 rounded-xl border border-[#333] flex justify-between items-center">
              <div>
                <div className="text-xs text-gray-500 font-bold mb-1">{new Date(bet.matches.match_date).toLocaleDateString()}</div>
                <div className="font-bold text-sm text-white">
                  {bet.matches.home_team} vs {bet.matches.away_team}
                </div>
                <div className="text-xs mt-1">
                  Votre choix : <span className={bet.selection === 'HOME' ? 'text-blue-400' : 'text-yellow-400'}>{bet.selection === 'HOME' ? bet.matches.home_team : bet.matches.away_team}</span>
                </div>
              </div>
              
              <div className="text-right">
                {!isFinished ? (
                  <span className="text-xs font-bold text-orange-400 bg-orange-400/10 px-2 py-1 rounded">EN COURS</span>
                ) : isWin ? (
                  <div className="flex flex-col items-end">
                    <span className="text-emerald-400 font-black text-lg">+{parseFloat(bet.points_earned).toFixed(1)}</span>
                    <span className="text-[10px] text-emerald-500 uppercase font-bold">Gagné</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-end">
                    <span className="text-gray-500 font-bold text-lg">0</span>
                    <span className="text-[10px] text-gray-600 uppercase font-bold">Perdu</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>
      <BottomNav />
    </div>
  );
}