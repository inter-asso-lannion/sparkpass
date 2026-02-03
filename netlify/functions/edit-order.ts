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
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Confirm-Token",
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

  // SECURITY: Only super admin password works
  const authHeader = req.headers.get("Authorization");
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  
  // SECURITY: Require dedicated super admin password, NOT the regular admin password
  if (!superAdminPassword) {
    console.error("SUPER_ADMIN_PASSWORD is not set - DB editing disabled");
    return new Response(JSON.stringify({ error: "Database editing is disabled" }), {
      status: 403,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  if (authHeader !== `Bearer ${superAdminPassword}`) {
    console.warn("Unauthorized DB edit attempt");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // SECURITY: Require confirmation token (prevents accidental submissions)
  const confirmToken = req.headers.get("X-Confirm-Token");
  if (confirmToken !== "CONFIRM_DB_EDIT") {
    return new Response(JSON.stringify({ error: "Missing confirmation token" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const body = await req.json();
    const { paymentIntentId, updates } = body;

    if (!paymentIntentId || !updates || typeof updates !== "object") {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // SECURITY: Whitelist allowed fields to edit
    const allowedFields = [
      "tulipType",
      "name",
      "message",
      "recipientName",
      "recipientFirstName",
      "recipientLastName",
      "formation",
      "isAnonymous",
      "deliveryStatus",
      "firstName",
    ];

    const sanitizedUpdates: Record<string, string> = {};
    const editActions: string[] = [];

    // Get current payment intent to log old values
    const currentPi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (!currentPi) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const ip =
      req.headers.get("x-nf-client-connection-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      context.ip ||
      "unknown";

    const timestamp = new Date().toISOString();

    for (const [field, value] of Object.entries(updates)) {
      if (!allowedFields.includes(field)) {
        console.warn(`Blocked attempt to edit forbidden field: ${field}`);
        continue;
      }

      // SECURITY: Sanitize value
      const sanitizedValue = String(value).slice(0, 500).trim();
      sanitizedUpdates[field] = sanitizedValue;

      // Compact log format: piId|field|old|new|timestamp|ip
      const oldValue = (currentPi.metadata[field] || "").slice(0, 50);
      const newValue = sanitizedValue.slice(0, 50);
      editActions.push(`${paymentIntentId.slice(-8)}|${field}|${oldValue}|${newValue}|${timestamp}|${ip}`);
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return new Response(JSON.stringify({ error: "No valid fields to update" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Update the payment intent metadata
    const updatedPi = await stripe.paymentIntents.update(paymentIntentId, {
      metadata: {
        ...currentPi.metadata,
        ...sanitizedUpdates,
      },
    });

    // Log the edit to our audit log
    await logDbEdits(editActions);

    console.log(`DB Edit by ${ip}:`, editActions);

    return new Response(JSON.stringify({ 
      success: true, 
      updated: sanitizedUpdates,
      order: {
        id: updatedPi.id,
        metadata: updatedPi.metadata,
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    console.error("Error editing DB:", error);
    return new Response(JSON.stringify({ error: "Failed to update database" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
};

// Log edits to audit trail using individual metadata keys
async function logDbEdits(actions: string[]) {
  try {
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

    const currentMetadata = { ...logsCustomer.metadata };
    
    // Shift existing edits (keep last 20)
    for (let i = 19; i >= actions.length; i--) {
      if (currentMetadata[`edit_${i - actions.length}`]) {
        currentMetadata[`edit_${i}`] = currentMetadata[`edit_${i - actions.length}`];
      }
    }
    
    // Add new edits at the beginning
    for (let i = 0; i < actions.length && i < 20; i++) {
      currentMetadata[`edit_${i}`] = actions[i];
    }

    await stripe.customers.update(logsCustomer.id, {
      metadata: currentMetadata,
    });
  } catch (err) {
    console.error("Failed to log DB edit:", err);
  }
}
