/**
 * App.tsx — Habit Tracker
 *
 * Root component. Handles all state, persistence, and rendering.
 * No external state management — just React hooks + AsyncStorage.
 *
 * Data model:
 *   Habit      { id, name, createdAt }
 *   Completion { habitId, date }       ← one per habit per day
 *
 * Persistence: AsyncStorage (key-value, survives app restarts)
 * Streak logic: counts consecutive days backward from today
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, StatusBar, Alert, Platform,
  KeyboardAvoidingView, Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Habit {
  id: string;
  name: string;
  createdAt: string;
}

interface Completion {
  habitId: string;
  date: string; // YYYY-MM-DD
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const HABITS_KEY = '@habits'; // AsyncStorage key for habit list
const COMPLETIONS_KEY = '@completions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns today's date as YYYY-MM-DD in local time */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Calculates the current streak for a habit.
 * Walks backwards from today; breaks on any missed day.
 * Today being incomplete does NOT break the streak (gives user time to check in).
 */
function getStreak(habitId: string, completions: Completion[]): number {
  const dates = completions
    .filter((c) => c.habitId === habitId)
    .map((c) => c.date)
    .sort()
    .reverse();

  if (!dates.length) return 0;

  let streak = 0;
  const cur = new Date();

  for (let i = 0; i < 365; i++) {
    const d = cur.toISOString().slice(0, 10);
    if (dates.includes(d)) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    } else if (i === 0) {
      // First iteration = today; skip if not yet completed
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [input, setInput] = useState('');

  // Load persisted data on mount
  useEffect(() => {
    (async () => {
      const h = await AsyncStorage.getItem(HABITS_KEY);
      const c = await AsyncStorage.getItem(COMPLETIONS_KEY);
      if (h) setHabits(JSON.parse(h));
      if (c) setCompletions(JSON.parse(c));
    })();
  }, []);

  // Persist helpers — update state and AsyncStorage together
  const saveHabits = useCallback(async (updated: Habit[]) => {
    setHabits(updated);
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updated));
  }, []);

  const saveCompletions = useCallback(async (updated: Completion[]) => {
    setCompletions(updated);
    await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(updated));
  }, []);

  // Add a new habit from the input field
  const addHabit = async () => {
    const name = input.trim();
    if (!name) return;
    const habit: Habit = { id: Date.now().toString(), name, createdAt: new Date().toISOString() };
    await saveHabits([...habits, habit]);
    setInput('');
    Keyboard.dismiss();
  };

  // Long-press to delete, with confirmation alert
  const deleteHabit = (id: string) => {
    Alert.alert('Delete habit?', 'This will remove all its history too.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await saveHabits(habits.filter((h) => h.id !== id));
          await saveCompletions(completions.filter((c) => c.habitId !== id));
        },
      },
    ]);
  };

  // Toggle today's completion on/off
  const toggleComplete = async (habitId: string) => {
    const t = todayStr();
    const already = completions.some((c) => c.habitId === habitId && c.date === t);
    const updated = already
      ? completions.filter((c) => !(c.habitId === habitId && c.date === t))
      : [...completions, { habitId, date: t }];
    await saveCompletions(updated);
  };

  // Derived stats for the dashboard
  const today = todayStr();
  const completedToday = habits.filter((h) =>
    completions.some((c) => c.habitId === h.id && c.date === today)
  ).length;
  const longestStreak = habits.reduce((max, h) => Math.max(max, getStreak(h.id, completions)), 0);

  // ─── Render ─────────────────────────────────────────────────────────────────

  const renderHabit = ({ item }: { item: Habit }) => {
    const done = completions.some((c) => c.habitId === item.id && c.date === today);
    const streak = getStreak(item.id, completions);

    return (
      <TouchableOpacity
        style={[styles.habitCard, done && styles.habitCardDone]}
        onPress={() => toggleComplete(item.id)}         // tap = toggle
        onLongPress={() => deleteHabit(item.id)}        // long press = delete
        activeOpacity={0.7}
      >
        {/* Completion circle */}
        <View style={[styles.checkbox, done && styles.checkboxDone]}>
          {done && <Text style={styles.checkmark}>✓</Text>}
        </View>

        {/* Habit name */}
        <Text style={[styles.habitName, done && styles.habitNameDone]}>{item.name}</Text>

        {/* Streak badge — only shown when streak > 0 */}
        {streak > 0 && (
          <Text style={styles.streak}>🔥 {streak}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      {/* Push input up when keyboard appears on iOS */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Header */}
          <Text style={styles.title}>Habits</Text>
          <Text style={styles.dateLabel}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>

          {/* Stats dashboard */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{habits.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#34C759' }]}>{completedToday}</Text>
              <Text style={styles.statLabel}>Done Today</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#FF9500' }]}>{longestStreak}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
          </View>

          {/* Habit list */}
          <FlatList
            data={habits}
            keyExtractor={(item) => item.id}
            renderItem={renderHabit}
            style={styles.list}
            contentContainerStyle={habits.length === 0 && styles.emptyContainer}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No habits yet.{'\n'}Add one below 👇</Text>
            }
            showsVerticalScrollIndicator={false}
          />

          {/* Add habit input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Add a habit..."
              placeholderTextColor="#999"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={addHabit}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addButton} onPress={addHabit}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// Designed to feel native iOS: system blue/green/orange, rounded cards, subtle shadows

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },  // iOS system background
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  title: { fontSize: 34, fontWeight: '700', color: '#1C1C1E', letterSpacing: 0.3 },
  dateLabel: { fontSize: 15, color: '#8E8E93', marginTop: 2, marginBottom: 16 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: '#007AFF' },
  statLabel: { fontSize: 11, color: '#8E8E93', marginTop: 2, fontWeight: '500' },

  list: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#8E8E93', fontSize: 16, lineHeight: 24 },

  habitCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  habitCardDone: { backgroundColor: '#F0FFF4' },  // subtle green tint when complete
  checkbox: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: '#D1D1D6',
    marginRight: 12, alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#34C759', borderColor: '#34C759' },  // iOS green
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  habitName: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1C1C1E' },
  habitNameDone: { color: '#8E8E93', textDecorationLine: 'line-through' },
  streak: { fontSize: 13, fontWeight: '600', color: '#FF9500' },

  inputRow: {
    flexDirection: 'row', gap: 10,
    paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 4 : 12,
  },
  input: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1C1C1E',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  addButton: {
    backgroundColor: '#007AFF', borderRadius: 14,
    width: 52, alignItems: 'center', justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 34 },
});
