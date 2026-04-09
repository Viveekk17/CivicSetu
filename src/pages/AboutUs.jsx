import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLeaf, faUsers, faCoins, faTree, faShieldAlt,
  faGlobe, faChartLine, faHandHoldingHeart, faBolt,
  faRecycle, faCheckCircle, faArrowRight, faEnvelope,
  faCode, faMobileAlt, faMapMarkerAlt, faCamera,
  faUpload, faSearch, faBrain, faAward, faStar,
  faExclamationCircle, faNewspaper, faHistory,
  faUserPlus, faSignInAlt, faBus, faGift, faMedal,
  faLayerGroup, faPaw, faGlobeAmericas, faLightbulb,
  faRocket, faHeart, faNetworkWired, faDatabase,
  faServer, faLock, faChevronDown, faChevronUp,
  faBuilding, faLaptopCode, faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedin, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { useNavigate } from 'react-router-dom';

/* ──────────────────────────────────────────────
   Data Constants
────────────────────────────────────────────── */
const STATS = [
  { value: '10,000+', label: 'Civic Actions Logged', icon: faCheckCircle, color: '#10b981' },
  { value: '5,000+', label: 'Active Citizens', icon: faUsers, color: '#3b82f6' },
  { value: '250+', label: 'Trees Planted via NGOs', icon: faTree, color: '#22c55e' },
  { value: '₹2L+', label: 'Credits Redeemed', icon: faCoins, color: '#f59e0b' },
  { value: '50+', label: 'Partner NGOs', icon: faHandHoldingHeart, color: '#ec4899' },
  { value: '99.2%', label: 'AI Verification Accuracy', icon: faBrain, color: '#6366f1' },
];

const WORKFLOW_STEPS = [
  {
    num: '01', icon: faUserPlus, color: '#3b82f6',
    title: 'Register & Verify',
    desc: 'Create your CivicSetu account using email/password or Google OAuth via Firebase. Your identity is securely verified and a crypto-grade JWT session token is issued to authenticate all future API requests to our Node.js backend.'
  },
  {
    num: '02', icon: faCamera, color: '#ec4899',
    title: 'Capture Before Photo',
    desc: 'Head to your cleanup site and use the in-app camera (or gallery upload) to photograph the area BEFORE cleanup. The GPS co-ordinates are automatically tagged from your device. You can save this as a draft in your Activity Feed and return later.'
  },
  {
    num: '03', icon: faRecycle, color: '#f59e0b',
    title: 'Perform the Cleanup',
    desc: 'Carry out your civic action — whether it is garbage collection, waterbody cleaning, tree planting, or waste segregation. You can invite friends and tag group members or NGO partners for collaborative activities.'
  },
  {
    num: '04', icon: faCheckCircle, color: '#10b981',
    title: 'Capture After Photo & Submit',
    desc: 'Once done, photograph the same spot AFTER cleanup. Upload both photos together. Our system computes an MD5 hash of each image to detect duplicate submissions before they even reach the AI.'
  },
  {
    num: '05', icon: faBrain, color: '#6366f1',
    title: 'Google Gemini AI Verification',
    desc: 'The before+after photo pair is sent to Google Gemini Vision AI which: (a) detects authenticity — rejecting AI-generated or fake images, (b) identifies the cleanup category (garbage, water, methane, restoration), (c) estimates waste weight in kg, (d) calculates CO₂ saved, and (e) allocates a credit score. This happens in ~10 seconds.'
  },
  {
    num: '06', icon: faCoins, color: '#f59e0b',
    title: 'Credits Hit Your Wallet',
    desc: 'AI-approved submissions instantly credit your wallet. Badges and multipliers apply for group activities: every additional member adds a group bonus. Large cleanups (>20 kg) must be community/NGO-tagged; cleanups over 50 kg require NGO co-submission.'
  },
  {
    num: '07', icon: faNewspaper, color: '#10b981',
    title: 'Share to Public Feed',
    desc: 'Your verified submission can be shared as a Post to the Public Feed with a custom description. Tag communities you belong to so your ward / colony see your impact. Other users can react and comment, building local civic momentum.'
  },
  {
    num: '08', icon: faGift, color: '#8b5cf6',
    title: 'Redeem Rewards',
    desc: 'Spend your Credits in the Redeem store across 5 categories: Transport (bus/metro vouchers), Utilities (electricity discounts), Goodies (eco-products), Recognition (medals/badges), and Environment (tree planting via NGO partners).'
  },
];

