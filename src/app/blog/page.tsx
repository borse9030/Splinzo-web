"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  BookOpen, 
  Clock, 
  Search, 
  X, 
  Calendar, 
  Sparkles, 
  Smartphone 
} from "lucide-react";
import { blogs, BlogPost } from "@/data/blogs";
import { InFeedAd } from "@/components/ads/InFeedAd";

const AMBER = "#F9B912";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.splinzo.splinzo&pcampaignid=web_share";

// Extract all unique categories dynamically
const ALL_CATEGORIES = ["All", ...Array.from(new Set(blogs.map((b) => b.category)))];

export default function BlogIndexPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Filter blogs based on selected category and search input
  const filteredBlogs = useMemo(() => {
    return blogs.filter((blog) => {
      const matchesCategory =
        selectedCategory === "All" || blog.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        searchQuery.trim() === "" ||
        blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        blog.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Highlight featured blog when in default view
  const isDefaultView = selectedCategory === "All" && searchQuery.trim() === "";
  const featuredBlog = isDefaultView ? blogs[0] : null;
  const gridBlogs = isDefaultView ? filteredBlogs.slice(1) : filteredBlogs;

  return (
    <div className="min-h-screen bg-gray-50/70 text-gray-900 flex flex-col w-full max-w-full overflow-x-clip">
      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image 
              src="/logo.png" 
              alt="Splinzo" 
              width={34} 
              height={34} 
              className="rounded-xl shadow-xs group-hover:scale-105 transition-transform" 
            />
            <span className="text-xl font-black text-gray-900 tracking-tight">Splinzo</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              href="/" 
              className="text-xs sm:text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              ← <span className="hidden sm:inline">Back to</span> Home
            </Link>
            <Link 
              href="/dashboard" 
              className="px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shadow-xs hover:shadow-md hover:scale-105"
              style={{ background: AMBER, color: "#111827" }}
            >
              Open App
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero / Header ─────────────────────────────────────────────── */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 md:pt-16 pb-8 sm:pb-12 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span 
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-4 sm:mb-6 shadow-xs"
            style={{ background: "#FFF8E1", color: "#F9A000" }}
          >
            <BookOpen size={15} />
            Resources & Guides
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 mb-4 sm:mb-6">
            The <span style={{ color: AMBER }}>Splinzo</span> Blog
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed px-2">
            Everything you need to know about managing group finances, splitting bills without the drama, and planning seamless trips with friends.
          </p>
        </motion.div>
      </div>

      {/* ── Search & Filter Controls (Mobile-Optimized) ────────────────── */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 mb-8 sm:mb-10">
        <div className="flex flex-col gap-4 sm:gap-5">
          {/* Search Bar */}
          <div className="relative w-full max-w-xl mx-auto">
            <Search 
              size={18} 
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles, topics, keywords..."
              className="w-full pl-11 pr-10 py-3 bg-white rounded-2xl border border-gray-200 text-sm font-medium text-gray-900 placeholder:text-gray-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Horizontal Scrollable Category Pills */}
          <div className="w-full overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex items-center gap-2 justify-start sm:justify-center min-w-max pb-1">
              {ALL_CATEGORIES.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? "shadow-sm scale-102"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80"
                    }`}
                    style={
                      isActive
                        ? { background: AMBER, color: "#111827" }
                        : {}
                    }
                  >
                    {category}
                    {category === "All" && (
                      <span className="ml-1.5 text-[11px] opacity-75 font-semibold">
                        ({blogs.length})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Count indicator */}
        {(selectedCategory !== "All" || searchQuery.trim() !== "") && (
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mt-4 px-1">
            <span>
              Showing {filteredBlogs.length} {filteredBlogs.length === 1 ? "article" : "articles"}
              {selectedCategory !== "All" && <span> in <strong>{selectedCategory}</strong></span>}
              {searchQuery && <span> for &ldquo;<strong>{searchQuery}</strong>&rdquo;</span>}
            </span>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="text-amber-600 hover:underline cursor-pointer"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* ── Main Content Area ──────────────────────────────────────────── */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 flex-1 pb-16">
        {/* Featured Article Spotlight (Default View) */}
        {featuredBlog && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 sm:mb-10 w-full min-w-0 max-w-full"
          >
            <Link href={`/blog/${featuredBlog.slug}`} className="group block w-full">
              <article className="bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm hover:shadow-xl hover:border-amber-300 transition-all duration-300 w-full min-w-0 max-w-full overflow-hidden">
                <div className="flex flex-wrap items-center gap-2.5 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-xs"
                        style={{ background: AMBER, color: "#111827" }}>
                    <Sparkles size={13} />
                    Featured Guide
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background: "#FFF8E1", color: "#F9A825" }}>
                    {featuredBlog.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-gray-400 ml-auto">
                    <Clock size={12} />
                    {featuredBlog.readTime}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 mb-3 group-hover:text-amber-600 transition-colors leading-tight break-words">
                  {featuredBlog.title}
                </h2>

                <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed line-clamp-3 sm:line-clamp-4 break-words">
                  {featuredBlog.summary}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-amber-100 mt-auto">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                    <Calendar size={13} className="text-amber-500" />
                    {featuredBlog.date} • {featuredBlog.author}
                  </div>
                  <div 
                    className="flex items-center gap-1.5 text-sm font-bold transition-transform group-hover:translate-x-1"
                    style={{ color: "#D97706" }}
                  >
                    Read full guide <ArrowRight size={16} />
                  </div>
                </div>
              </article>
            </Link>
          </motion.div>
        )}

        {/* Empty State */}
        {filteredBlogs.length === 0 && (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-gray-100 shadow-xs max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <Search size={26} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No articles found</h3>
            <p className="text-sm text-gray-500 mb-6">
              We couldn&apos;t find anything matching &ldquo;{searchQuery}&rdquo;. Try another term or browse all articles.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="px-5 py-2.5 rounded-full text-xs font-bold transition-transform hover:scale-105 shadow-xs cursor-pointer"
              style={{ background: AMBER, color: "#111827" }}
            >
              Show all articles
            </button>
          </div>
        )}

        {/* Blog Grid */}
        {gridBlogs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8 w-full max-w-full min-w-0">
            {gridBlogs.map((blog, i) => (
              <Fragment key={blog.slug}>
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
                  className="w-full min-w-0 max-w-full flex"
                >
                  <Link href={`/blog/${blog.slug}`} className="group block w-full h-full">
                    <article className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 h-full flex flex-col border border-gray-100 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-amber-200 transition-all duration-300 w-full min-w-0 max-w-full overflow-hidden">
                      <div className="flex items-center gap-2.5 mb-3.5">
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{ background: "#FFF8E1", color: "#F9A825" }}
                        >
                          {blog.category}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-medium text-gray-400 ml-auto">
                          <Clock size={12} />
                          {blog.readTime}
                        </span>
                      </div>
                      
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2.5 group-hover:text-amber-500 transition-colors leading-snug break-words">
                        {blog.title}
                      </h2>
                      
                      <p className="text-sm text-gray-500 mb-5 flex-1 line-clamp-3 leading-relaxed break-words">
                        {blog.summary}
                      </p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto w-full">
                        <div className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                          <Calendar size={12} />
                          {blog.date}
                        </div>
                        <div 
                          className="flex items-center gap-1 text-xs sm:text-sm font-bold transition-transform group-hover:translate-x-1 shrink-0 ml-2"
                          style={{ color: AMBER }}
                        >
                          Read more <ArrowRight size={15} />
                        </div>
                      </div>
                    </article>
                  </Link>
                </motion.div>

                {/* In-feed ad after the 2nd card on 'All' view */}
                {isDefaultView && i === 1 && (
                  <motion.div
                    key="infeed-ad"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="w-full min-w-0 max-w-full col-span-1 flex"
                  >
                    <InFeedAd className="h-full w-full" />
                  </motion.div>
                )}
              </Fragment>
            ))}
          </div>
        )}

        {/* ── CTA Banner ────────────────────────────────────────────────── */}
        <div className="mt-14 sm:mt-18 bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm text-center max-w-3xl mx-auto w-full min-w-0 max-w-full overflow-hidden">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <Smartphone size={24} />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2.5">
            Ready to stop splitting headaches?
          </h3>
          <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto mb-6 leading-relaxed">
            Join thousands of roommates and travel buddies sharing expenses the smart, automated way.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-xs sm:text-sm text-gray-900 transition-all hover:scale-105 shadow-md shadow-amber-500/20"
              style={{ background: AMBER }}
            >
              Get Splinzo on Android
            </a>
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-full font-bold text-xs sm:text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
            >
              Open Web App
            </Link>
          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200/60 bg-white py-8 px-4 sm:px-6 w-full max-w-full overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Splinzo" width={22} height={22} className="rounded-md" />
            <span>&copy; {new Date().getFullYear()} Splinzo. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
            <Link href="/about" className="hover:text-gray-700 transition-colors">About Us</Link>
            <Link href="/blog" className="text-amber-500 font-bold transition-colors">Blog</Link>
            <Link href="/privacy-policy" className="hover:text-gray-700 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-gray-700 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
