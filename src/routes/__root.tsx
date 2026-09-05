import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Bidra – hitta din väg att göra skillnad',
      },
      { name: 'description', content: 'Upptäck initiativ för människor, djur och natur i Sverige. Hitta något du bryr dig om och bidra direkt hos organisationen.' },
      { name: 'theme-color', content: '#ffffff' },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/bidra-symbol.svg' },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}

        <Scripts />
      </body>
    </html>
  )
}
