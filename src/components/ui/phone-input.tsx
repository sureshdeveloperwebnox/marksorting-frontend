import * as React from "react";
import PhoneInputWithCountry, { Value, getCountryCallingCode } from "react-phone-number-input";
import "react-phone-number-input/style.css";
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
  return (
    <Input
      ref={ref}
      {...props}
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
    const normalizedValue = value ? normalizePhoneNumber(value) : value;

    // Reset selected country when default country changes
    React.useEffect(() => {
      if (defaultCountry) {
        setSelectedCountry(defaultCountry);
      }
    }, [defaultCountry]);

    // Sync and truncate value immediately when selectedCountry or value changes
    React.useEffect(() => {
      if (value && selectedCountry) {
        try {
          const callingCode = getCountryCallingCode(selectedCountry as any);
          const prefix = `+${callingCode}`;
          if (value.startsWith(prefix)) {
            const nationalNumber = value.slice(prefix.length).replace(/\D/g, "");
            const maxLen = COUNTRY_MAX_LENGTHS[selectedCountry] || 15;
            if (nationalNumber.length > maxLen) {
              const truncatedNational = nationalNumber.slice(0, maxLen);
              onChange(`${prefix}${truncatedNational}`);
            }
          }
        } catch (e) {
          console.error("Phone number sync truncation error:", e);
        }
      }
    }, [selectedCountry, value, onChange]);

    const handlePhoneChange = (val: string) => {
      if (!val) {
        onChange("");
        return;
      }

      // Perform strict local number digit restriction per country dynamically using selectedCountry
      try {
        if (selectedCountry) {
          const callingCode = getCountryCallingCode(selectedCountry as any);
          const prefix = `+${callingCode}`;
          
          if (val.startsWith(prefix)) {
            const nationalNumber = val.slice(prefix.length).replace(/\D/g, "");
            const maxLen = COUNTRY_MAX_LENGTHS[selectedCountry] || 15;
            
            if (nationalNumber.length > maxLen) {
              const truncatedNational = nationalNumber.slice(0, maxLen);
              onChange(`${prefix}${truncatedNational}`);
              return;
            }
          }
        }
      } catch (e) {
        console.error("Phone number limit error:", e);
      }

      onChange(val);
    };

    return (
      <div className={cn("phone-input-wrapper relative w-full", className)}>
        <PhoneInputWithCountry
          ref={ref}
          placeholder={placeholder}
          value={normalizedValue as Value}
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
          limitMaxLength={true}
        />
      </div>
    );
  }
);
PhoneInput.displayName = "PhoneInput";
