"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import BottomNav from "../components/BottomNav";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Leaderboard() {
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    // Récupérer les profils triés par points
    const fetchProfiles = async () => {
      const { data } = await supabase.from("profiles").select("*").order("total_points", { ascending: false });
      if (data) setProfiles(data);
    };
    fetchProfiles();
  }, []);

  return (
    <div className="min-h-screen bg-[#121212] text-gray-200 font-sans pb-24">
      <header className="bg-[#1e1e1e] p-4 border-b border-[#333] sticky top-0 z-10">
        <h1 className="text-xl font-bold text-center text-emerald-500">CLASSEMENT GÉNÉRAL</h1>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-3">
        {profiles.map((profile, index) => {
          const isPodium = index < 3;
          let rankColor = "bg-[#252525] text-gray-400";
          if (index === 0) rankColor = "bg-yellow-500/20 text-yellow-500 border border-yellow-500/50";
          if (index === 1) rankColor = "bg-gray-300/20 text-gray-300 border border-gray-300/50";
          if (index === 2) rankColor = "bg-orange-700/20 text-orange-400 border border-orange-700/50";

          return (
            <div key={profile.id} className="flex items-center gap-4 bg-[#1e1e1e] p-4 rounded-xl border border-[#333] shadow-sm">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${rankColor}`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-bold text-white truncate max-w-[150px]">{profile.email.split('@')[0]}</div>
                <div className="text-xs text-gray-500">{profile.wins} Victoires</div>
              </div>
              <div className="text-right">
                <div className="text-emerald-400 font-black text-xl">{parseFloat(profile.total_points).toFixed(1)}</div>
                <div className="text-[10px] text-gray-600 font-bold uppercase">Points</div>
              </div>
            </div>
          );
        })}
      </main>
      <BottomNav />
    </div>
  );
}