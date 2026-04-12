/**
 * Charlie Design System v1.0
 * Source of truth for color, type, and component behavior.
 *
 * Fonts: Familjen Grotesk (UI), Instrument Serif (brand), DM Mono (numbers)
 * Install via: npx expo install @expo-google-fonts/familjen-grotesk
 *              npx expo install @expo-google-fonts/instrument-serif
 *              npx expo install @expo-google-fonts/dm-mono expo-font
 */

// ─── Core Brand Colors ───────────────────────────────────────
export const colors = {
  navy: "#0A1628",
  navyMid: "#0F2040",
  navyLight: "#162844",
  yellow: "#F5C842",
  yellowDim: "#D4A82E",
  sage: "#A8C5A0",
  cream: "#F5F0E8",

  // Semantic
  positive: "#A8C5A0",
  negative: "#E07070",
  warning: "#F5C842",
  neutral: "#8899AA",

  // Surfaces (use in order)
  surface0: "#0A1628", // Screen / page bg
  surface1: "#0F2040", // Card bg
  surface2: "#162844", // Elevated card / input bg
  surface3: "rgba(255,255,255,0.06)", // Ghost / overlay

  // Borders
  borderSubtle: "rgba(255,255,255,0.08)",
  borderMid: "rgba(255,255,255,0.14)",

  // Text
  textPrimary: "#F5F0E8", // Cream
  textSecondary: "#8899AA",
  textMuted: "rgba(245,240,232,0.35)",
  textOnYellow: "#0A1628", // Navy text on yellow bg
} as const;

// ─── Fonts ───────────────────────────────────────────────────
// Font family names after loading with expo-font.
// Falls back to system fonts until custom fonts are installed.
export const fonts = {
  body: "FamiljenGrotesk_400Regular",       // UI labels, buttons, body, nav
  bodySemibold: "FamiljenGrotesk_600SemiBold",
  brand: "InstrumentSerif_400Regular_Italic", // Hero text, page titles
  mono: "DMMono_400Regular",                // Numbers, amounts, metadata, labels

  // System fallbacks (used until custom fonts load)
  bodyFallback: "System",
  monoFallback: "Courier",
} as const;

// ─── Type Scale ──────────────────────────────────────────────
export const type = {
  hero: {
    fontSize: 32,
    fontFamily: fonts.mono,
    fontWeight: "400" as const,
    color: colors.cream,
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: fonts.brand,
    fontWeight: "400" as const,
    fontStyle: "italic" as const,
    color: colors.cream,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.body,
    fontWeight: "600" as const,
    color: colors.cream,
  },
  body: {
    fontSize: 14,
    fontFamily: fonts.body,
    fontWeight: "400" as const,
    color: colors.cream,
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.mono,
    fontWeight: "400" as const,
    color: colors.sage,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  metadata: {
    fontSize: 10,
    fontFamily: fonts.mono,
    fontWeight: "400" as const,
    color: colors.textSecondary,
  },
} as const;

// ─── Spacing ─────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// ─── Border Radius ───────────────────────────────────────────
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;
