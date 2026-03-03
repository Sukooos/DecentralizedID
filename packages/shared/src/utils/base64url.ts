/**
 * Base64URL encoding/decoding (RFC 4648)
 * WHY: JWT uses base64url, not standard base64
 */

export const base64url = {
  encode(buffer: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },

  decode(base64url: string): Uint8Array {
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    return new Uint8Array(binary.split('').map((c: string) => c.charCodeAt(0)));
  },
};