const HOW_TO_STEPS = [
  {
    id: 'upload',
    emoji: '📸',
    title: 'How to Upload an Activity',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.06)',
    border: 'rgba(16,185,129,0.3)',
    steps: [
      { icon: faMapMarkerAlt, text: 'Open the "Add Activity" page. The app auto-detects your GPS location using your device\'s Geolocation API and reverse-geocodes it to a readable address.' },
      { icon: faCamera, text: 'Tap "Before Photo" — either open the in-app camera or choose from your gallery. The photo timestamp is captured automatically.' },
      { icon: faHistory, text: 'Not ready to upload the After photo yet? Hit "Save Draft". The Before photo is encoded to Base64 and saved to your browser\'s localStorage. It will appear in your Activity Feed so you can Resume later.' },
      { icon: faRecycle, text: 'After completing the cleanup, come back and tap "Resume" on the draft (or start fresh). Capture the "After Photo" showing the cleaned area.' },
      { icon: faUsers, text: '(Optional) Enable "Tag Members" to add co-participants. Search for registered users by name — they appear in the credit calculation and earn split credits. Switch to "Community" or "NGO" mode for large group cleanups.' },
      { icon: faUpload, text: 'Tap "Upload & Verify". The system checks for duplicates via MD5 hash comparison, then sends both photos to Google Gemini AI for analysis.' },
      { icon: faBrain, text: 'Within seconds, the AI result is shown: category, estimated waste weight (kg), CO₂ saved, and credits to be awarded. Review and Confirm.' },
      { icon: faCheckCircle, text: 'On confirmation, the submission is saved to MongoDB, your credits wallet is updated, and a real-time notification fires in your Header. You can also post it to the Public Feed with a caption.' },
    ]
  },
  {
    id: 'redeem',
    emoji: '🎁',
    title: 'How to Redeem Credits',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.06)',
    border: 'rgba(245,158,11,0.3)',
    steps: [
      { icon: faCoins, text: 'Navigate to the "Redeem" page. Your current credit balance is prominently displayed at the top.' },
      { icon: faLayerGroup, text: 'Choose a category tab: Transport, Utilities, Goodies, Recognition, or Environment. Items are loaded live from the backend database.' },
      { icon: faSearch, text: 'Browse available items. Each card shows: the item name, description, CO₂ offset value, and credit cost.' },
      { icon: faGift, text: 'Click "Redeem" on any item you can afford. A confirmation modal appears showing cost, your current balance, and your balance after redemption.' },
      { icon: faCheckCircle, text: 'Confirm the redemption. The backend deducts credits from your account and logs the redemption. For Environment items (trees), a tree planting request is submitted to the partner NGO.' },
      { icon: faTree, text: 'Track your tree planting request status in the Header\'s 🌳 dropdown: Pending → Sent to NGO → Planting in Progress → Completed.' },
      { icon: faBolt, text: 'Non-environment items (bus passes, electricity vouchers etc.) appear in your Bag (🛍️ icon in the Header). Use them from there when needed.' },
    ]
  },
  {
    id: 'feed',
    emoji: '📰',
    title: 'How to Use the Public Feed',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.06)',
    border: 'rgba(59,130,246,0.3)',
    steps: [
      { icon: faNewspaper, text: 'Open "Public Feed" from the nav. You\'ll see a real-time feed of verified civic actions uploaded by citizens across India.' },
      { icon: faSearch, text: 'Filter by My Posts (your own submissions) using the toggle in the top-right. You can also filter by location or community.' },
      { icon: faHeart, text: 'React to posts that inspire you. Each post shows the location, cleanup category, credits earned, and the community tagged.' },
      { icon: faUsers, text: 'Posts from communities you follow appear highlighted. Discover new cleanup drives and join them.' },
      { icon: faUpload, text: 'When uploading an activity, toggle "Share to Feed" and add a caption to publish it directly.' },
    ]
  },
  {
    id: 'report',
    emoji: '🚨',
    title: 'How to Report an Issue',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.06)',
    border: 'rgba(239,68,68,0.3)',
    steps: [
      { icon: faExclamationCircle, text: 'Go to "Report Issue" from the sidebar. First, choose the issue category:' },
      { icon: faBuilding, text: '"Civic Issue" — for real-world problems: Garbage Dumping, Waterbody Pollution, Government/Civic failures, or Other.' },
      { icon: faLaptopCode, text: '"Platform Issue" — for app-related problems: Submission errors, Credit discrepancies, App bugs, or Account issues.' },
      { icon: faSearch, text: 'Select the specific sub-type, then write a detailed description (minimum 10 characters) including location and severity.' },
      { icon: faCamera, text: 'Attach a photo (max 5 MB) as evidence — a screenshot for platform issues or a real photo for civic ones.' },
      { icon: faPaperPlane, text: 'Submit. The report is stored in the database and forwarded to the CivicSetu admin panel where our team triages it. Civic reports are escalated to the relevant municipal authority.' },
    ]
  },
  {
    id: 'community',
    emoji: '👥',
    title: 'How to Use Communities',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.06)',
    border: 'rgba(139,92,246,0.3)',
    steps: [
      { icon: faUsers, text: 'Visit "Community" from the sidebar to discover local civic groups — resident welfare associations, NGO chapters, college eco-clubs, etc.' },
      { icon: faUserPlus, text: 'Join communities relevant to your ward, city, or interest area. Membership is free and instant.' },
      { icon: faNewspaper, text: 'Community boards show all shared activity submissions from members, making collective impact visible.' },
      { icon: faUpload, text: 'Tag a community when uploading an activity to attribute the cleanup to the group and boost the community\'s leaderboard rank.' },
      { icon: faAward, text: 'Community admins can organise drives and challenges. Top-performing communities get listed on the public Analytics leaderboard.' },
    ]
  },
  {
    id: 'analytics',
    emoji: '📊',
    title: 'How to Read Analytics',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.06)',
    border: 'rgba(99,102,241,0.3)',
    steps: [
      { icon: faChartLine, text: 'Open "Analytics" to see your personal civic impact dashboard with interactive charts.' },
      { icon: faLeaf, text: 'Key metrics displayed: Total CO₂ Saved (kg), Total Waste Collected (kg), Trees Planted, and Credits Earned over time.' },
      { icon: faStar, text: 'The Leaderboard widget on the Dashboard shows your rank among all CivicSetu users. Climb the ranks by submitting more verified activities.' },
      { icon: faChartLine, text: 'Time-series charts show your activity trend: weekly, monthly, or all-time. Spot your most productive periods.' },
      { icon: faAward, text: 'Your civic role badge (Eco Beginner → Eco Warrior → Eco Hero → Eco Champion 🏆) is calculated from your total credits and shown on your profile.' },
    ]
  },
];

