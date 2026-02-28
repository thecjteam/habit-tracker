/**
 * lib/videos.ts — Curated motivational YouTube video suggestions
 *
 * Maps habit keywords to a hand-picked YouTube video ID.
 * Called when a new habit is added — matched against the habit name.
 * Falls back to a general motivational video if no keywords match.
 */

interface VideoEntry {
  keywords: string[];
  videoId: string;
  title: string;
}

const VIDEO_MAP: VideoEntry[] = [
  { keywords: ['meditat', 'mindful', 'breathe', 'breath', 'calm', 'relax'], videoId: 'inpok4MKVLM', title: '5-Minute Meditation You Can Do Anywhere' },
  { keywords: ['run', 'jog', 'cardio', 'marathon', 'sprint'], videoId: 'iSFpgQUGCVo', title: 'How to Start Running (and Actually Enjoy It)' },
  { keywords: ['workout', 'exercise', 'gym', 'lift', 'strength', 'fitness', 'train'], videoId: 'vc1E5CfRfos', title: 'The Science of Getting Stronger' },
  { keywords: ['read', 'book', 'learn', 'study'], videoId: 'YjPDMHB_oEY', title: 'How to Read More Books' },
  { keywords: ['journal', 'write', 'diary', 'gratitud'], videoId: 'dArgOrm98Bk', title: 'The Life-Changing Habit of Journaling' },
  { keywords: ['sleep', 'wake', 'morning', 'routine', 'rise'], videoId: 'nm1TxQj9IsQ', title: 'The Perfect Morning Routine' },
  { keywords: ['water', 'hydrat', 'drink'], videoId: 'aQiGDPuk3EQ', title: 'Why Staying Hydrated Is So Important' },
  { keywords: ['diet', 'eat', 'food', 'nutrition', 'vegetable', 'fruit', 'cook'], videoId: 'fqhYBTg73fw', title: 'How to Build Healthy Eating Habits' },
  { keywords: ['walk', 'step', 'outdoor', 'nature', 'hike'], videoId: 'bnHMDMxLKhw', title: 'The Surprising Benefits of Walking' },
  { keywords: ['stretch', 'yoga', 'flex', 'mobil'], videoId: '4pKly2JojMw', title: '10-Minute Morning Yoga for Beginners' },
  { keywords: ['cod', 'program', 'develop', 'hack', 'build', 'software'], videoId: 'NtfbWkxJTHw', title: 'How to Build a Coding Habit' },
  { keywords: ['langua', 'speak', 'spanish', 'french', 'german', 'chinese', 'japanese'], videoId: 'illApgaLgGA', title: 'How to Learn Any Language' },
  { keywords: ['saving', 'save', 'money', 'financ', 'budget', 'invest'], videoId: 'HQzoZfc3GwQ', title: 'How to Build Better Money Habits' },
  { keywords: ['social', 'phone', 'screen', 'detox', 'digital'], videoId: 'OoFSMRHgSHA', title: 'How to Break Your Phone Addiction' },
  { keywords: ['focus', 'productiv', 'deep work', 'pomodoro', 'distract'], videoId: 'WXBA4eWskrc', title: 'How to Focus Like a Navy SEAL' },
  { keywords: ['cold', 'shower', 'ice'], videoId: 'NUYP3bBnBY0', title: 'Cold Showers — What Happens to Your Body' },
  { keywords: ['vitamin', 'supplement', 'health'], videoId: 'fLNJLIKMFsM', title: 'Daily Habits for Long-Term Health' },
  { keywords: ['gratitude', 'thankful', 'positive', 'mindset'], videoId: 'WPPPFqsECz0', title: 'The Power of Gratitude' },
];

const FALLBACK = { videoId: 'ZXsQAXx_ao0', title: 'The Power of Small Habits — James Clear' };

/**
 * Returns a suggested { videoId, title } for a given habit name.
 * Matches on partial, case-insensitive keyword substrings.
 */
export function suggestVideo(habitName: string): { videoId: string; title: string } {
  const lower = habitName.toLowerCase();
  for (const entry of VIDEO_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return { videoId: entry.videoId, title: entry.title };
    }
  }
  return FALLBACK;
}
