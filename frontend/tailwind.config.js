/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./App.{js,jsx}', './src/**/*.{js,jsx}'],
    presets: [require('nativewind/preset')],
    theme: {
        extend: {
            colors: {
                primary: '#00f576',
                'primary-dim': '#00cc62',
                'primary-fixed': '#3fff8b',
                surface: '#04040a',
                'surface-low': '#0c0c14',
                'surface-lowest': '#11111a',
                'on-surface': '#ffffff',
                'on-surface-variant': '#a1a3b1',
                tertiary: '#00f576',
                'outline-variant': 'rgba(255, 255, 255, 0.05)',
            },
            borderRadius: {
                md: '1.5rem',
                lg: '2rem',
            },
            spacing: {
                '6': '1.5rem',
                '8': '2rem',
            }
        },
    },
    plugins: [],
};
