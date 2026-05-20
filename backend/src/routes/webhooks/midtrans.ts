import { Router } from 'express'
import { supabase } from '../../lib/supabase'
import { verifyMidtransSignature } from '../../lib/midtrans'
import { creditWallet } from '../../services/wallet'
import { sendPushNotification } from '../../services/pushNotification'

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
    .select('*, bookings(*, services(name), vendors(user_id))')
    .eq('tripay_reference', order_id)
    .single()

  if (!transaction || !transaction.bookings) {
    return res.status(404).json({ error: 'Transaction not found' })
  }

  const booking = transaction.bookings as any
  const serviceName = booking.services?.name || 'Layanan'

  // full = bayar lunas sekaligus, remaining = pelunasan DP
  const isFullPayment = transaction.type === 'full' || transaction.type === 'remaining'
  const isDp = transaction.type === 'dp'
  const newStatus = isFullPayment ? 'fully_paid' : 'dp_paid'

  await supabase.from('transactions').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', transaction.id)
  await supabase.from('bookings').update({ status: newStatus }).eq('id', booking.id)

  if (isFullPayment) {
    await creditWallet(
      booking.vendor_id,
      booking.vendor_received,
      'credit_order',
      booking.id,
      `QRIS ${transaction.type === 'remaining' ? 'Pelunasan' : 'Lunas'} — #${booking.id.slice(0, 8)} ${serviceName}`
    )
    // Notif vendor: uang masuk
    const vendorUserId = booking.vendors?.user_id
    if (vendorUserId) {
      await sendPushNotification(
        vendorUserId,
        '💰 Pembayaran Diterima!',
        `Pelunasan pesanan "${serviceName}" telah dikonfirmasi. Dana menuju dompet Anda.`,
        { type: 'payment_received', bookingId: booking.id }
      )
    }
    // Notif customer: sukses bayar lunas
    await sendPushNotification(
      booking.customer_id,
      '✅ Pembayaran Lunas Berhasil!',
      `Pesanan "${serviceName}" sudah lunas dan sedang diproses vendor.`,
      { type: 'payment_success', bookingId: booking.id }
    )
  } else if (isDp) {
    // DP masuk ke escrow (wallet_pending)
    const { data: vendor } = await supabase.from('vendors').select('wallet_pending').eq('id', booking.vendor_id).single()
    await supabase.from('vendors').update({
      wallet_pending: ((vendor?.wallet_pending) || 0) + booking.dp_amount,
    }).eq('id', booking.vendor_id)

    // Notif vendor: DP masuk, minta konfirmasi
    const vendorUserId = booking.vendors?.user_id
    if (vendorUserId) {
      await sendPushNotification(
        vendorUserId,
        '🔔 DP Diterima — Konfirmasi Pesanan',
        `DP pesanan "${serviceName}" sudah masuk. Buka app untuk konfirmasi.`,
        { type: 'dp_received', bookingId: booking.id }
      )
    }
    // Notif customer: DP sukses
    await sendPushNotification(
      booking.customer_id,
      '✅ DP Berhasil Dibayar!',
      `DP untuk "${serviceName}" sudah diterima. Menunggu konfirmasi vendor.`,
      { type: 'dp_paid', bookingId: booking.id }
    )
  }

  res.json({ success: true })
})

export default router
