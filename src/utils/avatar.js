// Resolve a usable avatar URL for any user.
//
// Order of preference:
//   1. The user's stored `profilePicture` (Google/Gmail picture or uploaded image)
//   2. A deterministic Bitmoji-style avatar generated from a stable seed
//      (DiceBear "personas" — friendly cartoon people, no signup, free CDN)
//
// `/uploads/default-avatar.png` is treated as "no real picture" and falls
// through to the generated avatar so every account looks distinct.

const DICEBEAR_STYLE = 'personas';
const DICEBEAR_BASE  = `https://api.dicebear.com/9.x/${DICEBEAR_STYLE}/svg`;

const isUsableProfilePicture = (url) => {
    if (!url || typeof url !== 'string') return false;
    const lower = url.toLowerCase();
    if (lower.includes('default-avatar')) return false;
    if (lower.endsWith('/null') || lower.endsWith('/undefined')) return false;
    return true;
};

// Google profile URLs (lh3.googleusercontent.com) often come with a "=s96-c"
// suffix that limits resolution. Bumping it to s256 yields a sharper image
// without changing anything else about the URL contract.
const upscaleGoogleAvatar = (url) => {
    if (!url.includes('googleusercontent.com')) return url;
    return url.replace(/=s\d+(-c)?$/i, '=s256-c');
};

export const isGoogleAvatar = (url) =>
    typeof url === 'string' && url.includes('googleusercontent.com');

const seedFor = (user) => {
    if (!user) return 'guest';
    return (
        user._id ||
        user.id ||
        user.email ||
        user.username ||
        user.name ||
        'guest'
    ).toString();
};

export const generatedAvatar = (seed) =>
    `${DICEBEAR_BASE}?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear&backgroundColor=ebe3ff,d4c2fc,f9f5ff`;

export const avatarUrlFor = (user) => {
    if (isUsableProfilePicture(user?.profilePicture)) {
        return upscaleGoogleAvatar(user.profilePicture);
    }
    return generatedAvatar(seedFor(user));
};

// Stable fallback when an external avatar URL fails to load.
export const fallbackAvatarFor = (user) => generatedAvatar(seedFor(user));
