import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../middlewares/auth'
import { requireRole } from '../../middlewares/roleCheck'
import { supabase } from '../../lib/supabase'

const router = Router()
router.use(requireAuth, requireRole('vendor'))

const adSchema = z.object({
  title: z.string().min(3).max(60),
  description: z.string().max(150).optional(),
  service_id: z.string().uuid().optional(),
  target_keywords: z.array(z.string()).max(10).default([]),
  budget: z.number().min(50000, 'Budget minimal Rp 50.000'),
})

// List iklan vendor
router.get('/', async (req, res) => {
  const { data } = await supabase
    .from('ads')
    .select('*, services(name, price)')
    .eq('vendor_id', req.user!.vendorId)
    .order('created_at', { ascending: false })
  res.json(data || [])
})

// Buat iklan baru
router.post('/', async (req, res) => {
  const parsed = adSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message })

  const { data: vendor } = await supabase
    .from('vendors')
    .select('wallet_balance, business_name')
    .eq('id', req.user!.vendorId)
    .single()

  if (!vendor || (vendor.wallet_balance || 0) < parsed.data.budget)
    return res.status(400).json({ error: 'Saldo wallet tidak cukup untuk budget iklan ini' })

  // Reservasi budget dari wallet
  await supabase
    .from('vendors')
    .update({ wallet_balance: (vendor.wallet_balance || 0) - parsed.data.budget })
    .eq('id', req.user!.vendorId)

  const { data: ad, error } = await supabase.from('ads').insert({
    vendor_id: req.user!.vendorId,
    ...parsed.data,
    status: 'pending', // admin harus approve dulu
    spent: 0,
  }).select().single()

  if (error) {
    // Kembalikan wallet jika gagal
    await supabase.from('vendors').update({ wallet_balance: vendor.wallet_balance }).eq('id', req.user!.vendorId)
    return res.status(500).json({ error: error.message })
  }

  await supabase.from('wallet_ledger').insert({
    vendor_id: req.user!.vendorId,
    amount: -parsed.data.budget,
    type: 'ad_budget',
    description: `Budget iklan: ${parsed.data.title}`,
    reference_id: ad.id,
  })

  res.status(201).json(ad)
})

// Pause / aktifkan iklan
router.patch('/:id/toggle', async (req, res) => {
  const { data: ad } = await supabase.from('ads').select('status').eq('id', req.params.id).eq('vendor_id', req.user!.vendorId).single()
  if (!ad) return res.status(404).json({ error: 'Ad not found' })
  if (!['active', 'paused'].includes(ad.status)) return res.status(400).json({ error: 'Iklan tidak bisa diubah statusnya' })

  const newStatus = ad.status === 'active' ? 'paused' : 'active'
  await supabase.from('ads').update({ status: newStatus }).eq('id', req.params.id)
  res.json({ status: newStatus })
})

// Hapus / batalkan iklan (kembalikan sisa budget)
router.delete('/:id', async (req, res) => {
  const { data: ad } = await supabase.from('ads').select('*').eq('id', req.params.id).eq('vendor_id', req.user!.vendorId).single()
  if (!ad) return res.status(404).json({ error: 'Ad not found' })

  const remaining = (ad.budget || 0) - (ad.spent || 0)
  if (remaining > 0) {
    const { data: vendor } = await supabase.from('vendors').select('wallet_balance').eq('id', req.user!.vendorId).single()
    await supabase.from('vendors').update({ wallet_balance: (vendor?.wallet_balance || 0) + remaining }).eq('id', req.user!.vendorId)
    await supabase.from('wallet_ledger').insert({
      vendor_id: req.user!.vendorId,
      amount: remaining,
      type: 'ad_refund',
      description: `Refund sisa budget iklan: ${ad.title}`,
      reference_id: ad.id,
    })
  }

  await supabase.from('ads').update({ status: 'ended' }).eq('id', req.params.id)
  res.json({ refunded: remaining })
})

export default router
