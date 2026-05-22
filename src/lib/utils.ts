import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { parsePhoneNumberFromString } from "libphonenumber-js"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizePhoneNumber(phone?: string): string {
  if (!phone) return ""
  if (phone.startsWith("+")) return phone
  if (phone.length === 10) return `+91${phone}`
  return `+${phone}`
}

export function formatPhoneNumber(phone?: string): string {
  if (!phone) return ""
  if (!phone.startsWith("+")) return phone
  const parsed = parsePhoneNumberFromString(phone)
  if (parsed) return `+${parsed.countryCallingCode} ${parsed.nationalNumber}`
  return phone
}
