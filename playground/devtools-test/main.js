import { addClientFunction } from 'vite-plugin-devtools/dist/client'

addClientFunction('hi', () => {
  return 'hi'
})

