import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typedRoutes: true,
  // ExcelJS is server-only and loads optional archive transports dynamically.
  // Keep it external so Turbopack does not require unused optional transports.
  serverExternalPackages: ['exceljs'],
}

export default nextConfig
