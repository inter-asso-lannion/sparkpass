import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import tulipeRouge from "./assets/tulipes/tulipe_rouge.png";
import tulipeRose from "./assets/tulipes/tulipe_rose.png";
import tulipeBlanche from "./assets/tulipes/tulipe_blanche.png";
import banniere from "./assets/banniere.png";
import iconInformatique from "./assets/formation/informatique.png";
import iconMMI from "./assets/formation/mmi.png";
import iconRT from "./assets/formation/r&t.png";
import iconInfoCom from "./assets/formation/info-com.png";
import iconMP from "./assets/formation/mp.png";

import { PaymentModal } from "@/components/PaymentModal";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { TulipExpressPay } from "@/components/TulipExpressPay";
import "./Tulipes.css";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

type TulipColor = "rouge" | "rose" | "blanche";

const TULIPS: Record<
  TulipColor,
  {
    name: string;
    image: string;
    colorClass: string;
    price: number;
    theme: { primary: string; primaryForeground: string };
  }
> = {
  rouge: {
    name: "Rouge",
    image: tulipeRouge,
    colorClass: "bg-red-600",
    price: 0,
    theme: {
      primary: "0 72.2% 50.6%", // Red 600
      primaryForeground: "210 40% 98%",
    },
  },
  rose: {
    name: "Rose",
    image: tulipeRose,
    colorClass: "bg-pink-400",
    price: 0,
    theme: {
      primary: "330 81% 60%", // Pink 500 (slightly darker for contrast)
      primaryForeground: "210 40% 98%",
    },
  },
  blanche: {
    name: "Blanche",
    image: tulipeBlanche,
    colorClass: "bg-white border border-gray-200",
    price: 0,
    theme: {
      primary: "215 25% 27%", // Slate 800
      primaryForeground: "210 40% 98%",
    },
  },
};

