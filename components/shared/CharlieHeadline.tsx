import { Text, StyleSheet } from "react-native";
import { colors } from "@/constants/theme";

interface CharlieHeadlineProps {
  plainPrefix?: string;
  italicEmphasis: string;
  plainSuffix?: string;
  size?: number;
}

export function CharlieHeadline({
  plainPrefix,
  italicEmphasis,
  plainSuffix,
  size = 28,
}: CharlieHeadlineProps) {
  return (
    <Text style={[s.base, { fontSize: size }]}>
      {plainPrefix}
      <Text style={s.italic}>{italicEmphasis}</Text>
      {plainSuffix}
    </Text>
  );
}

export function CharlieSub({ text }: { text: string }) {
  return <Text style={s.sub}>{text}</Text>;
}

const s = StyleSheet.create({
  base: {
    fontWeight: "400",
    color: colors.cream,
    lineHeight: 34,
  },
  italic: {
    fontStyle: "italic",
  },
  sub: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
});
