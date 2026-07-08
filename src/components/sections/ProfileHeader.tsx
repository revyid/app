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
    <div className="mb-2">
      {/* Avatar row */}
      <div className="flex items-center gap-4 mb-4 h-20">
        <div className="w-20 h-20 flex-shrink-0 overflow-hidden bg-surface-variant ring-2 ring-primary/20 rounded-[20px] hover:scale-105 transition-transform duration-300">
          <img
            src={profileData.image}
            alt={profileData.name}
            className="w-full h-full object-cover"
            fetchPriority="high"
            decoding="async"
          />
        </div>

        {/* Easter egg photo */}
        <AnimatePresence>
          {isNawaMode && easterEgg && (
            <motion.div
              initial={{ x: -20, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: -20, opacity: 0, scale: 0.8 }}
              transition={SPRING_BOUNCY}
              className="w-20 h-20 flex-shrink-0 overflow-hidden bg-surface-variant ring-2 ring-tertiary/40 rounded-[20px]"
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

      {/* Name + badge + easter egg name */}
      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
        <h1 className="text-title-lg font-bold text-foreground flex-shrink-0">
          {profileData.name}
        </h1>

        <div className="relative w-5 h-5 flex items-center justify-center flex-shrink-0">
          <AnimatePresence mode="popLayout" initial={false}>
            {!isNawaMode ? (
              <motion.div
                key="badge"
                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, rotate: 180, opacity: 0 }}
                transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
                className="absolute inset-0"
              >
                <BadgeCheck className="w-5 h-5 text-primary fill-primary" />
              </motion.div>
            ) : (
              <motion.div
                key="heart"
                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                animate={{ scale: [1, 1.2, 1], rotate: 0, opacity: 1 }}
                exit={{ scale: 0, rotate: 180, opacity: 0 }}
                transition={{ duration: 0.5, type: 'tween', ease: [0.34, 1.56, 0.64, 1] }}
                className="absolute inset-0"
              >
                <Heart className="w-5 h-5 text-tertiary fill-tertiary drop-shadow-sm" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Easter egg name (no "love" text) */}
        <AnimatePresence>
          {isNawaMode && easterEgg && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={SPRING_BOUNCY}
            >
              <span className="text-title-lg font-bold text-foreground">
                {easterEgg.name}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-body-sm text-muted-foreground mb-2">
        {profileData.pronouns}
      </p>

      {/* Location & role */}
      {(profileData.role || profileData.location) && (
        <div className="space-y-1 mt-1">
          {profileData.role && (
            <div className="flex items-center gap-1.5 text-label-sm text-muted-foreground">
              <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{profileData.role}</span>
            </div>
          )}
          {profileData.location && (
            <div className="flex items-center gap-1.5 text-label-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{profileData.location}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
