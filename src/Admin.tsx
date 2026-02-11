import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Icons
import iconInformatique from "./assets/formation/informatique.png";
import iconMMI from "./assets/formation/mmi.png";
import iconRT from "./assets/formation/r&t.png";
import iconInfoCom from "./assets/formation/info-com.png";
import iconMP from "./assets/formation/mp.png";
import iconPersonnel from "./assets/formation/personnel.png";

const FORMATION_CONFIG: Record<
  string,
  {
    color: string;
    icon: string;
    bg: string;
    text: string;
    border: string;
    gradient: string;
  }
> = {
  "BUT Informatique": {
    color: "bg-blue-600",
    icon: iconInformatique,
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    gradient: "from-blue-500 to-blue-600",
  },
  "BUT MMI": {
    color: "bg-amber-500",
    icon: iconMMI,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    gradient: "from-amber-400 to-amber-500",
  },
  "BUT R&T": {
    color: "bg-red-500",
    icon: iconRT,
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    gradient: "from-red-400 to-red-500",
  },
  "BUT Info-Com (Journalisme)": {
    color: "bg-purple-500",
    icon: iconInfoCom,
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    gradient: "from-purple-400 to-purple-500",
  },
  "BUT Info-Com (Parcours des Organisations)": {
    color: "bg-purple-500",
    icon: iconInfoCom,
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    gradient: "from-purple-400 to-purple-500",
  },
  "BUT Mesures Physiques": {
    color: "bg-emerald-600",
    icon: iconMP,
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    gradient: "from-emerald-400 to-emerald-600",
  },
  "Personnel de l'IUT": {
    color: "bg-slate-600",
    icon: iconPersonnel,
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    gradient: "from-slate-500 to-slate-600",
  },
};

const DEFAULT_CONFIG = {
  color: "bg-gray-500",
  icon: "",
  bg: "bg-gray-50",
  text: "text-gray-700",
  border: "border-gray-200",
  gradient: "from-gray-400 to-gray-500",
};

interface Order {
  id: string;
  created: number;
  amount: number;
  status: string;
  metadata: {
    tulipType?: string;
    name?: string;
    message?: string;
    recipientName?: string;
    formation?: string;
    customerEmail?: string;
    deliveryStatus?: string;
    isAnonymous?: string;
    firstName?: string;
    recipientFirstName?: string;
    recipientLastName?: string;
    recipient_name?: string;
    customer_email?: string;
    delivery_status?: string;
    is_anonymous?: string;
    product_id?: string;
    [key: string]: any;
  };
}

