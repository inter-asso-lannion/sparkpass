import { Context } from "@netlify/functions";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

interface DbEdit {
  paymentIntentId: string;
  field: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
  editorIp: string;
}

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }

  // Super admin password check
  const authHeader = req.headers.get("Authorization");
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!superAdminPassword) {
    return new Response(JSON.stringify({ error: "Super admin not configured" }), {
      status: 403,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  if (authHeader !== `Bearer ${superAdminPassword}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    // Find the logs customer
    const existingCustomers = await stripe.customers.list({
      email: "admin-logs@sparkpass.internal",
      limit: 1,
    });

    if (existingCustomers.data.length === 0) {
      return new Response(JSON.stringify({ edits: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const logsCustomer = existingCustomers.data[0];
    const metadata = logsCustomer.metadata || {};
    
    // Parse edits from individual keys (edit_0, edit_1, etc.)
    const edits: DbEdit[] = [];
    for (let i = 0; i < 20; i++) {
      const editEntry = metadata[`edit_${i}`];
      if (editEntry) {
        // Format: piId|field|old|new|timestamp|ip
        const parts = editEntry.split("|");
        if (parts.length >= 5) {
          edits.push({
            paymentIntentId: parts[0],
            field: parts[1],
            oldValue: parts[2],
            newValue: parts[3],
            timestamp: parts[4],
            editorIp: parts[5] || "unknown",
          });
        }
      }
    }

    return new Response(JSON.stringify({ edits }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    console.error("Error fetching DB edits:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch edits" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
};