const TECH_STACK = [
  { label: 'React 18 + Vite', color: '#61dafb', icon: faCode, desc: 'Frontend SPA with hot-reload dev server' },
  { label: 'Node.js + Express', color: '#68a063', icon: faServer, desc: 'RESTful API backend with JWT auth middleware' },
  { label: 'MongoDB + Mongoose', color: '#4db33d', icon: faDatabase, desc: 'NoSQL database for flexible civic data models' },
  { label: 'Firebase Auth', color: '#ff9800', icon: faLock, desc: 'Google OAuth & email authentication' },
  { label: 'Google Gemini AI', color: '#4285f4', icon: faBrain, desc: 'Vision AI for image verification & fraud detection' },
  { label: 'Framer Motion', color: '#bb66ff', icon: faRocket, desc: 'Fluid UI animations and page transitions' },
  { label: 'Cloudinary', color: '#3448c5', icon: faUpload, desc: 'Cloud image storage & optimisation' },
  { label: 'Tailwind CSS', color: '#38bdf8', icon: faStar, desc: 'Utility-first styling with custom design tokens' },
  { label: 'SparkMD5', color: '#e11d48', icon: faShieldAlt, desc: 'Client-side image hash for duplicate detection' },
  { label: 'Vercel', color: '#000000', icon: faGlobe, desc: 'Zero-config frontend deployment & CDN' },
];

