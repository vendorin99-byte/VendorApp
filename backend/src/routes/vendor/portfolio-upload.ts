import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../../middlewares/auth'
import { requireRole } from '../../middlewares/roleCheck'
import { supabase } from '../../lib/supabase'

const router = Router()
router.use(requireAuth, requireRole('vendor'))

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Hanya file gambar yang diizinkan'))
  },
})

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File tidak ditemukan' })

  const ext = req.file.originalname.split('.').pop() || 'jpg'
  const filename = `${req.user!.vendorId}/${Date.now()}.${ext}`

  const { data, error } = await supabase.storage
    .from('portfolios')
    .upload(filename, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    })

  if (error) return res.status(500).json({ error: error.message })

  const { data: urlData } = supabase.storage.from('portfolios').getPublicUrl(data.path)
  res.json({ url: urlData.publicUrl, path: data.path })
})

export default router
