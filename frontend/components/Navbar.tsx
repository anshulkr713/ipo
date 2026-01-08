import React from "react";
import { LineChart, Send } from "lucide-react";

export function Navbar() {
  return (
    <nav className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg">
            <LineChart className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            IPO<span className="text-green-500">Track</span>
          </h1>
        </div>

        {/* Action Button */}
        <button className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-200 transition-all hover:scale-105 active:scale-95">
          <Send size={14} />
          <span>Join Channel</span>
        </button>
      </div>
    </nav>
  );
}