const TEAM = [
  {
    name: 'Vivek K',
    role: 'Founder & Full-Stack Developer',
    avatar: '🧑‍💻',
    gradient: 'linear-gradient(135deg,#3b82f6,#6366f1)',
    bio: 'Designed and built the entire CivicSetu platform — from the React frontend and Node.js API to the Gemini AI integration and MongoDB data model. Passionate about civic-tech and sustainable India.',
    links: { github: '#', linkedin: '#', instagram: '#' },
  },
];

const FAQ = [
  {
    q: 'How does the AI know my cleanup is real?',
    a: 'Google Gemini Vision AI analyses the spatial and contextual differences between your Before and After photos. It looks for verifiable changes in waste volume, cleanliness, and environment consistency. Fake or AI-generated images are also detected and rejected. Additionally, a MD5 hash of each image is checked against our database to prevent duplicate submissions.'
  },
  {
    q: 'How are credits calculated?',
    a: 'Base credits are determined by the AI: typically 10–50 credits per kg of waste, scaled by cleanup type. Group activities earn a bonus: 10% extra per additional member. Large cleanups (>20 kg) with community/NGO tagging earn an extra multiplier. Credits are added to your wallet instantly on submission confirmation.'
  },
  {
    q: 'What happens after I redeem trees?',
    a: 'Your tree planting request is sent to a verified partner NGO via the Admin Portal. You can track the status in real-time through the 🌳 dropdown in the Header: Pending → Sent to NGO → Planting in Progress → Completed. Each status change triggers a notification.'
  },
  {
    q: 'Is my location data stored?',
    a: 'GPS co-ordinates are stored with each submission to render geo-tagged reports and maps. This data is used only for civic-purpose mapping and leaderboard locality features. We never sell or share location data with third parties.'
  },
  {
    q: 'Can I use the app offline?',
    a: 'Partially. You can draft a Before photo offline, which is stored in your browser\'s localStorage. However, AI verification and credit award require an active internet connection. The draft will remain safe until you reconnect.'
  },
  {
    q: 'What qualifies as a valid civic action?',
    a: 'Any verifiable environmental or sanitation activity: garbage pickup, waterbody cleaning, waste segregation, tree plantation, methane/pollution remediation, or community beautification. The AI must be able to identify a measurable positive change in the photo pair.'
  },
];

/* ──────────────────────────────────────────────
   Sub-Components
────────────────────────────────────────────── */
const SectionLabel = ({ color, children }) => (
  <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
    {children}
  </span>
);

const SectionTitle = ({ children }) => (
  <h2 className="text-3xl md:text-4xl font-black mt-2 mb-4" style={{ color: 'var(--text-primary)' }}>
    {children}
  </h2>
);

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        border: open ? '1.5px solid rgba(16,185,129,0.4)' : '1.5px solid var(--border-light)',
        background: 'var(--bg-surface)',
      }}
    >
      <button
        className="w-full flex items-center justify-between gap-4 p-5 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <span className="font-bold text-sm md:text-base" style={{ color: 'var(--text-primary)' }}>{q}</span>
        <FontAwesomeIcon
          icon={open ? faChevronUp : faChevronDown}
          className="flex-shrink-0 text-sm transition-transform"
          style={{ color: open ? '#10b981' : 'var(--text-secondary)' }}
        />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{a}</p>
        </div>
      )}
    </div>
  );
};

const fade = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' }
  })
};

