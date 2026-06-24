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
          DEFAULT: "#0077B6",
          navy: "#050B1F",
          blue: "#0077B6",
          sky: "#EAF7FB",
          gold: "#C49A3A",
          sand: "#F7F1E5",
          text: "#0F172A",
          dark: "#0369A1",
        },
      },

      borderRadius: {
        "2xl": "1.25rem",
      },

      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },

        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },

        lmGradient: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },

        lmPulse: {
          "0%": { opacity: ".35" },
          "50%": { opacity: ".65" },
          "100%": { opacity: ".35" },
        },

        lmSheen: {
          "0%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(260%)" },
        },

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