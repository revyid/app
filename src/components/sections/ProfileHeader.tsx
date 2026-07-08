import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, Heart, MapPin, Briefcase } from 'lucide-react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { SPRING_BOUNCY } from '@/lib/motion-presets';

export function ProfileHeader() {
  const { data } = usePortfolio();
  const profileData = data.profile;
  const easterEgg = profileData.easter_egg;
  const [isNawaMode, setIsNawaMode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'l') {
        setIsNawaMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="space-y-3">
      {/* Avatar row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 overflow-hidden bg-surface-variant ring-2 ring-outline/20 rounded-2xl">
            <img
              src={profileData.image}
              alt={profileData.name}
              className="w-full h-full object-cover"
              fetchPriority="high"
              decoding="async"
            />
          </div>
          <AnimatePresence>
            {isNawaMode && easterEgg && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={SPRING_BOUNCY}
                className="absolute -right-2 -bottom-2 w-7 h-7 overflow-hidden bg-surface-variant ring-2 ring-tertiary/40 rounded-xl"
              >
                <img
                  src={easterEgg.image}
                  alt={easterEgg.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Name & badge */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-title-sm font-bold text-foreground truncate">
              {isNawaMode && easterEgg ? easterEgg.name : profileData.name}
            </span>
            <AnimatePresence mode="popLayout" initial={false}>
              {!isNawaMode ? (
                <motion.div
                  key="badge"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.25, type: 'spring', bounce: 0.4 }}
                  className="flex-shrink-0"
                >
                  <BadgeCheck className="w-4 h-4 text-primary fill-primary" />
                </motion.div>
              ) : (
                <motion.div
                  key="heart"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [1, 1.3, 1], opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="flex-shrink-0"
                >
                  <Heart className="w-4 h-4 text-tertiary fill-tertiary" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="text-label-sm text-muted-foreground truncate">{profileData.pronouns}</p>
        </div>
      </div>

      {/* Meta info */}
      {(profileData.location || profileData.role) && (
        <div className="space-y-1">
          {profileData.role && (
            <div className="flex items-center gap-2 text-label-sm text-muted-foreground">
              <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{profileData.role}</span>
            </div>
          )}
          {profileData.location && (
            <div className="flex items-center gap-2 text-label-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{profileData.location}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
