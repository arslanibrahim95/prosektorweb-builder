/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BY HAND. */
import config from '@/bodyData.config'
import '@bodydatacms/next/css'
import type { ServerFunctionClient } from 'bodyData'
import { handleServerFunctions, RootLayout } from '@bodydatacms/next/layouts'
import React from 'react'

import { importMap } from './admin/importMap'
import './custom.css'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
