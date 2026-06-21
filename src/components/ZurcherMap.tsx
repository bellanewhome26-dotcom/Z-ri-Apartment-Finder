import React from 'react';
import { Apartment } from '../types';
import { MapPin, HelpCircle } from 'lucide-react';

interface ZurcherMapProps {
  apartments: Apartment[];
  selectedId?: string;
  onSelect: (apt: Apartment) => void;
}

export default function ZurcherMap({ apartments, selectedId, onSelect }: ZurcherMapProps) {
  // Schematic map coordinates calculation
  // Zürich center is around lat=47.37, lng=8.54
  // We can scale lat/lng to 500x380 SVG box
  const scaleX = (lng: number) => {
    const minLng = 8.46;
    const maxLng = 8.62;
    const width = 500;
    return ((lng - minLng) / (maxLng - minLng)) * width;
  };

  const scaleY = (lat: number) => {
    const minLat = 47.31;
    const maxLat = 47.43;
    const height = 340;
    // higher latitude is higher on the screen, so we subtract from height
    return height - ((lat - minLat) / (maxLat - minLat)) * height;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col h-[380px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-medium text-slate-900 text-sm">Miet-Topologie Grossraum Zürich</h3>
          <p className="text-xs text-slate-500 font-sans mt-0.5">Schematische ÖV-Anbindungen & passende Lagen</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-2xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
            Goldküste: Tiefer Steuerfuss
          </span>
          <span className="inline-flex items-center gap-1.5 text-2xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
            S-Bahn-Netz
          </span>
        </div>
      </div>

      <div className="relative flex-1 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
        {/* Schematic SVG Map */}
        <svg className="w-full h-full" viewBox="0 0 500 340" xmlns="http://www.w3.org/2000/svg">
          {/* Lake Zürich (Zürichsee) */}
          <path
            d="M 230 190 Q 235 220 250 250 T 290 310 T 350 340 L 370 340 T 310 300 T 270 240 T 245 190 Z"
            fill="#e2f1ff"
            stroke="#bbf3ff"
            strokeWidth="1.5"
            className="opacity-90"
          />
          {/* Lake Label */}
          <text x="290" y="270" fill="#94a3b8" fontSize="9" fontWeight="500" letterSpacing="0.1em" className="italic font-sans transform rotate-45 pointer-events-none select-none">
            Zürichsee
          </text>

          {/* S-Bahn Main Trunk Line */}
          <path
            d="M 50 180 L 150 180 L 220 140 L 310 140"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="3.5"
            strokeDasharray="4 3"
            className="opacity-70"
          />
          {/* Main Station Circle */}
          <circle cx="150" cy="180" r="7" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" className="opacity-80" />
          <text x="142" y="168" fill="#475569" fontSize="9" fontWeight="600" className="font-sans pointer-events-none">
            Zürich HB
          </text>

          {/* Municipal Boundaries reference curves */}
          <circle cx="150" cy="180" r="90" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="6 6" className="opacity-15" />
          <text x="210" y="115" fill="#94a3b8" fontSize="8" className="opacity-60 pointer-events-none select-none">
            10 Min. Pendelbereich
          </text>

          {/* Region Label Markers */}
          <text x="70" y="210" fill="#94a3b8" fontSize="9" fontWeight="500" className="opacity-80 pointer-events-none select-none">Altstetten</text>
          <text x="210" y="70" fill="#94a3b8" fontSize="9" fontWeight="500" className="opacity-80 pointer-events-none select-none">Wallisellen</text>
          <text x="275" y="115" fill="#94a3b8" fontSize="9" fontWeight="500" className="opacity-80 pointer-events-none select-none">Dübendorf</text>
          <text x="155" y="80" fill="#94a3b8" fontSize="9" fontWeight="500" className="opacity-80 pointer-events-none select-none">Oerlikon</text>
          <text x="100" y="235" fill="#94a3b8" fontSize="9" fontWeight="500" className="opacity-80 pointer-events-none select-none">Wiedikon</text>
          <text x="280" y="240" fill="#d97706" fontSize="9" fontWeight="600" className="opacity-90 pointer-events-none select-none">Küsnacht ☼</text>

          {/* Interactive Apartment Markers */}
          {apartments.map((apt) => {
            const x = scaleX(apt.lng);
            const y = scaleY(apt.lat);
            const isSelected = apt.id === selectedId;

            // Rating color
            const scoreColor = apt.score >= 90 ? '#10b981' : apt.score >= 80 ? '#6366f1' : '#f59e0b';
            const statusTextColor = apt.status === 'Applied' ? '#10b981' : apt.status === 'Viewing Scheduled' ? '#dc2626' : '#475569';

            return (
              <g
                key={apt.id}
                className="cursor-pointer group select-none transition-transform duration-200"
                onClick={() => onSelect(apt)}
              >
                {/* Visual pulse for search match */}
                {isSelected && (
                  <circle
                    cx={x}
                    cy={y}
                    r="16"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="1.5"
                    className="animate-ping opacity-60"
                  />
                )}

                {/* Marker Pin Outer */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? "11" : "8"}
                  fill={isSelected ? '#0f172a' : '#ffffff'}
                  stroke={scoreColor}
                  strokeWidth={isSelected ? '3.5' : '2'}
                  className="shadow-sm transition-all duration-150"
                />

                {/* score number inside index pin */}
                <text
                  x={x}
                  y={y + 3}
                  textAnchor="middle"
                  fill={isSelected ? '#ffffff' : '#1e293b'}
                  fontSize={isSelected ? '8' : '7'}
                  fontWeight="bold"
                  className="font-sans"
                >
                  {Math.round(apt.score)}
                </text>

                {/* Rich tooltip preview on hovering */}
                <g className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150">
                  <rect
                    x={x + 12 + (x > 320 ? -190 : 0)}
                    y={y - 35}
                    width="170"
                    height="54"
                    rx="6"
                    fill="#1e293b"
                    className="shadow-lg"
                  />
                  <polygon
                    points={`${x + 12 + (x > 320 ? -2 : 0)},${y - 10} ${x + 5 + (x > 320 ? 5 : 0)},${y - 5} ${x + 12 + (x > 320 ? -2 : 0)},${y}`}
                    fill="#1e293b"
                  />
                  <text x={x + 20 + (x > 320 ? -190 : 0)} y={y - 20} fill="#ffffff" fontSize="9pt" fontWeight="bold" className="font-sans">
                    {apt.title.substring(0, 20)}...
                  </text>
                  <text x={x + 20 + (x > 320 ? -190 : 0)} y={y - 6} fill="#94a3b8" fontSize="8pt" className="font-mono">
                    CHF {apt.price} | {apt.rooms} Zi. | {apt.taxMultiplier}% Steuerf.
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
