import { useState } from "react";
import {
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type {
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementClickEvent,
} from "@stripe/stripe-js";

interface OrderDetails {
  tulipType: string;
  name: string;
  message: string;
  isAnonymous: boolean;
  customerEmail: string;
  recipientName: string;
  formation: string;
  price: number;
}

interface TulipExpressPayProps {
  price: number;
  orderDetails: OrderDetails;
  validateForm: () => boolean;
  disabled: boolean;
}

export function TulipExpressPay({
  orderDetails,
  validateForm,
  disabled,
}: TulipExpressPayProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePostPayment = async (paymentId: string) => {
    try {
      const response = await fetch("/.netlify/functions/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...orderDetails,
          toEmail: orderDetails.customerEmail,
        }),
      });

      // Even if email fails, payment is done, so we go to success
      navigate("/success", {
        state: {
          orderDetails: orderDetails,
          paymentId: paymentId,
        },
      });

      if (!response.ok) {
        toast({
          title: "Paiement réussi mais erreur d'envoi d'email",
          description: "Contactez-nous si vous ne recevez rien.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de l'email.",
        variant: "destructive",
      });
      // Still navigate to success
      navigate("/success", {
        state: {
          orderDetails: orderDetails,
          paymentId: paymentId,
        },
      });
    }
  };

  const onConfirm = async (event: StripeExpressCheckoutElementConfirmEvent) => {
    if (!stripe || !elements) return;

    // 1. Validate Form logic
    const isValid = validateForm();
    if (!isValid) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs avant de payer.",
        variant: "destructive",
      });
      return;
    }

    // 2. Form is valid. Create Intent.
    try {
      const response = await fetch(
        "/.netlify/functions/create-payment-intent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tulipType: orderDetails.tulipType }),
        },
      );
      const data = await response.json();

      if (!data.clientSecret) {
        throw new Error("Failed to create payment intent");
      }

      // 3. Confirm Payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: data.clientSecret,
        confirmParams: {
          return_url: window.location.origin + "/success",
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message ?? "Erreur de paiement");
        toast({
          title: "Erreur de paiement",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        await handlePostPayment(paymentIntent.id);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur système",
        description: "Impossible d'initialiser le paiement.",
        variant: "destructive",
      });
    }
  };

  const onClick = (event: StripeExpressCheckoutElementClickEvent) => {
    // Optional: Check validation *before* showing the sheet
    const isValid = validateForm();
    if (!isValid) {
      // Do NOT call resolve() to prevent opening the sheet
      toast({
        title: "Champs manquants",
        description:
          "Veuillez remplir le formulaire avant de payer (Nom, Message, etc.)",
        variant: "destructive",
      });
    } else {
      event.resolve();
    }
  };

  return (
    <div
      className={`w-full mb-3 transition-opacity duration-200 ${
        disabled ? "opacity-50 pointer-events-none grayscale" : ""
      }`}
    >
      {errorMessage && (
        <div className="text-red-500 text-xs mb-2">{errorMessage}</div>
      )}
      <ExpressCheckoutElement onConfirm={onConfirm} onClick={onClick} />
    </div>
  );
}
