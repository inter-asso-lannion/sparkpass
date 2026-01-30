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
        "Access-Control-Allow-Methods": "POST, OPTIONS",
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

  if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { paymentIntentId } = await req.json();

    if (!paymentIntentId) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
    }

    // Update the metadata to mark as deleted
    await stripe.paymentIntents.update(paymentIntentId, {
      metadata: {
        deleted: "true",
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    return new Response(JSON.stringify({ error: "Failed to delete order" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
