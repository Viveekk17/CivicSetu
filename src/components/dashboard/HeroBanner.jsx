import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle, faUsers, faTree, faCoins,
  faChevronDown, faChevronUp,
} from '@fortawesome/free-solid-svg-icons';

// Animated count-up — tweens from 0 to `value` and re-runs whenever the
// target changes. Uses framer-motion's animate() so it pipes through the same
// requestAnimationFrame scheduler as the rest of the page. `startDelay` holds
// at zero for that many seconds before counting up — used so the hero stats
// only count after the intro narrative finishes playing.
export const CountUp = ({ value = 0, duration = 1.8, startDelay = 0, className, style }) => {
  const motionVal = useMotionValue(0);
  const display = useTransform(motionVal, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration,
      delay: startDelay,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [value, duration, startDelay, motionVal]);

  return <motion.span className={className} style={style}>{display}</motion.span>;
};

const STATS = [
  { key: 'civicActions',     label: 'Actions',  icon: faCheckCircle, accent: '#34d399' },
  { key: 'activeCitizens',   label: 'Citizens', icon: faUsers,       accent: '#60a5fa' },
  { key: 'treesPlanted',     label: 'Trees',    icon: faTree,        accent: '#4ade80' },
  { key: 'creditsRedeemed',  label: 'Credits',  icon: faCoins,       accent: '#fbbf24' },
];

