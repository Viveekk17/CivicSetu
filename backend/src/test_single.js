const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { extractMetadata, checkAIGenerated } = require('./utils/metadataService');

// Change this to the single image you want to test
const testImage = path.resolve(__dirname, '../../public/after.jpg');

async function runSingleTest() {
  try {
    console.log('🔍 --- Starting Single File Forensic Analysis ---');
    console.log(`📸 Image: ${testImage}`);

    // 1. Extract Metadata
    console.log('\n📡 Extracting Metadata...');
    const metadata = await extractMetadata(testImage);
    
    // 2. Clear out the big keys just for a clean console log
    const keys = Object.keys(metadata).length;
    console.log(`✅ Successfully extracted ${keys} metadata tags.`);

    // 3. Analyze with Gemini
    console.log('\n🤖 Sending to Gemini for AI Detection...');
    const analysis = await checkAIGenerated(metadata);

    console.log('\n✅ --- FORENSIC ANALYSIS RESULT ---');
    console.log(JSON.stringify(analysis, null, 2));

    if (analysis.isAIGenerated) {
      console.log('\n⚠️  WARNING: This image shows signs of being AI-generated.');
    } else {
      console.log('\n✨ This image appears to be a legitimate photograph or graphic.');
    }

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Analysis failed:', err.message);
    process.exit(1);
  }
}

runSingleTest();
