import type { BirpcReturn, BirpcGroupReturn } from 'birpc'

export interface DefaultServerFunctions {
  staticAssets(): Promise<AssetInfo[]>
  getImageMeta(filepath: string): Promise<ImageMeta | undefined>
  getTextAssetContent(filepath: string, limit?: number): Promise<string | undefined>
  getPackages(): Promise<{ packages: Record<string, string> }>
}

export interface ServerFunctions {
}

export interface ClientFunctions {
}

export type ServerRPC = BirpcGroupReturn<ClientFunctions>
export type ServerFunction = (this: ServerRPC, ...args: any) => any
export type ToServerFunction<T extends (...args: any[]) => any> = (this: ServerRPC, ...args: Parameters<T>) => ReturnType<T>

export type ClientRPC = BirpcReturn<DefaultServerFunctions & ServerFunctions, ClientFunctions>
export type ClientFunction = (this: ClientRPC, ...args: any) => any
export type ToClientFunction<T extends (...args: any[]) => any> = (this: ClientRPC, ...args: Parameters<T>) => ReturnType<T>

export type AssetType = 'image' | 'font' | 'video' | 'audio' | 'text' | 'json' | 'other'
export interface AssetInfo {
  path: string
  type: AssetType
  publicPath: string
  filePath: string
  size: number
  mtime: number
}
export interface ImageMeta {
  width: number
  height: number
  orientation?: number
  type?: string
  mimeType?: string
}
