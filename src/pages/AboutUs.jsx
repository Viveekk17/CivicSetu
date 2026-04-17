import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLeaf, faUsers, faCoins, faTree, faShieldAlt,
  faGlobe, faChartLine, faHandHoldingHeart,
  faRecycle, faCheckCircle, faArrowRight, faEnvelope,
  faCode, faMapMarkerAlt, faCamera,
  faUpload, faSearch, faBrain, faAward, faStar,
  faExclamationCircle, faNewspaper, faHistory,
  faUserPlus, faGift, faBolt,
  faLayerGroup, faRocket, faHeart, faNetworkWired, faDatabase,
  faServer, faLock, faChevronDown, faChevronUp,
  faBuilding, faLaptopCode, faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

/* Data */
const STATS = [
  { value: '10,000+', label: 'Civic Actions', icon: faCheckCircle, color: '#998fc7' },
  { value: '5,000+', label: 'Active Citizens', icon: faUsers, color: '#14248a' },
  { value: '250+', label: 'Trees Planted', icon: faTree, color: '#22c55e' },
  { value: '₹2L+', label: 'Credits Redeemed', icon: faCoins, color: '#f59e0b' },
  { value: '50+', label: 'Partner NGOs', icon: faHandHoldingHeart, color: '#ec4899' },
  { value: '99.2%', label: 'AI Accuracy', icon: faBrain, color: '#6366f1' },
];

const WORKFLOW_STEPS = [
  { num: '01', icon: faUserPlus, color: '#14248a', title: 'Register & Verify', desc: 'Create your CivicSetu account using email/password or Google OAuth via Firebase. A crypto-grade JWT session token is issued to authenticate API requests.' },
  { num: '02', icon: faCamera, color: '#ec4899', title: 'Capture Before Photo', desc: 'Use the in-app camera to photograph the area BEFORE cleanup. GPS co-ordinates are tagged automatically. Save as a draft in your Activity Feed and return later.' },
  { num: '03', icon: faRecycle, color: '#f59e0b', title: 'Perform the Cleanup', desc: 'Carry out your civic action — garbage collection, waterbody cleaning, tree planting, or waste segregation. Tag friends or NGO partners for collaborative drives.' },
  { num: '04', icon: faCheckCircle, color: '#998fc7', title: 'Capture After & Submit', desc: 'Photograph the same spot AFTER cleanup. Upload both photos. We compute an MD5 hash of each image to detect duplicate submissions.' },
  { num: '05', icon: faBrain, color: '#6366f1', title: 'AI Verification', desc: 'Google Gemini Vision verifies authenticity, identifies the cleanup category, estimates waste weight, calculates CO₂ saved, and allocates credits — in ~10 seconds.' },
  { num: '06', icon: faCoins, color: '#f59e0b', title: 'Credits to Wallet', desc: 'AI-approved submissions instantly credit your wallet. Group activities apply bonuses; large cleanups (>20 kg) require community/NGO tagging.' },
  { num: '07', icon: faNewspaper, color: '#998fc7', title: 'Share to Public Feed', desc: 'Publish your verified submission to the Public Feed with a custom description. Tag communities so your ward / colony see your impact.' },
  { num: '08', icon: faGift, color: '#998fc7', title: 'Redeem Rewards', desc: 'Spend credits across 5 categories: Transport, Utilities, Goodies, Recognition, and Environment (tree planting via partner NGOs).' },
];

