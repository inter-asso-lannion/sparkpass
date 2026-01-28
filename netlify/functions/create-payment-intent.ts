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
    const { tulipType } = await req.json();

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
    
    // Amount in cents
    const amount = prices.data[0].unit_amount;

    if (!amount) {
         return new Response(
        JSON.stringify({ error: "Invalid price configuration" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check stock
    const product = await stripe.products.retrieve(PRODUCT_ID);
    const stockKey = `stock_${tulipType}`;
    const currentStock = parseInt(product.metadata[stockKey] || "0", 10);

    if (currentStock <= 0) {
      return new Response(
        JSON.stringify({ error: "Rupture de stock pour ce produit" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, 
      currency: "eur",
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
          tulipType,
          product_id: PRODUCT_ID || ""
      }
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
