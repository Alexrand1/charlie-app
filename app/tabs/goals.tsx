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

const GOAL_TYPES = [
  { key: "save", label: "Save", icon: "💰", color: "#10B981" },
  { key: "spend_limit", label: "Spend Limit", icon: "🎯", color: "#F59E0B" },
  { key: "pay_off", label: "Pay Off", icon: "💳", color: "#EF4444" },
];

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form state
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
      Alert.alert(
        "Error",
        err.response?.data?.error || err.message || "Could not save goal"
      );
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1B2A4A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎯</Text>
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptySubtitle}>
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
                style={styles.goalCard}
                onPress={() => openEditModal(goal)}
                onLongPress={() => handleDelete(goal)}
                activeOpacity={0.7}
              >
                <View style={styles.goalHeader}>
                  <Text style={styles.goalIcon}>{info.icon}</Text>
                  <View style={styles.goalInfo}>
                    <Text style={styles.goalLabel}>{goal.label}</Text>
                    <Text style={styles.goalType}>{info.label}</Text>
                  </View>
                  <Text style={styles.goalAmount}>
                    ${goal.currentAmount.toLocaleString("en-US", {
                      minimumFractionDigits: 0,
                    })}
                    <Text style={styles.goalTarget}>
                      {" / $"}
                      {goal.targetAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                      })}
                    </Text>
                  </Text>
                </View>

                {/* Progress bar */}
                <View style={styles.progressBg}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.round(progress * 100)}%`,
                        backgroundColor: info.color,
                      },
                    ]}
                  />
                </View>

                <View style={styles.goalFooter}>
                  <Text style={styles.goalPercent}>
                    {Math.round(progress * 100)}%
                  </Text>
                  {goal.deadline && (
                    <Text style={styles.goalDeadline}>
                      Due {goal.deadline}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openCreateModal}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Create/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingGoal ? "Edit Goal" : "New Goal"}
            </Text>

            {/* Type selector (only on create) */}
            {!editingGoal && (
              <View style={styles.typeRow}>
                {GOAL_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.key}
                    style={[
                      styles.typeChip,
                      formType === t.key && {
                        backgroundColor: t.color + "20",
                        borderColor: t.color,
                      },
                    ]}
                    onPress={() => setFormType(t.key)}
                  >
                    <Text style={styles.typeChipIcon}>{t.icon}</Text>
                    <Text
                      style={[
                        styles.typeChipLabel,
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
              style={styles.modalInput}
              placeholder="Goal name (e.g., Emergency Fund)"
              placeholderTextColor="#94A3B8"
              value={formLabel}
              onChangeText={setFormLabel}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Target amount"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={formTarget}
              onChangeText={setFormTarget}
            />

            {editingGoal && (
              <TextInput
                style={styles.modalInput}
                placeholder="Current amount"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={formCurrent}
                onChangeText={setFormCurrent}
              />
            )}

            <TextInput
              style={styles.modalInput}
              placeholder="Deadline (YYYY-MM-DD, optional)"
              placeholderTextColor="#94A3B8"
              value={formDeadline}
              onChangeText={setFormDeadline}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  content: { padding: 20, paddingBottom: 80 },

  // Empty state
  emptyState: { alignItems: "center", marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: "bold", color: "#1B2A4A", marginBottom: 8 },
  emptySubtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },

  // Goal cards
  goalCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  goalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  goalIcon: { fontSize: 28, marginRight: 12 },
  goalInfo: { flex: 1 },
  goalLabel: { fontSize: 16, fontWeight: "600", color: "#1B2A4A" },
  goalType: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  goalAmount: { fontSize: 16, fontWeight: "bold", color: "#1B2A4A" },
  goalTarget: { fontSize: 14, fontWeight: "normal", color: "#94A3B8" },

  // Progress bar
  progressBg: {
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: "100%", borderRadius: 4 },

  goalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  goalPercent: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  goalDeadline: { fontSize: 13, color: "#94A3B8" },

  // FAB
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1B2A4A",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  fabIcon: { fontSize: 28, color: "#fff", fontWeight: "300" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1B2A4A",
    marginBottom: 20,
  },

  // Type selector
  typeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
  },
  typeChipIcon: { fontSize: 16, marginRight: 4 },
  typeChipLabel: { fontSize: 13, fontWeight: "600", color: "#64748B" },

  // Form inputs
  modalInput: {
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#1E293B",
    marginBottom: 12,
  },

  // Buttons
  modalButtons: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#64748B" },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#1B2A4A",
    alignItems: "center",
  },
  saveBtnDisabled: { backgroundColor: "#CBD5E1" },
  saveBtnText: { fontSize: 15, fontWeight: "600", color: "#fff" },
});
