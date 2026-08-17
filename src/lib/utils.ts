import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { parsePhoneNumberFromString } from "libphonenumber-js"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizePhoneNumber(phone?: string, defaultCountry = "IN"): string {
  if (!phone) return ""
  const trimmed = phone.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("+")) return trimmed

  const digits = trimmed.replace(/\D/g, "")
  if (!digits) return ""

  try {
    const parsed = parsePhoneNumberFromString(trimmed, defaultCountry as any)
    if (parsed && parsed.isValid()) {
      return parsed.number
    }
  } catch (e) {}

  if (digits.length === 10) {
    return `+91${digits}`
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`
  }
  return `+${digits}`
}

export function formatPhoneNumber(phone?: string): string {
  if (!phone) return ""
  const normalized = normalizePhoneNumber(phone)
  const parsed = parsePhoneNumberFromString(normalized)
  if (parsed) return `+${parsed.countryCallingCode} ${parsed.nationalNumber}`
  return phone
}
