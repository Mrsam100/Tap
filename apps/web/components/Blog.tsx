import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Blog: React.FC = () => {
    const posts = [
        { date: "Oct 12", title: "The death of the landing page", slug: "death-of-landing-page" },
        { date: "Oct 08", title: "Why builders need better tools", slug: "builders-need-tools" },
        { date: "Sep 24", title: "Introducing Tap 2.0", slug: "tap-2-0" },
    ];

  return (
    <section className="py-20 sm:py-32 px-4 sm:px-6 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-serif text-ink dark:text-white">Latest</h2>
                <Link to="/blog" className="flex items-center gap-2 text-sm font-medium text-ink dark:text-white hover:text-jam-red transition-colors">
                    See all posts <ArrowRight size={16} />
                </Link>
            </div>

            <div className="space-y-4">
                {posts.map((post, i) => (
                    <Link key={i} to={`/blog/${post.slug}`} className="group flex flex-col sm:flex-row sm:items-baseline justify-between py-4 sm:py-6 border-b border-slate-200 dark:border-slate-800 hover:border-ink dark:hover:border-white transition-colors gap-1 sm:gap-4">
                        <h3 className="text-lg sm:text-xl font-serif text-ink dark:text-white group-hover:text-jam-red transition-colors">
                            {post.title}
                        </h3>
                        <span className="text-sm font-mono text-slate-400 dark:text-slate-500 shrink-0 ml-4">{post.date}</span>
                    </Link>
                ))}
            </div>
        </div>
    </section>
  );
};

export default Blog;
