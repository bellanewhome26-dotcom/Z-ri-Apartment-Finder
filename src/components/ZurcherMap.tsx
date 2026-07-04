import React from 'react';
import { Apartment } from '../types';
import { MapPin, HelpCircle, ExternalLink } from 'lucide-react';

interface ZurcherMapProps {
  apartments: Apartment[];
  selectedId?: string;
  onSelect: (apt: Apartment) => void;
}

export default function ZurcherMap({ apartments, selectedId, onSelect }: ZurcherMapProps) {
  const selectedApt = selectedId ? apartments.find(apt => apt.id === selectedId) : null;

  // Schematic map coordinates calculation
  // Zürich center is around lat=47.37, lng=8.54
  // We can scale lat/lng to 1000x680 SVG box (doubled from 500x340)
  const scaleX = (lng: number) => {
    const minLng = 8.46;
    const maxLng = 8.62;
    const width = 1000;
    return ((lng - minLng) / (maxLng - minLng)) * width;
  };

  const scaleY = (lat: number) => {
    const minLat = 47.31;
    const maxLat = 47.43;
    const height = 680;
    // higher latitude is higher on the screen, so we subtract from height
    return height - ((lat - minLat) / (maxLat - minLat)) * height;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col h-[720px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-slate-900 text-sm">Miet-Topologie Grossraum Zürich</h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">Schematische Strassen, ÖV-Anbindungen & passende Lagen</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-2xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
            Goldküste: Tiefer Steuerfuss
          </span>
          <span className="inline-flex items-center gap-1.5 text-2xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
            Hauptverkehrsachsen & S-Bahn
          </span>
        </div>
      </div>

      <div className="relative flex-1 bg-slate-50/70 rounded-xl overflow-hidden border border-slate-100">
        {/* Floating selected apartment details card with link */}
        {selectedApt && (
          <div className="absolute top-3.5 right-3.5 z-10 max-w-[220px] bg-white/95 backdrop-blur-md border border-slate-200 p-3.5 rounded-xl shadow-md transition-all duration-200 text-3xs flex flex-col gap-1.5 animate-in fade-in-50 slide-in-from-top-1">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
              <span className="text-[8px] font-bold uppercase tracking-wider text-indigo-600 font-mono">Ausgewählt</span>
              <span className="text-[9px] font-extrabold text-slate-700 bg-slate-100 px-1 py-0.5 rounded-sm border border-slate-200">{selectedApt.score}% Match</span>
            </div>
            <h4 className="font-semibold text-slate-800 leading-tight truncate" title={selectedApt.title}>
              {selectedApt.title}
            </h4>
            <div className="text-slate-500 font-mono flex flex-col gap-0.5">
              <p className="font-bold text-slate-900">CHF {selectedApt.price.toLocaleString()}</p>
              <p className="text-[8px]">{selectedApt.rooms} Zimmer | {selectedApt.area} m²</p>
            </div>
            <a
              href={selectedApt.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 mt-1.5 text-[9px] font-semibold text-white bg-slate-900 hover:bg-indigo-600 active:bg-indigo-700 py-1.5 px-3 rounded-lg transition-colors cursor-pointer text-center"
            >
              <span>Inserat öffnen</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        )}

        {/* Schematic SVG Map with Double Resolution */}
        <svg className="w-full h-full" viewBox="0 0 1000 680" xmlns="http://www.w3.org/2000/svg">
          {/* Subtle Vector Background Grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="0.5" className="opacity-40" />
            </pattern>
          </defs>
          <rect width="1000" height="680" fill="url(#grid)" />

          {/* Lake Zürich (Zürichsee) - Scaled and Curved */}
          <path
            d="M 460 380 Q 470 440 500 500 T 580 620 T 700 680 L 740 680 T 620 600 T 540 480 T 490 380 Z"
            fill="#e2f1ff"
            stroke="#bbf3ff"
            strokeWidth="3"
            className="opacity-90"
          />
          {/* Lake Label */}
          <text x="580" y="540" fill="#94a3b8" fontSize="13" fontWeight="500" letterSpacing="0.12em" className="italic font-sans pointer-events-none select-none" transform="rotate(32, 580, 540)">
            Zürichsee
          </text>

          {/* MAJOR ROADS / HIGHWAYS LAYER */}
          <g id="major-roads" className="opacity-90">
            {/* A1 Nordumfahrung (Transit West-East) Background */}
            <path
              d="M 80 320 Q 200 240, 320 200 T 620 160 T 800 160 T 940 180"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* A1 Foreground Core */}
            <path
              d="M 80 320 Q 200 240, 320 200 T 620 160 T 800 160 T 940 180"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="6 4"
            />

            {/* A3 Transit (West-Süd Bypass) Background */}
            <path
              d="M 120 480 Q 220 460, 340 480 T 420 540 T 560 660"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* A3 Foreground Core */}
            <path
              d="M 120 480 Q 220 460, 340 480 T 420 540 T 560 660"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="6 4"
            />

            {/* Hardbrücke / Westtangente Connector Background */}
            <path
              d="M 280 470 L 300 360 L 320 240 L 320 200"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            {/* Hardbrücke Core */}
            <path
              d="M 280 470 L 300 360 L 320 240 L 320 200"
              fill="none"
              stroke="#f8fafc"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Seestrasse (Linkes Seeufer) Background */}
            <path
              d="M 460 380 Q 480 440 500 500 T 580 620 T 700 680"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M 460 380 Q 480 440 500 500 T 580 620 T 700 680"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1"
              strokeLinecap="round"
            />

            {/* Bellerivestrasse / Seestrasse (Rechtes Seeufer - Goldküste) Background */}
            <path
              d="M 490 380 Q 515 440 540 480 T 620 600 T 740 680"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M 490 380 Q 515 440 540 480 T 620 600 T 740 680"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </g>

          {/* S-Bahn Main Trunk Line (Train tracks overlay) */}
          <path
            d="M 100 360 L 300 360 L 440 280 L 620 280"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="6"
            strokeDasharray="8 6"
            className="opacity-60"
          />
          {/* Main Station Circle */}
          <circle cx="300" cy="360" r="13" fill="#cbd5e1" stroke="#475569" strokeWidth="3.5" className="opacity-95" />
          <text x="285" y="336" fill="#1e293b" fontSize="12" fontWeight="700" className="font-sans pointer-events-none">
            Zürich HB
          </text>

          {/* Municipal Boundaries reference curves */}
          <circle cx="300" cy="360" r="180" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="8 8" className="opacity-15" />
          <text x="420" y="230" fill="#94a3b8" fontSize="11" fontWeight="500" className="opacity-60 pointer-events-none select-none">
            10 Min. Pendelbereich (S-Bahn)
          </text>

          {/* Highway badges / labels */}
          {/* A1 Badge */}
          <rect x="520" y="145" width="22" height="14" rx="3" fill="#ef4444" />
          <text x="531" y="155" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" className="font-sans pointer-events-none">A1</text>
          
          {/* A3 Badge */}
          <rect x="150" y="453" width="22" height="14" rx="3" fill="#ef4444" />
          <text x="161" y="463" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" className="font-sans pointer-events-none">A3</text>

          {/* Road name labels */}
          <text x="250" y="380" fill="#64748b" fontSize="9" fontWeight="500" transform="rotate(-78, 250, 380)" className="opacity-80 pointer-events-none select-none font-mono">
            Hardbrücke
          </text>
          <text x="440" y="480" fill="#94a3b8" fontSize="8" fontWeight="500" transform="rotate(70, 440, 480)" className="opacity-60 pointer-events-none select-none font-mono">
            Seestrasse
          </text>

          {/* Region Label Markers */}
          <text x="140" y="420" fill="#64748b" fontSize="11" fontWeight="600" className="opacity-70 pointer-events-none select-none">Altstetten</text>
          <text x="420" y="140" fill="#64748b" fontSize="11" fontWeight="600" className="opacity-70 pointer-events-none select-none">Wallisellen</text>
          <text x="550" y="230" fill="#64748b" fontSize="11" fontWeight="600" className="opacity-70 pointer-events-none select-none">Dübendorf</text>
          <text x="310" y="160" fill="#64748b" fontSize="11" fontWeight="600" className="opacity-70 pointer-events-none select-none">Oerlikon</text>
          <text x="200" y="470" fill="#64748b" fontSize="11" fontWeight="600" className="opacity-70 pointer-events-none select-none">Wiedikon</text>
          <text x="560" y="480" fill="#d97706" fontSize="11" fontWeight="700" className="opacity-90 pointer-events-none select-none">Küsnacht ☼</text>

          {/* Interactive Apartment Markers */}
          {apartments.map((apt) => {
            const x = scaleX(apt.lng);
            const y = scaleY(apt.lat);
            const isSelected = apt.id === selectedId;

            // Rating color
            const scoreColor = apt.score >= 90 ? '#10b981' : apt.score >= 80 ? '#6366f1' : '#f59e0b';

            // Custom tooltip positioning
            const tooltipX = x > 640 ? x - 260 : x + 20;
            const tooltipY = y - 45;

            return (
              <g
                key={apt.id}
                className="cursor-pointer group select-none transition-transform duration-200"
                onClick={() => onSelect(apt)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  window.open(apt.url, '_blank');
                }}
                title={`${apt.title} (Doppelklick für Website)`}
              >
                {/* Visual pulse for search match */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r="24"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="2"
                    className="animate-ping opacity-60"
                  />
                )}

                {/* Marker Pin Outer */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? "16" : "11"}
                  fill={isSelected ? '#0f172a' : '#ffffff'}
                  stroke={scoreColor}
                  strokeWidth={isSelected ? '4.5' : '2.5'}
                  className="shadow-sm transition-all duration-150"
                />

                {/* score number inside index pin */}
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fill={isSelected ? '#ffffff' : '#1e293b'}
                  fontSize={isSelected ? '11' : '9'}
                  fontWeight="bold"
                  className="font-sans"
                >
                  {Math.round(apt.score)}
                </text>

                {/* Rich tooltip preview on hovering */}
                <g className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150">
                  <rect
                    x={tooltipX}
                    y={tooltipY}
                    width="240"
                    height="68"
                    rx="8"
                    fill="#0f172a"
                    className="shadow-xl"
                  />
                  <text x={tooltipX + 16} y={tooltipY + 22} fill="#ffffff" fontSize="11" fontWeight="bold" className="font-sans">
                    {apt.title.length > 28 ? apt.title.substring(0, 26) + "..." : apt.title}
                  </text>
                  <text x={tooltipX + 16} y={tooltipY + 41} fill="#cbd5e1" fontSize="10" className="font-mono">
                    CHF {apt.price.toLocaleString()} | {apt.rooms} Zi. | {apt.area} m²
                  </text>
                  <text x={tooltipX + 16} y={tooltipY + 54} fill="#94a3b8" fontSize="8" className="font-sans italic">
                    Steuerfuss: {apt.taxMultiplier}% | Match: {apt.score}%
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Region Compass Legend */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs border border-slate-200/60 px-3 py-1.5 rounded-lg flex items-center gap-3 text-3xs text-slate-500 font-mono select-none">
          <div className="flex items-center gap-1 font-sans">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></span>
            <span>Uebereinstimmung &gt;90%</span>
          </div>
          <div className="flex items-center gap-1 font-sans">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border border-white"></span>
            <span>Uebereinstimmung 80-89%</span>
          </div>
          <div className="flex items-center gap-1 font-sans">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white"></span>
            <span>Uebereinstimmung &lt;80%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