// Setu landscape — a 6-second cinematic that reads as a single "before →
// after" environmental story, structured per the dashboard hero spec:
//   0.0s–1.2s  polluted scene: scattered bottles, wrappers and a bag with
//              dull/hazy tint and grey smoke puffs drifting slowly.
//   1.2s–2.8s  a green/white eco glove sweeps in from the left and picks
//              the litter one item at a time, with a small dust burst at
//              each grab.
//   2.8s–3.8s  the glove arcs the armful up and across to a recycling bin,
//              releasing it inside with a small bounce.
//   3.8s–5.0s  wind sweeps left→right, smoke and fog dissipate, the dull
//              tint lifts and a fresh sky tint settles in.
//   5.0s–6.0s  trees + grass tufts spring from the healed ground, a soft
//              golden glow blooms, and the foliage idle-sways forever so
//              the final clean state can loop indefinitely.
// The banner stays open ~11.5s, so this 6s sequence finishes well before
// the stats fade in (at 6.0s) and count up.
export const SetuLandscape = ({ className, opacity = 0.18 }) => {
  const arcPaths = [0, 1, 2, 3].map((i) => `M 50 200 Q 550 ${40 + i * 20} 1050 200`);
  const struts = Array.from({ length: 11 }).map((_, i) => {
    const x = 50 + i * 100;
    const t = (i - 5) / 5;
    const archY = 80 + Math.abs(t) * t * 60;
    return { x, archY };
  });

  // Total narrative duration in seconds. Extended to 11s on the landing page
  // so the cleanup beat has room for a longer glove sweep across more litter.
  const TOTAL = 11;
  // Scale factor for any absolute delays (trees/tufts/air motes) that were
  // originally tuned against the 6s spec.
  const SCALE = TOTAL / 6;

  // Mixed litter — plastic bottles, food wrappers and tied bags scattered
  // across the polluted left zone. Each fades exactly when the glove sweeps
  // over its x-position. fadeAt is normalized against TOTAL.
  // Pick window now spans t ∈ [0.16, 0.50] to accommodate 8 items.
  const garbage = [
    { type: 'bottle',  x: 55,  y: 184, fadeAt: 0.18 },
    { type: 'bag',     x: 105, y: 175, fadeAt: 0.22 },
    { type: 'wrapper', x: 155, y: 188, fadeAt: 0.26 },
    { type: 'bottle',  x: 205, y: 184, fadeAt: 0.30 },
    { type: 'bag',     x: 265, y: 175, fadeAt: 0.34 },
    { type: 'wrapper', x: 325, y: 188, fadeAt: 0.38 },
    { type: 'bag',     x: 390, y: 175, fadeAt: 0.42 },
    { type: 'bag',     x: 455, y: 175, fadeAt: 0.46 },
  ];

  // Grey smoke puffs drifting slowly over the polluted zone — they begin
  // to rise + dissipate when the wind starts (3.8s ⇒ t=0.633). Spread
  // across the banner so the L→R wind sweep reads visually.
  const smokePuffs = [
    { x: 60,  y: 156, r: 14 }, { x: 180, y: 140, r: 18 },
    { x: 320, y: 148, r: 16 }, { x: 480, y: 132, r: 20 },
    { x: 640, y: 146, r: 18 }, { x: 820, y: 138, r: 16 },
    { x: 980, y: 150, r: 15 },
  ];

  // White AQI fog — thick haze at altitude that thins during the wind sweep.
  // Densified to read clearly as smog: more puffs, larger radii, stacked at
  // two altitudes so the polluted zone feels saturated.
  const fogPuffs = [
    { x: 80,   y: 118, rx: 110, ry: 36 },
    { x: 220,  y: 96,  rx: 130, ry: 40 },
    { x: 380,  y: 112, rx: 120, ry: 34 },
    { x: 520,  y: 92,  rx: 140, ry: 42 },
    { x: 680,  y: 110, rx: 130, ry: 36 },
    { x: 820,  y: 94,  rx: 130, ry: 40 },
    { x: 980,  y: 108, rx: 120, ry: 34 },
    { x: 1080, y: 90,  rx: 110, ry: 38 },
    { x: 300,  y: 70,  rx: 95,  ry: 26 },
    { x: 760,  y: 68,  rx: 100, ry: 26 },
  ];

  // Small airborne pollution particles — fine PM2.5-style motes drifting in
  // the polluted zone. Each has a randomized drift, opacity flicker and is
  // carried away by the wind sweep at t=0.633.
  const dustMotes = Array.from({ length: 36 }).map((_, i) => {
    const x = 30 + (i * 31) % 1060;
    const y = 50 + ((i * 47) % 110);
    const r = 0.6 + ((i * 13) % 9) / 10;
    const drift = ((i % 5) - 2) * 6;
    const driftY = -4 - (i % 4) * 2;
    return { x, y, r, drift, driftY, key: i };
  });

  // Trees that spring up at 5.0s across the cleansed ground.
  const trees = [
    { x: 140, delay: 0.00 },
    { x: 380, delay: 0.10 },
    { x: 640, delay: 0.18 },
    { x: 920, delay: 0.06 },
  ];

  // Small grass tufts that pop in alongside the trees, spread across the banner
  const tufts = [
    { x: 60 }, { x: 220 }, { x: 360 }, { x: 500 },
    { x: 700 }, { x: 880 }, { x: 1040 },
  ];

  // Fresh-air motes rising from the healed ground (5.0s onward)
  const airParticles = [
    { x: 80,  delay: 0    }, { x: 220, delay: 0.15 },
    { x: 380, delay: 0.06 }, { x: 540, delay: 0.22 },
    { x: 700, delay: 0.10 }, { x: 880, delay: 0.18 },
    { x: 1020, delay: 0.04 },
  ];

  // ---- Sub-components (drawn relative to their group origin) ----

  // Eco-friendly cartoon cleaning glove — pale-green rubber body with a
  // bright-green ribbed cuff. Origin (0,0) sits at the top center of the
  // cuff; palm + four fingers extend downward, thumb branches outward.
  // `flip` mirrors horizontally for the pair.
  const Hand = ({ flip = false }) => (
    <g transform={flip ? 'scale(-1, 1)' : undefined}>
      {/* Bright-green ribbed cuff with two stitch lines */}
      <rect x="-12" y="-5" width="24" height="10" fill="#22c55e" stroke="#14532d" strokeWidth="0.5" rx="2.5" />
      <line x1="-12" y1="-1" x2="12" y2="-1" stroke="#14532d" strokeOpacity="0.45" strokeWidth="0.4" />
      <line x1="-12" y1="2"  x2="12" y2="2"  stroke="#14532d" strokeOpacity="0.4"  strokeWidth="0.4" />
      {/* Palm body — pale eco-green */}
      <path
        d="M -11 5 L -11 18 Q -11 22, -7 22 L 7 22 Q 11 22, 11 18 L 11 5 Z"
        fill="#dcfce7" stroke="#14532d" strokeWidth="0.5"
      />
      {/* Thumb — angled out from the outer side */}
      <ellipse
        cx="-11" cy="13" rx="3.5" ry="5.5" fill="#dcfce7"
        stroke="#14532d" strokeWidth="0.5"
        transform="rotate(-25 -11 13)"
      />
      {/* Four fingers extending down from the palm */}
      <ellipse cx="-7"   cy="25" rx="2.4" ry="5"   fill="#dcfce7" stroke="#14532d" strokeWidth="0.45" />
      <ellipse cx="-2.3" cy="27" rx="2.4" ry="6.2" fill="#dcfce7" stroke="#14532d" strokeWidth="0.45" />
      <ellipse cx="2.3"  cy="27" rx="2.4" ry="6.2" fill="#dcfce7" stroke="#14532d" strokeWidth="0.45" />
      <ellipse cx="7"    cy="25" rx="2.4" ry="5"   fill="#dcfce7" stroke="#14532d" strokeWidth="0.45" />
      {/* Soft highlight on the palm — gives the rubber gloss */}
      <ellipse cx="-3" cy="13" rx="2.4" ry="7" fill="#ffffff" opacity="0.55" />
    </g>
  );

  // Tied black garbage bag silhouette. Origin (0,0) is the tie point at top.
  const GarbageBag = () => (
    <g>
      <path
        d="M -10 0 Q -13 8, -12 16 Q -11 24, -7 26 L 7 26 Q 11 24, 12 16 Q 13 8, 10 0 Z"
        fill="#1f2937" stroke="#0b1220" strokeWidth="0.5"
      />
      <path d="M -3 0 L -7 -6 Q -5 -7, -3 -3 Z" fill="#1f2937" stroke="#0b1220" strokeWidth="0.4" />
      <path d="M  3 0 L  7 -6 Q  5 -7,  3 -3 Z" fill="#1f2937" stroke="#0b1220" strokeWidth="0.4" />
      <ellipse cx="0" cy="0" rx="4" ry="1.2" fill="#0b1220" />
      <ellipse cx="-5" cy="13" rx="1.8" ry="6" fill="#374151" opacity="0.55" />
      <ellipse cx="6"  cy="14" rx="1.4" ry="5" fill="#0b1220" opacity="0.4" />
    </g>
  );

  // Discarded plastic bottle lying on its side. Origin (0,0) is the bottle's
  // body center; cap on the right.
  const Bottle = () => (
    <g>
      {/* Body — translucent pale blue */}
      <rect x="-9" y="-3.5" width="14" height="7" rx="2" fill="#bae6fd" stroke="#075985" strokeWidth="0.5" />
      {/* Three ridge lines for plastic detail */}
      <line x1="-6" y1="-3" x2="-6" y2="3" stroke="#075985" strokeOpacity="0.35" strokeWidth="0.3" />
      <line x1="-3" y1="-3" x2="-3" y2="3" stroke="#075985" strokeOpacity="0.35" strokeWidth="0.3" />
      <line x1="0"  y1="-3" x2="0"  y2="3" stroke="#075985" strokeOpacity="0.35" strokeWidth="0.3" />
      {/* Neck */}
      <rect x="5" y="-2" width="2" height="4" fill="#bae6fd" stroke="#075985" strokeWidth="0.4" />
      {/* Cap */}
      <rect x="7" y="-2.5" width="2.4" height="5" rx="0.4" fill="#0e7490" stroke="#0c4a6e" strokeWidth="0.4" />
      {/* Highlight */}
      <ellipse cx="-3" cy="-1.5" rx="4" ry="0.8" fill="#ffffff" opacity="0.6" />
    </g>
  );

  // Reward coin — gold credit token with a bright highlight and a ₹ glyph.
  // Origin (0,0) is the coin center.
  const Coin = () => (
    <g>
      <circle cx="0" cy="0" r="6.5" fill="#fbbf24" stroke="#92400e" strokeWidth="0.7" />
      <circle cx="0" cy="0" r="4.4" fill="none" stroke="#b45309" strokeWidth="0.4" opacity="0.6" />
      <circle cx="-2"  cy="-2" r="1.8" fill="#fde68a" opacity="0.85" />
      <text x="0" y="2.5" textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#78350f" style={{ fontFamily: 'system-ui, sans-serif' }}>₹</text>
    </g>
  );

  // Crumpled food wrapper — irregular polygon with a stripe of accent color.
  // Origin (0,0) is the wrapper center.
  const Wrapper = () => (
    <g>
      <path
        d="M -8 -2 L -5 -4 L 0 -3 L 5 -4 L 8 -1 L 7 3 L 3 4 L -2 3 L -6 4 L -8 1 Z"
        fill="#ef4444" stroke="#7f1d1d" strokeWidth="0.5"
      />
      {/* Yellow accent stripe */}
      <path
        d="M -7 0 L -3 -1 L 2 0 L 6 -1"
        stroke="#fde047" strokeWidth="1.2" fill="none" strokeLinecap="round"
      />
      <ellipse cx="-3" cy="-2" rx="2" ry="0.5" fill="#ffffff" opacity="0.5" />
    </g>
  );

  return (
    <svg viewBox="0 0 1100 200" className={className} preserveAspectRatio="xMidYMax meet" overflow="visible" style={{ overflow: 'visible' }} aria-hidden>
      <defs>
        <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#998fc7" stopOpacity="0" />
          <stop offset="50%" stopColor="#d4c2fc" stopOpacity="1" />
          <stop offset="100%" stopColor="#998fc7" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="lightGrad">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#d4c2fc" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#998fc7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="dirtGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a07b54" stopOpacity="0" />
          <stop offset="100%" stopColor="#a07b54" stopOpacity="0.45" />
        </linearGradient>
        <radialGradient id="smokeGrad">
          <stop offset="0%" stopColor="#9ca3af" stopOpacity="0.75" />
          <stop offset="65%" stopColor="#6b7280" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#4b5563" stopOpacity="0" />
        </radialGradient>
        {/* Thick white AQI haze — soft, gauzy, hangs over the polluted area */}
        <radialGradient id="fogGrad">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {/* Warm sun glow that blooms in upper-left during the final beat.
            Saturated amber so it reads even on light page backgrounds. */}
        <radialGradient id="sunGlow">
          <stop offset="0%"   stopColor="#fffbeb" stopOpacity="1" />
          <stop offset="25%"  stopColor="#fcd34d" stopOpacity="0.95" />
          <stop offset="55%"  stopColor="#f59e0b" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        {/* Fresh sky wash — transparent at top so it blends into the
            banner's navy gradient, peaks in the middle, fades to 0 at the
            bottom so the ground reads cleanly */}
        <linearGradient id="freshSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#bae6fd" stopOpacity="0" />
          <stop offset="45%"  stopColor="#bae6fd" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#bae6fd" stopOpacity="0" />
        </linearGradient>
        {/* Polluted tint — same trick as freshSky so the top edge of the
            SVG never produces a hard horizontal seam against the navy
            banner above. Fades to transparent at top, full opacity from
            mid-SVG downward. */}
        <linearGradient id="pollutedTint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#6b7280" stopOpacity="0" />
          <stop offset="40%"  stopColor="#6b7280" stopOpacity="1" />
          <stop offset="100%" stopColor="#6b7280" stopOpacity="1" />
        </linearGradient>
        <path id="bridgeTopArc" d={arcPaths[0]} />
      </defs>

      {/* Faint horizon baseline */}
      <line x1="0" y1="198" x2="1100" y2="198" stroke="#d4c2fc" strokeWidth="0.3" opacity="0.2" />

      {/* PERSISTENT BRIDGE — drawn once during the intro and stays for the
          rest of the banner's life. Rendered before the narrative so the
          cleanup story plays in front of it. */}
      {arcPaths.map((d, i) => (
        <motion.path
          key={`arc${i}`}
          d={d}
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth="1"
          style={{ opacity: opacity * (1 - i * 0.18) }}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.4, delay: 0.2 + i * 0.22, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
      {struts.map(({ x, archY }, i) => (
        <motion.line
          key={`strut${i}`}
          x1={x} y1={archY} x2={x} y2="200"
          stroke="#d4c2fc" strokeWidth="0.5"
          style={{ opacity: opacity * 1.6 }}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, delay: 0.6 + i * 0.06, ease: 'easeOut' }}
        />
      ))}

      {/* NARRATIVE LAYER — every cleanup-story element sits inside this
          group. At t≈1 (6s) the whole layer fades out so only the bridge
          and the data remain on screen. Nothing inside has an infinite
          loop, so once the fade completes the SVG is fully static. */}
      <motion.g
        animate={{ opacity: [1, 1, 0] }}
        transition={{
          duration: TOTAL,
          ease: 'easeInOut',
          times: [0, 0.95, 1],
        }}
      >

      {/* DULL POLLUTED TINT — a hazy grey-yellow wash sits over the whole
          scene during the polluted phase, then lifts as the wind sweeps in
          (3.8s ⇒ t=0.633). Lifts off completely by 5s ⇒ t=0.833. */}
      <motion.rect
        x="0" y="0" width="1100" height="200"
        fill="url(#pollutedTint)"
        animate={{ opacity: [0.30, 0.30, 0.10, 0] }}
        transition={{
          duration: TOTAL,
          ease: 'easeInOut',
          times: [0, 0.55, 0.78, 0.92],
        }}
      />

      {/* FRESH SKY WASH — soft pale-blue gradient that blooms once the area
          is cleansed (5s ⇒ t=0.833) and stays for the looping final state */}
      <motion.rect
        x="0" y="0" width="1100" height="120"
        fill="url(#freshSky)"
        animate={{ opacity: [0, 0, 0.85, 1] }}
        transition={{
          duration: TOTAL,
          ease: 'easeOut',
          times: [0, 0.78, 0.92, 1],
        }}
      />

      {/* AQI FOG — thick white haze above the polluted zone; thins during
          the wind sweep (3.8s–5s ⇒ t=0.633–0.833) */}
      {fogPuffs.map((f, i) => (
        <motion.ellipse
          key={`fog${i}`}
          cx={f.x} cy={f.y} rx={f.rx} ry={f.ry}
          fill="url(#fogGrad)"
          animate={{
            opacity: [0.85, 0.85, 0],
            x: [0, 0, 18 + i * 6],
          }}
          transition={{
            duration: TOTAL,
            ease: 'easeOut',
            times: [0, 0.633, 0.833],
          }}
        />
      ))}

      {/* AIRBORNE PARTICULATE — fine PM2.5-style dust motes scattered through
          the polluted air. They flicker, drift slightly, then are carried
          off-screen by the wind sweep at t=0.633. */}
      {dustMotes.map((m) => (
        <motion.circle
          key={`mote${m.key}`}
          cx={m.x} cy={m.y} r={m.r}
          fill="#6b7280"
          animate={{
            opacity: [0.55, 0.7, 0.55, 0],
            x: [0, m.drift, m.drift + 60, m.drift + 220],
            y: [0, m.driftY, m.driftY * 1.5, m.driftY * 2],
          }}
          transition={{
            duration: TOTAL,
            ease: 'easeOut',
            times: [0, 0.30, 0.633, 0.85],
          }}
        />
      ))}

      {/* HAZARDOUS SMOKE — six grey puffs drift slowly during the polluted
          phase, then are swept away by the wind (3.8s–5s) */}
      {smokePuffs.map((s, i) => (
        <g key={`smoke${i}`} transform={`translate(${s.x}, ${s.y})`}>
          <motion.g
            animate={{
              y: [0, -2 - (i % 3), -3, -85 - i * 4],
              opacity: [0.55, 0.65, 0.55, 0],
              scale: [0.9, 1.0, 1.0, 1.6],
            }}
            transition={{
              duration: TOTAL,
              ease: 'easeOut',
              times: [0, 0.20, 0.633, 0.833],
            }}
          >
            <ellipse cx="0" cy="0" rx={s.r} ry={s.r * 0.55} fill="url(#smokeGrad)" />
          </motion.g>
        </g>
      ))}

      {/* SCATTERED LITTER — bottles, wrappers, and one bag. Each item fades
          exactly when the glove sweeps over it. A small dust-burst plays at
          the same moment to suggest particle disturbance from the grab. */}
      {garbage.map((item, i) => {
        const Item = item.type === 'bottle' ? Bottle : item.type === 'wrapper' ? Wrapper : GarbageBag;
        return (
          <g key={`litter${i}`}>
            {/* The litter itself */}
            <g transform={`translate(${item.x}, ${item.y})`}>
              <motion.g
                animate={{ opacity: [1, 1, 0, 0] }}
                transition={{
                  duration: TOTAL,
                  ease: 'easeOut',
                  times: [0, item.fadeAt - 0.01, item.fadeAt + 0.03, 1],
                }}
              >
                <Item />
              </motion.g>
            </g>
            {/* Pick-disturbance: tiny dust puff erupts the moment item vanishes */}
            <g transform={`translate(${item.x}, ${item.y - 2})`}>
              <motion.g
                animate={{
                  scale: [0.3, 0.3, 1.4, 1.8],
                  opacity: [0, 0, 0.55, 0],
                }}
                transition={{
                  duration: TOTAL,
                  ease: 'easeOut',
                  times: [0, item.fadeAt, item.fadeAt + 0.04, item.fadeAt + 0.10],
                }}
              >
                <circle cx="-3" cy="0" r="1.6" fill="#a8a29e" opacity="0.7" />
                <circle cx="2"  cy="-1" r="1.4" fill="#a8a29e" opacity="0.6" />
                <circle cx="4"  cy="2" r="1.2" fill="#a8a29e" opacity="0.55" />
              </motion.g>
            </g>
          </g>
        );
      })}

      {/* GROUND DIRT TINT — soft brown stain under the litter; fades by
          the time the last item is collected (2.8s ⇒ t=0.467) */}
      <motion.path
        d="M 0 200 Q 70 184 140 188 T 300 195 L 300 200 Z"
        fill="url(#dirtGrad)"
        animate={{ opacity: [0.85, 0.85, 0, 0] }}
        transition={{
          duration: TOTAL,
          ease: 'easeInOut',
          times: [0, 0.45, 0.55, 1],
        }}
      />

      {/* GRASS TUFTS — small bursts of fresh grass pop in alongside the trees */}
      {tufts.map((t, i) => (
        <g key={`tuft${i}`} transform={`translate(${t.x}, 198)`}>
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.9 }}
            transition={{
              duration: 0.55,
              delay: 5.05 * SCALE + i * 0.08,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            style={{ originY: 1 }}
          >
            <path d="M -4 0 L -3 -5 L -2 0 Z" fill="#22c55e" />
            <path d="M -1 0 L 0 -7 L 1 0 Z" fill="#16a34a" />
            <path d="M 2 0 L 3 -5 L 4 0 Z" fill="#22c55e" />
          </motion.g>
        </g>
      ))}

      {/* TREES — spring up once from the cleansed ground at 5s. No idle
          loop: the entire narrative fades away at 6s, so trees stay still. */}
      {trees.map((tree, i) => (
        <g key={`tree${i}`} transform={`translate(${tree.x}, 195)`}>
          <motion.rect
            x="-1.5" y="-12" width="3" height="12" fill="#78350f"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 0.95 }}
            transition={{
              duration: 0.55,
              delay: 5.0 * SCALE + tree.delay,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{ transformOrigin: '0 0' }}
          />
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.55,
              delay: 5.0 * SCALE + tree.delay,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            style={{ transformOrigin: '0 -10px' }}
          >
            <polygon points="-13,-10 13,-10 0,-26" fill="#15803d" />
            <polygon points="-11,-20 11,-20 0,-34" fill="#16a34a" />
            <polygon points="-8,-29 8,-29 0,-42" fill="#22c55e" />
          </motion.g>
        </g>
      ))}

      {/* FRESH-AIR PARTICLES — small green motes rise once from the healed
          ground at 5.0s. They drift up and fade out by 6s. */}
      {airParticles.map((p, i) => (
        <g key={`air${i}`} transform={`translate(${p.x}, 195)`}>
          <motion.circle
            cx="0" cy="0" r="1.4"
            fill="#86efac"
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -90, opacity: [0, 0.85, 0] }}
            transition={{
              duration: 1.4,
              delay: 5.0 * SCALE + p.delay,
              ease: 'easeOut',
              opacity: {
                duration: 1.4,
                delay: 5.0 * SCALE + p.delay,
                ease: 'linear',
                times: [0, 0.2, 1],
              },
            }}
          />
        </g>
      ))}

      {/* SOFT GOLDEN GLOW — sun blooms during the cleanup phase and HOLDS
          through the end so it stays visible. Larger radius + low cy so it
          reads as an upper-left sunrise even when the SVG is rendered very
          short. */}
      <motion.circle
        cx="120" cy="20" r="170" fill="url(#sunGlow)"
        animate={{ opacity: [0, 0, 0.95, 1] }}
        transition={{
          duration: TOTAL,
          ease: 'easeOut',
          times: [0, 0.55, 0.85, 1],
        }}
      />

      {/* RECYCLING BIN — a flanged-lid green bin modeled on the user's
          cartoon reference: bright lime body with a darker outline, a wider
          flange rim with a dark open mouth, a lighter inner panel on the
          front, and a yellow three-arrow recycling glyph. A pile of mini
          garbage bags appears in the open mouth just after the gloves drop
          their armful. The whole bin fades away as the narrative resolves. */}
      <motion.g
        animate={{ opacity: [1, 1, 0] }}
        transition={{
          duration: TOTAL,
          ease: 'easeOut',
          times: [0, 0.85, 1],
        }}
      >
        {/* Bin body — tapered trapezoid (wider at top, slightly narrower at base) */}
        <path
          d="M 824 154 L 886 154 L 881 198 L 829 198 Z"
          fill="#65d136" stroke="#3d8a1e" strokeWidth="0.7"
        />
        {/* Lighter inner front panel — the "label area" carrying the symbol */}
        <path
          d="M 833 162 L 877 162 L 873 192 L 837 192 Z"
          fill="#9be86d" stroke="#3d8a1e" strokeWidth="0.4"
        />

        {/* Recycling glyph — three yellow chevron-arrows arranged in a
            triangular chase loop on the inner panel */}
        <g transform="translate(855, 177)" fill="#facc15" stroke="#854d0e" strokeWidth="0.3">
          {[0, 120, 240].map((angle) => (
            <path
              key={angle}
              transform={`rotate(${angle})`}
              d="M -3.5 -5 L 2 -5 L 1 -7 L 4.8 -4 L 1 -1 L 2 -3 L -3.5 -3 Z"
            />
          ))}
        </g>

        {/* Flange rim — wider than the body, with a dark opening cut out
            so the lid reads as "open" */}
        <rect x="818" y="150" width="74" height="5" fill="#3d8a1e" rx="1" />
        <rect x="820" y="148" width="70" height="4.5" fill="#65d136" stroke="#3d8a1e" strokeWidth="0.5" rx="1" />
        {/* Dark inner mouth (the visible interior through the open lid) */}
        <rect x="829" y="151" width="52" height="3.2" fill="#1f4d10" rx="0.5" />

        {/* Pile of mini garbage poking out of the open mouth — drops in with
            a small bounce just after the glove releases its armful */}
        <motion.g
          animate={{
            opacity: [0, 0, 1, 1, 1],
            y: [-14, -14, 0, -3, 0],
          }}
          transition={{
            duration: TOTAL,
            ease: [0.34, 1.56, 0.64, 1],
            times: [0, 0.61, 0.66, 0.70, 0.75],
          }}
        >
          <g transform="translate(842, 146) scale(0.38)"><GarbageBag /></g>
          <g transform="translate(858, 143) scale(0.46)"><Bottle /></g>
          <g transform="translate(873, 146) scale(0.5)"><Wrapper /></g>
        </motion.g>
      </motion.g>

      {/* CREDIT COINS — three gold ₹ tokens pop up from the bin the moment
          the garbage lands (t≈0.68), bounce, then arc up-and-right toward
          the upper-right of the banner where the "Credits" stat will reveal
          at 6s. They settle there and fade just before the stats appear,
          visually paying off the "trash → credit" loop. Lives outside the
          bin's fade group so it can survive past t=0.85. */}
      {[
        { x: 838, dx: -12, rise: 38, delay: 0.68, rot: -20, target: { x: 990,  y: -28 } },
        { x: 855, dx: 0,   rise: 52, delay: 0.70, rot: 6,   target: { x: 1010, y: -34 } },
        { x: 872, dx: 12,  rise: 40, delay: 0.72, rot: 24,  target: { x: 1030, y: -28 } },
      ].map((c, i) => {
        const startX = c.x;
        const startY = 148;
        const tx = c.target.x - startX;
        const ty = c.target.y - startY;
        return (
          <g key={`coin${i}`} transform={`translate(${startX}, ${startY})`}>
            <motion.g
              animate={{
                opacity: [0, 0, 1, 1, 1, 0],
                x: [0, 0, c.dx, c.dx, tx, tx],
                y: [0, 0, -c.rise, -c.rise * 0.85, ty, ty],
                scale: [0.4, 0.4, 1.2, 1, 0.75, 0.65],
                rotate: [0, 0, c.rot * 0.5, c.rot, c.rot * 2, c.rot * 2.2],
              }}
              transition={{
                duration: TOTAL,
                ease: [0.4, 0, 0.2, 1],
                times: [
                  0,
                  c.delay - 0.005,
                  c.delay + 0.05,   // pop emerge
                  c.delay + 0.10,   // bounce settle
                  c.delay + 0.22,   // arrive near credits
                  c.delay + 0.27,   // fade out
                ],
              }}
            >
              <Coin />
            </motion.g>
          </g>
        );
      })}

      {/* "+ Credits earned" badge — pops to the LEFT of the bin so it
          never overlaps the popping coins or their flight path to the
          right-side credits stat. Drifts slightly upward and fades as the
          coins arrive at the destination. */}
      <g transform="translate(770, 130)">
        <motion.g
          animate={{
            opacity: [0, 0, 1, 1, 0],
            y: [0, 0, -6, -16, -24],
            scale: [0.55, 0.55, 1.15, 1, 0.95],
          }}
          transition={{
            duration: TOTAL,
            ease: [0.34, 1.56, 0.64, 1],
            times: [0, 0.74, 0.79, 0.88, 0.94],
          }}
        >
          <text
            x="0" y="0"
            textAnchor="end"
            fontSize="9"
            fontWeight="900"
            fill="#fde047"
            stroke="#78350f"
            strokeWidth="0.4"
            paintOrder="stroke"
            style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '0.4px' }}
          >
            + Credits earned
          </text>
        </motion.g>
      </g>

      {/* WIND — three thin arcs sweep left → right during the cleanup phase
          (3.8s–5s ⇒ t=0.633–0.833), carrying the smoke and fog away */}
      {[0, 1, 2].map((i) => (
        <motion.path
          key={`wind${i}`}
          d={`M 0 ${108 + i * 14} Q 25 ${100 + i * 14}, 50 ${108 + i * 14} T 100 ${108 + i * 14}`}
          stroke="#d4c2fc" strokeWidth="0.7" fill="none" strokeLinecap="round"
          initial={{ x: -120 }}
          animate={{
            x: [-120, -120, 1200, 1200],
            opacity: [0, 0, 0.75, 0],
          }}
          transition={{
            duration: TOTAL,
            ease: [0.4, 0, 0.6, 1],
            times: [0, 0.633 + i * 0.025, 0.833, 1],
            opacity: {
              duration: TOTAL,
              ease: 'linear',
              times: [0, 0.633 + i * 0.025, 0.78, 1],
            },
          }}
        />
      ))}

      {/* GLOVE — eco-friendly green/white. Trajectory matches the 6s spec:
          0.0–1.2s (t 0–0.20)  hold offscreen upper-left
          1.2–2.8s (t 0.20–0.467)  enter, sweep across the four litter items,
                                   bending lower at each grab
          2.8–3.8s (t 0.467–0.633) carry the armful up in a high parabolic
                                   arc and release into the recycling bin
          3.8s onward (t > 0.633)  exit upper-right and stay offstage
          The carried armful renders three mini items (bag, bottle, wrapper)
          and fades the moment the glove dips into the bin so they appear to
          fall into the pile. */}
      <motion.g
        initial={{ x: -80, y: -45 }}
        animate={{
          // x — offscreen → sweep 8 items → arc apex → dip into bin → exit
          x: [-80, -80, 55, 105, 155, 205, 265, 325, 390, 455, 600, 855, 855, 1220],
          // y — descend → dip at each grab → soar over the apex → dip into bin → exit
          y: [-45, -45, 165, 168, 167, 167, 168, 168, 167, 168, 60, 140, 130, -45],
        }}
        transition={{
          duration: TOTAL,
          times: [0, 0.16, 0.18, 0.22, 0.26, 0.30, 0.34, 0.38, 0.42, 0.46, 0.55, 0.633, 0.70, 0.85],
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {/* Cupped pair of gloves */}
        <g transform="translate(-9, 0)"><Hand /></g>
        <g transform="translate(9, 0)"><Hand flip /></g>

        {/* Carried armful — appears as the glove collects the first item and
            fades the instant it dips into the bin (so the items appear to
            fall from the glove into the pile). */}
        <motion.g
          animate={{ opacity: [0, 0, 1, 1, 0, 0] }}
          transition={{
            duration: TOTAL,
            ease: 'linear',
            times: [0, 0.18, 0.22, 0.62, 0.66, 1],
          }}
        >
          <g transform="translate(-9, 18) scale(0.5)"><GarbageBag /></g>
          <g transform="translate(2, 14) scale(0.55)"><GarbageBag /></g>
          <g transform="translate(11, 19) scale(0.42)"><Bottle /></g>
        </motion.g>
      </motion.g>

      {/* /NARRATIVE LAYER */}
      </motion.g>
    </svg>
  );
};

