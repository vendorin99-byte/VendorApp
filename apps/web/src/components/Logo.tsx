export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 48, md: 64, lg: 88 }[size]
  const textSize = { sm: '11px', md: '14px', lg: '19px' }[size]

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={dims}
        height={Math.round(dims * 0.85)}
        viewBox="0 0 120 102"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Blue top parallelogram */}
        <polygon points="4,50 23,4 87,4 68,50" fill="#1D80FF" />
        {/* Indigo bottom parallelogram */}
        <polygon points="34,56 53,100 117,100 98,56" fill="#3D3DBF" />
      </svg>
      <span
        style={{
          fontWeight: 800,
          fontSize: textSize,
          color: '#3D3DBF',
          letterSpacing: '0.12em',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        VENDOR APP
      </span>
    </div>
  )
}
