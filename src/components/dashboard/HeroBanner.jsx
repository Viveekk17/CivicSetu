import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCheckCircle, faUsers, faTree, faCoins, 
    faChevronDown, faChevronUp 
} from '@fortawesome/free-solid-svg-icons';

const HeroBanner = ({ globalImpact }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExpanded(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Smooth, uniform transition for that "Premium Curtain" feel
  const smoothTransition = {
    duration: 0.6,
    ease: [0.4, 0, 0.2, 1] // Standard Material-style smooth ease
  };

  return (
    <motion.section
      animate={{ 
        height: isExpanded ? 'auto' : 64,
        paddingTop: isExpanded ? 40 : 14,
        paddingBottom: isExpanded ? 40 : 14
      }}
      transition={smoothTransition}
      className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 mb-8"
      style={{ 
        background: '#14248a',
      }}
    >
      {/* Decorative background elements */}
      <motion.div 
        animate={{ opacity: isExpanded ? 0.1 : 0 }}
        transition={{ duration: 0.6 }}
        className="absolute top-0 left-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none" 
        style={{ background: '#14248a', transform: 'translate(-50%,-50%)' }} 
      />
      <motion.div 
        animate={{ opacity: isExpanded ? 0.1 : 0 }}
        transition={{ duration: 0.6 }}
        className="absolute bottom-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none" 
        style={{ background: '#998fc7', transform: 'translate(50%,50%)' }} 
      />

      {/* Toggle Arrow */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-slate-900/80 hover:bg-slate-800 transition-colors border border-white/5 text-white/70 hover:text-white cursor-pointer"
      >
        <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} fontSize={9} />
      </button>

      <div className="relative z-10 w-full flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div 
              key="expanded"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center w-full px-6 text-center"
            >
              {/* Built for Bharat Badge */}
              <div className="flex items-center gap-3 px-4 py-1.5 rounded-full mb-6 border border-white/10 bg-white/10">
                <div className="flex gap-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF9933' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FFFFFF' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#138808' }} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-100">
                  Built for Bharat
                </span>
              </div>

              {/* Branded Title */}
              <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight text-white tracking-tight">
                <span style={{ color: '#998fc7' }}>CIVIC</span>
                <span style={{ color: '#d4c2fc' }}>सेतु</span>
              </h1>

              {/* Mission Statement */}
              <p className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-8 text-slate-300 font-medium opacity-90">
                India's first AI-powered <span className="text-emerald-400">civic participation </span> 
                platform that rewards citizens for real environmental actions.
              </p>

              {/* 4 Core Platform Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl px-4 py-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-1">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-400 text-[10px]" />
                    <span className="text-xl font-bold text-white">{globalImpact?.civicActions?.toLocaleString() || 0}</span>
                  </div>
                  <p className="text-[11px] font-bold text-emerald-400/60 uppercase tracking-widest">Actions</p>
                </div>

                <div className="flex flex-col items-center border-l border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <FontAwesomeIcon icon={faUsers} className="text-blue-400 text-[10px]" />
                    <span className="text-xl font-bold text-white">{globalImpact?.activeCitizens?.toLocaleString() || 0}</span>
                  </div>
                  <p className="text-[11px] font-bold text-blue-400/60 uppercase tracking-widest">Citizens</p>
                </div>

                <div className="flex flex-col items-center border-l border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <FontAwesomeIcon icon={faTree} className="text-emerald-300 text-[10px]" />
                    <span className="text-xl font-bold text-white">{globalImpact?.treesPlanted?.toLocaleString() || 0}</span>
                  </div>
                  <p className="text-[11px] font-bold text-emerald-300/60 uppercase tracking-widest">Trees</p>
                </div>

                <div className="flex flex-col items-center border-l border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <FontAwesomeIcon icon={faCoins} className="text-amber-400 text-[10px]" />
                    <span className="text-xl font-bold text-white text-amber-500">{globalImpact?.creditsRedeemed?.toLocaleString() || 0}</span>
                  </div>
                  <p className="text-[11px] font-bold text-amber-400/60 uppercase tracking-widest">Credits</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-center gap-4 w-full px-6"
            >
              <div className="flex gap-1 mr-1">
                <span className="w-2 h-2 rounded-full" style={{ background: '#FF9933' }} />
                <span className="w-2 h-2 rounded-full" style={{ background: '#FFFFFF' }} />
                <span className="w-2 h-2 rounded-full" style={{ background: '#138808' }} />
              </div>
              <h1 className="text-xl font-black text-white tracking-widest">
                <span style={{ color: '#998fc7' }}>CIVIC</span>
                <span style={{ color: '#d4c2fc' }}>सेतु</span>
              </h1>
              <div className="w-px h-4 bg-white/20 mx-2" />
              <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
                Built for Bharat
              </span>
              <div className="w-8 ml-4 pointer-events-none" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

export default HeroBanner;
