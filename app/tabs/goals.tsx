import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  Goal,
} from "@/services/goals";
import { colors, spacing, radii } from "@/constants/theme";

const GOAL_TYPES = [
  { key: "save", label: "Save", icon: "💰", color: colors.sage },
  { key: "spend_limit", label: "Limit", icon: "🎯", color: colors.yellow },
  { key: "pay_off", label: "Pay Off", icon: "💳", color: colors.negative },
];

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [formType, setFormType] = useState("save");
  const [formLabel, setFormLabel] = useState("");
  const [formTarget, setFormTarget] = useState("");
  const [formCurrent, setFormCurrent] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchGoals = useCallback(async () => {
    try {
      const data = await getGoals();
      setGoals(data);
    } catch {
      // No goals yet
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGoals();
  }, [fetchGoals]);

  const openCreateModal = () => {
    setEditingGoal(null);
    setFormType("save");
    setFormLabel("");
    setFormTarget("");
    setFormCurrent("");
    setFormDeadline("");
    setShowModal(true);
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormType(goal.type);
    setFormLabel(goal.label);
    setFormTarget(goal.targetAmount.toString());
    setFormCurrent(goal.currentAmount.toString());
    setFormDeadline(goal.deadline || "");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formLabel.trim() || !formTarget.trim()) {
      Alert.alert("Missing Fields", "Please enter a label and target amount.");
      return;
    }
    setSaving(true);
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.goalId, {
          label: formLabel.trim(),
          targetAmount: parseFloat(formTarget),
          currentAmount: parseFloat(formCurrent) || 0,
          deadline: formDeadline.trim() || undefined,
        });
      } else {
        await createGoal({
          type: formType,
          label: formLabel.trim(),
          targetAmount: parseFloat(formTarget),
          deadline: formDeadline.trim() || undefined,
        });
      }
      setShowModal(false);
      fetchGoals();
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (goal: Goal) => {
    Alert.alert("Delete Goal", `Remove "${goal.label}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteGoal(goal.goalId);
            fetchGoals();
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  const getProgress = (goal: Goal) => {
    if (goal.targetAmount <= 0) return 0;
    return Math.min(goal.currentAmount / goal.targetAmount, 1);
  };

  const getTypeInfo = (type: string) =>
    GOAL_TYPES.find((t) => t.key === type) || GOAL_TYPES[0];

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={colors.yellow} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.yellow}
          />
        }
      >
        {goals.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>🎯</Text>
            <Text style={s.emptyTitle}>No goals yet</Text>
            <Text style={s.emptySubtitle}>
              Set savings targets, spending limits, or payoff goals to stay on
              track.
            </Text>
          </View>
        ) : (
          goals.map((goal) => {
            const info = getTypeInfo(goal.type);
            const progress = getProgress(goal);
            return (
              <TouchableOpacity
                key={goal.goalId}
                style={s.goalCard}
                onPress={() => openEditModal(goal)}
                onLongPress={() => handleDelete(goal)}
                activeOpacity={0.7}
              >
                <View style={s.goalHeader}>
                  <Text style={s.goalIcon}>{info.icon}</Text>
                  <View style={s.goalInfo}>
                    <Text style={s.goalLabel}>{goal.label}</Text>
                    <Text style={s.goalType}>{info.label}</Text>
                  </View>
                  <Text style={s.goalAmount}>
                    ${goal.currentAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 0,
                    })}
                    <Text style={s.goalTarget}>
                      {" / $"}
                      {goal.targetAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                      })}
                    </Text>
                  </Text>
                </View>

                <View style={s.progressBg}>
                  <View
                    style={[
                      s.progressFill,
                      {
                        width: `${Math.round(progress * 100)}%`,
                        backgroundColor: info.color,
                      },
                    ]}
                  />
                </View>

                <View style={s.goalFooter}>
                  <Text style={s.goalPercent}>
                    {Math.round(progress * 100)}%
                  </Text>
                  {goal.deadline && (
                    <Text style={s.goalDeadline}>Due {goal.deadline}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={openCreateModal}>
        <Text style={s.fabIcon}>+</Text>
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>
              {editingGoal ? "Edit Goal" : "New Goal"}
            </Text>

            {!editingGoal && (
              <View style={s.typeRow}>
                {GOAL_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={[
                      s.typeChip,
                      formType === t.key && {
                        borderColor: t.color,
                      },
                    ]}
                    onPress={() => setFormType(t.key)}
                  >
                    <Text style={s.typeChipIcon}>{t.icon}</Text>
                    <Text
                      style={[
                        s.typeChipLabel,
                        formType === t.key && { color: t.color },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TextInput
              style={s.modalInput}
              placeholder="Goal name (e.g., Emergency Fund)"
              placeholderTextColor={colors.textMuted}
              value={formLabel}
              onChangeText={setFormLabel}
            />
            <TextInput
              style={s.modalInput}
              placeholder="Target amount"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={formTarget}
              onChangeText={setFormTarget}
            />
            {editingGoal && (
              <TextInput
                style={s.modalInput}
                placeholder="Current amount"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={formCurrent}
                onChangeText={setFormCurrent}
              />
            )}
            <TextInput
              style={s.modalInput}
              placeholder="Deadline (YYYY-MM-DD, optional)"
              placeholderTextColor={colors.textMuted}
              value={formDeadline}
              onChangeText={setFormDeadline}
            />

            <View style={s.modalButtons}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, saving && s.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.textOnYellow} size="small" />
                ) : (
                  <Text style={s.saveBtnText}>
                    {editingGoal ? "Update" : "Create"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface0 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface0,
  },
  content: { padding: spacing.xl, paddingBottom: 80 },

  // Empty state
  emptyState: { alignItems: "center", marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.lg },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.cream,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacing.xl,
  },

  // Goal cards
  goalCard: {
    backgroundColor: colors.surface1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  goalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  goalIcon: { fontSize: 28, marginRight: 12 },
  goalInfo: { flex: 1 },
  goalLabel: { fontSize: 16, fontWeight: "600", color: colors.cream },
  goalType: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  goalAmount: { fontSize: 16, fontWeight: "bold", color: colors.cream },
  goalTarget: { fontSize: 14, fontWeight: "normal", color: colors.textSecondary },

  progressBg: {
    height: 8,
    backgroundColor: colors.surface2,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  progressFill: { height: "100%", borderRadius: 4 },

  goalFooter: { flexDirection: "row", justifyContent: "space-between" },
  goalPercent: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  goalDeadline: { fontSize: 13, color: colors.textSecondary },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.yellow,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  fabIcon: { fontSize: 28, color: colors.textOnYellow, fontWeight: "300" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xxl,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.cream,
    marginBottom: spacing.xl,
  },

  typeRow: { flexDirection: "row", gap: 8, marginBottom: spacing.lg },
  typeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.borderMid,
    backgroundColor: colors.surface2,
  },
  typeChipIcon: { fontSize: 16, marginRight: 4 },
  typeChipLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },

  modalInput: {
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderMid,
    padding: 14,
    fontSize: 15,
    color: colors.cream,
    marginBottom: spacing.md,
  },

  modalButtons: { flexDirection: "row", gap: 12, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.surface2,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: colors.textSecondary },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.yellow,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 15, fontWeight: "600", color: colors.textOnYellow },
});
