import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../middlewares/auth'
import { requireRole } from '../../middlewares/roleCheck'
import { supabase } from '../../lib/supabase'
import { sendPushNotification } from '../../services/pushNotification'

const router = Router()

const requestSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  category: z.string().optional(),
  description: z.string().min(10).max(300),
  event_date: z.string().optional(),
  budget: z.number().int().optional(),
})

const bidSchema = z.object({
  price: z.number().int().positive(),
  note: z.string().max(200).optional(),
})

// GET semua request terbuka (publik — vendor & pengunjung website bisa lihat)
router.get('/active', async (_req, res) => {
  const { data, error } = await supabase
    .from('map_requests')
    .select(`*, users!customer_id(id, name)`)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

// GET request milik customer sendiri
router.get('/mine', requireAuth, requireRole('customer'), async (req, res) => {
  const { data } = await supabase
    .from('map_requests')
    .select(`*, map_bids(*, vendors(business_name, category))`)
    .eq('customer_id', req.user!.id)
    .order('created_at', { ascending: false })

  res.json(data || [])
})

// POST buat request baru (customer)
router.post('/', requireAuth, requireRole('customer'), async (req, res) => {
  const parsed = requestSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { lat, lng, category, description, event_date, budget } = parsed.data

  const { data, error } = await supabase
    .from('map_requests')
    .insert({ customer_id: req.user!.id, lat, lng, category, description, event_date, budget })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

// DELETE tutup request sendiri (customer)
router.delete('/:id', requireAuth, requireRole('customer'), async (req, res) => {
  const { error } = await supabase
    .from('map_requests')
    .update({ status: 'closed' })
    .eq('id', req.params.id)
    .eq('customer_id', req.user!.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

// GET bid list untuk request tertentu (customer lihat penawaran masuk)
router.get('/:id/bids', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('map_bids')
    .select(`*, vendors(id, business_name, category, avg_rating)`)
    .eq('request_id', req.params.id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

// POST vendor kirim penawaran
router.post('/:id/bids', requireAuth, requireRole('vendor'), async (req, res) => {
  const parsed = bidSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { data: request } = await supabase
    .from('map_requests')
    .select('id, customer_id, description, users!customer_id(id)')
    .eq('id', req.params.id)
    .eq('status', 'open')
    .single()

  if (!request) return res.status(404).json({ error: 'Request tidak ditemukan atau sudah ditutup' })

  const { data: bid, error } = await supabase
    .from('map_bids')
    .upsert({
      request_id: req.params.id,
      vendor_id: req.user!.vendorId,
      price: parsed.data.price,
      note: parsed.data.note,
      status: 'pending',
    }, { onConflict: 'request_id,vendor_id' })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Notifikasi ke customer
  const { data: vendor } = await supabase.from('vendors').select('business_name').eq('id', req.user!.vendorId).single()
  const customerId = (request as any).customer_id
  await sendPushNotification(
    customerId,
    '💼 Penawaran Baru di Maps!',
    `${vendor?.business_name} menawarkan Rp ${parsed.data.price.toLocaleString('id-ID')} untuk permintaan Anda`,
    { type: 'map_bid', requestId: req.params.id }
  )

  res.status(201).json(bid)
})

// POST customer terima penawaran → buat chat room
router.post('/bids/:bidId/accept', requireAuth, requireRole('customer'), async (req, res) => {
  const { data: bid } = await supabase
    .from('map_bids')
    .select(`*, map_requests!request_id(customer_id), vendors(id, user_id, business_name)`)
    .eq('id', req.params.bidId)
    .single()

  if (!bid) return res.status(404).json({ error: 'Bid tidak ditemukan' })

  const request = (bid as any).map_requests
  if (request?.customer_id !== req.user!.id) return res.status(403).json({ error: 'Forbidden' })

  // Update bid jadi accepted, reject yang lain
  await supabase.from('map_bids').update({ status: 'accepted' }).eq('id', req.params.bidId)
  await supabase.from('map_bids').update({ status: 'rejected' })
    .eq('request_id', bid.request_id)
    .neq('id', req.params.bidId)

  // Tutup request
  await supabase.from('map_requests').update({ status: 'closed' }).eq('id', bid.request_id)

  // Buat atau ambil chat room
  const { data: existing } = await supabase
    .from('chat_rooms')
    .select('id')
    .eq('customer_id', req.user!.id)
    .eq('vendor_id', bid.vendor_id)
    .single()

  let roomId = existing?.id
  if (!roomId) {
    const { data: newRoom } = await supabase
      .from('chat_rooms')
      .insert({ customer_id: req.user!.id, vendor_id: bid.vendor_id })
      .select('id')
      .single()
    roomId = newRoom?.id
  }

  // Notifikasi vendor
  const vendorUserId = (bid as any).vendors?.user_id
  if (vendorUserId) {
    await sendPushNotification(
      vendorUserId,
      '🎉 Penawaran Diterima!',
      `Customer menerima penawaran Anda. Silakan mulai diskusi di chat.`,
      { type: 'bid_accepted', roomId }
    )
  }

  res.json({ success: true, room_id: roomId, vendor_name: (bid as any).vendors?.business_name })
})

export default router
