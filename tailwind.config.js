/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./{App,index}.tsx",
    "./{components,api,services}/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Crimson Text"', 'Georgia', '"Songti SC"', 'STSong', '"SimSun"', 'serif'],
        sans: ['-apple-system', 'BlinkMacSystemFont', '"PingFang SC"', '"Microsoft YaHei"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        obsidian: '#0B0F19',
        gold: {
          100: '#FDF7E5',
          300: '#F2DF8E',
          500: '#D4AF37',
          700: '#9E8022',
          900: '#5C4A11',
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        'spin-slow': 'spin 60s linear infinite',
        'spin-slow-reverse': 'spin 80s linear infinite reverse',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', filter: 'blur(40px)' },
          '50%': { opacity: '0.7', filter: 'blur(60px)' },
        }
      }
    }
  },
  plugins: [],
}