// Order Card Component for Mobile
function OrderCard({
  order,
  toggleStatus,
  onDelete,
  onPrint,
}: {
  order: Order;
  toggleStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onPrint: (order: Order) => void;
}) {
  const getMeta = (key: string, altKey?: string) =>
    order.metadata[key] || (altKey ? order.metadata[altKey] : undefined);

  const fmt = getMeta("formation") || "Inconnu";
  const deliveryStatus =
    getMeta("deliveryStatus", "delivery_status") || "pending";
  getMeta("deliveryStatus", "delivery_status") || "pending";
  const recipientFirstName = getMeta("recipientFirstName");
  const recipientLastName = getMeta("recipientLastName");
  const recipientName =
    recipientFirstName && recipientLastName
      ? `${recipientFirstName} ${recipientLastName}`
      : getMeta("recipientName", "recipient_name");
  const name = getMeta("name");
  const isAnonymous = getMeta("isAnonymous", "is_anonymous");
  const message = getMeta("message");
  const tulipType = getMeta("tulipType", "tulip_type") || "rouge";

  const config = FORMATION_CONFIG[fmt] || DEFAULT_CONFIG;

  let tulipBadgeColor = "bg-gray-100 text-gray-800";
  let tulipEmoji = "🌷";
  if (tulipType === "rose") {
    tulipBadgeColor = "bg-pink-100 text-pink-800 border-pink-200";
    tulipEmoji = "🌸";
  } else if (tulipType === "blanche") {
    tulipBadgeColor = "bg-slate-50 text-slate-800 border-slate-200";
    tulipEmoji = "🤍";
  } else {
    tulipBadgeColor = "bg-red-100 text-red-800 border-red-200";
    tulipEmoji = "❤️";
  }

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all duration-300 ${
        deliveryStatus === "delivered"
          ? "border-green-200 bg-green-50/30"
          : "border-gray-200 hover:border-primary/30 hover:shadow-md"
      }`}
    >
      {/* Header with status indicator */}
      <div
        className={`px-4 py-3 flex items-center justify-between ${
          deliveryStatus === "delivered"
            ? "bg-gradient-to-r from-green-500 to-emerald-500"
            : "bg-gradient-to-r from-amber-400 to-orange-400"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-white text-lg">{tulipEmoji}</span>
          <span className="text-white font-semibold text-sm">
            {deliveryStatus === "delivered" ? "✓ Livrée" : "⏳ À faire"}
          </span>
        </div>
        <span className="text-white/90 text-xs">
          {new Date(order.created * 1000).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Recipient */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Pour
            </p>
            <p className="font-semibold text-gray-900">
              {recipientName || "(Pas de nom)"}
            </p>
            {fmt && fmt !== "Inconnu" && (
              <Badge
                variant="outline"
                className={`mt-1.5 text-[10px] font-medium px-2 py-0.5 h-auto gap-1 border ${config.border} ${config.bg} ${config.text}`}
              >
                {config.icon && (
                  <img
                    src={config.icon}
                    alt=""
                    className="w-3 h-3 object-contain"
                  />
                )}
                {fmt}
              </Badge>
            )}
          </div>
          <Badge variant="outline" className={`border ${tulipBadgeColor}`}>
            {tulipType === "rose"
              ? "Rose"
              : tulipType === "blanche"
                ? "Blanche"
                : "Rouge"}
          </Badge>
        </div>

        {/* Sender */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            De
          </p>
          <p className="font-medium text-gray-800">
            {name || "Inconnu"}
            {isAnonymous === "true" && (
              <span className="ml-2 text-[10px] uppercase text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                Anon
              </span>
            )}
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Message
            </p>
            <p className="text-sm italic text-slate-600">"{message}"</p>
          </div>
        )}

        {/* Action Button */}
        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            className="flex-1 bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
            onClick={() => onPrint(order)}
            title="Imprimer cette étiquette"
          >
            🖨️
          </Button>
          <Button
            className={`flex-[4] transition-all duration-200 ${
              deliveryStatus === "delivered"
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                : "bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-90 shadow-md"
            }`}
            onClick={() => toggleStatus(order.id, deliveryStatus || "pending")}
          >
            {deliveryStatus === "delivered" ? "↩ Annuler" : "✓ Livrer"}
          </Button>
        </div>
        <Button
          className="w-full mt-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm("Supprimer cette commande ?")) {
              if (
                window.confirm("Sûr et certain ? C'est irréversible/masqué.")
              ) {
                onDelete(order.id);
              }
            }
          }}
        >
          🗑️ Supprimer
        </Button>
      </div>
    </div>
  );
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [printFilter, setPrintFilter] = useState<string>("all");
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState<
    "buyers" | "recipients" | null
  >(null);
  const [expandedSenders, setExpandedSenders] = useState<Set<string>>(
    new Set(),
  );
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped");
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      // Check if IP is blocked first
      try {
        const blockCheck = await fetch("/.netlify/functions/check-ip-blocked");
        const blockData = await blockCheck.json();
        if (blockData.blocked) {
          setIsBlocked(true);
          toast({
            title: "Accès refusé",
            description: "Votre adresse IP a été bloquée.",
            variant: "destructive",
          });
          return;
        }
      } catch {
        // Continue if check fails
      }
      fetchOrders(password);
    }
  };

  useEffect(() => {
    const savedAuth = localStorage.getItem("admin_auth");
    const hasAcceptedDisclaimer = localStorage.getItem(
      "admin_disclaimer_accepted",
    );
    if (savedAuth) {
      setIsAuthenticated(true);
      setPassword(savedAuth);
      fetchOrders(savedAuth);
      // If returning user who already accepted, don't show disclaimer
      if (!hasAcceptedDisclaimer) {
        setShowDisclaimer(true);
      }
    }
  }, []);

  const fetchOrders = async (pwd: string) => {
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/get-orders", {
        headers: { Authorization: `Bearer ${pwd}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        // Auth successful - now we can set state and save
        setIsAuthenticated(true);
        localStorage.setItem("admin_auth", pwd);

        // Log this login for super admin tracking
        fetch("/.netlify/functions/log-admin-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userAgent: navigator.userAgent }),
        }).catch(() => {}); // Silent fail

        // Check if first time login (no disclaimer accepted)
        const hasAcceptedDisclaimer = localStorage.getItem(
          "admin_disclaimer_accepted",
        );
        if (!hasAcceptedDisclaimer) {
          setShowDisclaimer(true);
        }
      } else {
        if (res.status === 401) {
          setIsAuthenticated(false);
          localStorage.removeItem("admin_auth");
          toast({
            title: "Erreur",
            description: "Mot de passe incorrect",
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les commandes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Silent refresh - updates orders without showing loading spinner (for real-time sync)
  const silentRefresh = async () => {
    if (!password || !isAuthenticated) return;
    try {
      const res = await fetch("/.netlify/functions/get-orders", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
      }
    } catch {
      // Silent fail - don't interrupt the user
    }
  };

  // Auto-refresh orders every 5 seconds for real-time sync across devices
  useEffect(() => {
    if (!isAuthenticated || !password) return;

    const POLLING_INTERVAL = 5000; // 5 seconds
    let intervalId: ReturnType<typeof setInterval>;

    const startPolling = () => {
      intervalId = setInterval(silentRefresh, POLLING_INTERVAL);
    };

    const stopPolling = () => {
      if (intervalId) clearInterval(intervalId);
    };

    // Handle visibility change - pause polling when tab is hidden
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        silentRefresh(); // Refresh immediately when coming back
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startPolling();

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, password]);

  // Print last 4 orders based on filter OR a specific one OR a list
  const printLabels = (input?: Order | Order[]) => {
    let ordersToPrint: Order[] = [];

    if (Array.isArray(input)) {
      ordersToPrint = input;
    } else if (input) {
      ordersToPrint = [input];
    } else {
      // Bulk print logic
      let filteredOrders = orders;
      // ... same filter logic ...
      if (printFilter !== "all") {
        filteredOrders = orders.filter((order) => {
          const formation = order.metadata.formation;
          if (printFilter === "INFO_COM") {
            return (
              formation &&
              (formation.includes("Info-Com") ||
                formation.includes("Journalisme"))
            );
          }
          return formation === printFilter;
        });
      }
      ordersToPrint = filteredOrders.slice(0, 4);
    }

    if (ordersToPrint.length === 0) {
      toast({
        title: "Aucune commande",
        description: `Pas de commandes à imprimer`,
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Generate label HTML for each order
    const labelElements = ordersToPrint.map((order) => {
      const getMeta = (key: string, altKey?: string) =>
        order.metadata[key] || (altKey ? order.metadata[altKey] : undefined);

      const recipientFirstName = getMeta("recipientFirstName");
      const recipientLastName = getMeta("recipientLastName");
      const recipientName =
        recipientFirstName && recipientLastName
          ? `${recipientFirstName} ${recipientLastName}`
          : getMeta("recipientName", "recipient_name") || "(Pas de nom)";
      const name = getMeta("name") || "Quelqu'un";
      const isAnonymous = getMeta("isAnonymous", "is_anonymous");
      const message = getMeta("message") || "";
      const tulipType = getMeta("tulipType", "tulip_type") || "rouge";
      const formation = getMeta("formation") || "";

      const tulipEmoji =
        tulipType === "rose" ? "🌸" : tulipType === "blanche" ? "🤍" : "❤️";
      const displaySender =
        isAnonymous === "true" ? "Un admirateur secret" : name;

      const nameLength = recipientName.length;
      let nameSize = "38px";
      if (nameLength > 15) nameSize = "32px";
      if (nameLength > 25) nameSize = "26px";
      if (nameLength > 35) nameSize = "22px";

      const msgLength = message.length;
      let msgSize = "24px";
      if (msgLength > 50) msgSize = "20px";
      if (msgLength > 100) msgSize = "16px";
      if (msgLength > 200) msgSize = "14px";

      return `
        <div class="label">
          <div class="tulip-emoji">${tulipEmoji}</div>
          <div class="recipient">
            <span class="label-text">Pour</span>
            <span class="name" style="font-size: ${nameSize}">${recipientName}</span>
            ${formation ? `<span class="formation">${formation}</span>` : ""}
          </div>
          ${message ? `<div class="message" style="font-size: ${msgSize}">${message}</div>` : ""}
          <div class="sender">
            <span class="label-text">De la part de</span>
            <span class="sender-name">${displaySender}</span>
          </div>
        </div>
      `;
    });

    // Group labels into pages of 4
    const pages: string[] = [];
    for (let i = 0; i < labelElements.length; i += 4) {
      const pageLabels = labelElements.slice(i, i + 4);
      // Add empty placeholders if last page has fewer than 4 labels
      while (pageLabels.length < 4) {
        pageLabels.push('<div class="label empty"></div>');
      }
      const isLastPage = i + 4 >= labelElements.length;
      pages.push(`
        <div class="page${isLastPage ? "" : " page-break"}">
          ${pageLabels.join("")}
        </div>
      `);
    }

    const labelsHtml = pages.join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Étiquettes Tulipes</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            width: 100%;
            height: 100%;
            font-family: 'Caveat', cursive;
          }
          .page {
            width: 190mm;
            height: 277mm;
            margin: 0 auto;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 5mm;
            padding: 0;
          }
          .page-break {
            page-break-after: always;
          }
          .label {
            border: 2px dashed #ccc;
            padding: 8mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            gap: 8px;
            position: relative;
            overflow: hidden;
            height: 100%;
            min-height: 0;
          }
          .label.empty {
            border: none;
          }
          .tulip-emoji {
            font-size: 48px;
            margin-bottom: 4px;
            flex-shrink: 0;
          }
          .recipient {
            display: flex;
            flex-direction: column;
            gap: 4px;
            flex-shrink: 0;
          }
          .label-text {
            font-family: 'Segoe UI', sans-serif;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 2px;
            color: #999;
          }
          .name {
            font-size: 38px;
            font-weight: 700;
            color: #1a1a1a;
            line-height: 1.1;
            word-break: break-word;
            overflow-wrap: break-word;
          }
          .formation {
            font-family: 'Segoe UI', sans-serif;
            font-size: 12px;
            color: #666;
            background: #f5f5f5;
            padding: 3px 10px;
            border-radius: 20px;
            margin-top: 4px;
            font-weight: 500;
            white-space: normal;
            text-align: center;
          }
          .message {
            font-size: 20px;
            font-weight: 400;
            color: #444;
            max-width: 95%;
            line-height: 1.3;
            margin: 8px 0;
            padding: 0;
            word-break: break-word;
            overflow-wrap: break-word;
            flex: 1;
            display: flex;
            align-items: center;
            overflow: hidden;
          }
          .sender {
            margin-top: auto;
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex-shrink: 0;
          }
          .sender-name {
            font-size: 16px;
            font-weight: 500;
            color: #333;
          }
          @media print {
            html, body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .page {
              margin: 0 auto;
            }
          }
        </style>
      </head>
      <body>
        ${labelsHtml}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const toggleStatus = async (orderId: string, currentStatus: string) => {
    const newStatus = currentStatus === "delivered" ? "pending" : "delivered";

    // Confirm before marking as delivered
    if (newStatus === "delivered") {
      const confirmed = window.confirm(
        "Confirmer la livraison de cette commande ? La tulipe DOIT ETRE dans les mains de la personne AVANT de cliquer sur ce bouton.",
      );
      if (!confirmed) return;
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, metadata: { ...o.metadata, deliveryStatus: newStatus } }
          : o,
      ),
    );

    try {
      const res = await fetch("/.netlify/functions/update-order-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({
          paymentIntentId: orderId,
          status: newStatus,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast({
        title: "Succès",
        description: `Commande marquée comme ${
          newStatus === "delivered" ? "livrée" : "en attente"
        }`,
      });

      // Send delivery email if status is delivered
      if (newStatus === "delivered") {
        const order = orders.find((o) => o.id === orderId);
        if (order) {
          const getMeta = (key: string, altKey?: string) =>
            order.metadata[key] ||
            (altKey ? order.metadata[altKey] : undefined);

          const customerEmail =
            getMeta("email") ||
            getMeta("customerEmail") || // Correct key from create-payment-intent
            getMeta("customer_email") ||
            getMeta("toEmail") ||
            getMeta("receipt_email");

          if (customerEmail) {
            console.log("Sending delivery email to:", customerEmail);
            fetch("/.netlify/functions/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "delivery",
                toEmail: customerEmail,
                recipientName:
                  getMeta("recipientName", "recipient_name") ||
                  "le destinataire",
                recipientFirstName: getMeta("recipientFirstName"),
                recipientLastName: getMeta("recipientLastName"),
                formation: getMeta("formation") || "",
              }),
            })
              .then((res) => {
                if (res.ok) {
                  toast({
                    title: "Email envoyé",
                    description: "Le client a été notifié de la livraison",
                  });
                } else {
                  console.error("Failed to send email");
                  toast({
                    title: "Erreur envoi email",
                    description: "Échec de l'envoi de l'email de confirmation",
                    variant: "destructive",
                  });
                }
              })
              .catch((err) => {
                console.error("Error sending delivery email", err);
                toast({
                  title: "Erreur",
                  description: "Erreur technique lors de l'envoi de l'email",
                  variant: "destructive",
                });
              });
          } else {
            console.warn("No customer email found for order", orderId);
            toast({
              title: "Pas d'email",
              description: "Aucun email trouvé pour cette commande",
              variant: "destructive",
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                metadata: { ...o.metadata, deliveryStatus: currentStatus },
              }
            : o,
        ),
      );
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const res = await fetch("/.netlify/functions/delete-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ paymentIntentId: orderId }),
      });

      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        toast({
          title: "Commande supprimée",
          description: "La commande a été masquée de la liste",
        });
      } else {
        throw new Error("Failed to delete");
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la commande",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 p-4">
        <Card className="w-full max-w-sm shadow-lg border-0">
          <CardHeader className="text-center">
            <div className="text-4xl mb-2">🌷</div>
            <CardTitle>Accès Administrateur</CardTitle>
            <CardDescription className="space-y-4 pt-2">
              <p>Entrez le mot de passe pour accéder aux commandes.</p>
              {isBlocked ? (
                <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-left">
                  <p className="text-red-800 font-bold flex items-center gap-2 mb-1 text-sm">
                    <span>🚫</span> Accès Bloqué
                  </p>
                  <p className="text-red-700 text-sm">
                    Votre adresse IP a été bloquée. Contactez un administrateur.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left">
                  <p className="text-red-800 font-bold flex items-center gap-2 mb-1 text-xs uppercase tracking-wider">
                    <span>⚠️</span> Attention
                  </p>
                  <p className="text-red-700 text-xs leading-relaxed">
                    Ne faites fuiter ce mot de passe auprès de{" "}
                    <span className="font-bold underline">QUI QUE CE SOIT</span>
                    , hors des bureaux des BDE. Des sanctions disciplinaires
                    pourraient être prises si des accès non autorisés étaient
                    constatés.
                  </p>
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || isBlocked}
              />
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                disabled={loading || isBlocked}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white/50 border-t-white rounded-full"></span>
                    Vérification...
                  </span>
                ) : isBlocked ? (
                  "Accès Refusé"
                ) : (
                  "Connexion"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- STATS CALCULATION ---
  const deliveredCount = orders.filter(
    (o) => o.metadata.deliveryStatus === "delivered",
  ).length;
  const pendingCount = orders.length - deliveredCount;

  // Breakdown by formation
  const formationStats = orders.reduce(
    (acc, order) => {
      const fmt = order.metadata.formation || "Inconnu";
      acc[fmt] = (acc[fmt] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Top buyers (by sender name)
  const buyerStats = orders.reduce(
    (acc, order) => {
      const senderName = (order.metadata.name || "Anonyme").trim();
      if (senderName && senderName !== "Anonyme") {
        acc[senderName] = (acc[senderName] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );
  const topBuyers = Object.entries(buyerStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Top recipients
  const recipientStats = orders.reduce(
    (acc, order) => {
      const firstName = order.metadata.recipientFirstName;
      const lastName = order.metadata.recipientLastName;
      const recipientName = (
        firstName && lastName
          ? `${firstName} ${lastName}`
          : order.metadata.recipientName || order.metadata.recipient_name || ""
      ).trim();
      if (recipientName) {
        acc[recipientName] = (acc[recipientName] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );
  const topRecipients = Object.entries(recipientStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Group orders by recipient for easier delivery
  const groupedOrders = orders.reduce(
    (acc, order) => {
      const firstName = order.metadata.recipientFirstName;
      const lastName = order.metadata.recipientLastName;
      const recipientName = (
        firstName && lastName
          ? `${firstName} ${lastName}`
          : order.metadata.recipientName ||
            order.metadata.recipient_name ||
            "Inconnu"
      ).trim();

      // Use formation in key to disambiguate people with same name in different departments
      const formation = order.metadata.formation || "Inconnu";
      const key = `${recipientName}|${formation}`;

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(order);
      return acc;
    },
    {} as Record<string, Order[]>,
  );

  // Sort groups by number of orders (descending)
  const sortedRecipientGroups = Object.entries(groupedOrders).sort(
    (a, b) => b[1].length - a[1].length,
  );

  // Toggle recipient expansion
  const toggleRecipientExpansion = (recipient: string) => {
    setExpandedSenders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recipient)) {
        newSet.delete(recipient);
      } else {
        newSet.add(recipient);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* First-time disclaimer dialog */}
      <Dialog open={showDisclaimer} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <span>🔒</span> Informations Confidentielles
            </DialogTitle>
            <DialogDescription className="text-left space-y-3 pt-2">
              <p>
                Vous êtes sur le point d'accéder à des{" "}
                <strong>informations personnelles et confidentielles</strong>{" "}
                concernant les commandes de tulipes.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm font-medium mb-2">
                  En continuant, vous vous engagez à :
                </p>
                <ul className="text-red-700 text-sm space-y-1 list-disc list-inside">
                  <li>
                    Ne <strong>jamais partager</strong> ces informations
                  </li>
                  <li>
                    Ne pas faire de <strong>captures d'écran</strong>
                  </li>
                  <li>
                    Utiliser ces données <strong>uniquement</strong> pour la
                    livraison
                  </li>
                  <li>
                    Respecter la <strong>vie privée</strong> des acheteurs
                  </li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                Des sanctions disciplinaires pourraient être prises en cas de
                non-respect de ces règles.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                localStorage.setItem("admin_disclaimer_accepted", "true");
                setShowDisclaimer(false);
              }}
              className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
            >
              J'ai compris et j'accepte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leaderboard Dialog */}
      <Dialog
        open={showLeaderboard !== null}
        onOpenChange={() => setShowLeaderboard(null)}
      >
        <DialogContent className="sm:max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{showLeaderboard === "buyers" ? "🛒" : "💐"}</span>
              {showLeaderboard === "buyers"
                ? "Classement Acheteurs"
                : "Classement Destinataires"}
            </DialogTitle>
            <DialogDescription>
              {showLeaderboard === "buyers"
                ? "Toutes les personnes ayant acheté des tulipes"
                : "Toutes les personnes ayant reçu des tulipes"}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="text-right">Tulipes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(showLeaderboard === "buyers"
                  ? Object.entries(buyerStats).sort((a, b) => b[1] - a[1])
                  : Object.entries(recipientStats).sort((a, b) => b[1] - a[1])
                ).map(([name, count], index) => (
                  <TableRow
                    key={name}
                    className={index < 3 ? "bg-amber-50/50" : ""}
                  >
                    <TableCell className="font-medium">
                      {index === 0
                        ? "🥇"
                        : index === 1
                          ? "🥈"
                          : index === 2
                            ? "🥉"
                            : index + 1}
                    </TableCell>
                    <TableCell className={index < 3 ? "font-semibold" : ""}>
                      {name}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="secondary"
                        className={
                          index === 0
                            ? "bg-yellow-100 text-yellow-800"
                            : index === 1
                              ? "bg-gray-200 text-gray-800"
                              : index === 2
                                ? "bg-amber-100 text-amber-800"
                                : ""
                        }
                      >
                        {count} 🌷
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowLeaderboard(null)} className="w-full">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile-optimized padding */}
      <div className="p-3 sm:p-4 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8">
        {/* HEADER - Improved for mobile */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>🌷</span>
                  <span>Tableau de bord</span>
                </h1>
                <p className="text-white/80 text-sm sm:text-base mt-1">
                  Gérez les commandes en temps réel
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 sm:flex-none bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                  onClick={() => fetchOrders(password)}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">↻</span> Chargement...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      ↻ Actualiser
                    </span>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                  onClick={() => printLabels()} // Bulk print
                >
                  🖨️ Imprimer (4 derniers)
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                  onClick={() => {
                    localStorage.removeItem("admin_auth");
                    setIsAuthenticated(false);
                    setPassword("");
                  }}
                >
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* STATS OVERVIEW - Grid adapts for mobile */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* Total Orders Card */}
          <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 border-0 text-white shadow-lg shadow-blue-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs sm:text-sm font-medium uppercase tracking-wider">
                    Total
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">
                    {orders.length}
                  </p>
                </div>
                <div className="text-3xl sm:text-4xl opacity-30">📦</div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Card */}
          <Card className="bg-gradient-to-br from-amber-400 to-orange-500 border-0 text-white shadow-lg shadow-amber-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-xs sm:text-sm font-medium uppercase tracking-wider">
                    À Faire
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">
                    {pendingCount}
                  </p>
                </div>
                <div className="text-3xl sm:text-4xl opacity-30">⏳</div>
              </div>
            </CardContent>
          </Card>

          {/* Delivered Card */}
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 text-white shadow-lg shadow-green-500/20">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs sm:text-sm font-medium uppercase tracking-wider">
                    Livrées
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1">
                    {deliveredCount}
                  </p>
                </div>
                <div className="text-3xl sm:text-4xl opacity-30">✓</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FORMATION STATS - Horizontal scroll on mobile */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <span>📊</span> Répartition par Formation
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
              {Object.entries(formationStats)
                .sort((a, b) => b[1] - a[1])
                .map(([fmt, count]) => {
                  const config = FORMATION_CONFIG[fmt] || DEFAULT_CONFIG;
                  const percentage =
                    Math.round((count / orders.length) * 100) || 0;
                  return (
                    <div
                      key={fmt}
                      className={`flex-shrink-0 p-3 sm:p-4 rounded-xl border ${config.border} ${config.bg} min-w-[140px] sm:min-w-[160px] transition-all hover:scale-105`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {config.icon ? (
                          <img
                            src={config.icon}
                            alt={fmt}
                            className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                          />
                        ) : (
                          <div
                            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${config.bg} ${config.text} text-xs font-bold`}
                          >
                            ?
                          </div>
                        )}
                        <span
                          className={`text-lg sm:text-xl font-bold ${config.text}`}
                        >
                          {count}
                        </span>
                      </div>
                      <p
                        className={`text-xs font-medium ${config.text} truncate`}
                        title={fmt}
                      >
                        {fmt.replace("BUT ", "")}
                      </p>
                      <div className="mt-2 bg-white/50 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              {Object.keys(formationStats).length === 0 && (
                <p className="text-sm text-muted-foreground py-4">
                  Aucune donnée
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PODIUMS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Buyers Podium */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2 sm:pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <span>🛒</span> Top Acheteurs
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Les personnes ayant acheté le plus de tulipes
                  </CardDescription>
                </div>
                {Object.keys(buyerStats).length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-primary hover:text-primary/80"
                    onClick={() => setShowLeaderboard("buyers")}
                  >
                    Voir tout →
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {topBuyers.length > 0 ? (
                <div className="flex items-end justify-center gap-2 sm:gap-4">
                  {/* 2nd place */}
                  {topBuyers[1] && (
                    <div className="flex flex-col items-center">
                      <div className="text-2xl sm:text-3xl mb-1">🥈</div>
                      <div className="bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg w-16 sm:w-20 h-16 sm:h-20 flex items-center justify-center shadow-md">
                        <span className="text-xl sm:text-2xl font-bold text-white">
                          {topBuyers[1][1]}
                        </span>
                      </div>
                      <p
                        className="text-xs sm:text-sm font-medium text-center mt-2 max-w-[80px] sm:max-w-[100px] truncate"
                        title={topBuyers[1][0]}
                      >
                        {topBuyers[1][0]}
                      </p>
                    </div>
                  )}
                  {/* 1st place */}
                  {topBuyers[0] && (
                    <div className="flex flex-col items-center">
                      <div className="text-3xl sm:text-4xl mb-1">🥇</div>
                      <div className="bg-gradient-to-b from-yellow-400 to-amber-500 rounded-t-lg w-20 sm:w-24 h-24 sm:h-28 flex items-center justify-center shadow-lg">
                        <span className="text-2xl sm:text-3xl font-bold text-white">
                          {topBuyers[0][1]}
                        </span>
                      </div>
                      <p
                        className="text-sm sm:text-base font-semibold text-center mt-2 max-w-[90px] sm:max-w-[120px] truncate"
                        title={topBuyers[0][0]}
                      >
                        {topBuyers[0][0]}
                      </p>
                    </div>
                  )}
                  {/* 3rd place */}
                  {topBuyers[2] && (
                    <div className="flex flex-col items-center">
                      <div className="text-xl sm:text-2xl mb-1">🥉</div>
                      <div className="bg-gradient-to-b from-amber-600 to-amber-700 rounded-t-lg w-14 sm:w-16 h-12 sm:h-14 flex items-center justify-center shadow-md">
                        <span className="text-lg sm:text-xl font-bold text-white">
                          {topBuyers[2][1]}
                        </span>
                      </div>
                      <p
                        className="text-xs font-medium text-center mt-2 max-w-[70px] sm:max-w-[80px] truncate"
                        title={topBuyers[2][0]}
                      >
                        {topBuyers[2][0]}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune donnée disponible
                </p>
              )}
            </CardContent>
          </Card>

          {/* Top Recipients Podium */}
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2 sm:pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <span>💐</span> Top Destinataires
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Les personnes ayant reçu le plus de tulipes
                  </CardDescription>
                </div>
                {Object.keys(recipientStats).length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-primary hover:text-primary/80"
                    onClick={() => setShowLeaderboard("recipients")}
                  >
                    Voir tout →
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {topRecipients.length > 0 ? (
                <div className="flex items-end justify-center gap-2 sm:gap-4">
                  {/* 2nd place */}
                  {topRecipients[1] && (
                    <div className="flex flex-col items-center">
                      <div className="text-2xl sm:text-3xl mb-1">🥈</div>
                      <div className="bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-lg w-16 sm:w-20 h-16 sm:h-20 flex items-center justify-center shadow-md">
                        <span className="text-xl sm:text-2xl font-bold text-white">
                          {topRecipients[1][1]}
                        </span>
                      </div>
                      <p
                        className="text-xs sm:text-sm font-medium text-center mt-2 max-w-[80px] sm:max-w-[100px] truncate"
                        title={topRecipients[1][0]}
                      >
                        {topRecipients[1][0]}
                      </p>
                    </div>
                  )}
                  {/* 1st place */}
                  {topRecipients[0] && (
                    <div className="flex flex-col items-center">
                      <div className="text-3xl sm:text-4xl mb-1">🥇</div>
                      <div className="bg-gradient-to-b from-yellow-400 to-amber-500 rounded-t-lg w-20 sm:w-24 h-24 sm:h-28 flex items-center justify-center shadow-lg">
                        <span className="text-2xl sm:text-3xl font-bold text-white">
                          {topRecipients[0][1]}
                        </span>
                      </div>
                      <p
                        className="text-sm sm:text-base font-semibold text-center mt-2 max-w-[90px] sm:max-w-[120px] truncate"
                        title={topRecipients[0][0]}
                      >
                        {topRecipients[0][0]}
                      </p>
                    </div>
                  )}
                  {/* 3rd place */}
                  {topRecipients[2] && (
                    <div className="flex flex-col items-center">
                      <div className="text-xl sm:text-2xl mb-1">🥉</div>
                      <div className="bg-gradient-to-b from-amber-600 to-amber-700 rounded-t-lg w-14 sm:w-16 h-12 sm:h-14 flex items-center justify-center shadow-md">
                        <span className="text-lg sm:text-xl font-bold text-white">
                          {topRecipients[2][1]}
                        </span>
                      </div>
                      <p
                        className="text-xs font-medium text-center mt-2 max-w-[70px] sm:max-w-[80px] truncate"
                        title={topRecipients[2][0]}
                      >
                        {topRecipients[2][0]}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune donnée disponible
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* PRINT CONTROLS */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <span>🖨️</span> Impression
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Sélectionnez une formation pour imprimer les 4 dernières commandes
              correspondantes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Select value={printFilter} onValueChange={setPrintFilter}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Toutes les commandes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les formations</SelectItem>
                <SelectItem value="INFO_COM">BUT Info-Com (Tout)</SelectItem>
                <SelectItem value="BUT Informatique">
                  BUT Informatique
                </SelectItem>
                <SelectItem value="BUT MMI">BUT MMI</SelectItem>
                <SelectItem value="BUT R&T">BUT R&T</SelectItem>
                <SelectItem value="BUT Mesures Physiques">
                  BUT Mesures Physiques
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              onClick={() => printLabels()}
            >
              Imprimer les 4 dernières
            </Button>
          </CardContent>
        </Card>

        {/* BATCH PRINT BY FORMATION */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <span>🖨️</span> Impression par Formation (Tout)
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Imprimer toutes les commandes d'une formation spécifique (sans
              limite de nombre).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(FORMATION_CONFIG).map(([fmt, config]) => {
                const count = formationStats[fmt] || 0;
                if (count === 0) return null; // Hide if no orders

                return (
                  <Button
                    key={fmt}
                    variant="outline"
                    className={`h-auto py-3 px-4 justify-start gap-3 border ${config.border} hover:bg-slate-50`}
                    onClick={() => {
                      const ordersToPrint = orders.filter(
                        (o) => (o.metadata.formation || "Inconnu") === fmt,
                      );
                      if (
                        window.confirm(
                          `Imprimer ${ordersToPrint.length} étiquettes pour ${fmt} ?`,
                        )
                      ) {
                        printLabels(ordersToPrint);
                      }
                    }}
                  >
                    {config.icon ? (
                      <img
                        src={config.icon}
                        alt=""
                        className="w-5 h-5 object-contain"
                      />
                    ) : (
                      <span className="text-lg">📚</span>
                    )}
                    <div className="flex flex-col items-start">
                      <span className={`font-semibold ${config.text}`}>
                        {fmt.replace("BUT ", "")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {count} commande{count > 1 ? "s" : ""}
                      </span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ORDERS Section */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-2 sm:pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <span>📋</span> Liste des Commandes
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1">
                  {pendingCount > 0 ? (
                    <span className="text-amber-600 font-medium">
                      {pendingCount} commande{pendingCount > 1 ? "s" : ""} à
                      livrer
                    </span>
                  ) : (
                    <span className="text-green-600 font-medium">
                      Toutes les commandes sont livrées ! 🎉
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${
                    viewMode === "grouped"
                      ? "bg-white text-slate-900 shadow-sm hover:bg-gray-50"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                  } flex-1 sm:flex-none transition-all duration-200`}
                  onClick={() => setViewMode("grouped")}
                >
                  👤 Par destinataire
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${
                    viewMode === "flat"
                      ? "bg-white text-slate-900 shadow-sm hover:bg-gray-50"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                  } flex-1 sm:flex-none transition-all duration-200`}
                  onClick={() => setViewMode("flat")}
                >
                  📜 Chronologique
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
              <div className="flex items-start gap-3">
                <span className="text-xl">🔒</span>
                <div>
                  <h3 className="text-red-800 font-bold text-sm uppercase tracking-wider mb-1">
                    Confidentiel
                  </h3>
                  <p className="text-red-700 text-sm">
                    Les commandes sont strictement personnelles et ne doivent
                    pas fuiter EN DEHORS des bénévoles pour la livraison. Des
                    sanctions seront prises en cas de non-respect de cette
                    règle.
                  </p>
                  <p className="text-red-700 text-sm mt-2 font-bold flex items-center gap-1">
                    <span>⚠️</span> ATTENTION : Toutes les captures d'écran sont
                    surveillées et seront signalées.
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-muted-foreground text-sm">Chargement...</p>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-5xl mb-4">📭</span>
                <p className="text-muted-foreground">Aucune commande trouvée</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3">
                  {viewMode === "grouped"
                    ? // Grouped by recipient
                      sortedRecipientGroups.map(
                        ([groupKey, recipientOrders]) => {
                          const [recipientName, formation] =
                            groupKey.split("|");
                          const isExpanded = expandedSenders.has(groupKey);
                          const pendingInGroup = recipientOrders.filter(
                            (o: Order) =>
                              o.metadata.deliveryStatus !== "delivered",
                          ).length;
                          return (
                            <div
                              key={groupKey}
                              className="bg-white rounded-xl border shadow-sm overflow-hidden"
                            >
                              {/* Recipient Header */}
                              <div className="w-full flex items-center justify-between bg-gradient-to-r from-slate-100 to-slate-50 hover:from-slate-200 hover:to-slate-100 transition-colors">
                                <button
                                  onClick={() =>
                                    toggleRecipientExpansion(groupKey)
                                  }
                                  className="flex-1 px-4 py-3 flex items-center justify-between text-left"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-xl">🎁</span>
                                    <div>
                                      <p className="font-semibold text-gray-900">
                                        {recipientName}
                                        {formation &&
                                          formation !== "Inconnu" && (
                                            <span className="ml-2 text-xs font-normal text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                                              {formation.replace("BUT ", "")}
                                            </span>
                                          )}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {recipientOrders.length} tulipe
                                        {recipientOrders.length > 1
                                          ? "s"
                                          : ""}{" "}
                                        à recevoir
                                        {pendingInGroup > 0 && (
                                          <span className="ml-1 text-amber-600 font-medium">
                                            ({pendingInGroup} à livrer)
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </button>

                                <div className="flex items-center gap-2 pr-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 gap-1 bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      printLabels(recipientOrders);
                                    }}
                                    title="Imprimer toutes les étiquettes du groupe"
                                  >
                                    <span className="text-xs">🖨️</span>
                                  </Button>

                                  <button
                                    onClick={() =>
                                      toggleRecipientExpansion(groupKey)
                                    }
                                    className="flex items-center gap-2"
                                  >
                                    <Badge
                                      variant="secondary"
                                      className="bg-primary/10 text-primary"
                                    >
                                      {recipientOrders.length}
                                    </Badge>
                                    <span
                                      className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                    >
                                      ▼
                                    </span>
                                  </button>
                                </div>
                              </div>
                              {/* Orders in group */}
                              {isExpanded && (
                                <div className="p-2 space-y-2 bg-slate-50/50">
                                  {recipientOrders.map((order: Order) => (
                                    <OrderCard
                                      key={order.id}
                                      order={order}
                                      toggleStatus={toggleStatus}
                                      onDelete={(id) => deleteOrder(id)}
                                      onPrint={(order) => printLabels(order)}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        },
                      )
                    : // Flat chronological view
                      orders.map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          toggleStatus={toggleStatus}
                          onDelete={(id) => deleteOrder(id)}
                          onPrint={(order) => printLabels(order)}
                        />
                      ))}
                </div>

                {/* Desktop View */}
                <div className="hidden lg:block">
                  {viewMode === "grouped" ? (
                    // Grouped Desktop View
                    <div className="space-y-4">
                      {sortedRecipientGroups.map(
                        ([groupKey, recipientOrders]) => {
                          const [recipientName, formation] =
                            groupKey.split("|");
                          const isExpanded = expandedSenders.has(groupKey);
                          const pendingInGroup = recipientOrders.filter(
                            (o: Order) =>
                              o.metadata.deliveryStatus !== "delivered",
                          ).length;
                          const deliveredInGroup =
                            recipientOrders.length - pendingInGroup;
                          return (
                            <div
                              key={groupKey}
                              className="bg-white rounded-xl border shadow-sm overflow-hidden"
                            >
                              {/* Recipient Header */}
                              <div className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-slate-100 to-slate-50 hover:from-slate-200 hover:to-slate-100 transition-colors">
                                <button
                                  onClick={() =>
                                    toggleRecipientExpansion(groupKey)
                                  }
                                  className="flex-1 flex items-center gap-4 text-left"
                                >
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-2xl">
                                    🎁
                                  </div>
                                  <div>
                                    <p className="font-bold text-lg text-gray-900">
                                      {recipientName}
                                      {formation && formation !== "Inconnu" && (
                                        <span className="ml-2 text-sm font-normal text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                          {formation.replace("BUT ", "")}
                                        </span>
                                      )}
                                    </p>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                      <span>
                                        {recipientOrders.length} tulipe
                                        {recipientOrders.length > 1
                                          ? "s"
                                          : ""}{" "}
                                        à recevoir
                                      </span>
                                      {pendingInGroup > 0 && (
                                        <Badge
                                          variant="secondary"
                                          className="bg-amber-100 text-amber-700"
                                        >
                                          {pendingInGroup} à livrer
                                        </Badge>
                                      )}
                                      {deliveredInGroup > 0 && (
                                        <Badge
                                          variant="secondary"
                                          className="bg-green-100 text-green-700"
                                        >
                                          {deliveredInGroup} livrée
                                          {deliveredInGroup > 1 ? "s" : ""}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </button>

                                <div className="flex items-center gap-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      printLabels(recipientOrders);
                                    }}
                                  >
                                    <span>🖨️</span> Tout imprimer
                                  </Button>

                                  <button
                                    onClick={() =>
                                      toggleRecipientExpansion(groupKey)
                                    }
                                    className="flex items-center gap-3"
                                  >
                                    <div className="text-3xl font-bold text-primary/30">
                                      {recipientOrders.length}
                                    </div>
                                    <span
                                      className={`text-xl transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                    >
                                      ▼
                                    </span>
                                  </button>
                                </div>
                              </div>
                              {/* Orders Table in group */}
                              {isExpanded && (
                                <div className="border-t">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-slate-50/50">
                                        <TableHead className="w-[100px] font-semibold">
                                          Statut
                                        </TableHead>
                                        <TableHead className="w-[130px] font-semibold">
                                          Date
                                        </TableHead>
                                        <TableHead className="w-[90px] font-semibold">
                                          Fleur
                                        </TableHead>
                                        <TableHead className="font-semibold">
                                          De
                                        </TableHead>
                                        <TableHead className="max-w-[280px] font-semibold">
                                          Message
                                        </TableHead>
                                        <TableHead className="text-right font-semibold w-[140px]">
                                          Action
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {recipientOrders.map((order: Order) => {
                                        const getMeta = (
                                          key: string,
                                          altKey?: string,
                                        ) =>
                                          order.metadata[key] ||
                                          (altKey
                                            ? order.metadata[altKey]
                                            : undefined);

                                        const fmt =
                                          getMeta("formation") || "Inconnu";
                                        const deliveryStatus =
                                          getMeta(
                                            "deliveryStatus",
                                            "delivery_status",
                                          ) || "pending";
                                        const recipientFirstName =
                                          getMeta("recipientFirstName");
                                        const recipientLastName =
                                          getMeta("recipientLastName");
                                        const recipientName =
                                          recipientFirstName &&
                                          recipientLastName
                                            ? `${recipientFirstName} ${recipientLastName}`
                                            : getMeta(
                                                "recipientName",
                                                "recipient_name",
                                              );
                                        const message = getMeta("message");
                                        const tulipType =
                                          getMeta("tulipType", "tulip_type") ||
                                          "rouge";

                                        const config =
                                          FORMATION_CONFIG[fmt] ||
                                          DEFAULT_CONFIG;
                                        let tulipBadgeColor =
                                          "bg-gray-100 text-gray-800";
                                        let tulipLabel = "Rouge";
                                        let tulipEmoji = "🌷";
                                        if (tulipType === "rose") {
                                          tulipBadgeColor =
                                            "bg-pink-100 text-pink-800 border-pink-200";
                                          tulipLabel = "Rose";
                                          tulipEmoji = "🌸";
                                        } else if (tulipType === "blanche") {
                                          tulipBadgeColor =
                                            "bg-slate-100 text-slate-800 border-slate-200";
                                          tulipLabel = "Blanche";
                                          tulipEmoji = "🤍";
                                        } else {
                                          tulipBadgeColor =
                                            "bg-red-100 text-red-800 border-red-200";
                                          tulipLabel = "Rouge";
                                          tulipEmoji = "🛑";
                                        }

                                        return (
                                          <TableRow
                                            key={order.id}
                                            className={`transition-colors ${
                                              deliveryStatus === "delivered"
                                                ? "bg-green-50/40"
                                                : "hover:bg-slate-50/50"
                                            }`}
                                          >
                                            <TableCell>
                                              <Badge
                                                variant={
                                                  deliveryStatus === "delivered"
                                                    ? "default"
                                                    : "secondary"
                                                }
                                                className={
                                                  deliveryStatus === "delivered"
                                                    ? "bg-green-600 hover:bg-green-700 shadow-sm"
                                                    : "bg-amber-100 text-amber-800 hover:bg-amber-200 shadow-sm"
                                                }
                                              >
                                                {deliveryStatus === "delivered"
                                                  ? "✓ Livrée"
                                                  : "⏳ À faire"}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                              <div className="font-medium text-sm">
                                                {new Date(
                                                  order.created * 1000,
                                                ).toLocaleDateString("fr-FR", {
                                                  day: "numeric",
                                                  month: "short",
                                                })}
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                {new Date(
                                                  order.created * 1000,
                                                ).toLocaleTimeString([], {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })}
                                              </div>
                                            </TableCell>
                                            <TableCell>
                                              <Badge
                                                variant="outline"
                                                className={`border ${tulipBadgeColor} gap-1`}
                                              >
                                                <span>{tulipEmoji}</span>
                                                {tulipLabel}
                                              </Badge>
                                            </TableCell>
                                            <TableCell>
                                              <div className="font-medium text-sm">
                                                {recipientName ||
                                                  "(Pas de nom)"}
                                              </div>
                                              {fmt && fmt !== "Inconnu" && (
                                                <Badge
                                                  variant="outline"
                                                  className={`mt-1 text-[10px] font-medium px-2 py-0.5 h-auto gap-1 border ${config.border} ${config.bg} ${config.text}`}
                                                >
                                                  {config.icon && (
                                                    <img
                                                      src={config.icon}
                                                      alt=""
                                                      className="w-3 h-3 object-contain"
                                                    />
                                                  )}
                                                  {fmt.replace("BUT ", "")}
                                                </Badge>
                                              )}
                                            </TableCell>
                                            <TableCell
                                              className="max-w-[280px]"
                                              title={message}
                                            >
                                              {message ? (
                                                <div className="bg-slate-50 p-2 rounded-lg text-xs italic text-slate-600 border border-slate-100 line-clamp-2">
                                                  "{message}"
                                                </div>
                                              ) : (
                                                <span className="text-muted-foreground text-xs italic">
                                                  Aucun message
                                                </span>
                                              )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <div className="flex justify-end gap-2">
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() =>
                                                    printLabels(order)
                                                  }
                                                  title="Imprimer"
                                                >
                                                  🖨️
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant={
                                                    deliveryStatus ===
                                                    "delivered"
                                                      ? "outline"
                                                      : "default"
                                                  }
                                                  className={
                                                    deliveryStatus ===
                                                    "delivered"
                                                      ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                                      : "bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-90 shadow-sm"
                                                  }
                                                  onClick={() =>
                                                    toggleStatus(
                                                      order.id,
                                                      deliveryStatus ||
                                                        "pending",
                                                    )
                                                  }
                                                >
                                                  {deliveryStatus ===
                                                  "delivered"
                                                    ? "Annuler"
                                                    : "Livrer"}
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="text-red-400 hover:text-red-700 hover:bg-red-50"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (
                                                      window.confirm(
                                                        "Supprimer cette commande ?",
                                                      )
                                                    ) {
                                                      if (
                                                        window.confirm(
                                                          "Sûr et certain ? C'est irréversible.",
                                                        )
                                                      ) {
                                                        deleteOrder(order.id);
                                                      }
                                                    }
                                                  }}
                                                  title="Supprimer"
                                                >
                                                  🗑️
                                                </Button>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </div>
                          );
                        },
                      )}
                    </div>
                  ) : (
                    // Flat Desktop Table View
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/50">
                            <TableHead className="w-[100px] font-semibold">
                              Statut
                            </TableHead>
                            <TableHead className="w-[130px] font-semibold">
                              Date
                            </TableHead>
                            <TableHead className="w-[90px] font-semibold">
                              Fleur
                            </TableHead>
                            <TableHead className="font-semibold">
                              Pour
                            </TableHead>
                            <TableHead className="font-semibold">De</TableHead>
                            <TableHead className="max-w-[280px] font-semibold">
                              Message
                            </TableHead>
                            <TableHead className="text-right font-semibold w-[140px]">
                              Action
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map((order) => {
                            const getMeta = (key: string, altKey?: string) =>
                              order.metadata[key] ||
                              (altKey ? order.metadata[altKey] : undefined);

                            const fmt = getMeta("formation") || "Inconnu";
                            const deliveryStatus =
                              getMeta("deliveryStatus", "delivery_status") ||
                              "pending";
                            const recipientFirstName =
                              getMeta("recipientFirstName");
                            const recipientLastName =
                              getMeta("recipientLastName");
                            const recipientName =
                              recipientFirstName && recipientLastName
                                ? `${recipientFirstName} ${recipientLastName}`
                                : getMeta("recipientName", "recipient_name");
                            const name = getMeta("name");
                            const isAnonymous = getMeta(
                              "isAnonymous",
                              "is_anonymous",
                            );
                            const message = getMeta("message");
                            const tulipType =
                              getMeta("tulipType", "tulip_type") || "rouge";

                            const config =
                              FORMATION_CONFIG[fmt] || DEFAULT_CONFIG;
                            let tulipBadgeColor = "bg-gray-100 text-gray-800";
                            let tulipLabel = "Rouge";
                            let tulipEmoji = "🌷";
                            if (tulipType === "rose") {
                              tulipBadgeColor =
                                "bg-pink-100 text-pink-800 border-pink-200";
                              tulipLabel = "Rose";
                              tulipEmoji = "🌸";
                            } else if (tulipType === "blanche") {
                              tulipBadgeColor =
                                "bg-slate-100 text-slate-800 border-slate-200";
                              tulipLabel = "Blanche";
                              tulipEmoji = "🤍";
                            } else {
                              tulipBadgeColor =
                                "bg-red-100 text-red-800 border-red-200";
                              tulipLabel = "Rouge";
                              tulipEmoji = "❤️";
                            }

                            return (
                              <TableRow
                                key={order.id}
                                className={`transition-colors ${
                                  deliveryStatus === "delivered"
                                    ? "bg-green-50/40"
                                    : "hover:bg-slate-50/50"
                                }`}
                              >
                                <TableCell>
                                  <Badge
                                    variant={
                                      deliveryStatus === "delivered"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className={
                                      deliveryStatus === "delivered"
                                        ? "bg-green-600 hover:bg-green-700 shadow-sm"
                                        : "bg-amber-100 text-amber-800 hover:bg-amber-200 shadow-sm"
                                    }
                                  >
                                    {deliveryStatus === "delivered"
                                      ? "✓ Livrée"
                                      : "⏳ À faire"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <div className="font-medium text-sm">
                                    {new Date(
                                      order.created * 1000,
                                    ).toLocaleDateString("fr-FR", {
                                      day: "numeric",
                                      month: "short",
                                    })}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(
                                      order.created * 1000,
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={`border ${tulipBadgeColor} gap-1`}
                                  >
                                    <span>{tulipEmoji}</span>
                                    {tulipLabel}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium text-sm">
                                    {recipientName || "(Pas de nom)"}
                                  </div>
                                  {fmt && fmt !== "Inconnu" && (
                                    <Badge
                                      variant="outline"
                                      className={`mt-1 text-[10px] font-medium px-2 py-0.5 h-auto gap-1 border ${config.border} ${config.bg} ${config.text}`}
                                    >
                                      {config.icon && (
                                        <img
                                          src={config.icon}
                                          alt=""
                                          className="w-3 h-3 object-contain"
                                        />
                                      )}
                                      {fmt.replace("BUT ", "")}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium text-sm">
                                    {name || "Inconnu"}
                                    {isAnonymous === "true" && (
                                      <span className="ml-1 text-[10px] uppercase text-amber-600 font-bold bg-amber-50 px-1 rounded">
                                        Anon
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell
                                  className="max-w-[280px]"
                                  title={message}
                                >
                                  {message ? (
                                    <div className="bg-slate-50 p-2 rounded-lg text-xs italic text-slate-600 border border-slate-100 line-clamp-2">
                                      "{message}"
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground text-xs italic">
                                      Aucun message
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => printLabels(order)}
                                      title="Imprimer"
                                    >
                                      🖨️
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={
                                        deliveryStatus === "delivered"
                                          ? "outline"
                                          : "default"
                                      }
                                      className={
                                        deliveryStatus === "delivered"
                                          ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                                          : "bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-90 shadow-sm"
                                      }
                                      onClick={() =>
                                        toggleStatus(
                                          order.id,
                                          deliveryStatus || "pending",
                                        )
                                      }
                                    >
                                      {deliveryStatus === "delivered"
                                        ? "Annuler"
                                        : "Livrer"}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-red-400 hover:text-red-700 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (
                                          window.confirm(
                                            "Supprimer cette commande ?",
                                          )
                                        ) {
                                          if (
                                            window.confirm(
                                              "Sûr et certain ? C'est irréversible.",
                                            )
                                          ) {
                                            deleteOrder(order.id);
                                          }
                                        }
                                      }}
                                      title="Supprimer"
                                    >
                                      🗑️
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
