import { useLocation, Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Printer } from "lucide-react";

export default function Success() {
  const location = useLocation();
  const state = location.state as {
    cartItems?: {
      tulipType: string;
      name: string;
      recipientName: string;
      formation: string;
      message: string;
      price: number;
      isAnonymous: boolean;
      customerEmail: string;
    }[];
    // Legacy support
    orderDetails?: {
      tulipType: string;
      name: string;
      recipientName: string;
      formation: string;
      message: string;
      price: number;
      isAnonymous: boolean;
      customerEmail: string;
    };
    paymentId?: string;
  } | null;

  if (!state) {
    return <Navigate to="/" replace />;
  }

  const items =
    state.cartItems || (state.orderDetails ? [state.orderDetails] : []);
  const paymentId = state.paymentId;
  const customerEmail = items[0]?.customerEmail || "";

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col items-center justify-center gap-8 print:p-0 print:bg-white">
      <Card className="w-full max-w-2xl text-center print:shadow-none print:border-none">
        <CardHeader className="flex flex-col items-center gap-4">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
          <CardTitle className="text-3xl">Paiement Réussi !</CardTitle>
          <p className="text-muted-foreground print:hidden">
            Merci pour votre commande. Un email de confirmation a été envoyé à{" "}
            <span className="font-semibold text-foreground">
              {customerEmail}
            </span>
            .
          </p>
        </CardHeader>
        <CardContent className="space-y-6 text-left">
          <div className="bg-muted/50 p-6 rounded-lg space-y-6 print:bg-transparent print:p-0 print:border print:border-gray-200">
            <h3 className="font-semibold text-lg border-b pb-2 mb-4">
              Récapitulatif de la commande
            </h3>

            {items.map((item, index) => (
              <div
                key={index}
                className={`space-y-4 ${index > 0 ? "pt-4 border-t border-gray-200" : ""}`}
              >
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-muted-foreground">Type de tulipe</div>
                  <div className="font-medium capitalize">{item.tulipType}</div>

                  <div className="text-muted-foreground">Prix</div>
                  <div className="font-medium">{item.price}€</div>

                  <div className="text-muted-foreground">De la part de</div>
                  <div className="font-medium">
                    {item.isAnonymous ? "Anonyme" : item.name}
                  </div>

                  <div className="text-muted-foreground">Pour</div>
                  <div className="font-medium">
                    {item.recipientName} ({item.formation})
                  </div>
                </div>

                <div className="mt-2 text-sm">
                  <div className="text-muted-foreground mb-1">Message</div>
                  <p className="italic text-foreground bg-background p-2 rounded border print:border-gray-300">
                    "{item.message}"
                  </p>
                </div>
              </div>
            ))}

            {paymentId && (
              <div className="pt-4 border-t text-xs text-muted-foreground flex justify-between">
                <span>Référence paiement</span>
                <span className="font-mono">{paymentId}</span>
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-center print:hidden">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimer le reçu
            </Button>
            <Button asChild>
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="hidden print:block text-center text-sm text-gray-500 mt-8">
        <p>BDE MMI Lannion - Inter-asso</p>
        <p>Ce document vaut justificatif de paiement.</p>
      </div>
    </div>
  );
}
