import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  color: string;
  size: number;
}

interface ParticleBurstProps {
  trigger: boolean;
  originX: number;
  originY: number;
  particleCount?: number;
  colors?: string[];
  onComplete?: () => void;
}

export function ParticleBurst({
  trigger,
  originX,
  originY,
  particleCount = 12,
  colors = ['#A3E635', '#22D3EE', '#E879F9', '#FBBF24'],
  onComplete,
}: ParticleBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger) {
      const newParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
        id: Date.now() + i,
        x: originX,
        y: originY,
        angle: (i / particleCount) * 360 + Math.random() * 30 - 15,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
      }));
      setParticles(newParticles);

      // Clear particles after animation
      setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 800);
    }
  }, [trigger, originX, originY, particleCount, colors, onComplete]);

  return (
    <AnimatePresence>
      {particles.map((particle) => {
        const radians = (particle.angle * Math.PI) / 180;
        const distance = 80 + Math.random() * 60;
        const endX = particle.x + Math.cos(radians) * distance;
        const endY = particle.y + Math.sin(radians) * distance;

        return (
          <motion.div
            key={particle.id}
            initial={{
              x: particle.x,
              y: particle.y,
              scale: 0,
              opacity: 1,
            }}
            animate={{
              x: endX,
              y: endY,
              scale: [0, 1.5, 0],
              opacity: [1, 1, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.6,
              ease: [0, 0, 0.2, 1],
            }}
            className="fixed pointer-events-none z-[100]"
            style={{
              width: particle.size,
              height: particle.size,
              borderRadius: '50%',
              backgroundColor: particle.color,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            }}
          />
        );
      })}
    </AnimatePresence>
  );
}

// Success Checkmark Animation
interface SuccessCheckmarkProps {
  trigger: boolean;
  size?: number;
  className?: string;
}

export function SuccessCheckmark({ trigger, size = 48, className = '' }: SuccessCheckmarkProps) {
  return (
    <AnimatePresence>
      {trigger && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className={`inline-flex items-center justify-center rounded-full bg-success ${className}`}
          style={{ width: size, height: size }}
        >
          <motion.svg
            width={size * 0.5}
            height={size * 0.5}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-success-foreground"
          >
            <motion.path
              d="M5 12l5 5L20 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Ripple Effect
interface RippleEffectProps {
  trigger: boolean;
  x: number;
  y: number;
  color?: string;
}

export function RippleEffect({ trigger, x, y, color = 'hsl(var(--primary))' }: RippleEffectProps) {
  const [ripples, setRipples] = useState<number[]>([]);

  useEffect(() => {
    if (trigger) {
      const id = Date.now();
      setRipples((prev) => [...prev, id]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r !== id));
      }, 600);
    }
  }, [trigger]);

  return (
    <>
      {ripples.map((id) => (
        <motion.div
          key={id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="fixed pointer-events-none z-50 rounded-full"
          style={{
            left: x - 25,
            top: y - 25,
            width: 50,
            height: 50,
            border: `2px solid ${color}`,
          }}
        />
      ))}
    </>
  );
}

// Glow Pulse Effect
interface GlowPulseProps {
  trigger: boolean;
  children: React.ReactNode;
  color?: string;
}

export function GlowPulse({ trigger, children, color = '#A3E635' }: GlowPulseProps) {
  return (
    <motion.div
      animate={trigger ? {
        boxShadow: [
          `0 0 0px ${color}00`,
          `0 0 30px ${color}80`,
          `0 0 60px ${color}40`,
          `0 0 0px ${color}00`,
        ],
      } : {}}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.div>
  );
}

// Confetti Effect
interface ConfettiProps {
  trigger: boolean;
  particleCount?: number;
}

export function Confetti({ trigger, particleCount = 50 }: ConfettiProps) {
  const [confetti, setConfetti] = useState<Array<{
    id: number;
    x: number;
    color: string;
    rotation: number;
    size: number;
  }>>([]);

  const colors = ['#A3E635', '#22D3EE', '#E879F9', '#FBBF24', '#FB7185', '#60A5FA'];

  useEffect(() => {
    if (trigger) {
      const newConfetti = Array.from({ length: particleCount }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * window.innerWidth,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        size: Math.random() * 10 + 5,
      }));
      setConfetti(newConfetti);

      setTimeout(() => setConfetti([]), 3000);
    }
  }, [trigger, particleCount]);

  return (
    <AnimatePresence>
      {confetti.map((c) => (
        <motion.div
          key={c.id}
          initial={{
            y: -20,
            x: c.x,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            y: window.innerHeight + 20,
            rotate: c.rotation + 720,
            opacity: [1, 1, 0],
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 2 + Math.random() * 1,
            ease: 'linear',
          }}
          className="fixed pointer-events-none z-[100]"
          style={{
            width: c.size,
            height: c.size * 0.6,
            backgroundColor: c.color,
            left: 0,
          }}
        />
      ))}
    </AnimatePresence>
  );
}