const HOW_TO_STEPS = [
  {
    id: 'upload', title: 'Upload an Activity', color: '#998fc7',
    steps: [
      { icon: faMapMarkerAlt, text: 'Open "Add Activity". The app auto-detects your GPS via the Geolocation API and reverse-geocodes it.' },
      { icon: faCamera, text: 'Tap "Before Photo" — open the in-app camera or pick from your gallery. The photo timestamp is captured automatically.' },
      { icon: faHistory, text: 'Not ready for the After photo? Hit "Save Draft". The photo is stored in your browser; resume anytime from the Activity Feed.' },
      { icon: faRecycle, text: 'After completing the cleanup, tap "Resume" on the draft and capture the After Photo of the cleaned area.' },
      { icon: faUsers, text: '(Optional) Tag co-participants to split credits, or switch to Community/NGO mode for large group cleanups.' },
      { icon: faUpload, text: 'Tap "Upload & Verify". Both photos go to Gemini AI for analysis after duplicate detection.' },
      { icon: faBrain, text: 'Within seconds, the AI shows: category, estimated waste, CO₂ saved, credits awarded. Review and Confirm.' },
      { icon: faCheckCircle, text: 'On confirmation, the submission is saved, your wallet updates, and a notification fires in the Header.' },
    ]
  },
  {
    id: 'redeem', title: 'Redeem Credits', color: '#f59e0b',
    steps: [
      { icon: faCoins, text: 'Open the "Redeem" page. Your current balance is shown at the top.' },
      { icon: faLayerGroup, text: 'Choose a category: Transport, Utilities, Goodies, Recognition, or Environment.' },
      { icon: faSearch, text: 'Each card shows item name, description, CO₂ offset value, and credit cost.' },
      { icon: faGift, text: 'Click "Redeem". A modal confirms cost and your post-redemption balance.' },
      { icon: faCheckCircle, text: 'On confirm, credits are deducted. Environment items create a tree planting request to a partner NGO.' },
      { icon: faTree, text: 'Track tree planting status in the Header dropdown: Pending → Sent → In Progress → Completed.' },
      { icon: faBolt, text: 'Non-environment items (bus passes, vouchers) appear in your Bag — use them when needed.' },
    ]
  },
  {
    id: 'feed', title: 'Public Feed', color: '#14248a',
    steps: [
      { icon: faNewspaper, text: 'Open "Public Feed" to see real-time verified civic actions across India.' },
      { icon: faSearch, text: 'Filter by My Posts using the toggle, or by location and community.' },
      { icon: faHeart, text: 'React to posts. Each shows location, category, credits earned, and tagged community.' },
      { icon: faUsers, text: 'Posts from communities you follow appear highlighted. Discover and join cleanup drives.' },
      { icon: faUpload, text: 'When uploading, toggle "Share to Feed" with a caption to publish directly.' },
    ]
  },
  {
    id: 'report', title: 'Report an Issue', color: '#ef4444',
    steps: [
      { icon: faExclamationCircle, text: 'Go to "Report Issue" and choose the issue category.' },
      { icon: faBuilding, text: '"Civic Issue" — for real-world problems: garbage dumping, water pollution, civic failures.' },
      { icon: faLaptopCode, text: '"Platform Issue" — for app problems: submission errors, credit discrepancies, bugs.' },
      { icon: faSearch, text: 'Select the sub-type and write a detailed description (min 10 chars).' },
      { icon: faCamera, text: 'Attach a photo (max 5 MB) — a screenshot for platform issues, or a real photo for civic ones.' },
      { icon: faPaperPlane, text: 'Submit. The report goes to the admin panel for triage and forwarding.' },
    ]
  },
  {
    id: 'community', title: 'Communities', color: '#998fc7',
    steps: [
      { icon: faUsers, text: 'Visit "Community" to discover local groups — RWAs, NGO chapters, college eco-clubs.' },
      { icon: faUserPlus, text: 'Join communities relevant to your ward, city, or interest. Membership is free and instant.' },
      { icon: faNewspaper, text: 'Community boards show all submissions from members — collective impact made visible.' },
      { icon: faUpload, text: 'Tag a community when uploading to attribute the cleanup and boost their leaderboard rank.' },
      { icon: faAward, text: 'Top-performing communities are listed on the public Analytics leaderboard.' },
    ]
  },
  {
    id: 'analytics', title: 'Analytics', color: '#6366f1',
    steps: [
      { icon: faChartLine, text: 'Open "Analytics" to see your civic impact dashboard with interactive charts.' },
      { icon: faLeaf, text: 'Track CO₂ Saved, Waste Collected, Trees Planted, and Credits Earned over time.' },
      { icon: faStar, text: 'The Leaderboard widget shows your rank among all CivicSetu users.' },
      { icon: faChartLine, text: 'Time-series charts show your activity trend: weekly, monthly, or all-time.' },
      { icon: faAward, text: 'Your civic role badge (Beginner → Warrior → Hero → Champion) is calculated from your credits.' },
    ]
  },
];

