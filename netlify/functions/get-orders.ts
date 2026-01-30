import { Context } from "@netlify/functions";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

export default async (req: Request, context: Context) => {
  if (req.method == "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      },
    });
  }

  // Basic "password" check
  const authHeader = req.headers.get("Authorization");
  const adminPassword = process.env.ADMIN_PASSWORD || "admin";
  
  if (authHeader !== `Bearer ${adminPassword}`) {
       return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
         "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    // List last 100 successful payment intents
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
    });

    // Filter for only those that have "tulipType" in metadata (our orders)
    // and exclude deleted ones
    const orders = paymentIntents.data
      .filter((pi) => pi.metadata && pi.metadata.tulipType && pi.status === 'succeeded' && pi.metadata.deleted !== 'true')
      .map((pi) => ({
        id: pi.id,
        created: pi.created,
        amount: pi.amount,
        status: pi.status,
        metadata: pi.metadata,
      }));
    
    console.log(`Fetched ${orders.length} orders. Sample metadata:`, orders[0]?.metadata);

    return new Response(JSON.stringify({ orders }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch orders" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
