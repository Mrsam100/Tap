import React, { useState } from 'react';
import type { SiteData, ThemeConfig } from '@tap/shared';
import { SOCIAL_PLATFORMS } from '../../constants';

interface ProfileHeaderProps {
  siteData: SiteData;
  theme: ThemeConfig;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ siteData, theme }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="px-6 text-center mb-8 animate-fade-up">
      <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl font-serif italic shadow-sm transition-colors duration-300 overflow-hidden ${theme.colors.avatarBg} ${theme.colors.avatarText}`}>
        {siteData.avatarImage && !imgError ? (
          <>
            {!imgLoaded && (
              <div className="w-full h-full animate-pulse bg-slate-200 rounded-full" />
            )}
            <img
              src={siteData.avatarImage}
              alt="Avatar"
              className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0 absolute'}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          </>
        ) : (
          siteData.avatarInitials
        )}
      </div>
      <h2 className="text-xl font-bold font-serif mb-2">{siteData.name || 'Your Project Name'}</h2>
      <p className="text-sm font-light leading-relaxed max-w-md mx-auto opacity-80">
        {siteData.bio || 'Your bio goes here...'}
      </p>

      {/* Social Icons */}
      {siteData.socials.length > 0 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          {siteData.socials.map(social => {
            const platform = SOCIAL_PLATFORMS.find(p => p.id === social.platform);
            if (!platform) return null;
            return (
              <a key={social.id} href={social.url || '#'} target={social.url ? '_blank' : undefined} rel="noopener noreferrer" className={`hover:opacity-70 transition-opacity ${theme.colors.text}`}>
                <platform.icon size={20} />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfileHeader;
