import { addClientFunction, clientRPC } from 'vite-plugin-devtools/client'

console.log('first devtools (devtools-test)')

addClientFunction('ping', () => {
  return 'response from client'
})

console.log('packages in the project', await clientRPC.here())
console.log('packages in the project', await clientRPC.getPackages())
console.log('static assets', await clientRPC.staticAssets())
