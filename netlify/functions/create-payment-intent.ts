import { Context } from "@netlify/functions";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

const PRODUCT_ID = process.env.STRIPE_PRODUCT_ID;

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

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    // Parse body and log for debugging
    // Parse body
    const body = await req.json();
    console.log("Received payment intent request:", body);

    // Support both new "items" array and legacy single-item fields
    let items = body.items || [];
    
    // Legacy fallback: if no items array, try to construct one from single fields
    if (items.length === 0 && body.tulipType) {
        items.push({
            tulipType: body.tulipType,
            name: body.name,
            message: body.message,
            isAnonymous: body.isAnonymous,
            recipientName: body.recipientName,
            recipientFirstName: body.recipientFirstName,
            recipientLastName: body.recipientLastName,
            formation: body.formation,
        });
    }

    if (items.length === 0) {
        return new Response(
            JSON.stringify({ error: "No items in order" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    if (!PRODUCT_ID) {
       console.error("Missing STRIPE_PRODUCT_ID environment variable");
       return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch the real price from Stripe
    const prices = await stripe.prices.list({
      product: PRODUCT_ID,
      active: true,
      limit: 1,
    });

    if (prices.data.length === 0) {
       return new Response(
        JSON.stringify({ error: "Product price not found" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Amount in cents (per item)
    const unitAmount = prices.data[0].unit_amount;

    if (!unitAmount) {
         return new Response(
        JSON.stringify({ error: "Invalid price configuration" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check stock for all items
    const product = await stripe.products.retrieve(PRODUCT_ID);
    
    // Count required stock per type
    const requiredStock: Record<string, number> = {};
    items.forEach((item: any) => {
        const key = `stock_${item.tulipType}`;
        requiredStock[key] = (requiredStock[key] || 0) + 1;
    });

    // Validate against current stock
    for (const [key, count] of Object.entries(requiredStock)) {
        const currentStock = parseInt(product.metadata[key] || "0", 10);
        if (currentStock < count) {
            return new Response(
                JSON.stringify({ error: `Rupture de stock pour ${key.replace('stock_', '')}` }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }
    }

    // Calculate total amount
    const totalAmount = unitAmount * items.length;

    // Prepare metadata
    // We store items as compact JSON strings in item_0, item_1, etc.
    // Customer email is global for the order
    const customerEmail = body.customerEmail || items[0]?.customerEmail || "";
    
    const metadata: Record<string, string> = {
        item_count: items.length.toString(),
        customer_email: String(customerEmail),
        product_id: String(PRODUCT_ID || ""),
        // Legacy fields for backward compat (displaying first item)
        // This helps if admin panel looks at top-level fields for summary
        tulipType: String(items[0].tulipType || ""), // Legacy compat
    };

    items.forEach((item: any, index: number) => {
        // Compact keys to save space
        const itemData = {
            t: item.tulipType,
            n: item.isAnonymous ? "Anonyme" : item.name, // Display name
            on: item.name, // Original Name (sender)
            m: (item.message || "").substring(0, 350),
            rn: item.recipientName,
            rfn: item.recipientFirstName,
            rln: item.recipientLastName,
            f: item.formation,
            a: item.isAnonymous ? "1" : "0",
            ds: "pending" // delivery status
        };
        metadata[`item_${index}`] = JSON.stringify(itemData);
    });
    
    console.log("Creating PaymentIntent with metadata:", metadata);

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount, 
      currency: "eur",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: metadata
    });

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create payment intent" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
};
