/**
 * Charlie Design System v2.0 — Light Theme
 * Source of truth for color, type, and component behavior.
 *
 * Palette: PM's CharlieDesignSystem.swift (light / cream)
 * Fonts: DM Sans (body/UI), Instrument Serif (headlines/numbers)
 * Install via: npx expo install @expo-google-fonts/dm-sans
 *              npx expo install @expo-google-fonts/instrument-serif
 *              npx expo install expo-font
 */

// ─── Core Brand Colors ───────────────────────────────────────
export const colors = {
  // Primary brand
  blue: "#0D1460",        // charlieBlue — primary brand
  blueLt: "#1A2280",      // charlieBlueLt — lighter accent
  blueDim: "#080E45",     // charlieBlueDim — darker blue
  cream: "#F5F0E8",       // charlieCream — screen background
  ink: "#1A1410",         // charlieInk — near-black text
  sand: "#EDE7D9",        // charlieSand — card / surface
  sand2: "#E0D9CA",       // charlieSand2 — borders
  sand3: "#CFC8B5",       // charlieSand3 — dividers, dots
  muted: "#8A7E72",       // charlieMuted — secondary text
  mutedLt: "#B0A699",     // charlieMutedLt — lighter muted
  canvas: "#E8E2D5",      // charlieCanvas — bg behind mockups

  // Legacy aliases (ease migration — remove later)
  navy: "#0D1460",
  navyMid: "#0D1460",
  navyLight: "#0D1460",
  yellow: "#0D1460",       // CTAs are now blue
  yellowDim: "#080E45",
  sage: "#3DAA6E",

  // Semantic
  positive: "#3DAA6E",     // charlieGreen
  negative: "#C94040",     // charlieRed
  warning: "#FF6B00",      // charlieOrange
  neutral: "#8A7E72",

  // Invest palette
  investGreen: "#1A7A3A",
  investDark: "#0F3D1F",
  accentGreen: "#1DB954",

  // Surfaces (light theme order)
  surface0: "#F5F0E8",     // Screen / page bg (cream)
  surface1: "#EDE7D9",     // Card bg (sand)
  surface2: "#E0D9CA",     // Elevated card / input bg (sand2)
  surface3: "rgba(26,20,16,0.04)", // Ghost / overlay

  // Borders
  borderSubtle: "#E0D9CA", // sand2
  borderMid: "#CFC8B5",    // sand3

  // Text
  textPrimary: "#1A1410",  // Ink
  textSecondary: "#8A7E72", // Muted
  textMuted: "#B0A699",    // MutedLt
  textOnBlue: "#F5F0E8",   // Cream text on blue bg
  textOnYellow: "#F5F0E8", // Legacy alias
} as const;

// ─── Fonts ───────────────────────────────────────────────────
// DM Sans for body/UI, Instrument Serif for headlines/numbers.
export const fonts = {
  body: "DMSans_400Regular",               // UI labels, buttons, body, nav
  bodySemibold: "DMSans_600SemiBold",
  bodyBold: "DMSans_700Bold",
  brand: "InstrumentSerif_400Regular_Italic", // Hero text, page titles
  brandRegular: "InstrumentSerif_400Regular",

  // System fallbacks (used until custom fonts load)
  bodyFallback: "System",
  monoFallback: "Courier",
} as const;

// ─── Type Scale ──────────────────────────────────────────────
export const type = {
  hero: {
    fontSize: 32,
    fontFamily: fonts.brand,
    fontWeight: "400" as const,
    fontStyle: "italic" as const,
    color: colors.ink,
  },
  pageTitle: {
    fontSize: 24,
    fontFamily: fonts.brand,
    fontWeight: "400" as const,
    fontStyle: "italic" as const,
    color: colors.ink,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: fonts.bodySemibold,
    fontWeight: "600" as const,
    color: colors.ink,
  },
  body: {
    fontSize: 14,
    fontFamily: fonts.body,
    fontWeight: "400" as const,
    color: colors.ink,
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.bodySemibold,
    fontWeight: "600" as const,
    color: colors.muted,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  metadata: {
    fontSize: 10,
    fontFamily: fonts.body,
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
