import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { useNavigate } from "react-router-dom";

// Initialize Stripe outside of component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface OrderDetails {
  id?: string;
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

interface PaymentModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  clientSecret: string;
  cartItems: OrderDetails[];
}

function CheckoutForm({
  cartItems,
  clientSecret,
}: {
  cartItems: OrderDetails[];
  clientSecret: string;
  onClose: (open: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalAmount = cartItems.reduce((acc, item) => acc + item.price, 0);

  const onExpressConfirm = async () => {
    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setErrorMessage(submitError.message ?? "Une erreur est survenue");
      setIsLoading(false);
      return;
    }

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret: clientSecret, // Use the prop
      confirmParams: {
        return_url: window.location.origin + "/success",
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message ?? "Une erreur est survenue");
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      navigate("/success", {
        state: {
          cartItems,
          paymentId: paymentIntent.id,
        },
      });
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message ?? "Une erreur est survenue");
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      navigate("/success", {
        state: {
          cartItems,
          paymentId: paymentIntent.id,
        },
      });
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-6">
      <ExpressCheckoutElement onConfirm={onExpressConfirm} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou payer par carte
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <PaymentElement />
        {errorMessage && (
          <div className="text-red-500 text-sm">{errorMessage}</div>
        )}
        <Button disabled={!stripe || isLoading} className="w-full">
          {isLoading ? "Traitement..." : `Payer ${totalAmount}€`}
        </Button>
      </form>
    </div>
  );
}

export function PaymentModal({
  isOpen,
  onClose,
  clientSecret,
  cartItems,
}: PaymentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Paiement sécurisé</DialogTitle>
        </DialogHeader>
        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm
              cartItems={cartItems}
              clientSecret={clientSecret}
              onClose={onClose}
            />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  );
}
