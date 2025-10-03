/** @type {import('tailwindcss').Config} */
const config = {
	darkMode: ["class"],
	content: [
		'./index.html', 
		'./src/**/*.{js,ts,jsx,tsx}',
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				// Meetmind.ai Brand Colors from graphic_charter.json
				'meetmind': {
					primary: '#1A3AFF',
					'primary-dark': '#0C1A33',
					'soft-blue': '#2E4CFF',
					'light-gray': '#F5F7FA',
					'medium-gray': '#C8C9CC',
					'dark-gray': '#2E2E3E',
					white: '#FFFFFF',
					'green-accent': '#4CAF50',
					'card-bg': '#0C0F1A',
					'icon-default': '#C8C9CC',
					'icon-active': '#1A3AFF',
				},
				// Original shadcn/ui colors (keep for compatibility)
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
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
			},
			fontFamily: {
				// Meetmind.ai typography from graphic_charter.json
				sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
			},
			fontSize: {
				// Meetmind.ai typography sizes from graphic_charter.json
				'heading': ['18px', { lineHeight: '1.5', fontWeight: '600' }],
				'heading-lg': ['24px', { lineHeight: '1.5', fontWeight: '700' }],
				'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
				'body-lg': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
				'label': ['13px', { lineHeight: '1.5', fontWeight: '500' }],
				'label-lg': ['14px', { lineHeight: '1.5', fontWeight: '500' }],
				'small': ['12px', { lineHeight: '1.5', fontWeight: '400' }],
			},
			borderRadius: {
				// Meetmind.ai border radius from graphic_charter.json
				'meetmind': '16px',
				'meetmind-button': '12px',
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			spacing: {
				// Meetmind.ai spacing from graphic_charter.json
				'card-padding': '1rem', // 16px
				'card-padding-lg': '1.5rem', // 24px
				'section-gap': '1.5rem', // 24px
				'section-gap-lg': '2rem', // 32px
			},
			boxShadow: {
				// Meetmind.ai shadows from graphic_charter.json
				'meetmind-card': '0px 4px 12px rgba(0,0,0,0.25)',
				'meetmind-hover': '0px 6px 16px rgba(0,0,0,0.35)',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				// Meetmind.ai microinteractions
				'hover-scale': {
					'0%': { transform: 'scale(1)' },
					'100%': { transform: 'scale(1.02)' }
				},
				fadeIn: {
					from: { opacity: '0' },
					to: { opacity: '1' },
				},
				slideIn: {
					from: { transform: 'translateY(10px)', opacity: '0' },
					to: { transform: 'translateY(0)', opacity: '1' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				// Meetmind.ai microinteractions (150-200ms from graphic_charter.json)
				'hover-scale': 'hover-scale 0.15s ease-out',
				fadeIn: 'fadeIn 0.2s ease-out',
				slideIn: 'slideIn 0.2s ease-out',
			},
			transitionDuration: {
				// Meetmind.ai transition durations from graphic_charter.json
				'meetmind': '150ms',
				'meetmind-slow': '200ms',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
};

export default config;