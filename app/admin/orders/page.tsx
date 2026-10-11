"use client";

import React, { useEffect, useState } from "react";
import { 
  CreditCard, 
  ShoppingBag, 
  Truck, 
  Search, 
  ExternalLink, 
  Printer, 
  CheckCircle2, 
  Loader2,
  Trash2,
  PlusCircle,
  Save,
  Tag,
  Eye,
  X,
  MapPin,
  Calendar,
  AlertCircle,
  RotateCcw,
  Copy,
  Check,
  Clock,
  Wallet
} from "lucide-react";
import { 
  subscribeToAllPVCOrders, 
  updatePVCOrderStatus, 
  deletePVCOrder,
  refundPVCOrder,
  subscribeToAllShopOrders, 
  updateShopOrderStatus,
  deleteShopOrder,
  refundShopOrder,
  subscribeToSiteSettings,
  updateSiteSettings,
  DEFAULT_SITE_SETTINGS
} from "@/lib/firestore-service";
import { PVCCardOrder, ShopOrder, PVCOrderStatus, SiteSettings } from "@/lib/types";
import { formatCurrency, formatDateTime, getStatusBadgeClass, formatStatusLabel } from "@/lib/utils";

const DEFAULT_CARD_TYPES = [
  "Aadhaar Card",
  "PAN Card",
  "Voter ID",
  "Driving Licence",
  "RC PVC Card",
  "Ayushman Card",
  "ABHA Card",
  "Ration Card PVC",
  "APAAR ID Card",
  "E-Shram Card",
  "Custom ID"
];

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<'pvc-pricing' | 'pvc-orders' | 'shop-orders'>('pvc-pricing');
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  
  // PVC Orders State
  const [pvcOrders, setPvcOrders] = useState<PVCCardOrder[]>([]);
  const [searchPVC, setSearchPVC] = useState("");
  const [selectedPVC, setSelectedPVC] = useState<PVCCardOrder | null>(null);
  const [pvcModalOpen, setPvcModalOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierName, setCourierName] = useState("India Post");
  const [pvcStatus, setPvcStatus] = useState<PVCOrderStatus>('processing');
  const [updatingPVC, setUpdatingPVC] = useState(false);

  // Shop Orders State
  const [shopOrders, setShopOrders] = useState<ShopOrder[]>([]);
  const [searchShop, setSearchShop] = useState("");
  const [selectedShop, setSelectedShop] = useState<ShopOrder | null>(null);
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [shopStatus, setShopStatus] = useState<ShopOrder['status']>('processing');
  const [shopTracking, setShopTracking] = useState("");
  const [updatingShop, setUpdatingShop] = useState(false);

  // Card Pricing Manager State
  const [cardPrices, setCardPrices] = useState<Record<string, number>>({});
  const [savingPrices, setSavingPrices] = useState(false);
  const [newCardName, setNewCardName] = useState("");
  const [newCardPrice, setNewCardPrice] = useState<number>(60);

  useEffect(() => {
    const unsubSettings = subscribeToSiteSettings((s) => {
      setSettings(s);
      const merged: Record<string, number> = {
        'Aadhaar Card': 50,
        'PAN Card': 70,
        'Voter ID': 60,
        'Driving Licence': 90,
        'RC PVC Card': 90,
        'Ayushman Card': 60,
        'ABHA Card': 50,
        'Ration Card PVC': 60,
        'APAAR ID Card': 60,
        'E-Shram Card': 50,
        'Custom ID': 80,
        ...(s.pvcCardPrices || {})
      };
      setCardPrices(merged);
    });

    const unsubPVC = subscribeToAllPVCOrders((data) => {
      setPvcOrders(data);
    });

    const unsubShop = subscribeToAllShopOrders((data) => {
      setShopOrders(data);
    });

    return () => {
      unsubSettings();
      unsubPVC();
      unsubShop();
    };
  }, []);

  // Update Price for a specific card
  const handlePriceChange = (cardName: string, newPrice: number) => {
    setCardPrices(prev => ({
      ...prev,
      [cardName]: newPrice
    }));
  };

  // Save all prices to Firestore
  const handleSaveAllPrices = async () => {
    setSavingPrices(true);
    try {
      await updateSiteSettings({ pvcCardPrices: cardPrices }, "admin", "Admin Staff");
      alert("Success! PVC Card prices saved to database and live on website.");
    } catch (err: any) {
      alert("Failed to save card prices: " + (err.message || err));
    } finally {
      setSavingPrices(false);
    }
  };

  // Add new card type
  const handleAddNewCardType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardName.trim()) return;

    const trimmed = newCardName.trim();
    const updated = {
      ...cardPrices,
      [trimmed]: Number(newCardPrice) || 60
    };
    setCardPrices(updated);
    setNewCardName("");
    setNewCardPrice(60);

    try {
      await updateSiteSettings({ pvcCardPrices: updated }, "admin", "Admin Staff");
      alert(`Card type "${trimmed}" added with price ₹${newCardPrice}!`);
    } catch (err: any) {
      alert("Failed to add card type: " + (err.message || err));
    }
  };

  // Remove card type
  const handleRemoveCardType = async (cardName: string) => {
    if (!window.confirm(`Delete card type "${cardName}"?`)) return;
    const copy = { ...cardPrices };
    delete copy[cardName];
    setCardPrices(copy);
    try {
      await updateSiteSettings({ pvcCardPrices: copy }, "admin", "Admin Staff");
    } catch (err: any) {
      alert("Failed to delete card: " + (err.message || err));
    }
  };

  // PVC Orders filtering
  const filteredPVC = pvcOrders.filter(p => {
    const q = searchPVC.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.id || "").toLowerCase().includes(q) ||
      (p.userName || "").toLowerCase().includes(q) ||
      (p.userPhone || "").toLowerCase().includes(q) ||
      (p.cardType || "").toLowerCase().includes(q) ||
      (p.cardIdentifier || "").toLowerCase().includes(q)
    );
  });

  const handleOpenPVCModal = (order: PVCCardOrder) => {
    setSelectedPVC(order);
    setPvcStatus(order.status);
    setTrackingNumber(order.trackingNumber || "");
    setCourierName(order.courierName || "India Post");
    setPvcModalOpen(true);
  };

  const handleUpdatePVCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPVC) return;
    setUpdatingPVC(true);
    try {
      await updatePVCOrderStatus(selectedPVC.id, pvcStatus, trackingNumber, courierName);
      alert(`PVC Order ${selectedPVC.id} updated.`);
      setPvcModalOpen(false);
    } catch (err: any) {
      alert("Failed to update PVC Order: " + (err.message || err));
    } finally {
      setUpdatingPVC(false);
    }
  };

  const handleDeletePVC = async (id: string, name: string) => {
    if (!window.confirm(`Permanently delete PVC order ${id} for ${name}?`)) return;
    try {
      await deletePVCOrder(id);
    } catch (err: any) {
      alert("Failed to delete order: " + (err.message || err));
    }
  };

  // Shop Orders filtering
  const filteredShop = shopOrders.filter(o => {
    const q = searchShop.toLowerCase().trim();
    if (!q) return true;
    return (
      (o.id || "").toLowerCase().includes(q) ||
      (o.userName || "").toLowerCase().includes(q) ||
      (o.userPhone || "").toLowerCase().includes(q) ||
      (o.status || "").toLowerCase().includes(q)
    );
  });

  const handleOpenShopModal = (order: ShopOrder) => {
    setSelectedShop(order);
    setShopStatus(order.status);
    setShopTracking(order.trackingNumber || "");
    setShopModalOpen(true);
  };

  const handleUpdateShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop) return;
    setUpdatingShop(true);
    try {
      await updateShopOrderStatus(selectedShop.id, shopStatus, shopTracking);
      alert(`Shop Order ${selectedShop.id} updated.`);
      setShopModalOpen(false);
    } catch (err: any) {
      alert("Failed to update Shop Order: " + (err.message || err));
    } finally {
      setUpdatingShop(false);
    }
  };

  const handleDeleteShop = async (id: string, name: string) => {
    if (!window.confirm(`Permanently delete shop order ${id} for ${name}?`)) return;
    try {
      await deleteShopOrder(id);
    } catch (err: any) {
      alert("Failed to delete order: " + (err.message || err));
    }
  };

  // Refund states
  const [refundingPVC, setRefundingPVC] = useState(false);
  const [refundingShop, setRefundingShop] = useState(false);
  const [copiedUtr, setCopiedUtr] = useState(false);

  const handleRefundPVC = async () => {
    if (!selectedPVC) return;
    if (selectedPVC.paymentStatus === 'refunded' || (selectedPVC as any).isRefunded || (selectedPVC as any).refundProcessed) {
      alert("This PVC card order has already been refunded to citizen wallet.");
      return;
    }
    const refundAmt = selectedPVC.totalPrice || selectedPVC.totalAmount || 0;
    if (!window.confirm(`Are you sure you want to CANCEL and REFUND ₹${refundAmt} directly to citizen ${selectedPVC.userName}'s NetDuniya Digital Wallet balance?`)) {
      return;
    }
    setRefundingPVC(true);
    try {
      const res = await refundPVCOrder(selectedPVC.id, {
        adminName: 'Admin Staff',
        reason: 'Order cancelled by admin - refund credited to citizen wallet'
      });
      // Instantly update local order states so button closes permanently
      setSelectedPVC(prev => prev ? {
        ...prev,
        paymentStatus: 'refunded',
        status: 'cancelled',
        isRefunded: true,
        refundProcessed: true,
      } : null);
      setPvcOrders(prev => prev.map(o => o.id === selectedPVC.id ? {
        ...o,
        paymentStatus: 'refunded',
        status: 'cancelled',
        isRefunded: true,
        refundProcessed: true,
      } : o));
      alert(`Success! ₹${res.refundedAmount} has been credited directly to ${selectedPVC.userName}'s citizen digital wallet.`);
      setPvcModalOpen(false);
    } catch (err: any) {
      alert("Refund failed: " + (err.message || err));
    } finally {
      setRefundingPVC(false);
    }
  };

  const handleRefundShop = async () => {
    if (!selectedShop) return;
    if (selectedShop.paymentStatus === 'refunded' || (selectedShop as any).isRefunded || (selectedShop as any).refundProcessed) {
      alert("This shop order has already been refunded to citizen wallet.");
      return;
    }
    const refundAmt = selectedShop.totalAmount || 0;
    if (!window.confirm(`Are you sure you want to CANCEL and REFUND ₹${refundAmt} directly to citizen ${selectedShop.userName}'s NetDuniya Digital Wallet balance?`)) {
      return;
    }
    setRefundingShop(true);
    try {
      const res = await refundShopOrder(selectedShop.id, {
        adminName: 'Admin Staff',
        reason: 'Order cancelled by admin - refund credited to citizen wallet'
      });
      // Instantly update local shop order states so button closes permanently
      setSelectedShop(prev => prev ? {
        ...prev,
        paymentStatus: 'refunded',
        status: 'cancelled',
        isRefunded: true,
        refundProcessed: true,
      } : null);
      setShopOrders(prev => prev.map(o => o.id === selectedShop.id ? {
        ...o,
        paymentStatus: 'refunded',
        status: 'cancelled',
        isRefunded: true,
        refundProcessed: true,
      } : o));
      alert(`Success! ₹${res.refundedAmount} has been credited directly to ${selectedShop.userName}'s citizen digital wallet.`);
      setShopModalOpen(false);
    } catch (err: any) {
      alert("Refund failed: " + (err.message || err));
    } finally {
      setRefundingShop(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-200 p-4 sm:p-6 space-y-6">
      
      {/* Top Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
        <div>
          <h1 className="text-lg font-black text-slate-900">PVC Cards & Customer Orders Hub</h1>
          <p className="text-xs text-slate-500">Configure PVC card pricing, manage printing dispatch queue, and fulfill citizen orders.</p>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('pvc-pricing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 flex-shrink-0 cursor-pointer ${
              activeTab === 'pvc-pricing' ? "bg-brand-blue text-white shadow" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>PVC Cards & Pricing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pvc-orders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 flex-shrink-0 cursor-pointer ${
              activeTab === 'pvc-orders' ? "bg-brand-blue text-white shadow" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Printer className="h-3.5 w-3.5" />
            <span>PVC Print Orders ({pvcOrders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shop-orders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 flex-shrink-0 cursor-pointer ${
              activeTab === 'shop-orders' ? "bg-brand-blue text-white shadow" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Shop Orders ({shopOrders.length})</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: PVC CARDS & PRICING ================= */}
      {activeTab === 'pvc-pricing' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/70 p-4 rounded-xl border border-blue-200">
            <div>
              <h2 className="text-sm font-black text-blue-950">Dynamic Smart Card Pricing Manager</h2>
              <p className="text-xs text-blue-800 mt-0.5">
                Prices modified here immediately update the website on the <strong>/pvc-card</strong> order page in real-time.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveAllPrices}
              disabled={savingPrices}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2 rounded-lg shadow flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {savingPrices ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save All Prices Live</span>
            </button>
          </div>

          {/* Existing Card Types Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {Object.entries(cardPrices).map(([cardName, price]) => (
              <div key={cardName} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between hover:border-slate-300 transition">
                <div className="pr-2">
                  <div className="flex items-center space-x-1.5">
                    <CreditCard className="h-4 w-4 text-brand-blue flex-shrink-0" />
                    <h3 className="text-xs font-bold text-slate-900 truncate">{cardName}</h3>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">PVC Smart Card</span>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <div className="relative w-20">
                    <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => handlePriceChange(cardName, Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-6 pr-2 py-1 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCardType(cardName)}
                    className="p-1 rounded text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                    title="Delete card type"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Card Type Form */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
              <PlusCircle className="h-4 w-4 text-brand-blue" />
              <span>Add New Smart Card Type</span>
            </h3>

            <form onSubmit={handleAddNewCardType} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newCardName}
                onChange={(e) => setNewCardName(e.target.value)}
                placeholder="Card Name (e.g. Student ID Card, PM-Kisan ID, Staff ID)..."
                required
                className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <div className="relative w-32">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  value={newCardPrice}
                  onChange={(e) => setNewCardPrice(Number(e.target.value))}
                  placeholder="Price"
                  required
                  className="w-full bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
              <button
                type="submit"
                className="bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg shadow transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Card</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= TAB 2: PVC PRINT ORDERS ================= */}
      {activeTab === 'pvc-orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchPVC}
                onChange={(e) => setSearchPVC(e.target.value)}
                placeholder="Search orders by Order ID, citizen name, phone, or card type..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-lg flex items-center">
              Total Orders: {pvcOrders.length}
            </span>
          </div>

          <div className="admin-table-container overflow-x-auto w-full border-2 border-slate-300 rounded-xl shadow-xs">
            <table className="min-w-full whitespace-nowrap text-left text-xs">
              <thead className="bg-slate-100 text-slate-900 font-black uppercase text-[11px] border-b-2 border-slate-300">
                <tr>
                  <th className="p-3.5 text-slate-900">Order ID</th>
                  <th className="p-3.5 text-slate-900">Customer Name</th>
                  <th className="p-3.5 text-slate-900">Mobile Phone</th>
                  <th className="p-3.5 text-slate-900">Card Type</th>
                  <th className="p-3.5 text-slate-900">Card Number / ID</th>
                  <th className="p-3.5 text-slate-900">Qty & Amount</th>
                  <th className="p-3.5 text-slate-900">Payment & UTR</th>
                  <th className="p-3.5 text-slate-900">Status</th>
                  <th className="p-3.5 text-slate-900">Courier & Tracking</th>
                  <th className="p-3.5 text-slate-900">Order Date</th>
                  <th className="p-3.5 text-right text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredPVC.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      No PVC print orders found.
                    </td>
                  </tr>
                ) : (
                  filteredPVC.map((order) => {
                    const detectedUtr = order.utrNumber || (order.paymentId?.startsWith("UPI-") ? order.paymentId.replace("UPI-", "") : null);
                    return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-brand-blue">
                        {order.id}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {order.userName}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {order.userPhone}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {order.cardType}
                      </td>
                      <td className="p-3.5 font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded w-fit">
                        {order.cardIdentifier}
                      </td>
                      <td className="p-3.5 font-black text-emerald-700">
                        {order.quantity}x &bull; {formatCurrency(order.totalPrice || order.totalAmount || 0)}
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            order.paymentStatus === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {order.paymentMethod ? order.paymentMethod.toUpperCase() : 'PAID'}
                          </span>
                          {detectedUtr ? (
                            <div className="font-mono text-[11px] font-black text-purple-950 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <span className="text-[9px] text-purple-600 font-bold">UTR:</span>
                              <span>{detectedUtr}</span>
                            </div>
                          ) : order.paymentId ? (
                            <div className="font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                              {order.paymentId}
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(order.status)}`}>
                          {formatStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {order.trackingNumber ? (
                          <span className="font-mono text-blue-700 font-bold">{order.courierName || 'Courier'}: {order.trackingNumber}</span>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px]">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenPVCModal(order)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-brand-blue font-bold hover:bg-blue-100 transition inline-flex items-center space-x-1 cursor-pointer"
                          title="Inspect Details & Update Dispatch"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Dispatch</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePVC(order.id, order.userName)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition inline-flex items-center space-x-1 cursor-pointer"
                          title="Delete Order"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: SHOP ORDERS ================= */}
      {activeTab === 'shop-orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchShop}
                onChange={(e) => setSearchShop(e.target.value)}
                placeholder="Search shop orders by ID, name or phone..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue"
              />
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-lg flex items-center">
              Total Shop Orders: {shopOrders.length}
            </span>
          </div>

          <div className="admin-table-container overflow-x-auto w-full border-2 border-slate-300 rounded-xl shadow-xs">
            <table className="min-w-full whitespace-nowrap text-left text-xs">
              <thead className="bg-slate-100 text-slate-900 font-black uppercase text-[11px] border-b-2 border-slate-300">
                <tr>
                  <th className="p-3.5 text-slate-900">Order ID</th>
                  <th className="p-3.5 text-slate-900">Customer Name</th>
                  <th className="p-3.5 text-slate-900">Mobile Phone</th>
                  <th className="p-3.5 text-slate-900">Items Purchased</th>
                  <th className="p-3.5 text-slate-900">Total Amount</th>
                  <th className="p-3.5 text-slate-900">Status</th>
                  <th className="p-3.5 text-slate-900">Tracking Number</th>
                  <th className="p-3.5 text-slate-900">Order Date</th>
                  <th className="p-3.5 text-right text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredShop.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No shop merchandise orders found.
                    </td>
                  </tr>
                ) : (
                  filteredShop.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-brand-blue">
                        {order.id}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {order.userName}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {order.userPhone}
                      </td>
                      <td className="p-3.5 text-slate-700">
                        {order.items?.length || 0} Products
                      </td>
                      <td className="p-3.5 font-black text-emerald-700">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeClass(order.status)}`}>
                          {formatStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {order.trackingNumber || "—"}
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px]">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenShopModal(order)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-brand-blue font-bold hover:bg-blue-100 transition inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Update</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteShop(order.id, order.userName)}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PVC Dispatch & Status Modal */}
      {pvcModalOpen && selectedPVC && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-5">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-brand-blue">{selectedPVC.id}</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">{selectedPVC.cardType} Smart Card</h3>
                <p className="text-xs text-slate-500">
                  Recipient: <strong>{selectedPVC.userName}</strong> &bull; {selectedPVC.userPhone}
                </p>
              </div>
              <button 
                onClick={() => setPvcModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Delivery Address */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px] block flex items-center space-x-1">
                <MapPin className="h-3 w-3 text-brand-blue" />
                <span>Delivery Address:</span>
              </span>
              <p className="font-medium text-slate-800">
                {(selectedPVC.deliveryAddress || selectedPVC.shippingAddress)?.street || "No street"},{" "}
                {(selectedPVC.deliveryAddress || selectedPVC.shippingAddress)?.city || ""},{" "}
                {(selectedPVC.deliveryAddress || selectedPVC.shippingAddress)?.state || ""} -{" "}
                {(selectedPVC.deliveryAddress || selectedPVC.shippingAddress)?.pincode || ""}
              </p>
            </div>

            {/* Submission Time & Customer Payment UTR Card */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center space-x-1.5 text-slate-700">
                  <Clock className="h-4 w-4 text-brand-blue flex-shrink-0" />
                  <span className="font-bold">Submission Time:</span>
                  <span className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {formatDateTime(selectedPVC.createdAt)}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-500 text-[11px]">Payment:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    selectedPVC.paymentStatus === 'refunded'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : selectedPVC.paymentStatus === 'success'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {selectedPVC.paymentStatus || 'pending'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-700 text-xs">Customer UTR / Ref:</span>
                  <span className="font-mono font-black text-xs text-purple-900 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {selectedPVC.utrNumber || selectedPVC.paymentId || "Direct / Cash (No UTR)"}
                  </span>
                  {(selectedPVC.utrNumber || selectedPVC.paymentId) && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedPVC.utrNumber || selectedPVC.paymentId || "");
                        setCopiedUtr(true);
                        setTimeout(() => setCopiedUtr(false), 2000);
                      }}
                      className="p-1 text-slate-400 hover:text-brand-blue transition rounded hover:bg-slate-200 cursor-pointer"
                      title="Copy UTR / Transaction ID"
                    >
                      {copiedUtr ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-slate-500 text-xs">Total: </span>
                  <span className="font-black text-sm text-emerald-700">
                    {formatCurrency(selectedPVC.totalPrice || selectedPVC.totalAmount || 0)}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdatePVCSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dispatch Status</label>
                  <select
                    value={pvcStatus}
                    onChange={(e) => setPvcStatus(e.target.value as PVCOrderStatus)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none"
                  >
                    <option value="pending_payment">Pending Payment</option>
                    <option value="processing">Processing (In Printing Queue)</option>
                    <option value="printed">Printed (Ready for Dispatch)</option>
                    <option value="shipped">Shipped (Dispatched)</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Courier Service</label>
                  <input
                    type="text"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    placeholder="e.g. India Post Speed Post"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tracking Number / AWB</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. EW123456789IN"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t">
                {!(selectedPVC.paymentStatus === 'refunded' || (selectedPVC as any).isRefunded || (selectedPVC as any).refundProcessed || selectedPVC.status === 'cancelled') ? (
                  <button
                    type="button"
                    onClick={handleRefundPVC}
                    disabled={refundingPVC}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    title="Cancel order and deposit refund directly into citizen's wallet"
                  >
                    {refundingPVC ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    <span>Cancel & Refund to Citizen Wallet</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-200 flex items-center space-x-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Refund Closed &amp; Wallet Credited</span>
                  </span>
                )}

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setPvcModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={updatingPVC}
                    className="px-4 py-2 rounded-lg bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs shadow disabled:opacity-50"
                  >
                    {updatingPVC ? "Saving..." : "Save Order"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shop Order Modal */}
      {shopModalOpen && selectedShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-5">
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-brand-blue">{selectedShop.id}</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">Shop Order Dispatch</h3>
                <p className="text-xs text-slate-500">
                  Recipient: <strong>{selectedShop.userName}</strong> &bull; {selectedShop.userPhone}
                </p>
              </div>
              <button 
                onClick={() => setShopModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Order Submission Time & Price Card */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center space-x-1.5 text-slate-700">
                  <Clock className="h-4 w-4 text-brand-blue flex-shrink-0" />
                  <span className="font-bold">Submitted At:</span>
                  <span className="font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {formatDateTime(selectedShop.createdAt)}
                  </span>
                </div>
                <span className="font-black text-emerald-700 text-sm">
                  Total: {formatCurrency(selectedShop.totalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Payment Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  selectedShop.paymentStatus === 'refunded'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {selectedShop.paymentStatus || 'pending'}
                </span>
              </div>
            </div>

            <form onSubmit={handleUpdateShopSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select
                  value={shopStatus}
                  onChange={(e) => setShopStatus(e.target.value as ShopOrder['status'])}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tracking Number</label>
                <input
                  type="text"
                  value={shopTracking}
                  onChange={(e) => setShopTracking(e.target.value)}
                  placeholder="e.g. TRK12345678"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t">
                {!(selectedShop.paymentStatus === 'refunded' || (selectedShop as any).isRefunded || (selectedShop as any).refundProcessed || selectedShop.status === 'cancelled') ? (
                  <button
                    type="button"
                    onClick={handleRefundShop}
                    disabled={refundingShop}
                    className="w-full sm:w-auto px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    title="Cancel order and deposit refund directly into citizen's wallet"
                  >
                    {refundingShop ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    <span>Cancel & Refund to Citizen Wallet</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-200 flex items-center space-x-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Refund Closed &amp; Wallet Credited</span>
                  </span>
                )}

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShopModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={updatingShop}
                    className="px-4 py-2 rounded-lg bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs shadow disabled:opacity-50"
                  >
                    {updatingShop ? "Saving..." : "Save Status"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
