import { Alert } from "react-native";

/**
 * Copy text to clipboard.
 * Uses expo-clipboard when installed, otherwise falls back to Alert.
 * Install: npx expo install expo-clipboard
 */
export async function copyToClipboard(text: string, label = "Copied!") {
  try {
    const Clipboard = require("expo-clipboard");
    await Clipboard.setStringAsync(text);
    Alert.alert(label, "Copied to clipboard.");
  } catch {
    // expo-clipboard not installed — fall back
    Alert.alert(label, text);
  }
}
