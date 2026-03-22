import './globals.css'

export const metadata = {
  title: 'Family Command Center',
  description: 'Unified family task and calendar hub',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
