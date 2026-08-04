/**
 * One-off script: creates a signup code in Firestore directly via Admin SDK.
 * Run from: e:\ConceptsToClinics\functions
 * Command: npx ts-node --skip-project src/scripts/createCode.ts
 */
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Init Admin SDK (same as the functions config)
const serviceAccount = require('../../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function createSignupCode() {
  const code = 'TEST-0001';
  const grantsCourses = ['6WG2BwAkqLYsBappE3DS']; // Biology 101

  const doc: any = {
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: null,
    usedBy: null,
    usedAt: null,
    isActive: true,
    grantsCourses,
  };

  await db.collection('signupCodes').doc(code).set(doc);
  console.log(`✅ Signup code created: ${code}`);
  console.log(`   Grants courses: ${grantsCourses.join(', ')}`);
  process.exit(0);
}

createSignupCode().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
