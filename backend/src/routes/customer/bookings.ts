import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../../middlewares/auth'
import { requireRole } from '../../middlewares/roleCheck'
import { supabase } from '../../lib/supabase'
import { creditWallet } from '../../services/wallet'
import { coreApi } from '../../lib/midtrans'

const router = Router()

const bookingSchema = z.object({
  vendor_id: z.string().uuid(),
  service_id: z.string().uuid(),
  event_date: z.string(),
  event_time: z.string().optional(),
  notes: z.string().optional(),
  payment_method: z.enum(['dp', 'lunas', 'cash', 'qris', 'transfer', 'tempo']).default('dp'),
})

// ── Buat Booking ─────────────────────────────────────────────────────────────
router.post('/', requireAuth, requireRole('customer'), async (req, res) => {
  const parsed = bookingSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { vendor_id, service_id, event_date, event_time, notes, payment_method } = parsed.data

  const { data: service } = await supabase.from('services').select('*').eq('id', service_id).single()
  if (!service) return res.status(404).json({ error: 'Service not found' })

  const { data: vendor } = await supabase.from('vendors').select('wallet_balance, bank_accounts:vendor_bank_accounts(bank_code, account_number, account_name)').eq('id', vendor_id).single()

  const platformFee = Math.floor(service.price * 0.02)
  const dpAmount = payment_method === 'lunas' || payment_method === 'cash' || payment_method === 'qris'
    ? service.price
    : Math.floor(service.price * (service.dp_percent / 100))
  const vendorReceived = service.price - platformFee

  const { data: booking, error } = await supabase.from('bookings').insert({
    customer_id: req.user!.id,
    vendor_id,
    service_id,
    event_date,
    event_time,
    notes,
    total_amount: service.price,
    dp_amount: dpAmount,
    platform_fee: platformFee,
    vendor_received: vendorReceived,
    payment_method,
    status: payment_method === 'tempo' ? 'confirmed' : 'pending_dp',
  }).select().single()

  if (error) return res.status(500).json({ error: error.message })

  await supabase.from('transactions').insert({
    booking_id: booking.id,
    amount: dpAmount,
    type: payment_method === 'lunas' || payment_method === 'qris' || payment_method === 'cash' ? 'full' : 'dp',
    payment_method,
    status: payment_method === 'tempo' ? 'pending' : 'pending',
  })

  // Tempo: langsung confirmed, bayar nanti
  if (payment_method === 'tempo') {
    await supabase.from('vendors').update({
      wallet_pending: (vendor as any)?.wallet_pending || 0 + vendorReceived,
    }).eq('id', vendor_id)
  }

  const bankInfo = (vendor as any)?.bank_accounts?.[0]

  res.status(201).json({
    booking,
    payment_info: {
      method: payment_method,
      amount: dpAmount,
      total: service.price,
      vendor_bank: bankInfo || null,
    },
  })
})

// ── Create QRIS Payment via Midtrans ─────────────────────────────────────────
router.post('/:id/create-payment', requireAuth, requireRole('customer'), async (req, res) => {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, services(name)')
    .eq('id', req.params.id)
    .eq('customer_id', req.user!.id)
    .single()

  if (!booking) return res.status(404).json({ error: 'Booking not found' })
  if (!['pending_dp', 'pending_remaining'].includes(booking.status)) {
    return res.status(400).json({ error: 'Booking sudah dibayar atau tidak valid' })
  }

  const isRemaining = booking.status === 'pending_remaining'
  const amount = isRemaining ? (booking.total_amount - booking.dp_amount) : booking.dp_amount
  const paymentType = isRemaining ? 'remaining' : (booking.payment_method === 'lunas' ? 'full' : 'dp')
  const orderId = `BOOK-${booking.id.slice(0, 8)}-${Date.now()}`

  try {
    const charge = await coreApi.charge({
      payment_type: 'qris',
      transaction_details: { order_id: orderId, gross_amount: amount },
      qris: { acquirer: 'gopay' },
    })

    const qrString = (charge as any).qr_string

    await supabase.from('transactions')
      .update({ tripay_reference: orderId })
      .eq('booking_id', booking.id)
      .eq('type', paymentType)

    res.json({ qr_string: qrString, order_id: orderId, amount })
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Gagal membuat QRIS' })
  }
})

// ── Cek status pembayaran ─────────────────────────────────────────────────────
router.get('/:id/payment-status', requireAuth, requireRole('customer'), async (req, res) => {
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('id', req.params.id)
    .eq('customer_id', req.user!.id)
    .single()

  if (!booking) return res.status(404).json({ error: 'Not found' })
  res.json({ status: booking.status })
})

