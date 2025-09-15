export function generatePin(length = 6): string {
    if (length <= 0) throw new Error("length must be > 0");
  
    // rejection sampling so each digit 0–9 is equally likely
    const out: string[] = [];
    const buf = new Uint8Array(1);
  
    while (out.length < length) {
      window.crypto.getRandomValues(buf);
      const v = buf[0];
      if (v <= 249) {               // 250..255 would skew % 10
        out.push(String(v % 10));
      }
    }
    return out.join("");
  }
  