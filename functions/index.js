/**
 * YIABIZ Backend (Firebase Cloud Functions v2 + Express)
 * Endpoints:
 *  - POST /api/ai/detect
 *  - POST /api/ai/generate-listing
 *  - POST /api/price/estimate
 *  - POST /api/create-payment-intent
 *  - POST /api/stripe/webhook
 *
 * Notes:
 *  - Keep ALL API keys server-side (Secrets).
 *  - This is a minimal, production-oriented skeleton.
 */

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

// ---- Secrets (Google Secret Manager via Firebase Functions) ----
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");
const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");

// ---- Optional: set your platform currency here ----
const CURRENCY = "eur";

// ---- Express app ----
const app = express();

// Stripe webhook needs raw body; we mount it ONLY on that route.
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const stripe = require("stripe")(STRIPE_SECRET_KEY.value());
      const sig = req.headers["stripe-signature"];
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        STRIPE_WEBHOOK_SECRET.value()
      );

      // Handle the event types you need
      if (event.type === "payment_intent.succeeded") {
        const pi = event.data.object;
        // You can store fulfillment status in Firestore
        await db.collection("payments").doc(pi.id).set(
          {
            status: "succeeded",
            amount: pi.amount,
            currency: pi.currency,
            metadata: pi.metadata || {},
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } else if (event.type === "payment_intent.payment_failed") {
        const pi = event.data.object;
        await db.collection("payments").doc(pi.id).set(
          {
            status: "failed",
            amount: pi.amount,
            currency: pi.currency,
            metadata: pi.metadata || {},
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      res.status(200).send("ok");
    } catch (err) {
      console.error("Stripe webhook error:", err);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// For all other routes, normal JSON body parsing
app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" }));

// Basic health
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ---- Helpers ----
function requireAuth(req) {
  // Accept Firebase ID token in Authorization: Bearer <token>
  const hdr = req.headers.authorization || "";
  const m = hdr.match(/^Bearer (.+)$/i);
  if (!m) return null;
  return m[1];
}

async function verifyFirebaseUser(req) {
  const token = requireAuth(req);
  if (!token) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded; // { uid, ... }
  } catch (e) {
    return null;
  }
}

function toCentsEUR(amount) {
  // amount in euros (number or string), return integer cents
  const n = Number(amount);
  if (!isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function stripDataUrlPrefix(dataUrl) {
  // Accept both dataURL and raw base64
  if (!dataUrl) return null;
  const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (m) return { mime: m[1], b64: m[2] };
  // If raw base64: assume jpeg
  return { mime: "image/jpeg", b64: dataUrl };
}

// ---- OpenAI client (official) ----
function getOpenAI() {
  const OpenAI = require("openai");
  return new OpenAI({ apiKey: OPENAI_API_KEY.value() });
}

// =====================================================
// POST /api/ai/detect
// Body: { image: "data:image/jpeg;base64,..." }
// Returns: { title, category, brand, model, conditionHint, confidence }
// =====================================================
app.post("/api/ai/detect", async (req, res) => {
  const user = await verifyFirebaseUser(req); // optional; allow visitors if you want
  // If you want to require auth, uncomment:
  // if (!user) return res.status(401).json({ error: "unauthorized" });

  const image = req.body && req.body.image;
  const parsed = stripDataUrlPrefix(image);
  if (!parsed) return res.status(400).json({ error: "missing_image" });

  try {
    const openai = getOpenAI();

    // Using OpenAI vision: send base64 data URL in image_url.
    const dataUrl = `data:${parsed.mime};base64,${parsed.b64}`;

    const prompt = `
Analyse l'image et identifie l'objet vendu sur une marketplace de seconde main.
Réponds STRICTEMENT en JSON avec ces clés:
{
  "title": string,           // ex: "iPhone 14 Pro 256Go"
  "category": string,        // ex: "Téléphones & objets connectés"
  "brand": string|null,
  "model": string|null,
  "conditionHint": string|null, // ex: "Très bon état"
  "confidence": number       // 0..1
}
Ne mets aucun texte hors JSON.`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: dataUrl },
          ],
        },
      ],
    });

    const text = response.output_text || "";
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      // Best-effort: extract JSON block
      const m = text.match(/\{[\s\S]*\}$/);
      json = m ? JSON.parse(m[0]) : null;
    }
    if (!json) throw new Error("AI JSON parse failed");

    res.json(json);
  } catch (err) {
    console.error("ai/detect error:", err);
    res.status(500).json({ error: "ai_detect_failed" });
  }
});

