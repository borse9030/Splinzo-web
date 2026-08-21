"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { blogs } from "@/data/blogs";

const AMBER = "#F9B912";

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-20 px-5" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 shadow-sm"
                style={{ background: "#FFF8E1", color: "#F9A000" }}>
            <BookOpen size={16} />
            Resources & Guides
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 mb-6">
            The <span style={{ color: AMBER }}>Splinzo</span> Blog
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Everything you need to know about managing group finances, splitting bills without the drama, and planning seamless trips with friends.
          </p>
        </motion.div>

        {/* Blog Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog, i) => (
            <motion.div
              key={blog.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link href={`/blog/${blog.slug}`} className="group block h-full">
                <article className="bg-white rounded-3xl p-6 h-full flex flex-col border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{ background: "#FFF8E1", color: "#F9A825" }}>
                      {blog.category}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                      <Clock size={12} />
                      {blog.readTime}
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-amber-500 transition-colors leading-snug">
                    {blog.title}
                  </h2>
                  
                  <p className="text-sm text-gray-500 mb-6 flex-1 line-clamp-3 leading-relaxed">
                    {blog.summary}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                    <div className="text-xs font-semibold text-gray-400">{blog.date}</div>
                    <div className="flex items-center gap-1 text-sm font-bold transition-transform group-hover:translate-x-1"
                         style={{ color: AMBER }}>
                      Read more <ArrowRight size={16} />
                    </div>
                  </div>
                </article>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
