import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const docuTheme = {
  10: "#010400",
  20: "#0A1D00",
  30: "#053100",
  40: "#003F00",
  50: "#004D04",
  60: "#005C07",
  70: "#006B0B",
  80: "#007A10",
  90: "#16891E",
  100: "#2F9730",
  110: "#46A543",
  120: "#5CB358",
  130: "#CEFFD6",
  140: "#8CCE85",
  150: "#A5DB9F",
  160: "#C0E7BB"
}

/**
 * Encodes the filename portion of a URL.
 * Only encodes the last path segment (filename) to preserve the URL structure.
 * Use this when the URL is stored raw (unencoded) in the database
 * and needs to be encoded for browser use (href, src, window.open).
 */
export const encodeUrlFilename = (url: string): string => {
  const urlParts = url.split('/')
  urlParts[urlParts.length - 1] = encodeURIComponent(urlParts[urlParts.length - 1])
  return urlParts.join('/')
}