import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle, faUsers, faTree, faCoins,
  faChevronDown, faChevronUp,
} from '@fortawesome/free-solid-svg-icons';

const STATS = [
  { key: 'civicActions',     label: 'Actions',  icon: faCheckCircle, accent: '#34d399' },
  { key: 'activeCitizens',   label: 'Citizens', icon: faUsers,       accent: '#60a5fa' },
  { key: 'treesPlanted',     label: 'Trees',    icon: faTree,        accent: '#4ade80' },
  { key: 'creditsRedeemed',  label: 'Credits',  icon: faCoins,       accent: '#fbbf24' },
];

// Architectural arc — evokes a bridge / Indo-Saracenic doorway. Pure SVG, no assets.
const BridgeArc = ({ className, opacity = 0.08 }) => (
  <svg viewBox="0 0 600 200" className={className} preserveAspectRatio="none" aria-hidden>
    <defs>
      <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#998fc7" stopOpacity="0" />
        <stop offset="50%" stopColor="#d4c2fc" stopOpacity="1" />
        <stop offset="100%" stopColor="#998fc7" stopOpacity="0" />
      </linearGradient>
    </defs>
    {[0, 1, 2, 3].map((i) => (
      <path
        key={i}
        d={`M 50 200 Q 300 ${40 + i * 20} 550 200`}
        fill="none"
        stroke="url(#arcGrad)"
        strokeWidth="1"
        opacity={opacity * (1 - i * 0.18)}
      />
    ))}
    {/* Cable lines (bridge struts) */}
    {Array.from({ length: 11 }).map((_, i) => {
      const x = 50 + i * 50;
      const t = (i - 5) / 5;
      const archY = 80 + Math.abs(t) * t * 60;
      return (
        <line
          key={i}
          x1={x}
          y1={archY}
          x2={x}
          y2="200"
          stroke="#d4c2fc"
          strokeWidth="0.5"
          opacity={opacity * 1.5}
        />
      );
    })}
  </svg>
);

const HeroBanner = ({ globalImpact }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsExpanded(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const smooth = { duration: 0.55, ease: [0.4, 0, 0.2, 1] };

  return (
    <motion.section
      animate={{ height: isExpanded ? 'auto' : 64 }}
      transition={smooth}
      className="relative rounded-3xl overflow-hidden border"
      style={{
        background:
          'linear-gradient(120deg, #0e1a66 0%, #14248a 45%, #1e2b95 100%)',
        borderColor: 'rgba(212,194,252,0.18)',
        boxShadow: '0 20px 50px -20px rgba(20,36,138,0.55)',
      }}
    >
      {/* Architectural arc background */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="arc"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 pointer-events-none"
          >
            <BridgeArc className="absolute bottom-0 left-0 w-full h-2/3" opacity={0.18} />
            {/* Soft radial glows */}
            <div
              className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px]"
              style={{ background: 'radial-gradient(circle, rgba(212,194,252,0.35), transparent 70%)' }}
            />
            <div
              className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[120px]"
              style={{ background: 'radial-gradient(circle, rgba(153,143,199,0.30), transparent 70%)' }}
            />
            {/* Faint geometric grid */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute right-4 top-4 z-30 w-7 h-7 flex items-center justify-center rounded-full border border-white/15 bg-white/5 hover:bg-white/15 backdrop-blur-sm text-white/70 hover:text-white transition-all"
      >
        <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} fontSize={9} />
      </button>

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="open"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="grid md:grid-cols-12 gap-6 md:gap-8 px-6 md:px-10 py-10 md:py-12 items-center"
            >
              {/* Left: Identity */}
              <div className="md:col-span-7">
                {/* Civic seal */}
                <div className="flex items-center gap-2.5 mb-6">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border"
                    style={{
                      background: 'linear-gradient(135deg, #d4c2fc, #998fc7)',
                      color: '#14248a',
                      borderColor: 'rgba(255,255,255,0.2)',
                    }}
                  >
                    से
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60 leading-none">
                      An initiative for
                    </span>
                    <span className="text-[11px] font-bold tracking-wide text-white/90 mt-0.5">
                      Bharat 🇮🇳 · Est. 2025
                    </span>
                  </div>
                </div>

                {/* Bilingual masthead */}
                <h1 className="font-black tracking-tight leading-[0.95] mb-5">
                  <span className="block text-[44px] md:text-[56px] text-white">
                    Civic<span style={{ color: '#d4c2fc' }}>Setu</span>
                  </span>
                  <span
                    className="block text-2xl md:text-3xl mt-1 font-bold"
                    style={{ color: '#998fc7', fontFamily: 'serif' }}
                  >
                    सेतु — a bridge for change
                  </span>
                </h1>

                <p className="text-sm md:text-base text-white/70 max-w-lg leading-relaxed">
                  Connecting citizens, communities and government through verified
                  environmental action. Every photo is proof. Every credit, real impact.
                </p>

                {/* Live pulse */}
                <div className="flex items-center gap-2 mt-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300/90">
                    Live · community impact
                  </span>
                </div>
              </div>

              {/* Right: Stats cluster */}
              <div className="md:col-span-5">
                <div
                  className="rounded-2xl p-5 backdrop-blur-sm border"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(212,194,252,0.18)',
                  }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    {STATS.map(({ key, label, icon, accent }) => (
                      <div key={key} className="relative">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <FontAwesomeIcon icon={icon} className="text-[10px]" style={{ color: accent }} />
                          <span
                            className="text-[10px] font-bold uppercase tracking-[0.16em]"
                            style={{ color: `${accent}cc` }}
                          >
                            {label}
                          </span>
                        </div>
                        <div className="text-2xl font-black tabular-nums text-white leading-none">
                          {(globalImpact?.[key] ?? 0).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                      Updated just now
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#d4c2fc' }}>
                      v1.0
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="closed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-between px-6 h-16"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs"
                  style={{ background: 'linear-gradient(135deg, #d4c2fc, #998fc7)', color: '#14248a' }}
                >
                  से
                </div>
                <span className="text-base font-black text-white tracking-tight">
                  Civic<span style={{ color: '#d4c2fc' }}>Setu</span>
                </span>
                <div className="w-px h-4 bg-white/20" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                  Bridge for change
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                <div className="hidden md:flex items-center gap-3 text-[11px] font-bold text-white/80">
                  {STATS.map(({ key, label, accent }) => (
                    <span key={key} className="tabular-nums">
                      <span style={{ color: accent }}>{(globalImpact?.[key] ?? 0).toLocaleString()}</span>
                      <span className="text-white/40 ml-1">{label}</span>
                    </span>
                  ))}
                </div>
                <div className="w-7" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

export default HeroBanner;
