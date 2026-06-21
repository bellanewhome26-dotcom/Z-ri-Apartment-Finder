import React, { useState } from 'react';
import { EmailAlert } from '../types';
import { Mail, Check, AlertCircle, Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';

interface EmailFeedProps {
  emails: EmailAlert[];
  onSelectApartmentByEmail: (emailId: string) => void;
  onClearSimulated?: () => void;
}

export default function EmailFeed({ emails, onSelectApartmentByEmail, onClearSimulated }: EmailFeedProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const simulatedCount = emails.filter(e => e.id.startsWith('em_sim_')).length;

  return (
    <div className="flex flex-col flex-1">
      <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-display font-semibold text-slate-800 text-sm">bellanewhome26@gmail.com - Eingehende Meldungen</h3>
          <p className="text-3xs text-slate-400 font-sans mt-0.5">Gescannte Mailinglisten, die den Suchkriterien entsprechen</p>
        </div>
        
        {onClearSimulated && simulatedCount > 0 && (
          <button
            onClick={onClearSimulated}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold border border-rose-250 bg-rose-50/60 hover:bg-rose-100 text-rose-750 rounded-lg transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
            title="Simulierte Alarme aus der Datenbank entfernen"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Simulationsdaten löschen ({simulatedCount})</span>
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {emails.map((email) => {
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
                  <div className={`p-2 rounded-lg ${email.parsed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'} shrink-0 mt-0.5`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-3xs font-mono text-slate-400">{email.from} • {new Date(email.date).toLocaleDateString()}</p>
                    <h5 className="font-display font-bold text-slate-800 text-sm mt-0.5 leading-snug">
                      {email.subject}
                    </h5>
                    <p className="text-2xs text-slate-500 font-sans mt-1 line-clamp-1">{email.snippet}</p>
                  </div>
                </div>

                {/* Badges/Expanders */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {email.parsed ? (
                    <span className="inline-flex items-center gap-1 text-[7pt] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      <Check className="w-2.5 h-2.5" /> KI-analysiert
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[7pt] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                      Unbehandelt
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
                <div className="mt-4 pt-3 border-t border-slate-200/60">
                  <div className="bg-slate-900 text-slate-100 p-3.5 rounded-lg font-mono text-[8.5pt] leading-relaxed overflow-x-auto max-h-64 whitespace-pre-wrap">
                    {email.body}
                  </div>

                  {email.parsed && email.apartmentId && (
                    <div className="mt-3 flex items-center justify-between text-2xs bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100">
                      <span>Inserat vollständig in der Raumdatenbank erfasst.</span>
                      <button
                        onClick={() => onSelectApartmentByEmail(email.id)}
                        className="text-xs text-indigo-700 hover:underline font-bold font-sans"
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

        {emails.length === 0 && (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-450 font-sans">Ihr Posteingang für Inserats-Alerts ist leer. Versuchen Sie oben den Eingang abzugleichen!</p>
          </div>
        )}
      </div>
    </div>
  );
}
