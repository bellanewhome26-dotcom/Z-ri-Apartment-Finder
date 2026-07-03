import React, { useState } from 'react';
import { Apartment } from '../types';
import { MapPin, Check, Plus, ExternalLink, RefreshCw, MessageSquare, Landmark, Clock, Percent, FileText } from 'lucide-react';

interface ApartmentListProps {
  apartments: Apartment[];
  selectedId?: string;
  onSelect: (apt: Apartment) => void;
  onUpdateStatus: (id: string, status: Apartment['status']) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onDraftGoogleDoc: (apartmentId: string) => void;
}

export default function ApartmentList({
  apartments,
  selectedId,
  onSelect,
  onUpdateStatus,
  onUpdateNotes,
  onDraftGoogleDoc,
}: ApartmentListProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesTempText, setNotesTempText] = useState<string>('');

  const filtered = apartments.filter(apt => {
    if (filterStatus === 'all') return true;
    return apt.status === filterStatus;
  });

  const handleStartEditingNotes = (e: React.MouseEvent, apt: Apartment) => {
    e.stopPropagation();
    setEditingNotesId(apt.id);
    setNotesTempText(apt.notes || '');
  };

  const handleSaveNotes = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onUpdateNotes(id, notesTempText);
    setEditingNotesId(null);
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Filtering tools */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div>
          <h3 className="font-display font-semibold text-slate-800 text-sm">Analysierte Inserate ({filtered.length})</h3>
          <p className="text-3xs text-slate-400 font-sans mt-0.5">Ausgelesen aus Ihrem Posteingang bellanewhome26@gmail.com</p>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-xs bg-white border border-slate-200 outline-none rounded-lg px-2.5 py-1 text-slate-600 font-sans cursor-pointer focus:border-indigo-500"
        >
          <option value="all">Alle Status anzeigen</option>
          <option value="New">Status: Neu (New)</option>
          <option value="Interested">Status: Interessiert</option>
          <option value="Viewing Scheduled">Status: Besichtigung geplant</option>
          <option value="Applied">Status: Beworben</option>
          <option value="Accepted">Status: Zusage erhalten</option>
          <option value="Rejected">Status: Absage erhalten</option>
        </select>
      </div>

      {/* List Container */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
        {filtered.map((apt) => {
          const isSelected = apt.id === selectedId;
          const scoreColorClass = apt.score >= 90 
            ? 'text-emerald-700 bg-emerald-50 border-emerald-100' 
            : apt.score >= 80 
              ? 'text-indigo-700 bg-indigo-50 border-indigo-100' 
              : 'text-amber-700 bg-amber-50 border-amber-100';

          const statusBadgeColors: Record<Apartment['status'], string> = {
            'New': 'bg-sky-50 text-sky-700 border-sky-200',
            'Interested': 'bg-slate-100 text-slate-700 border-slate-200',
            'Viewing Scheduled': 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
            'Applied': 'bg-amber-50 text-amber-700 border-amber-200',
            'Accepted': 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
            'Rejected': 'bg-rose-100 text-rose-800 border-rose-200'
          };

          return (
            <div
              key={apt.id}
              onClick={() => onSelect(apt)}
              className={`rounded-xl border p-4 cursor-pointer select-none transition-all duration-150 ${
                isSelected
                  ? 'bg-slate-50 border-slate-900 shadow-xs ring-1 ring-slate-900/10'
                  : 'bg-white border-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Source & Title */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xs font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-mono">
                      {apt.source} Alert
                    </span>
                    <span className={`text-4xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${statusBadgeColors[apt.status]}`}>
                      {apt.status}
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-slate-800 text-sm mt-1 leading-snug">
                    {apt.title}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-sans">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{apt.address}</span>
                  </p>
                </div>

                {/* Score Circle Badge */}
                <div role="img" aria-label={`Match score: ${apt.score}%`} className={`flex flex-col items-center justify-center border rounded-xl px-2.5 py-1.5 ${scoreColorClass} shrink-0`}>
                  <span className="text-sm font-extrabold font-display leading-none">{apt.score}%</span>
                  <span className="text-[7pt] uppercase tracking-wider font-semibold font-mono mt-0.5">Treffer</span>
                </div>
              </div>

              {/* Core Features Ribbon */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                {apt.features.slice(0, 3).map((f, i) => (
                  <span key={i} className="text-2xs bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-md font-sans text-slate-600">
                    {f}
                  </span>
                ))}
                {apt.features.length > 3 && (
                  <span className="text-3xs text-slate-400 font-medium font-sans">
                    +{apt.features.length - 3} weitere
                  </span>
                )}
              </div>

              {/* Secondary Details Section */}
              <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 text-center font-sans">
                <div>
                  <p className="text-[7pt] text-slate-400 font-medium">Mietzins</p>
                  <p className="text-xs font-semibold text-slate-700 font-mono">CHF {apt.price}</p>
                </div>
                <div>
                  <p className="text-[7pt] text-slate-400 font-medium">Zimmer</p>
                  <p className="text-xs font-semibold text-slate-700">{apt.rooms} Zi.</p>
                </div>
                <div>
                  <p className="text-[7pt] text-slate-400 font-medium">Pendelzeit HB</p>
                  <p className="text-xs font-semibold text-slate-700 flex items-center justify-center gap-0.5">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{apt.commuteTimeHB} Min.</span>
                  </p>
                </div>
                <div>
                  <p className="text-[7pt] text-slate-400 font-medium">Steuerfuss</p>
                  <p className="text-xs font-semibold text-indigo-600">
                    {apt.taxMultiplier}%
                  </p>
                </div>
              </div>

              {/* Collapsible / Expandable interactive quick-note drawer */}
              {isSelected && (
                <div className="mt-4 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between text-2xs mb-2">
                    <span className="font-semibold text-slate-600">Persönliche Notizen & Bewertung:</span>
                    <button
                      onClick={(e) => handleStartEditingNotes(e, apt)}
                      className="text-3xs text-indigo-600 hover:underline font-semibold"
                    >
                      {editingNotesId === apt.id ? 'Abbrechen' : 'Notizen bearbeiten'}
                    </button>
                  </div>

                  {editingNotesId === apt.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        value={notesTempText}
                        onChange={(e) => setNotesTempText(e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg p-2 resize-none outline-none focus:border-indigo-500 font-sans w-full"
                        rows={2}
                      />
                      <button
                        onClick={(e) => handleSaveNotes(e, apt.id)}
                        className="bg-slate-900 text-white rounded-lg text-3xs py-1.5 px-3 self-end font-semibold shadow-xs"
                      >
                        Notizen speichern
                      </button>
                    </div>
                  ) : (
                    <p className="text-2xs text-slate-500 italic leading-relaxed bg-slate-100/60 p-2 rounded-lg border border-slate-100">
                      {apt.notes || 'Noch keine persönlichen Notizen erfasst. Nutzen Sie den KI-Copiloten, um ein Anschreiben zu erstellen.'}
                    </p>
                  )}

                  {/* Inline Status modification selector */}
                   <div className="mt-3 flex items-center justify-between gap-3 text-2xs bg-slate-100/50 p-2 rounded-lg border border-slate-100">
                     <span className="font-medium text-slate-500">Pipeline-Status:</span>
                     <select
                       value={apt.status}
                       onChange={(e) => onUpdateStatus(apt.id, e.target.value as Apartment['status'])}
                       className="text-xs bg-white border border-slate-200 outline-none rounded-md px-1.5 py-0.5 font-sans"
                     >
                       <option value="New">Neu</option>
                       <option value="Interested">Interessiert</option>
                       <option value="Viewing Scheduled">Besichtigung geplant</option>
                       <option value="Applied">Beworben</option>
                       <option value="Accepted">Zusage erhalten</option>
                       <option value="Rejected">Absage erhalten</option>
                     </select>
                   </div>

                   {/* Google Docs Cover Letter Creator */}
                   <div className="mt-2.5 pt-2 border-t border-dashed border-slate-150 flex items-center justify-between gap-2.5">
                     <div className="flex flex-col">
                       <span className="font-semibold text-[7px] uppercase tracking-wider text-slate-400 font-mono">Dossier-Dokumente</span>
                       <span className="text-[10px] text-slate-600 font-sans mt-0.5 font-medium">Bewerbungsschreiben entwerfen</span>
                     </div>
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         onDraftGoogleDoc(apt.id);
                       }}
                       className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs cursor-pointer active:scale-95 text-sans font-semibold shrink-0"
                     >
                       <FileText className="w-3.5 h-3.5" />
                       <span>In Google Docs erstellen</span>
                     </button>
                   </div>
                 </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-400 font-sans">Für diese Kategorie wurden keine passenden Inserate gefunden.</p>
          </div>
        )}
      </div>
    </div>
  );
}
