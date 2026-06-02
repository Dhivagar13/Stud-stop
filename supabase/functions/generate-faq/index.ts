import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: resolved } = await supabase
    .from('doubts')
    .select('id, subject, body, tags')
    .eq('is_resolved', true)
    .limit(50);

  if (!resolved?.length) {
    return new Response(JSON.stringify({ faqs: [] }), { headers: { 'Content-Type': 'application/json' } });
  }

  const faqGroups: Record<string, { question: string; tags: string[] }[]> = {};

  for (const doubt of resolved) {
    const subject = doubt.subject;
    if (!faqGroups[subject]) faqGroups[subject] = [];
    faqGroups[subject].push({ question: doubt.body, tags: doubt.tags || [] });
  }

  const faqs = Object.entries(faqGroups).map(([subject, questions]) => ({
    subject,
    questions: questions.slice(0, 5),
    count: questions.length,
  }));

  return new Response(JSON.stringify({ faqs }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
