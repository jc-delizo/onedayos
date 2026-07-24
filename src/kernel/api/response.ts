import { NextResponse } from 'next/server'
import type { ApiError, ApiMeta, ApiResponse } from '@/sdk'

export function apiSuccess<T>(data: T, init: ResponseInit = {}, meta?: ApiMeta): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      data,
      error: null,
      ...(meta ? { meta } : {}),
    },
    init,
  )
}

export function apiCreated<T>(data: T): NextResponse<ApiResponse<T>> {
  return apiSuccess(data, { status: 201 })
}

export function apiFailure(error: ApiError, status: number): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    {
      data: null,
      error,
    },
    { status },
  )
}
