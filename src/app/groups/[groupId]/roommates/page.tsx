"use client";

import { use, useEffect, useState, useMemo } from "react";
import { useGroup } from "@/hooks/useGroup";
import { useAuth } from "@/contexts/AuthContext";
import { flatmateService } from "@/services/flatmateService";
import {
  WaterDutySchedule,
  WaterCanLevel,
  FlatChore,
  DailyMealAttendance,
  MealChoice,
  SharedPantryItem,
  FixedBill,
  GuiltJarPenalty,
  FlatContact,
} from "@/types/flatmate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Droplets,
  Utensils,
  Trash2,
  Sparkles,
  Coffee,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShoppingCart,
  Calendar,
  IndianRupee,
  Phone,
  MessageCircle,
  Trophy,
  Plus,
  ArrowRightLeft,
  Coins,
  Share2,
  Home,
  Check,
  Zap,
  BookOpen,
  Settings,
  ShieldCheck,
  Bell,
} from "lucide-react";
import { format } from "date-fns";
import { FlatHqGuidebookModal } from "@/components/flat-hq/FlatHqGuidebookModal";

const AMBER = "#F9B912";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function FlatHQPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const resolvedParams = use(params);
  const groupId = resolvedParams.groupId;
  const { group, loading: groupLoading } = useGroup(groupId);
  const { appUser } = useAuth();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<
    "water_chores" | "meals" | "pantry" | "bills" | "guilt_jar" | "contacts"
  >("water_chores");

  // Data states
  const [loading, setLoading] = useState(true);
  const [waterDuty, setWaterDuty] = useState<WaterDutySchedule | null>(null);
  const [chores, setChores] = useState<FlatChore[]>([]);
  const [pantryItems, setPantryItems] = useState<SharedPantryItem[]>([]);
  const [fixedBills, setFixedBills] = useState<FixedBill[]>([]);
  const [penalties, setPenalties] = useState<GuiltJarPenalty[]>([]);
  const [contacts, setContacts] = useState<FlatContact[]>([]);

  // Meal states (Today)
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const [mealAttendance, setMealAttendance] = useState<DailyMealAttendance | null>(null);

  // Dialog states
  const [waterModalOpen, setWaterModalOpen] = useState(false);
  const [waterCost, setWaterCost] = useState<string>("40");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chore complete modal
  const [selectedChore, setSelectedChore] = useState<FlatChore | null>(null);
  const [choreCost, setChoreCost] = useState<string>("0");
  const [choreModalOpen, setChoreModalOpen] = useState(false);

  // Pantry restock modal
  const [selectedPantryItem, setSelectedPantryItem] = useState<SharedPantryItem | null>(null);
  const [pantryCost, setPantryCost] = useState<string>("");
  const [pantryModalOpen, setPantryModalOpen] = useState(false);

  // Fixed bill split modal
  const [selectedBill, setSelectedBill] = useState<FixedBill | null>(null);
  const [billAmount, setBillAmount] = useState<string>("");
  const [billModalOpen, setBillModalOpen] = useState(false);

  // Guilt jar penalty modal
  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false);
  const [culpritId, setCulpritId] = useState<string>("");
  const [penaltyReason, setPenaltyReason] = useState<string>("");
  const [penaltyAmount, setPenaltyAmount] = useState<string>("50");
  const [potType, setPotType] = useState<"chai" | "pizza" | "biryani" | "party">("pizza");

  // New Contact modal
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("Water Delivery");
  const [contactPhone, setContactPhone] = useState("");

  // Guidebook modal state
  const [guidebookOpen, setGuidebookOpen] = useState(false);

  // Timetable modal states (Admin)
  const [timetableModalOpen, setTimetableModalOpen] = useState(false);
  const [weeklyScheduleEdit, setWeeklyScheduleEdit] = useState<Record<string, string>>({});

  // Swap modal states (Roommate Anti-Cheat)
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapDay1, setSwapDay1] = useState<string>("0");
  const [swapDay2, setSwapDay2] = useState<string>("1");
  const [swapReason, setSwapReason] = useState<string>("");

  // Custom Chore modal state
  const [customChoreModalOpen, setCustomChoreModalOpen] = useState(false);
  const [newChoreTitle, setNewChoreTitle] = useState("");
  const [newChoreDesc, setNewChoreDesc] = useState("");
  const [newChoreFreq, setNewChoreFreq] = useState<"daily" | "alternate_days" | "weekly" | "as_needed">("daily");
  const [newChoreKarma, setNewChoreKarma] = useState("15");
  const [newChoreCost, setNewChoreCost] = useState("0");
  const [newChoreAssignee, setNewChoreAssignee] = useState("");

  // Custom Pantry modal state
  const [customPantryModalOpen, setCustomPantryModalOpen] = useState(false);
  const [newPantryName, setNewPantryName] = useState("");
  const [newPantryCategory, setNewPantryCategory] = useState("Cooking");
  const [newPantryCost, setNewPantryCost] = useState("200");
  const [newPantryBuyer, setNewPantryBuyer] = useState("");

  // Custom Bill modal state
  const [customBillModalOpen, setCustomBillModalOpen] = useState(false);
  const [newBillTitle, setNewBillTitle] = useState("");
  const [newBillAmount, setNewBillAmount] = useState("1000");
  const [newBillDueDay, setNewBillDueDay] = useState("5");
  const [newBillCategory, setNewBillCategory] = useState("Utilities");

  // Seeding state
  const [isSeeding, setIsSeeding] = useState(false);

  const memberIds = useMemo(() => group?.memberIds || [], [group?.memberIds]);
  const currencySymbol = (group?.currency || "INR") === "INR" ? "₹" : (group?.currency || "INR");

  const isAdmin = useMemo(() => {
    if (!appUser || !group) return false;
    if (group.createdBy === appUser.id) return true;
    const myMemberObj = group.members?.find((m: any) => m.id === appUser.id);
    return myMemberObj?.role === "admin";
  }, [group, appUser]);

  // Load all flatmate data
  useEffect(() => {
    if (!groupId || memberIds.length === 0) return;

    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [duty, loadedChores, loadedPantry, loadedBills, loadedPenalties, loadedContacts, meals] =
          await Promise.all([
            flatmateService.getWaterDuty(groupId, memberIds),
            flatmateService.getChores(groupId),
            flatmateService.getPantryItems(groupId),
            flatmateService.getFixedBills(groupId),
            flatmateService.getPenalties(groupId),
            flatmateService.getContacts(groupId),
            flatmateService.getMealAttendance(groupId, todayStr),
          ]);

        if (!isMounted) return;

        setWaterDuty(duty);

        // Auto-seed chores if empty
        if (loadedChores.length === 0) {
          const seeded = await flatmateService.seedDefaultChores(groupId, memberIds);
          setChores(seeded);
        } else {
          setChores(loadedChores);
        }

        // Auto-seed pantry if empty
        if (loadedPantry.length === 0) {
          const seededPantry = await flatmateService.seedDefaultPantry(groupId, memberIds);
          setPantryItems(seededPantry);
        } else {
          setPantryItems(loadedPantry);
        }

        // Auto-seed bills if empty
        if (loadedBills.length === 0) {
          const seededBills = await flatmateService.seedDefaultBills(groupId, memberIds);
          setFixedBills(seededBills);
        } else {
          setFixedBills(loadedBills);
        }

        setPenalties(loadedPenalties);
        setContacts(loadedContacts);
        setMealAttendance(meals);
      } catch (err) {
        console.error("Error loading Flat HQ data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [groupId, memberIds, todayStr]);

  // Helper to get member name
  const getMemberName = (uid: string) => {
    const m = group?.members?.find((mem) => mem.id === uid);
    return m?.displayName || m?.name || "Roommate";
  };

  // Water can completion
  const handleCompleteWaterDuty = async () => {
    if (!waterDuty || !appUser) return;
    setIsSubmitting(true);
    try {
      const cost = parseFloat(waterCost) || 0;
      await flatmateService.completeWaterCanDuty(
        groupId,
        waterDuty,
        cost,
        appUser.id,
        memberIds,
        group?.currency || "INR"
      );
      // Reload duty
      const updated = await flatmateService.getWaterDuty(groupId, memberIds);
      setWaterDuty(updated);
      setWaterModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reminder state
  const [reminderSent, setReminderSent] = useState(false);
  const [isReminding, setIsReminding] = useState(false);
  const [blinkitToast, setBlinkitToast] = useState<{ title: string; body: string } | null>(null);

  // Quick water can level update
  const handleCanLevelChange = async (level: WaterCanLevel) => {
    if (!waterDuty) return;
    try {
      await flatmateService.updateWaterCanLevel(
        groupId,
        level,
        memberIds,
        appUser?.displayName || appUser?.name || "Flatmate",
        currentAssigneeName
      );
      setWaterDuty({ ...waterDuty, canLevel: level });
      if (level === "empty") {
        setBlinkitToast({
          title: "🚨 EMERGENCY: Can Sukha Padh Gaya!",
          body: `Flat bana Sahara Desert! 0 drops left in 20L can. Refill alert dispatched to all flatmates!`,
        });
        setTimeout(() => setBlinkitToast(null), 5000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Send Water Duty Reminder
  const handleSendWaterReminder = async () => {
    if (!groupId || !waterDuty?.currentAssigneeId || !appUser || isReminding) return;
    setIsReminding(true);
    try {
      await flatmateService.sendWaterDutyReminder(
        groupId,
        waterDuty.currentAssigneeId,
        appUser.displayName || appUser.name || "Flatmate",
        currentAssigneeName
      );
      setReminderSent(true);
      setBlinkitToast({
        title: "⚡ Jal Devta Bulawa Dispatched!",
        body: `Blinkit-fast reminder sent to ${currentAssigneeName}: Paani khatam hone wala hai, jaldi lao! 🚰`,
      });
      setTimeout(() => setBlinkitToast(null), 4500);
      setTimeout(() => setReminderSent(false), 4000);
    } catch (err) {
      console.error("Failed to send water reminder:", err);
    } finally {
      setIsReminding(false);
    }
  };

  // Complete Chore & Split
  const handleCompleteChore = async () => {
    if (!selectedChore || !appUser) return;
    setIsSubmitting(true);
    try {
      const cost = parseFloat(choreCost) || 0;
      await flatmateService.completeChore(
        groupId,
        selectedChore,
        cost,
        appUser.id,
        memberIds,
        group?.currency || "INR"
      );
      const updated = await flatmateService.getChores(groupId);
      setChores(updated);
      setChoreModalOpen(false);
      setSelectedChore(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Meal Choice Toggle
  const handleMealChoice = async (type: "lunch" | "dinner", choice: MealChoice) => {
    if (!appUser) return;
    try {
      await flatmateService.setMealChoice(groupId, todayStr, appUser.id, type, choice);
      setMealAttendance((prev) => {
        if (!prev) {
          return {
            id: todayStr,
            groupId,
            date: todayStr,
            lunch: type === "lunch" ? { [appUser.id]: choice } : {},
            dinner: type === "dinner" ? { [appUser.id]: choice } : {},
          };
        }
        return {
          ...prev,
          [type]: {
            ...prev[type],
            [appUser.id]: choice,
          },
        };
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Pantry restock & split
  const handlePantryPurchased = async () => {
    if (!selectedPantryItem || !appUser) return;
    setIsSubmitting(true);
    try {
      const cost = parseFloat(pantryCost) || selectedPantryItem.estimatedCost;
      await flatmateService.markPantryPurchased(
        groupId,
        selectedPantryItem,
        cost,
        appUser.id,
        memberIds,
        group?.currency || "INR"
      );
      const updated = await flatmateService.getPantryItems(groupId);
      setPantryItems(updated);
      setPantryModalOpen(false);
      setSelectedPantryItem(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fixed Bill Split
  const handleSplitBill = async () => {
    if (!selectedBill || !appUser) return;
    setIsSubmitting(true);
    try {
      const currentMonth = format(new Date(), "yyyy-MM");
      const cost = parseFloat(billAmount) || selectedBill.amount;
      await flatmateService.splitFixedBill(
        groupId,
        selectedBill,
        cost,
        appUser.id,
        selectedBill.splitMemberIds || memberIds,
        currentMonth,
        group?.currency || "INR"
      );
      const updated = await flatmateService.getFixedBills(groupId);
      setFixedBills(updated);
      setBillModalOpen(false);
      setSelectedBill(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guilt Jar Penalty
  const handleAddPenalty = async () => {
    if (!culpritId || !penaltyReason || !appUser) return;
    setIsSubmitting(true);
    try {
      const culpritUser = group?.members?.find((m) => m.id === culpritId);
      const newPenalty = await flatmateService.addPenalty(groupId, {
        culpritId,
        culpritName: culpritUser?.displayName || culpritUser?.name || "Roommate",
        reason: penaltyReason,
        amount: parseFloat(penaltyAmount) || 50,
        createdBy: appUser.id,
        settled: false,
        potType,
      });
      setPenalties([newPenalty, ...penalties]);
      setPenaltyModalOpen(false);
      setPenaltyReason("");
      setCulpritId("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Flat Contact
  const handleAddContact = async () => {
    if (!contactName || !contactPhone) return;
    setIsSubmitting(true);
    try {
      const newContact = await flatmateService.addContact(groupId, {
        name: contactName,
        role: contactRole,
        phone: contactPhone,
      });
      setContacts([...contacts, newContact]);
      setContactModalOpen(false);
      setContactName("");
      setContactPhone("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Weekly Timetable (Admin)
  const handleSaveTimetable = async () => {
    if (!groupId) return;
    setIsSubmitting(true);
    try {
      await flatmateService.updateWaterTimetable(groupId, weeklyScheduleEdit);
      setWaterDuty((prev) => (prev ? { ...prev, weeklySchedule: weeklyScheduleEdit } : null));
      setTimetableModalOpen(false);
    } catch (e) {
      console.error("Error saving water timetable:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Symmetrical Duty Swap (Roommate Anti-Cheat)
  const handleSwapDuty = async () => {
    if (!groupId || !appUser || !waterDuty) return;
    setIsSubmitting(true);
    try {
      const schedule = waterDuty.weeklySchedule || {};
      const user1Id = schedule[swapDay1] || memberIds[Number(swapDay1) % (memberIds.length || 1)] || "";
      const user2Id = schedule[swapDay2] || memberIds[Number(swapDay2) % (memberIds.length || 1)] || "";

      // Anti-Cheat: Only Admin or the user assigned to swapDay1 can initiate the swap
      if (!isAdmin && user1Id !== appUser.id) {
        alert("Anti-Cheat Rule: You can only swap your own assigned day with a flatmate!");
        setIsSubmitting(false);
        return;
      }

      const user1Name = getMemberName(user1Id);
      const user2Name = getMemberName(user2Id);

      await flatmateService.swapWaterDuty(
        groupId,
        swapDay1,
        swapDay2,
        user1Id,
        user2Id,
        user1Name,
        user2Name,
        swapReason
      );

      const updatedSchedule = { ...schedule, [swapDay1]: user2Id, [swapDay2]: user1Id };
      const note = `${user1Name} swapped with ${user2Name}${swapReason ? ` (${swapReason})` : ""}`;
      setWaterDuty((prev) =>
        prev ? { ...prev, weeklySchedule: updatedSchedule, lastSwapNote: note } : null
      );
      setSwapModalOpen(false);
      setSwapReason("");
    } catch (e) {
      console.error("Error swapping water duty:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Seed Bachelor Essentials (Real Data)
  const handleSeedEssentials = async () => {
    if (!groupId || memberIds.length === 0) return;
    setIsSeeding(true);
    try {
      await flatmateService.seedBachelorEssentials(groupId, memberIds);
      const [c, p, b] = await Promise.all([
        flatmateService.getChores(groupId),
        flatmateService.getPantryItems(groupId),
        flatmateService.getFixedBills(groupId),
      ]);
      setChores(c);
      setPantryItems(p);
      setFixedBills(b);
    } catch (e) {
      console.error("Error seeding bachelor essentials:", e);
    } finally {
      setIsSeeding(false);
    }
  };

  // Add Custom Chore
  const handleAddCustomChore = async () => {
    if (!groupId || !newChoreTitle || !appUser) return;
    setIsSubmitting(true);
    try {
      const added = await flatmateService.addChore(groupId, {
        title: newChoreTitle,
        description: newChoreDesc,
        icon: "Sparkles",
        frequency: newChoreFreq,
        assignedTo: newChoreAssignee || memberIds[0] || appUser.id,
        rotationOrder: memberIds,
        status: "pending",
        defaultCost: parseFloat(newChoreCost) || 0,
        karmaPoints: parseInt(newChoreKarma) || 10,
        lastCompletedAt: null,
        lastCompletedBy: null,
      });
      setChores((prev) => [...prev, added]);
      setCustomChoreModalOpen(false);
      setNewChoreTitle("");
      setNewChoreDesc("");
    } catch (e) {
      console.error("Error adding chore:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Custom Pantry Item
  const handleAddCustomPantry = async () => {
    if (!groupId || !newPantryName || !appUser) return;
    setIsSubmitting(true);
    try {
      const added = await flatmateService.addPantryItem(groupId, {
        name: newPantryName,
        category: newPantryCategory,
        stockStatus: "in_stock",
        estimatedCost: parseFloat(newPantryCost) || 150,
        nextBuyerId: newPantryBuyer || memberIds[0] || appUser.id,
        rotationOrder: memberIds,
        lastPurchasedAt: null,
      });
      setPantryItems((prev) => [...prev, added]);
      setCustomPantryModalOpen(false);
      setNewPantryName("");
    } catch (e) {
      console.error("Error adding pantry item:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Custom Fixed Bill
  const handleAddCustomBill = async () => {
    if (!groupId || !newBillTitle || !appUser) return;
    setIsSubmitting(true);
    try {
      const added = await flatmateService.addFixedBill(groupId, {
        title: newBillTitle,
        amount: parseFloat(newBillAmount) || 500,
        dueDay: parseInt(newBillDueDay) || 1,
        category: newBillCategory,
        defaultPayerId: memberIds[0] || appUser.id,
        splitMemberIds: memberIds,
      });
      setFixedBills((prev) => [...prev, added]);
      setCustomBillModalOpen(false);
      setNewBillTitle("");
    } catch (e) {
      console.error("Error adding fixed bill:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Meal Summary calculations
  const lunchEating = useMemo(() => {
    if (!mealAttendance) return [];
    return Object.entries(mealAttendance.lunch || {})
      .filter(([_, choice]) => choice === "home")
      .map(([uid]) => getMemberName(uid));
  }, [mealAttendance, group]);

  const dinnerEating = useMemo(() => {
    if (!mealAttendance) return [];
    return Object.entries(mealAttendance.dinner || {})
      .filter(([_, choice]) => choice === "home")
      .map(([uid]) => getMemberName(uid));
  }, [mealAttendance, group]);

  // Cook WhatsApp message generator
  const getCookWhatsAppUrl = () => {
    const dateFormatted = format(new Date(), "dd MMM");
    const lunchText = lunchEating.length > 0 ? `${lunchEating.length} (${lunchEating.join(", ")})` : "Koi nahi";
    const dinnerText = dinnerEating.length > 0 ? `${dinnerEating.length} (${dinnerEating.join(", ")})` : "Koi nahi";
    const text = encodeURIComponent(
      `*Flat Food Count (${dateFormatted})* 🍽️\n• *Lunch:* ${lunchText}\n• *Dinner:* ${dinnerText}\n_Sent via Splinzo Flat HQ_`
    );
    return `https://wa.me/?text=${text}`;
  };

  // Guilt jar total pot
  const totalPot = useMemo(() => {
    return penalties.filter((p) => !p.settled).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [penalties]);

  const currentAssigneeName = waterDuty ? getMemberName(waterDuty.currentAssigneeId) : "Roommate";
  const isMyWaterTurn = waterDuty?.currentAssigneeId === appUser?.id;

  // Automated Desktop & In-App Notification if today is the user's turn
  useEffect(() => {
    if (!waterDuty || !appUser || !isMyWaterTurn) return;
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        const notifKey = `splinzo_water_turn_${todayStr}_${waterDuty.currentAssigneeId}`;
        if (!sessionStorage.getItem(notifKey)) {
          new Notification("🚰 Jal Devta Bulawa: AAPKA NUMBER HAI AAJ!", {
            body: `Bhaiya paani khatam mat hone dena! Today is your turn for 20L water can duty. Bring it & split with flatmates!`,
            icon: "/favicon.ico",
          });
          sessionStorage.setItem(notifKey, "true");
        }
      } else if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [waterDuty?.currentAssigneeId, isMyWaterTurn, appUser, todayStr]);

  if (groupLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
        <p className="text-sm text-gray-500 font-medium">Syncing Flat HQ & Roommate Schedule...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 relative">
      {/* ── BLINKIT-STYLE HIGH-CATCHY FLOATING NOTIFICATION ISLAND ── */}
      {blinkitToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-full animate-in fade-in slide-in-from-top-6 duration-300">
          <div className="p-4 rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-amber-400/60 shadow-[0_12px_40px_rgba(249,185,18,0.35)] text-white relative overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-xl shadow-lg shrink-0 animate-bounce">
                🚰
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    ⚡ Blinkit Speed Nudge
                  </span>
                  <button
                    onClick={() => setBlinkitToast(null)}
                    className="text-gray-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <h4 className="font-extrabold text-sm text-white mt-1">{blinkitToast.title}</h4>
                <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">{blinkitToast.body}</p>
              </div>
            </div>
            {/* Progress countdown strip */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400" />
          </div>
        </div>
      )}

      {/* ── INTERACTIVE BACHELOR HANDBOOK BANNER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 border border-amber-500/30 backdrop-blur shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-black text-xl shadow-md shrink-0">
            📖
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                Flat HQ Handbook & Rules
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-black">
                Interactive
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Interactive bachelor lifehacks & live feature demos: water duty, meal count, guilt jar, bills & more.
            </p>
          </div>
        </div>
        <Button
          onClick={() => setGuidebookOpen(true)}
          className="rounded-2xl font-bold text-xs gap-2 shrink-0 bg-amber-400 hover:bg-amber-500 text-black shadow-md transition-all hover:scale-105 cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          Open Notebook 📖
        </Button>
      </div>

      {/* ── TOP HERO BANNER: 20L WATER CAN DUTY MATRIX ── */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white p-6 shadow-md border border-gray-200 dark:border-gray-700">
        <div className="absolute -right-10 -bottom-10 opacity-5 dark:opacity-10 pointer-events-none">
          <Droplets className="w-64 h-64 text-cyan-500 dark:text-cyan-400" />
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
              <Droplets className="w-3.5 h-3.5" />
              20L Drinking Water Can Duty
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                Today: <span className="text-amber-500 dark:text-amber-400">{currentAssigneeName}&apos;s Turn</span> 🚰
              </h1>
              {!isMyWaterTurn && waterDuty?.currentAssigneeId && (
                <button
                  onClick={handleSendWaterReminder}
                  disabled={isReminding}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                    reminderSent
                      ? "bg-emerald-500 text-white"
                      : "bg-amber-400/20 hover:bg-amber-400/30 text-amber-800 dark:text-amber-300 border border-amber-400/50"
                  }`}
                  title="Send friendly push notification"
                >
                  <Bell className={`w-3.5 h-3.5 ${reminderSent ? "" : "animate-bounce text-amber-500"}`} />
                  {reminderSent ? "Sent! ✓" : isReminding ? "Sending..." : "Remind 🔔"}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-xl">
              Water shop is far away! Timetable auto-rotates every time someone brings the can. 1-tap split with all flatmates.
            </p>
            {isMyWaterTurn && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/10 border-2 border-amber-400 shadow-md text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black text-sm shrink-0 animate-pulse">
                    ⚡
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <span>AAPKA NUMBER HAI AAJ!</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-400 text-black text-[9px] font-black">YOUR DUTY</span>
                    </div>
                    <p className="text-xs text-gray-800 dark:text-gray-200 font-semibold mt-0.5">
                      Bhaiya paani khatam mat hone dena! Bring 20L can &amp; tap &ldquo;Got Water Can &amp; Split&rdquo;.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Can Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Water Can Level Indicator */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800/80 backdrop-blur rounded-2xl p-1.5 border border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500 dark:text-gray-400 px-2 font-medium">Can:</span>
              <button
                onClick={() => handleCanLevelChange("full")}
                className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  waterDuty?.canLevel === "full"
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Full 🟢
              </button>
              <button
                onClick={() => handleCanLevelChange("half")}
                className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  waterDuty?.canLevel === "half"
                    ? "bg-amber-400 text-black shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Half 🟡
              </button>
              <button
                onClick={() => handleCanLevelChange("empty")}
                className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                  waterDuty?.canLevel === "empty" || waterDuty?.canLevel === "low"
                    ? "bg-rose-500 text-white animate-pulse shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Empty 🚨
              </button>
            </div>

            {/* Got the Can & Split */}
            <Button
              onClick={() => {
                setWaterCost(waterDuty?.defaultCost ? String(waterDuty.defaultCost) : "40");
                setWaterModalOpen(true);
              }}
              className="rounded-2xl font-bold shadow-md gap-2 text-black transition-all hover:scale-105 cursor-pointer"
              style={{ background: AMBER }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Got Water Can & Split
            </Button>
          </div>
        </div>

        {/* Can Alert Banner if Empty */}
        {(waterDuty?.canLevel === "empty" || waterDuty?.canLevel === "low") && (
          <div className="mt-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-center justify-between gap-3 text-rose-200 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>
                <strong>Water Can is Empty!</strong> {currentAssigneeName} needs to bring the 20L can today.
              </span>
            </div>
            {isMyWaterTurn && (
              <span className="text-xs bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full">
                Your Duty
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── SUB-TAB NAVIGATION PILLS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab("water_chores")}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "water_chores"
              ? "bg-amber-400 text-black shadow-md scale-105"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
          }`}
        >
          <Droplets className="w-4 h-4" />
          Chores & Timetable
        </button>

        <button
          onClick={() => setActiveTab("meals")}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "meals"
              ? "bg-amber-400 text-black shadow-md scale-105"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
          }`}
        >
          <Utensils className="w-4 h-4" />
          Meal Tracker (Cook)
        </button>

        <button
          onClick={() => setActiveTab("pantry")}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "pantry"
              ? "bg-amber-400 text-black shadow-md scale-105"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Shared Pantry
        </button>

        <button
          onClick={() => setActiveTab("bills")}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "bills"
              ? "bg-amber-400 text-black shadow-md scale-105"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Monthly Bills
        </button>

        <button
          onClick={() => setActiveTab("guilt_jar")}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "guilt_jar"
              ? "bg-amber-400 text-black shadow-md scale-105"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
          }`}
        >
          <Coins className="w-4 h-4" />
          Guilt Jar ({currencySymbol}
          {totalPot})
        </button>

        <button
          onClick={() => setActiveTab("contacts")}
          className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === "contacts"
              ? "bg-amber-400 text-black shadow-md scale-105"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
          }`}
        >
          <Phone className="w-4 h-4" />
          Flat Contacts
        </button>
      </div>

      {/* ── TAB 1: WATER & CHORES MATRIX ── */}
      {activeTab === "water_chores" && (
        <div className="space-y-6">
          {/* Water Can 7-Day Timetable Grid */}
          {/* Water Can 7-Day Timetable Grid */}
          <Card className="rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-cyan-500" />
                    Weekly Water Can Duty Timetable
                  </h3>
                  <p className="text-xs text-gray-500">
                    Who brings the 20L can on which day of the week. Auto-rotates sequentially.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSwapDay1("0");
                      setSwapDay2("1");
                      setSwapModalOpen(true);
                    }}
                    className="rounded-xl text-xs font-bold gap-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    Swap Turn 🔄
                  </Button>
                  {isAdmin && (
                    <Button
                      size="sm"
                      onClick={() => {
                        const sched: Record<string, string> = {};
                        for (let i = 0; i < 7; i++) {
                          sched[i.toString()] =
                            waterDuty?.weeklySchedule?.[i.toString()] ||
                            waterDuty?.rotationOrder?.[i % (waterDuty.rotationOrder.length || 1)] ||
                            memberIds[i % memberIds.length] ||
                            "";
                        }
                        setWeeklyScheduleEdit(sched);
                        setTimetableModalOpen(true);
                      }}
                      className="rounded-xl text-xs font-bold gap-1.5 shadow-sm text-black"
                      style={{ background: AMBER }}
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Configure ⚙️
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2">
                {DAYS_OF_WEEK.map((dayName, idx) => {
                  const assignedUid =
                    waterDuty?.weeklySchedule?.[idx.toString()] ||
                    waterDuty?.rotationOrder?.[idx % (waterDuty.rotationOrder.length || 1)] ||
                    memberIds[idx % memberIds.length] ||
                    "";
                  const assignedName = getMemberName(assignedUid);
                  const isToday = new Date().getDay() === idx;

                  return (
                    <div
                      key={dayName}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        isToday
                          ? "bg-amber-500/10 border-amber-400/50 shadow-sm ring-1 ring-amber-400/30"
                          : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800"
                      }`}
                    >
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider block ${
                          isToday ? "text-amber-500" : "text-gray-400"
                        }`}
                      >
                        {dayName.slice(0, 3)} {isToday && "• Today"}
                      </span>
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate mt-1">
                        {assignedName}
                      </p>
                    </div>
                  );
                })}
              </div>

              {waterDuty?.lastSwapNote && (
                <div className="mt-3 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 shrink-0" />
                  <span><strong>Duty Swap Audit:</strong> {waterDuty.lastSwapNote}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bachelor Chores Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Flat Chores & Karma Roster
                </h3>
                <p className="text-xs text-gray-500">
                  Daily & weekly bachelor duties. Earn Karma points & split household costs directly.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setNewChoreAssignee(memberIds[0] || "");
                  setCustomChoreModalOpen(true);
                }}
                className="rounded-2xl font-bold gap-1 text-xs"
                style={{ background: AMBER, color: "#1a1a1a" }}
              >
                <Plus className="w-4 h-4" /> Add Chore
              </Button>
            </div>

            {chores.length === 0 ? (
              <Card className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center text-xl">
                  ✨
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-base">No Chores Listed Yet</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Setup bachelor essentials to get cleaning, trash, and milk duty rosters with real members, or add custom chores.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <Button
                    disabled={isSeeding}
                    onClick={handleSeedEssentials}
                    className="rounded-2xl text-xs font-bold gap-2 text-black shadow-md"
                    style={{ background: AMBER }}
                  >
                    <Zap className="w-4 h-4" />
                    {isSeeding ? "Setting up..." : "Setup Bachelor Essentials (1-Tap)"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNewChoreAssignee(memberIds[0] || "");
                      setCustomChoreModalOpen(true);
                    }}
                    className="rounded-2xl text-xs font-bold gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Add Custom Chore
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chores.map((chore) => {
                  const assigneeName = getMemberName(chore.assignedTo);
                  const isMine = chore.assignedTo === appUser?.id;

                  return (
                    <Card
                      key={chore.id}
                      className="rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all"
                    >
                      <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white">
                                {chore.title}
                              </h4>
                              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                                {chore.frequency.replace("_", " ")}
                              </span>
                            </div>
                            {chore.description && (
                              <p className="text-xs text-gray-500 line-clamp-2">{chore.description}</p>
                            )}
                          </div>

                          <span className="text-xs font-bold px-2 py-1 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                            <Trophy className="w-3 h-3" />+{chore.karmaPoints}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                              {assigneeName.charAt(0)}
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 block font-medium">Assigned to</span>
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                {assigneeName} {isMine && "(You)"}
                              </span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedChore(chore);
                              setChoreCost(chore.defaultCost ? String(chore.defaultCost) : "0");
                              setChoreModalOpen(true);
                            }}
                            className="rounded-xl text-xs font-bold gap-1.5 shadow-sm"
                            style={{ background: AMBER, color: "#1a1a1a" }}
                          >
                            <Check className="w-3.5 h-3.5" />
                            Done & Split
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: DAILY MEAL TRACKER (COOK) ── */}
      {activeTab === "meals" && (
        <div className="space-y-6">
          <Card className="rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-2">
                    <Utensils className="w-3.5 h-3.5" />
                    Aaj Khana Kaun Khayega?
                  </div>
                  <h3 className="text-xl font-extrabold">Today&apos;s Meal Headcount</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Tell the cook in advance so food is not wasted and grocery splits remain fair.
                  </p>
                </div>

                {/* WhatsApp Cook button */}
                <a
                  href={getCookWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  WhatsApp Count to Cook
                </a>
              </div>

              {/* Headcount Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      ☀️ Lunch Headcount
                    </span>
                    <span className="text-lg font-black text-amber-700 dark:text-amber-400">
                      {lunchEating.length} Eating
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                    {lunchEating.length > 0 ? lunchEating.join(", ") : "No one eating at home"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                      🌙 Dinner Headcount
                    </span>
                    <span className="text-lg font-black text-indigo-700 dark:text-indigo-400">
                      {dinnerEating.length} Eating
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                    {dinnerEating.length > 0 ? dinnerEating.join(", ") : "No one eating at home"}
                  </p>
                </div>
              </div>

              {/* Individual Roommate Attendance List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Roommate Attendance Toggles</h4>
                <div className="space-y-2">
                  {memberIds.map((uid) => {
                    const name = getMemberName(uid);
                    const isCurrentUser = uid === appUser?.id;
                    const lunchChoice = mealAttendance?.lunch?.[uid] || "home";
                    const dinnerChoice = mealAttendance?.dinner?.[uid] || "home";

                    return (
                      <div
                        key={uid}
                        className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-400 text-black font-extrabold flex items-center justify-center text-xs">
                            {name.charAt(0)}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                              {name} {isCurrentUser && "(You)"}
                            </span>
                          </div>
                        </div>

                        {/* Controls for current user or display */}
                        <div className="flex flex-wrap items-center gap-4">
                          {/* Lunch */}
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-gray-400 font-bold mr-1">Lunch:</span>
                            {(["home", "out", "skip"] as MealChoice[]).map((c) => (
                              <button
                                key={c}
                                disabled={!isCurrentUser}
                                onClick={() => handleMealChoice("lunch", c)}
                                className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all ${
                                  lunchChoice === c
                                    ? c === "home"
                                      ? "bg-emerald-500 text-white"
                                      : c === "out"
                                      ? "bg-blue-500 text-white"
                                      : "bg-gray-400 text-white"
                                    : "bg-gray-200 dark:bg-gray-800 text-gray-500 hover:text-gray-800"
                                } ${!isCurrentUser ? "opacity-90 cursor-default" : ""}`}
                              >
                                {c === "home" ? "Home 🍽️" : c === "out" ? "Out 🍕" : "Skip ❌"}
                              </button>
                            ))}
                          </div>

                          {/* Dinner */}
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-gray-400 font-bold mr-1">Dinner:</span>
                            {(["home", "out", "skip"] as MealChoice[]).map((c) => (
                              <button
                                key={c}
                                disabled={!isCurrentUser}
                                onClick={() => handleMealChoice("dinner", c)}
                                className={`text-xs px-2.5 py-1 rounded-xl font-bold transition-all ${
                                  dinnerChoice === c
                                    ? c === "home"
                                      ? "bg-emerald-500 text-white"
                                      : c === "out"
                                      ? "bg-blue-500 text-white"
                                      : "bg-gray-400 text-white"
                                    : "bg-gray-200 dark:bg-gray-800 text-gray-500 hover:text-gray-800"
                                } ${!isCurrentUser ? "opacity-90 cursor-default" : ""}`}
                              >
                                {c === "home" ? "Home 🍽️" : c === "out" ? "Out 🍕" : "Skip ❌"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── TAB 3: SHARED PANTRY & "WHO BUYS NEXT?" ── */}
      {activeTab === "pantry" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-500" />
                Shared Consumables & Who Buys Next
              </h3>
              <p className="text-xs text-gray-500">
                Oil, spices, dishwash gel, garbage bags. Automatic turns and 1-tap split.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setNewPantryBuyer(memberIds[0] || "");
                setCustomPantryModalOpen(true);
              }}
              className="rounded-2xl font-bold gap-1 text-xs"
              style={{ background: AMBER, color: "#1a1a1a" }}
            >
              <Plus className="w-4 h-4" /> Add Item
            </Button>
          </div>

          {pantryItems.length === 0 ? (
            <Card className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center text-xl">
                🛒
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base">No Pantry Items Tracked</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Seed common flat essentials like cooking oil, spices, and detergent, or add custom shared items.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Button
                  disabled={isSeeding}
                  onClick={handleSeedEssentials}
                  className="rounded-2xl text-xs font-bold gap-2 text-black shadow-md"
                  style={{ background: AMBER }}
                >
                  <Zap className="w-4 h-4" />
                  {isSeeding ? "Setting up..." : "Setup Bachelor Essentials (1-Tap)"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewPantryBuyer(memberIds[0] || "");
                    setCustomPantryModalOpen(true);
                  }}
                  className="rounded-2xl text-xs font-bold gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Custom Item
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {pantryItems.map((item) => {
                const buyerName = getMemberName(item.nextBuyerId);
                const isMyTurn = item.nextBuyerId === appUser?.id;

                return (
                  <Card
                    key={item.id}
                    className="rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all"
                  >
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">
                            {item.name}
                          </h4>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              item.stockStatus === "in_stock"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                : item.stockStatus === "running_low"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 animate-pulse"
                            }`}
                          >
                            {item.stockStatus === "in_stock"
                              ? "In Stock 🟢"
                              : item.stockStatus === "running_low"
                              ? "Low 🟡"
                              : "Finished 🔴"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Est: {currencySymbol}{item.estimatedCost}</span>
                          <span className="text-[11px] font-semibold text-gray-400">{item.category}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400 font-medium">Next Buyer:</span>
                          <span className="font-bold text-gray-900 dark:text-gray-100">
                            {buyerName} {isMyTurn && "(You)"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPantryItem(item);
                              setPantryCost(String(item.estimatedCost));
                              setPantryModalOpen(true);
                            }}
                            className="flex-1 rounded-xl text-xs font-bold shadow-sm"
                            style={{ background: AMBER, color: "#1a1a1a" }}
                          >
                            I Bought It! 🛍️
                          </Button>

                          <button
                            onClick={() =>
                              flatmateService.updatePantryStock(
                                groupId,
                                item.id,
                                item.stockStatus === "in_stock"
                                  ? "running_low"
                                  : item.stockStatus === "running_low"
                                  ? "out_of_stock"
                                  : "in_stock"
                              ).then(() => {
                                setPantryItems((prev) =>
                                  prev.map((p) =>
                                    p.id === item.id
                                      ? {
                                          ...p,
                                          stockStatus:
                                            p.stockStatus === "in_stock"
                                              ? "running_low"
                                              : p.stockStatus === "running_low"
                                              ? "out_of_stock"
                                              : "in_stock",
                                        }
                                      : p
                                  )
                                );
                              })
                            }
                            title="Cycle stock status"
                            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-500 text-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: MONTHLY FIXED BILLS ── */}
      {activeTab === "bills" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                Monthly Bachelor Bills Checklist
              </h3>
              <p className="text-xs text-gray-500">
                Rent, Wi-Fi, Electricity, Maid and Cook. 1-click split every month.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setCustomBillModalOpen(true);
              }}
              className="rounded-2xl font-bold gap-1 text-xs"
              style={{ background: AMBER, color: "#1a1a1a" }}
            >
              <Plus className="w-4 h-4" /> Add Bill
            </Button>
          </div>

          {fixedBills.length === 0 ? (
            <Card className="rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center text-xl">
                📅
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base">No Fixed Bills Added</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Keep track of rent, society maintenance, Wi-Fi, maid, and cook salaries each month.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Button
                  disabled={isSeeding}
                  onClick={handleSeedEssentials}
                  className="rounded-2xl text-xs font-bold gap-2 text-black shadow-md"
                  style={{ background: AMBER }}
                >
                  <Zap className="w-4 h-4" />
                  {isSeeding ? "Setting up..." : "Setup Bachelor Essentials (1-Tap)"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCustomBillModalOpen(true)}
                  className="rounded-2xl text-xs font-bold gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Add Custom Bill
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {fixedBills.map((bill) => {
                const currentMonth = format(new Date(), "yyyy-MM");
                const isPaidThisMonth = bill.lastPaidMonth === currentMonth;

                return (
                  <Card
                    key={bill.id}
                    className="rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm"
                  >
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-base text-gray-900 dark:text-white">
                            {bill.title}
                          </h4>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isPaidThisMonth
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                            }`}
                          >
                            {isPaidThisMonth ? "Paid This Month ✅" : `Due Day ${bill.dueDay} ⏳`}
                          </span>
                        </div>

                        <div className="text-2xl font-black text-gray-900 dark:text-white">
                          {currencySymbol}{bill.amount.toLocaleString()}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-medium">{bill.category}</span>
                        <Button
                          size="sm"
                          disabled={isPaidThisMonth}
                          onClick={() => {
                            setSelectedBill(bill);
                            setBillAmount(String(bill.amount));
                            setBillModalOpen(true);
                          }}
                          className="rounded-xl text-xs font-bold gap-1 shadow-sm"
                          style={{ background: isPaidThisMonth ? "#e5e7eb" : AMBER, color: "#1a1a1a" }}
                        >
                          {isPaidThisMonth ? "Split Done" : "Split with Flatmates 💸"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: GUILT JAR (PARTY POOL) ── */}
      {activeTab === "guilt_jar" && (
        <div className="space-y-6">
          {/* Pot Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white">
                <Coins className="w-3.5 h-3.5" />
                The Bachelor Guilt Jar
              </div>
              <h2 className="text-3xl sm:text-4xl font-black">
                {currencySymbol}{totalPot}
              </h2>
              <p className="text-xs sm:text-sm text-white/90 max-w-md">
                Fun micro-fines for leaving AC on, skipping chores, or messy sink. All fines pool into the Weekend Pizza & Biryani Party Fund! 🍕🍻
              </p>
            </div>

            <Button
              onClick={() => setPenaltyModalOpen(true)}
              className="rounded-2xl font-bold bg-white text-black hover:bg-gray-100 shadow-md gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Violation / Confess
            </Button>
          </div>

          {/* Penalties History List */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Violation Ledger</h3>
            <div className="space-y-2">
              {penalties.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No violations logged yet! Everyone is on their best behavior 😇
                </div>
              ) : (
                penalties.map((penalty) => (
                  <div
                    key={penalty.id}
                    className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                          {penalty.culpritName}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                          {penalty.potType.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{penalty.reason}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-rose-500 block">
                        +{currencySymbol}{penalty.amount}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {penalty.settled ? "Settled" : "In Pot"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: FLAT CONTACTS DIRECTORY ── */}
      {activeTab === "contacts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Phone className="w-5 h-5 text-amber-500" />
                Shared Flat Directory
              </h3>
              <p className="text-xs text-gray-500">
                Landlord, water can guy, cook, maid, plumber and Wi-Fi operator contacts.
              </p>
            </div>
            <Button
              onClick={() => setContactModalOpen(true)}
              size="sm"
              className="rounded-2xl font-bold gap-1"
              style={{ background: AMBER, color: "#1a1a1a" }}
            >
              <Plus className="w-4 h-4" /> Add Contact
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {contacts.length === 0 ? (
              <div className="col-span-full text-center py-10 text-gray-400 text-xs">
                No flat contacts added yet. Add water delivery guy, cook, or landlord phone number!
              </div>
            ) : (
              contacts.map((contact) => (
                <Card
                  key={contact.id}
                  className="rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm"
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
                        {contact.role}
                      </span>
                      <h4 className="font-bold text-base text-gray-900 dark:text-white">
                        {contact.name}
                      </h4>
                      <p className="text-xs text-gray-500 font-mono">{contact.phone}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                      <a
                        href={`tel:${contact.phone}`}
                        className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-bold flex items-center justify-center gap-1.5 text-gray-800 dark:text-gray-200 transition-all"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                      <a
                        href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-bold flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 transition-all"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── DIALOG 1: WATER CAN COMPLETION & SPLIT ── */}
      <Dialog open={waterModalOpen} onOpenChange={setWaterModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Droplets className="w-5 h-5 text-cyan-500" />
              Got the 20L Water Can!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-gray-500">
              This will mark the water can as <strong>Full</strong>, rotate today&apos;s turn to the next roommate, and optionally split the cost equally.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Amount Paid ({currencySymbol})</Label>
              <Input
                type="number"
                value={waterCost}
                onChange={(e) => setWaterCost(e.target.value)}
                placeholder="40"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setWaterModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={handleCompleteWaterDuty}
              className="rounded-xl text-xs font-bold"
              style={{ background: AMBER, color: "#1a1a1a" }}
            >
              {isSubmitting ? "Saving..." : "Confirm & Split"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 2: CHORE COMPLETION & SPLIT ── */}
      <Dialog open={choreModalOpen} onOpenChange={setChoreModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Complete & Split Chore</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-gray-500">
              Completing <strong>{selectedChore?.title}</strong> will award you{" "}
              <strong>+{selectedChore?.karmaPoints} Karma Points</strong> and advance the turn to the next roommate.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Did you spend any money? (0 if free)</Label>
              <Input
                type="number"
                value={choreCost}
                onChange={(e) => setChoreCost(e.target.value)}
                placeholder="0"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setChoreModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={handleCompleteChore}
              className="rounded-xl text-xs font-bold"
              style={{ background: AMBER, color: "#1a1a1a" }}
            >
              {isSubmitting ? "Completing..." : "Complete & Split"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 3: PANTRY RESTOCK & SPLIT ── */}
      <Dialog open={pantryModalOpen} onOpenChange={setPantryModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Restock Pantry Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-gray-500">
              Purchased <strong>{selectedPantryItem?.name}</strong>? Mark it in stock and split the bill with everyone.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Amount Paid ({currencySymbol})</Label>
              <Input
                type="number"
                value={pantryCost}
                onChange={(e) => setPantryCost(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setPantryModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={handlePantryPurchased}
              className="rounded-xl text-xs font-bold"
              style={{ background: AMBER, color: "#1a1a1a" }}
            >
              {isSubmitting ? "Saving..." : "Mark Bought & Split"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 4: FIXED BILL SPLIT ── */}
      <Dialog open={billModalOpen} onOpenChange={setBillModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Split Monthly Bill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-gray-500">
              Split <strong>{selectedBill?.title}</strong> equally among flatmates for{" "}
              {format(new Date(), "MMMM yyyy")}.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Total Bill Amount ({currencySymbol})</Label>
              <Input
                type="number"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setBillModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={handleSplitBill}
              className="rounded-xl text-xs font-bold"
              style={{ background: AMBER, color: "#1a1a1a" }}
            >
              {isSubmitting ? "Splitting..." : "Split Expense Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 5: GUILT JAR VIOLATION ── */}
      <Dialog open={penaltyModalOpen} onOpenChange={setPenaltyModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              Add Kaamchor Violation 🏺
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Who is the culprit?</Label>
              <select
                value={culpritId}
                onChange={(e) => setCulpritId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-transparent"
              >
                <option value="">Select Roommate</option>
                {memberIds.map((uid) => (
                  <option key={uid} value={uid}>
                    {getMemberName(uid)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Reason for Fine</Label>
              <Input
                type="text"
                placeholder="e.g. Left AC on with door open, dirty dishes"
                value={penaltyReason}
                onChange={(e) => setPenaltyReason(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Fine Amount ({currencySymbol})</Label>
                <Input
                  type="number"
                  value={penaltyAmount}
                  onChange={(e) => setPenaltyAmount(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Pool Target</Label>
                <select
                  value={potType}
                  onChange={(e) => setPotType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-transparent"
                >
                  <option value="pizza">Pizza 🍕</option>
                  <option value="biryani">Biryani 🍗</option>
                  <option value="chai">Chai & Samosa ☕</option>
                  <option value="party">Party 🍻</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setPenaltyModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting || !culpritId || !penaltyReason}
              onClick={handleAddPenalty}
              className="rounded-xl text-xs font-bold"
              style={{ background: AMBER, color: "#1a1a1a" }}
            >
              {isSubmitting ? "Adding..." : "Charge Fine"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 6: ADD CONTACT ── */}
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add Flat Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Contact Name</Label>
              <Input
                placeholder="e.g. Ramesh Kaka"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role</Label>
              <select
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-transparent"
              >
                <option value="Water Delivery">Water Delivery Guy 🚰</option>
                <option value="Cook">Cook / Dabba 👨‍🍳</option>
                <option value="Maid">Maid / Housekeeping 🧹</option>
                <option value="Landlord">Flat Owner / Broker 🏠</option>
                <option value="Plumber">Plumber 🔧</option>
                <option value="Electrician">Electrician ⚡</option>
                <option value="Wi-Fi">Wi-Fi Provider 📶</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone Number</Label>
              <Input
                placeholder="+91 9876543210"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setContactModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting || !contactName || !contactPhone}
              onClick={handleAddContact}
              className="rounded-xl text-xs font-bold"
              style={{ background: AMBER, color: "#1a1a1a" }}
            >
              {isSubmitting ? "Saving..." : "Save Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 7: FLAT HQ GUIDEBOOK & HANDBOOK ── */}
      <FlatHqGuidebookModal open={guidebookOpen} onClose={() => setGuidebookOpen(false)} />

      {/* ── DIALOG 8: CONFIGURE WATER TIMETABLE (ADMIN) ── */}
      <Dialog open={timetableModalOpen} onOpenChange={setTimetableModalOpen}>
        <DialogContent className="rounded-3xl max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-500" />
              Configure Weekly Water Schedule ⚙️
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                <strong>Admin Master Schedule:</strong> Assign duty days across your flatmates. All assignments update in real-time.
              </span>
            </div>

            <div className="space-y-3">
              {DAYS_OF_WEEK.map((dayName, idx) => {
                const dayKey = idx.toString();
                const currentAssigned = weeklyScheduleEdit[dayKey] || "";

                return (
                  <div
                    key={dayName}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                  >
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 w-24 shrink-0">
                      {dayName}
                    </span>
                    <select
                      value={currentAssigned}
                      onChange={(e) =>
                        setWeeklyScheduleEdit({ ...weeklyScheduleEdit, [dayKey]: e.target.value })
                      }
                      className="w-full p-2 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-transparent font-medium"
                    >
                      <option value="">Select Roommate</option>
                      {memberIds.map((uid) => (
                        <option key={uid} value={uid}>
                          {getMemberName(uid)}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setTimetableModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={handleSaveTimetable}
              className="rounded-xl text-xs font-bold"
              style={{ background: AMBER, color: "#1a1a1a" }}
            >
              {isSubmitting ? "Saving..." : "Save Timetable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 9: SYMMETRICAL DUTY SWAP (ROOMMATE ANTI-CHEAT) ── */}
      <Dialog open={swapModalOpen} onOpenChange={setSwapModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-cyan-500" />
              Swap Water Can Duty 🔄
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 dark:text-cyan-400 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                <strong>Anti-Cheat Active:</strong> Swaps are 100% symmetrical. You trade your duty day with another roommate so nobody can dump their chore unfairly!
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Day You Give Up (Your Turn)</Label>
              <select
                value={swapDay1}
                onChange={(e) => setSwapDay1(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-transparent"
              >
                {DAYS_OF_WEEK.map((d, i) => {
                  const uid =
                    waterDuty?.weeklySchedule?.[i.toString()] ||
                    waterDuty?.rotationOrder?.[i % (waterDuty.rotationOrder.length || 1)] ||
                    "";
                  return (
                    <option key={i} value={i.toString()}>
                      {d} ({getMemberName(uid)})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Day You Take in Return</Label>
              <select
                value={swapDay2}
                onChange={(e) => setSwapDay2(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-transparent"
              >
                {DAYS_OF_WEEK.map((d, i) => {
                  const uid =
                    waterDuty?.weeklySchedule?.[i.toString()] ||
                    waterDuty?.rotationOrder?.[i % (waterDuty.rotationOrder.length || 1)] ||
                    "";
                  return (
                    <option key={i} value={i.toString()}>
                      {d} ({getMemberName(uid)})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Reason for Swap (Optional)</Label>
              <Input
                placeholder="e.g. Traveling this Friday, exam tomorrow"
                value={swapReason}
                onChange={(e) => setSwapReason(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSwapModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting || swapDay1 === swapDay2}
              onClick={handleSwapDuty}
              className="rounded-xl text-xs font-bold"
              style={{ background: AMBER, color: "#1a1a1a" }}
            >
              {isSubmitting ? "Swapping..." : "Confirm Symmetrical Swap"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 10: CUSTOM CHORE MODAL ── */}
      <Dialog open={customChoreModalOpen} onOpenChange={setCustomChoreModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Add Custom Flat Chore
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Chore Title</Label>
              <Input
                placeholder="e.g. Balcony plants watering 🌿"
                value={newChoreTitle}
                onChange={(e) => setNewChoreTitle(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description (Optional)</Label>
              <Input
                placeholder="e.g. Water all pots in balcony and clear dried leaves"
                value={newChoreDesc}
                onChange={(e) => setNewChoreDesc(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Frequency</Label>
                <select
                  value={newChoreFreq}
                  onChange={(e) => setNewChoreFreq(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="alternate_days">Alternate Days</option>
                  <option value="weekly">Weekly</option>
                  <option value="as_needed">As Needed</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Karma Points</Label>
                <Input
                  type="number"
                  value={newChoreKarma}
                  onChange={(e) => setNewChoreKarma(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Assign First Turn To</Label>
              <select
                value={newChoreAssignee}
                onChange={(e) => setNewChoreAssignee(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-transparent"
              >
                {memberIds.map((uid) => (
                  <option key={uid} value={uid}>
                    {getMemberName(uid)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCustomChoreModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting || !newChoreTitle}
              onClick={handleAddCustomChore}
              className="rounded-xl text-xs font-bold"
              style={{ background: AMBER, color: "#1a1a1a" }}
            >
              {isSubmitting ? "Adding..." : "Add Chore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 11: CUSTOM PANTRY MODAL ── */}
      <Dialog open={customPantryModalOpen} onOpenChange={setCustomPantryModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-500" />
              Add Custom Pantry Item
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Item Name</Label>
              <Input
                placeholder="e.g. Maggi Family Pack (12x) 🍜"
                value={newPantryName}
                onChange={(e) => setNewPantryName(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Category</Label>
                <select
                  value={newPantryCategory}
                  onChange={(e) => setNewPantryCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-transparent"
                >
                  <option value="Cooking">Cooking 🍳</option>
                  <option value="Cleaning">Cleaning 🧼</option>
                  <option value="Toiletries">Toiletries 🧻</option>
                  <option value="Snacks">Snacks 🍪</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Estimated Cost ({currencySymbol})</Label>
                <Input
                  type="number"
                  value={newPantryCost}
                  onChange={(e) => setNewPantryCost(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Next Buyer</Label>
              <select
                value={newPantryBuyer}
                onChange={(e) => setNewPantryBuyer(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-transparent"
              >
                {memberIds.map((uid) => (
                  <option key={uid} value={uid}>
                    {getMemberName(uid)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCustomPantryModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting || !newPantryName}
              onClick={handleAddCustomPantry}
              className="rounded-xl text-xs font-bold"
              style={{ background: AMBER, color: "#1a1a1a" }}
            >
              {isSubmitting ? "Adding..." : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 12: CUSTOM FIXED BILL MODAL ── */}
      <Dialog open={customBillModalOpen} onOpenChange={setCustomBillModalOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Add Monthly Fixed Bill
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Bill Name</Label>
              <Input
                placeholder="e.g. Water Purifier RO AMC 💧"
                value={newBillTitle}
                onChange={(e) => setNewBillTitle(e.target.value)}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Amount ({currencySymbol})</Label>
                <Input
                  type="number"
                  value={newBillAmount}
                  onChange={(e) => setNewBillAmount(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Due Day (1 - 31)</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={newBillDueDay}
                  onChange={(e) => setNewBillDueDay(e.target.value)}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <select
                value={newBillCategory}
                onChange={(e) => setNewBillCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-xs bg-transparent"
              >
                <option value="Rent">Rent 🏠</option>
                <option value="Utilities">Utilities ⚡</option>
                <option value="Maintenance">Society Maintenance 🏢</option>
                <option value="Services">Maid / Cook 🧹</option>
                <option value="Other">Other 📝</option>
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCustomBillModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting || !newBillTitle}
              onClick={handleAddCustomBill}
              className="rounded-xl text-xs font-bold"
              style={{ background: AMBER, color: "#1a1a1a" }}
            >
              {isSubmitting ? "Adding..." : "Add Bill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
