import { addClientFunction, clientRPC, changePosition } from 'vite-plugin-devtools/dist/client'

console.log('first devtools (devtools-test)')

addClientFunction('ping', () => {
  console.log('ping called from the server!')
  return 'response from client'
})

console.log('packages in the project', await clientRPC.getPackages())
console.log('static assets', await clientRPC.staticAssets())
