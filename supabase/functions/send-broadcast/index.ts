// Genç TETSİAD — Broadcast push notification sender
// Sadece admin/board/president rolündeki kullanıcılar çağırabilir.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface BroadcastRequest {
  title: string;
  body: string;
  type?: 'announcement' | 'event' | 'system' | 'mentorship';
  urgent?: boolean;
  target_roles?: ('member' | 'student' | 'board' | 'president' | 'admin')[];
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  channelId: string;
  priority: 'default' | 'high';
  sound: 'default';
  data: Record<string, unknown>;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return json(500, { error: 'Server misconfigured' });

  // Caller authentication
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json(401, { error: 'Missing Authorization' });

  const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await callerClient.auth.getUser();
  if (userError || !user) return json(401, { error: 'Invalid session' });

  // Admin/board check
  const { data: callerProfile } = await callerClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!callerProfile || !['admin', 'board', 'president'].includes(callerProfile.role)) {
    return json(403, { error: 'Yalnızca yönetim kurulu duyuru gönderebilir' });
  }

  // Parse payload
  let payload: BroadcastRequest;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const title = payload.title?.trim();
  const body = payload.body?.trim();
  if (!title || !body) return json(400, { error: 'title ve body zorunlu' });

  const notifType = payload.type ?? 'announcement';
  const urgent = payload.urgent ?? false;
  const targetRoles = payload.target_roles ?? null;

  // Admin client (RLS bypass) — recipients & inserts
  const admin = createClient(supabaseUrl, serviceKey);

  const { data: recipients, error: recipientsError } = await admin
    .rpc('get_push_recipients', { roles_filter: targetRoles });

  if (recipientsError) return json(500, { error: recipientsError.message });

  const tokens = (recipients ?? []).map((r: { token: string }) => r.token).filter(Boolean);

  // Broadcast log row
  const { data: broadcastRow } = await admin
    .from('broadcasts')
    .insert({
      title, body, type: notifType, urgent,
      target_roles: targetRoles, created_by: user.id,
    })
    .select('id')
    .single();

  const broadcastId = broadcastRow?.id ?? null;

  // In-app inbox kayıtları
  await admin.rpc('insert_broadcast_notifications', {
    p_title: title,
    p_body: body,
    p_type: notifType,
    p_related_id: broadcastId,
    p_roles_filter: targetRoles,
  });

  if (tokens.length === 0) {
    return json(200, { sent: 0, failed: 0, broadcast_id: broadcastId, note: 'No active push tokens' });
  }

  // Expo Push API'ye batch gönderim
  let sent = 0, failed = 0;
  const channelId = urgent ? 'urgent' : 'default';
  const priority = urgent ? 'high' : 'default';

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);
    const messages: ExpoMessage[] = batch.map((token) => ({
      to: token,
      title,
      body,
      channelId,
      priority,
      sound: 'default',
      data: { broadcast_id: broadcastId, type: notifType, urgent },
    }));

    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
      const result = await res.json();
      if (Array.isArray(result?.data)) {
        for (const tk of result.data) {
          if (tk.status === 'ok') sent++; else failed++;
        }
      } else {
        failed += batch.length;
      }
    } catch {
      failed += batch.length;
    }
  }

  await admin.from('broadcasts').update({ sent_count: sent, failed_count: failed }).eq('id', broadcastId);

  return json(200, { sent, failed, broadcast_id: broadcastId, total_recipients: tokens.length });
});
