import BottomNav from "../components/BottomNav";

export default function Rules() {
  return (
    <div className="min-h-screen bg-[#121212] text-gray-200 font-sans pb-24">
       <header className="bg-[#1e1e1e] p-4 border-b border-[#333] sticky top-0 z-10">
        <h1 className="text-xl font-bold text-center text-emerald-500">RÈGLES DU JEU</h1>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-8 text-sm leading-relaxed text-gray-300">
        <section>
          <h2 className="text-white font-bold text-lg mb-2">🏆 Le But du Jeu</h2>
          <p>Devinez le vainqueur des matchs quotidiens pour accumuler des points. Le but est de grimper au sommet du classement général.</p>
        </section>

        <section>
          <h2 className="text-white font-bold text-lg mb-2">📊 Les Cotes Dynamiques</h2>
          <p className="mb-2">Les cotes ne sont pas fixées par des bookmakers, mais par <strong>les joueurs</strong>.</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>Si tout le monde parie sur le Favori, sa cote baisse (gains faibles).</li>
            <li>Si vous pariez sur l'Outsider et qu'il gagne, vous remportez le jackpot !</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-bold text-lg mb-2">🧮 Calcul des Points</h2>
          <p>Le score d'un match est calculé sur le terrain réel :</p>
          <div className="bg-[#1e1e1e] p-3 rounded mt-2 border border-[#333] font-mono text-xs">
            Points = (Buts marqués) - (0.5 * Buts encaissés) + (3 pts si Victoire)
          </div>
          <p className="mt-2">Votre gain final = Points Terrain x Cote du vote.</p>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}