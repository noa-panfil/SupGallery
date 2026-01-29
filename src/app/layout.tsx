import type { Metadata } from 'next'
import './globals.css'
import AuthProvider from '@/providers/AuthProvider'
import Navbar from './components/Navbar'

export const metadata: Metadata = {
  title: 'SupGallery - Premium Shared Gallery',
  description: 'Share your moments in style.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="container" style={{ paddingTop: '140px', paddingBottom: '40px' }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  )
}
