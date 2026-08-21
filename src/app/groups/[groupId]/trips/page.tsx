"use client";

import { use, useState, useRef } from "react";
import { useGroup } from "@/hooks/useGroup";
import { useTrips } from "@/hooks/useTrips";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Plus, X, ImageIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { storageService } from "@/services/storageService";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AMBER = "#F9B912";

export default function GroupTripsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.groupId;
  const { group, loading: groupLoading } = useGroup(groupId);
  const { trips, loading: tripsLoading } = useTrips(groupId);
  const { appUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loading = groupLoading || tripsLoading;

  if (loading) {
    return (
      <div className="space-y-4 mt-4">
        {[1, 2].map((i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl">
            <CardContent className="p-4 flex gap-4">
              <Skeleton className="h-24 w-24 rounded-2xl" />
              <div className="flex-1 space-y-2 py-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !destination || !startDate || !endDate || !appUser) return;
    
    setIsSubmitting(true);
    try {
      let coverImageUrl = "";
      if (imageFile) {
        coverImageUrl = await storageService.uploadFile(imageFile);
      }

      await addDoc(collection(db, "groups", groupId, "trips"), {
        title,
        destination,
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate)),
        coverImageUrl,
        createdByUid: appUser.id,
        updatedBy: appUser.id,
      });

      // reset & close
      setTitle("");
      setDestination("");
      setStartDate("");
      setEndDate("");
      setImageFile(null);
      setImagePreviewUrl(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to create trip:", err);
      alert("Failed to create trip");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmtDate = (ts: Timestamp) => {
    if (!ts) return "";
    return ts.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="space-y-6 mt-4 pb-10">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold tracking-tight">Upcoming Trips</h2>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="rounded-full shadow-md font-bold transition-all hover:scale-105 active:scale-95"
          style={{ background: AMBER, color: "#1a1a1a" }}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Plan Trip
        </Button>
      </div>

      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <MapPin className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="font-extrabold text-lg text-gray-700">No Trips Yet</h3>
          <p className="text-gray-500 text-sm mt-1 max-w-xs">
            Plan a weekend getaway or a long vacation and track expenses specifically for this trip.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-5">
          {trips.map((trip) => (
            <Card key={trip.id} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden group rounded-2xl">
              <div className="h-36 w-full relative overflow-hidden bg-gray-100">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10" />
                {trip.coverImageUrl ? (
                  <img 
                    src={trip.coverImageUrl} 
                    alt={trip.destination}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #F9B912 0%, #FFB300 50%, #FF8F00 100%)" }}>
                    <MapPin className="h-10 w-10 text-white/50" />
                  </div>
                )}
                <div className="absolute bottom-3 left-3 z-20">
                  <h3 className="font-extrabold text-xl text-white drop-shadow-sm">{trip.title}</h3>
                </div>
              </div>
              <CardContent className="p-4 bg-white">
                <div className="space-y-2.5">
                  <div className="flex items-center text-sm font-medium text-gray-600">
                    <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center mr-2.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-500" style={{ color: AMBER }} />
                    </div>
                    <span className="truncate">{trip.destination}</span>
                  </div>
                  <div className="flex items-center text-sm font-medium text-gray-600">
                    <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center mr-2.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-500" style={{ color: AMBER }} />
                    </div>
                    <span>{fmtDate(trip.startDate)} - {fmtDate(trip.endDate)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* --- Plan Trip Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b shrink-0">
              <h2 className="text-xl font-extrabold text-gray-900">Plan a Trip</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="h-8 w-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 overflow-y-auto">
              <form id="trip-form" onSubmit={handleCreateTrip} className="space-y-5">
                
                {/* Image Upload Area */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cover Image</Label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors relative overflow-hidden group"
                  >
                    {imagePreviewUrl ? (
                      <>
                        <img src={imagePreviewUrl} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white font-bold text-sm">Change Image</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center mb-2">
                          <ImageIcon className="h-5 w-5" style={{ color: AMBER }} />
                        </div>
                        <span className="text-sm font-bold text-gray-600">Tap to upload cover</span>
                        <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                      </>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImagePick} />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trip Name</Label>
                  <Input 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="e.g. Goa Weekend Getaway" 
                    className="h-12 rounded-xl bg-gray-50 border-gray-200" 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Destination</Label>
                  <Input 
                    value={destination} 
                    onChange={e => setDestination(e.target.value)} 
                    placeholder="e.g. North Goa, India" 
                    className="h-12 rounded-xl bg-gray-50 border-gray-200" 
                    required 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Start Date</Label>
                    <Input 
                      type="date" 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)} 
                      className="h-12 rounded-xl bg-gray-50 border-gray-200" 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">End Date</Label>
                    <Input 
                      type="date" 
                      value={endDate} 
                      onChange={e => setEndDate(e.target.value)} 
                      className="h-12 rounded-xl bg-gray-50 border-gray-200" 
                      required 
                      min={startDate}
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-5 border-t shrink-0">
              <Button 
                type="submit" 
                form="trip-form" 
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
                    Creating Trip...
                  </div>
                ) : (
                  "Create Trip"
                )}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
