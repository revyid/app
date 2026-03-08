import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeCheck, Heart } from 'lucide-react';
import { profileData } from '@/data/portfolio-data';
import { itemVariants } from '@/lib/animations';
import { SPRING_BOUNCY } from '@/lib/motion-presets';

const NAWA_IMAGE = 'https://scontent.fdjb3-1.fna.fbcdn.net/v/t1.15752-9/643892106_926933829985513_7748531435417713772_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=fc17b8&efg=eyJxZV9ncm91cHMiOlsiaWdkX2Jlc3RfZWZmb3J0X2ltYWdlOmNvbnRyb2wiXX0%3D&_nc_ohc=Kliq_MHYy6sQ7kNvwHQM6ov&_nc_oc=Admw9dFPV-V2sGmH0OzBo-5ISIRpSAuZtNHvt5o5aWuUQ9ZzKbtS2xjU5ZoLPoFgtIY&_nc_zt=23&_nc_ht=scontent.fdjb3-1.fna&_nc_ss=8&oh=03_Q7cD4wFYXQP0S0TYmcp7wYXE2bqHubFkQaRahWbwsuJ6mGdUZg&oe=69D4F2B1';

export function ProfileHeader() {
  const [isNawaMode, setIsNawaMode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle on Ctrl + Alt + L
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'l') {
        setIsNawaMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <motion.div variants={itemVariants} className="mb-6">
      {/* Profile Images - Side by side gracefully */}
      <div className="flex items-center gap-4 mb-4 h-20">
        {/* Revy's PP */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={SPRING_BOUNCY}
          className="w-20 h-20 flex-shrink-0 overflow-hidden bg-surface-variant ring-2 ring-primary/20 idle-breathe"
          style={{ borderRadius: '20px' }}
        >
          <img src={profileData.image} alt={profileData.name} className="w-full h-full object-cover" />
        </motion.div>

        {/* Nawa's PP */}
        <AnimatePresence>
          {isNawaMode && (
            <motion.div
              initial={{ x: -20, opacity: 0, scale: 0.8 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: -20, opacity: 0, scale: 0.8 }}
              transition={SPRING_BOUNCY}
              className="w-20 h-20 flex-shrink-0 overflow-hidden bg-surface-variant ring-2 ring-tertiary/40"
              style={{ borderRadius: '20px' }}
            >
              <img src={NAWA_IMAGE} alt="Nawa" className="w-full h-full object-cover" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Name Area: Revy [Badge->Heart] Nawa */}
      <div className="flex items-center gap-2 mb-1">

        {/* Always display Revy */}
        <h1 className="text-title-lg font-bold text-foreground flex-shrink-0">
          {profileData.name}
        </h1>

        {/* The Icon that swaps and belongs IN THE MIDDLE */}
        <div className="relative w-5 h-5 flex items-center justify-center flex-shrink-0 idle-pulse-glow">
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
                transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
                className="absolute inset-0"
              >
                <Heart className="w-5 h-5 text-tertiary fill-tertiary drop-shadow-sm" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nawa's name appears on the right of the badge */}
        <AnimatePresence>
          {isNawaMode && (
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={SPRING_BOUNCY}
              className="text-title-lg font-bold text-foreground whitespace-nowrap"
            >
              Nawa
            </motion.h1>
          )}
        </AnimatePresence>

      </div>

      {/* Pronouns */}
      <p className="text-body-sm text-muted-foreground">
        {profileData.pronouns}
      </p>
    </motion.div>
  );
}
