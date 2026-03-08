import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';
import { profileData } from '@/data/portfolio-data';
import { itemVariants } from '@/lib/animations';
import { SPRING_BOUNCY } from '@/lib/motion-presets';

export function ProfileHeader() {
  return (
    <motion.div variants={itemVariants} className="mb-6">
      {/* Profile Image — Squircle */}
      <motion.div 
        whileHover={{ scale: 1.05 }}
        transition={SPRING_BOUNCY}
        className="w-20 h-20 squircle-lg overflow-hidden mb-4 bg-surface-variant"
      >
        <img 
          src={profileData.image} 
          alt={profileData.name}
          className="w-full h-full object-cover"
        />
      </motion.div>
      
      {/* Name with verified badge */}
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-title-lg font-bold text-foreground">
          {profileData.name}
        </h1>
        {profileData.verified && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={SPRING_BOUNCY}
          >
            <BadgeCheck className="w-5 h-5 text-primary fill-primary" />
          </motion.div>
        )}
      </div>
      
      {/* Pronouns */}
      <p className="text-body-sm text-muted-foreground">
        {profileData.pronouns}
      </p>
    </motion.div>
  );
}
