import type { MetadataRoute } from 'next'
import { getDemoRuntimeConfig } from '@/kernel/env/server'

export default function robots(): MetadataRoute.Robots {
  const { demoMode } = getDemoRuntimeConfig()

  if (demoMode) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
  }
}
