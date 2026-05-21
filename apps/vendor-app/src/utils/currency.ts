export function formatRp(n: number): string {
  if (n >= 1_000_000) return 'Rp ' + (n / 1_000_000).toFixed(1).replace('.0', '') + ' jt'
  return 'Rp ' + n.toLocaleString('id-ID')
}

export function formatRpFull(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID')
}