const FORMATION_ICONS: Record<string, string> = {
  "BUT Informatique": iconInformatique,
  "BUT MMI": iconMMI,
  "BUT R&T": iconRT,
  "BUT Info-Com (Journalisme)": iconInfoCom,
  "BUT Info-Com (Parcours des Organisations)": iconInfoCom,
  "BUT Mesures Physiques": iconMP,
};
function Tulipes() {
  // Date limite : 12 février 2026 à 23:59:59
  const expirationDate = new Date("2026-02-12T23:59:59");
  const isExpired = new Date() > expirationDate;

  // Si la page est expirée, afficher un message d'erreur
  if (isExpired) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8 flex flex-col items-center justify-center gap-6">
        <Card className="w-full max-w-md text-center p-8">
          <div className="flex flex-col items-center gap-4">
            <img
              src={tulipeRouge}
              alt="Tulipe"
              className="w-32 h-32 object-contain opacity-50"
            />
            <CardTitle className="text-2xl">Vente terminée 🌷</CardTitle>
            <p className="text-muted-foreground">
              La vente de tulipes pour la Saint-Valentin est désormais terminée.
              Merci à tous pour votre participation !
            </p>
            <p className="text-sm text-muted-foreground">
              Rendez-vous l'année prochaine !
            </p>
            <Button asChild className="mt-4">
              <a href="/">Retour à l'accueil</a>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const [selectedColor, setSelectedColor] = useState<TulipColor>("rouge");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [customerEmail, setCustomerEmail] = useState("");
  const [recipientFirstName, setRecipientFirstName] = useState("");
  const [recipientLastName, setRecipientLastName] = useState("");
  // recipientName is now a derived value or constructed when needed
  const [formation, setFormation] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [tulipPrice, setTulipPrice] = useState(0);
  const [stock, setStock] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const [errors, setErrors] = useState<{
    customerEmail?: string;
    name?: string;
    recipientFirstName?: string;
    recipientLastName?: string;
    formation?: string;
    message?: string;
  }>({});

  useEffect(() => {
    fetch("/.netlify/functions/get-product-price")
      .then((res) => res.json())
      .then((data) => {
        if (data.amount) {
          setTulipPrice(data.amount);
        }
        if (data.metadata) {
          setStock(data.metadata);
        }
      })
      .catch((err) => console.error("Failed to fetch price", err));
  }, []);

  useEffect(() => {
    const theme = TULIPS[selectedColor].theme;
    document.documentElement.style.setProperty("--primary", theme.primary);
    document.documentElement.style.setProperty(
      "--primary-foreground",
      theme.primaryForeground,
    );

    // Also update ring color to match primary often helps with focus states
    document.documentElement.style.setProperty("--ring", theme.primary);

    return () => {
      // Reset to defaults on unmount
      // Values taken from index.css base layer
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--primary-foreground");
      document.documentElement.style.removeProperty("--ring");
    };
  }, [selectedColor]);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!customerEmail) {
      newErrors.customerEmail = "L'email est requis.";
      isValid = false;
    } else if (!emailRegex.test(customerEmail)) {
      newErrors.customerEmail = "Format d'email invalide.";
      isValid = false;
    }

    // Name validation (if not anonymous)
    if (!isAnonymous && !name.trim()) {
      newErrors.name = "Le nom est requis (ou cochez Anonyme).";
      isValid = false;
    }

    // Recipient Name validation
    if (!recipientFirstName.trim()) {
      newErrors.recipientFirstName = "Le prénom du destinataire est requis.";
      isValid = false;
    }
    if (!recipientLastName.trim()) {
      newErrors.recipientLastName = "Le nom du destinataire est requis.";
      isValid = false;
    }

    // Formation validation
    if (!formation) {
      newErrors.formation = "La formation est requise.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleOrder = async () => {
    if (!validateForm()) {
      toast({
        title: "Formulaire incomplet ou invalide",
        description: "Veuillez corriger les erreurs affichées.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        "/.netlify/functions/create-payment-intent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tulipType: selectedColor,
            name,
            message,
            isAnonymous,
            customerEmail,
            recipientName: `${recipientFirstName} ${recipientLastName}`.trim(),
            recipientFirstName,
            recipientLastName,
            formation,
          }),
        },
      );

      const data = await response.json();

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setIsPaymentModalOpen(true);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'initialiser le paiement. Réessayez.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error starting payment:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background lg:p-8 flex flex-col items-center justify-start sm:justify-center gap-6 sm:gap-8 pb-8">
      <div className="text-center space-y-3 w-full max-w-5xl mx-auto">
        <img
          src={banniere}
          alt="Tulipes de l'IUT"
          className="w-full h-auto rounded-none sm:rounded-3xl shadow-lg object-cover"
        />
        <p className="text-md text-muted-foreground px-4 sm:px-0 max-w-2xl mx-auto">
          Fais plaisir à quelqu'un de l'IUT avec une fleur personnalisée. Écris
          ton message, choisis ta couleur, et reste anonyme si tu préfères.
          Parfois, un petit geste fait toute la différence!
        </p>
      </div>

      <Card className="w-full max-w-3xl text-center mx-4 sm:mx-0 border-x-0 sm:border-x rounded-none sm:rounded-xl shadow-none sm:shadow-sm">
        <CardHeader>
          <CardTitle>Personnalise ta fleur</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="relative w-full h-64 flex justify-center bg-white rounded-xl overflow-hidden">
            {/* Texte du message en arrière-plan avec dégradé */}
            {message && (
              <div className="absolute inset-0 flex items-center justify-center p-4 overflow-hidden">
                <p
                  className="text-gray-200 text-lg font-medium text-center leading-relaxed max-w-full break-words"
                  style={{
                    maskImage:
                      "radial-gradient(ellipse at center, transparent 30%, black 70%)",
                    WebkitMaskImage:
                      "radial-gradient(ellipse at center, transparent 30%, black 70%)",
                  }}
                >
                  {message}
                </p>
              </div>
            )}
            {(Object.keys(TULIPS) as TulipColor[]).map((color) => (
              <img
                key={color}
                src={TULIPS[color].image}
                alt={`Tulipe ${TULIPS[color].name}`}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ease-in-out ${
                  selectedColor === color ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
            {/* Petit papier avec le nom du destinataire + icône formation */}
            {(recipientFirstName || recipientLastName) && (
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 transition-all duration-300 ease-in-out z-10">
                <div className="max-w-[140px] bg-amber-50 border border-amber-200 rounded-sm shadow-lg px-3 py-2 transform -rotate-2">
                  <p className="text-xs text-amber-900 font-medium truncate text-center">
                    Pour: {`${recipientFirstName} ${recipientLastName}`}
                  </p>
                </div>
                {formation && FORMATION_ICONS[formation] && (
                  <img
                    src={FORMATION_ICONS[formation]}
                    alt={formation}
                    className="w-10 h-10 object-contain drop-shadow-md transform rotate-3 transition-all duration-300"
                  />
                )}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            {(Object.keys(TULIPS) as TulipColor[]).map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full transition-all duration-200 ${
                  TULIPS[color].colorClass
                } ${
                  selectedColor === color
                    ? "ring-2 ring-offset-2 ring-primary scale-110"
                    : "hover:scale-110 opacity-80 hover:opacity-100"
                }`}
                aria-label={`Choisir la tulipe ${TULIPS[color].name}`}
              />
            ))}
          </div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {TULIPS[selectedColor].name} -{" "}
            {tulipPrice > 0 ? `${tulipPrice}€` : "..."}
          </p>

          <div className="w-full grid gap-2 text-left">
            <Label>Pour qui ?</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Input
                  placeholder="Prénom"
                  value={recipientFirstName}
                  onChange={(e) => {
                    setRecipientFirstName(e.target.value);
                    if (e.target.value)
                      setErrors((prev) => ({
                        ...prev,
                        recipientFirstName: undefined,
                      }));
                  }}
                  className={errors.recipientFirstName ? "border-red-500" : ""}
                />
                {errors.recipientFirstName && (
                  <p className="text-xs text-red-500">
                    {errors.recipientFirstName}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Input
                  placeholder="Nom"
                  value={recipientLastName}
                  onChange={(e) => {
                    setRecipientLastName(e.target.value);
                    if (e.target.value)
                      setErrors((prev) => ({
                        ...prev,
                        recipientLastName: undefined,
                      }));
                  }}
                  className={errors.recipientLastName ? "border-red-500" : ""}
                />
                {errors.recipientLastName && (
                  <p className="text-xs text-red-500">
                    {errors.recipientLastName}
                  </p>
                )}
              </div>
            </div>

            <Select
              onValueChange={(val) => {
                setFormation(val);
                if (val)
                  setErrors((prev) => ({ ...prev, formation: undefined }));
              }}
              value={formation}
            >
              <SelectTrigger
                className={errors.formation ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Choisir la formation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUT Informatique">
                  BUT Informatique
                </SelectItem>
                <SelectItem value="BUT MMI">BUT MMI</SelectItem>
                <SelectItem value="BUT R&T">BUT R&T</SelectItem>
                <SelectItem value="BUT Info-Com (Journalisme)">
                  BUT Info-Com (Journalisme)
                </SelectItem>
                <SelectItem value="BUT Info-Com (Parcours des Organisations)">
                  BUT Info-Com (Parcours des Organisations)
                </SelectItem>
                <SelectItem value="BUT Mesures Physiques">
                  BUT Mesures Physiques
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.formation && (
              <p className="text-xs text-red-500">{errors.formation}</p>
            )}
          </div>

          <div className="w-full grid gap-2 text-left">
            <Label htmlFor="message">Ton message</Label>
            <Textarea
              id="message"
              placeholder="Écris ton petit mot ici..."
              maxLength={350}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/350
            </p>
          </div>

          <div className="w-full grid gap-2 text-left">
            <div className="flex items-center justify-between">
              <Label htmlFor="name">De la part de</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(checked) => {
                    setIsAnonymous(checked);
                    if (checked) {
                      setErrors((prev) => ({ ...prev, name: undefined }));
                    }
                  }}
                />
                <Label htmlFor="anonymous" className="cursor-pointer">
                  Anonyme
                </Label>
              </div>
            </div>
            <Input
              id="name"
              type="text"
              placeholder="Ton prénom et nom"
              value={isAnonymous ? "" : name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value)
                  setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              disabled={isAnonymous}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name}</p>
            )}

            <Label htmlFor="email">Ton email (pour le reçu)</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemple@email.com"
              value={customerEmail}
              onChange={(e) => {
                setCustomerEmail(e.target.value);
                if (e.target.value)
                  setErrors((prev) => ({ ...prev, customerEmail: undefined }));
              }}
              className={errors.customerEmail ? "border-red-500" : ""}
            />
            {errors.customerEmail && (
              <p className="text-xs text-red-500">{errors.customerEmail}</p>
            )}
            <Label htmlFor="email" className="text-xs text-muted-foreground">
              Inter-Asso n'aura pas accès à ton mail, il servira uniquement à
              t'envoyer le reçu
            </Label>
          </div>

          <div className="w-full flex flex-col items-center gap-3 mt-4">
            {tulipPrice > 0 && (
              <Elements
                stripe={stripePromise}
                options={{
                  mode: "payment",
                  amount: Math.round(tulipPrice * 100), // Convert to cents
                  currency: "eur",
                  appearance: { theme: "stripe" },
                }}
              >
                <TulipExpressPay
                  price={tulipPrice}
                  orderDetails={{
                    tulipType: selectedColor,
                    name,
                    message,
                    isAnonymous,
                    customerEmail,
                    recipientName:
                      `${recipientFirstName} ${recipientLastName}`.trim(),
                    recipientFirstName,
                    recipientLastName,
                    formation,
                    price: tulipPrice,
                  }}
                  validateForm={validateForm}
                  disabled={
                    tulipPrice === 0 ||
                    parseInt(stock[`stock_${selectedColor}`] || "0", 10) <= 0 ||
                    !recipientFirstName ||
                    !recipientLastName ||
                    !formation ||
                    !customerEmail ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail) ||
                    (!isAnonymous && !name)
                  }
                />
              </Elements>
            )}

            <Button
              onClick={handleOrder}
              className="w-full h-12"
              disabled={
                tulipPrice === 0 ||
                parseInt(stock[`stock_${selectedColor}`] || "0", 10) <= 0
              }
            >
              Commander ({tulipPrice > 0 ? `${tulipPrice}€` : "..."})
            </Button>

            <p
              className={`text-sm ${
                parseInt(stock[`stock_${selectedColor}`] || "0", 10) < 10
                  ? "text-red-600 font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {parseInt(stock[`stock_${selectedColor}`] || "0", 10) > 0
                ? `Stock restant : ${stock[`stock_${selectedColor}`]}`
                : "Rupture de stock"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center space-y-2 max-w-lg mt-4 px-4 sm:px-0">
        <p className="text-xs text-muted-foreground font-medium">
          🎓 Réservé aux étudiants de l'IUT de Lannion
        </p>
        <p className="text-xs text-muted-foreground">
          Une initiative de l'<span className="font-semibold">INTER-ASSO</span>,
          regroupant les BDE :
          <span className="block mt-1 text-muted-foreground/80">
            MMI Spark • Alive (Info) • MPintes (MP) • Kart'l (R&T)
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          Avec l'aide de l'association Well'Com
        </p>
        <p className="text-xs text-muted-foreground/60 pt-2">
          L'Inter-Asso se réserve le droit de refuser toute commande contenant
          des propos inappropriés.
        </p>
        <p className="text-xs text-muted-foreground/60 pt-2">
          Site réalisé avec amour (c'est le cas de le dire) par{" "}
          <a
            href="https://tomthings.fr"
            target="_blank"
            className="underline hover:text-primary transition-colors"
          >
            Tom Hélière
          </a>
        </p>
        <a
          href="https://inter-asso.fr"
          target="_blank"
          className="inline-block pt-4"
        >
          <img
            src="https://inter-asso.fr/images/clubs/Logo-Inter-Asso.webp"
            alt="Inter-Asso"
            className="h-12 opacity-60 hover:opacity-100 transition-opacity"
          />
        </a>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        clientSecret={clientSecret}
        orderDetails={{
          tulipType: selectedColor,
          name,
          message,
          isAnonymous,
          customerEmail,
          recipientName: `${recipientFirstName} ${recipientLastName}`.trim(),
          recipientFirstName,
          recipientLastName,
          formation,
          price: tulipPrice,
        }}
      />
    </div>
  );
}

export default Tulipes;
