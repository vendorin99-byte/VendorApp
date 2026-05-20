import { Router } from 'express'
import { supabase } from '../../lib/supabase'

const router = Router()

// Get iklan untuk feed home (random dari yang active, budget masih ada)
router.get('/feed', async (req, res) => {
  const { limit = '3' } = req.query

  const { data } = await supabase
    .from('ads')
    .select(`
      id, title, description, budget, spent, target_keywords,
      vendors(id, business_name, category, city, avg_rating, portfolios(image_url, sort_order)),
      services(id, name, price, dp_percent)
    `)
    .eq('status', 'active')
    .limit(parseInt(limit as string) * 3)

  // Filter: masih ada sisa budget
  const active = (data || []).filter((a: any) => (a.budget || 0) > (a.spent || 0))

  // Shuffle dan ambil sesuai limit
  const shuffled = active.sort(() => Math.random() - 0.5).slice(0, parseInt(limit as string))
  res.json(shuffled)
})

// Get iklan berdasarkan keyword pencarian
router.get('/search', async (req, res) => {
  const { q = '' } = req.query
  const keyword = (q as string).toLowerCase().trim()
  if (!keyword) return res.json([])

  const { data } = await supabase
    .from('ads')
    .select(`
      id, title, description, budget, spent, target_keywords,
      vendors(id, business_name, category, city, avg_rating, portfolios(image_url, sort_order)),
      services(id, name, price, dp_percent)
    `)
    .eq('status', 'active')
    .limit(20)

  // Filter yang keyword-nya cocok
  const matched = (data || []).filter((a: any) => {
    const kws: string[] = a.target_keywords || []
    return kws.some((k: string) => k.toLowerCase().includes(keyword) || keyword.includes(k.toLowerCase()))
      || a.title.toLowerCase().includes(keyword)
      || a.vendors?.business_name?.toLowerCase().includes(keyword)
      || a.vendors?.category?.toLowerCase().includes(keyword)
  }).slice(0, 2)

  res.json(matched)
})

// Track klik iklan → deduct budget
router.post('/:id/click', async (req, res) => {
  const { data: ad } = await supabase
    .from('ads')
    .select('id, budget, spent, clicks, vendor_id')
    .eq('id', req.params.id)
    .eq('status', 'active')
    .single()

  if (!ad) return res.status(404).json({ error: 'Ad not found' })

  const costPerClick = 500 // Rp 500 per klik (fixed)
  const remaining = (ad.budget || 0) - (ad.spent || 0)

  if (remaining < costPerClick) {
    await supabase.from('ads').update({ status: 'ended' }).eq('id', ad.id)
    return res.json({ clicked: false })
  }

  const newSpent = (ad.spent || 0) + costPerClick
  const newClicks = (ad.clicks || 0) + 1
  const updateData: any = { spent: newSpent, clicks: newClicks }
  if (newSpent >= ad.budget) updateData.status = 'ended'

  await supabase.from('ads').update(updateData).eq('id', ad.id)

  res.json({ clicked: true, vendor_id: ad.vendor_id })
})

export default router
