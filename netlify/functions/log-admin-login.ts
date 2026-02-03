import { Context } from "@netlify/functions";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { userAgent } = body;

    // Get IP from various headers (Netlify/Cloudflare)
    const ip =
      req.headers.get("x-nf-client-connection-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      context.ip ||
      "unknown";

    // Compact log entry to save space (Stripe metadata has 500 char limit per key)
    const ua = (userAgent || req.headers.get("user-agent") || "").slice(0, 100);
    const timestamp = new Date().toISOString();
    const country = req.headers.get("cf-ipcountry") || "?";
    
    // Format: IP|UA|timestamp|country (compact format)
    const logEntry = `${ip}|${ua}|${timestamp}|${country}`;

    // Store in Stripe customer metadata (using a special customer for logs)
    let logsCustomer;
    const existingCustomers = await stripe.customers.list({
      email: "admin-logs@sparkpass.internal",
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      logsCustomer = existingCustomers.data[0];
    } else {
      logsCustomer = await stripe.customers.create({
        email: "admin-logs@sparkpass.internal",
        name: "Admin Login Logs",
        metadata: {},
      });
    }

    // Store logs in separate keys to avoid 500 char limit
    // Each key holds one log entry, we keep last 20
    const currentMetadata = { ...logsCustomer.metadata };
    
    // Shift existing logs
    for (let i = 19; i >= 1; i--) {
      if (currentMetadata[`log_${i - 1}`]) {
        currentMetadata[`log_${i}`] = currentMetadata[`log_${i - 1}`];
      }
    }
    currentMetadata["log_0"] = logEntry;

    // Update the customer with new logs
    await stripe.customers.update(logsCustomer.id, {
      metadata: currentMetadata,
    });

    console.log("Admin login logged:", { ip, timestamp });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error logging admin login:", error);
    return new Response(JSON.stringify({ error: "Failed to log login" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
