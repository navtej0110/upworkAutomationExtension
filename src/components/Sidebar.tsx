"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Briefcase, User, Zap, LayoutDashboard } from "lucide-react";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zinc-900 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-green-400" />
          <h1 className="text-lg font-bold">Upwork Auto</h1>
        </div>
        <p className="text-xs text-zinc-400 mt-1">AI Job Matching</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-green-600/20 text-green-400"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
