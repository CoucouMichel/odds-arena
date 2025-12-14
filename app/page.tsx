"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import BottomNav from "./components/BottomNav";

// --- CONFIGURATION ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Match = {
  id: number;
  home_team: string;
  away_team: string;
  home_votes: number;
  away_votes: number;
  status: string;
  home_score?: number;
  away_score?: number;
  match_date: string;
  league: string;
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [myBetId, setMyBetId] = useState<number | null>(null);
  const [mySelection, setMySelection] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkMyBets(session.user.id);
    });

    fetchMatches();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkMyBets(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchMatches = async () => {
    const { data } = await supabase.from("matches").select("*").order("id", { ascending: false });
    if (data) setMatches(data);
  };

  const checkMyBets = async (userId: string) => {
    const { data } = await supabase.from("bets").select("match_id, selection").eq("user_id", userId);
    if (data && data.length > 0) {
      setMyBetId(data[0].match_id);
      setMySelection(data[0].selection);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) alert("Erreur: " + signUpError.message);
      else alert("Compte créé !");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMyBetId(null);
    setMySelection(null);
    setShowLogin(false);
  };

  const handleVote = async (matchId: number, selection: 'HOME' | 'AWAY') => {
    if (!user) { setShowLogin(true); return; }
    
    // VERIFICATION 1 : Le match a-t-il commencé ?
    const match = matches.find(m => m.id === matchId);
    if (match && new Date(match.match_date) < new Date()) {
      return alert("Trop tard ! Le match a déjà commencé.");
    }

    // VERIFICATION 2 : A-t-il déjà parié sur un AUTRE match ?
    // On autorise le clic si c'est le MEME match (pour changer), mais on bloque si c'est un autre.
    if (myBetId && myBetId !== matchId) {
      return alert("Vous ne pouvez parier que sur un seul match à la fois !");
    }

    const { error } = await supabase.rpc('place_bet', { match_id_input: matchId, selection_input: selection });
    if (error) alert("Erreur : " + error.message);
    else {
      setMyBetId(matchId);
      setMySelection(selection);
      fetchMatches(); // Rafraîchir pour voir les cotes changer
    }
  };

  const calculateOdds = (myVotes: number, opponentVotes: number) => {
    const safeMyVotes = Math.max(myVotes, 1);
    const ratio = opponentVotes / safeMyVotes;
    return (1 + Math.sqrt(ratio)).toFixed(2);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Date inconnue";
    const date = new Date(dateString);
    const day = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${day} • ${time}`;
  };

  return (
    <div className="min-h-screen bg-[#121212] text-gray-200 font-sans pb-20">
      
      <nav className="sticky top-0 z-50 bg-[#1e1e1e]/95 backdrop-blur border-b border-[#333] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-500 rounded flex items-center justify-center font-bold text-black text-xs">OA</div>
            <span className="font-bold text-base tracking-tight text-white hidden sm:block">Odds Arena</span>
          </div>
          {user ? (
            <div className="flex items-center gap-3 text-xs">
               <div className="hidden sm:block text-emerald-400 font-medium">Connecté</div>
               <button onClick={handleLogout} className="text-gray-400 hover:text-white border border-[#444] px-2 py-1 rounded transition-colors bg-[#252525]">Déco</button>
            </div>
          ) : (
            <button onClick={() => setShowLogin(!showLogin)} className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded transition-colors">Connexion</button>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-3 flex flex-col items-center">
        
        {(!user && showLogin) && (
          <div className="w-full max-w-sm mb-6 bg-[#1e1e1e] p-5 rounded-lg border border-[#333] animate-in fade-in slide-in-from-top-2">
            <h2 className="text-base font-bold text-white mb-3 text-center">Connexion</h2>
            <div className="space-y-2">
              <input type="email" placeholder="Email" className="w-full bg-[#121212] text-white border border-[#333] rounded p-2 outline-none focus:border-emerald-500 text-sm" onChange={(e) => setEmail(e.target.value)} />
              <input type="password" placeholder="Mot de passe" className="w-full bg-[#121212] text-white border border-[#333] rounded p-2 outline-none focus:border-emerald-500 text-sm" onChange={(e) => setPassword(e.target.value)} />
              <button onClick={handleLogin} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded shadow-lg text-sm">
                {loading ? "..." : "Entrer"}
              </button>
            </div>
          </div>
        )}

        {/* GRILLE DE CARTES */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {matches.map((match) => {
            const homeOdds = calculateOdds(match.home_votes, match.away_votes);
            const awayOdds = calculateOdds(match.away_votes, match.home_votes);
            const isMyMatch = myBetId === match.id;
            const isFinished = match.status === 'FINISHED';
            
            // LOGIQUE DE TEMPS : Le match a-t-il commencé ?
            const isStarted = new Date(match.match_date) < new Date();
            
            // LOGIQUE DE VERROUILLAGE :
            // Verrouillé si : (C'est fini) OU (Ca a commencé) OU (J'ai parié sur un AUTRE match)
            // Donc si c'est MON match et qu'il n'a pas commencé, c'est OUVERT !
            const isLocked = isFinished || isStarted || (!isMyMatch && !!myBetId);

            return (
              <div key={match.id} className={`bg-[#1e1e1e] rounded-lg overflow-hidden border transition-all duration-300 relative
                ${isMyMatch ? 'border-emerald-500/50' : 'border-[#333]'}
                ${isFinished ? 'opacity-60' : ''}
              `}>
                
                {/* Header */}
                <div className="bg-[#252525] px-3 py-1.5 flex justify-between items-center border-b border-[#333] text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500">{match.league || "Ligue 1"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{formatDate(match.match_date)}</span>
                    {isFinished ? <span className="text-red-500 ml-1">FIN</span> : (isStarted && <span className="text-orange-500 ml-1">EN COURS</span>)}
                  </div>
                </div>

                {/* Corps */}
                <div className="p-2 flex flex-col gap-1 relative">
                  {isMyMatch && <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none"></div>}

                  <TeamRow 
                    name={match.home_team} 
                    odds={homeOdds}
                    isSelected={isMyMatch && mySelection === 'HOME'}
                    isDisabled={isLocked}
                    onClick={() => handleVote(match.id, 'HOME')}
                  />
                  
                  <div className="h-px bg-[#2a2a2a] w-full my-0.5"></div>

                  <TeamRow 
                    name={match.away_team} 
                    odds={awayOdds}
                    isSelected={isMyMatch && mySelection === 'AWAY'}
                    isDisabled={isLocked}
                    onClick={() => handleVote(match.id, 'AWAY')}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function TeamRow({ name, odds, isSelected, isDisabled, onClick }: any) {
  let buttonStyle = "bg-[#2c2c2c] hover:bg-[#3a3a3a] text-gray-400 border-[#333]";
  let buttonText = "PICK";
  
  if (isSelected) {
    buttonStyle = "bg-emerald-600 text-white border-emerald-600 font-bold";
    buttonText = "CHOISI";
  } else if (isDisabled) {
    buttonStyle = "bg-transparent text-gray-700 border-[#222] cursor-not-allowed";
  }

  return (
    <div className="flex items-center justify-between py-1 px-1">
      <div className="flex flex-col">
        <span className={`font-bold text-sm leading-tight ${isSelected ? 'text-emerald-400' : 'text-gray-200'}`}>{name}</span>
        <span className="text-[10px] font-mono text-gray-500 font-bold mt-0.5">x{odds}</span>
      </div>
      <button onClick={onClick} disabled={isDisabled} className={`px-3 py-1 rounded text-[10px] uppercase font-bold border transition-all ${buttonStyle}`}>
        {buttonText}
      </button>
      <BottomNav />
    </div>
  );
}