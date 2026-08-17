export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0b0f17',
        panel: '#131a25',
        accent: '#f84464',
        gold: '#f5c56b'
      },
      boxShadow: {
        glow: '0 0 30px rgba(248,68,100,0.35)'
      }
    }
  },
  plugins: []
}
