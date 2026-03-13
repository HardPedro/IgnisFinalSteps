import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function createSecret() {
  try {
    await setDoc(doc(db, 'server_secrets', 'backend_key'), {
      secret: 'oficina-pro-super-secret-backend-key-2026'
    });
    console.log('Secret created successfully');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

createSecret();
