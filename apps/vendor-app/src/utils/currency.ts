export function formatRp(n: number | null | undefined): string {
  const v = n ?? 0
  if (v >= 1_000_000) return 'Rp ' + (v / 1_000_000).toFixed(1).replace('.0', '') + ' jt'
  return 'Rp ' + v.toLocaleString('id-ID')
}

export function formatRpFull(n: number | null | undefined): string {
  return 'Rp ' + (n ?? 0).toLocaleString('id-ID')
}
