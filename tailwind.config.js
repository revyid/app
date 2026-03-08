/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Material 3 Color System (HCT-based, High Contrast)
      colors: {
        // Core M3 Colors
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          container: "hsl(var(--primary-container))",
          "container-foreground": "hsl(var(--primary-container-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          container: "hsl(var(--secondary-container))",
          "container-foreground": "hsl(var(--secondary-container-foreground))",
        },
        tertiary: {
          DEFAULT: "hsl(var(--tertiary))",
          foreground: "hsl(var(--tertiary-foreground))",
          container: "hsl(var(--tertiary-container))",
          "container-foreground": "hsl(var(--tertiary-container-foreground))",
        },
        // Surface & Background
        surface: {
          DEFAULT: "hsl(var(--surface))",
          variant: "hsl(var(--surface-variant))",
          "variant-foreground": "hsl(var(--surface-variant-foreground))",
          tint: "hsl(var(--surface-tint))",
          dim: "hsl(var(--surface-dim, var(--surface)))",
          bright: "hsl(var(--surface-bright, var(--surface)))",
          "container-lowest": "hsl(var(--surface-container-lowest, var(--surface)))",
          "container-low": "hsl(var(--surface-container-low, var(--surface)))",
          "container": "hsl(var(--surface-container, var(--surface)))",
          "container-high": "hsl(var(--surface-container-high, var(--surface-variant)))",
          "container-highest": "hsl(var(--surface-container-highest, var(--surface-variant)))",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // M3 Semantic Colors
        error: {
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--error-foreground))",
          container: "hsl(var(--error-container))",
          "container-foreground": "hsl(var(--error-container-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          container: "hsl(var(--success-container))",
          "container-foreground": "hsl(var(--success-container-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          container: "hsl(var(--warning-container))",
          "container-foreground": "hsl(var(--warning-container-foreground))",
        },
        // Neutral Scale (M3)
        neutral: {
          DEFAULT: "hsl(var(--neutral))",
          foreground: "hsl(var(--neutral-foreground))",
          variant: "hsl(var(--neutral-variant))",
          "variant-foreground": "hsl(var(--neutral-variant-foreground))",
        },
        // Outline
        outline: {
          DEFAULT: "hsl(var(--outline))",
          variant: "hsl(var(--outline-variant))",
        },
        // Shadcn compatibility
        border: "hsl(var(--outline))",
        input: "hsl(var(--surface-variant))",
        ring: "hsl(var(--primary))",
        muted: {
          DEFAULT: "hsl(var(--neutral-variant))",
          foreground: "hsl(var(--neutral-variant-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--tertiary))",
          foreground: "hsl(var(--tertiary-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--error))",
          foreground: "hsl(var(--error-foreground))",
        },
        // Gopix Vibrant Accents
        gopix: {
          lime: "#A3E635",
          cyan: "#22D3EE",
          magenta: "#E879F9",
          amber: "#FBBF24",
          rose: "#FB7185",
        },
      },
      // Squircle Border Radius System
      borderRadius: {
        none: "0px",
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "28px",
        "4xl": "36px",
        full: "9999px",
        // M3 Shape Tokens
        "extra-small": "4px",
        "small": "8px",
        "medium": "12px",
        "large": "16px",
        "extra-large": "28px",
        "extra-large-top": "28px 28px 0 0",
        // Squircle tokens
        "squircle": "24px",
        "squircle-sm": "12px",
        "squircle-lg": "32px",
      },
      // Material 3 Elevation (Soft Depth)
      boxShadow: {
        "elevation-0": "none",
        "elevation-1": "0px 1px 2px 0px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)",
        "elevation-2": "0px 1px 2px 0px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)",
        "elevation-3": "0px 1px 3px 0px rgba(0,0,0,0.3), 0px 4px 8px 3px rgba(0,0,0,0.15)",
        "elevation-4": "0px 2px 3px 0px rgba(0,0,0,0.3), 0px 6px 10px 4px rgba(0,0,0,0.15)",
        "elevation-5": "0px 4px 4px 0px rgba(0,0,0,0.3), 0px 8px 12px 6px rgba(0,0,0,0.15)",
        // Gopix Glow
        "glow-lime": "0 0 20px rgba(163, 230, 53, 0.4), 0 0 40px rgba(163, 230, 53, 0.2)",
        "glow-cyan": "0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.2)",
        "glow-magenta": "0 0 20px rgba(232, 121, 249, 0.4), 0 0 40px rgba(232, 121, 249, 0.2)",
        // Glass
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        // Fluid Surface
        "fluid": "0px 2px 6px 0px rgba(0,0,0,0.08), 0px 4px 12px 2px rgba(0,0,0,0.04)",
        "fluid-hover": "0px 4px 12px 0px rgba(0,0,0,0.12), 0px 8px 24px 4px rgba(0,0,0,0.06)",
      },
      // Typography (M3 Type Scale)
      fontSize: {
        "display-lg": ["57px", { lineHeight: "64px", letterSpacing: "-0.25px", fontWeight: "400" }],
        "display-md": ["45px", { lineHeight: "52px", letterSpacing: "0px", fontWeight: "400" }],
        "display-sm": ["36px", { lineHeight: "44px", letterSpacing: "0px", fontWeight: "400" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "0px", fontWeight: "400" }],
        "headline-md": ["28px", { lineHeight: "36px", letterSpacing: "0px", fontWeight: "400" }],
        "headline-sm": ["24px", { lineHeight: "32px", letterSpacing: "0px", fontWeight: "400" }],
        "title-lg": ["22px", { lineHeight: "28px", letterSpacing: "0px", fontWeight: "400" }],
        "title-md": ["16px", { lineHeight: "24px", letterSpacing: "0.15px", fontWeight: "500" }],
        "title-sm": ["14px", { lineHeight: "20px", letterSpacing: "0.1px", fontWeight: "500" }],
        "label-lg": ["14px", { lineHeight: "20px", letterSpacing: "0.1px", fontWeight: "500" }],
        "label-md": ["12px", { lineHeight: "16px", letterSpacing: "0.5px", fontWeight: "500" }],
        "label-sm": ["11px", { lineHeight: "16px", letterSpacing: "0.5px", fontWeight: "500" }],
        "body-lg": ["16px", { lineHeight: "24px", letterSpacing: "0.5px", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "20px", letterSpacing: "0.25px", fontWeight: "400" }],
        "body-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.4px", fontWeight: "400" }],
      },
      // Spacing (M3 Grid)
      spacing: {
        "0": "0px",
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "7": "28px",
        "8": "32px",
        "9": "36px",
        "10": "40px",
        "11": "44px",
        "12": "48px",
        "13": "52px",
        "14": "56px",
        "15": "60px",
        "16": "64px",
        "17": "68px",
        "18": "72px",
        "19": "76px",
        "20": "80px",
      },
      // Keyframes
      keyframes: {
        // M3 Motion
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        // Gopix Effects
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(163, 230, 53, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(163, 230, 53, 0.6)" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        // Gemini AI Glow
        "gemini-rotate": {
          "0%": { "--gemini-angle": "0deg" },
          "100%": { "--gemini-angle": "360deg" },
        },
        "gemini-pulse": {
          "0%, 100%": { opacity: "0.6", filter: "blur(2px)" },
          "50%": { opacity: "1", filter: "blur(0px)" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-6px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(6px)" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up-fade": {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "particle-burst": {
          "0%": { transform: "scale(0)", opacity: "1" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        "float": "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
        "gemini-rotate": "gemini-rotate 3s linear infinite",
        "gemini-pulse": "gemini-pulse 2s ease-in-out infinite",
        "shake": "shake 0.5s ease-in-out",
        "bounce-in": "bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "slide-up-fade": "slide-up-fade 0.4s cubic-bezier(0.2, 0, 0, 1)",
        "scale-in": "scale-in 0.3s cubic-bezier(0.2, 0, 0, 1)",
      },
      // Backdrop Blur
      backdropBlur: {
        glass: "20px",
        frosted: "40px",
      },
      // Transition Timing Functions
      transitionTimingFunction: {
        "m3-standard": "cubic-bezier(0.2, 0, 0, 1)",
        "m3-emphasized": "cubic-bezier(0.4, 0, 0.2, 1)",
        "m3-decelerate": "cubic-bezier(0, 0, 0.2, 1)",
        "m3-accelerate": "cubic-bezier(0.4, 0, 1, 1)",
        "bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
      // Transition Durations
      transitionDuration: {
        "m3-short": "150ms",
        "m3-medium": "300ms",
        "m3-long": "500ms",
        "m3-extra-long": "700ms",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
