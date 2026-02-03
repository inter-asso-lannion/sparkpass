import { Context } from "@netlify/functions";
import { Resend } from "resend";
import Stripe from "stripe";
import { generateEmailHtml } from "./utils/email-template";

const resend = new Resend(process.env.RESEND_API_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-12-15.clover",
});

const PRODUCT_ID = process.env.STRIPE_PRODUCT_ID;

// Mapping des formations vers les emails BDE Inter-Asso
const FORMATION_BDE_EMAILS: Record<string, string> = {
  "BUT Informatique": "bdeinfo@inter-asso.fr",
  "BUT MMI": "bdemmi@inter-asso.fr",
  "BUT R&T": "bdert@inter-asso.fr",
  "BUT Info-Com (Journalisme)": "bdemmi@inter-asso.fr",
  "BUT Info-Com (Parcours des Organisations)": "bdemmi@inter-asso.fr",
  "BUT Mesures Physiques": "bdemp@inter-asso.fr",
};

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
    const { 
      type = "create", 
      toEmail, 
      name, 
      tulipType, 
      message, 
      isAnonymous, 
      price, 
      recipientName: providedRecipientName,
      recipientFirstName,
      recipientLastName,
      formation 
    } = await req.json();

    const recipientName = providedRecipientName || (recipientFirstName && recipientLastName ? `${recipientFirstName} ${recipientLastName}` : "");

    if (!toEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // --- DELIVERY EMAIL ---
    if (type === "delivery") {
        const htmlContent = generateEmailHtml({
            title: "Ta Tulipe a été livrée ! 🌷",
            previewText: `Ta commande pour ${recipientName || "le destinataire"} a bien été livrée !`,
            content: `
                <h1>Bonne nouvelle :)</h1>
                <p>Ta commande pour <strong>${recipientName || "le destinataire"}</strong> ${formation ? `(${formation})` : ""} a bien été livrée !</p>
                <div class="details-box" style="text-align: center; border-left: 4px solid #10b981;">
                    <p style="margin: 0; color: #10b981; font-weight: 600;">Livraison effectuée avec succès</p>
                </div>
                <p>Merci pour ta participation,</p>
                <p>L'équipe INTER-ASSO</p>
            `
        });

        await resend.emails.send({
            from: "Les tulipes d'INTER-ASSO <tulipes@pay.inter-asso.fr>",
            to: [toEmail],
            subject: "Ta Tulipe a été livrée ! 🌷",
            html: htmlContent,
        });

        return new Response(JSON.stringify({ success: true, message: "Delivery email sent" }), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
        });
    }

    // --- ORDER CONFIRMATION EMAIL (with stock decrement) ---
    // Validate required fields for creation
    if (!tulipType || !price) {
        return new Response(
          JSON.stringify({ error: "Missing required fields for order creation" }),
          { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
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
    const customerEmailHtml = generateEmailHtml({
        title: "Confirmation de ta commande",
        previewText: "Merci pour ta commande de Tulipe !",
        content: `
            <h1>Merci pour ta commande !</h1>
            <p>Ta commande a bien été enregistrée. Voici le récap :</p>
            
            <div class="details-box">
                <ul class="details-list">
                    <li>
                        <strong>Type de tulipe</strong>
                        <span>${tulipType}</span>
                    </li>
                    <li>
                        <strong>Prix</strong>
                        <span>${price}€</span>
                    </li>
                    <li>
                        <strong>De la part de</strong>
                        <span>${isAnonymous ? "Anonyme" : name}</span>
                    </li>
                    <li>
                        <strong>Pour</strong>
                        <span>${recipientName} (${formation})</span>
                    </li>
                    <li>
                        <strong>Message</strong>
                        <span style="font-style: italic;">"${message}"</span>
                    </li>
                </ul>
            </div>

            <p>Ta tulipe sera livrée dans la dernière semaine avant les vacances !</p>
            <p>On t'envoie un email de confirmation dès que ta tulipe sera livrée.</p>
        `
    });

    // Admin email content
    const adminEmailHtml = generateEmailHtml({
        title: "Nouvelle commande ! 🌷",
        previewText: `Nouvelle commande de ${isAnonymous ? "Anonyme" : name}`,
        content: `
            <h1>Nouvelle commande !</h1>
            <p>Détails de la commande reçue :</p>
            
            <div class="details-box">
                <ul class="details-list">
                    <li>
                        <strong>Type de tulipe</strong>
                        <span>${tulipType}</span>
                    </li>
                    <li>
                        <strong>Prix</strong>
                        <span>${price}€</span>
                    </li>
                    <li>
                        <strong>De la part de</strong>
                        <span>${isAnonymous ? "Anonyme" : name}</span>
                    </li>
                    <li>
                        <strong>Pour</strong>
                        <span>${recipientName} (${formation})</span>
                    </li>
                    <li>
                        <strong>Message</strong>
                        <span style="font-style: italic;">"${message}"</span>
                    </li>
                    <li>
                        <strong>Stock restant</strong>
                        <span>${remainingStock}</span>
                    </li>
                </ul>
                <div style="text-align: center; margin-top: 24px;">
                  <a href="https://mmi.inter-asso.fr/admin" style="display: inline-block; background-color: #ec4899; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Accéder aux commandes</a>
                </div>
            </div>
        `
    });

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
        to: [FORMATION_BDE_EMAILS[formation] || "bdemmi@inter-asso.fr"],
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
