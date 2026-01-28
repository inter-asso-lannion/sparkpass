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

  try {
    if (!PRODUCT_ID) {
       console.error("Missing STRIPE_PRODUCT_ID environment variable");
       return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prices = await stripe.prices.list({
      product: PRODUCT_ID,
      active: true,
      limit: 1,
    });

    if (prices.data.length === 0) {
      return new Response(JSON.stringify({ error: "No price found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const price = prices.data[0];
    const product = await stripe.products.retrieve(PRODUCT_ID);

    return new Response(
      JSON.stringify({
        priceId: price.id,
        amount: price.unit_amount ? price.unit_amount / 100 : 0,
        currency: price.currency,
        metadata: product.metadata,
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
    console.error("Error fetching price:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch price" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
