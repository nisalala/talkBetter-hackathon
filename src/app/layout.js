import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'TalkBetter - AI Communication Coach',
  description: 'Improve your speaking skills with AI-powered feedback',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen">
            <Navbar />
            <main className="px-6 py-8">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}