/* ──────────────────────────────────────────────
   Main Component
────────────────────────────────────────────── */
const AboutUs = () => {
  const navigate = useNavigate();
  const [activeHow, setActiveHow] = useState('upload');

  const activeSection = HOW_TO_STEPS.find(s => s.id === activeHow);

  return (
    <motion.div className="space-y-20 pb-20" initial="hidden" animate="visible">

      {/* ── HERO ─────────────────────────────────── */}
      <motion.section
        variants={fade} custom={0}
        className="relative rounded-3xl overflow-hidden px-6 md:px-16 py-20 text-center"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a2f5a 50%, #063a2e 100%)', boxShadow: '0 30px 60px rgba(0,0,0,0.25)' }}
      >
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: '#3b82f6', transform: 'translate(-50%,-50%)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: '#10b981', transform: 'translate(50%,50%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6"
            style={{ background: 'rgba(16,185,129,0.2)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
            <FontAwesomeIcon icon={faLeaf} /> Built for Bharat 🇮🇳
          </span>

          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight" style={{ color: '#fff' }}>
            About{' '}
            <span style={{ color: '#60a5fa' }}>CIVIC</span>
            <span style={{ color: '#34d399' }}>सेतु</span>
          </h1>

          <p className="text-lg md:text-xl leading-relaxed mb-4 max-w-3xl mx-auto" style={{ color: '#94a3b8' }}>
            CivicSetu is India's first <strong style={{ color: '#e2e8f0' }}>AI-powered civic participation platform</strong> that
            rewards citizens for real, verified environmental actions — turning everyday cleanups into measurable impact,
            community trust, and tangible rewards.
          </p>
          <p className="text-base leading-relaxed mb-10 max-w-3xl mx-auto" style={{ color: '#64748b' }}>
            The name <em style={{ color: '#94a3b8' }}>CivicSetu</em> (सेतु = Bridge in Hindi) represents our mission:
            to build a bridge between motivated Indian citizens and the civic systems, NGOs, and local governments
            that need their participation to function.
          </p>

          <p className="text-sm font-bold tracking-widest mb-10" style={{ color: '#34d399' }}>
            स्वच्छ भारत अपना भारत
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => navigate('/upload')}
              className="flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-white transition-all hover:scale-105 shadow-lg"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
              Start Contributing <FontAwesomeIcon icon={faArrowRight} />
            </button>
            <button onClick={() => navigate('/community')}
              className="flex items-center gap-2 px-7 py-3 rounded-xl font-bold transition-all hover:scale-105"
              style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)' }}>
              Join Community <FontAwesomeIcon icon={faUsers} />
            </button>
          </div>
        </div>
      </motion.section>

      {/* ── STATS ────────────────────────────────── */}
      <motion.section variants={fade} custom={1}>
        <div className="text-center mb-10">
          <SectionLabel color="#10b981">Impact in Numbers</SectionLabel>
          <SectionTitle>CivicSetu by the Numbers</SectionTitle>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {STATS.map((s, i) => (
            <motion.div key={s.label} variants={fade} custom={i * 0.1}
              className="card p-5 text-center rounded-2xl" style={{ border: `1.5px solid ${s.color}22` }}>
              <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: `${s.color}18`, color: s.color }}>
                <FontAwesomeIcon icon={s.icon} />
              </div>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── PROJECT DESCRIPTION ──────────────────── */}
      <motion.section variants={fade} custom={2} className="grid md:grid-cols-2 gap-12 items-start">
        <div>
          <SectionLabel color="#3b82f6">The Problem We Solve</SectionLabel>
          <SectionTitle>Why CivicSetu Exists</SectionTitle>
          <div className="space-y-4" style={{ color: 'var(--text-secondary)' }}>
            <p>India generates <strong style={{ color: 'var(--text-primary)' }}>62 million tonnes of municipal solid waste per year</strong> — yet less than 60% is collected and only 15% processed. Littering, open dumping, and waterbody pollution are national crises that local governments alone cannot solve.</p>
            <p>The missing element is <strong style={{ color: 'var(--text-primary)' }}>citizen participation at scale</strong>. Millions of Indians are willing to act, but have no incentive, no verification mechanism, and no way to prove their contribution.</p>
            <p>CivicSetu solves this by creating a <strong style={{ color: 'var(--text-primary)' }}>trust layer</strong> between citizens and civic systems. Using AI image verification, blockchain-grade credit accounting, and NGO partnerships, we make every civic action auditable, rewarded, and impactful.</p>
            <p>We are aligned with Government of India initiatives: <strong style={{ color: 'var(--text-primary)' }}>Swachh Bharat Mission</strong>, <strong style={{ color: 'var(--text-primary)' }}>MoHUA urban planning</strong>, and <strong style={{ color: 'var(--text-primary)' }}>NGO Darpan partnerships</strong>.</p>
          </div>
        </div>

        <div className="space-y-4">
          <SectionLabel color="#10b981">The Solution</SectionLabel>
          <SectionTitle>How CivicSetu Works</SectionTitle>
          {[
            { icon: faBrain, color: '#6366f1', t: 'AI-Verified Impact', d: 'Every upload is analysed by Google Gemini Vision AI — eliminating fake submissions and calculating precise environmental metrics.' },
            { icon: faCoins, color: '#f59e0b', t: 'Gamified Credit Economy', d: 'Verifiable credits incentivise repeat participation. Group bonuses and multipliers encourage community-scale cleanup drives.' },
            { icon: faHandHoldingHeart, color: '#ec4899', t: 'NGO Bridge', d: 'credits can be converted to real tree-planting actions via verified NGO partners. We track the full lifecycle: request → planting → completion.' },
            { icon: faExclamationCircle, color: '#ef4444', t: 'Municipal Reporting', d: 'Large-scale civic issues are reported directly to the admin portal and escalated to local authorities with photo evidence.' },
            { icon: faNetworkWired, color: '#10b981', t: 'Community Ecosystem', d: 'Hyperlocal communities connect neighbours, resident groups, and eco-clubs for organised drives and shared recognition.' },
          ].map(item => (
            <div key={item.t} className="flex items-start gap-4 p-4 rounded-2xl"
              style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.color}18`, color: item.color }}>
                <FontAwesomeIcon icon={item.icon} />
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{item.t}</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{item.d}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── FULL WORKFLOW ─────────────────────────── */}
      <motion.section variants={fade} custom={3}>
        <div className="text-center mb-12">
          <SectionLabel color="#6366f1">End-to-End Platform Workflow</SectionLabel>
          <SectionTitle>The Complete CivicSetu Journey</SectionTitle>
          <p className="max-w-2xl mx-auto text-sm" style={{ color: 'var(--text-secondary)' }}>
            From account creation to impact redemption — here is every step of the CivicSetu experience in detail.
          </p>
        </div>

        <div className="relative">
          {/* Vertical connector */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 hidden md:block"
            style={{ background: 'linear-gradient(to bottom, #3b82f6, #10b981, #6366f1, #f59e0b, #10b981, #f59e0b, #3b82f6, #8b5cf6)' }} />

          <div className="space-y-6">
            {WORKFLOW_STEPS.map((step, i) => (
              <motion.div key={step.num} variants={fade} custom={i * 0.1}
                className="flex gap-6 items-start">
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg z-10 relative"
                    style={{ background: `linear-gradient(135deg, ${step.color}cc, ${step.color})`, color: '#fff' }}>
                    <FontAwesomeIcon icon={step.icon} size="lg" />
                  </div>
                  <span className="absolute -top-2 -right-2 text-xs font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: step.color, color: '#fff' }}>{step.num}</span>
                </div>
                <div className="card p-6 rounded-2xl flex-1" style={{ border: `1px solid ${step.color}22` }}>
                  <h3 className="font-black text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── HOW TO USE ────────────────────────────── */}
      <motion.section variants={fade} custom={4}>
        <div className="text-center mb-10">
          <SectionLabel color="#ec4899">Step-by-Step Guides</SectionLabel>
          <SectionTitle>How to Use CivicSetu</SectionTitle>
          <p className="max-w-xl mx-auto text-sm" style={{ color: 'var(--text-secondary)' }}>
            Detailed walkthroughs for every feature — so you can get the most out of every civic action.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {HOW_TO_STEPS.map(s => (
            <button key={s.id} onClick={() => setActiveHow(s.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all"
              style={{
                background: activeHow === s.id ? s.color : 'var(--bg-surface)',
                color: activeHow === s.id ? '#fff' : 'var(--text-secondary)',
                border: `2px solid ${activeHow === s.id ? s.color : 'var(--border-light)'}`,
                transform: activeHow === s.id ? 'scale(1.05)' : 'scale(1)',
                boxShadow: activeHow === s.id ? `0 4px 16px ${s.color}44` : 'none',
              }}>
              <span>{s.emoji}</span> {s.title.replace('How to ', '').replace('How to Use ', '').replace('How to Read ', '')}
            </button>
          ))}
        </div>

        {/* Active Section */}
        {activeSection && (
          <motion.div key={activeHow} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
            className="rounded-3xl p-8 md:p-10"
            style={{ background: activeSection.bg, border: `2px solid ${activeSection.border}` }}>
            <div className="flex items-center gap-4 mb-8">
              <span className="text-5xl">{activeSection.emoji}</span>
              <div>
                <h3 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{activeSection.title}</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Follow these steps to {activeSection.title.replace('How to ', '').toLowerCase()}.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {activeSection.steps.map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white shadow-sm"
                  style={{ border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-black text-xs shadow"
                    style={{ background: activeSection.color }}>
                    {i + 1}
                  </div>
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: `${activeSection.color}15`, color: activeSection.color }}>
                      <FontAwesomeIcon icon={step.icon} className="text-xs" />
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>{step.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.section>

      {/* ── TECH STACK ────────────────────────────── */}
      <motion.section variants={fade} custom={5}>
        <div className="text-center mb-10">
          <SectionLabel color="#6366f1">Technology Stack</SectionLabel>
          <SectionTitle>Built With These Technologies</SectionTitle>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {TECH_STACK.map((tech, i) => (
            <motion.div key={tech.label} variants={fade} custom={i * 0.07}
              className="card p-4 rounded-2xl text-center hover:scale-105 transition-transform cursor-default"
              style={{ border: `1.5px solid ${tech.color}30` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: `${tech.color}18`, color: tech.color === '#000000' ? '#1a1a1a' : tech.color }}>
                <FontAwesomeIcon icon={tech.icon} />
              </div>
              <p className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{tech.label}</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)' }}>{tech.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── ARCHITECTURE ─────────────────────────── */}
      <motion.section variants={fade} custom={6}>
        <div className="text-center mb-10">
          <SectionLabel color="#f59e0b">System Architecture</SectionLabel>
          <SectionTitle>How the Platform is Built</SectionTitle>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: '🖥️ Frontend (React + Vite)',
              color: '#3b82f6',
              points: [
                'Single Page Application with React Router v6',
                'Framer Motion for page transitions & micro-animations',
                'Context API for Language (8 langs) and Theme state',
                'Camera API + Geolocation API for field capture',
                'SparkMD5 for client-side image hashing',
                'Axios interceptors with JWT Bearer auth headers',
                'Deployed on Vercel with automatic CI/CD',
              ]
            },
            {
              title: '⚙️ Backend (Node.js + Express)',
              color: '#10b981',
              points: [
                'RESTful API with JWT middleware on all protected routes',
                'Firebase Admin SDK verifies Google OAuth tokens',
                'Multer + Cloudinary for multipart image uploads',
                'Google Gemini 1.5 Vision API integration',
                'Mongoose ODM with MongoDB Atlas (cloud)',
                'MD5 duplicate detection before AI analysis',
                'Admin-only routes for NGO and submission management',
              ]
            },
            {
              title: '🌐 Data & Integrations',
              color: '#8b5cf6',
              points: [
                'MongoDB Atlas for all user, submission, and credit data',
                'Firebase Authentication (email + Google OAuth)',
                'Cloudinary for image CDN and transformations',
                'Google Gemini AI Vision for photo verification',
                'Reverse Geocoding for human-readable location names',
                'NGO Partner APIs via Admin Portal webhooks',
                'localStorage for offline draft caching',
              ]
            },
          ].map(col => (
            <div key={col.title} className="card p-6 rounded-2xl" style={{ border: `1.5px solid ${col.color}22` }}>
              <h3 className="font-black text-lg mb-4" style={{ color: 'var(--text-primary)' }}>{col.title}</h3>
              <ul className="space-y-2">
                {col.points.map(p => (
                  <li key={p} className="flex items-start gap-2 text-sm">
                    <span className="flex-shrink-0 mt-1 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: `${col.color}18`, color: col.color }}>
                      <FontAwesomeIcon icon={faCheckCircle} className="text-[8px]" />
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.section>

      {/* ── TEAM ─────────────────────────────────── */}
      <motion.section variants={fade} custom={7}>
        <div className="text-center mb-10">
          <SectionLabel color="#ec4899">The Team</SectionLabel>
          <SectionTitle>Built with ❤️ for Bharat</SectionTitle>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          {TEAM.map((m, i) => (
            <motion.div key={m.name} variants={fade} custom={i * 0.15}
              className="card p-8 rounded-3xl text-center max-w-sm">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 text-5xl shadow-xl"
                style={{ background: m.gradient }}>
                {m.avatar}
              </div>
              <h3 className="font-black text-xl mb-1" style={{ color: 'var(--text-primary)' }}>{m.name}</h3>
              <p className="text-xs font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{m.role}</p>
              <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>{m.bio}</p>
              <div className="flex justify-center gap-3">
                <a href={m.links.github} className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: '#f1f5f9', color: '#374151' }}>
                  <FontAwesomeIcon icon={faGithub} />
                </a>
                <a href={m.links.linkedin} className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: '#dbeafe', color: '#2563eb' }}>
                  <FontAwesomeIcon icon={faLinkedin} />
                </a>
                <a href={m.links.instagram} className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: '#fce7f3', color: '#db2777' }}>
                  <FontAwesomeIcon icon={faInstagram} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── FAQ ──────────────────────────────────── */}
      <motion.section variants={fade} custom={8}>
        <div className="text-center mb-10">
          <SectionLabel color="#3b82f6">Frequently Asked Questions</SectionLabel>
          <SectionTitle>Got Questions?</SectionTitle>
        </div>
        <div className="max-w-3xl mx-auto space-y-3">
          {FAQ.map(item => <FaqItem key={item.q} {...item} />)}
        </div>
      </motion.section>

      {/* ── CTA ──────────────────────────────────── */}
      <motion.section variants={fade} custom={9}>
        <div className="rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl"
            style={{ background: '#3b82f6', transform: 'translate(-50%,-50%)' }} />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl"
            style={{ background: '#10b981', transform: 'translate(50%,50%)' }} />
          <div className="relative z-10">
            <p className="text-6xl mb-5">🌱</p>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Ready to Build a Cleaner Bharat?
            </h2>
            <p className="mb-10 max-w-lg mx-auto text-base" style={{ color: '#94a3b8' }}>
              Join thousands of citizens already making verified, rewarded civic impact —
              one cleanup at a time. Every action counts. Every credit matters.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => navigate('/register')}
                className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-base transition-all hover:scale-105 shadow-xl"
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                Get Started Free <FontAwesomeIcon icon={faArrowRight} />
              </button>
              <button onClick={() => navigate('/report-issue')}
                className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105"
                style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.08)' }}>
                Report an Issue <FontAwesomeIcon icon={faExclamationCircle} />
              </button>
              <a href="mailto:civicsetu@example.com"
                className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all hover:scale-105"
                style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.08)' }}>
                Contact Us <FontAwesomeIcon icon={faEnvelope} />
              </a>
            </div>
          </div>
        </div>
      </motion.section>

    </motion.div>
  );
};

export default AboutUs;
