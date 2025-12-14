"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

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
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [myBet, setMyBet] = useState<number | null>(null); // ID du match parié
  
  // États pour le formulaire
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 1. CHARGEMENT INITIAL (Auth + Matchs)
  useEffect(() => {
    // Vérifier si déjà connecté
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkMyBets(session.user.id);
    });

    fetchMatches();

    // Écouter les changements de connexion
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkMyBets(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. FONCTIONS DE DONNÉES
  const fetchMatches = async () => {
    const { data } = await supabase.from("matches").select("*").order("id", { ascending: true });
    if (data) setMatches(data);
  };

  const checkMyBets = async (userId: string) => {
    // On regarde si le joueur a déjà parié aujourd'hui
    const { data } = await supabase.from("bets").select("match_id").eq("user_id", userId);
    if (data && data.length > 0) {
      setMyBet(data[0].match_id); // On stocke l'ID du match joué
    }
  };

  // 3. FONCTIONS D'ACTION (Login / Vote)
  const handleLogin = async () => {
    setLoading(true);
    // On essaie de se connecter, sinon on inscrit
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (signInError) {
      // Si compte inexistant, on le crée
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) alert("Erreur: " + signUpError.message);
      else alert("Compte créé ! Vous êtes connecté.");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMyBet(null);
  };

  const handleVote = async (matchId: number, selection: 'HOME' | 'AWAY') => {
    if (!user) return alert("Connectez-vous pour jouer !");
    if (myBet) return alert("Vous avez déjà joué aujourd'hui ! (1 choix max)");

    // Appel à la fonction magique de la base de données
    const { error } = await supabase.rpc('place_bet', { 
      match_id_input: matchId, 
      selection_input: selection 
    });

    if (error) {
      alert("Erreur : " + error.message);
    } else {
      // Succès ! On recharge les données pour voir les cotes bouger
      setMyBet(matchId);
      fetchMatches();
    }
  };

  // 4. CALCULS MATHÉMATIQUES
  const calculateOdds = (myVotes: number, opponentVotes: number) => {
    const safeMyVotes = Math.max(myVotes, 1);
    const ratio = opponentVotes / safeMyVotes;
    return (1 + Math.sqrt(ratio)).toFixed(2);
  };
  const calculateGain = (odds: string) => (4 * parseFloat(odds)).toFixed(1);


  // 5. RENDU VISUEL
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur border-b border-slate-800 p-4 flex justify-between items-center shadow-lg">
        <div>
          <h1 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
            ODDS ARENA
          </h1>
        </div>
        
        {user ? (
          <button onClick={handleLogout} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-700 transition-colors">
            {user.email.split('@')[0]} (Déco)
          </button>
        ) : (
          <span className="text-xs text-slate-500">Non connecté</span>
        )}
      </header>

      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* BLOC LOGIN (Si pas connecté) */}
        {!user && (
          <div className="bg-indigo-900/20 border border-indigo-500/30 p-6 rounded-2xl text-center space-y-4">
            <h2 className="text-lg font-bold text-indigo-300">Identifiez-vous pour jouer</h2>
            <input 
              type="email" placeholder="Email" 
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm focus:border-indigo-500 outline-none"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input 
              type="password" placeholder="Mot de passe" 
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm focus:border-indigo-500 outline-none"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button 
              onClick={handleLogin} disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded shadow-lg transition-all"
            >
              {loading ? "Chargement..." : "Entrer / S'inscrire"}
            </button>
            <p className="text-[10px] text-slate-400">Pas de compte ? Saisissez vos infos, il sera créé automatiquement.</p>
          </div>
        )}

        {/* FEEDBACK SI A DÉJÀ JOUÉ */}
        {user && myBet && (
          <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl flex items-center gap-3">
            <div className="text-2xl">🔒</div>
            <div className="text-sm text-emerald-300">
              <span className="font-bold">Pari validé !</span><br/>
              Les cotes continuent de bouger jusqu'au match. Reviens ce soir pour le résultat.
            </div>
          </div>
        )}

        {/* LISTE DES MATCHS */}
        <section className={`space-y-4 ${!user ? 'opacity-50 pointer-events-none blur-sm' : ''}`}>
          {matches.map((match) => {
            const homeOdds = calculateOdds(match.home_votes, match.away_votes);
            const awayOdds = calculateOdds(match.away_votes, match.home_votes);
            const isMyMatch = myBet === match.id;
            
            return (
              <div key={match.id} className={`rounded-2xl p-1.5 border shadow-lg relative overflow-hidden transition-all
                ${isMyMatch ? 'bg-slate-800 border-indigo-500 ring-1 ring-indigo-500' : 'bg-slate-900 border-slate-800'}
              `}>
                <div className="flex justify-between px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>{match.home_team}</span>
                  <span>VS</span>
                  <span>{match.away_team}</span>
                </div>

                <div className="flex gap-1.5 h-28">
                  {/* BOUTON HOME */}
                  <VoteButton 
                    name={match.home_team} votes={match.home_votes} odds={homeOdds} 
                    onClick={() => handleVote(match.id, 'HOME')}
                    disabled={!!myBet} // Désactivé si on a déjà parié
                    color="blue"
                  />
                  {/* BOUTON AWAY */}
                  <VoteButton 
                    name={match.away_team} votes={match.away_votes} odds={awayOdds} 
                    onClick={() => handleVote(match.id, 'AWAY')}
                    disabled={!!myBet}
                    color="yellow"
                  />
                </div>
              </div>
            );
          })}
        </section>

      </div>
    </main>
  );
}

// Petit composant pour éviter de répéter le code des boutons
function VoteButton({ name, votes, odds, onClick, disabled, color }: any) {
  const gain = (4 * parseFloat(odds)).toFixed(1);
  const textColor = color === 'blue' ? 'text-blue-400' : 'text-yellow-400';
  
  return (
    <button 
      onClick={onClick} disabled={disabled}
      className={`flex-1 bg-slate-800/50 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group transition-all border border-transparent 
        ${!disabled ? 'hover:bg-slate-700 hover:border-slate-600 active:scale-95 cursor-pointer' : 'cursor-default'}
      `}
    >
      <div className="text-left z-10">
        <div className="text-[10px] text-slate-500 font-bold mb-1">{votes} JOUEURS</div>
      </div>
      <div className="text-right z-10">
        <div className={`text-3xl font-black ${textColor} tracking-tighter`}>x{odds}</div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5">Gain: <span className="text-white font-bold">{gain}</span></div>
      </div>
      <div className="absolute bottom-0 left-0 h-1 bg-slate-700/30 w-full">
         <div className="h-full bg-slate-500" style={{ width: `${Math.min(votes, 100)}%` }}></div>
      </div>
    </button>
  );
}