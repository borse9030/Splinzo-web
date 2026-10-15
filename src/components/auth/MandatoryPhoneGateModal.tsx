"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";
import { COUNTRIES, Country, DEFAULT_COUNTRY, validatePhoneNumber, formatE164 } from "@/lib/countryData";
import { Phone, ShieldCheck, ArrowRight, Loader2, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

export function MandatoryPhoneGateModal() {
  const { appUser, refreshUser } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasPhone = Boolean(appUser?.phoneNumber || appUser?.phone);

  // If no user is logged in or user already has phone registered, don't show gate
  if (!appUser || hasPhone) {
    return null;
  }

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validatePhoneNumber(phoneNumber, selectedCountry);
    if (!validation.isValid) {
      setError(validation.error || "Please enter a valid mobile number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const check = await userService.checkPhoneAvailability(phoneNumber, appUser.id, selectedCountry.dialCode);
      if (!check.available) {
        setError(check.error || "This mobile number is already registered with another account.");
        setLoading(false);
        return;
      }

      const formatted = formatE164(phoneNumber, selectedCountry);
      await userService.updateUserPhoneNumber(appUser.id, formatted, selectedCountry.dialCode);
      await refreshUser();
    } catch (err: unknown) {
      console.error("Error saving phone number:", err);
      const msg = err instanceof Error ? err.message : "Failed to update phone number. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden p-6 sm:p-8"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col items-center text-center">
          {/* Badge Icon */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-5 shadow-lg"
            style={{
              background: "linear-gradient(135deg, #F9B912 0%, #EA580C 100%)",
              boxShadow: "0 10px 25px -5px rgba(249, 185, 18, 0.4)",
            }}
          >
            <Phone className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>
            Complete Your Profile
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-2 leading-relaxed max-w-xs">
            To sync your device contacts and split bills with friends seamlessly, please link your mobile number.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                Mobile Number
              </label>
              <span className="text-[11px] font-bold text-gray-400">
                {selectedCountry.minLength === selectedCountry.maxLength
                  ? `${selectedCountry.minLength} digits`
                  : `${selectedCountry.minLength}-${selectedCountry.maxLength} digits`}
              </span>
            </div>

            <div className="relative flex items-center rounded-2xl border bg-gray-50 dark:bg-gray-800/60 overflow-visible focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all">
              {/* Country Trigger */}
              <button
                type="button"
                onClick={() => setOpenDropdown(!openDropdown)}
                className="flex items-center gap-1.5 px-3 py-3 border-r border-gray-200 dark:border-gray-700 hover:bg-gray-100/60 dark:hover:bg-gray-700/60 rounded-l-2xl transition text-xs font-bold text-gray-800 dark:text-gray-200 shrink-0"
              >
                <span className="text-base">{selectedCountry.flag}</span>
                <span className="font-mono">{selectedCountry.dialCode}</span>
                <ChevronDown size={13} className="text-gray-400" />
              </button>

              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value.replace(/\D/g, ""));
                  if (error) setError("");
                }}
                placeholder={selectedCountry.placeholder}
                maxLength={selectedCountry.maxLength}
                required
                className="w-full px-4 py-3 bg-transparent text-sm font-semibold outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
              />

              {/* Country Selection Dropdown */}
              {openDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => {
                      setOpenDropdown(false);
                      setSearch("");
                    }}
                  />
                  <div className="absolute top-[52px] left-0 z-50 w-72 max-h-60 overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl p-2 space-y-1">
                    <input
                      type="text"
                      placeholder="Search country or code..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 outline-none mb-1 font-medium text-gray-900 dark:text-white"
                      autoFocus
                    />
                    {filteredCountries.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(c);
                          setOpenDropdown(false);
                          setSearch("");
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition text-left ${
                          c.code === selectedCountry.code
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-300 font-bold"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{c.flag}</span>
                          <span className="truncate max-w-[130px]">{c.name}</span>
                        </div>
                        <span className="text-gray-500 font-mono font-bold">{c.dialCode}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {error && (
              <p className="text-xs text-red-500 font-semibold mt-1.5">{error}</p>
            )}
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Used strictly for contact matching and payment notifications.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm text-gray-950 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98] disabled:opacity-70 mt-2"
            style={{
              background: "linear-gradient(135deg, #F9B912 0%, #F9A000 100%)",
              boxShadow: "0 8px 20px -4px rgba(249, 185, 18, 0.4)",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Save & Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
