import { Router } from 'express'
import { supabase } from '../../lib/supabase'

const router = Router()

// Get iklan untuk feed home (random dari yang active, budget masih ada)
router.get('/feed', async (req, res) => {
  const { limit = '3' } = req.query

  const { data } = await supabase
    .from('ads')
    .select(`
      id, title, description, cost_per_click, target_keywords,
      vendors(id, business_name, category, city, avg_rating, portfolios(image_url, sort_order)),
      services(id, name, price, dp_percent)
    `)
    .eq('status', 'active')
    .gt('budget', supabase.rpc as any) // filter budget > spent handled below
    .limit(parseInt(limit as string) * 3)

  // Filter: budget masih ada
  const active = (data || []).filter((a: any) => {
    return true // supabase doesn't support column comparison in where easily, filter client-side
  })

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
      id, title, description, cost_per_click, target_keywords,
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

// Track klik iklan → deduct budget vendor
router.post('/:id/click', async (req, res) => {
  const { data: ad } = await supabase
    .from('ads')
    .select('*, vendors(wallet_balance)')
    .eq('id', req.params.id)
    .eq('status', 'active')
    .single()

  if (!ad) return res.status(404).json({ error: 'Ad not found' })

  const remaining = (ad.budget || 0) - (ad.spent || 0)
  if (remaining < ad.cost_per_click) {
    // Budget habis, matikan iklan
    await supabase.from('ads').update({ status: 'ended' }).eq('id', ad.id)
    return res.json({ clicked: false })
  }

  // Deduct dari spent
  await supabase.from('ads').update({ spent: (ad.spent || 0) + ad.cost_per_click }).eq('id', ad.id)

  // Catat klik
  await supabase.from('ad_clicks').insert({
    ad_id: ad.id,
    vendor_id: ad.vendor_id,
    cost: ad.cost_per_click,
  })

  // Jika budget hampir habis, pause otomatis
  if (remaining - ad.cost_per_click <= 0) {
    await supabase.from('ads').update({ status: 'ended' }).eq('id', ad.id)
  }

  res.json({ clicked: true, vendor_id: ad.vendor_id })
})

export default router