// Decorative cable-stayed bridge — visually anchors the सेतु ("bridge")
// tagline. Drawn in the brand lavender palette at low opacity so it reads
// as ambient motif, not chart-junk. A tiny luminous dot crosses the deck
// once per loop to reinforce the "bridge for change" idea.
const BridgeMotif = () => {
  // Two pylons + symmetric stay-cables, with a gently arched deck.
  // ViewBox is 1200×220 — height-stretch is intentional so the bridge can
  // sit flush against the bottom edge of the banner without fixed pixel math.
  const PYLONS = [
    { x: 360, top: 30, base: 175 },
    { x: 840, top: 30, base: 175 },
  ];
  // Cable anchor points along the deck (left + right of each pylon).
  const cableAnchors = [
    [120, 200, 280, 320], // left pylon — anchors on either side
    [880, 920, 1000, 1080], // right pylon
  ];

  return (
    <div className="absolute inset-x-0 bottom-0 h-[36%] pointer-events-none overflow-hidden">
      {/* Soft water glow pooled beneath the bridge */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            'radial-gradient(60% 100% at 50% 100%, rgba(212,194,252,0.32), transparent 70%)',
        }}
      />

      <svg
        viewBox="0 0 1200 220"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="setuDeck" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="rgba(212,194,252,0.0)" />
            <stop offset="15%"  stopColor="rgba(212,194,252,0.85)" />
            <stop offset="50%"  stopColor="rgba(255,255,255,0.98)" />
            <stop offset="85%"  stopColor="rgba(212,194,252,0.85)" />
            <stop offset="100%" stopColor="rgba(212,194,252,0.0)" />
          </linearGradient>
          <linearGradient id="setuPylon" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.95)" />
            <stop offset="100%" stopColor="rgba(212,194,252,0.55)" />
          </linearGradient>
          <radialGradient id="setuTraveller" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#fef3c7" />
            <stop offset="60%"  stopColor="rgba(254,243,199,0.6)" />
            <stop offset="100%" stopColor="rgba(254,243,199,0)" />
          </radialGradient>
        </defs>

        {/* Distant water/horizon — a faint band so the bridge has something to span */}
        <path
          d="M 0 200 L 1200 200 L 1200 220 L 0 220 Z"
          fill="rgba(20,36,138,0.45)"
        />
        <path
          d="M 0 198 Q 300 192 600 198 T 1200 198"
          stroke="rgba(212,194,252,0.35)"
          strokeWidth="0.8"
          fill="none"
        />

        {/* Stay-cables — drawn first so the deck and pylons sit above them */}
        {PYLONS.map(({ x, top }, i) =>
          cableAnchors[i].map((ax, j) => (
            <line
              key={`cable-${i}-${j}`}
              x1={x}
              y1={top}
              x2={ax}
              y2={172}
              stroke="rgba(212,194,252,0.85)"
              strokeWidth="0.8"
            />
          ))
        )}

        {/* Bridge deck — subtly arched between the abutments */}
        <path
          d="M 40 175 Q 600 150 1160 175"
          stroke="url(#setuDeck)"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        {/* Deck shadow — gives a sliver of depth */}
        <path
          d="M 40 178 Q 600 153 1160 178"
          stroke="rgba(20,36,138,0.75)"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />

        {/* Pylons */}
        {PYLONS.map(({ x, top, base }) => (
          <g key={`pylon-${x}`}>
            <rect
              x={x - 2.5}
              y={top}
              width="5"
              height={base - top}
              rx="1.5"
              fill="url(#setuPylon)"
            />
            {/* Cap glint */}
            <circle cx={x} cy={top - 2} r="2" fill="rgba(255,255,255,0.8)" />
          </g>
        ))}

        {/* Pylon footings reflected in the water */}
        {PYLONS.map(({ x }) => (
          <ellipse
            key={`reflect-${x}`}
            cx={x}
            cy={205}
            rx="14"
            ry="2"
            fill="rgba(212,194,252,0.4)"
          />
        ))}

        {/* Anchor abutments at each end of the deck */}
        <rect x="20"   y="170" width="28" height="20" rx="3" fill="rgba(212,194,252,0.7)" />
        <rect x="1152" y="170" width="28" height="20" rx="3" fill="rgba(212,194,252,0.7)" />

        {/* Traveller — a luminous mote crossing the bridge once per loop,
            reinforcing the "setu connects two sides" idea. */}
        <motion.circle
          r="3.5"
          fill="url(#setuTraveller)"
          animate={{
            cx: [40, 1160],
            cy: [175, 150, 175],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            repeatDelay: 1.5,
            ease: 'easeInOut',
            times: [0, 0.5, 1],
          }}
        />
      </svg>
    </div>
  );
};

