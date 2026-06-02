import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

export function usePlacementScore() {
  const profile = useAuthStore((s) => s.profile);

  async function recalculate() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: attempts } = await supabase
      .from('quiz_attempts')
      .select('score')
      .eq('student_id', user.id);

    const { data: skills } = await supabase
      .from('skills')
      .select('level')
      .eq('student_id', user.id);

    const { data: caMarks } = await supabase
      .from('ca_marks')
      .select('marks_obtained, max_marks')
      .eq('student_id', user.id);

    const quizScore = attempts?.length
      ? attempts.reduce((a: number, b: any) => a + (b.score || 0), 0) / attempts.length
      : 0;

    const skillBreadth = skills?.length ? Math.min(skills.length * 10, 100) : 0;
    const skillWeighted = skills?.length
      ? skills.reduce((a: number, b: any) => {
          const weights: Record<string, number> = { beginner: 25, intermediate: 50, advanced: 75, expert: 100 };
          return a + (weights[b.level] || 0);
        }, 0) / skills.length
      : 0;

    const caAvg = caMarks?.length
      ? caMarks.reduce((a: number, b: any) => a + ((b.marks_obtained || 0) / (b.max_marks || 1)) * 100, 0) / caMarks.length
      : 0;

    const score = Math.round(
      quizScore * 0.4 + (skillBreadth + skillWeighted) / 2 * 0.2 + caAvg * 0.2 + 20
    );

    await supabase
      .from('profiles')
      .update({ placement_score: score })
      .eq('id', user.id);

    return score;
  }

  return { score: profile?.placement_score || 0, recalculate };
}
