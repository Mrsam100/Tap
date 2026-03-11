import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Tag } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const BlogPost: React.FC = () => {
  const { slug } = useParams();
  
  // Mock data mapping
  const posts: Record<string, { title: string, tags: string[], description: string, content?: React.ReactNode }> = {
      'ai-revolution-sf': {
        title: 'How AI is Revolutionizing Landing Pages in San Francisco',
        tags: ['AI', 'Startup', 'GEO'],
        description: 'Exploring the impact of AI on the tech scene in SF and how local founders are leveraging Tap.',
        content: (
          <>
            <p className="mb-6 first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:text-ink dark:first-letter:text-white">
              San Francisco has always been the epicenter of technological shifts, and the current AI boom is no exception. 
              As founders in the Bay Area race to build the next generation of intelligent applications, the need for rapid, 
              high-quality web presence has never been greater.
            </p>
            <p className="mb-6">
              Traditional web development cycles—often spanning weeks or months—are becoming a bottleneck for agile startups. 
              This is where AI-powered builders like Tap are stepping in, allowing local entrepreneurs to launch professional 
              landing pages in minutes rather than days.
            </p>
            <h2 className="text-2xl font-bold text-ink dark:text-white mt-12 mb-6 font-sans">The Speed of the Bay</h2>
            <p className="mb-6">
              In the competitive landscape of SOMA and Palo Alto, speed is a feature. A founder can now iterate on their 
              value proposition, generate a new landing page with Tap, and begin A/B testing before their morning coffee 
              at Blue Bottle is even cold.
            </p>
            <blockquote className="border-l-4 border-jam-red pl-6 italic text-xl text-ink dark:text-white my-10">
              "Tap has reduced our time-to-market for new feature landing pages by over 90%." — SF Tech Founder
            </blockquote>
          </>
        )
      },
      'seo-tips-2024': {
        title: '10 SEO Tips for Modern Creators in 2024',
        tags: ['SEO', 'AEO', 'Growth'],
        description: 'Mastering search engine optimization in the age of AI and answer engines.',
        content: (
          <>
            <p className="mb-6 first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:text-ink dark:first-letter:text-white">
              The SEO landscape is shifting beneath our feet. As Google integrates SGE (Search Generative Experience) and 
              AI-driven answer engines become more prevalent, traditional keyword stuffing is officially dead.
            </p>
            <p className="mb-6">
              To thrive in 2024, creators must focus on E-E-A-T (Experience, Expertise, Authoritativeness, and Trustworthiness) 
              while also optimizing for how AI models process and summarize information.
            </p>
            <h2 className="text-2xl font-bold text-ink dark:text-white mt-12 mb-6 font-sans">The New Rules</h2>
            <ul className="list-disc pl-6 space-y-4 mb-8">
              <li>Focus on user intent over exact-match keywords.</li>
              <li>Implement robust structured data (JSON-LD) for every page.</li>
              <li>Optimize for conversational queries and long-tail questions.</li>
              <li>Prioritize page speed and mobile responsiveness (Core Web Vitals).</li>
            </ul>
          </>
        )
      },
      'rise-of-aeo': {
        title: 'The Rise of Answer Engine Optimization (AEO)',
        tags: ['AEO', 'Marketing', 'Strategy'],
        description: 'Why optimizing for AI answers is the next big thing in digital marketing.',
        content: (
          <>
            <p className="mb-6 first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:text-ink dark:first-letter:text-white">
              Search is evolving into "Answer Engines." Platforms like Perplexity, ChatGPT, and Google SGE are changing 
              how users find information. Instead of a list of links, users are looking for direct, synthesized answers.
            </p>
            <p className="mb-6">
              Answer Engine Optimization (AEO) is the practice of structuring your content so that these AI models can 
              easily extract, understand, and cite your information as the authoritative source.
            </p>
            <h2 className="text-2xl font-bold text-ink dark:text-white mt-12 mb-6 font-sans">AEO Strategies</h2>
            <p className="mb-6">
              Successful AEO requires a shift toward structured, factual, and highly relevant content. Use clear headings, 
              bulleted lists, and FAQ formats to make your data "digestible" for large language models.
            </p>
          </>
        )
      },
      'death-of-landing-page': { 
        title: 'The death of the landing page', 
        tags: ['Design', 'Strategy'],
        description: 'Why traditional landing pages are failing and what\'s replacing them.'
      },
      'builders-need-tools': { 
        title: 'Why builders need better tools', 
        tags: ['Product', 'Engineering'],
        description: 'The current stack is too complex. It\'s time for simplification.'
      },
      'tap-2-0': { 
        title: 'Introducing Tap 2.0', 
        tags: ['Update', 'AI'],
        description: 'A new way to build your business presence online.'
      },
      'aesthetics-of-conversion': { 
        title: 'The aesthetics of conversion', 
        tags: ['Design', 'Marketing'],
        description: 'How design directly impacts your bottom line.'
      },
      'building-in-public': { 
        title: 'Building in public', 
        tags: ['Growth', 'Startup'],
        description: 'Lessons learned from growing our userbase to 10k.'
      },
      'local-seo-dubai': {
        title: 'Local SEO for Small Businesses in Dubai',
        tags: ['SEO', 'GEO', 'Business'],
        description: 'A guide to dominating local search in the UAE market.',
        content: (
          <>
            <p className="mb-6 first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:text-ink dark:first-letter:text-white">
              Dubai is a unique market with a highly mobile, international population. For small businesses in the UAE, 
              local SEO isn't just an option—it's the primary driver of foot traffic and digital leads.
            </p>
            <p className="mb-6">
              From optimizing your Google Business Profile to ensuring your address is correctly formatted for local 
              directories, every detail counts in the competitive landscape of the Emirates.
            </p>
          </>
        )
      },
      'future-web-design': {
        title: 'The Future of Web Design is Generative',
        tags: ['Design', 'AI', 'Future'],
        description: 'How generative AI is changing the way we think about user interfaces.',
        content: (
          <>
            <p className="mb-6 first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:text-ink dark:first-letter:text-white">
              We are moving away from static templates toward dynamic, generative interfaces. Imagine a website that 
              reconfigures its layout, color scheme, and copy in real-time based on the specific user's preferences and intent.
            </p>
            <p className="mb-6">
              At Tap, we are building toward this future, where the "builder" is just the starting point for a 
              continuously evolving digital presence.
            </p>
          </>
        )
      }
  };

  const post = slug ? posts[slug] : null;

  if (!post) {
      return (
        <div className="min-h-screen pt-24 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6 bg-cream dark:bg-black flex flex-col items-center justify-center text-center">
             <h1 className="text-4xl font-serif text-ink dark:text-white mb-4">Post Not Found</h1>
             <p className="text-slate-500 mb-8">The article you are looking for does not exist.</p>
             <Link to="/blog" className="text-ink dark:text-white hover:text-jam-red underline decoration-1 underline-offset-4">
                Return to Blog
             </Link>
        </div>
      );
  }

  return (
    <div className="min-h-screen pt-24 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6 bg-cream dark:bg-black">
      <Helmet>
        <title>{post.title} — Tap Blog</title>
        <meta name="description" content={post.description} />
        <meta property="og:title" content={post.title} />
        <meta property="og:type" content="article" />
      </Helmet>
      <div className="max-w-3xl mx-auto animate-fade-up">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-ink dark:hover:text-white mb-8 transition-colors">
            <ArrowLeft size={16} /> Back to Blog
        </Link>

        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map(tag => (
            <Link 
              key={tag} 
              to={`/blog?tag=${tag}`}
              className="flex items-center gap-1 text-xs font-medium text-jam-red hover:underline"
            >
              <Tag size={10} />
              {tag}
            </Link>
          ))}
        </div>

        <h1 className="text-4xl md:text-6xl font-serif text-ink dark:text-white mb-6 leading-tight">{post.title}</h1>
        
        <div className="flex items-center gap-4 mb-12 border-b border-slate-200 dark:border-slate-800 pb-8">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
              <Tag size={20} />
            </div>
            <div>
                <div className="text-sm font-bold text-ink dark:text-white">Tap Editorial</div>
                <div className="text-xs text-slate-500">5 min read</div>
            </div>
        </div>

        <div className="prose prose-lg prose-slate font-serif text-slate-600 dark:text-slate-400 leading-loose">
            {post.content ? post.content : (
              <>
                <p className="mb-6 first-letter:text-5xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:text-ink dark:first-letter:text-white">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <p className="mb-6">
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
                    Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
                <h2 className="text-2xl font-bold text-ink dark:text-white mt-12 mb-6 font-sans">The Shift</h2>
                <p className="mb-6">
                    Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, 
                    eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                </p>
                <blockquote className="border-l-4 border-jam-red pl-6 italic text-xl text-ink dark:text-white my-10">
                    "Design is not just what it looks like and feels like. Design is how it works."
                </blockquote>
                <p className="mb-6">
                    Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores 
                    eos qui ratione voluptatem sequi nesciunt.
                </p>
              </>
            )}
        </div>
      </div>
    </div>
  );
};

export default BlogPost;