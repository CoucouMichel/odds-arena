"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Configuration Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  
  // Formulaire nouveau match
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");

  // Au chargement
  useEffect(() => {
    checkAdmin();
    fetchMatches();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    // ⚠️ SÉCURITÉ BASIQUE : Remplacez par VOTRE email exact
    if (user?.email === "clementaubert@gmail.com") {
      setIsAdmin(true);
    } else {
      // Si pas admin, on renvoie à l'accueil
      window.location.href = "/";
    }
  };

  const fetchMatches = async () => {
    const { data } = await supabase.from("matches").select("*").order("id", { ascending: false });
    if (data) setMatches(data);
  };

  // 1. AJOUTER UN MATCH
  const handleAddMatch = async () => {
    const { error } = await supabase.from("matches").insert([{
      home_team: homeTeam,
      away_team: awayTeam,
      match_date: new Date().toISOString(), // Date d'aujourd'hui par défaut
      status: 'SCHEDULED'
    }]);

    if (error) alert("Erreur: " + error.message);
    else {
      setHomeTeam("");
      setAwayTeam("");
      fetchMatches();
    }
  };

const handleUpdateScore = async (id: number, home: string, away: string) => {
    const confirm = window.confirm("Attention : Valider le score va distribuer les points aux joueurs. Cette action est irréversible. Continuer ?");
    if (!confirm) return;

    // A. On enregistre d'abord le score brut
    const { error: updateError } = await supabase.from("matches").update({
      home_score: parseInt(home),
      away_score: parseInt(away),
      // On ne met pas 'FINISHED' tout de suite, la fonction RPC le fera
    }).eq('id', id);

    if (updateError) return alert("Erreur maj score");

    // B. On appelle la fonction magique de calcul
    const { error: rpcError } = await supabase.rpc('close_match', { 
      match_id_input: id 
    });

    if (rpcError) alert("Erreur calcul points: " + rpcError.message);
    else {
      alert("Match clôturé et points distribués !");
      fetchMatches();
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white p-8 font-sans">
      <h1 className="text-3xl font-bold text-red-500 mb-8">ZONE ADMIN 🛠️</h1>

      {/* AJOUTER UN MATCH */}
      <section className="bg-slate-800 p-6 rounded-xl mb-10 border border-slate-700">
        <h2 className="text-xl font-bold mb-4">Ajouter un Match</h2>
        <div className="flex gap-4">
          <input 
            placeholder="Équipe Domicile (ex: PSG)" 
            className="bg-slate-900 border border-slate-600 p-2 rounded text-white"
            value={homeTeam} onChange={e => setHomeTeam(e.target.value)}
          />
          <span className="py-2 font-bold">VS</span>
          <input 
            placeholder="Équipe Extérieur (ex: OM)" 
            className="bg-slate-900 border border-slate-600 p-2 rounded text-white"
            value={awayTeam} onChange={e => setAwayTeam(e.target.value)}
          />
          <button 
            onClick={handleAddMatch}
            className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded font-bold"
          >
            Créer
          </button>
        </div>
      </section>

      {/* LISTE DES MATCHS */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Gérer les Matchs existants</h2>
        {matches.map(match => (
          <div key={match.id} className="bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-slate-700">
            
            <div className="w-1/3">
              <div className="font-bold text-lg">{match.home_team} - {match.away_team}</div>
              <div className="text-xs text-slate-400">ID: {match.id} • Votes: {match.home_votes} / {match.away_votes}</div>
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="number" placeholder={match.home_score ?? 0}
                className="w-16 bg-slate-900 p-2 rounded text-center"
                id={`home-${match.id}`}
              />
              <span>-</span>
              <input 
                type="number" placeholder={match.away_score ?? 0}
                className="w-16 bg-slate-900 p-2 rounded text-center"
                id={`away-${match.id}`}
              />
              <button 
                onClick={() => {
                  const h = (document.getElementById(`home-${match.id}`) as HTMLInputElement).value;
                  const a = (document.getElementById(`away-${match.id}`) as HTMLInputElement).value;
                  handleUpdateScore(match.id, h, a);
                }}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-sm font-bold"
              >
                Valider Score
              </button>
            </div>

          </div>
        ))}
      </section>
    </main>
  );
}