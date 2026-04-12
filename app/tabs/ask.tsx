import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { sendMessage, ChatMessage } from "@/services/chat";
import { colors, spacing, radii } from "@/constants/theme";

const SUGGESTIONS = [
  "Am I on track?",
  "Where did I spend most?",
  "Save $500/mo?",
];

export default function AskCharlieScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const message = (text || input).trim();
    if (!message || sending) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const result = await sendMessage(message, sessionId);
      setSessionId(result.sessionId);
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: result.reply,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        role: "assistant",
        content:
          "Sorry, I'm having trouble right now. Check that the backend is running and try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  // Chip tap → immediate send (no manual submit required)
  const handleChipPress = (chipText: string) => {
    setInput(chipText);
    handleSend(chipText);
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(undefined);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={[
          s.bubble,
          isUser ? s.userBubble : s.aiBubble,
        ]}
      >
        {!isUser && <Text style={s.aiLabel}>CHARLIE</Text>}
        <Text style={[s.bubbleText, isUser ? s.userText : s.aiText]}>
          {item.content}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={88}
    >
      {messages.length === 0 ? (
        <View style={s.emptyState}>
          <Text style={s.emptyTitle}>Ask Charlie</Text>
          <View style={s.chipRow}>
            {SUGGESTIONS.map((sug, i) => (
              <TouchableOpacity
                key={i}
                style={s.chip}
                onPress={() => handleChipPress(sug)}
                activeOpacity={0.7}
              >
                <Text style={s.chipText}>{sug}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={s.messageList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />
      )}

      {sending && (
        <View style={s.typingRow}>
          <ActivityIndicator size="small" color={colors.yellow} />
          <Text style={s.typingText}>Charlie is thinking...</Text>
        </View>
      )}

      {/* ─── Input Bar ─────────────────────────────── */}
      <View style={s.inputBar}>
        {messages.length > 0 && (
          <TouchableOpacity onPress={handleNewChat} style={s.newBtn}>
            <Text style={s.newBtnIcon}>+</Text>
          </TouchableOpacity>
        )}
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask anything..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={() => handleSend()}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || sending) && s.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!input.trim() || sending}
        >
          <Text style={s.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0 },

  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xxxl,
  },
  emptyTitle: {
    fontSize: 24,
    fontStyle: "italic",
    color: colors.cream,
    marginBottom: spacing.xxl,
  },
  chipRow: {
    width: "100%",
  },
  chip: {
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderMid,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: spacing.sm,
  },
  chipText: {
    fontSize: 14,
    color: colors.cream,
  },

  // Messages
  messageList: { padding: spacing.lg, paddingBottom: spacing.sm },
  bubble: {
    maxWidth: "82%",
    padding: 14,
    borderRadius: radii.lg,
    marginBottom: 10,
  },
  userBubble: {
    backgroundColor: colors.yellow,
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.surface2,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  aiLabel: {
    fontSize: 10,
    fontWeight: "400",
    color: colors.sage,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: colors.textOnYellow },
  aiText: { color: colors.cream },

  // Typing
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  typingText: { fontSize: 12, color: colors.textSecondary, marginLeft: 8 },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.navyMid,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  newBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  newBtnIcon: { fontSize: 20, color: colors.textSecondary, fontWeight: "bold" },
  input: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderMid,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: colors.cream,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.yellow,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
  },
  sendBtnDisabled: { backgroundColor: colors.yellowDim, opacity: 0.5 },
  sendIcon: { fontSize: 18, color: colors.textOnYellow, fontWeight: "bold" },
});
