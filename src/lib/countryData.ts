export interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  minLength: number;
  maxLength: number;
  placeholder: string;
}

export const COUNTRIES: Country[] = [
  { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳", minLength: 10, maxLength: 10, placeholder: "98765 43210" },
  { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸", minLength: 10, maxLength: 10, placeholder: "415 555 2671" },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦", minLength: 10, maxLength: 10, placeholder: "416 555 0199" },
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧", minLength: 10, maxLength: 11, placeholder: "7911 123456" },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "🇦🇪", minLength: 9, maxLength: 9, placeholder: "50 123 4567" },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966", flag: "🇸🇦", minLength: 9, maxLength: 9, placeholder: "51 234 5678" },
  { name: "Singapore", code: "SG", dialCode: "+65", flag: "🇸🇬", minLength: 8, maxLength: 8, placeholder: "8123 4567" },
  { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺", minLength: 9, maxLength: 9, placeholder: "412 345 678" },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪", minLength: 10, maxLength: 11, placeholder: "151 23456789" },
  { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷", minLength: 9, maxLength: 9, placeholder: "6 12 34 56 78" },
  { name: "Qatar", code: "QA", dialCode: "+974", flag: "🇶🇦", minLength: 8, maxLength: 8, placeholder: "3312 3456" },
  { name: "Kuwait", code: "KW", dialCode: "+965", flag: "🇰🇼", minLength: 8, maxLength: 8, placeholder: "5123 4567" },
  { name: "Oman", code: "OM", dialCode: "+968", flag: "🇴🇲", minLength: 8, maxLength: 8, placeholder: "9123 4567" },
  { name: "Bahrain", code: "BH", dialCode: "+973", flag: "🇧🇭", minLength: 8, maxLength: 8, placeholder: "3612 3456" },
  { name: "Malaysia", code: "MY", dialCode: "+60", flag: "🇲🇾", minLength: 9, maxLength: 10, placeholder: "12 345 6789" },
  { name: "Philippines", code: "PH", dialCode: "+63", flag: "🇵🇭", minLength: 10, maxLength: 10, placeholder: "917 123 4567" },
  { name: "Japan", code: "JP", dialCode: "+81", flag: "🇯🇵", minLength: 10, maxLength: 10, placeholder: "90 1234 5678" },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // India (+91)

export function findCountryByDialCode(dialCode: string): Country {
  const normalized = dialCode.startsWith("+") ? dialCode : `+${dialCode}`;
  return COUNTRIES.find((c) => c.dialCode === normalized) || DEFAULT_COUNTRY;
}

export function validatePhoneNumber(phone: string, country: Country): { isValid: boolean; error?: string } {
  const digits = phone.replace(/\D/g, "");
  if (!digits) {
    return { isValid: false, error: "Phone number is required." };
  }
  if (digits.length < country.minLength || digits.length > country.maxLength) {
    if (country.minLength === country.maxLength) {
      return {
        isValid: false,
        error: `Please enter a valid ${country.minLength}-digit mobile number for ${country.name}.`,
      };
    }
    return {
      isValid: false,
      error: `Please enter a valid ${country.minLength}-${country.maxLength} digit mobile number for ${country.name}.`,
    };
  }
  return { isValid: true };
}

export function formatE164(phone: string, country: Country): string {
  let digits = phone.replace(/\D/g, "");
  const dialDigits = country.dialCode.replace(/\D/g, "");

  // If user already typed the dial code prefix, strip it
  if (digits.startsWith(dialDigits) && digits.length > dialDigits.length) {
    digits = digits.slice(dialDigits.length);
  }

  // Strip leading 0 if present (common in UK, UAE, etc.)
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return `${country.dialCode}${digits}`;
}
