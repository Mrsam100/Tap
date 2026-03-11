import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Tag, Search as SearchIcon, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const BlogIndex: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const activeTag = searchParams.get('tag') || 'All';

  const posts = [
      { date: "Oct 24, 2023", title: "How AI is Revolutionizing Landing Pages in San Francisco", slug: "ai-revolution-sf", excerpt: "Exploring the impact of AI on the tech scene in SF and how local founders are leveraging Tap.", tags: ["AI", "Startup", "GEO"] },
      { date: "Oct 20, 2023", title: "10 SEO Tips for Modern Creators in 2024", slug: "seo-tips-2024", excerpt: "Mastering search engine optimization in the age of AI and answer engines.", tags: ["SEO", "AEO", "Growth"] },
      { date: "Oct 15, 2023", title: "The Rise of Answer Engine Optimization (AEO)", slug: "rise-of-aeo", excerpt: "Why optimizing for AI answers is the next big thing in digital marketing.", tags: ["AEO", "Marketing", "Strategy"] },
      { date: "Oct 12, 2023", title: "The death of the landing page", slug: "death-of-landing-page", excerpt: "Why traditional landing pages are failing and what's replacing them.", tags: ["Design", "Strategy"] },
      { date: "Oct 08, 2023", title: "Why builders need better tools", slug: "builders-need-tools", excerpt: "The current stack is too complex. It's time for simplification.", tags: ["Product", "Engineering"] },
      { date: "Sep 24, 2023", title: "Introducing Tap 2.0", slug: "tap-2-0", excerpt: "A new way to build your business presence online.", tags: ["Update", "AI"] },
      { date: "Sep 10, 2023", title: "The aesthetics of conversion", slug: "aesthetics-of-conversion", excerpt: "How design directly impacts your bottom line.", tags: ["Design", "Marketing"] },
      { date: "Aug 28, 2023", title: "Building in public", slug: "building-in-public", excerpt: "Lessons learned from growing our userbase to 10k.", tags: ["Growth", "Startup"] },
      { date: "Aug 15, 2023", title: "Local SEO for Small Businesses in Dubai", slug: "local-seo-dubai", excerpt: "A guide to dominating local search in the UAE market.", tags: ["SEO", "GEO", "Business"] },
      { date: "Aug 05, 2023", title: "The Future of Web Design is Generative", slug: "future-web-design", excerpt: "How generative AI is changing the way we think about user interfaces.", tags: ["Design", "AI", "Future"] },
  ];

  const allTags = useMemo(() => {
    const tags = new Set<string>(['All']);
    posts.forEach(post => post.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = activeTag === 'All' || post.tags.includes(activeTag);
      return matchesSearch && matchesTag;
    });
  }, [posts, searchQuery, activeTag]);

  const handleTagClick = (tag: string) => {
    if (tag === 'All') {
      searchParams.delete('tag');
    } else {
      searchParams.set('tag', tag);
    }
    setSearchParams(searchParams);
  };

  const clearSearch = () => {
    searchParams.delete('search');
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen pt-24 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6 bg-cream dark:bg-black">
      <Helmet>
        <title>Blog — Tap Insights & Updates</title>
        <meta name="description" content="Read the latest thoughts on design, conversion, and building in public from the team behind Tap." />
      </Helmet>
      <div className="max-w-3xl mx-auto animate-fade-up">
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-serif text-ink mb-8">The Blog</h1>
        <p className="text-xl text-slate-500 font-light mb-12 max-w-xl">
            Thoughts, updates, and insights from the team behind Tap.
        </p>

        {/* Search Status */}
        {searchQuery && (
          <div className="flex items-center gap-2 mb-8 p-4 bg-slate-100 rounded-xl animate-scale-in">
            <SearchIcon size={18} className="text-slate-400" />
            <span className="text-slate-600">Showing results for "<span className="font-medium text-ink">{searchQuery}</span>"</span>
            <button onClick={clearSearch} className="ml-auto p-1 hover:bg-slate-200 rounded-full transition-colors">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Tags Filter */}
        <div className="flex flex-wrap gap-2 mb-16">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTag === tag 
                  ? 'bg-ink text-white shadow-lg' 
                  : 'bg-white border border-slate-200 text-slate-500 hover:border-ink hover:text-ink'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        
        <div className="space-y-12">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post, i) => (
                  <Link key={i} to={`/blog/${post.slug}`} className="group block border-b border-slate-200 pb-12 hover:border-ink transition-colors">
                      <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-4">
                          <h2 className="text-3xl font-serif text-ink group-hover:text-jam-red transition-colors mb-2 md:mb-0">
                              {post.title}
                          </h2>
                          <span className="text-sm font-mono text-slate-400 shrink-0 md:ml-4">{post.date}</span>
                      </div>
                      <p className="text-slate-600 font-light text-lg leading-relaxed mb-4">
                          {post.excerpt}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {post.tags.map(tag => (
                          <span key={tag} className="flex items-center gap-1 text-xs font-medium text-slate-400">
                            <Tag size={10} />
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center text-sm font-medium text-ink group-hover:translate-x-2 transition-transform duration-300">
                          Read more <ArrowRight size={16} className="ml-2" />
                      </div>
                  </Link>
              ))
            ) : (
              <div className="text-center py-20">
                <p className="text-slate-400 italic">No posts found matching your criteria.</p>
                <button 
                  onClick={() => setSearchParams({})}
                  className="mt-4 text-ink font-medium hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default BlogIndex;