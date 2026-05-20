import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth'
import { requireRole } from '../../middlewares/roleCheck'
import { supabase } from '../../lib/supabase'

const router = Router()
router.use(requireAuth, requireRole('admin'))

router.get('/', async (_req, res) => {
  const { data } = await supabase
    .from('ads')
    .select('*, vendors(business_name), services(name, price)')
    .order('created_at', { ascending: false })
  res.json(data || [])
})

router.patch('/:id/approve', async (req, res) => {
  await supabase.from('ads').update({ status: 'active' }).eq('id', req.params.id)
  res.json({ success: true })
})

router.patch('/:id/reject', async (req, res) => {
  const { reason } = req.body
  const { data: ad } = await supabase.from('ads').select('*').eq('id', req.params.id).single()
  if (!ad) return res.status(404).json({ error: 'Not found' })

  // Kembalikan budget ke vendor
  const { data: vendor } = await supabase.from('vendors').select('wallet_balance').eq('id', ad.vendor_id).single()
  await supabase.from('vendors').update({ wallet_balance: (vendor?.wallet_balance || 0) + ad.budget }).eq('id', ad.vendor_id)
  await supabase.from('ads').update({ status: 'rejected' }).eq('id', req.params.id)

  res.json({ success: true, refunded: ad.budget })
})

router.get('/stats', async (_req, res) => {
  const { data } = await supabase
    .from('ads')
    .select('status, budget, spent')

  const stats = {
    total: data?.length || 0,
    pending: data?.filter(a => a.status === 'pending').length || 0,
    active: data?.filter(a => a.status === 'active').length || 0,
    total_spent: data?.reduce((s, a) => s + (a.spent || 0), 0) || 0,
    total_budget: data?.reduce((s, a) => s + (a.budget || 0), 0) || 0,
  }
  res.json(stats)
})

export default router
