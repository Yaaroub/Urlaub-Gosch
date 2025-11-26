module.exports = {
    content: [
      "./src/pages/**/*.{js,jsx,mdx}",
      "./src/components/**/*.{js,jsx,mdx}",
      "./src/app/**/*.{js,jsx,mdx}",
    ],
    theme: {
      extend: {
        colors: { brand: { DEFAULT: "#0ea5e9", dark: "#0369a1" } },
        borderRadius: { "2xl": "1.25rem" },
      },
    },
    plugins: [],
  };
  