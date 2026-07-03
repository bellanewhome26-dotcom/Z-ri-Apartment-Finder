import React, { useState, useRef, useEffect } from 'react';
import { DatabaseState, Apartment, ChatMessage } from '../types';
import { Sparkles, Send, Loader2, Calendar, Mail, FileText, CheckCircle2, RefreshCw } from 'lucide-react';

interface CoPilotChatProps {
  data: DatabaseState;
  activeApartment?: Apartment;
  selectedApartmentId?: string;
  onSendMessage: (text: string) => Promise<void>;
  isChatting: boolean;
  onAddViewingEvent: (eventDetails: { apartmentId: string; title: string; start: string; end: string; location: string }) => Promise<void>;
  onSendEmailInquiry: (emailDetails: { apartmentId: string; toEmail: string; subject: string; text: string; sendDirectly: boolean }) => Promise<any>;
}

export default function CoPilotChat({
  data,
  activeApartment,
  selectedApartmentId,
  onSendMessage,
  isChatting,
  onAddViewingEvent,
  onSendEmailInquiry,
}: CoPilotChatProps) {
  const [inputText, setInputText] = useState<string>('');
  const [activeAction, setActiveAction] = useState<any>(null);
  
  // Gmail draft details
  const [draftTo, setDraftTo] = useState<string>('');
  const [draftSubject, setDraftSubject] = useState<string>('');
  const [draftText, setDraftText] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailOutcome, setEmailOutcome] = useState<string>('');

  // Calendar event details
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventStart, setEventStart] = useState<string>('');
  const [eventEnd, setEventEnd] = useState<string>('');
  const [eventLocation, setEventLocation] = useState<string>('');
  const [isCreatingEvent, setIsCreatingEvent] = useState<boolean>(false);
  const [eventOutcome, setEventOutcome] = useState<string>('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data.chatHistory, isChatting]);

  // Read suggestedAction from last GPT prompt
  // Wait, we can get active actions from the newest chat message, or state
  // Let's watch if there is a suggestion triggered from AI
  const lastMsg = data.chatHistory[data.chatHistory.length - 1];

  // Present presets depending on whether we have an active housing selected
  const presets = [
    { label: "📊 Vergleich Zürich/Wallisellen Steuerfuss", prompt: "Erkläre mir, wie ein Umzug nach Wallisellen mir bei meinem Gehalt Steuern spart bezüglich des Gemeindesteuerfusses." },
    { label: "📝 Bewerbungsschreiben auf Hochdeutsch generieren", prompt: "Erstelle ein formelles Bewerbungsschreiben auf Hochdeutsch passend für dieses Objekt." },
    { label: "🚊 S-Bahn-Anbindung an Zürich HB berechnen", prompt: "Erkläre mir die Pendelzeit, VBZ-Anbindungen und ÖV-Verbindungen für diese Lage." },
    { label: "⚖️ Mietpreis-Tragbarkeit überprüfen", prompt: "Überprüfe, ob der Mietzins dieses Objekts den Standardberechnungen zur 33%-Tragbarkeit entspricht." }
  ];

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isChatting) return;
    
    const userText = inputText;
    setInputText('');
    setActiveAction(null);
    setEmailOutcome('');
    setEventOutcome('');

    await onSendMessage(userText);
  };

  const handlePresetClick = async (presetPrompt: string) => {
    if (isChatting) return;
    let text = presetPrompt;
    if (activeApartment) {
      text += ` referring to active apartment ID: ${activeApartment.id} (${activeApartment.title} at ${activeApartment.address}).`;
    }
    setActiveAction(null);
    setEmailOutcome('');
    setEventOutcome('');
    await onSendMessage(text);
  };

  // Inspect if the co-pilot generated actionable items
  const handleOpenAction = (action: any) => {
    setActiveAction(action);
    setEmailOutcome('');
    setEventOutcome('');

    if (action.type === 'COMPOSE_EMAIL') {
      setDraftTo(action.params.toEmail || 'landlord@property.ch');
      setDraftSubject(action.params.subject || 'Application/Inquiry');
      setDraftText(action.params.text || '');
    } else if (action.type === 'CREATE_CALENDAR') {
      setEventTitle(action.params.title || 'Viewing Appointment');
      setEventStart(action.params.start || '2026-06-22T18:30:00');
      setEventEnd(action.params.end || '2026-06-22T19:30:00');
      setEventLocation(action.params.location || '');
    }
  };

  const handleSubmitEmail = async (sendDirectly: boolean) => {
    setIsSendingEmail(true);
    try {
      const result = await onSendEmailInquiry({
        apartmentId: activeApartment?.id || '',
        toEmail: draftTo,
        subject: draftSubject,
        text: draftText,
        sendDirectly
      });
      if (result && result.status) {
        setEmailOutcome(result.status);
      } else {
        setEmailOutcome(sendDirectly ? "E-Mail wurde erfolgreich direkt über bellanewhome26@gmail.com gesendet!" : "Entwurf wurde erfolgreich gespeichert.");
      }
    } catch (e: any) {
      setEmailOutcome("Problem bei der E-Mail-Integration: " + e.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSubmitEvent = async () => {
    setIsCreatingEvent(true);
    try {
      await onAddViewingEvent({
        apartmentId: activeApartment?.id || '',
        title: eventTitle,
        start: eventStart,
        end: eventEnd,
        location: eventLocation
      });
      setEventOutcome("Besichtigungstermin wurde direkt in den Google-Kalender synchronisiert!");
    } catch (e: any) {
      setEventOutcome("Problem beim Kalender: " + e.message);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full min-h-[480px]">
      <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-slate-800 text-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
            <span>Zürcher KI-Wohnungsassistent</span>
          </h3>
          <p className="text-3xs text-slate-400 font-sans mt-0.5">Berechnet Steuerfuss, S-Bahn-Linien & Schweizer Vorgaben</p>
        </div>
        {activeApartment && (
          <span className="text-4xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
            Fokus: {activeApartment.title.substring(0, 16)}...
          </span>
        )}
      </div>

      {/* Chat pane */}
      <div className="flex-1 overflow-y-auto space-y-4 max-h-[340px] border border-slate-100 bg-slate-50 p-4 rounded-xl mb-4 text-xs">
        {data.chatHistory.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                isUser 
                  ? 'bg-slate-900 border border-slate-850 text-white rounded-br-none font-sans' 
                  : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none shadow-2xs font-sans'
              }`}>
                {/* Text body */}
                <div className="whitespace-pre-wrap">{msg.text}</div>

                <div className={`text-[7pt] font-mono mt-1 ${isUser ? 'text-slate-400 text-right' : 'text-slate-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {isChatting && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2 text-slate-500 shadow-2xs">
              <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
              <span className="font-medium animate-pulse text-3xs font-mono uppercase tracking-wider">Analysiere Dokumente & Steuerfuss-Ersparnisse...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Actions panel */}
      {activeApartment && !activeAction && (
        <div className="mb-4">
          <p className="text-3xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">Empfohlene KI-Aktionen:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleOpenAction({
                type: 'COMPOSE_EMAIL',
                params: {
                  toEmail: activeApartment.contactEmail || 'vermietung@property.ch',
                  subject: `Bewerbung / Anfrage für Mietobjekt: ${activeApartment.title}`,
                  text: `Sehr geehrte Vermietung,\n\nich bewerbe mich mit grossem Interesse für die Wohnung "${activeApartment.title}" in ${activeApartment.address}...\n\nMit freundlichen Grüssen,\nBella`
                }
              })}
              className="flex items-center gap-1.5 text-2xs bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 font-semibold px-3 py-1.5 rounded-lg select-none transition-all duration-150 animate-fade-in"
            >
              <Mail className="w-3.5 h-3.5" />
              E-Mail an Vermieter verfassen
            </button>
            <button
              onClick={() => handleOpenAction({
                type: 'CREATE_CALENDAR',
                params: {
                  title: `Besichtigung: ${activeApartment.title}`,
                  start: activeApartment.viewingTime?.includes("Monday") ? "2026-06-22T18:30:00" : "2026-06-24T17:00:00",
                  end: activeApartment.viewingTime?.includes("Monday") ? "2026-06-22T19:30:00" : "2026-06-24T18:00:00",
                  location: activeApartment.address
                }
              })}
              className="flex items-center gap-1.5 text-2xs bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 font-semibold px-3 py-1.5 rounded-lg select-none transition-all duration-150 animate-fade-in"
            >
              <Calendar className="w-3.5 h-3.5" />
              Besichtigung im Kalender eintragen
            </button>
          </div>
        </div>
      )}

      {/* Action configuration popup / box view inside chat */}
      {activeAction && (
        <div className="border border-indigo-150 bg-indigo-50/40 p-4 rounded-xl mb-4 font-sans text-slate-700">
          <div className="flex items-center justify-between mb-3 border-b border-indigo-100 pb-2">
            <span className="text-2xs font-extrabold uppercase tracking-wider text-indigo-700 font-mono flex items-center gap-1.5">
              {activeAction.type === 'COMPOSE_EMAIL' ? <Mail className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
              {activeAction.type === 'COMPOSE_EMAIL' ? 'Bewerbungsanfrage prüfen' : 'Besichtigung in Zürich planen'}
            </span>
            <button onClick={() => setActiveAction(null)} className="text-3xs font-semibold text-slate-400 hover:text-slate-600">
              Schliessen
            </button>
          </div>

          {activeAction.type === 'COMPOSE_EMAIL' ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-2xs">
                <label className="flex flex-col">
                  <span className="text-slate-400 font-medium mb-1">An:</span>
                  <input
                    type="email"
                    value={draftTo}
                    onChange={(e) => setDraftTo(e.target.value)}
                    className="bg-white border rounded-lg p-1.5 outline-none"
                  />
                </label>
                <label className="flex flex-col">
                  <span className="text-slate-400 font-medium mb-1">Betreff:</span>
                  <input
                    type="text"
                    value={draftSubject}
                    onChange={(e) => setDraftSubject(e.target.value)}
                    className="bg-white border rounded-lg p-1.5 outline-none truncate"
                  />
                </label>
              </div>

              <label className="flex flex-col text-2xs">
                <span className="text-slate-400 font-medium mb-1">Anschreiben (Hochdeutsch):</span>
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  className="bg-white border rounded-lg p-2 resize-none outline-none font-mono text-[8pt]"
                  rows={6}
                />
              </label>

              {emailOutcome ? (
                <p className="text-2xs text-emerald-800 bg-emerald-50 border border-emerald-100 p-2 rounded-lg font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {emailOutcome}
                </p>
              ) : (
                <div className="flex justify-end gap-2 text-2xs">
                  <button
                    onClick={() => handleSubmitEmail(false)}
                    disabled={isSendingEmail}
                    className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg select-none font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Entwurf speichern
                  </button>
                  <button
                    onClick={() => handleSubmitEmail(true)}
                    disabled={isSendingEmail}
                    className="bg-indigo-600 border border-indigo-500 text-white px-3 py-1.5 rounded-lg select-none font-semibold hover:bg-indigo-500 flex items-center gap-1 cursor-pointer"
                  >
                    {isSendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Direkt via Gmail senden
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 text-2xs">
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col">
                  <span className="text-slate-400 font-medium mb-1">Terminbezeichnung:</span>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="bg-white border rounded-lg p-1.5 outline-none"
                  />
                </label>
                <label className="flex flex-col">
                  <span className="text-slate-400 font-medium mb-1">Ort:</span>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="bg-white border rounded-lg p-1.5 outline-none"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col">
                  <span className="text-slate-400 font-medium mb-1">Startzeitpunkt:</span>
                  <input
                    type="datetime-local"
                    value={eventStart}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEventStart(val);
                      if (val) {
                        try {
                          const d = new Date(val);
                          if (!isNaN(d.getTime())) {
                            // Automatically set end time to 1 hour after start time
                            const oneHourLater = new Date(d.getTime() + 60 * 60 * 1000);
                            const year = oneHourLater.getFullYear();
                            const month = String(oneHourLater.getMonth() + 1).padStart(2, '0');
                            const day = String(oneHourLater.getDate()).padStart(2, '0');
                            const hours = String(oneHourLater.getHours()).padStart(2, '0');
                            const minutes = String(oneHourLater.getMinutes()).padStart(2, '0');
                            setEventEnd(`${year}-${month}-${day}T${hours}:${minutes}`);
                          } else {
                            setEventEnd(val);
                          }
                        } catch (err) {
                          setEventEnd(val);
                        }
                      }
                    }}
                    className="bg-white border rounded-lg p-1.5 outline-none"
                  />
                </label>
                <label className="flex flex-col">
                  <span className="text-slate-400 font-medium mb-1">Endzeitpunkt:</span>
                  <input
                    type="datetime-local"
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    className="bg-white border rounded-lg p-1.5 outline-none"
                  />
                </label>
              </div>

              {eventOutcome ? (
                <p className="text-2xs text-emerald-800 bg-emerald-50 border border-emerald-100 p-2 rounded-lg font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {eventOutcome}
                </p>
              ) : (
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleSubmitEvent}
                    disabled={isCreatingEvent}
                    className="bg-emerald-600 text-white rounded-lg px-3 py-1.5 font-semibold hover:bg-emerald-500 select-none flex items-center gap-1 cursor-pointer"
                  >
                    {isCreatingEvent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    Im Google Kalender eintragen
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Presets and entry field */}
      {!activeAction && (
        <div className="mb-4">
          <p className="text-3xs font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">KI-Schnellaktionen:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {presets.slice(0, activeApartment ? 4 : 2).map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetClick(p.prompt)}
                disabled={isChatting}
                className="text-left select-none text-2xs text-slate-600 bg-white hover:bg-slate-50 border border-slate-100 p-2 rounded-lg font-medium transition-all duration-150 truncate shrink-0 disabled:opacity-50"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="flex gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isChatting}
          placeholder={activeApartment ? `Fragen Sie mich über "${activeApartment.title}"...` : "Gemeindesteuerfuss, Pendelzeiten oder Bewerbungsunterlagen vergleichen..."}
          className="flex-1 bg-white border border-slate-200 focus:border-slate-800 outline-none rounded-xl px-3.5 py-2.5 text-xs font-sans disabled:bg-slate-100/60 transition-all duration-150"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isChatting}
          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white p-2.5 px-4 rounded-xl flex items-center justify-center select-none cursor-pointer transition-all duration-150 shrink-0"
        >
          <Send className="w-4 h-4 shrink-0" />
        </button>
      </form>
    </div>
  );
}
