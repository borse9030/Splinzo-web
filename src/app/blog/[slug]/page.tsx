import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, User } from "lucide-react";
import { blogs } from "@/data/blogs";

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
      type: "article",
      publishedTime: new Date(blog.date).toISOString(),
      authors: [blog.author],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.summary,
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
    <div className="min-h-screen bg-white pt-28 pb-20 px-5" style={{ fontFamily: "'Outfit', sans-serif" }}>
      <article className="max-w-3xl mx-auto">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors mb-10">
          <ArrowLeft size={16} />
          Back to Blog
        </Link>
        
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: "#FFF8E1", color: "#F9A825" }}>
              {blog.category}
            </span>
            <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
              <span className="flex items-center gap-1.5"><Clock size={14} /> {blog.readTime}</span>
              <span className="flex items-center gap-1.5"><User size={14} /> {blog.author}</span>
              <span>{blog.date}</span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 leading-[1.1] mb-6">
            {blog.title}
          </h1>
          
          <p className="text-xl text-gray-500 leading-relaxed font-medium">
            {blog.summary}
          </p>
        </header>

        {/* Prose Content */}
        <div 
          className="prose prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-amber-500 hover:prose-a:text-amber-600 prose-img:rounded-3xl prose-img:shadow-xl prose-hr:border-gray-100"
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />
        
        <hr className="my-16 border-gray-100" />
        
        <div className="bg-gray-50 rounded-3xl p-8 text-center">
          <h3 className="text-2xl font-black text-gray-900 mb-3">Ready to stop splitting headaches?</h3>
          <p className="text-gray-500 mb-6">Join thousands of users sharing expenses the smart way.</p>
          <Link href="/signup" className="inline-flex items-center justify-center h-12 px-8 rounded-full font-bold text-gray-900 transition-transform hover:-translate-y-0.5 shadow-lg shadow-amber-500/20"
                style={{ background: AMBER }}>
            Get Started Free
          </Link>
        </div>
      </article>
    </div>
  );
}
