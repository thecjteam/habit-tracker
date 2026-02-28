/**
 * App.tsx — Habit Tracker
 *
 * Root component. Handles all state, persistence, and rendering.
 * No external state management — just React hooks + AsyncStorage.
 *
 * Data model:
 *   Habit      { id, name, createdAt, videoId, videoTitle }
 *   Completion { habitId, date }
 *
 * Persistence: AsyncStorage (key-value, survives app restarts)
 * Streak logic: counts consecutive days backward from today
 * Video: curated keyword match via lib/videos.ts on habit creation
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, StatusBar, Alert, Platform,
  KeyboardAvoidingView, Keyboard, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import YoutubePlayer from 'react-native-youtube-iframe';
import { suggestVideo } from './lib/videos';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Habit {
  id: string;
  name: string;
  createdAt: string;
  videoId: string;       // suggested YouTube video ID
  videoTitle: string;    // human-readable title for the video
}

interface Completion {
  habitId: string;
  date: string; // YYYY-MM-DD
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const HABITS_KEY = '@habits'; // AsyncStorage key for habit list
const COMPLETIONS_KEY = '@completions';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns today's date as YYYY-MM-DD */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns the last N dates as YYYY-MM-DD strings, ending today */
function lastNDays(n: number): string[] {
  const days: string[] = [];
  const cur = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(cur);
    d.setDate(cur.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/**
 * Calculates the current streak for a habit.
 * Today being incomplete does NOT break the streak.
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
      cur.setDate(cur.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ─── WeekDots ─────────────────────────────────────────────────────────────────

/** Mini 7-dot row showing past week's completion history */
function WeekDots({ habitId, completions }: { habitId: string; completions: Completion[] }) {
  const days = lastNDays(7);
  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const dots = days.map((date) => {
    const done = completions.some((c) => c.habitId === habitId && c.date === date);
    const dayIndex = (new Date(date).getUTCDay() + 6) % 7;
    return { date, done, label: DAY_LABELS[dayIndex] };
  });

  return (
    <View style={dotStyles.row}>
      {dots.map(({ date, done, label }) => (
        <View key={date} style={dotStyles.dotWrapper}>
          <View style={[dotStyles.dot, done ? dotStyles.dotDone : dotStyles.dotEmpty]} />
          <Text style={dotStyles.label}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, marginTop: 8 },
  dotWrapper: { alignItems: 'center', gap: 3 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotDone: { backgroundColor: '#34C759' },
  dotEmpty: { backgroundColor: '#D1D1D6' },
  label: { fontSize: 9, color: '#8E8E93', fontWeight: '500' },
});

// ─── HabitCard ────────────────────────────────────────────────────────────────

const CARD_WIDTH = Dimensions.get('window').width - 40; // full width minus horizontal padding
const VIDEO_HEIGHT = Math.round(CARD_WIDTH * 9 / 16);  // 16:9 aspect ratio

/**
 * Expandable habit card.
 * Tapping the card toggles today's completion.
 * Tapping the "Watch" button expands/collapses the embedded YouTube player.
 */
function HabitCard({
  habit, completions, today,
  onToggle, onDelete,
}: {
  habit: Habit;
  completions: Completion[];
  today: string;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showVideo, setShowVideo] = useState(false);
  const done = completions.some((c) => c.habitId === habit.id && c.date === today);
  const streak = getStreak(habit.id, completions);

  return (
    <View style={[cardStyles.card, done && cardStyles.cardDone]}>
      {/* Top row: checkbox + name + streak + watch button */}
      <TouchableOpacity
        style={cardStyles.row}
        onPress={() => onToggle(habit.id)}
        onLongPress={() => onDelete(habit.id)}
        activeOpacity={0.7}
      >
        <View style={[cardStyles.checkbox, done && cardStyles.checkboxDone]}>
          {done && <Text style={cardStyles.checkmark}>✓</Text>}
        </View>
        <Text style={[cardStyles.habitName, done && cardStyles.habitNameDone]}>{habit.name}</Text>
        {streak > 0 && <Text style={cardStyles.streak}>🔥 {streak}</Text>}
        {/* Watch / hide video toggle */}
        <TouchableOpacity
          style={[cardStyles.watchBtn, showVideo && cardStyles.watchBtnActive]}
          onPress={() => setShowVideo((v) => !v)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[cardStyles.watchBtnText, showVideo && cardStyles.watchBtnTextActive]}>
            {showVideo ? 'Hide' : '▶'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* 7-day dot row */}
      <WeekDots habitId={habit.id} completions={completions} />

      {/* Embedded YouTube player — shown when expanded */}
      {showVideo && (
        <View style={cardStyles.videoWrapper}>
          <Text style={cardStyles.videoTitle} numberOfLines={1}>{habit.videoTitle}</Text>
          <YoutubePlayer
            height={VIDEO_HEIGHT}
            width={CARD_WIDTH - 32} // card padding
            videoId={habit.videoId}
            play={false}
          />
        </View>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardDone: { backgroundColor: '#F0FFF4' },
  row: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: '#D1D1D6',
    marginRight: 12, alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#34C759', borderColor: '#34C759' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  habitName: { flex: 1, fontSize: 16, fontWeight: '500', color: '#1C1C1E' },
  habitNameDone: { color: '#8E8E93', textDecorationLine: 'line-through' },
  streak: { fontSize: 13, fontWeight: '600', color: '#FF9500', marginRight: 8 },
  watchBtn: {
    backgroundColor: '#F2F2F7', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  watchBtnActive: { backgroundColor: '#007AFF' },
  watchBtnText: { fontSize: 12, fontWeight: '600', color: '#007AFF' },
  watchBtnTextActive: { color: '#fff' },
  videoWrapper: { marginTop: 12 },
  videoTitle: { fontSize: 12, color: '#8E8E93', marginBottom: 6, fontStyle: 'italic' },
});

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    (async () => {
      const h = await AsyncStorage.getItem(HABITS_KEY);
      const c = await AsyncStorage.getItem(COMPLETIONS_KEY);
      if (h) setHabits(JSON.parse(h));
      if (c) setCompletions(JSON.parse(c));
    })();
  }, []);

  const saveHabits = useCallback(async (updated: Habit[]) => {
    setHabits(updated);
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(updated));
  }, []);

  const saveCompletions = useCallback(async (updated: Completion[]) => {
    setCompletions(updated);
    await AsyncStorage.setItem(COMPLETIONS_KEY, JSON.stringify(updated));
  }, []);

  const addHabit = async () => {
    const name = input.trim();
    if (!name) return;
    const { videoId, videoTitle } = suggestVideo(name); // match a video on creation
    const habit: Habit = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
      videoId,
      videoTitle,
    };
    await saveHabits([...habits, habit]);
    setInput('');
    Keyboard.dismiss();
  };

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

  const toggleComplete = async (habitId: string) => {
    const t = todayStr();
    const already = completions.some((c) => c.habitId === habitId && c.date === t);
    const updated = already
      ? completions.filter((c) => !(c.habitId === habitId && c.date === t))
      : [...completions, { habitId, date: t }];
    await saveCompletions(updated);
  };

  const today = todayStr();
  const completedToday = habits.filter((h) =>
    completions.some((c) => c.habitId === h.id && c.date === today)
  ).length;
  const longestStreak = habits.reduce((max, h) => Math.max(max, getStreak(h.id, completions)), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
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
            renderItem={({ item }) => (
              <HabitCard
                habit={item}
                completions={completions}
                today={today}
                onToggle={toggleComplete}
                onDelete={deleteHabit}
              />
            )}
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F7' },
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
