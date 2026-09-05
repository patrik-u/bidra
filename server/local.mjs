import {resolve} from 'node:path'
process.env.DATA_DIR=resolve('.local-data')
process.env.INTAKE_ENABLED='false'
await import('./fly.mjs')
