import { createFileRoute } from '@tanstack/react-router'
import RegistryAdmin from '../components/RegistryAdmin'

export const Route = createFileRoute('/admin')({ component: RegistryAdmin, head: () => ({ meta: [{ title: 'Redaktion · Bidra' }, { name: 'robots', content: 'noindex' }] }) })
