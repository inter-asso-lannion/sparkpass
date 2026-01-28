import { Context } from "@netlify/functions";
import { Resend } from "resend";
import Stripe from "stripe";

const resend = new Resend(process.env.RESEND_API_KEY);
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
    const { toEmail, name, tulipType, message, isAnonymous, price, recipientName, formation } = await req.json();

    if (!toEmail || !tulipType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let remainingStock = "Inconnu";
    let currentStock = 0;
    const stockKey = `stock_${tulipType}`;

    // Fetch and decrement stock logic moved before email
    if (PRODUCT_ID && tulipType) {
      try {
        const product = await stripe.products.retrieve(PRODUCT_ID);
        currentStock = parseInt(product.metadata[stockKey] || "0", 10);
        
        if (currentStock > 0) {
           // We are about to sell one, so remaining is current - 1
           const newStock = currentStock - 1;
           remainingStock = newStock.toString();

           // Update Stripe immediately
           await stripe.products.update(PRODUCT_ID, {
            metadata: {
              [stockKey]: newStock.toString(),
            },
          });
        } else {
            remainingStock = "0 (Stock épuisé ou erreur)";
        }
      } catch (err) {
        console.error("Failed to update stock:", err);
      }
    }

    // Customer email content
    const customerEmailHtml = `
        <h1>Merci pour ta commande !</h1>
        <p>Voici le récapitulatif :</p>
        <ul>
            <li><strong>Type de tulipe :</strong> ${tulipType}</li>
            <li><strong>Prix :</strong> ${price}€</li>
            <li><strong>De la part de :</strong> ${isAnonymous ? "Anonyme" : name}</li>
            <li><strong>Pour :</strong> ${recipientName} (${formation})</li>
            <li><strong>Message :</strong> ${message}</li>
        </ul>
        <p>On essaye de livrer ta tulipe le plus vite possible !</p>
        <p>L'Inter-asso</p>
        <p>https://inter-asso.fr</p>
      `;

    // Admin email content
    const adminEmailHtml = `
        <h1>Nouvelle commande !</h1>
        <p>Détails de la commande :</p>
        <ul>
            <li><strong>Type de tulipe :</strong> ${tulipType}</li>
            <li><strong>Prix :</strong> ${price}€</li>
            <li><strong>De la part de :</strong> ${isAnonymous ? "Anonyme" : name}</li>
            <li><strong>Pour :</strong> ${recipientName} (${formation})</li>
            <li><strong>Message :</strong> ${message}</li>
            <li><strong>Stock restant :</strong> ${remainingStock}</li>
        </ul>
      `;

    // Send to Customer and Admin separately to hide recipient from Admin
    await Promise.all([
      resend.emails.send({
        from: "Les tulipes d'Inter-Asso <tulipes@pay.inter-asso.fr>",
        to: [toEmail],
        subject: "Confirmation de ta commande de Tulipe",
        html: customerEmailHtml,
      }),
      resend.emails.send({
        from: "Les tulipes d'Inter-Asso <tulipes@pay.inter-asso.fr>",
        to: ["bdemmi@inter-asso.fr"],
        subject: "Nouvelle commande de Tulipe :)",
        html: adminEmailHtml,
      })
    ]);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send email" }),
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