// =====================================================
// POST /api/ai/generate-listing
// Body: { title, brand, model, category, condition, price, lang }
// Returns: { title, description, bullets, category }
// =====================================================
app.post("/api/ai/generate-listing", async (req, res) => {
  const user = await verifyFirebaseUser(req);
  // if (!user) return res.status(401).json({ error: "unauthorized" });

  const p = req.body || {};
  try {
    const openai = getOpenAI();

    const prompt = `
Tu aides à écrire une annonce de seconde main (FR).
Données:
- Titre brut: ${p.title || ""}
- Marque: ${p.brand || ""}
- Modèle: ${p.model || ""}
- Catégorie: ${p.category || ""}
- État: ${p.condition || ""}
- Prix visé: ${p.price || ""}€

Génère une annonce concise et vendeuse.
Réponds STRICTEMENT en JSON:
{
  "title": string,             // court, propre
  "category": string,          // une des catégories du site si possible
  "description": string,       // 4-8 lignes, honnête
  "bullets": string[]          // 4-6 puces (état, accessoires, livraison, etc.)
}
Aucun texte hors JSON.`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
    });

    const text = response.output_text || "";
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      const m = text.match(/\{[\s\S]*\}$/);
      json = m ? JSON.parse(m[0]) : null;
    }
    if (!json) throw new Error("AI JSON parse failed");
    res.json(json);
  } catch (err) {
    console.error("ai/generate-listing error:", err);
    res.status(500).json({ error: "ai_generate_failed" });
  }
});

// =====================================================
// POST /api/price/estimate
// Body: { title, brand, model, category, condition }
// Returns: { suggestedPrice, low, high, source, confidence }
// =====================================================
app.post("/api/price/estimate", async (req, res) => {
  const p = req.body || {};
  try {
    const openai = getOpenAI();

    const prompt = `
Estime un prix de revente d'occasion en France (EUR) pour:
Titre: ${p.title || ""}
Marque: ${p.brand || ""}
Modèle: ${p.model || ""}
Catégorie: ${p.category || ""}
État: ${p.condition || ""}

Donne une estimation réaliste en euros basée sur la connaissance générale (sans navigation web).
Réponds STRICTEMENT en JSON:
{
  "suggestedPrice": number,
  "low": number,
  "high": number,
  "confidence": number,   // 0..1
  "source": "model"
}
Aucun texte hors JSON.`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
    });

    const text = response.output_text || "";
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      const m = text.match(/\{[\s\S]*\}$/);
      json = m ? JSON.parse(m[0]) : null;
    }
    if (!json) throw new Error("AI JSON parse failed");
    res.json(json);
  } catch (err) {
    console.error("price/estimate error:", err);
    // fallback hard
    res.json({ suggestedPrice: 50, low: 45, high: 60, confidence: 0.1, source: "fallback" });
  }
});

// =====================================================
// POST /api/create-payment-intent
// Body: { itemId, price }
// Returns: { clientSecret }
// =====================================================
app.post("/api/create-payment-intent", async (req, res) => {
  const user = await verifyFirebaseUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const { itemId, price } = req.body || {};
  if (!itemId) return res.status(400).json({ error: "missing_itemId" });

  const cents = toCentsEUR(price);
  if (!cents) return res.status(400).json({ error: "invalid_price" });

  try {
    const stripe = require("stripe")(STRIPE_SECRET_KEY.value());

    // Optional: validate item exists and is for sale
    const itemDoc = await db.collection("scans").doc(itemId).get();
    const item = itemDoc.exists ? itemDoc.data() : null;

    // Create PaymentIntent
    const pi = await stripe.paymentIntents.create({
      amount: cents,
      currency: CURRENCY,
      automatic_payment_methods: { enabled: true },
      metadata: {
        itemId,
        buyerUid: user.uid,
        sellerUid: item && item.userId ? item.userId : "",
      },
    });

    await db.collection("payments").doc(pi.id).set({
      status: "created",
      itemId,
      buyerUid: user.uid,
      sellerUid: item && item.userId ? item.userId : null,
      amount: pi.amount,
      currency: pi.currency,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ clientSecret: pi.client_secret });
  } catch (err) {
    console.error("create-payment-intent error:", err);
    res.status(500).json({ error: "payment_intent_failed" });
  }
});

// Export 1 function with Express
exports.api = onRequest(
  {
    region: "europe-west1",
    secrets: [OPENAI_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET],
    timeoutSeconds: 60,
  },
  app
);
