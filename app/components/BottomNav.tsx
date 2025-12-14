"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Paris", href: "/", icon: "M12 6v12m-8-6h16" },
    { name: "Top", href: "/leaderboard", icon: "M16 4h2a2 2 0 0 1 2 2v14H4V6a2 2 0 0 1 2-2h2" },
    { name: "Profil", href: "/profile", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" },
    { name: "Infos", href: "/rules", icon: "M12 16h.01" },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#1e1e1e] border-t border-[#333] pb-safe z-50">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="flex flex-col items-center justify-center w-full h-full space-y-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isActive ? "#10b981" : "#666"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon === "M12 6v12m-8-6h16" ? "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" : item.icon} />
                {item.name === "Infos" && <circle cx="12" cy="12" r="10" />}
                {item.name === "Infos" && <line x1="12" y1="16" x2="12" y2="12" />}
                {item.name === "Infos" && <line x1="12" y1="8" x2="12.01" y2="8" />}
              </svg>
              <span className={`text-[10px] font-bold ${isActive ? "text-emerald-500" : "text-gray-500"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}