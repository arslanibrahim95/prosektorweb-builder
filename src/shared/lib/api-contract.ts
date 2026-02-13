import { NextResponse } from 'next/server'
import { CONTRACT_VERSION } from '@prosektor/contracts'

export const API_CONTRACT_VERSION = CONTRACT_VERSION

type JsonRecord = Record<string, unknown>

export function apiSuccess(payload: JsonRecord = {}, init?: ResponseInit) {
  return NextResponse.json(
    {
      success: true,
      version: API_CONTRACT_VERSION,
      ...payload,
    },
    init
  )
}

export function apiError(input: {
  status: number
  code: string
  error: string
  extra?: JsonRecord
}) {
  return NextResponse.json(
    {
      success: false,
      version: API_CONTRACT_VERSION,
      error: input.error,
      code: input.code,
      ...(input.extra || {}),
    },
    { status: input.status }
  )
}

export function webhookSuccess(payload: JsonRecord = {}, init?: ResponseInit) {
  return NextResponse.json(
    {
      ok: true,
      success: true,
      version: API_CONTRACT_VERSION,
      ...payload,
    },
    init
  )
}

export function webhookError(input: {
  status: number
  code: string
  error: string
  extra?: JsonRecord
}) {
  return NextResponse.json(
    {
      ok: false,
      success: false,
      version: API_CONTRACT_VERSION,
      error: input.error,
      code: input.code,
      ...(input.extra || {}),
    },
    { status: input.status }
  )
}
