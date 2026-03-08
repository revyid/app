import { motion } from 'framer-motion';

/**
 * M3 Expressive Loading Indicator
 * Ported from material-components-android LoadingIndicatorDrawingDelegate.java
 * and MaterialShapes.java — full shape morphing with spring-driven rotation.
 *
 * Shape sequence: SOFT_BURST → COOKIE_9 → PENTAGON → PILL → SUNNY → COOKIE_4 → OVAL
 * Each shape lasts 650ms, rotates 140° per shape (50° constant + 90° spring).
 */

const POINTS = 180;

// --- Shape generators ---
// These replicate the Android MaterialShapes.java star/polygon definitions
// using polar-coordinate SVG path generation with rounded features.

/** Generic polar-coordinate SVG path generator */
const makePath = (fn: (angle: number) => { x: number; y: number }) => {
  let path = '';
  for (let i = 0; i <= POINTS; i++) {
    const angle = (i / POINTS) * Math.PI * 2;
    const { x, y } = fn(angle);
    path += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)} `;
  }
  return path + 'Z';
};

/**
 * Star shape generator matching Android's ShapesKt.star()
 * numVertices: number of outer vertices
 * innerRadius: ratio of inner to outer radius (0-1)
 * rounding: corner rounding amount (0-1)
 */
const makeStar = (numVertices: number, outerR: number, innerR: number, rounding: number) => {
  return makePath(a => {
    const totalPoints = numVertices * 2;
    const segAngle = (Math.PI * 2) / totalPoints;
    const idx = a / segAngle;
    const idxFloor = Math.floor(idx);
    const frac = idx - idxFloor;

    const r0 = idxFloor % 2 === 0 ? outerR : innerR;
    const r1 = (idxFloor + 1) % 2 === 0 ? outerR : innerR;

    // Smooth interpolation with rounding
    const t = frac;
    const smoothT = rounding > 0
      ? t * t * (3 - 2 * t) * (1 - rounding) + t * rounding
      : t;
    const r = r0 + (r1 - r0) * smoothT;

    return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
  });
};

/**
 * Cookie shape generator — star with smooth rounded concavities
 * Matches Android's cookie shapes: inner/outer radius with rounding = 0.5
 */
const makeCookie = (numVertices: number, innerRadiusFactor: number) =>
  makeStar(numVertices, 45, 45 * innerRadiusFactor, 0.5);

// ==========================================
// SHAPE DEFINITIONS — ported from MaterialShapes.java
// ==========================================

const shapes = {
  // Circle — ShapesKt.circle(numVertices=10)
  circle: makePath(a => ({
    x: 50 + 45 * Math.cos(a),
    y: 50 + 45 * Math.sin(a),
  })),

  // Oval — circle scaled to 64% Y, rotated -45°
  oval: makePath(a => {
    const rot = -Math.PI / 4;
    const cx = 45 * Math.cos(a);
    const cy = 45 * 0.64 * Math.sin(a);
    return {
      x: 50 + cx * Math.cos(rot) - cy * Math.sin(rot),
      y: 50 + cx * Math.sin(rot) + cy * Math.cos(rot),
    };
  }),

  // Soft Burst — 10-point star with tiny variation, rounding=0.053
  softBurst: makeStar(10, 45, 38, 0.053),

  // Cookie 9 — 9-vertex star, innerRadius=0.8, rounding=0.5
  cookie9: makeCookie(9, 0.8),

  // Cookie 4 — 4-vertex cookie
  cookie4: makePath(a => {
    // Android uses custom polygon with specific vertices
    const r = 40 + 10 * Math.cos(4 * a) * (0.5 + 0.5 * Math.cos(8 * a));
    return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
  }),

  // Cookie 6 — 6-vertex cookie with large rounding
  cookie6: makeCookie(6, 0.78),

  // Cookie 7 — 7-vertex star, innerRadius=0.75, rounding=0.5
  cookie7: makeCookie(7, 0.75),

  // Cookie 12 — 12-vertex star, innerRadius=0.8, rounding=0.5
  cookie12: makeCookie(12, 0.8),

  // Pentagon — 5-sided polygon with rounding=0.172
  pentagon: makePath(a => {
    const n = 5;
    const segAngle = (Math.PI * 2) / n;
    const idx = a / segAngle;
    const idxFloor = Math.floor(idx);
    const frac = idx - idxFloor;

    const a0 = idxFloor * segAngle;
    const a1 = (idxFloor + 1) * segAngle;

    const r = 44;
    const rounding = 0.172;

    // Smooth corners
    const t = frac;
    const smoothT = t < rounding ? t / rounding * 0.5
      : t > (1 - rounding) ? 0.5 + (t - (1 - rounding)) / rounding * 0.5
      : 0.5;

    const angle = a0 + (a1 - a0) * smoothT;
    const radiusAdj = r - 4 * Math.pow(Math.sin(Math.PI * frac), 0.3) * rounding;

    return {
      x: 50 + radiusAdj * Math.cos(angle),
      y: 50 + radiusAdj * Math.sin(angle),
    };
  }),

  // Pill — rounded rectangle shape
  pill: makePath(a => {
    const power = 0.65;
    const stretchX = 45;
    const stretchY = 30;
    return {
      x: 50 + stretchX * Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), power),
      y: 50 + stretchY * Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), power),
    };
  }),

  // Sunny — 8-point star, innerRadius=0.8, rounding=0.15
  sunny: makeStar(8, 46, 37, 0.15),

  // Very Sunny — 8-point with larger amplitude
  verySunny: makeStar(8, 48, 34, 0.085),

  // Clover 4 — 4-leaf clover shape
  clover4: makePath(a => {
    const r = 38 + 12 * Math.pow(Math.abs(Math.cos(2 * a)), 0.6);
    return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
  }),

  // Clover 8 — 8-leaf clover
  clover8: makePath(a => {
    const r = 36 + 10 * Math.pow(Math.abs(Math.cos(4 * a)), 0.5);
    return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
  }),

  // Flower — 8-petal flower shape
  flower: makePath(a => {
    const r = 32 + 14 * Math.pow(Math.abs(Math.cos(4 * a)), 0.7);
    return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
  }),

  // Diamond — 4-sided with pointed top/bottom
  diamond: makePath(a => {
    const power = 0.55;
    const r = 46;
    return {
      x: 50 + r * 0.75 * Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), power),
      y: 50 + r * Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), power),
    };
  }),

  // Triangle — 3-sided with rounding=0.2
  triangle: makePath(a => {
    const n = 3;
    const rot = -Math.PI / 2;
    const segAngle = (Math.PI * 2) / n;
    const rotatedA = a + rot;
    const idx = ((rotatedA % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / segAngle;
    const idxFloor = Math.floor(idx);
    const frac = idx - idxFloor;
    const a0 = idxFloor * segAngle - rot;
    const a1 = (idxFloor + 1) * segAngle - rot;
    const r = 44 - 5 * Math.pow(Math.sin(Math.PI * frac), 0.4);
    const angle = a0 + (a1 - a0) * frac;
    return {
      x: 50 + r * Math.cos(angle),
      y: 50 + r * Math.sin(angle),
    };
  }),

  // Heart — heart-shaped polar curve
  heart: makePath(a => {
    const t = a - Math.PI / 2;
    const r = 20 * (1 + 0.6 * Math.abs(Math.cos(t))) *
      (1 + 0.2 * Math.cos(2 * t)) *
      (0.9 + 0.1 * Math.cos(4 * t));
    return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
  }),

  // Gem — asymmetric faceted shape (rotated -90°)
  gem: makePath(a => {
    const n = 6;
    const segAngle = (Math.PI * 2) / n;
    const radii = [44, 38, 42, 44, 38, 42];
    const idx = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / segAngle;
    const idxFloor = Math.floor(idx) % n;
    const frac = idx - Math.floor(idx);
    const r0 = radii[idxFloor];
    const r1 = radii[(idxFloor + 1) % n];
    const r = r0 + (r1 - r0) * (frac * frac * (3 - 2 * frac));
    return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
  }),

  // Boom — 15-point sharp burst
  boom: makeStar(15, 46, 32, 0.007),

  // Burst — 12-point very sharp burst
  burst: makeStar(12, 48, 30, 0.006),

  // Ghostish — rounded ghost silhouette
  ghostish: makePath(a => {
    const normA = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (normA < Math.PI) {
      // Top half — round
      const r = 44;
      return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
    } else {
      // Bottom half — wavy
      const wave = 5 * Math.sin(6 * normA);
      const r = 44 + wave;
      return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
    }
  }),

  // Pixel Circle — stepped/pixelated circle
  pixelCircle: makePath(a => {
    const step = 8;
    const segAngle = (Math.PI * 2) / step;
    const idx = Math.floor(((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / segAngle);
    const r = [43, 45, 44, 46, 43, 45, 44, 46][idx % step];
    return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
  }),

  // Puffy Diamond — 4-sided puffed diamond
  puffyDiamond: makePath(a => {
    const r = 42 + 6 * Math.pow(Math.abs(Math.sin(2 * a)), 0.8);
    const power = 0.6;
    return {
      x: 50 + r * Math.sign(Math.cos(a)) * Math.pow(Math.abs(Math.cos(a)), power),
      y: 50 + r * Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), power),
    };
  }),

  // Bun — double-bulge bun shape
  bun: makePath(a => {
    const normA = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const baseR = 42;
    const bulge = normA < Math.PI
      ? 5 * Math.sin(normA)
      : 5 * Math.sin(normA) * 0.7;
    return {
      x: 50 + (baseR + bulge) * Math.cos(a),
      y: 50 + (baseR + bulge) * Math.sin(a),
    };
  }),
};

// Android's exact morph sequence from LoadingIndicatorDrawingDelegate.java
// SOFT_BURST → COOKIE_9 → PENTAGON → PILL → SUNNY → COOKIE_4 → OVAL
const morphSequence = [
  shapes.softBurst,
  shapes.cookie9,
  shapes.pentagon,
  shapes.pill,
  shapes.sunny,
  shapes.cookie4,
  shapes.oval,
  shapes.softBurst, // Loop back to start
];

// ==========================================
// ANIMATION CONSTANTS — from LoadingIndicatorAnimatorDelegate.java
// ==========================================
const DURATION_PER_SHAPE_MS = 650;
const TOTAL_SHAPES = morphSequence.length - 1; // 7 transitions
const TOTAL_DURATION_S = (DURATION_PER_SHAPE_MS * TOTAL_SHAPES) / 1000; // 4.55s
const ROTATION_PER_SHAPE = 140; // 50° constant + 90° spring

interface M3ExpressiveIndicatorProps {
  className?: string;
}

export function M3ExpressiveIndicator({ className = 'w-16 h-16' }: M3ExpressiveIndicatorProps) {
  // Build rotation keyframes: 0, 140, 280, ... for each shape transition
  const rotations = Array.from({ length: TOTAL_SHAPES + 1 }, (_, i) => i * ROTATION_PER_SHAPE);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full fill-primary drop-shadow-sm"
        animate={{ rotate: rotations }}
        transition={{
          duration: TOTAL_DURATION_S,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        <motion.path
          animate={{ d: morphSequence }}
          transition={{
            duration: TOTAL_DURATION_S,
            ease: [0.2, 0.0, 0, 1.0], // M3 emphasized decelerate
            repeat: Infinity,
          }}
        />
      </motion.svg>
    </div>
  );
}

// Export all shapes for use in other components
export { shapes as M3Shapes };
