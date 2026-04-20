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
import { MarkdownText } from "@/components/chat/MarkdownText";
import { colors, spacing, radii, fonts } from "@/constants/theme";

// ─── Suggestions (matching PM spec App28) ────────────────────
const SUGGESTIONS = [
  "Am I on track for my goals?",
  "Where am I wasting money?",
  "Can I afford a vacation?",
  "What bills can I cut?",
];

// ─── Inline action‑card types ────────────────────────────────
type ActionCardKind = "action" | "savings" | "allFixed";

interface ActionCardAction {
  kind: "action";
  label: string;
  description: string;
  buttons: { label: string; primary: boolean }[];
}

interface ActionCardSavings {
  kind: "savings";
  items: { label: string; amount: string }[];
}

interface ActionCardAllFixed {
  kind: "allFixed";
  items: { label: string; detail: string }[];
}

type ActionCard = ActionCardAction | ActionCardSavings | ActionCardAllFixed;

// ─── Extended message with optional action card ──────────────
interface DisplayMessage extends ChatMessage {
  actionCard?: ActionCard;
}

// ─── Charlie Avatar ──────────────────────────────────────────
function CharlieAvatar({ size = 24 }: { size?: number }) {
  return (
    <View
      style={[
        s.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text
        style={[
          s.avatarText,
          { fontSize: size * 0.5 },
        ]}
      >
        C
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function AskCharlieScreen() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100
      );
    }
  }, [messages]);

  // ── Send handler ─────────────────────────────────────────
  const handleSend = async (text?: string) => {
    const message = (text || input).trim();
    if (!message || sending) return;

    const userMsg: DisplayMessage = {
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

      // Parse reply for potential action cards
      const parsed = parseReplyForCards(result.reply);

      const assistantMsg: DisplayMessage = {
        role: "assistant",
        content: parsed.text,
        timestamp: new Date().toISOString(),
        actionCard: parsed.card,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: DisplayMessage = {
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

  const handleChipPress = (chipText: string) => {
    setInput(chipText);
    handleSend(chipText);
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(undefined);
  };

  // ── Render a single message row ──────────────────────────
  const renderMessage = ({ item }: { item: DisplayMessage }) => {
    const isUser = item.role === "user";

    if (isUser) {
      return (
        <View style={[s.bubble, s.userBubble]}>
          <Text style={[s.bubbleText, s.userText]}>{item.content}</Text>
        </View>
      );
    }

    // Assistant message — avatar on left
    return (
      <View>
        <View style={s.aiRow}>
          <CharlieAvatar size={24} />
          <View style={[s.bubble, s.aiBubble]}>
            <Text style={s.aiLabel}>CHARLIE</Text>
            <MarkdownText style={{ ...s.bubbleText, ...s.aiText }}>
              {item.content}
            </MarkdownText>
          </View>
        </View>
        {item.actionCard && (
          <View style={s.cardRow}>
            <View style={{ width: 24 }} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <InlineCard card={item.actionCard} />
            </View>
          </View>
        )}
      </View>
    );
  };

  // ── Welcome message (shown at top of conversation) ──────
  const renderHeader = () => (
    <View style={s.welcomeRow}>
      <Text style={s.timestamp}>Today</Text>
      <View style={s.aiRow}>
        <CharlieAvatar size={24} />
        <View style={[s.bubble, s.aiBubble]}>
          <Text style={s.aiLabel}>CHARLIE</Text>
          <Text style={[s.bubbleText, s.aiText]}>
            Hey there! I know your full financial picture. What do you want to
            know?
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={88}
    >
      {/* ── Header Bar ──────────────────────────────────── */}
      <View style={s.header}>
        <CharlieAvatar size={32} />
        <View style={s.headerText}>
          <Text style={s.headerTitle}>Charlie Chat</Text>
          <Text style={s.headerSub}>Ask anything about your money</Text>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={handleNewChat} style={s.closeBtn}>
            <Text style={s.closeBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Messages / Empty State ──────────────────────── */}
      {messages.length === 0 ? (
        <View style={s.emptyContainer}>
          <View style={s.emptyContent}>
            {renderHeader()}
          </View>

          {/* Suggestions pinned above input */}
          <View style={s.suggestionsSection}>
            <Text style={s.suggestionsLabel}>TRY ASKING</Text>
            {SUGGESTIONS.map((sug, i) => (
              <TouchableOpacity
                key={i}
                style={s.suggestionChip}
                onPress={() => handleChipPress(sug)}
                activeOpacity={0.7}
              >
                <Text style={s.suggestionArrow}>→</Text>
                <Text style={s.suggestionText}>{sug}</Text>
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
          ListHeaderComponent={renderHeader}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />
      )}

      {/* ── Typing indicator ────────────────────────────── */}
      {sending && (
        <View style={s.typingRow}>
          <ActivityIndicator size="small" color={colors.yellow} />
          <Text style={s.typingText}>Charlie is thinking...</Text>
        </View>
      )}

      {/* ── Input Bar ───────────────────────────────────── */}
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
          placeholder="Ask Charlie..."
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

// ─── Inline Action Card Component ────────────────────────────
function InlineCard({ card }: { card: ActionCard }) {
  switch (card.kind) {
    case "action":
      return (
        <View style={s.actionCard}>
          <Text style={s.actionCardLabel}>CHARLIE CAN DO THIS NOW</Text>
          <Text style={s.actionCardDesc}>{card.description}</Text>
          <View style={s.actionCardBtns}>
            {card.buttons.map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  s.actionCardBtn,
                  btn.primary ? s.actionCardBtnPrimary : s.actionCardBtnSecondary,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    s.actionCardBtnText,
                    btn.primary
                      ? s.actionCardBtnTextPrimary
                      : s.actionCardBtnTextSecondary,
                  ]}
                >
                  {btn.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );

    case "savings":
      return (
        <View style={s.savingsCard}>
          <Text style={s.savingsCardLabel}>SAVINGS FOUND</Text>
          {card.items.map((item, i) => (
            <View key={i} style={s.savingsRow}>
              <Text style={s.savingsRowLabel}>{item.label}</Text>
              <Text style={s.savingsRowAmount}>{item.amount}</Text>
            </View>
          ))}
        </View>
      );

    case "allFixed":
      return (
        <View style={s.fixedCard}>
          <Text style={s.fixedCardLabel}>ALL FIXED</Text>
          {card.items.map((item, i) => (
            <View key={i} style={s.fixedRow}>
              <Text style={s.fixedCheck}>✓</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.fixedRowLabel}>{item.label}</Text>
                <Text style={s.fixedRowDetail}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      );
  }
}

// ─── Parse reply for structured action cards ─────────────────
// In a future iteration the backend can return structured JSON.
// For now this is a simple pass-through — cards will be rendered
// when the backend explicitly sends JSON action-card payloads.
function parseReplyForCards(reply: string): {
  text: string;
  card?: ActionCard;
} {
  // Attempt to extract a JSON action card block if present
  const cardMatch = reply.match(/<!--ACTION_CARD([\s\S]*?)-->/);
  if (cardMatch) {
    try {
      const card = JSON.parse(cardMatch[1]) as ActionCard;
      const text = reply.replace(cardMatch[0], "").trim();
      return { text, card };
    } catch {
      // Malformed JSON — just show the raw text
    }
  }
  return { text: reply };
}

// ─── Styles ──────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0 },

  // ── Header ──────────────────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 54,
    paddingBottom: 14,
    backgroundColor: colors.navyMid,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerText: { flex: 1, marginLeft: 10 },
  headerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.cream,
  },
  headerSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: { fontSize: 11, fontWeight: "700", color: "#fff" },

  // ── Avatar ──────────────────────────────────────────────
  avatar: {
    backgroundColor: "rgba(22,40,68,0.8)",
    borderWidth: 1,
    borderColor: colors.borderMid,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontStyle: "italic",
    color: colors.cream,
    fontWeight: "400",
  },

  // ── Empty / Welcome State ───────────────────────────────
  emptyContainer: { flex: 1, justifyContent: "space-between" },
  emptyContent: { flex: 1 },
  welcomeRow: { padding: 18, paddingTop: 14 },
  timestamp: {
    fontSize: 9,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 10,
  },

  // ── Suggestions ─────────────────────────────────────────
  suggestionsSection: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  suggestionsLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderMid,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 6,
  },
  suggestionArrow: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 12,
    color: colors.cream,
  },

  // ── Messages ────────────────────────────────────────────
  messageList: { padding: 18, paddingBottom: spacing.sm },
  aiRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 2,
  },
  cardRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  bubble: {
    maxWidth: "80%",
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
    marginLeft: 8,
    marginBottom: 0,
  },
  aiLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: colors.sage,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: colors.textOnYellow },
  aiText: { color: colors.cream },

  // ── Typing ──────────────────────────────────────────────
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  typingText: { fontSize: 12, color: colors.textSecondary, marginLeft: 8 },

  // ── Input bar ───────────────────────────────────────────
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 18,
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
    backgroundColor: colors.navyLight,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { fontSize: 14, color: "#fff", fontWeight: "bold" },

  // ── Inline Action Card ──────────────────────────────────
  actionCard: {
    backgroundColor: colors.surface2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderMid,
    padding: 12,
    marginBottom: 10,
  },
  actionCardLabel: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: colors.yellow,
    marginBottom: 6,
  },
  actionCardDesc: {
    fontSize: 12,
    color: colors.cream,
    lineHeight: 18,
    marginBottom: 10,
  },
  actionCardBtns: { flexDirection: "row", gap: 6 },
  actionCardBtn: {
    flex: 1,
    height: 28,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  actionCardBtnPrimary: { backgroundColor: colors.navyLight },
  actionCardBtnSecondary: { backgroundColor: colors.surface3 },
  actionCardBtnText: { fontSize: 10, fontWeight: "700" },
  actionCardBtnTextPrimary: { color: "#fff" },
  actionCardBtnTextSecondary: { color: colors.textSecondary },

  // ── Savings Card ────────────────────────────────────────
  savingsCard: {
    backgroundColor: colors.surface2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderMid,
    padding: 12,
    marginBottom: 10,
  },
  savingsCardLabel: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: colors.yellow,
    marginBottom: 8,
  },
  savingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 5,
  },
  savingsRowLabel: { fontSize: 11, color: colors.cream },
  savingsRowAmount: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.yellow,
  },

  // ── All Fixed Card ──────────────────────────────────────
  fixedCard: {
    backgroundColor: "rgba(168,197,160,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(168,197,160,0.25)",
    padding: 12,
    marginBottom: 10,
  },
  fixedCardLabel: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: colors.sage,
    marginBottom: 8,
  },
  fixedRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  fixedCheck: {
    fontSize: 12,
    color: colors.sage,
    marginRight: 8,
    marginTop: 1,
  },
  fixedRowLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.cream,
  },
  fixedRowDetail: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
