/**
 * lib/playlists.ts — Curated habit-based playlist recommendations
 *
 * Maps habit keywords to YouTube playlist IDs.
 * Called when a new habit is added — matched against the habit name.
 * Falls back to a general motivation playlist if no keywords match.
 */

export interface PlaylistEntry {
  keywords: string[];
  playlistId: string;
  title: string;
  description: string;
  category: string;       // display label e.g. "Focus"
  emoji: string;          // category emoji
  color: string;          // pill background color
}

export const PLAYLIST_MAP: PlaylistEntry[] = [
  {
    keywords: ['focus', 'productiv', 'deep work', 'study', 'pomodoro', 'work', 'cod', 'program', 'develop'],
    playlistId: 'PLOfLYVXrwqBwbNnkVWUfFHFpbmmr5VJo_',
    title: 'Deep Focus — Study & Work',
    description: 'Instrumental music for deep concentration',
    category: 'Focus', emoji: '🎯', color: '#EEF2FF',
  },
  {
    keywords: ['workout', 'gym', 'lift', 'strength', 'fitness', 'train', 'exercise'],
    playlistId: 'PLx65qkgCWNJIgq1Mj0rtsthQSXe3bQoLt',
    title: 'Ultimate Workout Motivation',
    description: 'High energy tracks to power your training',
    category: 'Workout', emoji: '💪', color: '#FFF1F2',
  },
  {
    keywords: ['run', 'jog', 'cardio', 'marathon', 'sprint'],
    playlistId: 'PLgzTt0k8mXzEk586ze4BjKDn2KKOIUmMX',
    title: 'Running Motivation Mix',
    description: 'Upbeat beats to keep your pace up',
    category: 'Running', emoji: '🏃', color: '#FFF7ED',
  },
  {
    keywords: ['meditat', 'mindful', 'breathe', 'breath', 'calm', 'relax'],
    playlistId: 'PLQ_PIlf6OzqJpURN4dFxHV82l4vV7OEKZ',
    title: 'Meditation & Mindfulness',
    description: 'Calm ambient sounds for meditation',
    category: 'Calm', emoji: '🧘', color: '#F0FDF4',
  },
  {
    keywords: ['sleep', 'rest', 'nap', 'bedtime'],
    playlistId: 'PLtBQA7FZXBU2E2RcRLNnFHhzNKERnMV-L',
    title: 'Sleep Sounds & Relaxation',
    description: 'Gentle sounds to help you drift off',
    category: 'Sleep', emoji: '😴', color: '#F5F3FF',
  },
  {
    keywords: ['yoga', 'stretch', 'flex', 'mobil', 'pilates'],
    playlistId: 'PLgzTt0k8mXzHQCkrHxBTQNLIUUMm8XEIQ',
    title: 'Yoga Flow Music',
    description: 'Peaceful music for flow and flexibility',
    category: 'Yoga', emoji: '🌿', color: '#ECFDF5',
  },
  {
    keywords: ['morning', 'wake', 'rise', 'routine'],
    playlistId: 'PLgzTt0k8mXzEk586ze4BjKDn2KKOIUmMX',
    title: 'Morning Energy Boost',
    description: 'Start your day with positive vibes',
    category: 'Morning', emoji: '☀️', color: '#FFFBEB',
  },
  {
    keywords: ['read', 'book', 'learn'],
    playlistId: 'PLOfLYVXrwqBwbNnkVWUfFHFpbmmr5VJo_',
    title: 'Reading Ambience',
    description: 'Calm background music for reading',
    category: 'Reading', emoji: '📚', color: '#EFF6FF',
  },
  {
    keywords: ['journal', 'write', 'diary'],
    playlistId: 'PLQ_PIlf6OzqJpURN4dFxHV82l4vV7OEKZ',
    title: 'Journaling Atmosphere',
    description: 'Reflective ambient sounds for writing',
    category: 'Journal', emoji: '✍️', color: '#FDF4FF',
  },
  {
    keywords: ['walk', 'step', 'outdoor', 'nature', 'hike'],
    playlistId: 'PLgzTt0k8mXzHQCkrHxBTQNLIUUMm8XEIQ',
    title: 'Nature Walk Vibes',
    description: 'Easy listening for your daily walk',
    category: 'Walk', emoji: '🚶', color: '#F0FDF4',
  },
  {
    keywords: ['cook', 'food', 'eat', 'nutrition', 'diet', 'meal'],
    playlistId: 'PLx65qkgCWNJIgq1Mj0rtsthQSXe3bQoLt',
    title: 'Cooking Vibes',
    description: 'Feel-good music for the kitchen',
    category: 'Cooking', emoji: '🍳', color: '#FFF7ED',
  },
  {
    keywords: ['langua', 'spanish', 'french', 'german', 'chinese', 'japanese', 'speak'],
    playlistId: 'PLOfLYVXrwqBwbNnkVWUfFHFpbmmr5VJo_',
    title: 'Language Learning Focus',
    description: 'Concentration music for language study',
    category: 'Language', emoji: '🌍', color: '#EEF2FF',
  },
  {
    keywords: ['cold', 'shower', 'ice'],
    playlistId: 'PLx65qkgCWNJIgq1Mj0rtsthQSXe3bQoLt',
    title: 'Cold Shower Pump-Up',
    description: 'High energy to get you through it',
    category: 'Energy', emoji: '⚡', color: '#FFF1F2',
  },
  {
    keywords: ['gratitude', 'thankful', 'positive', 'mindset', 'affirm'],
    playlistId: 'PLQ_PIlf6OzqJpURN4dFxHV82l4vV7OEKZ',
    title: 'Positive Mindset Music',
    description: 'Uplifting tracks for a grateful mindset',
    category: 'Mindset', emoji: '✨', color: '#FFFBEB',
  },
  {
    keywords: ['saving', 'money', 'financ', 'budget', 'invest'],
    playlistId: 'PLOfLYVXrwqBwbNnkVWUfFHFpbmmr5VJo_',
    title: 'Deep Work — Finance Mode',
    description: 'Focus music for planning and analysis',
    category: 'Finance', emoji: '💰', color: '#F0FDF4',
  },
];

const FALLBACK: PlaylistEntry = {
  keywords: [],
  playlistId: 'PLx65qkgCWNJIgq1Mj0rtsthQSXe3bQoLt',
  title: 'Motivation & Success',
  description: 'Fuel your habits with great music',
  category: 'Motivation', emoji: '🚀', color: '#EEF2FF',
};

/**
 * Returns a suggested playlist entry for a given habit name.
 * Matches on partial, case-insensitive keyword substrings.
 */
export function suggestPlaylist(habitName: string): PlaylistEntry {
  const lower = habitName.toLowerCase();
  for (const entry of PLAYLIST_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry;
    }
  }
  return FALLBACK;
}
