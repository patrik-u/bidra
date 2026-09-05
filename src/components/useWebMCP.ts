import { useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { searchInitiatives } from '../data/initiatives'

type ModelContext = {
  registerTool: (tool: {
    name: string; title: string; description: string; inputSchema: object;
    annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
    execute: (input: unknown) => unknown;
  }, options: { signal: AbortSignal }) => void | Promise<void>
}
declare global { interface Document { readonly modelContext?: ModelContext } }

export function useWebMCP(searchAll: (query: string) => void) {
  const action = useRef(searchAll)
  action.current = searchAll
  useEffect(() => {
    const context = document.modelContext
    if (!context?.registerTool) return
    const lifecycle = new AbortController()
    try {
      Promise.resolve(context.registerTool({
        name: 'search_bidra_initiatives', title: 'Sök initiativ i Bidra',
        description: 'Search the curated Swedish initiative catalog, reset other filters and display matching cards and map markers. Does not donate or contact organizations.',
        inputSchema: { type: 'object', properties: { query: { type: 'string', maxLength: 300 } }, required: ['query'], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: true },
        execute(input) {
          if (!input || typeof input !== 'object' || !('query' in input) || typeof input.query !== 'string' || input.query.length > 300 || Object.keys(input).some(key => key !== 'query')) throw new Error('Ange endast query som en text med högst 300 tecken.')
          const query = input.query.trim()
          flushSync(() => action.current(query))
          const results = searchInitiatives(query)
          return { count: results.length, initiatives: results.map(({ id, title, organization, region, source }) => ({ id, title, organization, region, source })) }
        },
      }, { signal: lifecycle.signal })).catch(() => { /* Optional browser capability; the interface remains usable. */ })
    } catch { /* Unsupported implementations should not affect discovery. */ }
    return () => lifecycle.abort()
  }, [])
}
