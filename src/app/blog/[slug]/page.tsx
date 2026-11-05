import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Clock, User, Calendar, ArrowRight } from "lucide-react";
import { blogs } from "@/data/blogs";
import { ArticleAd } from "@/components/ads/ArticleAd";
import { BlogArticleSchema, BreadcrumbSchema } from "@/components/seo/JsonLd";

const AMBER = "#F9B912";

type Props = {
  params: Promise<{ slug: string }>;
};

// Generate static routes at build time
export async function generateStaticParams() {
  return blogs.map((blog) => ({
    slug: blog.slug,
  }));
}

// Generate dynamic SEO metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const blog = blogs.find((b) => b.slug === slug);
  
  if (!blog) return { title: "Not Found" };

  return {
    title: `${blog.title} | Splinzo Blog`,
    description: blog.summary,
    alternates: {
      canonical: `/blog/${blog.slug}`,
    },
    openGraph: {
      title: blog.title,
      description: blog.summary,
      url: `/blog/${blog.slug}`,
      type: "article",
      publishedTime: new Date(blog.date).toISOString(),
      authors: [blog.author],
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.summary,
      images: ["/opengraph-image.png"],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const blog = blogs.find((b) => b.slug === slug);

  if (!blog) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col w-full max-w-full overflow-x-clip">
      <BlogArticleSchema
        title={blog.title}
        summary={blog.summary}
        date={blog.date}
        author={blog.author}
        slug={blog.slug}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
          { name: blog.title, url: `/blog/${blog.slug}` },
        ]}
      />

      {/* ── Top Header Navigation ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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
              href="/blog" 
              className="text-xs sm:text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Back to Blog
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

      {/* ── Main Article ─────────────────────────────────────────────────── */}
      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-14 flex-1">
        <article className="w-full min-w-0 max-w-full">
          <header className="mb-8 sm:mb-12">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 mb-4 sm:mb-6">
              <span className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: "#FFF8E1", color: "#F9A825" }}>
                {blog.category}
              </span>
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-medium text-gray-500">
                <span className="flex items-center gap-1.5"><Clock size={13} /> {blog.readTime}</span>
                <span className="flex items-center gap-1.5"><User size={13} /> {blog.author}</span>
                <span className="flex items-center gap-1.5"><Calendar size={13} /> {blog.date}</span>
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 leading-[1.15] mb-4 sm:mb-6 break-words">
              {blog.title}
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed font-medium break-words">
              {blog.summary}
            </p>
          </header>

          {/* Prose Content */}
          <div 
            className="prose prose-base sm:prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-amber-500 hover:prose-a:text-amber-600 prose-img:rounded-3xl prose-img:shadow-xl prose-hr:border-gray-100 break-words overflow-hidden"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* In-article ad after content */}
          <ArticleAd />
          
          <hr className="my-10 sm:my-14 border-gray-100" />
          
          <div className="bg-gray-50 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center border border-gray-100 shadow-xs">
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-2.5">
              Ready to stop splitting headaches?
            </h3>
            <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto mb-6">
              Join thousands of users sharing expenses the smart, automated way.
            </p>
            <Link 
              href="/signup" 
              className="inline-flex items-center justify-center h-12 px-8 rounded-full font-bold text-sm text-gray-900 transition-transform hover:-translate-y-0.5 shadow-lg shadow-amber-500/20"
              style={{ background: AMBER }}
            >
              Get Started Free <ArrowRight size={16} className="ml-2" />
            </Link>
          </div>
        </article>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200/60 bg-white py-8 px-4 sm:px-6 w-full max-w-full overflow-hidden">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Splinzo" width={20} height={20} className="rounded-md" />
            <span>&copy; {new Date().getFullYear()} Splinzo. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
            <Link href="/about" className="hover:text-gray-700 transition-colors">About Us</Link>
            <Link href="/blog" className="hover:text-gray-700 transition-colors">Blog</Link>
            <Link href="/privacy-policy" className="hover:text-gray-700 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-gray-700 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
