import React from "react";
import { Text, TextStyle, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

interface MarkdownTextProps {
  children: string;
  style?: TextStyle;
}

/**
 * Lightweight inline markdown renderer for chat bubbles.
 * Supports: **bold**, *italic*, `code`, and plain text.
 * Does NOT handle block-level elements (headers, lists, etc.) —
 * those are stripped to plain text.
 */
export function MarkdownText({ children, style }: MarkdownTextProps) {
  const segments = parseInlineMarkdown(children);

  return (
    <Text style={style}>
      {segments.map((seg, i) => {
        switch (seg.type) {
          case "bold":
            return (
              <Text key={i} style={s.bold}>
                {seg.text}
              </Text>
            );
          case "italic":
            return (
              <Text key={i} style={s.italic}>
                {seg.text}
              </Text>
            );
          case "code":
            return (
              <Text key={i} style={s.code}>
                {seg.text}
              </Text>
            );
          case "boldItalic":
            return (
              <Text key={i} style={s.boldItalic}>
                {seg.text}
              </Text>
            );
          default:
            return <Text key={i}>{seg.text}</Text>;
        }
      })}
    </Text>
  );
}

type SegmentType = "text" | "bold" | "italic" | "boldItalic" | "code";

interface Segment {
  type: SegmentType;
  text: string;
}

function parseInlineMarkdown(input: string): Segment[] {
  // Strip block-level markdown (headers, horizontal rules)
  let cleaned = input
    .replace(/^#{1,6}\s+/gm, "") // headers
    .replace(/^[-*_]{3,}\s*$/gm, "") // horizontal rules
    .replace(/^>\s?/gm, "") // blockquotes
    .replace(/^[-*+]\s+/gm, "• ") // unordered lists → bullet
    .replace(/^\d+\.\s+/gm, ""); // ordered lists → plain

  const segments: Segment[] = [];
  // Regex matches: ***bold italic***, **bold**, *italic*, `code`
  const pattern = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(cleaned)) !== null) {
    // Add preceding plain text
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        text: cleaned.slice(lastIndex, match.index),
      });
    }

    if (match[2]) {
      segments.push({ type: "boldItalic", text: match[2] });
    } else if (match[3]) {
      segments.push({ type: "bold", text: match[3] });
    } else if (match[4]) {
      segments.push({ type: "italic", text: match[4] });
    } else if (match[5]) {
      segments.push({ type: "code", text: match[5] });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining plain text
  if (lastIndex < cleaned.length) {
    segments.push({ type: "text", text: cleaned.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", text: cleaned }];
}

const s = StyleSheet.create({
  bold: {
    fontWeight: "700",
  },
  italic: {
    fontStyle: "italic",
  },
  boldItalic: {
    fontWeight: "700",
    fontStyle: "italic",
  },
  code: {
    fontFamily: "Courier",
    fontSize: 13,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 3,
  },
});
