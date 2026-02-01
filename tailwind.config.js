/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx,ts,tsx,mdx}",
    "./src/components/**/*.{js,jsx,ts,tsx,mdx}",
    "./src/app/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0ea5e9",
          dark: "#0369a1",
        },
      },
      borderRadius: {
        "2xl": "1.25rem",
      },

      keyframes: {
        /* iPhone-like menu open */
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },

        /* Optional: smooth gradient drift */
        lmGradient: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },

        /* Optional: soft glow pulse */
        lmPulse: {
          "0%": { opacity: ".35" },
          "50%": { opacity: ".65" },
          "100%": { opacity: ".35" },
        },

        /* Premium sheen sweep (spürbar aber elegant) */
        lmSheen: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(260%)" },
        },

        /* slow always-on sheen */
        lmSheenSlow: {
          "0%": { transform: "translateX(-140%)" },
          "100%": { transform: "translateX(260%)" },
        },
      },

      animation: {
        fadeUp: "fadeUp 260ms ease-out both",
        scaleIn: "scaleIn 220ms ease-out both",

        lmGradient: "lmGradient 6s ease-in-out infinite",
        lmPulse: "lmPulse 4s ease-in-out infinite",

        lmSheen: "lmSheen 900ms ease-out 1",
        lmSheenSlow: "lmSheenSlow 5.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
