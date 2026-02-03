import { Context } from "@netlify/functions";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

interface LoginLog {
  ip: string;
  userAgent: string;
  timestamp: string;
  country: string;
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

  // Super admin password check (you might want a separate password)
  const authHeader = req.headers.get("Authorization");
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  
  if (!superAdminPassword) {
    console.error("SUPER_ADMIN_PASSWORD or ADMIN_PASSWORD is not set");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (authHeader !== `Bearer ${superAdminPassword}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    // Find the logs customer
    const existingCustomers = await stripe.customers.list({
      email: "admin-logs@sparkpass.internal",
      limit: 1,
    });

    if (existingCustomers.data.length === 0) {
      return new Response(JSON.stringify({ logs: [], blockedIps: [] }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const logsCustomer = existingCustomers.data[0];
    const metadata = logsCustomer.metadata || {};
    
    // Parse logs from individual keys (log_0, log_1, etc.)
    const logs: LoginLog[] = [];
    for (let i = 0; i < 20; i++) {
      const logEntry = metadata[`log_${i}`];
      if (logEntry) {
        // Format: IP|UA|timestamp|country
        const parts = logEntry.split("|");
        if (parts.length >= 3) {
          logs.push({
            ip: parts[0],
            userAgent: parts[1],
            timestamp: parts[2],
            country: parts[3] || "?",
          });
        }
      }
    }

    // Get blocked IPs
    let blockedIps: string[] = [];
    try {
      const blockedStr = metadata.blockedIps;
      if (blockedStr) {
        blockedIps = JSON.parse(blockedStr);
      }
    } catch {
      blockedIps = [];
    }

    return new Response(JSON.stringify({ logs, blockedIps }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error fetching admin logs:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch logs" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
