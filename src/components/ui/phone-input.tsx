import * as React from "react";
import PhoneInputWithCountry, { Value, getCountryCallingCode } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { cn, normalizePhoneNumber } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface PhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  defaultCountry?: any;
}

const COUNTRY_MAX_LENGTHS: Record<string, number> = {
  IN: 10, // India
  US: 10, // United States
  CA: 10, // Canada
  GB: 10, // United Kingdom
  AU: 9,  // Australia
  SG: 8,  // Singapore
  AE: 9,  // United Arab Emirates
  SA: 9,  // Saudi Arabia
  QA: 8,  // Qatar
  KW: 8,  // Kuwait
  BH: 8,  // Bahrain
  MY: 10, // Malaysia
  ID: 12, // Indonesia
  PH: 10, // Philippines
  TH: 9,  // Thailand
  VN: 9,  // Vietnam
  JP: 10, // Japan
  KR: 10, // South Korea
  CN: 11, // China
  HK: 8,  // Hong Kong
  LK: 9,  // Sri Lanka
  NP: 10, // Nepal
  BD: 10, // Bangladesh
  PK: 10, // Pakistan
};

const CustomInput = React.forwardRef<HTMLInputElement, any>((props, ref) => {
  const { onChange, ...rest } = props;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Only allow digits, +, and spaces
    value = value.replace(/[^0-9+\s]/g, '');
    
    // Call the original onChange with cleaned value
    if (onChange) {
      onChange(e);
    }
  };
  
  return (
    <Input
      ref={ref}
      {...rest}
      onChange={handleChange}
      className={cn(
        "h-12 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold",
        props.className
      )}
    />
  );
});
CustomInput.displayName = "CustomInput";

export const PhoneInput = React.forwardRef<any, PhoneInputProps>(
  ({ value, onChange, placeholder = "Enter phone number", className, disabled, defaultCountry = "IN" }, ref) => {
    const [selectedCountry, setSelectedCountry] = React.useState<string>(defaultCountry);

    // Normalize value if it lacks country code
    const formattedValue = React.useMemo(() => {
      if (!value) return "";
      if (value.startsWith("+")) return value;
      return normalizePhoneNumber(value, selectedCountry || defaultCountry);
    }, [value, selectedCountry, defaultCountry]);

    // Detect country from existing phone number or sync if value is un-normalized
    React.useEffect(() => {
      if (value) {
        if (value.startsWith('+')) {
          try {
            const parsed = parsePhoneNumberFromString(value);
            if (parsed && parsed.country) {
              setSelectedCountry(parsed.country);
            }
          } catch (e) {
            console.log("Could not detect country from phone number:", e);
          }
        } else {
          // If value is missing '+', normalize it and update parent form
          const normalized = normalizePhoneNumber(value, selectedCountry || defaultCountry);
          if (normalized && normalized !== value) {
            onChange(normalized);
          }
        }
      }
    }, [value, selectedCountry, defaultCountry, onChange]);

    // Handle phone number input
    const handlePhoneChange = (val: string) => {
      if (!val) {
        onChange("");
        return;
      }

      // Remove any non-digit characters except + and spaces
      let cleanVal = val.replace(/[^0-9+\s]/g, "");

      try {
        const callingCode = getCountryCallingCode((selectedCountry || defaultCountry) as any);
        const prefix = `+${callingCode}`;

        if (cleanVal.startsWith(prefix)) {
          const nationalNumber = cleanVal.slice(prefix.length).replace(/\D/g, "");
          const maxLen = COUNTRY_MAX_LENGTHS[selectedCountry || defaultCountry] || 15;
          if (nationalNumber.length > maxLen) {
            cleanVal = `${prefix}${nationalNumber.slice(0, maxLen)}`;
          }
        }
      } catch (e) {}

      onChange(cleanVal);
    };

    return (
      <div className={cn("phone-input-wrapper relative w-full", className)}>
        <PhoneInputWithCountry
          ref={ref}
          placeholder={placeholder}
          value={(formattedValue || "") as Value}
          onChange={(val) => handlePhoneChange(val || "")}
          onCountryChange={(country) => {
            if (country) {
              setSelectedCountry(country);
            }
          }}
          disabled={disabled}
          inputComponent={CustomInput}
          international={true}
          withCountryCallingCode={true}
          countryCallingCodeEditable={false}
          defaultCountry={defaultCountry}
        />
      </div>
    );
  }
);
PhoneInput.displayName = "PhoneInput";
