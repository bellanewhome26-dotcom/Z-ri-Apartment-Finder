import React from 'react';
import { DatabaseState, Apartment } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';
import { DollarSign, ShieldAlert, FileText, CheckCircle2, Clock, Landmark, Sparkles } from 'lucide-react';

interface AnalyticsGridProps {
  data: DatabaseState;
  selectedApartment?: Apartment;
}

export default function AnalyticsGrid({ data, selectedApartment }: AnalyticsGridProps) {
  // Bella's income
  const grossMonthlyIncome = 118500 / 12; // 9,875 CHF
  const rentLimit = grossMonthlyIncome * 0.33; // ~3,258 CHF max

  const activeRent = selectedApartment ? selectedApartment.price : 2400;
  const affordabilityRatio = (activeRent / grossMonthlyIncome) * 100;
  
  // Tax savings charts data based on Bella's 118.5K gross income
  const taxData = [
    { name: 'Zürich Stadt', multiplier: 119, taxAmount: 10450, color: '#f43f5e' },
    { name: 'Dübendorf', multiplier: 95, taxAmount: 8350, color: '#6366f1' },
    { name: 'Wallisellen', multiplier: 92, taxAmount: 8090, color: '#10b981' },
    { name: 'Küsnacht', multiplier: 75, taxAmount: 6590, color: '#eab308' },
  ];

  // Dossier status
  const contractUploaded = data.files.some(f => f.name.toLowerCase().includes('vertrag') || f.name.toLowerCase().includes('contract'));
  const creditUploaded = data.files.some(f => f.name.toLowerCase().includes('betreibung') || f.name.toLowerCase().includes('debt'));
  const totalFiles = data.files.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {/* 1. Affordability Gauge Box */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Schweizer Mietbudget-Grenzen</span>
            <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <h2 className="font-display font-bold text-2xl text-slate-800 mt-2">
            CHF {activeRent.toLocaleString()}<span className="text-xs text-slate-500 font-normal"> / Mo.</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ausgewählt: <span className="font-semibold text-slate-700">{selectedApartment ? selectedApartment.title.substring(0, 24) : 'Standard-Durchschnitt'}</span>
          </p>
        </div>

        {/* Math bar */}
        <div className="mt-4">
          <div className="flex justify-between text-2xs text-slate-400 font-medium mb-1">
            <span>Tragbarkeitslimit (33%-Grenze: CHF {Math.round(rentLimit)})</span>
            <span className={affordabilityRatio > 33 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
              {Math.round(affordabilityRatio)}% des Einkommens
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${Math.min(100, affordabilityRatio)}%` }} 
              className={`h-full rounded-full transition-all duration-300 ${
                affordabilityRatio > 33 ? 'bg-rose-500' : affordabilityRatio > 25 ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
            />
          </div>
          <p className="text-3xs text-slate-400 mt-2 leading-normal">
            Schweizer Vermieter setzen das 33%-Bruttolimit strikt durch. Bellas Lohn von CHF 118'500 ermöglicht eine sichere Wohnungssuche bis zu CHF {Math.round(rentLimit)}/Monat.
          </p>
        </div>
      </div>

      {/* 2. Municipal Tax Impact Box */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Steuerfuss-Ersparnisse nach Gemeinde</span>
            <Landmark className="w-4 h-4 text-indigo-500 shrink-0" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <h2 className="font-display font-extrabold text-2xl text-slate-800">
              {selectedApartment ? `${selectedApartment.taxMultiplier}%` : 'Variabel'}
            </h2>
            <span className="text-3xs font-mono text-slate-400">Gemeinde-Steuerfuss</span>
          </div>
          <p className="text-3xs text-slate-500 leading-normal mt-1">
            Simulierte jährliche Gemeindesteuer für Bellas Einkommen von CHF 118.5k:
          </p>
        </div>

        <div className="h-28 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={taxData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fill: '#64748b' }} domain={[0, 12000]} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }}
                labelStyle={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}
                itemStyle={{ fontSize: '10px', color: '#ffffff' }}
                formatter={(val) => [`CHF ${val}`, 'Geschätzte Steuer']}
              />
              <Bar dataKey="taxAmount" radius={[4, 4, 0, 0]}>
                {taxData.map((entry, index) => {
                  const isCurrentRegion = selectedApartment?.zip 
                    ? (selectedApartment.zip === '8700' && entry.name === 'Küsnacht') ||
                      (selectedApartment.zip === '8304' && entry.name === 'Wallisellen') ||
                      (selectedApartment.zip === '8600' && entry.name === 'Dübendorf') ||
                      (selectedApartment.zip.startsWith('80') && entry.name === 'Zürich Stadt')
                    : entry.name === 'Zürich Stadt';

                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={isCurrentRegion ? '#f43f5e' : '#cbd5e1'} 
                      opacity={isCurrentRegion ? 1 : 0.65}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Candidate Dossier Completeness Box */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Zürcher Bewerbungsdossier</span>
            <FileText className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl font-display font-extrabold text-slate-800">
              {contractUploaded && creditUploaded ? '100%' : '50%'}
            </span>
            <span className="inline-flex items-center gap-1 text-3xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Bereit für Bewerbung
            </span>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-2 mt-3">
          <div className="flex items-center justify-between text-2xs p-1.5 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-3.5 h-3.5 ${creditUploaded ? 'text-emerald-500' : 'text-slate-300'}`} />
              <span className="font-medium text-slate-600">Betreibungsauszug</span>
            </div>
            <span className="text-3xs font-mono text-emerald-600 font-semibold uppercase">{creditUploaded ? 'In Ordnung / Geladen' : 'Fehlt'}</span>
          </div>

          <div className="flex items-center justify-between text-2xs p-1.5 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className={`w-3.5 h-3.5 ${contractUploaded ? 'text-emerald-500' : 'text-slate-300'}`} />
              <span className="font-medium text-slate-600">Arbeitsvertrag (Employment Contract)</span>
            </div>
            <span className="text-3xs font-mono text-emerald-600 font-semibold uppercase">{contractUploaded ? 'Beigefügt' : 'Fehlt'}</span>
          </div>
        </div>
      </div>

      {/* 4. Workspace & AI Cost Control Box */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-100 transition-all duration-200">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-2xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Render & API Kostenkontrolle</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-2">
            <h2 className="font-display font-extrabold text-2xl text-slate-800">
              CHF 0.00
            </h2>
            <span className="text-[7.5pt] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-bold whitespace-nowrap">100% KOSTENLOS</span>
          </div>
          <p className="text-3xs text-slate-500 leading-normal mt-1.5">
            Volle Kontrolle über die Hosting- und KI-Gebühren. Dieses Dashboard nutzt ausschließlich kostenlose Kontingente:
          </p>
        </div>

        {/* Cost breakdown checklist */}
        <div className="space-y-1.5 mt-3">
          <div className="flex items-center justify-between text-3xs p-1 px-2 rounded bg-slate-50 border border-slate-100">
            <span className="text-slate-500 font-medium font-sans">Gemini 3.5 Flash AI</span>
            <span className="font-mono text-emerald-600 font-semibold">CHF 0.00 / 1.5K RPD</span>
          </div>
          <div className="flex items-center justify-between text-3xs p-1 px-2 rounded bg-slate-50 border border-slate-100">
            <span className="text-slate-500 font-medium font-sans">Google Workspace API</span>
            <span className="font-mono text-emerald-600 font-semibold">Gratis Kontingent</span>
          </div>
          <div className="flex items-center justify-between text-3xs p-1 px-2 rounded bg-slate-50 border border-slate-100">
            <span className="text-slate-500 font-medium font-sans">Render Web Service</span>
            <span className="font-mono text-emerald-600 font-semibold">750 Std. / Monat Gratis</span>
          </div>
        </div>

        <p className="text-[6.5pt] text-slate-400 mt-2.5 leading-normal italic">
          *Hinweis: Der Render Free-Server geht nach 15 Min. Inaktivität automatisch in den Ruhezustand (wacht beim nächsten Besuch in ca. 50 Sek. auf). Es entstehen keinerlei Kosten.
        </p>
      </div>
    </div>
  );
}
