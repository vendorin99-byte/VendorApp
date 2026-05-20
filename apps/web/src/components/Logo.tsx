export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 48, md: 72, lg: 100 }[size]

  return (
    <img
      src="/Logo.png"
      alt="Vendor App"
      width={dims}
      height={dims}
      style={{ objectFit: 'contain' }}
    />
  )
}
