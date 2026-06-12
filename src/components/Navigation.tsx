"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/", icon: <Icons.Home className="w-5 h-5" /> },
    { label: "Track", href: "/track", icon: <Icons.PlusCircle className="w-5 h-5" /> },
    { label: "Insights", href: "/insights", icon: <Icons.BarChart3 className="w-5 h-5" /> },
    { label: "Challenges", href: "/challenges", icon: <Icons.Trophy className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Desktop Header */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 hidden md:flex items-center justify-between px-6 h-16 transition-all duration-300">
        <Link href="/" className="flex items-center gap-2">
          <Icons.Leaf className="text-primary w-6 h-6 animate-pulse" />
          <span className="font-display text-xl font-bold text-primary">EcoMind</span>
        </Link>
        <nav className="flex gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-semibold transition-all duration-200 active:scale-95 flex items-center gap-1.5 ${
                  isActive
                    ? "text-primary border-b-2 border-primary pb-1"
                    : "text-on-surface-variant hover:text-primary/80"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Mobile Top Header */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 flex items-center justify-between px-6 h-16 md:hidden shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <Icons.Leaf className="text-primary w-5 h-5" />
          <span className="font-display text-lg font-bold text-primary">EcoMind</span>
        </Link>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 w-full z-50 rounded-t-xl border-t border-outline-variant/30 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.5)] bg-surface/80 backdrop-blur-xl flex justify-around items-center h-20 px-4 pb-safe md:hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 active:scale-90 transition-all duration-200 ${
                isActive ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary/80"
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
