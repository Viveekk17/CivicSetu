const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { verifySubmission } = require('./utils/aiVerification');

// Using the two test images you added to public/
const beforeImage = path.resolve(__dirname, '../../public/before.jpg');
const afterImage = path.resolve(__dirname, '../../public/after.jpg');

async function runFullTest() {
  try {
    console.log('🚀 --- Starting Full Native AI Verification Test ---');
    console.log(`📸 Before: ${beforeImage}`);
    console.log(`📸 After:  ${afterImage}`);

    // Call the newly migrated verifySubmission
    const result = await verifySubmission('garbage', [beforeImage, afterImage], 5);

    console.log('\n✅ --- VERIFICATION RESULT ---');
    console.log(JSON.stringify(result, null, 2));

    if (result.isFraud) {
      console.log('\n⚠️ FRAUD DETECTED during test.');
    } else if (result.verified) {
      console.log('\n🏆 CLEANUP VERIFIED!');
      console.log(`💰 Suggested Credits: ${result.credits}`);
    } else {
      console.log('\n❌ CLEANUP REJECTED');
    }

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test failed with error:', err.message);
    process.exit(1);
  }
}

runFullTest();
