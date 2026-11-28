import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

export const alt = 'Firmcraft: AI for mid-size companies running an ERP'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const INK = '#13211B'
const PAPER = '#F5F7F3'
const GREEN = '#1F6A4A'
const DEEP = '#0F3D2B'
const MUTE = '#4E5D56'

export default async function OpengraphImage() {
  const dir = join(process.cwd(), 'src/assets/fonts/ledger')
  const [display, body] = await Promise.all([
    readFile(join(dir, 'og-SchibstedGrotesk-800.ttf')),
    readFile(join(dir, 'og-IBMPlexSans-400.ttf')),
  ])

  const rule = (w: number) => ({ width: w, height: 3, background: GREEN })

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: PAPER,
          padding: '64px 84px',
          fontFamily: 'Plex',
          color: INK,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <svg width="52" height="52" viewBox="0 0 40 40" fill={DEEP}>
            <rect x="9" y="4" width="5" height="26" />
            <rect x="9" y="4" width="22" height="5" />
            <rect x="9" y="15" width="16" height="5" />
            <rect x="4" y="33" width="32" height="1.6" />
            <rect x="4" y="36.4" width="32" height="1.6" />
          </svg>
          <span style={{ fontFamily: 'Schibsted', fontSize: 44, letterSpacing: '-0.02em' }}>
            Firmcraft
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 22, letterSpacing: '0.08em', color: MUTE }}>
            MID-SIZE COMPANIES RUNNING AN ERP
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              fontFamily: 'Schibsted',
              fontSize: 92,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              marginTop: 18,
            }}
          >
            <span>AI that shows up</span>
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              <span>in the P&amp;L.</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
                <span style={rule(560)} />
                <span style={rule(560)} />
              </span>
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: `2px solid ${INK}`,
            paddingTop: 22,
            fontSize: 24,
            color: MUTE,
          }}
        >
          <span>Designed, built and run inside your ERP and finance stack</span>
          <span>firmcraft.ai</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Schibsted', data: display, style: 'normal' as const, weight: 800 as const },
        { name: 'Plex', data: body, style: 'normal' as const, weight: 400 as const },
      ],
    },
  )
}
