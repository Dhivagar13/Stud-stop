import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { student_id } = await req.json();

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('score')
    .eq('student_id', student_id);

  const { data: skills } = await supabase
    .from('skills')
    .select('level')
    .eq('student_id', student_id);

  const { data: caMarks } = await supabase
    .from('ca_marks')
    .select('marks_obtained, max_marks')
    .eq('student_id', student_id);

  const quizScore = attempts?.length
    ? attempts.reduce((a: number, b: any) => a + b.score, 0) / attempts.length
    : 0;

  const skillCount = skills?.length || 0;
  const skillBreadth = Math.min(skillCount * 10, 100);

  const skillLevelWeights: Record<string, number> = {
    beginner: 25, intermediate: 50, advanced: 75, expert: 100,
  };
  const skillWeighted = skills?.reduce((a: number, b: any) => a + (skillLevelWeights[b.level] || 0), 0) / Math.max(skillCount, 1);

  const caAvg = caMarks?.length
    ? caMarks.reduce((a: number, b: any) => a + (b.marks_obtained / b.max_marks) * 100, 0) / caMarks.length
    : 0;

  const score = Math.round(quizScore * 0.4 + (skillBreadth + skillWeighted) / 2 * 0.2 + caAvg * 0.2 + 20);

  await supabase
    .from('profiles')
    .update({ placement_score: score })
    .eq('id', student_id);

  return new Response(JSON.stringify({ score }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
