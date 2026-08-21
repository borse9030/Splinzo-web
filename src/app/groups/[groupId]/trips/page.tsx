"use client";

import { use } from "react";
import { useGroup } from "@/hooks/useGroup";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Map, MapPin, Calendar, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function GroupTripsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const resolvedParams = use(params);
  const { group, loading } = useGroup(resolvedParams.groupId);

  if (loading) {
    return (
      <div className="space-y-4 mt-4">
        {[1, 2].map((i) => (
          <Card key={i} className="border-none shadow-sm">
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

  // Mock Trips Data
  const mockTrips = [
    {
      id: "trip1",
      title: "Weekend Getaway",
      destination: "Goa, India",
      dateRange: "Oct 12 - Oct 15",
      imageUrl: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=400&auto=format&fit=crop"
    }
  ];

  return (
    <div className="space-y-6 mt-4 pb-10">
      
      <div className="flex flex-col items-center justify-center p-6 text-center bg-blue-50/50 rounded-2xl border-dashed border-2 border-blue-100 mb-2">
        <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
          <Map className="h-6 w-6 text-blue-500" />
        </div>
        <h3 className="text-sm font-bold text-blue-900">Trips Module (Preview)</h3>
        <p className="text-xs text-blue-700/80 max-w-sm mt-1">
          Trips allow you to sub-categorize expenses for specific events within a group. Schema sync pending.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Upcoming Trips</h2>
        <Button variant="outline" size="sm" className="rounded-xl">
          <Plus className="h-4 w-4 mr-2" />
          Plan Trip
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {mockTrips.map((trip) => (
          <Card key={trip.id} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden group">
            <div className="h-32 w-full relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10" />
              <img 
                src={trip.imageUrl} 
                alt={trip.destination}
                className="w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg mb-2">{trip.title}</h3>
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-2 shrink-0" />
                  <span className="truncate">{trip.destination}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2 shrink-0" />
                  <span>{trip.dateRange}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Add New Trip Card */}
        <Card className="border-dashed shadow-none bg-transparent hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-center min-h-[220px]">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="font-bold text-gray-700">Add a Trip</h3>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
