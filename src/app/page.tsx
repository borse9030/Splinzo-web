"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Users, Map } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full z-10">
        <div className="flex items-center gap-2.5">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shadow-md"
            style={{ background: "linear-gradient(135deg, #FFC107, #F9B912)" }}
          >
            <span className="text-gray-900 font-extrabold text-lg">S</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">Splinzo</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            Log in
          </Link>
          <Button
            asChild
            className="rounded-full px-6 h-10 font-semibold text-sm shadow-md"
            style={{ background: "#F9B912", color: "#1a1a1a" }}
          >
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative pt-16 pb-32">
        {/* Background amber blob */}
        <div
          className="absolute top-0 inset-x-0 h-[560px] -z-10"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% -10%, #FFF3CD 0%, #FFF8E1 40%, transparent 100%)",
          }}
        />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl -z-10 opacity-40"
          style={{ background: "#FFC107" }}
        />

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            {/* Pill badge */}
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-8"
              style={{ background: "#FFF3CD", color: "#B8860B" }}
            >
              <span
                className="h-2 w-2 rounded-full animate-pulse"
                style={{ background: "#F9B912" }}
              />
              Now available on Web
            </span>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 leading-[1.1]">
              Split expenses.
              <br />
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(90deg, #F9A825, #FF8F00)",
                }}
              >
                Stay even.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto mb-10 font-medium leading-relaxed">
              Splinzo is the smartest way to share expenses with friends,
              roommates, and groups. Keep track of who owes who and settle up
              effortlessly.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                asChild
                size="lg"
                className="rounded-full h-14 px-10 text-lg font-bold w-full sm:w-auto transition-transform hover:scale-105 shadow-xl"
                style={{ background: "#F9B912", color: "#1a1a1a" }}
              >
                <Link href="/signup">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto"
          >
            {/* Card 1 */}
            <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "#FFF8E1" }}
              >
                <Zap className="h-6 w-6" style={{ color: "#F9A825" }} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Smart Math</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Our algorithm minimizes total transactions so you can settle up faster.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "#FFF8E1" }}
              >
                <Users className="h-6 w-6" style={{ color: "#F9A825" }} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Real-time Sync</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Add an expense on the web, see it instantly on your mobile app.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: "#FFF8E1" }}
              >
                <Map className="h-6 w-6" style={{ color: "#F9A825" }} />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">Trips &amp; Chat</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Keep the context of your expenses clear with built-in chat and trip planning.
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
