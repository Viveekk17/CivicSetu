"""
Pass-2 cleanup: remove remaining gradient inline styles and emoji characters
from JSX/JS source files across the entire src directory.
"""
import os, re

SRC_DIR = os.path.dirname(os.path.abspath(__file__))
EXTENSIONS = {'.jsx', '.js', '.css'}
SKIP_FILES = {'_recolor.py', '_cleanup.py'}
SKIP_DIRS  = {'node_modules', '.git', '__pycache__'}

# --- Gradient replacers ---
# Replace 'background: var(--gradient-*)' inline style with flat color
GRADIENT_VAR_MAP = {
    'var(--gradient-primary)':   '#14248a',
    'var(--gradient-secondary)': '#998fc7',
    'var(--gradient-accent)':    '#14248a',
    'var(--gradient-warm)':      '#998fc7',
}

# Replace literal gradient strings still found in JSX
LITERAL_GRAD_RE = re.compile(
    r"linear-gradient\([^'\")\n]+\)",
    re.IGNORECASE
)

# Emoji unicode ranges to strip or replace with space
EMOJI_RE = re.compile(
    "["
    "\U0001F300-\U0001F9FF"   # Misc symbols and pictographs
    "\U00002702-\U000027B0"
    "\U0001FA00-\U0001FA6F"
    "\U00002500-\U00002BEF"
    "\U0001F004-\U0001F0CF"
    "\U0001F170-\U0001F251"
    "\u2603-\u26FF"
    "\u2702-\u27BF"
    "\U0001F1E0-\U0001F1FF"   # flags
    "\u24C2-\u2A00"
    "]+",
    flags=re.UNICODE
)

# Replace flag shortcodes or literal en/hi text left over
def remove_emojis(text):
    return EMOJI_RE.sub('', text)

def replace_gradient_vars(text):
    for var, flat in GRADIENT_VAR_MAP.items():
        # background: 'var(--gradient-*)' -> background: '<flat>'
        text = text.replace(f"'background': '{var}'", f"'background': '{flat}'")
        text = text.replace(f'"background": "{var}"', f'"background": "{flat}"')
        # style={{ background: 'var(--gradient-primary)' }}
        text = text.replace(f"background: '{var}'", f"background: '{flat}'")
        text = text.replace(f'background: "{var}"', f'background: "{flat}"')
        # background={var}
        text = text.replace(f'background={{{var}}}', f'background="{flat}"')
    return text

def replace_literal_gradients(text):
    """Replace any remaining linear-gradient( ) with the primary flat color."""
    def replacer(m):
        s = m.group(0)
        # Keep Indian flag gradient intentionally (tricolor)
        if 'FF9933' in s or 'ff9933' in s or '138808' in s:
            return s
        return '#14248a'
    return LITERAL_GRAD_RE.sub(replacer, text)

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        original = f.read()
    content = original
    content = replace_gradient_vars(content)
    content = replace_literal_gradients(content)
    content = remove_emojis(content)
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    changed = []
    for root, dirs, files in os.walk(SRC_DIR):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for fname in files:
            if fname in SKIP_FILES:
                continue
            _, ext = os.path.splitext(fname)
            if ext not in EXTENSIONS:
                continue
            fp = os.path.join(root, fname)
            if process_file(fp):
                changed.append(os.path.relpath(fp, SRC_DIR))
    print(f"\n[OK] Pass-2 cleanup complete. {len(changed)} files updated:")
    for f in sorted(changed):
        print(f"  - {f}")

if __name__ == '__main__':
    main()
