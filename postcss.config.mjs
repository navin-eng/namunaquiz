
const config = {
    plugins: {
        '@tailwindcss/postcss': {},
        autoprefixer: {}, // Autoprefixer is actually optional in v4 as lightningcss handles prefixes usually, but good for compat
    },
};
export default config;
