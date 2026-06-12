import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const alt = 'Firmcraft — AI Consulting & Managed AI for Small Business'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const [serifItalic, geist, geistMedium] = await Promise.all([
    readFile(join(process.cwd(), 'src/assets/fonts/SourceSerif4-It.otf')),
    readFile(join(process.cwd(), 'node_modules/geist/dist/fonts/geist-sans/Geist-Regular.ttf')),
    readFile(join(process.cwd(), 'node_modules/geist/dist/fonts/geist-sans/Geist-Medium.ttf')),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0B1220',
          padding: '72px 84px',
          fontFamily: 'Geist',
        }}
      >
        {/* Wordmark — italic serif F tucked into upright Geist, per brand lockup */}
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span
            style={{
              fontFamily: 'SourceSerif',
              fontStyle: 'italic',
              fontSize: 64,
              color: '#2C6BF0',
              letterSpacing: '-0.04em',
            }}
          >
            F
          </span>
          <span
            style={{
              fontFamily: 'GeistMedium',
              fontSize: 51,
              color: '#F4F6FA',
              letterSpacing: '-0.024em',
            }}
          >
            irmcraft
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontFamily: 'GeistMedium',
              fontSize: 64,
              lineHeight: 1.12,
              color: '#F4F6FA',
              letterSpacing: '-0.022em',
              maxWidth: 980,
            }}
          >
            AI consulting & managed AI
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'SourceSerif',
              fontStyle: 'italic',
              fontSize: 64,
              lineHeight: 1.12,
              color: '#2C6BF0',
              letterSpacing: '-0.018em',
            }}
          >
            for small business.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(244,246,250,0.18)',
            paddingTop: 28,
            fontSize: 24,
            color: '#94A3B8',
          }}
        >
          <span>firmcraft.ai</span>
          <span>Sovereign by default · Springfield, IL · Houston, TX</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'SourceSerif', data: serifItalic, style: 'italic' as const },
        { name: 'Geist', data: geist, style: 'normal' as const },
        { name: 'GeistMedium', data: geistMedium, style: 'normal' as const },
      ],
    },
  )
}
