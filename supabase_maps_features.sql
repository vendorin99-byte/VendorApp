-- ================================================================
-- Maps Features: Vendor Promo Balloon + Customer Request Balloon
-- Jalankan di Supabase SQL Editor
-- ================================================================

-- Promo vendor di maps (gratis, beda dari iklan berbayar)
CREATE TABLE IF NOT EXISTS vendor_promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  text VARCHAR(100) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_promo_per_vendor UNIQUE (vendor_id)
);

-- Hapus otomatis promo yang expired (opsional, bisa pakai pg_cron)
-- Alternatif: filter di query (expires_at > NOW())

-- Permintaan jasa customer di maps
CREATE TABLE IF NOT EXISTS map_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  lat DECIMAL(10,8) NOT NULL,
  lng DECIMAL(11,8) NOT NULL,
  category VARCHAR(50),
  description TEXT NOT NULL,
  event_date DATE,            -- tanggal acara (opsional)
  budget INTEGER,             -- estimasi budget (opsional)
  status VARCHAR(20) DEFAULT 'open',  -- open | closed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Penawaran vendor untuk request customer
CREATE TABLE IF NOT EXISTS map_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES map_requests(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  price INTEGER NOT NULL,
  note TEXT,
  status VARCHAR(20) DEFAULT 'pending',  -- pending | accepted | rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_bid_per_vendor UNIQUE (request_id, vendor_id)
);

-- RLS (opsional, sesuaikan dengan policy Supabase yang sudah ada)
-- ALTER TABLE vendor_promos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE map_requests ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE map_bids ENABLE ROW LEVEL SECURITY;

SELECT 'Migration selesai: vendor_promos, map_requests, map_bids' AS status;
