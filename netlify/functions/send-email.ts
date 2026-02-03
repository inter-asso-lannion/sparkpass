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
  "BUT Informatique": "tom.heliere@etudiant.univ-rennes.fr",
  "BUT MMI": "tom.heliere@etudiant.univ-rennes.fr",
  "BUT R&T": "tom.heliere@etudiant.univ-rennes.fr",
  "BUT Info-Com (Journalisme)": "tom.heliere@etudiant.univ-rennes.fr",
  "BUT Info-Com (Parcours des Organisations)": "tom.heliere@etudiant.univ-rennes.fr",
  "BUT Mesures Physiques": "tom.heliere@etudiant.univ-rennes.fr",
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
    const body = await req.json();
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
    } = body;

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
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
        return new Response(
          JSON.stringify({ error: "Missing paymentIntentId" }),
          { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );
    }

    // 1. Retrieve the PaymentIntent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // 2. Verify status
    if (paymentIntent.status !== 'succeeded') {
      return new Response(
        JSON.stringify({ error: "Payment not successful" }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // 3. Check replay protection
    if (paymentIntent.metadata.email_sent === 'true') {
        // Already processed, just return success to be idempotent
         return new Response(JSON.stringify({ success: true, message: "Already processed" }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
    }

    // 4. Extract trusted data from metadata
    const metadata = paymentIntent.metadata;
    const trustedTulipType = metadata.tulipType;
    const trustedPrice = (paymentIntent.amount / 100).toString(); // Stripe amount is in cents
    const trustedName = metadata.name; // This is "Anonyme" or real name based on create-payment-intent logic
    // But wait, create-payment-intent logic: name: String((isAnonymous ? "Anonyme" : name) || "")
    // So metadata.name is already the display name we want.
    const trustedIsAnonymous = metadata.isAnonymous === 'true'; 
    // metadata.name handles the anonymity, but let's stick to what we have or logic below.
    // In create-payment-intent: name: String((isAnonymous ? "Anonyme" : name) || "")
    // So trustedName IS the name to show "De la part de".
    
    // However, send-email logic used `name` (original input) and `isAnonymous` boolean.
    // Let's rely on metadata fields fully.
    
    const displayFrom = trustedName; 
    const trustedMessage = metadata.message;
    const trustedRecipientName = metadata.recipientName;
    const trustedFormation = metadata.formation;
    const trustedCustomerEmail = metadata.customerEmail;
    
    // NOTE: Override toEmail with one from metadata to prevent phishing?
    // The previous code trusted `toEmail` from body. 
    // Secure approach: Use `metadata.customerEmail`.
    const targetEmail = trustedCustomerEmail;

    if (!targetEmail) {
         return new Response(
          JSON.stringify({ error: "No email found in order" }),
          { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );
    }

    let remainingStock = "Inconnu";
    let currentStock = 0;
    const stockKey = `stock_${trustedTulipType}`;

    // Fetch and decrement stock logic
    if (PRODUCT_ID && trustedTulipType) {
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
            console.warn("Stock processed but was 0 or less:", currentStock);
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
                        <span>${trustedTulipType}</span>
                    </li>
                    <li>
                        <strong>Prix</strong>
                        <span>${trustedPrice}€</span>
                    </li>
                    <li>
                        <strong>De la part de</strong>
                        <span>${displayFrom}</span>
                    </li>
                    <li>
                        <strong>Pour</strong>
                        <span>${trustedRecipientName} (${trustedFormation})</span>
                    </li>
                    <li>
                        <strong>Message</strong>
                        <span style="font-style: italic;">"${trustedMessage}"</span>
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
        previewText: `Nouvelle commande de ${displayFrom}`,
        content: `
            <h1>Nouvelle commande !</h1>
            <p>Détails de la commande reçue :</p>
            
            <div class="details-box">
                <ul class="details-list">
                    <li>
                        <strong>Type de tulipe</strong>
                        <span>${trustedTulipType}</span>
                    </li>
                    <li>
                        <strong>Prix</strong>
                        <span>${trustedPrice}€</span>
                    </li>
                    <li>
                        <strong>De la part de</strong>
                        <span>${displayFrom}</span>
                    </li>
                    <li>
                        <strong>Pour</strong>
                        <span>${trustedRecipientName} (${trustedFormation})</span>
                    </li>
                    <li>
                        <strong>Message</strong>
                        <span style="font-style: italic;">"${trustedMessage}"</span>
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

    // Send to Customer and Admin separately
    await Promise.all([
      resend.emails.send({
        from: "Les tulipes d'Inter-Asso <tulipes@pay.inter-asso.fr>",
        to: [targetEmail],
        subject: "Confirmation de ta commande de Tulipe",
        html: customerEmailHtml,
      }),
      resend.emails.send({
        from: "Les tulipes d'Inter-Asso <tulipes@pay.inter-asso.fr>",
        to: [FORMATION_BDE_EMAILS[trustedFormation] || "bdemmi@inter-asso.fr"],
        subject: "Nouvelle commande de Tulipe :)",
        html: adminEmailHtml,
      }),
      // Mark as sent in Stripe to prevent replay
      stripe.paymentIntents.update(paymentIntentId, {
        metadata: {
            email_sent: "true"
        }
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