// ── Simulasi Pembayaran (tanpa Xendit, untuk prototype) ──────────────────────
router.post('/:id/simulate-pay', requireAuth, async (req, res) => {
  const { type = 'dp' } = req.body  // 'dp' | 'remaining' | 'full'

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, services(name)')
    .eq('id', req.params.id)
    .single()

  if (!booking) return res.status(404).json({ error: 'Booking not found' })

  const isOwner = booking.customer_id === req.user!.id || req.user!.role === 'admin'
  if (!isOwner) return res.status(403).json({ error: 'Forbidden' })

  const isFullPayment = type === 'full' ||
    booking.payment_method === 'lunas' ||
    booking.payment_method === 'qris' ||
    booking.payment_method === 'cash' ||
    type === 'remaining'

  const newStatus = isFullPayment ? 'fully_paid' : 'dp_paid'
  const paidAmount = isFullPayment ? booking.total_amount : booking.dp_amount

  await supabase.from('bookings').update({ status: newStatus }).eq('id', booking.id)
  await supabase.from('transactions').update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('booking_id', booking.id).eq('status', 'pending')

  if (isFullPayment) {
    // Kredit langsung ke wallet vendor
    await creditWallet(
      booking.vendor_id,
      booking.vendor_received,
      'credit_order',
      booking.id,
      `Pesanan #${booking.id.slice(0, 8)} — ${(booking.services as any)?.name || 'Layanan'}`
    )
  } else {
    // DP: masuk ke pending (escrow)
    const { data: vendor } = await supabase.from('vendors').select('wallet_pending').eq('id', booking.vendor_id).single()
    await supabase.from('vendors').update({
      wallet_pending: ((vendor?.wallet_pending) || 0) + booking.dp_amount,
    }).eq('id', booking.vendor_id)
  }

  res.json({ success: true, status: newStatus, amount_paid: paidAmount })
})

// ── Vendor konfirmasi cash ───────────────────────────────────────────────────
router.post('/:id/confirm-cash', requireAuth, requireRole('vendor'), async (req, res) => {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, services(name)')
    .eq('id', req.params.id)
    .eq('vendor_id', req.user!.vendorId)
    .single()

  if (!booking) return res.status(404).json({ error: 'Not found' })
  if (booking.payment_method !== 'cash') return res.status(400).json({ error: 'Bukan pesanan cash' })

  await supabase.from('bookings').update({ status: 'fully_paid' }).eq('id', booking.id)
  await supabase.from('transactions').update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('booking_id', booking.id)

  await creditWallet(
    booking.vendor_id,
    booking.vendor_received,
    'credit_order',
    booking.id,
    `Cash — Pesanan #${booking.id.slice(0, 8)} — ${(booking.services as any)?.name}`
  )

  res.json({ success: true })
})

// ── Bayar sisa (lunas) ───────────────────────────────────────────────────────
router.post('/:id/pay-remaining', requireAuth, requireRole('customer'), async (req, res) => {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, services(name)')
    .eq('id', req.params.id)
    .eq('customer_id', req.user!.id)
    .single()

  if (!booking) return res.status(404).json({ error: 'Booking not found' })
  if (!['dp_paid', 'confirmed', 'tempo'].includes(booking.status)) {
    return res.status(400).json({ error: 'Status booking tidak memungkinkan pelunasan' })
  }

  const remaining = booking.total_amount - booking.dp_amount

  await supabase.from('transactions').insert({
    booking_id: booking.id,
    amount: remaining,
    type: 'remaining',
    payment_method: booking.payment_method,
    status: 'pending',
  })

  await supabase.from('bookings').update({ status: 'pending_remaining' }).eq('id', booking.id)

  res.json({ booking_id: booking.id, amount: remaining, payment_method: booking.payment_method })
})

// ── List pesanan saya ────────────────────────────────────────────────────────
router.get('/my', requireAuth, requireRole('customer'), async (req, res) => {
  const { status } = req.query
  let query = supabase
    .from('bookings')
    .select(`*, vendors(business_name, category, avatar_url), services(name)`)
    .eq('customer_id', req.user!.id)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// ── Detail pesanan ───────────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`*, vendors(*, vendor_bank_accounts(*)), services(*), transactions(*)`)
    .eq('id', req.params.id)
    .single()

  if (error || !data) return res.status(404).json({ error: 'Booking not found' })

  const isOwner = data.customer_id === req.user!.id || data.vendor_id === req.user!.vendorId
  if (!isOwner && req.user!.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })

  res.json(data)
})

export default router
