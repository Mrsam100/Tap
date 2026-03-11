import React, { useState } from 'react';
import { Globe, Copy, Check, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { useBuilderStore } from '../hooks/useBuilderStore';
import { useAuthStore } from '../../../stores/authStore';
import { toast } from '../../../stores/toastStore';

const PublishBar: React.FC = () => {
  const { profileId, isPublished, publishToggle } = useBuilderStore();
  const user = useAuthStore((s) => s.user);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profileId) return null;

  const profileUrl = `${window.location.origin}/${user?.username || ''}`;

  const handlePublish = async () => {
    setIsPublishing(true);
    setError(null);
    try {
      await publishToggle();
    } catch (err: any) {
      setError(err.message || 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = profileUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
      <div className="flex items-center gap-3">
        {/* Publish Toggle */}
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            isPublished
              ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
              : 'bg-jam-red text-white hover:bg-jam-red/90 shadow-sm'
          } ${isPublishing ? 'opacity-60 cursor-wait' : ''}`}
        >
          {isPublishing ? (
            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isPublished ? (
            <Eye size={14} />
          ) : (
            <EyeOff size={14} />
          )}
          {isPublished ? 'Published' : 'Publish'}
        </button>

        {error && (
          <span className="text-xs text-red-500">{error}</span>
        )}
      </div>

      {/* Profile URL + Actions */}
      {isPublished && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
            <Globe size={12} className="text-slate-400" />
            <span
              className="text-xs text-slate-600 dark:text-slate-300 font-mono max-w-[120px] sm:max-w-[200px] truncate"
              title={profileUrl.replace(/^https?:\/\//, '')}
            >
              {profileUrl.replace(/^https?:\/\//, '')}
            </span>
          </div>

          <button
            onClick={handleCopyLink}
            className="p-1.5 text-slate-400 hover:text-ink dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Copy link"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>

          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate-400 hover:text-ink dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="View live page"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      )}
    </div>
  );
};

export default PublishBar;
