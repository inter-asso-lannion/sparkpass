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
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error("ADMIN_PASSWORD is not set");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  
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
    const { paymentIntentId, status } = await req.json();

    if (!paymentIntentId || !status) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
    }


    // Check if it's a virtual ID (multi-item order)
    let targetPiId = paymentIntentId;
    let itemIndex = -1;
    
    if (paymentIntentId.includes("__")) {
      const parts = paymentIntentId.split("__");
      targetPiId = parts[0];
      itemIndex = parseInt(parts[1], 10);
    }

    if (itemIndex >= 0) {
      // It's a specific item in a multi-item order
      // We need to fetch current metadata, parse the item, update it, and save back
      const pi = await stripe.paymentIntents.retrieve(targetPiId);
      const itemKey = `item_${itemIndex}`;
      const itemJson = pi.metadata[itemKey];
      
      if (itemJson) {
        const item = JSON.parse(itemJson);
        item.ds = status; // Update delivery status (ds)
        
        await stripe.paymentIntents.update(targetPiId, {
          metadata: {
            [itemKey]: JSON.stringify(item),
          },
        });
      }
    } else {
      // Legacy or global update
      await stripe.paymentIntents.update(paymentIntentId, {
        metadata: {
          deliveryStatus: status,
        },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return new Response(JSON.stringify({ error: "Failed to update order" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
};
