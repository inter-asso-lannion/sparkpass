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

  // Super admin password check
  const authHeader = req.headers.get("Authorization");
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

  if (!superAdminPassword || authHeader !== `Bearer ${superAdminPassword}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const body = await req.json();
    const { ip, action } = body; // action: "block" or "unblock"

    if (!ip || !action) {
      return new Response(JSON.stringify({ error: "Missing ip or action" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Find or create the logs customer
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
        metadata: {
          logs: "[]",
          blockedIps: "[]",
        },
      });
    }

    // Get existing blocked IPs
    let blockedIps: string[] = [];
    try {
      const blockedStr = logsCustomer.metadata?.blockedIps;
      if (blockedStr) {
        blockedIps = JSON.parse(blockedStr);
      }
    } catch {
      blockedIps = [];
    }

    if (action === "block") {
      if (!blockedIps.includes(ip)) {
        blockedIps.push(ip);
      }
    } else if (action === "unblock") {
      blockedIps = blockedIps.filter((blocked) => blocked !== ip);
    }

    // Update the customer with new blocked IPs
    await stripe.customers.update(logsCustomer.id, {
      metadata: {
        ...logsCustomer.metadata,
        blockedIps: JSON.stringify(blockedIps),
      },
    });

    console.log(`IP ${ip} ${action}ed`);

    return new Response(JSON.stringify({ success: true, blockedIps }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error managing blocked IP:", error);
    return new Response(JSON.stringify({ error: "Failed to manage IP" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
