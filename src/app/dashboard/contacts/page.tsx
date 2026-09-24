"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  contactService,
  contactPhoneNormalizer,
  SplinzoContact,
  ContactSplitSummary,
} from "@/services/contactService";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  Smartphone,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Share2,
  QrCode,
  Phone,
  RefreshCw,
  ExternalLink,
  X,
  CreditCard,
  MessageCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const AMBER = "#F9B912";

export default function ContactsPage() {
  const { user, appUser } = useAuth();
  const currentUid = user?.uid || appUser?.id || "";
  const [contacts, setContacts] = useState<SplinzoContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"all" | "splinzo">("all");

  // Selected contact for detail drawer / modal
  const [activeContact, setActiveContact] = useState<SplinzoContact | null>(null);
  const [splitSummary, setSplitSummary] = useState<ContactSplitSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Modals
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [splitAmount, setSplitAmount] = useState("");
  const [splitDesc, setSplitDesc] = useState("");
  const [splitCategory, setSplitCategory] = useState("Food & Drinks");
  const [iPaid, setIPaid] = useState(true);
  const [isSavingSplit, setIsSavingSplit] = useState(false);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payUpi, setPayUpi] = useState("");

  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");

  // Load contacts
  useEffect(() => {
    loadContacts();
  }, [currentUid]);

  async function loadContacts() {
    setLoading(true);
    try {
      // 1. Fetch registered users from Firestore
      const registeredMap = await contactService.fetchRegisteredUsersMap();

      // 2. Fetch existing direct groups
      const list: SplinzoContact[] = [];
      const seen = new Set<string>();

      // Populate from registered users
      registeredMap.forEach((userData, phone) => {
        if (userData.uid === currentUid) return;
        if (seen.has(phone)) return;
        seen.add(phone);

        list.push({
          id: `registered_${userData.uid}`,
          displayName: userData.name || userData.displayName || "Splinzo User",
          phoneNumber: userData.phoneNumber || userData.phone || phone,
          normalizedPhone: phone,
          isRegistered: true,
          registeredUid: userData.uid,
          registeredAvatarUrl: userData.photoUrl || userData.photoURL,
          upiId: userData.upiId,
          email: userData.email,
        });
      });

      // Check localStorage for previously synced browser contacts
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("splinzo_web_contacts");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            for (const c of parsed) {
              if (!seen.has(c.normalizedPhone)) {
                seen.add(c.normalizedPhone);
                const reg = registeredMap.get(c.normalizedPhone);
                list.push({
                  ...c,
                  isRegistered: Boolean(reg),
                  registeredUid: reg?.uid,
                  registeredAvatarUrl: reg?.photoUrl,
                  upiId: reg?.upiId,
                });
              }
            }
          } catch (_) {}
        }
      }

      setContacts(list);
    } catch (e) {
      console.error("Error loading contacts:", e);
    } finally {
      setLoading(false);
    }
  }

  // Load split summary when a contact is selected
  useEffect(() => {
    if (!activeContact || !currentUid) {
      setSplitSummary(null);
      return;
    }

    setSummaryLoading(true);
    contactService
      .getContactSplitSummary(currentUid, activeContact)
      .then((res) => {
        setSplitSummary(res);
        setSummaryLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching split summary:", err);
        setSummaryLoading(false);
      });
  }, [activeContact, currentUid]);

  // Sync from browser
  async function handleBrowserSync() {
    const list = await contactService.requestBrowserContacts();
    if (list.length > 0) {
      const registeredMap = await contactService.fetchRegisteredUsersMap();
      const updated = [...contacts];
      const seen = new Set(contacts.map((c) => c.normalizedPhone));

      for (const item of list) {
        if (!seen.has(item.normalizedPhone)) {
          seen.add(item.normalizedPhone);
          const reg = registeredMap.get(item.normalizedPhone);
          updated.push({
            ...item,
            isRegistered: Boolean(reg),
            registeredUid: reg?.uid,
            registeredAvatarUrl: reg?.photoUrl,
            upiId: reg?.upiId,
          });
        }
      }
      setContacts(updated);
      localStorage.setItem("splinzo_web_contacts", JSON.stringify(updated));
    } else {
      alert("Browser Contact Picker is supported on Chrome & Edge mobile. You can also add contacts directly by phone number!");
    }
  }

  // Add new contact manual
  function handleAddManualContact(e: React.FormEvent) {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    const norm = contactPhoneNormalizer.normalize(newContactPhone);
    const newC: SplinzoContact = {
      id: `manual_${Date.now()}`,
      displayName: newContactName.trim(),
      phoneNumber: newContactPhone.trim(),
      normalizedPhone: norm,
      isRegistered: false,
    };

    const updated = [newC, ...contacts];
    setContacts(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("splinzo_web_contacts", JSON.stringify(updated));
    }
    setNewContactName("");
    setNewContactPhone("");
    setIsAddContactModalOpen(false);
    setActiveContact(newC);
  }

  // Submit split
  async function handleCreateSplit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeContact || !currentUid) return;

    const amt = parseFloat(splitAmount);
    if (isNaN(amt) || amt <= 0) return;

    setIsSavingSplit(true);
    try {
      await contactService.createDirectSplit(
        currentUid,
        appUser?.displayName || user?.displayName || "You",
        appUser?.email || user?.email || "",
        activeContact,
        splitDesc || "Quick Split",
        amt,
        iPaid,
        splitCategory
      );

      // Refresh split summary
      const updatedSummary = await contactService.getContactSplitSummary(
        currentUid,
        activeContact
      );
      setSplitSummary(updatedSummary);

      setIsSplitModalOpen(false);
      setSplitAmount("");
      setSplitDesc("");
    } catch (e) {
      console.error("Error creating split:", e);
      alert("Failed to save split. Please try again.");
    } finally {
      setIsSavingSplit(false);
    }
  }

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return contacts.filter((c) => {
      const matchSearch =
        !q ||
        c.displayName.toLowerCase().includes(q) ||
        c.phoneNumber.includes(q) ||
        c.normalizedPhone.includes(q);

      if (selectedTab === "splinzo") {
        return matchSearch && c.isRegistered;
      }
      return matchSearch;
    });
  }, [contacts, searchQuery, selectedTab]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
            Split with Contacts
          </h1>
          <p className="text-sm font-medium mt-1" style={{ color: "var(--muted-foreground)" }}>
            Sync contacts, view all shared splits, and settle balances instantly via UPI
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddContactModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-sm transition-transform active:scale-95 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Plus className="w-4 h-4" />
            Add by Phone
          </button>

          <button
            onClick={handleBrowserSync}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-gray-950 shadow-sm transition-transform active:scale-95 hover:opacity-90"
            style={{ background: AMBER }}
          >
            <Smartphone className="w-4 h-4" />
            Sync Device Contacts
          </button>
        </div>
      </div>

      {/* ─── SEARCH & FILTER BAR ─── */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contact by name or phone number..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm border focus:outline-none transition-all"
            style={{
              background: "var(--card)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        <div className="flex p-1 rounded-2xl border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <button
            onClick={() => setSelectedTab("all")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedTab === "all"
                ? "bg-amber-400 text-gray-950 shadow-sm"
                : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            All Contacts ({contacts.length})
          </button>
          <button
            onClick={() => setSelectedTab("splinzo")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedTab === "splinzo"
                ? "bg-amber-400 text-gray-950 shadow-sm"
                : "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            On Splinzo ({contacts.filter((c) => c.isRegistered).length})
          </button>
        </div>
      </div>

      {/* ─── CONTACTS GRID ─── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-28 rounded-3xl animate-pulse p-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            />
          ))}
        </div>
      ) : filteredContacts.length === 0 ? (
        <div
          className="text-center py-16 px-4 rounded-3xl border border-dashed"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
            No contacts found
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Try searching a different name, or click &ldquo;Add by Phone&rdquo; to split with any contact number.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => {
            const initials = contact.displayName
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <motion.div
                key={contact.id}
                whileHover={{ y: -2 }}
                onClick={() => setActiveContact(contact)}
                className="p-4 rounded-3xl border cursor-pointer transition-all hover:shadow-md relative overflow-hidden group"
                style={{
                  background: "var(--card)",
                  borderColor: "var(--border)",
                }}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-sm shrink-0 overflow-hidden"
                    style={{
                      background: contact.isRegistered
                        ? "linear-gradient(135deg, #10B981, #059669)"
                        : "linear-gradient(135deg, #F9B912, #EA580C)",
                    }}
                  >
                    {contact.registeredAvatarUrl ? (
                      <img
                        src={contact.registeredAvatarUrl}
                        alt={contact.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4
                        className="font-bold text-sm truncate"
                        style={{ color: "var(--foreground)" }}
                      >
                        {contact.displayName}
                      </h4>
                      {contact.isRegistered && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          Splinzo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                      {contactPhoneNormalizer.formatForDisplay(contact.phoneNumber)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs font-semibold" style={{ borderColor: "var(--border)" }}>
                  <span className="text-gray-400 group-hover:text-amber-500 transition-colors flex items-center gap-1">
                    {contact.isRegistered ? (
                      <>View Splits <ArrowUpRight className="w-3.5 h-3.5" /></>
                    ) : (
                      <>Not on Splinzo</>
                    )}
                  </span>
                  {contact.isRegistered ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveContact(contact);
                        setIsSplitModalOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-400/10 text-amber-600 dark:text-amber-400 hover:bg-amber-400/20"
                    >
                      Quick Split
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const msg = `Hey ${contact.displayName}! Let's split expenses easily on Splinzo. Join here: https://www.splinzo.in`;
                        window.open(`https://wa.me/${contact.normalizedPhone}?text=${encodeURIComponent(msg)}`, "_blank");
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Invite
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─── CONTACT DETAIL MODAL / DRAWER ("Raj" View) ─── */}
      <AnimatePresence>
        {activeContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              {/* Header */}
              <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-sm"
                    style={{
                      background: activeContact.isRegistered
                        ? "linear-gradient(135deg, #10B981, #059669)"
                        : "linear-gradient(135deg, #F9B912, #EA580C)",
                    }}
                  >
                    {activeContact.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base" style={{ color: "var(--foreground)" }}>
                        {activeContact.displayName}
                      </h3>
                      {activeContact.isRegistered && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          On Splinzo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      {contactPhoneNormalizer.formatForDisplay(activeContact.phoneNumber)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveContact(null)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-5 flex-1">
                {/* Balance Card */}
                {summaryLoading ? (
                  <div className="h-28 rounded-2xl animate-pulse bg-gray-100 dark:bg-gray-800" />
                ) : splitSummary ? (
                  <div
                    className={`p-5 rounded-2xl text-white shadow-lg ${
                      splitSummary.theyOweYou
                        ? "bg-emerald-600"
                        : splitSummary.youOweThem
                        ? "bg-red-600"
                        : "bg-gray-800"
                    }`}
                  >
                    <div className="text-xs font-black tracking-wider uppercase opacity-80">
                      {splitSummary.theyOweYou
                        ? `${activeContact.displayName.split(" ")[0]} Owes You`
                        : splitSummary.youOweThem
                        ? `You Owe ${activeContact.displayName.split(" ")[0]}`
                        : "Balance Status"}
                    </div>
                    <div className="text-3xl font-black mt-1">
                      {splitSummary.isSettled
                        ? "All Settled Up 🎉"
                        : `₹${Math.abs(splitSummary.netBalance).toFixed(0)}`}
                    </div>
                    <p className="text-xs opacity-80 mt-1">
                      {splitSummary.isSettled
                        ? "No pending debts with this contact"
                        : splitSummary.theyOweYou
                        ? "Total receivable from shared splits"
                        : "Clear balance anytime via UPI"}
                    </p>
                  </div>
                ) : null}

                {/* Action Buttons */}
                {!activeContact.isRegistered ? (
                  <div className="p-4 rounded-2xl border bg-amber-500/5 border-amber-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Splitting requires both members on Splinzo
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {activeContact.displayName} hasn&apos;t joined Splinzo yet. To keep accounts verified and settlements secure, bill splitting is only enabled between registered members.
                    </p>
                    <button
                      onClick={() => {
                        const msg = `Hey ${activeContact.displayName}! 👋 Let&apos;s split our shared bills on Splinzo. Sign up here to get started: https://www.splinzo.in`;
                        window.open(`https://wa.me/${activeContact.normalizedPhone}?text=${encodeURIComponent(msg)}`, "_blank");
                      }}
                      className="w-full py-3 rounded-xl font-bold text-xs bg-amber-400 text-gray-950 flex items-center justify-center gap-2 shadow-sm hover:bg-amber-500 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Invite {activeContact.displayName.split(" ")[0]} via WhatsApp
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setIsSplitModalOpen(true)}
                      className="py-3 px-2 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-transform active:scale-95 bg-amber-400 text-gray-950 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Split Bill
                    </button>

                    <button
                      onClick={() => {
                        const owed = splitSummary?.totalYouOwe || 0;
                        setPayAmount(owed > 0 ? owed.toFixed(0) : "");
                        setPayUpi(activeContact.upiId || `${activeContact.normalizedPhone}@upi`);
                        setIsPayModalOpen(true);
                      }}
                      className="py-3 px-2 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-transform active:scale-95 bg-emerald-600 text-white shadow-sm"
                    >
                      <CreditCard className="w-4 h-4" />
                      Pay / Settle
                    </button>

                    <button
                      onClick={() => {
                        const net = splitSummary?.netBalance || 0;
                        const msg =
                          net > 0
                            ? `Hey ${activeContact.displayName}! 👋 You owe ₹${net.toFixed(0)} on Splinzo. You can settle via UPI or view details at: https://www.splinzo.in`
                            : `Hey ${activeContact.displayName}! 👋 Checking in from Splinzo. All settled up!`;
                        window.open(`https://wa.me/${activeContact.normalizedPhone}?text=${encodeURIComponent(msg)}`, "_blank");
                      }}
                      className="py-3 px-2 rounded-2xl font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-transform active:scale-95 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </button>
                  </div>
                )}

                {/* Shared Splits Ledger */}
                <div>
                  <h4 className="font-extrabold text-sm mb-3" style={{ color: "var(--foreground)" }}>
                    Shared Splits ({splitSummary?.splits.length || 0})
                  </h4>

                  {splitSummary?.splits.length === 0 ? (
                    <div className="text-center py-8 rounded-2xl border border-dashed text-gray-400 text-xs">
                      No shared splits yet. Click &ldquo;Split Bill&rdquo; to record your first expense!
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {splitSummary?.splits.map((s) => (
                        <div
                          key={s.expenseId}
                          className="p-3 rounded-2xl border flex items-center justify-between"
                          style={{ background: "var(--card)", borderColor: "var(--border)" }}
                        >
                          <div>
                            <p className="font-bold text-xs" style={{ color: "var(--foreground)" }}>
                              {s.description}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              {s.groupName} • {s.didIPay ? "You paid" : `${s.payerName} paid`} ₹{s.totalAmount}
                            </p>
                          </div>

                          <div className="text-right">
                            <span
                              className={`text-xs font-black ${
                                s.netImpact > 0 ? "text-emerald-600" : "text-red-500"
                              }`}
                            >
                              {s.netImpact > 0 ? `+₹${s.netImpact.toFixed(0)}` : `-₹${Math.abs(s.netImpact).toFixed(0)}`}
                            </span>
                            <p className="text-[9px] text-gray-400 font-semibold">
                              {s.netImpact > 0 ? "they owe" : "you owe"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── QUICK SPLIT MODAL ─── */}
      <AnimatePresence>
        {isSplitModalOpen && activeContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border shadow-2xl p-6"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-base" style={{ color: "var(--foreground)" }}>
                  Split with {activeContact.displayName}
                </h3>
                <button onClick={() => setIsSplitModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSplit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Total Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={splitAmount}
                    onChange={(e) => setSplitAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-2xl text-xl font-black border focus:outline-none"
                    style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Description</label>
                  <input
                    type="text"
                    required
                    value={splitDesc}
                    onChange={(e) => setSplitDesc(e.target.value)}
                    placeholder="Dinner, Cab, Coffee..."
                    className="w-full px-4 py-2.5 rounded-2xl text-sm border focus:outline-none"
                    style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Who Paid?</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIPaid(true)}
                      className={`p-3 rounded-2xl text-xs font-bold border transition-all ${
                        iPaid
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          : "border-gray-200 dark:border-gray-800 text-gray-500"
                      }`}
                    >
                      I Paid (50/50)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIPaid(false)}
                      className={`p-3 rounded-2xl text-xs font-bold border transition-all ${
                        !iPaid
                          ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                          : "border-gray-200 dark:border-gray-800 text-gray-500"
                      }`}
                    >
                      {activeContact.displayName.split(" ")[0]} Paid (50/50)
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingSplit}
                  className="w-full py-3.5 rounded-2xl font-black text-sm bg-amber-400 text-gray-950 hover:bg-amber-500 transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSavingSplit ? "Saving Split..." : "Confirm Split"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── UPI QR & PAYMENT MODAL ─── */}
      <AnimatePresence>
        {isPayModalOpen && activeContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl border shadow-2xl p-6 text-center"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-base text-left" style={{ color: "var(--foreground)" }}>
                  Pay {activeContact.displayName}
                </h3>
                <button onClick={() => setIsPayModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dynamic QR Code */}
              <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-4">
                <QRCodeSVG
                  value={`upi://pay?pa=${payUpi}&pn=${encodeURIComponent(
                    activeContact.displayName
                  )}&am=${payAmount || "100"}&cu=INR&tn=Settlement via Splinzo`}
                  size={180}
                  level="M"
                />
              </div>

              <div className="text-xs text-gray-500 mb-4">
                Scan with <strong>Google Pay</strong>, <strong>PhonePe</strong>, or <strong>Paytm</strong> to settle
              </div>

              <div className="space-y-3 text-left">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none"
                    style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-400 block mb-1">Receiver UPI ID</label>
                  <input
                    type="text"
                    value={payUpi}
                    onChange={(e) => setPayUpi(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none font-mono"
                    style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  />
                </div>
              </div>

              <a
                href={`upi://pay?pa=${payUpi}&pn=${encodeURIComponent(
                  activeContact.displayName
                )}&am=${payAmount || "100"}&cu=INR&tn=Settlement via Splinzo`}
                className="mt-4 block w-full py-3 rounded-2xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                Open UPI App Directly
              </a>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── ADD CONTACT BY PHONE MODAL ─── */}
      <AnimatePresence>
        {isAddContactModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl border shadow-2xl p-6"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-base" style={{ color: "var(--foreground)" }}>
                  Add Contact by Phone
                </h3>
                <button onClick={() => setIsAddContactModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddManualContact} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Raj Kumar"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl text-sm border focus:outline-none"
                    style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1 block">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g., 9876543210"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl text-sm border focus:outline-none"
                    style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl font-bold text-sm bg-amber-400 text-gray-950 hover:bg-amber-500 transition-colors shadow-sm"
                >
                  Save & Open Splits
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
