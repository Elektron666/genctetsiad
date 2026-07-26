// ============================================================
// broadcast-push — sunucu tarafı bildirim gönderimi
// ============================================================
// Neden: Önceden push, yöneticinin telefonundan gönderiliyordu. Bu,
// istemcinin TÜM üyelerin bildirim token'larını okumasını gerektiriyordu.
// Bir yönetici hesabı ele geçerse saldırgan tüm token'ları çekip üyelere
// istediği bildirimi gönderebilirdi.
//
// Bu fonksiyonla token'lar istemciye hiç inmez: yetki kontrolü çağıranın
// JWT'siyle yapılır, token okuma ve gönderim service_role ile sunucuda kalır.
//
// Dağıtım:
//   supabase functions deploy broadcast-push
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.4';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const ADMIN_ROLES = ['admin', 'board', 'president'];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // ── 1) Çağıranın kimliğini ve yetkisini doğrula ──────────
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'unauthorized' }, 401);
  }

  // Kullanıcının kendi JWT'siyle çalışan istemci — RLS geçerli
  const asUser = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userErr } = await asUser.auth.getUser();
  if (userErr || !userData?.user) return json({ error: 'unauthorized' }, 401);

  const { data: profile } = await asUser
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  if (!profile || !ADMIN_ROLES.includes((profile as { role: string }).role)) {
    return json({ error: 'forbidden' }, 403);
  }

  // ── 2) Gövdeyi doğrula ──────────────────────────────────
  let payload: { title?: string; body?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const title = (payload.title ?? '').toString().trim().slice(0, 120);
  const body = (payload.body ?? '').toString().trim().slice(0, 500);
  if (!title || !body) return json({ error: 'title_and_body_required' }, 400);

  // ── 3) Token'ları service_role ile oku (istemciye hiç inmez) ──
  const asService = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const { data: rows, error: tokenErr } = await asService
    .from('push_tokens')
    .select('token');

  if (tokenErr) return json({ error: 'token_read_failed' }, 500);

  const messages = ((rows ?? []) as { token: string }[])
    .map((r) => r.token)
    .filter((t) => typeof t === 'string' && t.startsWith('ExponentPushToken'))
    .map((to) => ({ to, sound: 'default', title, body, priority: 'high' }));

  // ── 4) Expo Push API'ye 100'lük parçalar hâlinde gönder ──
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(chunk),
      });
      if (res.ok) sent += chunk.length;
    } catch {
      // tek parça başarısız olsa da kalanları göndermeye devam et
    }
  }

  return json({ sent, total: messages.length });
});