const HeroBanner = ({ globalImpact }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  // Cache the natural open-state height as a pixel value. Animating from a
  // fixed pixel target is far smoother than animating to `'auto'`, which
  // forces framer-motion to re-measure the layout each frame.
  const [openHeight, setOpenHeight] = useState(null);
  const openRef = useRef(null);

  useEffect(() => {
    // 4s close-up: stats reveal + count-up immediately, banner collapses at 4s.
    const t = setTimeout(() => setIsExpanded(false), 4000);
    return () => clearTimeout(t);
  }, []);

  // Measure the open content while it's mounted; resize observer keeps us
  // in sync with viewport / font-loading reflows.
  useLayoutEffect(() => {
    const el = openRef.current;
    if (!el || !isExpanded) return;
    const update = () => setOpenHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isExpanded]);

  const smooth = { duration: 0.55, ease: [0.4, 0, 0.2, 1] };
  const targetHeight = isExpanded ? (openHeight ?? 'auto') : 64;

  return (
    <motion.section
      initial={false}
      animate={{ height: targetHeight }}
      transition={smooth}
      className="relative rounded-3xl overflow-hidden border"
      style={{
        background:
          'linear-gradient(120deg, #0e1a66 0%, #14248a 45%, #1e2b95 100%)',
        borderColor: 'rgba(212,194,252,0.18)',
        boxShadow: '0 20px 50px -20px rgba(20,36,138,0.55)',
        willChange: 'height',
      }}
    >
      {/* Decorative ambient background — soft glows + faint grid (no narrative animation) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="ambient"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div
              className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px]"
              style={{ background: 'radial-gradient(circle, rgba(212,194,252,0.35), transparent 70%)' }}
            />
            <div
              className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[120px]"
              style={{ background: 'radial-gradient(circle, rgba(153,143,199,0.30), transparent 70%)' }}
            />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            {/* The actual सेतु — a cable-stayed bridge motif spanning the banner */}
            <BridgeMotif />
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
              ref={openRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid md:grid-cols-12 gap-6 md:gap-8 px-6 md:px-10 py-10 md:py-12 items-center"
            >
              {/* Left: Identity — seal, wordmark, सेतु subtitle, tagline,
                  live pulse — all reveal in a quick stagger at the start of
                  the 4s close-up. */}
              <div className="md:col-span-7">
                <motion.div
                  className="flex items-center gap-2.5 mb-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
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
                </motion.div>

                <h1 className="font-black tracking-tight leading-[0.95] mb-5">
                  <span className="block text-[44px] md:text-[56px] text-white">
                    Civic<span style={{ color: '#d4c2fc' }}>Setu</span>
                  </span>
                  <motion.span
                    className="block text-2xl md:text-3xl mt-1 font-bold"
                    style={{ color: '#998fc7', fontFamily: 'serif' }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  >
                    सेतु — a bridge for change
                  </motion.span>
                </h1>

                <motion.p
                  className="text-sm md:text-base text-white/70 max-w-lg leading-relaxed"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  Connecting citizens, communities and government through verified
                  environmental action. Every photo is proof. Every credit, real impact.
                </motion.p>

                <motion.div
                  className="flex items-center gap-2 mt-6"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300/90">
                    Live · community impact
                  </span>
                </motion.div>
              </div>

              {/* Right: Stats — reveal alongside the identity column, count
                  up immediately so the 4s close-up resolves before collapse. */}
              <motion.div
                className="md:col-span-5 md:self-start md:-mt-2"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
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
                      <CountUp
                        value={globalImpact?.[key] ?? 0}
                        duration={1.6}
                        startDelay={0.4}
                        className="text-3xl md:text-4xl font-black tabular-nums text-white leading-none block"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                    Updated just now
                  </span>
                </div>
              </motion.div>
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
                      <CountUp value={globalImpact?.[key] ?? 0} style={{ color: accent }} />
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
