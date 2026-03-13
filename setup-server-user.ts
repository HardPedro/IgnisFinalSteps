import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function setupServerUser() {
  try {
    const cred = await createUserWithEmailAndPassword(auth, 'server@oficinapro.com', 'ServerSecret123!');
    console.log('Created server user:', cred.user.uid);
    
    await setDoc(doc(db, 'users', cred.user.uid), {
      email: 'server@oficinapro.com',
      role: 'SuperAdmin',
      name: 'System Server',
      tenantId: 'system'
    });
    console.log('Saved server user to Firestore');
    process.exit(0);
  } catch (e: any) {
    if (e.code === 'auth/email-already-in-use') {
      console.log('Server user already exists');
      process.exit(0);
    }
    console.error(e);
    process.exit(1);
  }
}

setupServerUser();
