export function encrypt(value: string): string {
  return Buffer.from(value, 'utf-8').toString('base64')
}