const TECH_STACK = [
  { label: 'React 19 + Vite', color: '#61dafb', icon: faCode },
  { label: 'Node.js + Express', color: '#68a063', icon: faServer },
  { label: 'MongoDB', color: '#4db33d', icon: faDatabase },
  { label: 'Firebase Auth', color: '#ff9800', icon: faLock },
  { label: 'Gemini AI', color: '#998fc7', icon: faBrain },
  { label: 'Framer Motion', color: '#bb66ff', icon: faRocket },
  { label: 'Cloudinary', color: '#3448c5', icon: faUpload },
  { label: 'Tailwind CSS', color: '#38bdf8', icon: faStar },
  { label: 'SparkMD5', color: '#e11d48', icon: faShieldAlt },
  { label: 'Vercel', color: '#1f2937', icon: faGlobe },
];

const FAQ = [
  { q: 'How does the AI know my cleanup is real?', a: 'Google Gemini Vision AI analyses spatial and contextual differences between your Before and After photos — looking for verifiable changes in waste volume and cleanliness. Fake or AI-generated images are rejected. Plus, MD5 hashes of each image are checked against our database to prevent duplicate submissions.' },
  { q: 'How are credits calculated?', a: 'Base credits are determined by the AI (typically 10–50 per kg, scaled by cleanup type). Group activities earn 10% per additional member. Large cleanups (>20 kg) with community/NGO tagging earn an extra multiplier.' },
  { q: 'What happens after I redeem trees?', a: 'Your tree planting request is sent to a verified partner NGO via the Admin Portal. Track status in real-time through the Header dropdown: Pending → Sent → Planting in Progress → Completed.' },
  { q: 'Is my location data stored?', a: 'GPS co-ordinates are stored with each submission to render geo-tagged reports. Used only for civic mapping and leaderboard locality features. We never sell or share location data.' },
  { q: 'Can I use the app offline?', a: 'Partially. You can draft a Before photo offline (stored in your browser). AI verification and credit award require an active connection. The draft remains safe until you reconnect.' },
  { q: 'What qualifies as a valid civic action?', a: 'Any verifiable environmental or sanitation activity: garbage pickup, waterbody cleaning, waste segregation, tree plantation, or community beautification. The AI must identify a measurable positive change in the photo pair.' },
];

/* Motion */
const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
};

const Eyebrow = ({ children }) => (
  <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
    {children}
  </p>
);

const SectionTitle = ({ children }) => (
  <h2 className="text-2xl md:text-3xl font-bold mt-1.5" style={{ color: 'var(--text-primary)' }}>
    {children}
  </h2>
);

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        border: '1px solid var(--border-light)',
        background: 'var(--bg-surface)',
      }}
    >
      <button
        className="w-full flex items-center justify-between gap-4 p-4 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{q}</span>
        <FontAwesomeIcon
          icon={open ? faChevronUp : faChevronDown}
          className="flex-shrink-0 text-xs transition-transform"
          style={{ color: open ? 'var(--primary)' : 'var(--text-tertiary)' }}
        />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{a}</p>
        </div>
      )}
    </div>
  );
};

