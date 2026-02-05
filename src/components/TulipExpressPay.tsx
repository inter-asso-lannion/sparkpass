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
  recipientFirstName?: string;
  recipientLastName?: string;
  formation: string;
  price: number;
}

interface TulipExpressPayProps {
  price: number;
  orderDetails: OrderDetails | null; // Null if using cartItems
  cartItems?: OrderDetails[];
  validateForm: () => boolean;
  disabled: boolean;
}

export function TulipExpressPay({
  orderDetails,
  cartItems,
  validateForm,
  disabled,
}: TulipExpressPayProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onConfirm = async (
    _event: StripeExpressCheckoutElementConfirmEvent,
  ) => {
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

    // Determine payload
    let payload = {};
    let finalItems: OrderDetails[] = [];

    if (cartItems && cartItems.length > 0) {
      // Multi-item cart
      payload = {
        items: cartItems.map((item) => ({
          ...item,
          customerEmail: item.customerEmail || cartItems[0].customerEmail, // Global email
        })),
        customerEmail: cartItems[0].customerEmail,
      };
      finalItems = cartItems;
    } else if (orderDetails) {
      // Single item fallback
      payload = {
        items: [{ ...orderDetails }],
        customerEmail: orderDetails.customerEmail,
      };
      finalItems = [orderDetails];
    } else {
      console.error("No items to process");
      return;
    }

    // 2. Form is valid. Create Intent.
    try {
      const response = await fetch(
        "/.netlify/functions/create-payment-intent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
        navigate("/success", {
          state: {
            cartItems: finalItems, // Pass normalized array
            paymentId: paymentIntent.id,
          },
        });
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
