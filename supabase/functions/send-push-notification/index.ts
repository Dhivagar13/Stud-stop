import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { title, body, priority, expo_tokens } = await req.json();

  if (priority !== 'high' && priority !== 'critical') {
    return new Response(JSON.stringify({ skipped: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  const messages = (expo_tokens || []).map((token: string) => ({
    to: token,
    sound: 'default',
    title,
    body,
    priority: 'high',
    data: { type: 'announcement' },
  }));

  const results = await Promise.all(
    messages.map((msg: any) =>
      fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      }).then((r) => r.json())
    )
  );

  return new Response(JSON.stringify({ sent: results.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
