import admin from 'firebase-admin';

try {
  admin.initializeApp({
    projectId: 'gen-lang-client-0133027173'
  });
  console.log('Firebase Admin initialized successfully');
  
  const db = admin.firestore();
  db.settings({ databaseId: 'ai-studio-4d0f7f7d-978f-4968-9792-889141864d6b' });
  
  db.collection('test').doc('test').set({ test: true }).then(() => {
    console.log('Firestore write success');
  }).catch(e => {
    console.error('Firestore write failed', e);
  });
} catch (e) {
  console.error('Failed to initialize Firebase Admin', e);
}
