import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { createServer as createViteServer } from 'vite';
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Load Firebase Config
let firebaseConfig: any = {};
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.error('Failed to load firebase config', e);
}

// Initialize Firebase Admin
let adminDb: admin.firestore.Firestore | null = null;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    admin.initializeApp({
      projectId: firebaseConfig.projectId
    });
  }
  adminDb = admin.firestore();
  console.log('Firebase Admin initialized successfully.');
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Stripe Webhook needs raw body
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json());

// In-memory logs
const webhookLogs: any[] = [];
const apiLogs: any[] = [];

// Middleware to verify Firebase ID Token
const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    if (!adminDb) throw new Error('Firebase Admin not initialized');
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get user data from Firestore to get tenantId
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists) return res.status(401).json({ error: 'User not found' });
    
    (req as any).user = { uid: decodedToken.uid, tenantId: userDoc.data()?.tenantId };
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Config endpoint
app.get('/api/config', authenticate, (req, res) => {
  res.json({ geminiApiKey: process.env.GEMINI_API_KEY });
});

// Logs endpoints
app.get('/api/webhook-logs', authenticate, (req, res) => {
  res.json(webhookLogs);
});

app.get('/api/api-logs', authenticate, (req, res) => {
  res.json(apiLogs);
});

// Stripe setup
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' as any,
}) : null;

app.post('/api/billing/checkout', authenticate, async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
  try {
    const { priceId } = req.body;
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/settings`,
      client_reference_id: (req as any).user.tenantId,
    });
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.post('/api/billing/portal', authenticate, async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
  try {
    const tenantId = (req as any).user.tenantId;
    if (!adminDb) return res.status(500).json({ error: 'Firebase Admin not initialized' });
    
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    const customerId = tenantDoc.data()?.stripe_customer_id;
    
    if (!customerId) return res.status(400).json({ error: 'No active subscription' });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.origin}/settings`,
    });
    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

