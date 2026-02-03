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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LoginLog {
  ip: string;
  userAgent: string;
  timestamp: string;
  country?: string;
}

interface Order {
  id: string;
  created: number;
  amount: number;
  status: string;
  metadata: Record<string, string>;
}

interface DbEdit {
  paymentIntentId: string;
  field: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
  editorIp: string;
}

export default function SuperAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [blockedIps, setBlockedIps] = useState<string[]>([]);
  const [blockingIp, setBlockingIp] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"logs" | "database" | "audit">(
    "logs",
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [dbEdits, setDbEdits] = useState<DbEdit[]>([]);
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      fetchLogs(password);
    }
  };

  useEffect(() => {
    const savedAuth = localStorage.getItem("super_admin_auth");
    if (savedAuth) {
      setIsAuthenticated(true);
      setPassword(savedAuth);
      fetchLogs(savedAuth);
    }
  }, []);

  const fetchLogs = async (pwd: string) => {
    setLoading(true);
    try {
      const res = await fetch("/.netlify/functions/get-admin-logs", {
        headers: { Authorization: `Bearer ${pwd}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setBlockedIps(data.blockedIps || []);
        setIsAuthenticated(true);
        localStorage.setItem("super_admin_auth", pwd);
      } else {
        if (res.status === 401) {
          setIsAuthenticated(false);
          localStorage.removeItem("super_admin_auth");
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
        description: "Impossible de récupérer les logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch("/.netlify/functions/get-orders", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les commandes",
        variant: "destructive",
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchDbEdits = async () => {
    try {
      const res = await fetch("/.netlify/functions/get-db-edits", {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDbEdits(data.edits || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlockIp = async (ip: string, action: "block" | "unblock") => {
    setBlockingIp(ip);
    try {
      const res = await fetch("/.netlify/functions/manage-blocked-ip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
        body: JSON.stringify({ ip, action }),
      });

      if (res.ok) {
        const data = await res.json();
        setBlockedIps(data.blockedIps || []);
        toast({
          title: action === "block" ? "IP Bloquée" : "IP Débloquée",
          description: `L'adresse ${ip} a été ${action === "block" ? "bloquée" : "débloquée"}.`,
        });
      } else {
        throw new Error("Failed");
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Erreur",
        description: `Impossible de ${action === "block" ? "bloquer" : "débloquer"} l'IP`,
        variant: "destructive",
      });
    } finally {
      setBlockingIp(null);
    }
  };

  const openEditDialog = (order: Order) => {
    setEditingOrder(order);
    setEditForm({ ...order.metadata });
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;

    // Double confirmation
    const confirmed = window.confirm(
      `⚠️ ATTENTION: Vous allez modifier la commande ${editingOrder.id}.\n\nCette action sera enregistrée dans l'historique.\n\nConfirmer ?`,
    );
    if (!confirmed) return;

    const reconfirmed = window.confirm(
      `🔴 DERNIÈRE CONFIRMATION\n\nÊtes-vous ABSOLUMENT sûr de vouloir modifier cette commande ?\n\nCette action est irréversible et sera tracée.`,
    );
    if (!reconfirmed) return;

    setSaving(true);
    try {
      // Find changed fields
      const updates: Record<string, string> = {};
      for (const [key, value] of Object.entries(editForm)) {
        if (editingOrder.metadata[key] !== value) {
          updates[key] = value;
        }
      }

      if (Object.keys(updates).length === 0) {
        toast({
          title: "Aucune modification",
          description: "Aucun champ n'a été modifié",
        });
        setEditingOrder(null);
        return;
      }

      const res = await fetch("/.netlify/functions/edit-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
          "X-Confirm-Token": "CONFIRM_DB_EDIT",
        },
        body: JSON.stringify({
          paymentIntentId: editingOrder.id,
          updates,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state
        setOrders((prev) =>
          prev.map((o) =>
            o.id === editingOrder.id
              ? { ...o, metadata: data.order.metadata }
              : o,
          ),
        );
        toast({
          title: "✅ Modification enregistrée",
          description: `${Object.keys(updates).length} champ(s) modifié(s)`,
        });
        setEditingOrder(null);
        fetchDbEdits(); // Refresh audit log
      } else {
        const error = await res.json();
        throw new Error(error.error || "Failed");
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erreur",
        description: err.message || "Impossible de modifier la commande",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Parse user agent to get device info
  const parseUserAgent = (ua: string) => {
    let device = "Inconnu";
    let browser = "Inconnu";
    let os = "Inconnu";

    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac OS")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg/")) browser = "Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";

    if (
      ua.includes("Mobile") ||
      ua.includes("Android") ||
      ua.includes("iPhone")
    ) {
      device = "📱 Mobile";
    } else if (ua.includes("iPad") || ua.includes("Tablet")) {
      device = "📱 Tablette";
    } else {
      device = "💻 Desktop";
    }

    return { device, browser, os };
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <Card className="w-full max-w-sm shadow-2xl border-0 bg-slate-800/50 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="text-4xl mb-2">🔐</div>
            <CardTitle className="text-white">Super Admin</CardTitle>
            <CardDescription className="text-slate-400">
              Accès réservé aux administrateurs système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Mot de passe super admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              />
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white/50 border-t-white rounded-full"></span>
                    Vérification...
                  </span>
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

  const uniqueIps = [...new Set(logs.map((l) => l.ip))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-700/50 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>🔐</span>
                  <span>Super Admin</span>
                </h1>
                <p className="text-white/80 text-sm mt-1">
                  Surveillance et gestion avancée
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => {
                    fetchLogs(password);
                    if (activeTab === "database") fetchOrders();
                    if (activeTab === "audit") fetchDbEdits();
                  }}
                  disabled={loading}
                >
                  ↻ Actualiser
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={() => {
                    localStorage.removeItem("super_admin_auth");
                    setIsAuthenticated(false);
                    setPassword("");
                  }}
                >
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex border-t border-slate-700/50">
            <button
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === "logs"
                  ? "bg-slate-700/50 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/30"
              }`}
              onClick={() => setActiveTab("logs")}
            >
              📋 Connexions
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === "database"
                  ? "bg-slate-700/50 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/30"
              }`}
              onClick={() => {
                setActiveTab("database");
                if (orders.length === 0) fetchOrders();
              }}
            >
              🗄️ Base de données
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === "audit"
                  ? "bg-slate-700/50 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/30"
              }`}
              onClick={() => {
                setActiveTab("audit");
                fetchDbEdits();
              }}
            >
              📜 Historique
            </button>
          </div>
        </div>

        {/* LOGS TAB */}
        {activeTab === "logs" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
                <CardContent className="p-4">
                  <p className="text-slate-400 text-xs uppercase tracking-wider">
                    Total Connexions
                  </p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {logs.length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
                <CardContent className="p-4">
                  <p className="text-slate-400 text-xs uppercase tracking-wider">
                    IPs Uniques
                  </p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {uniqueIps.length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
                <CardContent className="p-4">
                  <p className="text-slate-400 text-xs uppercase tracking-wider">
                    Dernière 24h
                  </p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {
                      logs.filter((l) => {
                        const logDate = new Date(l.timestamp);
                        const now = new Date();
                        return (
                          now.getTime() - logDate.getTime() <
                          24 * 60 * 60 * 1000
                        );
                      }).length
                    }
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
                <CardContent className="p-4">
                  <p className="text-slate-400 text-xs uppercase tracking-wider">
                    Mobile
                  </p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {
                      logs.filter(
                        (l) =>
                          l.userAgent.includes("Mobile") ||
                          l.userAgent.includes("Android") ||
                          l.userAgent.includes("iPhone"),
                      ).length
                    }
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-red-900/30 backdrop-blur-xl border-red-700/50">
                <CardContent className="p-4">
                  <p className="text-red-400 text-xs uppercase tracking-wider">
                    IPs Bloquées
                  </p>
                  <p className="text-2xl font-bold text-red-300 mt-1">
                    {blockedIps.length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Blocked IPs */}
            {blockedIps.length > 0 && (
              <Card className="bg-red-900/20 backdrop-blur-xl border-red-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-red-300 flex items-center gap-2 text-lg">
                    <span>🚫</span> IPs Bloquées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {blockedIps.map((ip) => (
                      <div
                        key={ip}
                        className="flex items-center gap-2 bg-red-900/40 px-3 py-1.5 rounded-lg border border-red-700/50"
                      >
                        <span className="font-mono text-sm text-red-300">
                          {ip}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-red-400 hover:text-white hover:bg-red-600"
                          onClick={() => handleBlockIp(ip, "unblock")}
                          disabled={blockingIp === ip}
                        >
                          {blockingIp === ip ? "..." : "✕"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Logs Table */}
            <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span>📋</span> Journal des Connexions
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Les 50 dernières connexions au tableau de bord admin
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="text-5xl mb-4">📭</span>
                    <p className="text-slate-400">
                      Aucune connexion enregistrée
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-700 overflow-hidden overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-700/50 hover:bg-slate-700/50">
                          <TableHead className="text-slate-300">Date</TableHead>
                          <TableHead className="text-slate-300">IP</TableHead>
                          <TableHead className="text-slate-300">
                            Appareil
                          </TableHead>
                          <TableHead className="text-slate-300">
                            Navigateur
                          </TableHead>
                          <TableHead className="text-slate-300">OS</TableHead>
                          <TableHead className="text-slate-300">Pays</TableHead>
                          <TableHead className="text-slate-300 text-right">
                            Action
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.map((log, index) => {
                          const { device, browser, os } = parseUserAgent(
                            log.userAgent,
                          );
                          const isBlocked = blockedIps.includes(log.ip);
                          return (
                            <TableRow
                              key={index}
                              className={`border-slate-700 hover:bg-slate-700/30 ${isBlocked ? "bg-red-900/20" : ""}`}
                            >
                              <TableCell className="text-slate-300">
                                <div className="text-sm font-medium">
                                  {new Date(log.timestamp).toLocaleDateString(
                                    "fr-FR",
                                    { day: "numeric", month: "short" },
                                  )}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {new Date(log.timestamp).toLocaleTimeString(
                                    "fr-FR",
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={`font-mono text-xs ${isBlocked ? "bg-red-900/50 text-red-300 border-red-600" : "bg-slate-700/50 text-slate-300 border-slate-600"}`}
                                  >
                                    {log.ip}
                                  </Badge>
                                  {isBlocked && (
                                    <span className="text-red-400 text-xs">
                                      🚫
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {device}
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {browser}
                              </TableCell>
                              <TableCell className="text-slate-300">
                                {os}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className="bg-slate-700/50 text-slate-300"
                                >
                                  {log.country || "?"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {isBlocked ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                                    onClick={() =>
                                      handleBlockIp(log.ip, "unblock")
                                    }
                                    disabled={blockingIp === log.ip}
                                  >
                                    {blockingIp === log.ip
                                      ? "..."
                                      : "Débloquer"}
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                                    onClick={() =>
                                      handleBlockIp(log.ip, "block")
                                    }
                                    disabled={blockingIp === log.ip}
                                  >
                                    {blockingIp === log.ip ? "..." : "Bloquer"}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* DATABASE TAB */}
        {activeTab === "database" && (
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span>🗄️</span> Base de données - Commandes
              </CardTitle>
              <CardDescription className="text-slate-400">
                ⚠️ Modifiez avec précaution. Toutes les modifications sont
                enregistrées.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-5xl mb-4">📭</span>
                  <p className="text-slate-400">Aucune commande</p>
                  <Button onClick={fetchOrders} className="mt-4">
                    Charger les commandes
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-700 overflow-hidden overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-700/50 hover:bg-slate-700/50">
                        <TableHead className="text-slate-300">ID</TableHead>
                        <TableHead className="text-slate-300">Date</TableHead>
                        <TableHead className="text-slate-300">
                          Destinataire
                        </TableHead>
                        <TableHead className="text-slate-300">
                          Expéditeur
                        </TableHead>
                        <TableHead className="text-slate-300">
                          Formation
                        </TableHead>
                        <TableHead className="text-slate-300">Statut</TableHead>
                        <TableHead className="text-slate-300 text-right">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow
                          key={order.id}
                          className="border-slate-700 hover:bg-slate-700/30"
                        >
                          <TableCell className="font-mono text-xs text-slate-400">
                            {order.id.slice(-8)}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">
                            {new Date(order.created * 1000).toLocaleDateString(
                              "fr-FR",
                            )}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {order.metadata.recipientFirstName}{" "}
                            {order.metadata.recipientLastName}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {order.metadata.isAnonymous === "true" ? (
                              <span className="text-amber-400">Anonyme</span>
                            ) : (
                              order.metadata.name
                            )}
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">
                            {order.metadata.formation?.replace("BUT ", "")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                order.metadata.deliveryStatus === "delivered"
                                  ? "bg-green-600"
                                  : "bg-amber-500"
                              }
                            >
                              {order.metadata.deliveryStatus === "delivered"
                                ? "Livrée"
                                : "En attente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
                              onClick={() => openEditDialog(order)}
                            >
                              ✏️ Modifier
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* AUDIT TAB */}
        {activeTab === "audit" && (
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <span>📜</span> Historique des modifications
              </CardTitle>
              <CardDescription className="text-slate-400">
                Les 100 dernières modifications de la base de données
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dbEdits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-5xl mb-4">✨</span>
                  <p className="text-slate-400">
                    Aucune modification enregistrée
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dbEdits.map((edit, i) => (
                    <div
                      key={i}
                      className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Badge
                          variant="outline"
                          className="font-mono text-xs bg-slate-700/50 text-slate-300 border-slate-600"
                        >
                          {edit.paymentIntentId.slice(-8)}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(edit.timestamp).toLocaleString("fr-FR")}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-400">Champ:</span>{" "}
                        <span className="text-purple-400 font-medium">
                          {edit.field}
                        </span>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-red-400">-</span>{" "}
                          <span className="text-slate-400 line-through">
                            {edit.oldValue || "(vide)"}
                          </span>
                        </div>
                        <div>
                          <span className="text-green-400">+</span>{" "}
                          <span className="text-green-300">
                            {edit.newValue || "(vide)"}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        Par: {edit.editorIp}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <span>✏️</span> Modifier la commande
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              ID: {editingOrder?.id}
            </DialogDescription>
          </DialogHeader>

          {editingOrder && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Prénom destinataire</Label>
                  <Input
                    value={editForm.recipientFirstName || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        recipientFirstName: e.target.value,
                      })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Nom destinataire</Label>
                  <Input
                    value={editForm.recipientLastName || ""}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        recipientLastName: e.target.value,
                      })
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Nom expéditeur</Label>
                <Input
                  value={editForm.name || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Message</Label>
                <Textarea
                  value={editForm.message || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, message: e.target.value })
                  }
                  className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Formation</Label>
                  <Select
                    value={editForm.formation || ""}
                    onValueChange={(val) =>
                      setEditForm({ ...editForm, formation: val })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
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
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Type de tulipe</Label>
                  <Select
                    value={editForm.tulipType || ""}
                    onValueChange={(val) =>
                      setEditForm({ ...editForm, tulipType: val })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="rouge">Rouge</SelectItem>
                      <SelectItem value="rose">Rose</SelectItem>
                      <SelectItem value="blanche">Blanche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Anonyme</Label>
                  <Select
                    value={editForm.isAnonymous || "false"}
                    onValueChange={(val) =>
                      setEditForm({ ...editForm, isAnonymous: val })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="true">Oui</SelectItem>
                      <SelectItem value="false">Non</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Statut livraison</Label>
                  <Select
                    value={editForm.deliveryStatus || "pending"}
                    onValueChange={(val) =>
                      setEditForm({ ...editForm, deliveryStatus: val })
                    }
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="delivered">Livrée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingOrder(null)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
            >
              {saving
                ? "Enregistrement..."
                : "⚠️ Enregistrer les modifications"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
