"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useGroups } from "@/hooks/useGroups";
import { motion } from "framer-motion";
import { Plus, ChevronRight, Users, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const AMBER      = "#F9B912";
const AMBER_DARK = "#F9A000";
const AMBER_BG   = "#FFF8E1";

/* ─── ANIMATION VARIANTS ──────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08 } },
};

/* ─── SKELETON ─────────────────────────────────────────── */
function GroupSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-3xl"
         style={{ background: "var(--card)", boxShadow: "0 1px 12px rgba(0,0,0,0.05)" }}>
      <div className="h-14 w-14 rounded-2xl animate-pulse" style={{ background: "var(--muted)" }}/>
      <div className="flex-1 space-y-2.5">
        <div className="h-4 w-2/5 rounded-full animate-pulse" style={{ background: "var(--muted)" }}/>
        <div className="h-3 w-1/3 rounded-full animate-pulse" style={{ background: "var(--muted)" }}/>
        <div className="flex gap-1.5 pt-0.5">
          {[0,1,2].map(i => (
            <div key={i} className="h-5 w-5 rounded-full animate-pulse" style={{ background: "var(--muted)" }}/>
          ))}
        </div>
      </div>
      <div className="h-5 w-5 rounded-full animate-pulse" style={{ background: "var(--muted)" }}/>
    </div>
  );
}

/* ─── AVATAR DOTS ──────────────────────────────────────── */
const MEMBER_COLORS = ["#F9B912","#6366F1","#10B981","#F59E0B","#EF4444","#8B5CF6","#06B6D4"];

const avatarColor = (str: string) => {
  const hash = str.split("").reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length];
};

function MemberAvatars({ members }: { members: any[] }) {
  const visible = Math.min(members.length, 4);
  const extra = members.length > 4 ? members.length - 4 : 0;
  return (
    <div className="flex -space-x-1.5 mt-1.5">
      {members.slice(0, visible).map((m: any, i) => {
        const pUrl = m.photoURL || m.photoUrl;
        return (
          <div
            key={m.id || i}
            className="h-5 w-5 rounded-full border border-[color:var(--card)] flex items-center justify-center text-[8px] font-black shadow-sm overflow-hidden"
            style={pUrl ? { background: "var(--card)" } : { background: avatarColor(m.id || String(i)), color: "white" }}
          >
            {pUrl ? (
              <img src={pUrl} alt={m.name} className="h-full w-full object-cover" />
            ) : (
              (m.name || "?").charAt(0).toUpperCase()
            )}
          </div>
        );
      })}
      {extra > 0 && (
        <div className="h-5 w-5 rounded-full border border-[color:var(--card)] flex items-center justify-center text-[8px] font-black shadow-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
          +{extra}
        </div>
      )}
    </div>
  );
}

