import { Router } from 'express'
import { supabase } from '../../lib/supabase'
import { verifyMidtransSignature } from '../../lib/midtrans'
import { creditWallet } from '../../services/wallet'

const router = Router()

router.post('/', async (req, res) => {
  const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = req.body

  if (!verifyMidtransSignature(order_id, status_code, gross_amount, signature_key)) {
    return res.status(403).json({ error: 'Invalid signature' })
  }

  const isPaid = transaction_status === 'settlement' ||
    (transaction_status === 'capture' && fraud_status === 'accept')

  if (!isPaid) return res.json({ received: true })

  const { data: transaction } = await supabase
    .from('transactions')
    .select('*, bookings(*)')
    .eq('tripay_reference', order_id)
    .single()

  if (!transaction || !transaction.bookings) {
    return res.status(404).json({ error: 'Transaction not found' })
  }

  const booking = transaction.bookings as any
  const isFullPayment = transaction.type === 'full'
  const newStatus = isFullPayment ? 'fully_paid' : 'dp_paid'

  await supabase.from('transactions').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', transaction.id)
  await supabase.from('bookings').update({ status: newStatus }).eq('id', booking.id)

  if (isFullPayment) {
    await creditWallet(
      booking.vendor_id,
      booking.vendor_received,
      'credit_order',
      booking.id,
      `QRIS — Pesanan #${booking.id.slice(0, 8)}`
    )
  } else {
    const { data: vendor } = await supabase.from('vendors').select('wallet_pending').eq('id', booking.vendor_id).single()
    await supabase.from('vendors').update({
      wallet_pending: ((vendor?.wallet_pending) || 0) + booking.dp_amount,
    }).eq('id', booking.vendor_id)
  }

  res.json({ success: true })
})

export default router
