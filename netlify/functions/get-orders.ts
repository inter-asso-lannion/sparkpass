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

  // Basic "password" check - accept both admin and super admin
  const authHeader = req.headers.get("Authorization");
  const adminPassword = process.env.ADMIN_PASSWORD;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  
  if (!adminPassword) {
    console.error("ADMIN_PASSWORD is not set");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  const isAdminAuth = authHeader === `Bearer ${adminPassword}`;
  const isSuperAdminAuth = superAdminPassword && authHeader === `Bearer ${superAdminPassword}`;
  
  if (!isAdminAuth && !isSuperAdminAuth) {
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
      .filter((pi) => pi.status === 'succeeded' && pi.metadata && pi.metadata.deleted !== 'true')
      .flatMap((pi) => {
        // Check if it's a multi-item order
        if (pi.metadata.item_count) {
          const count = parseInt(pi.metadata.item_count, 10);
          const subOrders = [];
          
          for (let i = 0; i < count; i++) {
            const itemKey = `item_${i}`;
            const itemJson = pi.metadata[itemKey];
            
            if (itemJson) {
              try {
                const item = JSON.parse(itemJson);
                // Map compact keys back to full keys for frontend
                subOrders.push({
                  id: `${pi.id}__${i}`, // Virtual ID with double underscore
                  created: pi.created,
                  amount: pi.amount / count, // Approximate per-item amount (not precise but ok for display)
                  status: pi.status,
                  metadata: {
                    tulipType: item.t,
                    name: item.n, // Display name
                    firstName: item.on, // Original name
                    message: item.m,
                    recipientName: item.rn,
                    recipientFirstName: item.rfn,
                    recipientLastName: item.rln,
                    formation: item.f,
                    customerEmail: pi.metadata.customer_email || pi.metadata.customerEmail,
                    deliveryStatus: item.ds || "pending",
                    isAnonymous: item.a === "1" ? "true" : "false",
                    itemIndex: i, // Store index for updates
                    parentPaymentIntentId: pi.id // Store parent ID
                  }
                });
              } catch (e) {
                console.error("Failed to parse item metadata", e);
              }
            }
          }
          return subOrders;
        } else if (pi.metadata.tulipType) {
          // Legacy single order
          // Force cast metadata to any to compatibility with the expanded metadata type above
          return [{
            id: pi.id,
            created: pi.created,
            amount: pi.amount,
            status: pi.status,
            metadata: pi.metadata as any,
          }];
        }
        return [];
      });
    
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
