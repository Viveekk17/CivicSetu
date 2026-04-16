"""
Bulk color replacement script for CivicSetu theme migration.
Maps old green/blue/generic-purple colors to the new 5-color palette.
"""
import os, re

# Color mapping: old_color (lowercase) -> new_color
COLOR_MAP = {
    # === Primary Greens → Deep Royal Blue / Muted Purple ===
    '#10b981': '#998fc7',
    '#059669': '#14248a',
    '#34d399': '#d4c2fc',
    '#d1fae5': '#ebe3ff',
    '#065f46': '#14248a',
    
    # === Blues → Deep Royal Blue ===
    '#3b82f6': '#14248a',
    '#2563eb': '#0e1a66',
    '#60a5fa': '#998fc7',
    '#93c5fd': '#d4c2fc',
    '#dbeafe': '#f9f5ff',
    
    # === Old Purples → New palette purples ===
    '#8b5cf6': '#998fc7',
    '#7c3aed': '#14248a',
    '#a78bfa': '#d4c2fc',
    '#c4b5fd': '#ebe3ff',
    
    # === Google Blue (dark theme old) ===
    '#4285f4': '#998fc7',
    '#1967d2': '#14248a',
    '#669df6': '#d4c2fc',
    '#d2e3fc': '#f9f5ff',
    
    # === Dark backgrounds ===
    '#0f172a': '#28262c',
    '#1e293b': '#332f38',
    '#334155': '#3e3a44',
    '#475569': '#4e4a55',
    '#64748b': '#8a8590',
    
    # === Light text/borders ===
    '#111827': '#28262c',
    '#6b7280': '#5a5760',
    '#9ca3af': '#8a8590',
    '#e5e7eb': '#ebe3ff',
    '#d1d5db': '#d4c2fc',
    '#e2e8f0': '#d4c2fc',
    '#94a3b8': '#998fc7',
    '#f9fafb': '#f9f5ff',

    # === Emerald shades ===
    '#047857': '#14248a',
    '#6ee7b7': '#d4c2fc',
    '#a7f3d0': '#ebe3ff',
    '#ecfdf5': '#f9f5ff',
}

# RGBA mapping: maps (r, g, b) to new (r, g, b)
RGBA_MAP = {
    (16, 185, 129): (153, 143, 199),    # #10B981 -> #998fc7
    (5, 150, 105): (20, 36, 138),       # #059669 -> #14248a
    (52, 211, 153): (212, 194, 252),     # #34D399 -> #d4c2fc
    (59, 130, 246): (20, 36, 138),       # #3B82F6 -> #14248a
    (37, 99, 235): (14, 26, 102),        # #2563EB -> #0e1a66
    (96, 165, 250): (153, 143, 199),     # #60A5FA -> #998fc7
    (139, 92, 246): (153, 143, 199),     # #8B5CF6 -> #998fc7
    (124, 58, 237): (20, 36, 138),       # #7C3AED -> #14248a
    (167, 139, 250): (212, 194, 252),    # #A78BFA -> #d4c2fc
    (66, 133, 244): (153, 143, 199),     # #4285F4 -> #998fc7
    (25, 103, 210): (20, 36, 138),       # #1967D2 -> #14248a
    (30, 41, 59): (40, 38, 44),          # #1E293B -> #332f38
    (15, 23, 42): (40, 38, 44),          # #0F172A -> #28262c
    (209, 250, 229): (235, 227, 255),    # #D1FAE5 -> #ebe3ff
}

# Gradient string replacements (common inline patterns)
GRADIENT_MAP = {
    "linear-gradient(135deg,#10b981,#059669)": "linear-gradient(135deg,#14248a,#998fc7)",
    "linear-gradient(135deg, #10b981 0%, #059669 100%)": "linear-gradient(135deg, #14248a 0%, #998fc7 100%)",
    "linear-gradient(135deg, #10b981, #059669)": "linear-gradient(135deg, #14248a, #998fc7)",
    "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)": "linear-gradient(135deg, #998fc7 0%, #14248a 100%)",
    "linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)": "linear-gradient(135deg, #14248a 0%, #d4c2fc 100%)",
    "linear-gradient(135deg, #4285f4 0%, #1967d2 100%)": "linear-gradient(135deg, #998fc7 0%, #14248a 100%)",
    "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)": "linear-gradient(135deg, #d4c2fc 0%, #998fc7 100%)",
    "linear-gradient(135deg, #4285f4 0%, #a78bfa 100%)": "linear-gradient(135deg, #998fc7 0%, #d4c2fc 100%)",
}

SRC_DIR = os.path.dirname(os.path.abspath(__file__))
EXTENSIONS = {'.jsx', '.js', '.css'}
SKIP = {'node_modules', '_recolor.py', '.git'}

def should_process(filepath):
    _, ext = os.path.splitext(filepath)
    return ext in EXTENSIONS

def replace_hex_colors(content):
    """Replace hex colors (case-insensitive) while preserving original casing style."""
    def hex_replacer(match):
        original = match.group(0)
        lower = original.lower()
        replacement = COLOR_MAP.get(lower)
        if replacement:
            return replacement
        return original
    # Match 6-digit hex colors
    return re.sub(r'#[0-9a-fA-F]{6}\b', hex_replacer, content)

def replace_rgba_colors(content):
    """Replace rgba(r, g, b, a) patterns."""
    def rgba_replacer(match):
        r, g, b = int(match.group(1)), int(match.group(2)), int(match.group(3))
        rest = match.group(4)  # the alpha part
        key = (r, g, b)
        if key in RGBA_MAP:
            nr, ng, nb = RGBA_MAP[key]
            return f'rgba({nr}, {ng}, {nb}, {rest})'
        return match.group(0)
    return re.sub(r'rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([^)]+)\)', rgba_replacer, content)

def replace_gradients(content):
    """Replace common gradient strings (case-insensitive)."""
    lower_content = content.lower()
    for old_grad, new_grad in GRADIENT_MAP.items():
        old_lower = old_grad.lower()
        idx = 0
        while True:
            pos = lower_content.find(old_lower, idx)
            if pos == -1:
                break
            content = content[:pos] + new_grad + content[pos + len(old_lower):]
            lower_content = content.lower()
            idx = pos + len(new_grad)
    return content

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()
    
    content = original
    content = replace_gradients(content)
    content = replace_hex_colors(content)
    content = replace_rgba_colors(content)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    changed_files = []
    for root, dirs, files in os.walk(SRC_DIR):
        dirs[:] = [d for d in dirs if d not in SKIP]
        for fname in files:
            if fname in SKIP:
                continue
            fpath = os.path.join(root, fname)
            if should_process(fpath):
                if process_file(fpath):
                    rel = os.path.relpath(fpath, SRC_DIR)
                    changed_files.append(rel)
    
    print(f"\n[OK] Theme migration complete! {len(changed_files)} files updated:\n")
    for f in sorted(changed_files):
        print(f"  - {f}")

if __name__ == '__main__':
    main()
