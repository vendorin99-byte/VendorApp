import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth'
import { requireRole } from '../../middlewares/roleCheck'
import { supabase } from '../../lib/supabase'
import { sendPushNotification } from '../../services/pushNotification'

const router = Router()

router.use(requireAuth, requireRole('vendor'))

router.get('/', async (req, res) => {
  const { status, page = '1' } = req.query
  const limit = 20
  const offset = (parseInt(page as string) - 1) * limit

  let query = supabase
    .from('bookings')
    .select(`*, users(name, phone, avatar_url), services(name, price)`, { count: 'exact' })
    .eq('vendor_id', req.user!.vendorId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)

  const { data, error, count } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json({ data, total: count })
})

router.patch('/:id/confirm', async (req, res) => {
  const { data: booking } = await supabase.from('bookings').select('*, services(name)').eq('id', req.params.id).single()
  if (!booking || booking.vendor_id !== req.user!.vendorId) return res.status(404).json({ error: 'Not found' })
  if (booking.status !== 'dp_paid') return res.status(400).json({ error: 'DP not yet paid' })

  const { error } = await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })

  await sendPushNotification(
    booking.customer_id,
    '✅ Pesanan Dikonfirmasi!',
    `Vendor mengkonfirmasi pesanan "${(booking.services as any)?.name}". Silakan lakukan pelunasan jika diperlukan.`,
    { type: 'order_confirmed', bookingId: booking.id }
  )

  res.json({ message: 'Order confirmed' })
})

router.patch('/:id/reject', async (req, res) => {
  const { reason } = req.body
  if (!reason) return res.status(400).json({ error: 'Reason required' })

  const { data: booking } = await supabase.from('bookings').select('*').eq('id', req.params.id).single()
  if (!booking || booking.vendor_id !== req.user!.vendorId) return res.status(404).json({ error: 'Not found' })

  const { error } = await supabase.from('bookings')
    .update({ status: 'cancelled', rejected_reason: reason })
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'Order rejected' })
})

router.patch('/:id/confirm-cash', async (req, res) => {
  const { data: booking } = await supabase
    .from('bookings').select('*, services(name)').eq('id', req.params.id).eq('vendor_id', req.user!.vendorId).single()
  if (!booking) return res.status(404).json({ error: 'Not found' })
  if (booking.payment_method !== 'cash') return res.status(400).json({ error: 'Bukan pesanan cash' })

  await supabase.from('bookings').update({ status: 'fully_paid' }).eq('id', booking.id)
  await supabase.from('transactions').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('booking_id', booking.id)

  const { creditWallet } = await import('../../services/wallet')
  await creditWallet(booking.vendor_id, booking.vendor_received, 'credit_order', booking.id,
    `Cash — Pesanan #${booking.id.slice(0, 8)}`)

  res.json({ message: 'Cash confirmed' })
})

router.patch('/:id/done', async (req, res) => {
  const { data: booking } = await supabase.from('bookings').select('*, services(name)').eq('id', req.params.id).single()
  if (!booking || booking.vendor_id !== req.user!.vendorId) return res.status(404).json({ error: 'Not found' })

  const { error } = await supabase.from('bookings').update({ status: 'done' }).eq('id', req.params.id)
  if (error) return res.status(500).json({ error: error.message })

  await sendPushNotification(
    booking.customer_id,
    '🎉 Pesanan Selesai!',
    `Pesanan "${(booking.services as any)?.name}" telah selesai. Berikan ulasan untuk vendor Anda.`,
    { type: 'order_done', bookingId: booking.id }
  )

  res.json({ message: 'Order marked as done' })
})

// ── Kirim pengingat pelunasan ke customer ────────────────────────────────────
router.post('/:id/remind-payment', async (req, res) => {
  const { data: booking } = await supabase.from('bookings')
    .select('*, services(name)')
    .eq('id', req.params.id)
    .eq('vendor_id', req.user!.vendorId)
    .single()

  if (!booking) return res.status(404).json({ error: 'Not found' })
  if (!['confirmed', 'dp_paid'].includes(booking.status)) {
    return res.status(400).json({ error: 'Status tidak memungkinkan pengiriman pengingat' })
  }

  await sendPushNotification(
    booking.customer_id,
    '💰 Pengingat Pelunasan',
    `Vendor mengingatkan Anda untuk melunasi pesanan "${(booking.services as any)?.name}". Segera selesaikan pembayaran.`,
    { type: 'payment_reminder', bookingId: booking.id }
  )

  res.json({ success: true })
})

export default router