/* ─── MAIN PAGE ────────────────────────────────────────── */
export default function DashboardPage() {
  const { appUser } = useAuth();
  const { groups, loading, error } = useGroups();

  const firstName = appUser?.displayName?.split(" ")[0] || "there";

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="space-y-7"
    >
      {/* ══ HEADER ═══════════════════════════════════════ */}
      <motion.header variants={fadeUp} className="flex items-start justify-between pt-2">
        <div>
          <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--muted-foreground)" }}>
            Hey, {firstName} 👋
          </p>
          <h1 className="text-3xl font-black tracking-tight relative inline-block" style={{ color: "var(--foreground)" }}>
            Overview
            {/* Amber underline accent */}
            <span
              className="absolute -bottom-1 left-0 h-1 rounded-full"
              style={{ width: "48px", background: `linear-gradient(90deg, ${AMBER}, ${AMBER_DARK})` }}
            />
          </h1>
        </div>
        {/* Logo top-right with hover glow */}
        <Link href="/" className="group relative">
          <Image
            src="/logo.png" alt="Splinzo" width={46} height={46}
            className="rounded-2xl shadow-md transition-transform group-hover:scale-105"
          />
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity blur-md"
            style={{ background: AMBER }}
          />
        </Link>
      </motion.header>

      {/* ══ BALANCE CARD (DARK PREMIUM) ══════════════════ */}
      <motion.div variants={fadeUp}>
        <div
          className="rounded-3xl p-6 relative overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #1C1C1E 0%, #2A2200 60%, #111008 100%)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.28), 0 4px 16px rgba(249,185,18,0.12)",
            minHeight: "180px",
          }}
        >
          {/* Ambient amber glow */}
          <div
            className="absolute top-[-40%] right-[-15%] w-64 h-64 rounded-full blur-3xl opacity-25"
            style={{ background: AMBER }}
          />
          <div
            className="absolute bottom-[-30%] left-[-5%] w-40 h-40 rounded-full blur-2xl opacity-10"
            style={{ background: AMBER }}
          />

          {/* Sketch grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(#F9B912 1px,transparent 1px),linear-gradient(90deg,#F9B912 1px,transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative z-10">
            {/* Label */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(249,185,18,0.15)", border: "1px solid rgba(249,185,18,0.2)" }}
              >
                <Wallet className="h-4 w-4" style={{ color: AMBER }} />
              </div>
              <span className="text-sm font-semibold text-white/50">Total Balance</span>
            </div>

            {/* Balance amount */}
            <div className="mb-5">
              <p
                className="text-5xl font-black tracking-tight"
                style={{
                  background: `linear-gradient(135deg, #FFFFFF 0%, ${AMBER} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                ₹0.00
              </p>
            </div>

            {/* You owe / You get */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-2xl px-4 py-3"
                style={{
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                  <p className="text-xs font-semibold text-red-300">You owe</p>
                </div>
                <p className="text-xl font-black text-red-400">₹0</p>
              </div>
              <div
                className="rounded-2xl px-4 py-3"
                style={{
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(16,185,129,0.2)",
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  <p className="text-xs font-semibold text-emerald-300">You get</p>
                </div>
                <p className="text-xl font-black text-emerald-400">₹0</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══ GROUPS SECTION ═══════════════════════════════ */}
      <motion.div variants={fadeUp} className="space-y-4">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black tracking-tight" style={{ color: "var(--foreground)" }}>My Groups</h2>
            {!loading && groups.length > 0 && (
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: AMBER_BG, color: AMBER_DARK }}
              >
                {groups.length}
              </span>
            )}
          </div>

          {/* New Group button */}
          <Link href="/groups/new">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="relative flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-bold overflow-hidden cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${AMBER} 0%, ${AMBER_DARK} 100%)`,
                color: "#1a1a1a",
                boxShadow: "0 4px 16px rgba(249,185,18,0.3)",
              }}
            >
              {/* Shimmer */}
              <div
                className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700"
                style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)" }}
              />
              <Plus className="h-3.5 w-3.5" />
              New Group
            </motion.div>
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100">
            Failed to load groups. Please try again.
          </div>
        )}

        {/* Loading skeletons */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <GroupSkeleton key={i} />)}
          </div>
        ) : groups.length === 0 ? (
          /* ── EMPTY STATE ── */
          <motion.div
            variants={fadeUp}
            className="flex flex-col items-center justify-center py-16 px-8 rounded-3xl text-center"
            style={{
              background: "var(--card)",
              border: "2px dashed var(--border)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="h-20 w-20 rounded-3xl flex items-center justify-center mb-5 text-4xl shadow-sm"
              style={{ background: AMBER_BG }}
            >
              👥
            </motion.div>
            <h3 className="text-xl font-black mb-2" style={{ color: "var(--foreground)" }}>
              Your Splinzo journey starts here
            </h3>
            <p className="mb-7 max-w-xs text-sm leading-relaxed font-medium" style={{ color: "var(--muted-foreground)" }}>
              Create your first group and start splitting expenses with friends, family, or roommates.
            </p>
            <Link href="/groups/new">
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="relative flex items-center gap-2 px-7 py-3 rounded-full font-bold text-sm overflow-hidden cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${AMBER} 0%, ${AMBER_DARK} 100%)`,
                  color: "#1a1a1a",
                  boxShadow: "0 4px 20px rgba(249,185,18,0.35)",
                }}
              >
                <div
                  className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700"
                  style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)" }}
                />
                <Plus className="h-4 w-4" />
                Create a Group
              </motion.div>
            </Link>
          </motion.div>
        ) : (
          /* ── GROUP CARDS ── */
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {groups.map((group) => (
              <motion.div key={group.id} variants={fadeUp}>
                <Link href={`/groups/${group.id}`} className="block">
                  <motion.div
                    whileHover={{ y: -2, boxShadow: "0 12px 32px rgba(0,0,0,0.1)" }}
                    whileTap={{ scale: 0.99 }}
                    className="group flex items-center gap-4 p-4 rounded-3xl cursor-pointer relative overflow-hidden"
                    style={{ background: "var(--card)", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
                  >
                    {/* Amber left accent on hover */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      style={{ background: `linear-gradient(180deg, ${AMBER}, ${AMBER_DARK})` }}
                    />

                    {/* Group avatar */}
                    {group.imageUrl ? (
                      <img
                        src={group.imageUrl}
                        alt={group.name}
                        className="h-14 w-14 rounded-2xl object-cover shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="h-14 w-14 rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0 shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${AMBER_BG} 0%, #FFF3CD 100%)`,
                          color: AMBER_DARK,
                        }}
                      >
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Group info */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-bold truncate transition-colors"
                        style={{ fontSize: "15px", color: "var(--foreground)" }}
                      >
                        {group.name}
                      </h3>
                      <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        {group.members?.length || 0} members · {group.type || "Friends"}
                      </p>
                      <MemberAvatars members={group.members || []} />
                    </div>

                    {/* Chevron */}
                    <motion.div
                      className="shrink-0"
                      whileHover={{ x: 3 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <ChevronRight
                        className="h-5 w-5 transition-colors"
                        style={{ color: "#D0C8B0" }}
                      />
                    </motion.div>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
