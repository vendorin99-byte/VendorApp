import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../middlewares/auth'
import { requireRole } from '../../middlewares/roleCheck'
import { supabase } from '../../lib/supabase'

const router = Router()

const promoSchema = z.object({
  text: z.string().min(5).max(100),
  duration_days: z.number().int().min(1).max(30).default(7),
})

// GET semua promo aktif (untuk maps — publik)
router.get('/active', async (_req, res) => {
  const { data, error } = await supabase
    .from('vendor_promos')
    .select(`
      id, text, expires_at,
      vendors(id, business_name, category, lat, lng, avg_rating)
    `)
    .gt('expires_at', new Date().toISOString())

  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

// GET promo milik vendor sendiri
router.get('/mine', requireAuth, requireRole('vendor'), async (req, res) => {
  const { data } = await supabase
    .from('vendor_promos')
    .select('*')
    .eq('vendor_id', req.user!.vendorId)
    .single()

  res.json(data || null)
})

// POST pasang promo baru (replace jika sudah ada)
router.post('/', requireAuth, requireRole('vendor'), async (req, res) => {
  const parsed = promoSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { text, duration_days } = parsed.data
  const expires_at = new Date(Date.now() + duration_days * 86400_000).toISOString()

  // Upsert: satu vendor hanya bisa punya 1 promo
  const { data, error } = await supabase
    .from('vendor_promos')
    .upsert({ vendor_id: req.user!.vendorId, text, expires_at }, { onConflict: 'vendor_id' })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// DELETE hapus promo sendiri
router.delete('/mine', requireAuth, requireRole('vendor'), async (req, res) => {
  const { error } = await supabase
    .from('vendor_promos')
    .delete()
    .eq('vendor_id', req.user!.vendorId)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

export default router
