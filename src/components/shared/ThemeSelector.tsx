import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, type ThemeColorProfile } from '@/contexts/ThemeContext';
import { Check, Palette, Sun, Moon, Monitor } from 'lucide-react';
import { SPRING_BOUNCY, SPRING_SNAPPY } from '@/lib/motion-presets';

interface ThemeSelectorProps {
  className?: string;
}

function ColorDot({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <div
      className="rounded-full ring-1 ring-black/10"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
      }}
    />
  );
}

function ProfileCard({
  profile,
  isActive,
  onClick,
}: {
  profile: ThemeColorProfile;
  isActive: boolean;
  onClick: () => void;
}) {
  const primaryColor = profile.schemes.light.primary || '#6750A4';
  const secondaryColor = profile.schemes.light.secondary || '#625B71';
  const tertiaryColor = profile.schemes.light.tertiary || '#7D5260';

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={SPRING_BOUNCY}
      className={`relative flex items-center gap-3 w-full px-4 py-3 rounded-2xl border-2 transition-colors duration-150 text-left ${
        isActive
          ? 'border-primary bg-primary/8'
          : 'border-outline/30 bg-surface-variant/30 hover:border-outline/60'
      }`}
    >
      {/* Color Preview */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <ColorDot color={primaryColor} />
        <ColorDot color={secondaryColor} size={12} />
        <ColorDot color={tertiaryColor} size={12} />
      </div>

      {/* Name & Description */}
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium text-foreground truncate">
          {profile.name}
        </p>
        {profile.description && (
          <p className="text-label-sm text-muted-foreground truncate">
            {profile.description}
          </p>
        )}
      </div>

      {/* Active Indicator */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={SPRING_BOUNCY}
            className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0"
          >
            <Check className="w-3.5 h-3.5 text-primary-foreground" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function ThemeSelector({ className = '' }: ThemeSelectorProps) {
  const {
    theme,
    setTheme,
    colorProfileId,
    setColorProfile,
    availableProfiles,
  } = useTheme();

  const themeOptions = [
    { id: 'light' as const, label: 'Light', icon: Sun },
    { id: 'dark' as const, label: 'Dark', icon: Moon },
    { id: 'system' as const, label: 'Auto', icon: Monitor },
  ];

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Appearance Mode */}
      <div>
        <h4 className="text-label-sm font-semibold text-primary uppercase tracking-wider mb-3 flex items-center gap-2">
          <Palette className="w-3.5 h-3.5" />
          Appearance
        </h4>
        <div className="flex gap-2">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.id;
            return (
              <motion.button
                key={option.id}
                onClick={() => setTheme(option.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING_SNAPPY}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 transition-colors duration-150 ${
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-outline/30 text-muted-foreground hover:border-outline/60 hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-label-sm font-medium">{option.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Color Profiles */}
      {availableProfiles.length > 0 && (
        <div>
          <h4 className="text-label-sm font-semibold text-primary uppercase tracking-wider mb-3">
            Color Theme
          </h4>
          <div className="space-y-2">
            {availableProfiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                isActive={colorProfileId === profile.id}
                onClick={() => setColorProfile(profile.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
