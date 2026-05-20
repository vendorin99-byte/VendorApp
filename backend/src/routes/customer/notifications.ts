import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth'
import { supabase } from '../../lib/supabase'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })
    .limit(50)
  res.json(data || [])
})

router.get('/unread-count', async (req, res) => {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', req.user!.id)
    .eq('is_read', false)
  res.json({ count: count || 0 })
})

router.patch('/:id/read', async (req, res) => {
  await supabase.from('notifications').update({ is_read: true })
    .eq('id', req.params.id).eq('user_id', req.user!.id)
  res.json({ success: true })
})

router.post('/read-all', async (req, res) => {
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', req.user!.id)
  res.json({ success: true })
})

export default router
