"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useTripPlans } from "@/hooks/useTripPlans";
import { useGroup } from "@/hooks/useGroup";
import { useTrips } from "@/hooks/useTrips";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, doc, deleteDoc, Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Calendar, Clock, Plus, X, CalendarDays, Navigation as NavIcon, Plane, Utensils, Bed, Ticket, Car, Coffee, Trash2, CheckCircle2 } from "lucide-react";

const AMBER = "#F9B912";

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
  const { appUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

      // reset & close
      setTitle("");
      setDate("");
      setTime("");
      setLocation("");
      setDescription("");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to create plan:", err);
      alert("Failed to create plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmtDate = (ts: Timestamp) => {
    if (!ts) return "";
    return ts.toDate().toLocaleDateString("en-US", { weekday: 'short', month: "short", day: "numeric" });
  };

  const formatTimeStr = (t: string) => {
    if (!t) return "";
    const [hours, minutes] = t.split(":");
    if (!hours || !minutes) return t;
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return `${hr}:${minutes} ${ampm}`;
  };

  const handleDeletePlan = async (planId: string) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;
    try {
      await deleteDoc(doc(db, "groups", groupId, "trips", tripId, "plans", planId));
    } catch (err) {
      console.error("Failed to delete plan:", err);
      alert("Failed to delete plan");
    }
  };

  // 1. Resolve author
  const getMember = (uid: string) => {
    return group?.members?.find(m => m.id === uid) || null;
  };

  // 2. Group plans by date
  const groupedPlans: Record<string, typeof plans> = {};
  plans.forEach(plan => {
    const dStr = fmtDate(plan.date);
    if (!groupedPlans[dStr]) groupedPlans[dStr] = [];
    groupedPlans[dStr].push(plan);
  });

  // 3. Smart Icon Resolver
  const getPlanIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("flight") || t.includes("airport") || t.includes("plane")) return <Plane className="h-5 w-5 text-white" />;
    if (t.includes("hotel") || t.includes("stay") || t.includes("check-in") || t.includes("check in") || t.includes("airbnb")) return <Bed className="h-5 w-5 text-white" />;
    if (t.includes("eat") || t.includes("dinner") || t.includes("lunch") || t.includes("breakfast") || t.includes("food") || t.includes("restaurant") || t.includes("cafe")) return <Utensils className="h-5 w-5 text-white" />;
    if (t.includes("coffee") || t.includes("tea")) return <Coffee className="h-5 w-5 text-white" />;
    if (t.includes("car") || t.includes("drive") || t.includes("rental") || t.includes("cab") || t.includes("taxi")) return <Car className="h-5 w-5 text-white" />;
    if (t.includes("ticket") || t.includes("movie") || t.includes("show") || t.includes("concert")) return <Ticket className="h-5 w-5 text-white" />;
    return <CheckCircle2 className="h-5 w-5 text-white" />; // Default fallback
  };

  return (
    <div className="space-y-6 pb-20 relative">
      
      {/* --- Back Button --- */}
      <button 
        onClick={() => router.back()}
        className="absolute top-4 left-4 z-30 h-10 w-10 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      {/* --- Hero Section --- */}
      <div className="h-64 sm:h-72 w-full relative overflow-hidden bg-gray-100 rounded-b-3xl sm:rounded-3xl shadow-sm -mx-4 px-4 sm:mx-0 sm:px-0 w-[calc(100%+2rem)] sm:w-full -mt-4 sm:mt-0">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 z-10" />
        {trip.coverImageUrl ? (
          <img 
            src={trip.coverImageUrl} 
            alt={trip.destination}
            className="w-full h-full object-cover"
          />
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

      {/* --- Plans Header --- */}
      <div className="flex items-center justify-between px-1 mt-8">
        <h2 className="text-xl font-bold tracking-tight text-gray-900">Itinerary & Plans</h2>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="rounded-full shadow-md font-bold transition-all hover:scale-105 active:scale-95"
          style={{ background: AMBER, color: "#1a1a1a" }}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Plan
        </Button>
      </div>

      {/* --- Plans Timeline --- */}
      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50/50 rounded-3xl border border-gray-100 mx-4 sm:mx-0">
          <div className="h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <CalendarDays className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="font-extrabold text-lg text-gray-800">No Plans Yet</h3>
          <p className="text-gray-500 text-sm mt-2 max-w-xs px-4">
            Start adding activities, flights, or reservations to build your route.
          </p>
        </div>
      ) : (
        <div className="space-y-8 px-2 sm:px-0 mt-4">
          {Object.entries(groupedPlans).map(([dateLabel, dayPlans], index) => (
            <div key={dateLabel} className="relative">
              {/* Day Header */}
              <div className="sticky top-0 z-10 py-2 bg-white/80 backdrop-blur-md mb-4 flex items-center">
                <div className="bg-gray-900 text-white font-bold text-sm px-4 py-1.5 rounded-full shadow-sm">
                  Day {index + 1} <span className="opacity-60 font-medium ml-1">· {dateLabel}</span>
                </div>
                <div className="h-px bg-gray-200 flex-1 ml-4" />
              </div>

              {/* Day Timeline */}
              <div className="relative border-l-2 border-dashed border-gray-300 ml-4 pl-6 space-y-6 pb-2">
                {dayPlans.map((plan, planIdx) => {
                  const author = getMember(plan.createdByUid);
                  const isLast = planIdx === dayPlans.length - 1 && index === Object.keys(groupedPlans).length - 1;
                  
                  return (
                    <div key={plan.id} className="relative group">
                      {/* Timeline Icon Node */}
                      <div 
                        className="absolute -left-[35px] top-1.5 h-8 w-8 rounded-full flex items-center justify-center shadow-md z-10 transition-transform group-hover:scale-110"
                        style={{ background: "linear-gradient(135deg, #F9B912 0%, #FF8F00 100%)" }}
                      >
                        {getPlanIcon(plan.title)}
                      </div>
                      
                      {/* Extend the dashed line to the bottom if it's the very last item */}
                      {isLast && (
                        <div className="absolute -left-[2px] top-10 bottom-0 w-0.5 bg-white z-0" />
                      )}

                      <Card className="border border-gray-100 shadow-sm shadow-gray-200/40 hover:shadow-lg transition-all overflow-hidden rounded-2xl bg-white group-hover:-translate-y-1 duration-300">
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                            <div>
                              <h3 className="font-extrabold text-lg text-gray-900 leading-tight">{plan.title}</h3>
                              {plan.time && (
                                <div className="flex items-center text-xs font-bold text-amber-700 mt-1.5">
                                  <Clock className="h-3.5 w-3.5 mr-1" />
                                  {formatTimeStr(plan.time)}
                                </div>
                              )}
                            </div>
                            
                            {/* Author Attribution */}
                            {author && (
                              <div className="flex items-center self-start bg-gray-50 pr-3 pl-1 py-1 rounded-full border border-gray-100">
                                {author.photoURL ? (
                                  <img src={author.photoURL} alt={author.name} className="h-6 w-6 rounded-full object-cover mr-2 shadow-sm" />
                                ) : (
                                  <div className="h-6 w-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] font-bold mr-2">
                                    {author.name?.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">
                                  by <span className="text-gray-900 font-bold">{author.name.split(' ')[0]}</span>
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2.5 text-sm text-gray-600 font-medium">
                            {plan.location && (
                              <div className="flex items-start bg-gray-50/50 p-2 rounded-lg text-gray-700">
                                <MapPin className="h-4 w-4 mr-2 mt-0.5 text-amber-500 shrink-0" />
                                <span className="leading-snug">{plan.location}</span>
                              </div>
                            )}
                            
                            {plan.description && (
                              <p className="pt-2 text-gray-500 leading-relaxed font-normal text-[15px]">
                                {plan.description}
                              </p>
                            )}
                          </div>
                          
                          {/* Delete Action (only if creator) */}
                          {appUser?.id === plan.createdByUid && (
                            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                              <button 
                                onClick={() => handleDeletePlan(plan.id)}
                                className="flex items-center text-[11px] font-bold text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remove Plan
                              </button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- Add Plan Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b shrink-0 bg-gray-50/50">
              <h2 className="text-xl font-extrabold text-gray-900">Add Itinerary Plan</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 bg-gray-200/60 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 overflow-y-auto">
              <form id="plan-form" onSubmit={handleCreatePlan} className="space-y-5">
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Plan / Activity Title</Label>
                  <Input 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="e.g. Flight to Goa, Check-in, Dinner" 
                    className="h-12 rounded-xl bg-gray-50 border-gray-200" 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</Label>
                    <Input 
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)} 
                      className="h-12 rounded-xl bg-gray-50 border-gray-200" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Time (Optional)</Label>
                    <Input 
                      type="time" 
                      value={time} 
                      onChange={e => setTime(e.target.value)} 
                      className="h-12 rounded-xl bg-gray-50 border-gray-200" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Location (Optional)</Label>
                  <Input 
                    value={location} 
                    onChange={e => setLocation(e.target.value)} 
                    placeholder="e.g. Airport, Hotel, Beach" 
                    className="h-12 rounded-xl bg-gray-50 border-gray-200" 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notes (Optional)</Label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Add details, booking references, or notes..." 
                    className="w-full min-h-[100px] p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-y"
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-5 border-t shrink-0">
              <Button 
                type="submit" 
                form="plan-form" 
                disabled={isSubmitting} 
                className="w-full h-12 rounded-xl font-bold text-base"
                style={{ background: AMBER, color: "#1a1a1a" }}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Adding...
                  </div>
                ) : (
                  "Add to Itinerary"
                )}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
