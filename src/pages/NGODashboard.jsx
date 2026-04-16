import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Award, MapPin, CalendarDays, CheckCircle2, UserPlus, UserMinus, X, Leaf, Recycle, Waves } from 'lucide-react';

const mockNGOs = [
  {
    id: 1,
    name: 'Green Earth Foundation',
    description: 'Dedicated to reforestation and clean water initiatives across India.',
    icon: Leaf,
    iconColor: '#14248a',
    members: 1250,
    impact: '15,000 trees planted',
    activities: ['Tree Plantation', 'Water Conservation', 'Awareness Campaigns'],
    founded: '2015',
    location: 'New Delhi',
  },
  {
    id: 2,
    name: 'Clean Cities Alliance',
    description: 'Urban waste management and pollution reduction in major cities.',
    icon: Recycle,
    iconColor: '#998fc7',
    members: 890,
    impact: '50 tons of waste recycled',
    activities: ['Waste Management', 'City Cleanups', 'Recycling Programs'],
    founded: '2018',
    location: 'Mumbai',
  },
  {
    id: 3,
    name: 'EcoWarriors India',
    description: 'Community-driven conservation and beach cleanup initiatives.',
    icon: Waves,
    iconColor: '#14248a',
    members: 2100,
    impact: '100+ beach cleanups organized',
    activities: ['Beach Cleanups', 'Marine Conservation', 'Community Events'],
    founded: '2016',
    location: 'Chennai',
  },
];

/* ---------- Shared NGO Card ---------- */
const NGOCard = ({ ngo, joined, onJoin, onLeave }) => {
  const Icon = ngo.icon;
  return (
    <div
      className="card flex flex-col"
      style={{
        border: joined ? '2px solid #14248a' : '1px solid var(--border-light)',
        height: '100%',
      }}
    >
      {/* Card header */}
      <div className="p-5 pb-0 flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--primary-lighter)' }}
        >
          <Icon size={20} style={{ color: ngo.iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{ngo.name}</h3>
            {joined && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#14248a', color: '#fff' }}>
                <CheckCircle2 size={9} /> Member
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              <MapPin size={10} />{ngo.location}
            </span>
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              <CalendarDays size={10} />Est. {ngo.founded}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pt-3 flex-1 flex flex-col gap-3">
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{ngo.description}</p>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg p-2.5" style={{ backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-light)' }}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Users size={11} style={{ color: 'var(--text-tertiary)' }} />
              <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Members</span>
            </div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{ngo.members.toLocaleString()}</p>
          </div>
          <div className="rounded-lg p-2.5" style={{ backgroundColor: 'var(--bg-body)', border: '1px solid var(--border-light)' }}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Award size={11} style={{ color: 'var(--text-tertiary)' }} />
              <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Impact</span>
            </div>
            <p className="font-bold text-xs leading-tight" style={{ color: 'var(--text-primary)' }}>{ngo.impact}</p>
          </div>
        </div>

        {/* Activity tags */}
        <div className="flex flex-wrap gap-1.5">
          {ngo.activities.map(a => (
            <span key={a} className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--primary-lighter)', color: '#14248a' }}>
              {a}
            </span>
          ))}
        </div>
      </div>

      {/* Footer button */}
      <div className="p-5 pt-4">
        {joined ? (
          <button
            onClick={() => onLeave(ngo.id)}
            className="w-full py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            style={{ border: '1.5px solid #ef4444', color: '#ef4444', backgroundColor: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <UserMinus size={13} /> Leave NGO
          </button>
        ) : (
          <button
            onClick={() => onJoin(ngo)}
            className="w-full py-2 rounded-lg text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1.5"
            style={{ backgroundColor: '#14248a' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0e1a66'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#14248a'}
          >
            <UserPlus size={13} /> Join NGO
          </button>
        )}
      </div>
    </div>
  );
};

/* ---------- Main Component ---------- */
const NGODashboard = () => {
  const [joinedNGOs, setJoinedNGOs] = useState([]);
  const [selectedNGO, setSelectedNGO] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('joinedNGOs');
    if (stored) setJoinedNGOs(JSON.parse(stored));
  }, []);

  const handleJoin = (ngo) => { setSelectedNGO(ngo); setShowModal(true); };

  const confirmJoin = () => {
    if (selectedNGO && !joinedNGOs.includes(selectedNGO.id)) {
      const updated = [...joinedNGOs, selectedNGO.id];
      setJoinedNGOs(updated);
      localStorage.setItem('joinedNGOs', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('newNotification', {
        detail: { type: 'success', title: 'Joined Successfully', message: `You are now a member of ${selectedNGO.name}` }
      }));
    }
    setShowModal(false);
    setSelectedNGO(null);
  };

  const handleLeave = (ngoId) => {
    const updated = joinedNGOs.filter(id => id !== ngoId);
    setJoinedNGOs(updated);
    localStorage.setItem('joinedNGOs', JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('newNotification', {
      detail: { type: 'info', title: 'Left NGO', message: 'You have left the organization' }
    }));
  };

  const isJoined = (id) => joinedNGOs.includes(id);
  const myNGOs = mockNGOs.filter(n => isJoined(n.id));
  const available = mockNGOs.filter(n => !isJoined(n.id));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          NGO Dashboard
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Join registered NGOs and contribute to making our nation green and clean.
        </p>
      </div>

      {/* My NGOs */}
      {myNGOs.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={16} style={{ color: '#14248a' }} />
            <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>My NGOs</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myNGOs.map((ngo, i) => (
              <motion.div key={ngo.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <NGOCard ngo={ngo} joined onLeave={handleLeave} onJoin={() => {}} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Available NGOs */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={16} style={{ color: '#14248a' }} />
          <h2 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
            {available.length > 0 ? 'Available NGOs' : 'All NGOs Joined'}
          </h2>
        </div>

        {available.length === 0 ? (
          <div className="card p-10 text-center">
            <CheckCircle2 size={36} style={{ color: '#14248a', margin: '0 auto 12px' }} />
            <p className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>Great job!</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>You have joined all available NGOs on our platform.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {available.map((ngo, i) => (
              <motion.div key={ngo.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="flex flex-col">
                <NGOCard ngo={ngo} joined={false} onJoin={handleJoin} onLeave={() => {}} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Confirm Modal */}
      {showModal && selectedNGO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(40,38,44,0.5)' }}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-xl)' }}
          >
            <div className="h-1" style={{ backgroundColor: '#14248a' }} />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Join {selectedNGO.name}?</h3>
                <button onClick={() => setShowModal(false)} className="p-1 rounded-lg transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-lighter)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                You are about to join <strong style={{ color: 'var(--text-primary)' }}>{selectedNGO.name}</strong>. You will be able to participate in their activities and contribute to their environmental mission.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors"
                  style={{ border: '1.5px solid var(--border-medium)', color: 'var(--text-secondary)', backgroundColor: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--primary-lighter)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  Cancel
                </button>
                <button onClick={confirmJoin}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-lg text-white transition-colors"
                  style={{ backgroundColor: '#14248a' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0e1a66'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#14248a'}>
                  Confirm Join
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default NGODashboard;