const AboutUs = () => {
  const navigate = useNavigate();
  const [activeHow, setActiveHow] = useState('upload');
  const activeSection = HOW_TO_STEPS.find(s => s.id === activeHow);

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6 md:space-y-8 pb-10 md:pb-12">

      {/* HERO */}
      <motion.div variants={item} className="card p-5 md:p-8 relative overflow-hidden">
        <div
          className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,194,252,0.3), transparent 70%)' }}
        />
        <div className="grid md:grid-cols-5 gap-5 md:gap-6 items-center relative z-10">
          <div className="md:col-span-3">
            <Eyebrow>About CivicSetu</Eyebrow>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mt-1 md:mt-1.5 leading-tight" style={{ color: 'var(--text-primary)' }}>
              India's AI-powered civic{' '}
              <span style={{ color: 'var(--primary)' }}>participation platform</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base mt-3 max-w-xl" style={{ color: 'var(--text-secondary)' }}>
              CivicSetu (सेतु = Bridge) connects motivated citizens with the civic systems, NGOs,
              and local governments that need their participation. Every cleanup is verified by AI,
              rewarded with credits, and tracked end-to-end.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 mt-4 md:mt-5">
              <button onClick={() => navigate('/upload')} className="btn btn-primary w-full sm:w-auto">
                Start Contributing <FontAwesomeIcon icon={faArrowRight} />
              </button>
              <button onClick={() => navigate('/community')} className="btn btn-outline w-full sm:w-auto">
                Join Community <FontAwesomeIcon icon={faUsers} />
              </button>
            </div>
          </div>
          <div
            className="md:col-span-2 rounded-2xl p-5 md:p-6 text-center"
            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1e3aa8 100%)', color: '#fff' }}
          >
            <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">Built for</p>
            <p className="text-2xl md:text-3xl font-bold mt-2 leading-none">Bharat</p>
            <p className="text-xs md:text-sm font-semibold tracking-widest mt-3 opacity-90">
              स्वच्छ भारत अपना भारत
            </p>
            <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-3">
              <div className="min-w-0">
                <p className="text-lg md:text-xl font-bold leading-none">10K+</p>
                <p className="text-[10px] uppercase tracking-wider opacity-80 mt-1 truncate">Actions</p>
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-xl font-bold leading-none">5K+</p>
                <p className="text-[10px] uppercase tracking-wider opacity-80 mt-1 truncate">Citizens</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* STATS */}
      <motion.div variants={item}>
        <div className="mb-4">
          <Eyebrow>Impact in Numbers</Eyebrow>
          <SectionTitle>Platform metrics</SectionTitle>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="card p-3 md:p-4 text-center min-w-0"
              style={{ borderColor: `${s.color}33` }}
            >
              <div
                className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center mx-auto mb-2 md:mb-3"
                style={{ background: `${s.color}1a`, color: s.color }}
              >
                <FontAwesomeIcon icon={s.icon} className="text-sm md:text-base" />
              </div>
              <p className="text-base md:text-xl font-bold truncate" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] md:text-[11px] mt-1 font-medium truncate" style={{ color: 'var(--text-tertiary)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* PROBLEM + SOLUTION */}
      <motion.div variants={item} className="grid md:grid-cols-2 gap-5 md:gap-6">
        <div className="card p-5 md:p-7">
          <Eyebrow>The Problem</Eyebrow>
          <SectionTitle>Why CivicSetu exists</SectionTitle>
          <div className="space-y-3 mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <p>India generates <strong style={{ color: 'var(--text-primary)' }}>62 million tonnes of municipal waste per year</strong> — yet less than 60% is collected and only 15% processed.</p>
            <p>The missing element is <strong style={{ color: 'var(--text-primary)' }}>citizen participation at scale</strong>. Millions are willing to act, but have no incentive, no verification, and no way to prove their contribution.</p>
            <p>CivicSetu solves this by creating a <strong style={{ color: 'var(--text-primary)' }}>trust layer</strong> between citizens and civic systems — using AI verification, credit accounting, and NGO partnerships.</p>
          </div>
        </div>

        <div className="card p-5 md:p-7">
          <Eyebrow>The Solution</Eyebrow>
          <SectionTitle>How CivicSetu works</SectionTitle>
          <div className="space-y-3 mt-4">
            {[
              { icon: faBrain, color: '#6366f1', t: 'AI-Verified Impact', d: 'Every upload analysed by Gemini Vision — eliminates fakes, calculates precise environmental metrics.' },
              { icon: faCoins, color: '#f59e0b', t: 'Gamified Credits', d: 'Verifiable credits incentivise repeat participation. Group bonuses encourage community drives.' },
              { icon: faHandHoldingHeart, color: '#ec4899', t: 'NGO Bridge', d: 'Credits convert to real tree planting via verified NGO partners with full lifecycle tracking.' },
              { icon: faNetworkWired, color: '#998fc7', t: 'Community Ecosystem', d: 'Hyperlocal communities connect neighbours, RWAs, and eco-clubs for organised drives.' },
            ].map(it => (
              <div
                key={it.t}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-light)' }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${it.color}1f`, color: it.color }}
                >
                  <FontAwesomeIcon icon={it.icon} />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{it.t}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{it.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* WORKFLOW */}
      <motion.div variants={item}>
        <div className="mb-4 md:mb-5">
          <Eyebrow>End-to-End Journey</Eyebrow>
          <SectionTitle>The complete CivicSetu workflow</SectionTitle>
        </div>
        <div className="grid md:grid-cols-2 gap-3 md:gap-4">
          {WORKFLOW_STEPS.map((step) => (
            <div
              key={step.num}
              className="card p-4 md:p-5 flex gap-3 md:gap-4 items-start min-w-0"
              style={{ borderColor: `${step.color}22` }}
            >
              <div className="relative flex-shrink-0">
                <div
                  className="w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${step.color}1a`, color: step.color }}
                >
                  <FontAwesomeIcon icon={step.icon} className="text-sm md:text-base" />
                </div>
                <span
                  className="absolute -top-1 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ background: step.color, color: '#fff' }}
                >
                  {step.num}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm md:text-base" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* HOW TO USE */}
      <motion.div variants={item} className="card p-5 md:p-7">
        <div className="mb-4 md:mb-5">
          <Eyebrow>Step-by-Step Guides</Eyebrow>
          <SectionTitle>How to use CivicSetu</SectionTitle>
        </div>

        <div className="flex gap-2 mb-5 md:mb-6 overflow-x-auto -mx-1 px-1 pb-1 md:flex-wrap md:overflow-visible md:mx-0 md:px-0 md:pb-0">
          {HOW_TO_STEPS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveHow(s.id)}
              className="px-3.5 md:px-4 py-2 rounded-lg font-semibold text-xs transition-all whitespace-nowrap flex-shrink-0"
              style={{
                background: activeHow === s.id ? s.color : 'var(--bg-hover)',
                color: activeHow === s.id ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${activeHow === s.id ? s.color : 'var(--border-light)'}`,
              }}
            >
              {s.title}
            </button>
          ))}
        </div>

        {activeSection && (
          <motion.div
            key={activeHow}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2.5 md:space-y-3"
          >
            {activeSection.steps.map((step, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 md:gap-3 p-3 rounded-xl min-w-0"
                style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-light)' }}
              >
                <div
                  className="w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-[11px] md:text-xs"
                  style={{ background: activeSection.color }}
                >
                  {i + 1}
                </div>
                <div className="flex items-start gap-2.5 md:gap-3 flex-1 min-w-0">
                  <div
                    className="w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: `${activeSection.color}1a`, color: activeSection.color }}
                  >
                    <FontAwesomeIcon icon={step.icon} className="text-[10px] md:text-xs" />
                  </div>
                  <p className="text-xs md:text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{step.text}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* TECH STACK */}
      <motion.div variants={item}>
        <div className="mb-4">
          <Eyebrow>Technology Stack</Eyebrow>
          <SectionTitle>Built with</SectionTitle>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 md:gap-3">
          {TECH_STACK.map((tech) => (
            <div
              key={tech.label}
              className="card p-3 md:p-4 text-center min-w-0"
              style={{ borderColor: `${tech.color}33` }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2"
                style={{ background: `${tech.color}1a`, color: tech.color }}
              >
                <FontAwesomeIcon icon={tech.icon} className="text-sm md:text-base" />
              </div>
              <p className="font-semibold text-[11px] md:text-xs truncate" style={{ color: 'var(--text-primary)' }}>{tech.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ARCHITECTURE */}
      <motion.div variants={item}>
        <div className="mb-4">
          <Eyebrow>System Architecture</Eyebrow>
          <SectionTitle>How the platform is built</SectionTitle>
        </div>
        <div className="grid md:grid-cols-3 gap-3 md:gap-4">
          {[
            {
              title: 'Frontend',
              color: '#14248a',
              points: [
                'React 19 SPA with React Router v6',
                'Framer Motion transitions',
                'Context API for language state',
                'Camera + Geolocation APIs',
                'SparkMD5 client-side hashing',
                'Axios with JWT interceptors',
                'Vercel deployment with CI/CD',
              ]
            },
            {
              title: 'Backend',
              color: '#998fc7',
              points: [
                'Express REST API with JWT auth',
                'Firebase Admin SDK token verification',
                'Multer + Cloudinary uploads',
                'Google Gemini 1.5 Vision',
                'Mongoose ODM (MongoDB Atlas)',
                'MD5 duplicate detection',
                'Admin-only NGO management routes',
              ]
            },
            {
              title: 'Data & Integrations',
              color: '#6366f1',
              points: [
                'MongoDB Atlas (cloud)',
                'Firebase Auth (email + Google)',
                'Cloudinary CDN',
                'Gemini Vision verification',
                'Reverse Geocoding service',
                'NGO Partner webhooks',
                'localStorage offline drafts',
              ]
            },
          ].map(col => (
            <div key={col.title} className="card p-4 md:p-5" style={{ borderColor: `${col.color}33` }}>
              <Eyebrow>{col.title}</Eyebrow>
              <ul className="space-y-2 mt-3">
                {col.points.map(p => (
                  <li key={p} className="flex items-start gap-2 text-xs md:text-sm">
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      className="text-xs mt-1 flex-shrink-0"
                      style={{ color: col.color }}
                    />
                    <span style={{ color: 'var(--text-secondary)' }}>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>

      {/* FAQ */}
      <motion.div variants={item}>
        <div className="mb-4">
          <Eyebrow>Frequently Asked Questions</Eyebrow>
          <SectionTitle>Got questions?</SectionTitle>
        </div>
        <div className="max-w-3xl space-y-2">
          {FAQ.map(it => <FaqItem key={it.q} {...it} />)}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div variants={item} className="card p-6 md:p-10 relative overflow-hidden text-center">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1e3aa8 100%)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />
        <div className="relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80" style={{ color: '#fff' }}>
            Get involved
          </p>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mt-2 text-white leading-tight">
            Ready to build a cleaner Bharat?
          </h2>
          <p className="text-xs sm:text-sm mt-3 max-w-lg mx-auto" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Join thousands of citizens making verified, rewarded civic impact —
            one cleanup at a time.
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center gap-3 mt-5 md:mt-6">
            <button
              onClick={() => navigate('/register')}
              className="btn font-semibold px-5 md:px-6 py-2.5 rounded-lg transition-all hover:scale-105 w-full sm:w-auto"
              style={{ background: '#fff', color: 'var(--primary)' }}
            >
              Get Started <FontAwesomeIcon icon={faArrowRight} />
            </button>
            <button
              onClick={() => navigate('/report-issue')}
              className="btn font-semibold px-5 md:px-6 py-2.5 rounded-lg transition-all hover:scale-105 w-full sm:w-auto"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              Report an Issue <FontAwesomeIcon icon={faExclamationCircle} />
            </button>
            <a
              href="mailto:civicsetu@example.com"
              className="btn font-semibold px-5 md:px-6 py-2.5 rounded-lg transition-all hover:scale-105 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              Contact Us <FontAwesomeIcon icon={faEnvelope} />
            </a>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
};

export default AboutUs;
