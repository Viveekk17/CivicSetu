const fs = require('fs');
const path = require('path');

const filePath = 'src/controllers/adminController.js';
let content = fs.readFileSync(filePath, 'utf8');

// Find the problematic section around line 181
// We know line 130 starts: if (status === 'verified') {
// We need to find where the members tagging block ends and close the verified block.

const searchString = `            }\r\n        }\r\n    \r\n    // ── SEND STATUS UPDATE EMAIL (ASYNC) ──`;
const searchStringUnix = `            }\n        }\n    \n    // ── SEND STATUS UPDATE EMAIL (ASYNC) ──`;

const replacement = `            }
        }
    } else {
        // Rejected — no credits
        submission.creditsAwarded = 0;
        await submission.save();
    }
    
    // ── SEND STATUS UPDATE EMAIL (ASYNC) ──`;

if (content.includes(searchString)) {
    console.log('Found Windows-style block');
    content = content.replace(searchString, replacement);
} else if (content.includes(searchStringUnix)) {
    console.log('Found Unix-style block');
    content = content.replace(searchStringUnix, replacement);
} else {
    // Try a more flexible regex
    console.log('Using flexible search');
    const regex = /if\s*\(taggingMode\s*===\s*'members'\s*&&\s*taggedUsers\.length\s*>\s*0\)\s*\{[\s\S]*?\}\s*\}\s*\}\s*\n\s+\/\/\s*──\s*SEND\s*STATUS\s*UPDATE\s*EMAIL/;
    // Actually, let's just find the specific lines we saw in view_file
    // line 181:         }
    // line 182:     
    // line 183:     // ── SEND STATUS UPDATE EMAIL (ASYNC) ──
    
    // Line 181 closes exports.updateSubmissionStatus? No, it should close the if(status==='verified') at 131.
    // Wait, let's look at the view_file again.
    /*
    179:                 }
    180:             }
    181:         }
    182:     
    183:     // ── SEND STATUS UPDATE EMAIL (ASYNC) ──
    */
    // 179 closes if(taggedUser)
    // 180 closes for(const userId of taggedUsers)
    // 181 closes if(taggingMode==='members'...)
    
    // So after 181, we need to close the if(user) [136] AND if(status==='verified') [130].
    
    // THE BUG: I have 2 braces at 181, but I need 3 to close everything.
    // Then I need the 'else' block.

    content = content.replace(
        /}\s*}\s*}\s+\/\/\s*──\s*SEND\s*STATUS\s*UPDATE\s*EMAIL/,
        `        }
    } else {
        // Rejected — no credits
        submission.creditsAwarded = 0;
        await submission.save();
    }
    
    // ── SEND STATUS UPDATE EMAIL`
    );
}

fs.writeFileSync(filePath, content);
console.log('File updated successfully');
