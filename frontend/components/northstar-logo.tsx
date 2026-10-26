'use client'

import { useId } from 'react'

type NorthstarLogoProps = {
  className?: string
  markClassName?: string
  showWordmark?: boolean
  size?: number
}

/** Brand mark: geometric N with a north-pointing star beacon. */
export function NorthstarLogo({
  className = '',
  markClassName = '',
  showWordmark = true,
  size = 32,
}: NorthstarLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <NorthstarMark size={size} className={markClassName} />
      {showWordmark && (
        <span className="text-[17px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Northstar
        </span>
      )}
    </div>
  )
}

export function NorthstarMark({
  size = 32,
  className = '',
}: {
  size?: number
  className?: string
}) {
  const gid = useId().replace(/:/g, '')
  // Match SVG rx=9 at 32px viewBox so CSS clip follows the purple mark.
  const radius = Math.round((9 / 32) * size)

  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden shadow-sm ${className}`}
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
        aria-hidden
      >
        <defs>
          <linearGradient id={`ns-bg-${gid}`} x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#818CF8" />
            <stop offset="0.55" stopColor="#4F46E5" />
            <stop offset="1" stopColor="#3730A3" />
          </linearGradient>
          <clipPath id={`ns-clip-${gid}`}>
            <rect width="32" height="32" rx="9" />
          </clipPath>
        </defs>
        <g clipPath={`url(#ns-clip-${gid})`}>
          <rect width="32" height="32" rx="9" fill={`url(#ns-bg-${gid})`} />
          <path d="M9 3.5C12 2.2 20 2.2 23 3.5C18.5 5.2 13.5 5.2 9 3.5Z" fill="white" fillOpacity="0.18" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M8.5 23.5V8.5h3.4l6.9 10.2V8.5h3.7v15h-3.4l-6.9-10.2v10.2H8.5Z"
            fill="white"
          />
          <path
            d="M22.1 5.2L22.85 7.35L25.1 8.1L22.85 8.85L22.1 11L21.35 8.85L19.1 8.1L21.35 7.35Z"
            fill="#C7D2FE"
          />
        </g>
      </svg>
    </span>
  )
}
