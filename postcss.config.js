module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}, // <--- C'est ici que ça change (avant c'était juste 'tailwindcss')
    autoprefixer: {},
  },
}