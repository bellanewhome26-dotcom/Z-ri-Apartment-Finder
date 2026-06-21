import React from 'react';
import { Mail, RefreshCw, Smartphone, Key, Calendar, Sparkles, Globe } from 'lucide-react';

interface HeaderProps {
  isSyncing: boolean;
  onSync: () => void;
  oauthConnected: boolean;
  onConnectOauth: () => void;
  onConfigureScraping: () => void;
  hasScrapingTokenConfigured: boolean;
}

export default function Header({ 
  isSyncing, 
  onSync, 
  oauthConnected, 
  onConnectOauth,
  onConfigureScraping,
  hasScrapingTokenConfigured
}: HeaderProps) {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 py-4 px-6 md:px-8 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="bg-red-600 hover:bg-red-500 transition-colors p-2.5 rounded-xl shadow-md cursor-pointer flex items-center justify-center">
            {/* Elegant cross resembling Zurich / Switzerland flag aspect */}
            <span className="text-white font-bold text-xs tracking-wider font-display shrink-0">CH</span>
          </div>
          <div>
            <h1 className="font-display font-bold tracking-tight text-xl flex items-center gap-2">
              Zürich Alert Finder <span className="text-xs bg-red-600/25 text-red-400 font-normal px-2 py-0.5 rounded-full border border-red-500/20">KI-Copilot</span>
            </h1>
            <p className="text-xs text-slate-400 font-sans mt-0.5">Echtzeit-Alerts & kommunales Analyse-Dashboard</p>
          </div>
        </div>

        {/* Workspace Connection Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Target mail badge */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-xl text-xs text-slate-300 font-sans">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-200">bellanewhome26@gmail.com</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5"></span>
          </div>

          {/* Connect button */}
          <button
            onClick={onConnectOauth}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold select-none transition-all duration-200 shadow-sm border ${
              oauthConnected
                ? 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/50'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{oauthConnected ? 'Google verbunden' : 'Google verbinden'}</span>
          </button>

          {/* Web Scrobbler / Scrape Config button */}
          <button
            onClick={onConfigureScraping}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold select-none transition-all duration-200 shadow-sm border ${
              hasScrapingTokenConfigured
                ? 'bg-slate-800 hover:bg-slate-755 text-slate-200 border-slate-700/80'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>Web-Scrobbler</span>
          </button>

          {/* Sync Inbox Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-2 bg-white hover:bg-slate-100 disabled:bg-slate-200 text-slate-900 px-4 py-1.5 rounded-xl text-xs font-semibold select-none transition-all duration-150 disabled:opacity-50 cursor-pointer shadow-xs font-sans shrink-0 border border-slate-200"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Eingang abgleichen...' : 'E-Mail-Alerts abrufen'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