app.post('/api/webhooks/stripe', async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET || !adminDb) {
    return res.status(500).send('Stripe or Firebase not configured');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const tenantId = session.client_reference_id;
      if (tenantId) {
        await adminDb.collection('tenants').doc(tenantId).update({
          stripe_customer_id: session.customer,
          subscription_status: 'active',
          subscription_plan: 'pro'
        });
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as any;
      const tenantsSnapshot = await adminDb.collection('tenants').where('stripe_customer_id', '==', subscription.customer).get();
      if (!tenantsSnapshot.empty) {
        await tenantsSnapshot.docs[0].ref.update({
          subscription_status: 'canceled',
          subscription_plan: 'free'
        });
      }
    }
    res.json({ received: true });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Z-API Webhook
app.post('/webhooks/zapi', async (req, res) => {
  const payload = req.body;
  
  if (webhookLogs.length >= 100) webhookLogs.shift();
  webhookLogs.push({
    timestamp: new Date().toISOString(),
    event: payload.isStatus ? 'message_status' : 'message_received',
    payload
  });

  if (process.env.WHATSAPP_VERIFY_TOKEN) {
    const token = req.query.token || req.headers['x-verify-token'];
    if (token !== process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(401).send('Unauthorized');
    }
  }

  if (!adminDb) {
    console.error('Firebase Admin not initialized');
    return res.status(500).send('Firebase not configured');
  }

  try {
    const instanceId = payload.instanceId;
    if (!instanceId) return res.status(200).send('OK');

    // Find the tenant for this instanceId
    const numbersSnapshot = await adminDb.collectionGroup('whatsapp_numbers').where('id', '==', instanceId).get();
    if (numbersSnapshot.empty) return res.status(200).send('OK');
    
    const numberDoc = numbersSnapshot.docs[0];
    const tenantId = numberDoc.ref.parent.parent?.id;
    if (!tenantId) return res.status(200).send('OK');

    if (payload.isStatus) {
      // Handle message status update
      const messageId = payload.messageId;
      const status = payload.status; // SENT, DELIVERED, READ, FAILED
      
      const messagesSnapshot = await adminDb.collectionGroup('messages').where('id', '==', messageId).get();
      if (!messagesSnapshot.empty) {
        const msgRef = messagesSnapshot.docs[0].ref;
        await msgRef.update({
          status: status.toLowerCase()
        });
      }
    } else {
      // Handle incoming message
      const customerPhone = payload.phone;
      const content = payload.text?.message || payload.message || '';
      const messageId = payload.messageId;
      const senderName = payload.senderName || '';

      // Find or create conversation
      let convId = '';
      const convsSnapshot = await adminDb.collection(`tenants/${tenantId}/whatsapp_conversations`)
        .where('whatsapp_number_id', '==', instanceId)
        .where('customer_phone', '==', customerPhone)
        .get();

      if (convsSnapshot.empty) {
        const newConvRef = await adminDb.collection(`tenants/${tenantId}/whatsapp_conversations`).add({
          whatsapp_number_id: instanceId,
          customer_phone: customerPhone,
          customer_name: senderName,
          last_message_at: new Date().toISOString(),
          bot_active: true,
          status: 'open',
          created_at: new Date().toISOString()
        });
        convId = newConvRef.id;
      } else {
        convId = convsSnapshot.docs[0].id;
        await convsSnapshot.docs[0].ref.update({
          last_message_at: new Date().toISOString(),
          customer_name: senderName || convsSnapshot.docs[0].data().customer_name
        });
      }

      // Add message
      await adminDb.collection(`tenants/${tenantId}/whatsapp_conversations/${convId}/messages`).doc(messageId).set({
        direction: 'inbound',
        content: content,
        status: 'received',
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing Z-API webhook:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Send WhatsApp Message
app.post('/api/whatsapp/messages', authenticate, async (req, res) => {
  const { conversation_id, content } = req.body;
  const tenantId = (req as any).user.tenantId;

  if (!adminDb) return res.status(500).json({ error: 'Firebase Admin not initialized' });

  try {
    const convDoc = await adminDb.collection(`tenants/${tenantId}/whatsapp_conversations`).doc(conversation_id).get();
    if (!convDoc.exists) return res.status(404).json({ error: 'Conversation not found' });
    
    const convData = convDoc.data()!;
    const numberDoc = await adminDb.collection(`tenants/${tenantId}/whatsapp_numbers`).doc(convData.whatsapp_number_id).get();
    if (!numberDoc.exists) return res.status(404).json({ error: 'WhatsApp number not found' });
    
    const numberData = numberDoc.data()!;
    const instanceId = numberData.id;
    const instanceToken = numberData.access_token;

    // Call Z-API
    const zapiUrl = `https://api.z-api.io/instances/${instanceId}/token/${instanceToken}/send-text`;
    
    const zapiPayload = {
      phone: convData.customer_phone,
      message: content
    };

    const zapiRes = await fetch(zapiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zapiPayload)
    });

    const zapiData = await zapiRes.json();

    if (apiLogs.length >= 100) apiLogs.shift();
    apiLogs.push({
      timestamp: new Date().toISOString(),
      url: zapiUrl,
      method: 'POST',
      requestBody: zapiPayload,
      responseStatus: zapiRes.status,
      responseData: zapiData
    });

    if (!zapiRes.ok) {
      return res.status(400).json({ error: 'Failed to send message via Z-API', details: zapiData });
    }

    // Save message to Firestore
    const messageId = zapiData.messageId || Date.now().toString();
    await adminDb.collection(`tenants/${tenantId}/whatsapp_conversations/${conversation_id}/messages`).doc(messageId).set({
      direction: 'outbound',
      content: content,
      status: 'sent',
      timestamp: new Date().toISOString()
    });

    await convDoc.ref.update({
      last_message_at: new Date().toISOString()
    });

    res.json({ success: true, messageId });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auto-quote
app.post('/api/whatsapp/conversations/:id/auto-quote', authenticate, async (req, res) => {
  const { id } = req.params;
  const { services, parts, vehicle_make, vehicle_model } = req.body;
  const tenantId = (req as any).user.tenantId;

  if (!adminDb) return res.status(500).json({ error: 'Firebase Admin not initialized' });

  try {
    const convDoc = await adminDb.collection(`tenants/${tenantId}/whatsapp_conversations`).doc(id).get();
    if (!convDoc.exists) return res.status(404).json({ error: 'Conversation not found' });
    
    const convData = convDoc.data()!;

    // Find customer or create
    let customerId = '';
    const customersSnapshot = await adminDb.collection(`tenants/${tenantId}/customers`).where('phone', '==', convData.customer_phone).get();
    if (!customersSnapshot.empty) {
      customerId = customersSnapshot.docs[0].id;
    } else {
      const newCustomerRef = await adminDb.collection(`tenants/${tenantId}/customers`).add({
        name: convData.customer_name || 'Cliente WhatsApp',
        phone: convData.customer_phone,
        created_at: new Date().toISOString()
      });
      customerId = newCustomerRef.id;
    }

    // Find vehicle or create
    let vehicleId = '';
    if (vehicle_make || vehicle_model) {
      const vehiclesSnapshot = await adminDb.collection(`tenants/${tenantId}/vehicles`).where('customer_id', '==', customerId).get();
      if (!vehiclesSnapshot.empty) {
        vehicleId = vehiclesSnapshot.docs[0].id;
      } else {
        const newVehicleRef = await adminDb.collection(`tenants/${tenantId}/vehicles`).add({
          customer_id: customerId,
          make: vehicle_make || 'Desconhecida',
          model: vehicle_model || 'Desconhecido',
          year: new Date().getFullYear(),
          created_at: new Date().toISOString()
        });
        vehicleId = newVehicleRef.id;
      }
    }

    // Calculate totals
    let totalAmount = 0;
    const quoteItems = [];

    if (services && services.length > 0) {
      const servicesSnapshot = await adminDb.collection(`tenants/${tenantId}/services`).get();
      const catalogServices = servicesSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      for (const serviceName of services) {
        const match = catalogServices.find((s: any) => s.name.toLowerCase().includes(serviceName.toLowerCase()));
        if (match) {
          totalAmount += (match as any).price;
          quoteItems.push({
            item_type: 'service',
            item_id: match.id,
            quantity: 1,
            unit_price: (match as any).price,
            total_price: (match as any).price
          });
        }
      }
    }

    if (parts && parts.length > 0) {
      const partsSnapshot = await adminDb.collection(`tenants/${tenantId}/parts`).get();
      const catalogParts = partsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      for (const partName of parts) {
        const match = catalogParts.find((p: any) => p.name.toLowerCase().includes(partName.toLowerCase()));
        if (match) {
          totalAmount += (match as any).price;
          quoteItems.push({
            item_type: 'part',
            item_id: match.id,
            quantity: 1,
            unit_price: (match as any).price,
            total_price: (match as any).price
          });
        }
      }
    }

    // Create quote
    const newQuoteRef = await adminDb.collection(`tenants/${tenantId}/quotes`).add({
      customer_id: customerId,
      vehicle_id: vehicleId || null,
      status: 'draft',
      total_amount: totalAmount,
      created_at: new Date().toISOString()
    });

    // Add items
    for (const item of quoteItems) {
      await adminDb.collection(`tenants/${tenantId}/quotes/${newQuoteRef.id}/items`).add(item);
    }

    res.json({ success: true, quote_id: newQuoteRef.id, total_amount: totalAmount });
  } catch (error) {
    console.error('Error generating quote:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
