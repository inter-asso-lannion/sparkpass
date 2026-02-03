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
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }

  try {
    // Get IP from various headers
    const ip =
      req.headers.get("x-nf-client-connection-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      context.ip ||
      "unknown";

    // Find the logs customer
    const existingCustomers = await stripe.customers.list({
      email: "admin-logs@sparkpass.internal",
      limit: 1,
    });

    if (existingCustomers.data.length === 0) {
      // No logs customer = no blocked IPs
      return new Response(JSON.stringify({ blocked: false, ip }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const logsCustomer = existingCustomers.data[0];
    let blockedIps: string[] = [];

    try {
      const blockedStr = logsCustomer.metadata?.blockedIps;
      if (blockedStr) {
        blockedIps = JSON.parse(blockedStr);
      }
    } catch {
      blockedIps = [];
    }

    const isBlocked = blockedIps.includes(ip);

    return new Response(JSON.stringify({ blocked: isBlocked, ip }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error checking blocked IP:", error);
    return new Response(JSON.stringify({ blocked: false, ip: "unknown" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
