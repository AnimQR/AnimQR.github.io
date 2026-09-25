import qrcode from "qrcode-generator";
import type { ECLevel } from "../config";

// Encode strings as UTF-8 (the library defaults to Latin-1 truncation).
qrcode.stringToBytes = (s: string) => Array.from(new TextEncoder().encode(s));

export interface QRMatrix {
  /** Number of modules per side. */
  count: number;
  /** Row-major dark flags. */
  modules: boolean[];
  isDark(row: number, col: number): boolean;
  /** True for modules that are part of one of the three finder patterns ("eyes"). */
  isEye(row: number, col: number): boolean;
  /** Centres of the alignment patterns (as [row, col]). */
  alignments: [number, number][];
  /** True for modules inside an alignment pattern. */
  isAlignment(row: number, col: number): boolean;
}

/** Alignment-pattern centre coordinates for a given version (ISO/IEC 18004 Annex E). */
export function alignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const count = version * 4 + 17;
  const num = Math.floor(version / 7) + 2;
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (num * 2 - 2)) * 2;
  const result = [6];
  for (let pos = count - 7; result.length < num; pos -= step) result.splice(1, 0, pos);
  return result;
}

export class QRCapacityError extends Error {
  constructor() {
    super("The content is too long for a QR code at this error-correction level.");
  }
}

export function createMatrix(data: string, ec: ECLevel): QRMatrix {
  const qr = qrcode(0, ec);
  qr.addData(data, "Byte");
  try {
    qr.make();
  } catch {
    throw new QRCapacityError();
  }
  const count = qr.getModuleCount();
  const modules = new Array<boolean>(count * count);
  for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) modules[r * count + c] = qr.isDark(r, c);

  const isEye = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= count - 7) || (r >= count - 7 && c < 7);

  const pos = alignmentPositions((count - 17) / 4);
  const last = pos.length - 1;
  const alignments: [number, number][] = [];
  const alignMask = new Uint8Array(count * count);
  pos.forEach((r, i) =>
    pos.forEach((c, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
      alignments.push([r, c]);
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) alignMask[(r + dr) * count + c + dc] = 1;
    }),
  );

  return {
    count,
    modules,
    isDark: (r, c) => r >= 0 && c >= 0 && r < count && c < count && modules[r * count + c],
    isEye,
    alignments,
    isAlignment: (r, c) => alignMask[r * count + c] === 1,
  };
}
