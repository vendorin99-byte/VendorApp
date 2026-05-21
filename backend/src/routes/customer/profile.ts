import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcrypt'
import { requireAuth } from '../../middlewares/auth'
import { requireRole } from '../../middlewares/roleCheck'
import { supabase } from '../../lib/supabase'

const router = Router()
router.use(requireAuth, requireRole('customer'))

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, phone, avatar_url, referral_code, affiliate_balance, created_at')
    .eq('id', req.user!.id)
    .single()

  if (error) return res.status(404).json({ error: 'User not found' })
  res.json(data)
})

router.put('/', async (req, res) => {
  const schema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { data, error } = await supabase
    .from('users')
    .update(parsed.data)
    .eq('id', req.user!.id)
    .select('id, name, email, phone')
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/change-password', async (req, res) => {
  const { old_password, new_password } = req.body
  if (!old_password || !new_password) return res.status(400).json({ error: 'old_password dan new_password wajib diisi' })
  if (new_password.length < 8) return res.status(400).json({ error: 'Password minimal 8 karakter' })

  const { data: user } = await supabase.from('users').select('password_hash').eq('id', req.user!.id).single()
  if (!user?.password_hash) return res.status(400).json({ error: 'Akun tidak menggunakan password' })

  const valid = await bcrypt.compare(old_password, user.password_hash)
  if (!valid) return res.status(401).json({ error: 'Password lama salah' })

  const password_hash = await bcrypt.hash(new_password, 10)
  await supabase.from('users').update({ password_hash }).eq('id', req.user!.id)
  res.json({ message: 'Password berhasil diubah' })
})

// ── Rekening Bank Customer ────────────────────────────────────────────────────

const bankAccountSchema = z.object({
  bank_code: z.string().min(2),
  account_number: z.string().min(5),
  account_name: z.string().min(3),
  is_primary: z.boolean().default(false),
})

router.get('/bank-accounts', async (req, res) => {
  const { data, error } = await supabase
    .from('customer_bank_accounts')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

router.post('/bank-accounts', async (req, res) => {
  const parsed = bankAccountSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { bank_code, account_number, account_name, is_primary } = parsed.data

  // Jika set primary, unset semua yang lain dulu
  if (is_primary) {
    await supabase.from('customer_bank_accounts')
      .update({ is_primary: false })
      .eq('user_id', req.user!.id)
  }

  const { data, error } = await supabase
    .from('customer_bank_accounts')
    .insert({ user_id: req.user!.id, bank_code, account_number, account_name, is_primary })
    .select()
    .single()

  if (error) return res.status(500).json({ error: error.message })
  res.status(201).json(data)
})

router.patch('/bank-accounts/:id/set-primary', async (req, res) => {
  await supabase.from('customer_bank_accounts').update({ is_primary: false }).eq('user_id', req.user!.id)
  const { error } = await supabase.from('customer_bank_accounts')
    .update({ is_primary: true })
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

router.delete('/bank-accounts/:id', async (req, res) => {
  const { error } = await supabase
    .from('customer_bank_accounts')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user!.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ success: true })
})

// ── Affiliate ────────────────────────────────────────────────────────────────

router.post('/affiliate/withdraw', async (req, res) => {
  const schema = z.object({
    amount: z.number().min(50000, 'Minimal pencairan Rp 50.000'),
    bank_account_id: z.string().uuid().optional(),
    bank_code: z.string().min(2).optional(),
    account_number: z.string().min(5).optional(),
    account_name: z.string().min(3).optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message })

  const { amount, bank_account_id } = parsed.data
  let bank_code = parsed.data.bank_code
  let account_number = parsed.data.account_number
  let account_name = parsed.data.account_name

  // Kalau pakai rekening tersimpan, ambil dari DB
  if (bank_account_id) {
    const { data: savedAccount } = await supabase
      .from('customer_bank_accounts')
      .select('bank_code, account_number, account_name')
      .eq('id', bank_account_id)
      .eq('user_id', req.user!.id)
      .single()

    if (!savedAccount) return res.status(404).json({ error: 'Rekening tidak ditemukan' })
    bank_code = savedAccount.bank_code
    account_number = savedAccount.account_number
    account_name = savedAccount.account_name
  }

  if (!bank_code || !account_number || !account_name)
    return res.status(400).json({ error: 'Info rekening bank wajib diisi' })

  const { data: user } = await supabase
    .from('users')
    .select('affiliate_balance')
    .eq('id', req.user!.id)
    .single()

  if (!user || (user.affiliate_balance || 0) < amount)
    return res.status(400).json({ error: 'Saldo affiliate tidak mencukupi' })

  const { error: deductErr } = await supabase
    .from('users')
    .update({ affiliate_balance: (user.affiliate_balance || 0) - amount })
    .eq('id', req.user!.id)

  if (deductErr) return res.status(500).json({ error: 'Gagal memproses pencairan' })

  await supabase.from('affiliate_transactions').insert({
    user_id: req.user!.id,
    amount,
    type: 'withdraw',
    description: `Pencairan ke ${bank_code} ${account_number} (${account_name})`,
  })

  res.json({ message: 'Pencairan berhasil diajukan, akan diproses dalam 1-3 hari kerja' })
})

router.post('/push-token', async (req, res) => {
  const { token } = req.body
  if (!token) return res.status(400).json({ error: 'Token required' })
  await supabase.from('users').update({ expo_push_token: token }).eq('id', req.user!.id)
  res.json({ success: true })
})

router.get('/affiliate', async (req, res) => {
  const [userRes, referredRes, txnsRes, banksRes] = await Promise.all([
    supabase.from('users').select('referral_code, affiliate_balance').eq('id', req.user!.id).single(),
    supabase.from('users').select('id', { count: 'exact' }).eq('referred_by', req.user!.id),
    supabase.from('affiliate_transactions').select('*').eq('user_id', req.user!.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('customer_bank_accounts').select('*').eq('user_id', req.user!.id).order('is_primary', { ascending: false }),
  ])

  const user = userRes.data
  res.json({
    referral_code: user?.referral_code,
    referral_link: `${process.env.FRONTEND_URL || 'https://web-henna-five-13.vercel.app'}/daftar?ref=${user?.referral_code}`,
    balance: user?.affiliate_balance || 0,
    total_referrals: referredRes.count || 0,
    transactions: txnsRes.data || [],
    bank_accounts: banksRes.data || [],
  })
})

export default router
