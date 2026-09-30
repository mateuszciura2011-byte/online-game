export type AssetKind = 'model' | 'animation' | 'music' | 'sound' | 'texture';
export interface LicensedAsset { id: string; kind: AssetKind; sourceUrl: string; author: string; licenseId: string; attributionRequired: boolean; compressedBytes: number; triangleCount?: number; role?: 'object' | 'player' | 'map'; }
export const ASSET_MANIFEST: readonly LicensedAsset[] = [
  { id: 'polystrike-procedural-arena', kind: 'model', sourceUrl: 'internal://polystrike/depot', author: 'PolyStrike', licenseId: 'MIT', attributionRequired: false, compressedBytes: 0, triangleCount: 1800, role: 'map' },
  { id: 'synth-ui', kind: 'sound', sourceUrl: 'internal://polystrike/audio/synth-ui', author: 'PolyStrike', licenseId: 'MIT', attributionRequired: false, compressedBytes: 0 },
];
export function validateAsset(asset: LicensedAsset) { if (!asset.id || !asset.author.trim() || !asset.sourceUrl.trim() || !asset.licenseId.trim()) return 'missing_license_metadata'; const byteLimit = asset.role === 'map' ? 20_000_000 : asset.role === 'player' ? 500_000 : 150_000; if (asset.compressedBytes > byteLimit) return 'compressed_size_budget_exceeded'; const triangleLimit = asset.role === 'map' ? Number.POSITIVE_INFINITY : asset.role === 'player' ? 25_000 : 8_000; if ((asset.triangleCount ?? 0) > triangleLimit) return 'triangle_budget_exceeded'; return undefined; }
export function validateManifest(manifest: readonly LicensedAsset[] = ASSET_MANIFEST) { return manifest.map((asset) => ({ id: asset.id, error: validateAsset(asset) })).filter((result) => result.error); }
