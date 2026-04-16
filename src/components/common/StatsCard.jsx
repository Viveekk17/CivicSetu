import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowTrendUp, faArrowTrendDown } from '@fortawesome/free-solid-svg-icons';

const PALETTE = {
  primary:   { ring: 'var(--primary)',   tint: 'rgba(20, 36, 138, 0.10)',  text: 'var(--primary)' },
  secondary: { ring: 'var(--secondary)', tint: 'rgba(153, 143, 199, 0.16)', text: 'var(--secondary-dark)' },
  accent:    { ring: 'var(--accent)',    tint: 'rgba(212, 194, 252, 0.25)', text: 'var(--secondary-dark)' },
  success:   { ring: '#10b981',          tint: 'rgba(16, 185, 129, 0.12)',  text: '#059669' },
  info:      { ring: '#0ea5e9',          tint: 'rgba(14, 165, 233, 0.12)',  text: '#0284c7' },
  warning:   { ring: '#f59e0b',          tint: 'rgba(245, 158, 11, 0.12)',  text: '#d97706' },
};

const resolvePalette = (color) => {
  if (PALETTE[color]) return PALETTE[color];
  return { ring: color, tint: `${color}1A`, text: color };
};

const StatsCard = ({ title, value, suffix, icon, color = 'primary', trend }) => {
  const c = resolvePalette(color);
  const positive = typeof trend === 'number' && trend >= 0;

  return (
    <div className="card p-5 relative overflow-hidden h-full flex flex-col justify-between group">
      {/* Glow halo behind icon */}
      <div
        className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-2xl opacity-40 transition-opacity group-hover:opacity-60 pointer-events-none"
        style={{ backgroundColor: c.ring }}
      />

      <div className="flex items-start justify-between mb-4 relative">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm"
          style={{ backgroundColor: c.tint, color: c.text }}
        >
          <FontAwesomeIcon icon={icon} className="text-base" />
        </div>

        {typeof trend === 'number' && trend !== 0 && (
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
            style={{
              backgroundColor: positive ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
              color: positive ? '#059669' : '#dc2626',
            }}
          >
            <FontAwesomeIcon icon={positive ? faArrowTrendUp : faArrowTrendDown} className="text-[9px]" />
            {positive ? '+' : ''}{trend}%
          </span>
        )}
      </div>

      <div className="relative">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {title}
        </p>
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-3xl font-black leading-none tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {value}
          </h3>
          {suffix && (
            <span className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
              {suffix}
            </span>
          )}
        </div>
      </div>

      {/* Tricolor micro-accent — civic identity */}
      <div className="absolute bottom-3 right-3 flex gap-0.5 opacity-60">
        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#FF9933' }} />
        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 0 0 0.5px rgba(0,0,0,0.1)' }} />
        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: '#138808' }} />
      </div>
    </div>
  );
};

export default StatsCard;
