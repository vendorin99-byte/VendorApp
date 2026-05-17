import { useEffect, useState } from 'react'
import api from '../../services/api'

function formatRp(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export default function Wallet() {
  const [wallet, setWallet] = useState<{ wallet_balance: number; wallet_pending: number } | null>(null)
  const [ledger, setLedger] = useState<any[]>([])
  const [banks, setBanks] = useState<any[]>([])
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [showAddBank, setShowAddBank] = useState(false)
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', bank_account_id: '' })
  const [bankForm, setBankForm] = useState({ bank_code: '', account_number: '', account_name: '' })

  const BANK_LIST = ['BCA', 'BNI', 'BRI', 'Mandiri', 'CIMB', 'Danamon', 'BSI', 'Permata', 'BTN', 'Jenius', 'GoPay', 'OVO', 'Dana']

  async function handleAddBank(e: React.FormEvent) {
    e.preventDefault()
    await api.post('/vendor/bank-accounts', bankForm)
    setShowAddBank(false)
    setBankForm({ bank_code: '', account_number: '', account_name: '' })
    const b = await api.get('/vendor/bank-accounts')
    setBanks(b.data || [])
  }

  useEffect(() => {
    Promise.all([
      api.get('/vendor/wallet'),
      api.get('/vendor/wallet/ledger'),
      api.get('/vendor/bank-accounts'),
    ]).then(([w, l, b]) => {
      setWallet(w.data)
      setLedger(l.data.data || [])
      setBanks(b.data || [])
    })
  }, [])

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    await api.post('/vendor/withdrawals', { amount: parseInt(withdrawForm.amount), bank_account_id: withdrawForm.bank_account_id })
    setShowWithdraw(false)
    const w = await api.get('/vendor/wallet')
    setWallet(w.data)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dompet</h1>

      <div className="bg-primary text-white rounded-2xl p-6">
        <div className="text-sm opacity-80 mb-1">Saldo Tersedia</div>
        <div className="text-3xl font-bold">{wallet ? formatRp(wallet.wallet_balance) : '-'}</div>
        <div className="text-sm opacity-70 mt-3">Dalam Proses (Escrow): {wallet ? formatRp(wallet.wallet_pending) : '-'}</div>
        <button onClick={() => setShowWithdraw(true)} className="mt-4 bg-white text-primary px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors">
          Cairkan Dana
        </button>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-4">Rekening Bank</h2>
        {banks.map((b) => (
          <div key={b.id} className="flex items-center justify-between py-2 border-b last:border-0">
            <div>
              <div className="font-medium">{b.bank_code} — {b.account_number}</div>
              <div className="text-sm text-gray-500">{b.account_name} {b.is_default && <span className="text-green-600 ml-1">✓ Default</span>}</div>
            </div>
            {!b.is_verified && <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded">Menunggu verifikasi</span>}
          </div>
        ))}
        <button onClick={() => setShowAddBank(true)} className="mt-3 text-primary text-sm font-medium hover:underline">+ Tambah Rekening</button>
      </div>

      <div className="bg-white rounded-xl border p-5">
        <h2 className="font-semibold mb-4">Riwayat Transaksi</h2>
        <div className="space-y-2">
          {ledger.map((l) => (
            <div key={l.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
              <div>
                <div className="font-medium">{l.description}</div>
                <div className="text-gray-500">{new Date(l.created_at).toLocaleDateString('id-ID')}</div>
              </div>
              <div className={`font-semibold ${l.type.startsWith('credit') ? 'text-green-600' : 'text-red-600'}`}>
                {l.type.startsWith('credit') ? '+' : '-'}{formatRp(l.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddBank && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Tambah Rekening Bank</h2>
            <form onSubmit={handleAddBank} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Bank</label>
                <select required value={bankForm.bank_code} onChange={(e) => setBankForm({ ...bankForm, bank_code: e.target.value })} className="w-full border rounded-lg px-3 py-2 bg-white text-sm">
                  <option value="">Pilih bank</option>
                  {BANK_LIST.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nomor Rekening</label>
                <input required value={bankForm.account_number} onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })} placeholder="Masukkan nomor rekening" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nama Pemilik Rekening</label>
                <input required value={bankForm.account_name} onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })} placeholder="Sesuai buku tabungan" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddBank(false)} className="flex-1 border rounded-lg py-2 text-sm">Batal</button>
                <button type="submit" className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-medium">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showWithdraw && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Ajukan Pencairan</h2>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nominal (min. Rp 50.000)</label>
                <input type="number" min="50000" required value={withdrawForm.amount} onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })} className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rekening Tujuan</label>
                <select required value={withdrawForm.bank_account_id} onChange={(e) => setWithdrawForm({ ...withdrawForm, bank_account_id: e.target.value })} className="w-full border rounded-lg px-3 py-2 bg-white">
                  <option value="">Pilih rekening</option>
                  {banks.filter(b => b.is_verified).map(b => <option key={b.id} value={b.id}>{b.bank_code} {b.account_number}</option>)}
                </select>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                <div className="flex justify-between"><span>Biaya admin</span><span>Rp 5.000</span></div>
                <div className="flex justify-between font-medium mt-1"><span>Yang diterima</span><span>{withdrawForm.amount ? formatRp(parseInt(withdrawForm.amount) - 5000) : '-'}</span></div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowWithdraw(false)} className="flex-1 border rounded-lg py-2 text-sm">Batal</button>
                <button type="submit" className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-medium">Ajukan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
