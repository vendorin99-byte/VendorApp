import { supabase } from '../lib/supabase'

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  const { data: user } = await supabase.from('users').select('expo_push_token').eq('id', userId).single()

  if (user?.expo_push_token) {
    fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: user.expo_push_token,
        title,
        body,
        data: data || {},
        sound: 'default',
      }),
    }).catch(() => {})
  }

  await supabase.from('notifications').insert({
    user_id: userId,
    title,
    body,
    data: data || {},
    is_read: false,
  })
}
