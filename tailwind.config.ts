import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          light: "hsl(var(--primary-light))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* Chamby.mx Custom Colors */
        chamby: {
          green: "hsl(var(--primary))",
          "green-light": "hsl(var(--primary-light))",
          silver: "hsl(var(--silver))",
          "silver-light": "hsl(var(--silver-light))",
          "off-white": "hsl(var(--off-white))",
          black: "hsl(var(--deep-black))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      backgroundImage: {
        'gradient-main': 'var(--gradient-main)',
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-card': 'var(--gradient-card)',
        'gradient-button': 'var(--gradient-button)',
        'gradient-accent': 'var(--gradient-accent)',
        'gradient-glass': 'var(--gradient-glass)',
        'gradient-glass-button': 'var(--gradient-glass-button)',
        'gradient-mesh': 'var(--gradient-mesh)',
        'gradient-animated': 'var(--gradient-animated)',
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'raised': 'var(--shadow-raised)',
        'floating': 'var(--shadow-floating)',
        'glow': 'var(--shadow-glow)',
        'glow-silver': 'var(--shadow-glow-silver)',
        'inner': 'var(--shadow-inner)',
        'button-3d': 'var(--shadow-button-3d)',
        'button-hover': 'var(--shadow-button-hover)',
        'button-active': 'var(--shadow-button-active)',
      },
      backdropBlur: {
        'glass': 'var(--backdrop-blur)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)"
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)"
          }
        },
        "blur-fade": {
          "0%": {
            opacity: "0",
            filter: "blur(8px)"
          },
          "100%": {
            opacity: "1",
            filter: "blur(0px)"
          }
        },
        "gradient-shift": {
          "0%": {
            backgroundPosition: "0% 0%"
          },
          "25%": {
            backgroundPosition: "100% 0%"
          },
          "50%": {
            backgroundPosition: "100% 100%"
          },
          "75%": {
            backgroundPosition: "0% 100%"
          },
          "100%": {
            backgroundPosition: "0% 0%"
          }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out",
        "blur-fade": "blur-fade 0.8s ease-out",
        "gradient-shift": "gradient-shift 150s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
