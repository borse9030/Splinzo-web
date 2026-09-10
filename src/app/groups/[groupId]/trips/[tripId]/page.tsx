"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTripPlans } from "@/hooks/useTripPlans";
import { useGroup } from "@/hooks/useGroup";
import { useTrips } from "@/hooks/useTrips";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, doc, deleteDoc, updateDoc, onSnapshot, Timestamp, query, orderBy, serverTimestamp } from "firebase/firestore";
import { storageService } from "@/services/storageService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, MapPin, Calendar, Clock, Plus, X, CalendarDays, CheckCircle2, 
  Plane, Utensils, Bed, Ticket, Car, Coffee, Trash2, Camera, CheckSquare, 
  Image as ImageIcon, Check, DollarSign 
} from "lucide-react";

const AMBER = "#F9B912";

interface PackingItem {
  id: string;
  title: string;
  category: string;
  isPacked: boolean;
  assignedToName?: string;
}

interface TripPhoto {
  id: string;
  imageUrl: string;
  caption?: string;
  uploadedByName: string;
}

export default function TripDetailsPage({
  params,
}: {
  params: Promise<{ groupId: string; tripId: string }>;
}) {
  const resolvedParams = use(params);
  const { groupId, tripId } = resolvedParams;
  const router = useRouter();
  
  const { group, loading: groupLoading } = useGroup(groupId);
  const { trips, loading: tripsLoading } = useTrips(groupId);
  const { plans, loading: plansLoading } = useTripPlans(groupId, tripId);
  const { expenses } = useExpenses(groupId);
  const { appUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"itinerary" | "packing" | "photos">("itinerary");

  // Itinerary Plan Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Packing Checklist state
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [newPackingTitle, setNewPackingTitle] = useState("");
  const [newPackingCategory, setNewPackingCategory] = useState("Essentials");
  const [assignedMemberName, setAssignedMemberName] = useState("");
  const [showPackingModal, setShowPackingModal] = useState(false);

  // Photo Vault state
  const [photos, setPhotos] = useState<TripPhoto[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Subscribe to Packing Checklist
  useEffect(() => {
    const q = collection(db, "groups", groupId, "trips", tripId, "packing_checklist");
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PackingItem));
      setPackingItems(items);
    });
    return () => unsub();
  }, [groupId, tripId]);

  // Subscribe to Photo Vault
  useEffect(() => {
    const q = query(
      collection(db, "groups", groupId, "trips", tripId, "photos"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TripPhoto));
      setPhotos(items);
    }, (err) => {
      console.error("Photos subscription error:", err);
    });
    return () => unsub();
  }, [groupId, tripId]);

  const loading = groupLoading || tripsLoading || plansLoading;
  const trip = trips.find(t => t.id === tripId);

  if (loading) {
    return (
      <div className="space-y-6 mt-4 pb-10">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-bold">Trip Not Found</h2>
        <Button onClick={() => router.back()} className="mt-4" variant="outline">Go Back</Button>
      </div>
    );
  }

  // Budget calculations
  const totalSpent = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  const targetBudget = (trip as any).targetBudget || (totalSpent > 0 ? totalSpent * 1.3 : 30000);
  const budgetRatio = Math.min(1, totalSpent / targetBudget);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !appUser) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "groups", groupId, "trips", tripId, "plans"), {
        title,
        date: Timestamp.fromDate(new Date(date)),
        time: time || "",
        location: location || "",
        description: description || "",
        createdByUid: appUser.id,
        updatedBy: appUser.id,
      });

      setTitle("");
      setDate("");
      setTime("");
      setLocation("");
      setDescription("");
      setIsPlanModalOpen(false);
    } catch (err) {
      console.error("Failed to create plan:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePacking = async (item: PackingItem) => {
    try {
      await updateDoc(doc(db, "groups", groupId, "trips", tripId, "packing_checklist", item.id), {
        isPacked: !item.isPacked
      });
    } catch (e) {
      console.error("Toggle packing error", e);
    }
  };

  const handleAddPackingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackingTitle.trim()) return;
    try {
      await addDoc(collection(db, "groups", groupId, "trips", tripId, "packing_checklist"), {
        title: newPackingTitle.trim(),
        category: newPackingCategory,
        isPacked: false,
        assignedToName: assignedMemberName || null,
        createdAt: serverTimestamp(),
      });
      setNewPackingTitle("");
      setAssignedMemberName("");
      setShowPackingModal(false);
    } catch (e) {
      console.error("Add packing error", e);
    }
  };

  const handleDeletePackingItem = async (itemId: string) => {
    try {
      await deleteDoc(doc(db, "groups", groupId, "trips", tripId, "packing_checklist", itemId));
    } catch (e) {
      console.error("Delete item error", e);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !appUser) return;
    try {
      setUploadingPhoto(true);
      const url = await storageService.uploadFile(file);
      await addDoc(collection(db, "groups", groupId, "trips", tripId, "photos"), {
        imageUrl: url,
        uploadedByUid: appUser.id,
        uploadedByName: appUser.displayName?.split(" ")[0] || "Member",
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Upload error", err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const fmtDate = (ts: Timestamp) => {
    if (!ts) return "";
    return ts.toDate().toLocaleDateString("en-US", { weekday: 'short', month: "short", day: "numeric" });
  };

  const getPlanIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("flight") || t.includes("airport") || t.includes("plane")) return <Plane className="h-5 w-5 text-white" />;
    if (t.includes("hotel") || t.includes("stay") || t.includes("airbnb")) return <Bed className="h-5 w-5 text-white" />;
    if (t.includes("eat") || t.includes("dinner") || t.includes("lunch") || t.includes("food")) return <Utensils className="h-5 w-5 text-white" />;
    if (t.includes("coffee") || t.includes("tea")) return <Coffee className="h-5 w-5 text-white" />;
    if (t.includes("car") || t.includes("taxi")) return <Car className="h-5 w-5 text-white" />;
    if (t.includes("ticket") || t.includes("movie")) return <Ticket className="h-5 w-5 text-white" />;
    return <CheckCircle2 className="h-5 w-5 text-white" />;
  };

  // Group plans by date
  const groupedPlans: Record<string, typeof plans> = {};
  plans.forEach(plan => {
    const dStr = fmtDate(plan.date);
    if (!groupedPlans[dStr]) groupedPlans[dStr] = [];
    groupedPlans[dStr].push(plan);
  });

  const packedCount = packingItems.filter(i => i.isPacked).length;

  return (
    <div className="pb-20 relative">
      
      {/* --- Hero Section --- */}
      <div className="h-64 sm:h-72 relative overflow-hidden bg-gray-100 rounded-b-3xl sm:rounded-3xl shadow-sm -mx-4 sm:mx-0 -mt-4 sm:mt-0 mb-6">
        <button 
          onClick={() => router.back()}
          className="absolute top-8 left-4 z-30 h-10 w-10 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 z-10" />
        {trip.coverImageUrl ? (
          <img src={trip.coverImageUrl} alt={trip.destination} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F9B912 0%, #FFB300 50%, #FF8F00 100%)" }}>
            <MapPin className="h-16 w-16 text-white/40" />
          </div>
        )}
        <div className="absolute bottom-5 left-5 right-5 z-20">
          <h1 className="font-extrabold text-3xl sm:text-4xl text-white drop-shadow-md mb-2">{trip.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-white/90 font-medium text-sm sm:text-base">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1.5 opacity-80" />
              {trip.destination}
            </div>
            <div className="w-1.5 h-1.5 bg-white/50 rounded-full" />
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1.5 opacity-80" />
              {fmtDate(trip.startDate)} - {fmtDate(trip.endDate)}
            </div>
          </div>
        </div>
      </div>

      {/* --- Trip Budget Meter --- */}
      <div className="rounded-2xl p-5 mb-6 text-white relative overflow-hidden"
           style={{ background: "linear-gradient(135deg, #1E293B, #0F172A)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Trip Budget Meter</span>
          <span className="text-xs font-bold text-slate-300">{(budgetRatio * 100).toFixed(0)}% Used</span>
        </div>
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-2xl font-black">
            {group?.currency === "INR" ? "₹" : group?.currency || "₹"}{totalSpent.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-slate-400">
            Target: {group?.currency === "INR" ? "₹" : group?.currency || "₹"}{targetBudget.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="h-2 w-full bg-slate-700/60 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${budgetRatio * 100}%`,
              background: budgetRatio > 0.9 ? "#EF4444" : AMBER 
            }}
          />
        </div>
      </div>

      {/* --- 3-Tab Segmented Switcher --- */}
      <div className="flex p-1 rounded-2xl mb-6" style={{ background: "var(--muted)" }}>
        <button
          onClick={() => setActiveTab("itinerary")}
          className="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
          style={{
            background: activeTab === "itinerary" ? "var(--card)" : "transparent",
            color: activeTab === "itinerary" ? "var(--foreground)" : "var(--muted-foreground)",
            boxShadow: activeTab === "itinerary" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
          }}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Itinerary ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab("packing")}
          className="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
          style={{
            background: activeTab === "packing" ? "var(--card)" : "transparent",
            color: activeTab === "packing" ? "var(--foreground)" : "var(--muted-foreground)",
            boxShadow: activeTab === "packing" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
          }}
        >
          <CheckSquare className="h-3.5 w-3.5" />
          Packing ({packedCount}/{packingItems.length})
        </button>
        <button
          onClick={() => setActiveTab("photos")}
          className="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
          style={{
            background: activeTab === "photos" ? "var(--card)" : "transparent",
            color: activeTab === "photos" ? "var(--foreground)" : "var(--muted-foreground)",
            boxShadow: activeTab === "photos" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
          }}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          Photos ({photos.length})
        </button>
      </div>

      {/* ── TAB 1: ITINERARY ── */}
      {activeTab === "itinerary" && (
        <div>
          <div className="flex items-center justify-between px-1 mb-4">
            <h2 className="text-lg font-bold tracking-tight" style={{ color: "var(--foreground)" }}>Day-by-Day Route</h2>
            <Button 
              onClick={() => setIsPlanModalOpen(true)}
              className="rounded-full shadow-md font-bold text-xs"
              style={{ background: AMBER, color: "#1a1a1a" }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Plan
            </Button>
          </div>

          {plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center rounded-3xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <CalendarDays className="h-10 w-10 text-amber-500 mb-2" />
              <h3 className="font-bold text-base" style={{ color: "var(--foreground)" }}>No Plans Yet</h3>
              <p className="text-xs text-gray-500 mt-1">Start adding activities, flights, or reservations.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedPlans).map(([dateLabel, dayPlans], index) => (
                <div key={dateLabel}>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2.5">
                    Day {index + 1} · {dateLabel}
                  </div>
                  <div className="space-y-3">
                    {dayPlans.map(plan => (
                      <div key={plan.id} className="flex items-center gap-3.5 p-4 rounded-2xl border"
                           style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: AMBER }}>
                          {getPlanIcon(plan.title)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>{plan.title}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{plan.time} {plan.location ? `• ${plan.location}` : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: PACKING CHECKLIST ── */}
      {activeTab === "packing" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Group Packing Checklist</h2>
            <Button
              onClick={() => setShowPackingModal(true)}
              className="rounded-full shadow-md font-bold text-xs"
              style={{ background: AMBER, color: "#1a1a1a" }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
            </Button>
          </div>

          {packingItems.length === 0 ? (
            <div className="text-center py-12 rounded-3xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <CheckSquare className="h-10 w-10 mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Checklist is empty</p>
              <p className="text-xs text-gray-500 mt-1">Coordinate who's bringing the speaker, sunscreen, chargers, or cards.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {packingItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3.5 rounded-2xl border"
                     style={{ background: "var(--card)", borderColor: item.isPacked ? "#BBF7D0" : "var(--border)" }}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleTogglePacking(item)}
                      className="h-6 w-6 rounded-lg flex items-center justify-center border transition-all"
                      style={{
                        background: item.isPacked ? AMBER : "transparent",
                        borderColor: item.isPacked ? AMBER : "var(--border)",
                      }}
                    >
                      {item.isPacked && <Check className="h-4 w-4 text-gray-900 stroke-[3]" />}
                    </button>
                    <div>
                      <span className={`text-sm font-bold block ${item.isPacked ? 'line-through text-gray-400' : ''}`}
                            style={{ color: item.isPacked ? undefined : "var(--foreground)" }}>
                        {item.title}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {item.category} {item.assignedToName ? `• ${item.assignedToName}` : ""}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeletePackingItem(item.id)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: PHOTO VAULT ── */}
      {activeTab === "photos" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Shared Trip Photo Vault</h2>
            <label className="cursor-pointer">
              <input type="file" accept="image/*" onChange={handleUploadPhoto} className="hidden" />
              <span className="px-4 py-2 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-md"
                    style={{ background: AMBER, color: "#1a1a1a" }}>
                <Camera className="h-3.5 w-3.5" />
                {uploadingPhoto ? "Uploading..." : "Upload Photo"}
              </span>
            </label>
          </div>

          {photos.length === 0 ? (
            <div className="text-center py-12 rounded-3xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <ImageIcon className="h-10 w-10 mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>No photos uploaded yet</p>
              <p className="text-xs text-gray-500 mt-1">Upload your best shots to keep all trip memories together.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map(p => (
                <div key={p.id} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm group">
                  <img src={p.imageUrl} alt="Trip photo" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-white text-[11px] font-bold">
                    {p.uploadedByName}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Packing Item */}
      {showPackingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl p-6 shadow-2xl relative" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base" style={{ color: "var(--foreground)" }}>Add Checklist Item</h3>
              <button onClick={() => setShowPackingModal(false)} className="text-gray-400"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddPackingItem} className="space-y-4">
              <input
                type="text" required autoFocus
                placeholder="e.g. Bluetooth Speaker, Passport"
                value={newPackingTitle}
                onChange={e => setNewPackingTitle(e.target.value)}
                className="w-full h-12 rounded-xl px-3 text-sm font-medium border outline-none"
                style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
              <div className="flex gap-2">
                {["Essentials", "Clothes", "Tech", "Documents"].map(c => (
                  <button
                    key={c} type="button" onClick={() => setNewPackingCategory(c)}
                    className="flex-1 py-1.5 text-xs font-bold rounded-lg border"
                    style={{
                      background: newPackingCategory === c ? AMBER : "transparent",
                      color: newPackingCategory === c ? "#1a1a1a" : "var(--muted-foreground)",
                      borderColor: newPackingCategory === c ? AMBER : "var(--border)",
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Brought by (optional member name)"
                value={assignedMemberName}
                onChange={e => setAssignedMemberName(e.target.value)}
                className="w-full h-11 rounded-xl px-3 text-sm font-medium border outline-none"
                style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
              <Button type="submit" className="w-full h-11 font-bold" style={{ background: AMBER, color: "#1a1a1a" }}>
                Add to List
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Plan */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl p-6 shadow-2xl relative" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base" style={{ color: "var(--foreground)" }}>Add to Itinerary</h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-gray-400"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreatePlan} className="space-y-3">
              <input
                type="text" required autoFocus
                placeholder="Plan title (e.g. Scuba diving, Dinner)"
                value={title} onChange={e => setTitle(e.target.value)}
                className="w-full h-12 rounded-xl px-3 text-sm font-medium border outline-none"
                style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date" required value={date} onChange={e => setDate(e.target.value)}
                  className="h-11 rounded-xl px-3 text-xs font-medium border outline-none"
                  style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
                <input
                  type="time" value={time} onChange={e => setTime(e.target.value)}
                  className="h-11 rounded-xl px-3 text-xs font-medium border outline-none"
                  style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <input
                type="text" placeholder="Location (optional)"
                value={location} onChange={e => setLocation(e.target.value)}
                className="w-full h-11 rounded-xl px-3 text-sm font-medium border outline-none"
                style={{ background: "var(--muted)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
              <Button type="submit" disabled={isSubmitting} className="w-full h-11 font-bold" style={{ background: AMBER, color: "#1a1a1a" }}>
                {isSubmitting ? "Saving..." : "Add Plan"}
              </Button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
