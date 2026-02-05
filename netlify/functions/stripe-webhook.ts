import { Context } from "@netlify/functions";
import Stripe from "stripe";
import { Resend } from "resend";
import { generateEmailHtml } from "./utils/email-template";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

const resend = new Resend(process.env.RESEND_API_KEY);
const PRODUCT_ID = process.env.STRIPE_PRODUCT_ID;
const ENDPOINT_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// Mapping des formations vers les emails BDE Inter-Asso
const FORMATION_BDE_EMAILS: Record<string, string> = {
  "BUT Informatique": "tom.heliere@etudiant.univ-rennes.fr",
  "BUT MMI": "tom.heliere@etudiant.univ-rennes.fr",
  "BUT R&T": "tom.heliere@etudiant.univ-rennes.fr",
  "BUT Info-Com (Journalisme)": "tom.heliere@etudiant.univ-rennes.fr",
  "BUT Info-Com (Parcours des Organisations)": "tom.heliere@etudiant.univ-rennes.fr",
  "BUT Mesures Physiques": "tom.heliere@etudiant.univ-rennes.fr",
  "Personnel de l'IUT": "tom.heliere@etudiant.univ-rennes.fr",
};

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const sig = req.headers.get("stripe-signature");

  if (!ENDPOINT_SECRET) {
      console.error("Missing STRIPE_WEBHOOK_SECRET");
      return new Response("Server Error: Missing Webhook Secret", { status: 500 });
  }

  if (!sig) {
      return new Response("Missing Stripe Signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, sig, ENDPOINT_SECRET);
  } catch (err) {
    console.error(`Webhook Signature Verification Failed: ${err}`);
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  // Handle the event
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    // Check replay protection
    if (paymentIntent.metadata.email_sent === 'true') {
        console.log(`PaymentIntent ${paymentIntent.id} already processed.`);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    console.log(`Processing Order for PaymentIntent: ${paymentIntent.id}`);
    
    const metadata = paymentIntent.metadata;
    const customerEmail = metadata.customerEmail || metadata.customer_email;
    const totalPrice = (paymentIntent.amount / 100).toFixed(2);

    if (!customerEmail) {
        console.error("No customer email found in metadata");
        return new Response(JSON.stringify({ received: true, error: "No email" }), { status: 200 });
    }

    // 1. Parse Items
    let items: any[] = [];
    if (metadata.item_count) {
        const count = parseInt(metadata.item_count, 10);
        for (let i = 0; i < count; i++) {
            const key = `item_${i}`;
            if (metadata[key]) {
                try {
                    items.push(JSON.parse(metadata[key]));
                } catch (e) {
                    console.error(`Failed to parse item ${i}`, e);
                }
            }
        }
    } else if (metadata.tulipType) {
        // Legacy single item support
        items.push({
            t: metadata.tulipType,
            n: metadata.name, // Display name
            // on: metadata.name, // Original Name not guaranteed available separate from display name in legacy, but acceptable.
            m: metadata.message,
            rn: metadata.recipientName, // Recipient Name
            f: metadata.formation,
            ds: metadata.deliveryStatus || "pending"
        });
    }

    if (items.length === 0) {
        console.error("No items found in order");
        return new Response(JSON.stringify({ received: true, error: "No items" }), { status: 200 });
    }

    // 2. Stock Management
    // Aggregate required stock
    const stockRequirements: Record<string, number> = {};
    items.forEach(item => {
        const type = item.t;
        if (type) {
            stockRequirements[type] = (stockRequirements[type] || 0) + 1;
        }
    });

    // Update Stripe Stock
    const remainingStockLog: string[] = [];
    if (PRODUCT_ID) {
        try {
            const product = await stripe.products.retrieve(PRODUCT_ID);
            const newMetadata = { ...product.metadata };
            let needsUpdate = false;

            Object.entries(stockRequirements).forEach(([type, count]) => {
                const stockKey = `stock_${type}`;
                const currentStock = parseInt(newMetadata[stockKey] || "0", 10);
                const newStock = Math.max(0, currentStock - count);
                
                if (currentStock !== newStock) {
                    newMetadata[stockKey] = newStock.toString();
                    needsUpdate = true;
                    remainingStockLog.push(`${type}: ${newStock} (was ${currentStock})`);
                } else {
                     remainingStockLog.push(`${type}: ${currentStock} (Unchanged/OOS)`);
                }
            });

            if (needsUpdate) {
                await stripe.products.update(PRODUCT_ID, { metadata: newMetadata });
                console.log("Stock updated:", remainingStockLog.join(", "));
            }
        } catch (err) {
            console.error("Failed to update stock:", err);
        }
    }

    // 3. Prepare Emails
    
    // items HTML builder helper
    const buildItemsHtml = (itemList: any[]) => {
        return itemList.map((item, idx) => `
            <div style="border-left: 4px solid #ec4899; padding-left: 12px; margin-bottom: 24px;">
                <p style="margin: 0 0 4px 0;"><strong>${item.t}</strong> (Pour: ${item.rn} - ${item.f})</p>
                <p style="margin: 0 0 4px 0; font-size: 0.9em; color: #555;">De: ${item.n}</p>
                <p style="margin: 0; font-style: italic; background: #f9f9f9; padding: 8px; border-radius: 4px;">"${item.m || ""}"</p>
            </div>
        `).join("");
    };

    // Customer Email
    const customerEmailHtml = generateEmailHtml({
        title: "Confirmation de ta commande",
        previewText: `Merci pour ta commande de ${items.length} tulipe(s) !`,
        content: `
            <h1>Merci pour ta commande !</h1>
            <p>Ta commande de <strong>${items.length} tulipe(s)</strong> a bien été enregistrée pour un total de <strong>${totalPrice}€</strong>.</p>
            
            <div class="details-box">
                <h3>Récapitulatif :</h3>
                ${buildItemsHtml(items)}
            </div>

            <p>Ta ou tes tulipe(s) seront livrées dans la dernière semaine avant les vacances !</p>
            <p>On t'envoie un email de confirmation dès que chaque tulipe sera livrée.</p>
        `
    });

    // Admin Emails (Group by Formation)
    const itemsByFormation: Record<string, any[]> = {};
    items.forEach(item => {
        const formation = item.f || "Autre";
        if (!itemsByFormation[formation]) itemsByFormation[formation] = [];
        itemsByFormation[formation].push(item);
    });

    const emailPromises: Promise<any>[] = [
        // Send Customer Email
        resend.emails.send({
            from: "Les tulipes d'Inter-Asso <tulipes@pay.inter-asso.fr>",
            to: [customerEmail],
            subject: "Confirmation de ta commande de Tulipe",
            html: customerEmailHtml,
        })
    ];

    // Send Admin Emails
    Object.entries(itemsByFormation).forEach(([formation, formationItems]) => {
        const adminEmail = FORMATION_BDE_EMAILS[formation] || "bdemmi@inter-asso.fr";
        
        const adminEmailHtml = generateEmailHtml({
            title: `Nouvelle commande (${formation}) ! 🌷`,
            previewText: `${formationItems.length} nouvelle(s) tulipe(s) pour ${formation}`,
            content: `
                <h1>Nouvelle commande !</h1>
                <p><strong>${formationItems.length}</strong> tulipe(s) commandée(s) pour <strong>${formation}</strong>.</p>
                
                <div class="details-box">
                    ${buildItemsHtml(formationItems)}
                    
                    <div style="margin-top: 16px; font-size: 0.8em; color: #777;">
                        <p>Stock mis à jour : ${remainingStockLog.join(" | ")}</p>
                    </div>

                    <div style="text-align: center; margin-top: 24px;">
                      <a href="https://mmi.inter-asso.fr/admin" style="display: inline-block; background-color: #ec4899; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Accéder aux commandes</a>
                    </div>
                </div>
            `
        });

        emailPromises.push(
            resend.emails.send({
                from: "Les tulipes d'Inter-Asso <tulipes@pay.inter-asso.fr>",
                to: [adminEmail],
                subject: `Nouvelle commande [${formation}]`,
                html: adminEmailHtml,
            })
        );
    });

    try {
        await Promise.all([
            ...emailPromises,
             // Mark as sent in Stripe
             stripe.paymentIntents.update(paymentIntent.id, {
                metadata: {
                    email_sent: "true"
                }
            })
        ]);
        console.log(`Emails sent for ${paymentIntent.id} (${items.length} items)`);
    } catch (emailError) {
        console.error("Error sending emails:", emailError);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
};
