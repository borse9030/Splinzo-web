"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useGroup } from "@/hooks/useGroup";
import { expenseService } from "@/services/expenseService";
import { storageService } from "@/services/storageService";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Receipt, Upload, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef } from "react";

export default function AddExpensePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { appUser } = useAuth();
  const { group, loading: groupLoading } = useGroup(resolvedParams.groupId);
  
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  
  // By default, the current user paid
  const [payerId, setPayerId] = useState<string>(appUser?.id || "");
  
  // By default, split equally among all members
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
  const [splitBetweenIds, setSplitBetweenIds] = useState<string[]>([]);
  const [customAmounts, setCustomAmounts] = useState<{ [key: string]: number }>({});
  
  const [billImage, setBillImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize splitBetweenIds when group loads
  if (group && splitBetweenIds.length === 0 && !groupLoading) {
    setSplitBetweenIds(group.members.map(m => m.id));
    if (!payerId) setPayerId(appUser?.id || group.members[0]?.id);
  }

  const handleNext = () => {
    if (step === 1) {
      if (!amount || parseFloat(amount) <= 0) {
        setError("Please enter a valid amount.");
        return;
      }
      if (!description.trim()) {
        setError("Please enter a description.");
        return;
      }
      setError("");
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleCustomAmountChange = (memberId: string, value: string) => {
    const num = parseFloat(value) || 0;
    setCustomAmounts(prev => ({
      ...prev,
      [memberId]: num
    }));
  };

  const handleSave = async () => {
    if (!group || !appUser) return;
    
    const numAmount = parseFloat(amount);
    
    // Validate custom split
    if (splitType === "custom") {
      const sum = Object.values(customAmounts).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - numAmount) > 0.01) {
        setError(`Custom amounts must equal ${group.currency}${numAmount}. Currently: ${sum}`);
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      let finalImageUrl = null;
      if (billImage) {
        finalImageUrl = await storageService.uploadFile(billImage);
      }

      await expenseService.addExpense(group.id, {
        description,
        amount: numAmount,
        payerId,
        currency: group.currency,
        createdBy: appUser.id,
        splitBetweenIds,
        customSplitAmounts: splitType === "custom" ? customAmounts : null,
        billImageUrl: finalImageUrl,
        category,
      });
      
      router.push(`/groups/${group.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to add expense");
      setLoading(false);
    }
  };

  if (groupLoading) {
    return <div className="p-4"><Skeleton className="h-[400px] w-full rounded-2xl" /></div>;
  }

  return (
    <div className="max-w-xl mx-auto pt-4 px-4 sm:px-0">
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="ghost" size="icon" className="rounded-full shrink-0">
          <Link href={`/groups/${resolvedParams.groupId}`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Add Expense</h1>
      </div>

      <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
        <div className="h-2 w-full bg-primary" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Step {step} of 3</CardTitle>
            <span className="text-sm font-medium text-gray-500">
              {step === 1 ? "Amount & Details" : step === 2 ? "Payer & Category" : "Split Details"}
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-2">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2 text-center">
                <Label className="text-gray-500">Amount</Label>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-4xl font-bold text-gray-400">{group?.currency === 'INR' ? '₹' : group?.currency}</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-5xl font-bold bg-transparent border-none outline-none w-48 text-center"
                    autoFocus
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">What was this for?</Label>
                <Input 
                  id="desc"
                  placeholder="e.g. Dinner at Goa" 
                  className="rounded-xl h-12 text-lg"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              
              <div 
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer relative overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="relative w-full flex flex-col items-center">
                    <img src={imagePreview} alt="Preview" className="h-32 object-contain rounded-lg mb-2" />
                    <span className="text-xs font-medium bg-white px-2 py-1 rounded shadow-sm border">Change Image</span>
                    <button 
                      className="absolute top-0 right-0 bg-red-100 text-red-600 rounded-full p-1 shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBillImage(null);
                        setImagePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 mb-2 text-gray-400" />
                    <span className="text-sm font-medium">Add Bill Image</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setBillImage(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <Label>Who paid?</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {group?.members.map(member => (
                    <div 
                      key={member.id}
                      onClick={() => setPayerId(member.id)}
                      className={`p-3 rounded-xl border cursor-pointer text-center transition-colors ${
                        payerId === member.id 
                          ? "border-primary bg-primary/5 ring-1 ring-primary" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-medium text-sm truncate">{member.name} {member.id === appUser?.id && "(You)"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${splitType === 'equal' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  onClick={() => setSplitType('equal')}
                >
                  Split Equally
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${splitType === 'custom' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                  onClick={() => setSplitType('custom')}
                >
                  Custom Amounts
                </button>
              </div>

              <div className="space-y-3 mt-4">
                {group?.members.map(member => {
                  const isIncluded = splitBetweenIds.includes(member.id);
                  const equalShare = parseFloat(amount) / splitBetweenIds.length;
                  
                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-xl">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          checked={isIncluded}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSplitBetweenIds(prev => [...prev, member.id]);
                            } else {
                              setSplitBetweenIds(prev => prev.filter(id => id !== member.id));
                            }
                          }}
                          className="h-5 w-5 rounded text-primary focus:ring-primary border-gray-300"
                        />
                        <span className="font-medium">{member.name}</span>
                      </div>
                      
                      {splitType === 'equal' ? (
                        <span className="font-bold text-gray-700">
                          {isIncluded ? `${group.currency}${equalShare.toFixed(2)}` : `${group.currency}0.00`}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">{group.currency}</span>
                          <Input 
                            type="number" 
                            className="w-24 h-8 text-right rounded-lg"
                            placeholder="0.00"
                            disabled={!isIncluded}
                            value={customAmounts[member.id] || ""}
                            onChange={(e) => handleCustomAmountChange(member.id, e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="bg-gray-50 p-6 flex justify-between rounded-b-2xl">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="rounded-xl">
              Back
            </Button>
          ) : <div></div>}
          
          {step < 3 ? (
            <Button onClick={handleNext} className="rounded-xl">
              Next
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={loading} className="rounded-xl px-8">
              {loading ? "Saving..." : "Save Expense"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
