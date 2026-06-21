import React, { useState } from 'react';
import { EmailAlert } from '../types';
import { Mail, Check, AlertCircle, Eye, EyeOff, Loader2, Trash2, ShieldX, Sparkles, Filter } from 'lucide-react';

interface EmailFeedProps {
  emails: EmailAlert[];
  onSelectApartmentByEmail: (emailId: string) => void;
  onClearSimulated?: () => void;
  onArchiveUnrelated: (emailIds: string[]) => Promise<void>;
  isArchivingInProgress: boolean;
  accessToken: string | null;
}

export default function EmailFeed({
  emails,
  onSelectApartmentByEmail,
  onClearSimulated,
  onArchiveUnrelated,
  isArchivingInProgress,
  accessToken
}: EmailFeedProps) {
  const [activeTab, setActiveTab] = useState<'apartments' | 'unrelated'>('apartments');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilterCheatSheet, setShowFilterCheatSheet] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  // Group emails based on context classification (or legacy absence)
  const apartmentEmails = emails.filter(e => e.category !== 'Unrelated');
  const unrelatedEmails = emails.filter(e => e.category === 'Unrelated');

  const visibleEmails = activeTab === 'apartments' ? apartmentEmails : unrelatedEmails;
  const simulatedCount = emails.filter(e => e.id.startsWith('em_sim_')).length;

  return (
    <div className="flex flex-col flex-1" id="email-feed-root">
      {/* Title block */}
      <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-display font-semibold text-slate-800 text-sm">bellanewhome26@gmail.com - Eingehende Meldungen</h3>
          <p className="text-3xs text-slate-400 font-sans mt-0.5">Automatisches KI-Scanning & Filtersortierung</p>
        </div>
        
        {onClearSimulated && simulatedCount > 0 && (
          <button
            onClick={onClearSimulated}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold border border-rose-220 bg-rose-50/60 hover:bg-rose-100 text-rose-750 rounded-lg transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
            title="Simulierte Alarme aus der Datenbank entfernen"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Simulationsdaten löschen ({simulatedCount})</span>
          </button>
        )}
      </div>

      {/* Tab Switcher & Clean-up controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 mb-4">
        <div className="flex gap-1.5 text-2xs font-semibold">
          <button
            onClick={() => { setActiveTab('apartments'); setExpandedId(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'apartments' 
                ? 'bg-white text-slate-800 shadow-sm border border-slate-200/60' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3 h-3 text-emerald-500" />
            <span>Wohnungs-Alarme ({apartmentEmails.length})</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('unrelated'); setExpandedId(null); }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'unrelated' 
                ? 'bg-white text-slate-800 shadow-sm border border-slate-200/60' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldX className="w-3 h-3 text-slate-550" />
            <span>Nicht relevant ({unrelatedEmails.length})</span>
          </button>
        </div>

        <button
          onClick={() => setShowFilterCheatSheet(prev => !prev)}
          className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
        >
          <Filter className="w-3 h-3" />
          <span>Gmail-Ablageregel erstellen</span>
        </button>
      </div>

      {/* Gmail native Rule Assistant Drawer */}
      {showFilterCheatSheet && (
        <div className="bg-gradient-to-br from-indigo-50/60 to-slate-50 border border-indigo-100 rounded-xl p-4 mb-4 text-xs font-sans text-slate-700 animate-fadeIn shadow-xs">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-slate-800 flex items-center gap-1.5 text-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Saubere Gmail Inbox Ablage konfigurieren</span>
            </h4>
            <button 
              onClick={() => setShowFilterCheatSheet(false)}
              className="text-slate-450 hover:text-slate-650 font-bold"
            >
              ×
            </button>
          </div>
          
          <p className="mt-1.5 text-3xs text-slate-500 leading-relaxed">
            Damit E-Mails wie Bestellbestätigungen, Rechnungen oder Werbung gar nicht erst Ihren Posteingang im Copilot belasten, können Sie direkt in Gmail einstellen, dass diese automatisch in einem anderen Ordner landen.
          </p>

          <div className="mt-3 space-y-2 text-3xs">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-700 block mb-1">Option A: Nur Wohnungs-Alarme in den Posteingang lassen</span>
              <p className="text-slate-500">
                Legen Sie eine Regel in den Gmail-Einstellungen fest: Suchen Sie nach <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-indigo-600">subject:(Wohnung OR alert OR Flatfox OR Homegate OR Comparis OR Suchabo)</code>, und weisen Sie diese mit dem Label "Zuri-Apartment" zu, während alles andere archiviert wird.
              </p>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-700 block mb-1">Option B: Direkte Kopier-Regel für Gmail Suchfilter</span>
              <p className="text-slate-505">
                Kopieren Sie diesen Suchtext in die Gmail-Filtersuche am Desktop:
              </p>
              <div className="flex items-center justify-between gap-2 mt-1.5 bg-slate-50 p-2 rounded border border-slate-150 font-mono text-4xs text-slate-800 overflow-x-auto select-all">
                <span>subject:(Wohnung OR alert OR Flatfox OR Homegate OR Comparis OR Suchabo OR Suchauftrag OR Mietobjekt OR Immobilien)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unrelated Emails Batch action box */}
      {activeTab === 'unrelated' && unrelatedEmails.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-2xs">Irrelevante E-Mails ausräumen?</p>
              <p className="text-3xs text-amber-600 mt-0.5">
                Wir haben {unrelatedEmails.length} unbeteiligte E-Mails identifiziert. Sie können diese direkt aus Ihrem Live-Gmail Posteingang archivieren.
              </p>
            </div>
          </div>

          <button
            onClick={() => onArchiveUnrelated(unrelatedEmails.map(e => e.id))}
            disabled={isArchivingInProgress || !accessToken}
            className="flex items-center gap-1.5 px-3 py-1.5 text-2xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {isArchivingInProgress ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>Jetzt archivieren ({unrelatedEmails.length})</span>
          </button>
        </div>
      )}

      {/* Main Email List View */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {visibleEmails.map((email) => {
          const isExpanded = expandedId === email.id;

          return (
            <div
              key={email.id}
              className={`rounded-xl border transition-all duration-150 p-4 ${
                isExpanded ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 hover:border-slate-200'
              }`}
            >
              {/* Header */}
              <div 
                className="flex items-start justify-between gap-3 cursor-pointer select-none"
                onClick={() => toggleExpand(email.id)}
              >
                <div className="flex gap-2.5 items-start">
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    email.category === 'Unrelated' 
                      ? 'bg-slate-100 text-slate-455' 
                      : (email.parsed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')
                  }`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-3xs font-mono text-slate-400">
                      {email.from} • {new Date(email.date).toLocaleDateString()}
                    </span>
                    <h5 className="font-display font-bold text-slate-800 text-sm mt-0.5 leading-snug">
                      {email.subject}
                    </h5>
                    <p className="text-2xs text-slate-500 font-sans mt-1 line-clamp-1">{email.snippet}</p>
                  </div>
                </div>

                {/* Badges/Expanders */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {email.category === 'Unrelated' ? (
                    <span className="inline-flex items-center gap-1 text-[7pt] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      Unbeteiligt
                    </span>
                  ) : email.parsed ? (
                    <span className="inline-flex items-center gap-1 text-[7pt] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      <Check className="w-2.5 h-2.5" /> KI-analysiert
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[7pt] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                      In Bearbeitung
                    </span>
                  )}
                  <span className="text-3xs text-indigo-600 font-semibold flex items-center gap-1">
                    {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {isExpanded ? 'Schliessen' : 'Details'}
                  </span>
                </div>
              </div>

              {/* Expander Section */}
              {isExpanded && (
                <div className="mt-4 pt-3 border-t border-slate-200/60 animate-fadeIn">
                  <div className="bg-slate-900 text-slate-100 p-3.5 rounded-lg font-mono text-[8.5pt] leading-relaxed overflow-x-auto max-h-64 whitespace-pre-wrap">
                    {email.body}
                  </div>

                  {email.parsed && email.apartmentId && email.category !== 'Unrelated' && (
                    <div className="mt-3 flex items-center justify-between text-2xs bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100">
                      <span>Inserat vollständig in der Raumdatenbank erfasst.</span>
                      <button
                        onClick={() => onSelectApartmentByEmail(email.id)}
                        className="text-xs text-indigo-700 hover:underline font-bold font-sans cursor-pointer"
                      >
                        Dashboard-Details hervorheben →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {visibleEmails.length === 0 && (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-500 font-sans">
              {activeTab === 'apartments' 
                ? 'Keine Wohnungs-Alarme in diesem Ordner gefunden.' 
                : 'Glückwunsch! Keine irrelevanten E-Mails im Posteingang erkannt.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
