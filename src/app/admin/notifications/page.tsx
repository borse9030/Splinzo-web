"use client";

import { useState, useEffect, useRef } from "react";
import { collection, query, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { getCurrentStaffSession } from "@/lib/adminAuth";
import { DeviceSimulator } from "@/components/admin/DeviceSimulator";
import { storageService } from "@/services/storageService";
import {
  Send,
  Sparkles,
  Users,
  Smartphone,
  Radio,
  Layers,
  Link2,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  History,
  RefreshCw,
  Search,
  Zap,
  Droplets,
  Coins,
  PartyPopper,
  Info,
  Copy,
  AlertCircle,
  ShieldCheck,
  UploadCloud,
  Trash2,
  Loader2,
} from "lucide-react";

interface UserOption {
  id: string;
  name?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  fcmToken?: string;
  fcmTokens?: string[];
  fcmPlatform?: string;
  hasDeviceToken?: boolean;
}

interface GroupOption {
  id: string;
  name: string;
  memberIds?: string[];
  members?: any[];
}

interface CampaignRecord {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  targetType: string;
  targetCount: number;
  successCount: number;
  failureCount: number;
  openedCount?: number;
  bannerStyle: string;
  actionType: string;
  sentBy?: { name?: string };
  createdAt?: string;
}

const TEMPLATES = [
  {
    name: "⚡ Weekend Split Alert",
    title: "⚡ Pending Weekend Balances",
    body: "Hey flatmate! Don't let last weekend's trip balance roll over into next week. Settle up in 1 click!",
    bannerStyle: "blinkit" as const,
    actionType: "home" as const,
  },
  {
    name: "🍕 Friday Dinner Flat Duty",
    title: "🍕 Friday Night Flat Feast!",
    body: "Who is on cooking or grocery duty today? Check the flat chore schedule before ordering out!",
    bannerStyle: "blinkit" as const,
    actionType: "home" as const,
  },
  {
    name: "💧 Jal Devta Duty Ping",
    title: "💧 Water Motor & Tank Alert",
    body: "Water supply is active! Assigned flatmate please turn on the pump and check the overhead tank.",
    bannerStyle: "water_duty" as const,
    actionType: "home" as const,
  },
  {
    name: "🍯 Guilt Jar Chalan Alert",
    title: "🍯 Guilt Jar Chalan Incoming!",
    body: "Dish left in the sink or lights left on? Settle your ₹50 guilt fine before the weekly tally!",
    bannerStyle: "guilt_jar" as const,
    actionType: "guilt_jar" as const,
  },
  {
    name: "🎉 Big App Update 2.0",
    title: "🎉 New Superpowers Unlocked!",
    body: "Update Splinzo now to experience our brand new audio-calls, AI receipt scanner, and faster settlements!",
    bannerStyle: "celebration" as const,
    actionType: "url" as const,
  },
];

export default function PushStudioPage() {
  // Notification form state
  const [title, setTitle] = useState("⚡ Splinzo Flash Alert");
  const [body, setBody] = useState("Your flatmates just updated shared expenses. Tap to view the breakdown!");
  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [targetType, setTargetType] = useState<"all" | "users" | "group" | "test">("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [testFcmToken, setTestFcmToken] = useState("");
  const [actionType, setActionType] = useState<"home" | "group" | "expense" | "guilt_jar" | "url">("home");
  const [externalUrl, setExternalUrl] = useState("");
  const [actionGroupId, setActionGroupId] = useState("");
  const [actionExpenseId, setActionExpenseId] = useState("");
  const [bannerStyle, setBannerStyle] = useState<"blinkit" | "water_duty" | "guilt_jar" | "celebration" | "standard">("blinkit");

  // Auxiliary data
  const [usersList, setUsersList] = useState<UserOption[]>([]);
  const [groupsList, setGroupsList] = useState<GroupOption[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingData, setLoadingData] = useState(false);

  // Send state
  const [isSending, setIsSending] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);
  const [serverStatus, setServerStatus] = useState<{
    isConfigured?: boolean;
    hasEnvVar?: boolean;
    projectId?: string;
    clientEmail?: string;
  } | null>(null);
  const [alertModal, setAlertModal] = useState<{
    title: string;
    message: string;
    type: "error" | "warning" | "success";
    showGuide?: boolean;
  } | null>(null);

  // History state
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch users, groups, and past campaigns
  useEffect(() => {
    async function loadData() {
      setLoadingData(true);
      try {
        // Load users
        const uSnap = await getDocs(query(collection(db, "users"), limit(100)));
        const users: UserOption[] = [];
        uSnap.forEach((d) => {
          const data = d.data();
          const hasDeviceToken = Boolean(
            (data.fcmToken && typeof data.fcmToken === "string" && data.fcmToken.trim().length > 10) ||
            (Array.isArray(data.fcmTokens) && data.fcmTokens.some((t: any) => typeof t === "string" && t.trim().length > 10))
          );
          const resolvedToken = data.fcmToken || (Array.isArray(data.fcmTokens) ? data.fcmTokens[0] : "");
          users.push({
            id: d.id,
            name: data.displayName || data.name || "Anonymous User",
            email: data.email || "",
            phone: data.phone || data.phoneNumber || "",
            fcmToken: resolvedToken || "",
            fcmTokens: Array.isArray(data.fcmTokens) ? data.fcmTokens : [],
            fcmPlatform: data.fcmPlatform || (hasDeviceToken ? "app" : "web"),
            hasDeviceToken,
          });
        });
        setUsersList(users);

        // Load groups
        const gSnap = await getDocs(query(collection(db, "groups"), limit(50)));
        const groups: GroupOption[] = [];
        gSnap.forEach((d) => {
          const data = d.data();
          groups.push({
            id: d.id,
            name: data.name || "Unnamed Group",
            memberIds: data.memberIds || [],
            members: data.members || [],
          });
        });
        setGroupsList(groups);
      } catch (err) {
        console.error("Failed to load users or groups:", err);
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
    loadHistory();
    checkServerStatus();
  }, []);

  async function checkServerStatus() {
    try {
      const res = await fetch("/api/admin/notifications/status");
      if (res.ok) {
        const json = await res.json();
        setServerStatus(json);
      }
    } catch (_) {}
  }

  async function loadHistory() {
    setLoadingHistory(true);
    checkServerStatus();
    try {
      const res = await fetch("/api/admin/notifications/history");
      const json = await res.json();
      if (json.campaigns) {
        setCampaigns(json.campaigns);
      }
    } catch (err) {
      console.error("Failed to fetch campaigns history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.name.match(/\.(heic|heif|jpg|jpeg|png|webp|gif)$/i)) {
      setUploadError("Please select a valid image file (PNG, JPG, WEBP, HEIC).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError("Image is too large. Please select an image under 15MB.");
      return;
    }

    setIsUploadingImage(true);
    setUploadError(null);

    try {
      const publicUrl = await storageService.uploadFile(file);
      setImageUrl(publicUrl);
    } catch (err: any) {
      console.error("Banner upload error:", err);
      setUploadError(err.message || "Failed to upload image to Cloudflare storage.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleApplyTemplate = (tmpl: (typeof TEMPLATES)[0]) => {
    setTitle(tmpl.title);
    setBody(tmpl.body);
    setBannerStyle(tmpl.bannerStyle);
    setActionType(tmpl.actionType);
  };

  const handleSendNotification = async () => {
    setShowConfirmModal(false);
    setIsSending(true);
    setSendResult(null);

    const session = getCurrentStaffSession();

    const payload = {
      title,
      body,
      imageUrl: imageUrl.trim() || undefined,
      targetType,
      targetUserIds: selectedUserIds,
      targetGroupId: selectedGroupId,
      testFcmToken: testFcmToken.trim(),
      actionType,
      actionData: {
        groupId: actionGroupId || selectedGroupId || "",
        expenseId: actionExpenseId || "",
        externalUrl: externalUrl || "",
      },
      bannerStyle,
      staffSession: {
        name: session?.name || "Super Admin",
        email: session?.email || "admin@splinzo.com",
      },
    };

    try {
      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || (data.error && !data.success)) {
        setAlertModal({
          title: "Broadcast Notice",
          message: data.error || "Failed to dispatch notifications.",
          type: "error",
          showGuide: data.error?.includes("credentials") || data.error?.includes("default"),
        });
      } else {
        setSendResult(data);
        loadHistory();
        if (data.warning) {
          setAlertModal({
            title: "Saved to Inboxes & Audiences",
            message: data.warning,
            type: "warning",
            showGuide: true,
          });
        }
      }
    } catch (err: any) {
      setAlertModal({
        title: "Network Error",
        message: err.message || "Failed to communicate with notification broadcast server.",
        type: "error",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Filtered users for picker
  const filteredUsers = usersList.filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone?.includes(userSearch)
  );

  const estimatedAudienceCount = () => {
    if (targetType === "all") {
      const pushCount = usersList.filter((u) => u.hasDeviceToken).length;
      return `${usersList.length} (${pushCount} push, ${usersList.length - pushCount} web inboxes)`;
    }
    if (targetType === "users") {
      return selectedUserIds.length;
    }
    if (targetType === "group") {
      const grp = groupsList.find((g) => g.id === selectedGroupId);
      return grp?.memberIds?.length || grp?.members?.length || 0;
    }
    return 1;
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold font-mono tracking-wide uppercase">
              Broadcast Engine
            </span>
            {serverStatus?.isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                FCM Hardware Push Active ({serverStatus.projectId || "splinzo"})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                FCM Key Pending Vercel Redeploy
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-950 tracking-tight mt-1">
            Push Studio & Nudge Center
          </h1>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            Draft, preview in real time, and broadcast rich push notifications directly to Splinzo devices.
          </p>
        </div>

        {/* Quick presets row */}
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.slice(0, 3).map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => handleApplyTemplate(t)}
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white border border-gray-200 shadow-xs hover:border-amber-400 hover:bg-amber-50/50 transition-all text-gray-700 hover:text-gray-900"
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── BANNER FEEDBACK ── */}
      {sendResult && (
        <div
          className={`p-4 rounded-2xl border shadow-sm flex items-start justify-between ${
            (sendResult.successCount > 0 || sendResult.inboxSaved)
              ? "bg-emerald-50 border-emerald-200"
              : "bg-amber-50 border-amber-300"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 ${
                (sendResult.successCount > 0 || sendResult.inboxSaved) ? "bg-emerald-500" : "bg-amber-500"
              }`}
            >
              {(sendResult.successCount > 0 || sendResult.inboxSaved) ? (
                <CheckCircle2 size={22} />
              ) : (
                <AlertTriangle size={22} />
              )}
            </div>
            <div className="space-y-1">
              <h3
                className={`text-sm font-black ${
                  (sendResult.successCount > 0 || sendResult.inboxSaved) ? "text-emerald-950" : "text-amber-950"
                }`}
              >
                {sendResult.successCount > 0 && sendResult.inboxSaved
                  ? "Broadcast Dispatched Successfully!"
                  : sendResult.inboxSaved
                  ? "Delivered to In-App Notification Center!"
                  : sendResult.successCount > 0
                  ? "Push Alerts Dispatched!"
                  : "Broadcast Delivery Incomplete"}
              </h3>
              <p
                className={`text-xs leading-relaxed ${
                  (sendResult.successCount > 0 || sendResult.inboxSaved) ? "text-emerald-800" : "text-amber-900"
                }`}
              >
                {sendResult.message || (
                  <>
                    {sendResult.successCount > 0 && (
                      <span>Delivered to <strong>{sendResult.successCount}</strong> hardware push device(s). </span>
                    )}
                    {sendResult.inboxSaved && (
                      <span>Saved to <strong>{sendResult.inboxCount || 1}</strong> user Notification Center(s).</span>
                    )}
                  </>
                )}
                {sendResult.failureCount > 0 && ` (${sendResult.failureCount} push failed)`}
                {sendResult.staleTokensCount > 0 &&
                  ` • Cleaned up ${sendResult.staleTokensCount} expired tokens.`}
              </p>
              {sendResult.warning && (
                <div className="text-[11px] font-medium text-amber-800 bg-amber-100/70 p-2 rounded-lg mt-1 border border-amber-200">
                  ⚠️ {sendResult.warning}
                </div>
              )}
              {sendResult.errorMessage && (
                <div className="text-[11px] font-mono text-red-700 bg-red-50 p-2 rounded-lg border border-red-200">
                  Details: {sendResult.errorMessage}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => setSendResult(null)}
            className="text-xs text-gray-500 hover:text-gray-900 font-bold px-2 py-1 shrink-0 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── MAIN WORKSPACE: COMPOSE (LEFT) & SIMULATOR (RIGHT) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: COMPOSE & TARGETING (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Audience & Targeting */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Radio size={18} className="text-amber-600" />
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-mono">
                  1. Target Audience
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-gray-500">
                Est. Devices: <span className="text-amber-600">{estimatedAudienceCount()}</span>
              </span>
            </div>

            {/* Target Mode Tabs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { id: "all", label: "Broadcast All", desc: "All active devices" },
                { id: "users", label: "Specific Users", desc: "Pick individuals" },
                { id: "group", label: "Specific Flat", desc: "All flatmates" },
                { id: "test", label: "Test Device", desc: "1-device dry run" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTargetType(tab.id as any)}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    targetType === tab.id
                      ? "bg-amber-50/80 border-amber-300 text-gray-950 shadow-xs"
                      : "border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  <div className="text-xs font-bold">{tab.label}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 truncate">{tab.desc}</div>
                </button>
              ))}
            </div>

            {/* Target Type Specific Inputs */}
            {targetType === "test" && (
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900 block">
                    Test Device FCM Token
                  </label>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Select user or paste token
                  </span>
                </div>

                {/* Quick User Picker dropdown */}
                <select
                  onChange={(e) => {
                    const selectedUid = e.target.value;
                    const found = usersList.find((u) => u.id === selectedUid);
                    if (found) {
                      setTestFcmToken(found.fcmToken || "");
                      setSelectedUserIds([found.id]);
                    }
                  }}
                  className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">-- Quick fill from registered user --</option>
                  {usersList.map((u) => {
                    const label = u.hasDeviceToken
                      ? (u.fcmPlatform === "ios_web" || u.fcmPlatform === "web" || u.fcmPlatform === "ios_pwa" ? "Web Push" : "App Push")
                      : "Web Inbox";
                    return (
                      <option key={u.id} value={u.id}>
                        {u.name || u.displayName || u.email} [{label}]
                      </option>
                    );
                  })}
                </select>

                <input
                  type="text"
                  placeholder="Paste device FCM token or select user above..."
                  value={testFcmToken}
                  onChange={(e) => setTestFcmToken(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <p className="text-[11px] text-gray-500">
                  Tip: Select any user to send a test alert (hardware push to device, or instant alert in their website Notification Center).
                </p>
              </div>
            )}

            {targetType === "group" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-900 block">Select Flat / Group</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => {
                    setSelectedGroupId(e.target.value);
                    setActionGroupId(e.target.value);
                  }}
                  className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <option value="">-- Choose a group --</option>
                  {groupsList.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({(g.memberIds?.length || g.members?.length || 0)} members)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {targetType === "users" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900">
                    Selected ({selectedUserIds.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => setSelectedUserIds([])}
                    className="text-[11px] text-gray-500 hover:text-red-600 font-bold"
                  >
                    Clear All
                  </button>
                </div>

                {/* Search input */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search user by name, email, or phone..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* User checklist */}
                <div className="max-h-44 overflow-y-auto space-y-1 pr-1 border border-gray-100 rounded-xl p-2 bg-gray-50/50">
                  {filteredUsers.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center py-4">No users found.</div>
                  ) : (
                    filteredUsers.map((u) => {
                      const isChecked = selectedUserIds.includes(u.id);
                      const hasToken = u.fcmToken && u.fcmToken.length > 5;
                      return (
                        <label
                          key={u.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white hover:bg-amber-50/40 border border-gray-100 cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedUserIds([...selectedUserIds, u.id]);
                                } else {
                                  setSelectedUserIds(selectedUserIds.filter((id) => id !== u.id));
                                }
                              }}
                              className="rounded text-amber-500 focus:ring-amber-400"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-gray-900 truncate">{u.name}</div>
                              <div className="text-[10px] text-gray-500 truncate">
                                {u.email || u.phone || u.id}
                              </div>
                            </div>
                          </div>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md ${
                              u.hasDeviceToken
                                ? u.fcmPlatform === "ios_web" || u.fcmPlatform === "web" || u.fcmPlatform === "ios_pwa"
                                  ? "bg-purple-100 text-purple-700 font-bold"
                                  : "bg-emerald-100 text-emerald-700 font-bold"
                                : "bg-amber-100 text-amber-800 font-medium"
                            }`}
                          >
                            {u.hasDeviceToken
                              ? u.fcmPlatform === "ios_web" || u.fcmPlatform === "web" || u.fcmPlatform === "ios_pwa"
                                ? "Web Push"
                                : "App Push"
                              : "Web Inbox"}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Notification Content */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-600" />
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-mono">
                  2. Content & Media
                </h2>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-900">Notification Title</label>
                <span className="text-[10px] text-gray-400 font-mono">{title.length}/60</span>
              </div>
              <input
                type="text"
                maxLength={60}
                placeholder="e.g. ⚡ Weekend Settlement Alert"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm font-bold px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              {/* Quick Emojis */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase font-mono mr-1">
                  Add:
                </span>
                {["⚡", "🍕", "💧", "🍯", "🎉", "🚀", "📢", "💰", "🚨"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setTitle((prev) => `${emoji} ${prev}`)}
                    className="h-6 w-6 rounded-lg bg-gray-100 hover:bg-amber-100 flex items-center justify-center text-xs transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-900">Message Body</label>
                <span className="text-[10px] text-gray-400 font-mono">{body.length}/200</span>
              </div>
              <textarea
                rows={3}
                maxLength={200}
                placeholder="Type the message that will appear on lockscreen and heads-up banner..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 leading-relaxed"
              />
            </div>

            {/* Hero Image Section with Cloudflare R2 Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-amber-500" />
                  Hero Banner Image (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck size={11} className="text-emerald-600" />
                    Cloudflare R2 Store
                  </span>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl("");
                        setUploadError(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-[10px] text-red-600 hover:text-red-700 font-bold flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={11} />
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Error Notice if any */}
              {uploadError && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadError(null)}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-800"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Uploading State */}
              {isUploadingImage ? (
                <div className="border-2 border-dashed border-amber-300 bg-amber-50/50 rounded-2xl p-6 text-center animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                    <Loader2 size={20} className="animate-spin text-amber-600" />
                  </div>
                  <p className="text-xs font-bold text-gray-900">
                    Uploading image to Cloudflare R2...
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Compressing & preparing high-speed CDN delivery
                  </p>
                </div>
              ) : imageUrl ? (
                /* Preview Card */
                <div className="rounded-2xl border border-gray-200 overflow-hidden bg-gray-50/80 p-3 space-y-3">
                  <div className="relative h-32 w-full rounded-xl overflow-hidden bg-gray-900 border border-gray-200/80 shadow-inner group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                      onError={() => setUploadError("Failed to render preview. The image URL might be inaccessible.")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-90" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-[11px]">
                      <span className="bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md font-mono text-[10px] truncate max-w-[220px]">
                        {imageUrl.split("/").pop() || "Cloudflare R2 File"}
                      </span>
                      <span className="bg-emerald-500/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold">
                        ACTIVE BANNER
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 shadow-2xs transition-all"
                    >
                      <UploadCloud size={13} className="text-gray-500" />
                      Upload Different Image
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl("");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="py-1.5 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-bold text-rose-700 transition-all"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                /* Dropzone / Upload Action Card */
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    isDraggingOver
                      ? "border-amber-500 bg-amber-50/60 scale-[1.01]"
                      : "border-gray-300 hover:border-amber-400 bg-gray-50/50 hover:bg-amber-50/20"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                    <UploadCloud size={20} />
                  </div>
                  <div className="text-xs font-bold text-gray-900">
                    <span>Click to upload hero banner</span> or drag & drop
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Supports JPG, PNG, WEBP, HEIC • Auto-compressed to Cloudflare R2
                  </p>
                </div>
              )}

              {/* Preset buttons & Manual URL Toggle */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setImageUrl("https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80")
                    }
                    className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-md border border-amber-200 transition-colors"
                  >
                    Sample Dinner
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setImageUrl("https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80")
                    }
                    className="text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded-md border border-amber-200 transition-colors"
                  >
                    Sample Fintech
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowManualUrl(!showManualUrl)}
                  className="text-[10px] font-bold text-gray-500 hover:text-gray-800 underline underline-offset-2"
                >
                  {showManualUrl ? "Hide URL input" : "Or enter URL manually"}
                </button>
              </div>

              {/* Optional manual URL input */}
              {showManualUrl && (
                <div className="pt-1.5 space-y-1">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full text-xs font-mono px-3.5 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  />
                  <p className="text-[10px] text-gray-400">
                    Paste any public image link if you prefer not uploading a file.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: In-App Styling & Deep Links */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-amber-600" />
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-mono">
                  3. In-App Styling & Deep Link
                </h2>
              </div>
            </div>

            {/* Banner Style Switcher */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-900 block">
                In-App Flash Alert Theme (Blinkit Overlay)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: "blinkit", label: "⚡ Blinkit Fast", icon: Zap, border: "border-amber-300" },
                  { id: "water_duty", label: "💧 Jal Devta", icon: Droplets, border: "border-sky-300" },
                  { id: "guilt_jar", label: "🍯 Chalan Fine", icon: Coins, border: "border-red-300" },
                  { id: "celebration", label: "🎉 Celebration", icon: PartyPopper, border: "border-purple-300" },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setBannerStyle(s.id as any)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                        bannerStyle === s.id
                          ? `bg-gray-900 text-white shadow-xs ${s.border}`
                          : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      <Icon size={14} />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Deep Link Action */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-900 block">
                Tap Action / Deep Link
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as any)}
                className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="home">Open App Home Dashboard</option>
                <option value="group">Open Specific Group / Flat</option>
                <option value="expense">Open Specific Expense Details</option>
                <option value="guilt_jar">Open Flat Guilt Jar</option>
                <option value="url">Launch External Website / Survey URL</option>
              </select>

              {actionType === "url" && (
                <div className="mt-2">
                  <input
                    type="url"
                    placeholder="https://splinzo.com/update..."
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              )}
            </div>

            {/* Send Dispatch Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isSending || !title.trim() || !body.trim()}
                onClick={() => setShowConfirmModal(true)}
                className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isSending || !title.trim() || !body.trim()
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#F9B912] hover:bg-[#eab00f] text-gray-950 shadow-amber-500/20 active:scale-[0.99]"
                }`}
              >
                {isSending ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Broadcasting to Devices...</span>
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Dispatch Push Notification</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE SIMULATOR (5 COLS) */}
        <div className="lg:col-span-5 sticky top-8 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4 self-start">
              <Smartphone size={16} className="text-amber-600" />
              <h3 className="text-xs font-bold text-gray-900 uppercase font-mono tracking-wider">
                Live Device Simulator
              </h3>
            </div>

            <DeviceSimulator
              title={title}
              body={body}
              imageUrl={imageUrl}
              bannerStyle={bannerStyle}
              actionType={actionType}
            />
          </div>
        </div>
      </div>

      {/* ── CAMPAIGN HISTORY AUDIT LOG ── */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <History size={18} className="text-amber-600" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider font-mono">
              Broadcast Campaigns History
            </h2>
          </div>
          <button
            type="button"
            onClick={loadHistory}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900"
          >
            <RefreshCw size={13} className={loadingHistory ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            No previous broadcast campaigns found. Sent broadcasts will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] font-mono text-gray-500 uppercase">
                  <th className="py-2.5 font-bold">Campaign</th>
                  <th className="py-2.5 font-bold">Audience</th>
                  <th className="py-2.5 font-bold">Delivered</th>
                  <th className="py-2.5 font-bold">Opens / CTR</th>
                  <th className="py-2.5 font-bold">Banner Style</th>
                  <th className="py-2.5 font-bold">Sent By</th>
                  <th className="py-2.5 font-bold">Date</th>
                  <th className="py-2.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60">
                    <td className="py-3 pr-4">
                      <div className="font-bold text-gray-900 truncate max-w-xs">{c.title}</div>
                      <div className="text-[11px] text-gray-500 truncate max-w-xs">{c.body}</div>
                    </td>
                    <td className="py-3">
                      <span className="font-mono px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 uppercase font-bold text-[10px]">
                        {c.targetType}
                      </span>
                    </td>
                    <td className="py-3 font-mono font-bold text-emerald-600">
                      {c.successCount} / {c.targetCount}
                    </td>
                    <td className="py-3 font-mono font-bold text-blue-600">
                      {c.openedCount || 0}{" "}
                      <span className="text-[10px] text-gray-400 font-normal">
                        ({c.targetCount > 0 ? Math.round(((c.openedCount || 0) / c.targetCount) * 100) : 0}%)
                      </span>
                    </td>
                    <td className="py-3 capitalize text-gray-700">{c.bannerStyle}</td>
                    <td className="py-3 text-gray-600">{c.sentBy?.name || "Admin"}</td>
                    <td className="py-3 font-mono text-[11px] text-gray-500">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Just now"}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setTitle(c.title);
                          setBody(c.body);
                          if (c.imageUrl) setImageUrl(c.imageUrl);
                          if (c.bannerStyle) setBannerStyle(c.bannerStyle as any);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 ml-auto"
                      >
                        <Copy size={12} />
                        Reuse
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SAFETY CONFIRMATION MODAL ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-950">Confirm Push Broadcast</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                You are about to broadcast this notification to{" "}
                <strong className="text-gray-900">
                  {estimatedAudienceCount()} active devices
                </strong>
                . This action will wake up users&apos; phones and trigger audible heads-up alerts.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs space-y-1">
              <div className="font-bold text-gray-900">{title}</div>
              <div className="text-gray-500 line-clamp-2">{body}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendNotification}
                className="px-5 py-2.5 rounded-xl bg-[#F9B912] hover:bg-[#eab00f] text-gray-950 font-black text-xs shadow-md"
              >
                Yes, Send Now 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ALERT / NOTICE MODAL ── */}
      {alertModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl ${
                  alertModal.type === "error"
                    ? "bg-rose-100 text-rose-700"
                    : alertModal.type === "warning"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {alertModal.type === "error" ? (
                  <AlertCircle size={22} />
                ) : alertModal.type === "warning" ? (
                  <AlertTriangle size={22} />
                ) : (
                  <CheckCircle2 size={22} />
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-gray-950">{alertModal.title}</h3>
                <p className="text-xs text-gray-500">Splinzo Push Notification Engine</p>
              </div>
            </div>

            <p className="text-xs text-gray-700 leading-relaxed">{alertModal.message}</p>

            {alertModal.showGuide && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs space-y-2 text-amber-950">
                <p className="font-bold flex items-center gap-1.5 text-amber-900">
                  <ShieldCheck size={16} className="text-amber-700" />
                  How to Enable Direct Device Push in Vercel:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-amber-900/90 leading-normal">
                  <li>Open <b>Firebase Console</b> &rarr; Project Settings &rarr; <b>Service Accounts</b> tab.</li>
                  <li>Click <b>&ldquo;Generate new private key&rdquo;</b> (downloads a JSON file).</li>
                  <li>Open your <b>Vercel Project Dashboard</b> &rarr; Settings &rarr; <b>Environment Variables</b>.</li>
                  <li>Add Variable Name: <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold text-amber-900">FIREBASE_SERVICE_ACCOUNT_KEY</code></li>
                  <li>Value: <i>Paste the full content of the downloaded JSON file</i> &rarr; Save &rarr; Redeploy.</li>
                </ol>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              {alertModal.showGuide && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText("FIREBASE_SERVICE_ACCOUNT_KEY");
                    alert("Copied 'FIREBASE_SERVICE_ACCOUNT_KEY' to clipboard!");
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  Copy Env Name
                </button>
              )}
              <button
                type="button"
                onClick={() => setAlertModal(null)}
                className="px-5 py-2.5 rounded-xl bg-gray-950 hover:bg-gray-900 text-white font-bold text-xs shadow-md transition"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
