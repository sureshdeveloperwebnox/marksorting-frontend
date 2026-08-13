"use client";

import * as React from "react";
import {
  Building2,
  Image as ImageIcon,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import { useCompanySettings, useUpsertSettings } from "@/services/setting-service";
import { useS3Upload } from "@/hooks/use-s3-upload";
import { cn } from "@/lib/utils";

const COMPANY_GROUP = "COMPANY";

const COMPANY_FIELDS = [
  {
    key: "COMPANY_HEADER_LOGO_URL",
    label: "Header Logo",
    defaultValue: "",
    type: "image",
  },
  {
    key: "COMPANY_NAME",
    label: "Company Name",
    defaultValue: "Mendo controls",
    type: "text",
  },
  {
    key: "COMPANY_PARTNER_DESCRIPTION",
    label: "Partner Description",
    defaultValue: "Authorized Service & Installation Partner of Promech Industries Private Limited",
    type: "textarea",
  },
  {
    key: "COMPANY_ADDRESS_LINE_1",
    label: "Address Line 1",
    defaultValue: "7/237 B, Pattanam to Peedampalli Main Road",
    type: "text",
  },
  {
    key: "COMPANY_ADDRESS_LINE_2",
    label: "Address Line 2",
    defaultValue: "Nagamanaickenpalayam, Coimbatore - 641 016",
    type: "text",
  },
  {
    key: "COMPANY_REGION",
    label: "State / Country",
    defaultValue: "Tamilnadu, India",
    type: "text",
  },
  {
    key: "COMPANY_EMAIL",
    label: "Email",
    defaultValue: "mendocontrols@gmail.com",
    type: "email",
  },
  {
    key: "COMPANY_TOLL_FREE",
    label: "Toll Free",
    defaultValue: "7305071111",
    type: "tel",
  },
  {
    key: "COMPANY_CELL_NUMBERS",
    label: "Cell Numbers",
    defaultValue: "99943 99005 / 99437 96666",
    type: "tel",
  },
  {
    key: "COMPANY_GST_NO",
    label: "GST No",
    defaultValue: "",
    type: "text",
  },
] as const;

type CompanyFieldKey = (typeof COMPANY_FIELDS)[number]["key"];
type CompanyForm = Record<CompanyFieldKey, string>;

const defaultForm = COMPANY_FIELDS.reduce((acc, field) => {
  acc[field.key] = field.defaultValue;
  return acc;
}, {} as CompanyForm);

export default function CompanySettingsPage() {
  const { data, isLoading } = useCompanySettings();
  const upsertSettings = useUpsertSettings();
  const { uploadFile, isUploading: isUploadingLogo, uploadProgress } = useS3Upload();
  const [form, setForm] = React.useState<CompanyForm>(defaultForm);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!data?.settings) return;

    const nextForm = { ...defaultForm };
    for (const setting of data.settings) {
      if (setting.key in nextForm) {
        nextForm[setting.key as CompanyFieldKey] = setting.value;
      }
    }
    setForm(nextForm);
  }, [data]);

  const updateField = (key: CompanyFieldKey, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const resetToDefaults = () => {
    setForm(defaultForm);
    toast.info("Default company details restored in the form");
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo image must be 2 MB or smaller");
      return;
    }

    const result = await uploadFile(file);
    if (result?.fileUrl) {
      updateField("COMPANY_HEADER_LOGO_URL", result.fileUrl);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const companyName = form.COMPANY_NAME.trim();
    const email = form.COMPANY_EMAIL.trim();

    if (!companyName) {
      toast.error("Company name is required");
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid company email");
      return;
    }

    const gstNo = form.COMPANY_GST_NO.trim();
    if (gstNo && !/^[0-9A-Z]{15}$/.test(gstNo)) {
      toast.error("GST No must be 15 uppercase letters and numbers");
      return;
    }

    await upsertSettings.mutateAsync(
      COMPANY_FIELDS.map((field) => ({
        key: field.key,
        value: form[field.key].trim(),
        group: COMPANY_GROUP,
      }))
    );
  };

  const isSaving = upsertSettings.isPending;
  const isBusy = isLoading || isSaving || isUploadingLogo;
  const logoUrl = form.COMPANY_HEADER_LOGO_URL.trim();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-lg border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300">
            <Building2 size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-gray-950 dark:text-white">
              Company Settings
            </h1>
            <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              Maintain the company header details used in reports and documents.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={resetToDefaults}
            disabled={isBusy}
            className="h-10 gap-2 rounded-lg px-4 font-bold"
          >
            <RotateCcw size={15} />
            Restore Defaults
          </Button>
          <Button
            type="submit"
            form="company-settings-form"
            disabled={isBusy}
            className="h-10 gap-2 rounded-lg bg-primary px-5 font-bold text-white hover:bg-primary/90"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={15} />}
            Save Details
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <form
          id="company-settings-form"
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900"
        >
          <div className="mb-5 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className="relative flex h-28 w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-400 transition hover:border-primary/50 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-gray-950 sm:w-48"
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Company header logo"
                    className="h-full w-full object-contain p-3"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <UploadCloud size={28} />
                    <span className="text-xs font-black uppercase tracking-widest">
                      Upload Logo
                    </span>
                  </div>
                )}
                {isUploadingLogo && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/85 backdrop-blur-sm dark:bg-gray-950/85">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-xs font-black text-primary">{uploadProgress}%</span>
                  </div>
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <ImageIcon size={16} className="text-teal-600" />
                  <p className="text-xs font-black uppercase tracking-widest text-primary/80">
                    Header Logo Image
                  </p>
                </div>
                <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Upload the logo shown above the company header in reports. PNG, JPG, WebP, GIF, or SVG up to 2 MB.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isBusy}
                    className="h-9 gap-2 rounded-lg font-bold"
                  >
                    <UploadCloud size={15} />
                    {logoUrl ? "Change Logo" : "Upload Logo"}
                  </Button>
                  {logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => updateField("COMPANY_HEADER_LOGO_URL", "")}
                      disabled={isBusy}
                      className="h-9 gap-2 rounded-lg font-bold text-rose-600 hover:text-rose-700"
                    >
                      <X size={15} />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {COMPANY_FIELDS.filter((field) => field.type !== "image").map((field) => {
              const controlClassName =
                "min-h-11 rounded-lg border-gray-200 bg-gray-50 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus-visible:ring-primary/20 dark:border-white/10 dark:bg-white/5 dark:text-gray-100";

              return (
                <div
                  key={field.key}
                  className={cn(
                    "space-y-1.5",
                    field.type === "textarea" && "md:col-span-2"
                  )}
                >
                  <label
                    htmlFor={field.key}
                    className="text-xs font-black uppercase tracking-widest text-primary/80"
                  >
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <Textarea
                      id={field.key}
                      value={form[field.key]}
                      onChange={(event) => updateField(field.key, event.target.value)}
                      rows={3}
                      disabled={isBusy}
                      className={controlClassName}
                    />
                  ) : (
                    <Input
                      id={field.key}
                      type={field.type}
                      value={form[field.key]}
                      onChange={(event) => updateField(field.key, event.target.value)}
                      disabled={isBusy}
                      className={controlClassName}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </form>

        <section className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-400">
            <Building2 size={16} />
            Live Preview
          </div>

          <div className="rounded-lg border border-gray-200 bg-white px-5 py-7 shadow-inner dark:border-white/10 dark:bg-gray-950">
            <div className="flex items-start gap-6">
              {/* Logo – left side */}
              <div className="shrink-0" style={{ width: "140px", minHeight: "56px" }}>
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="Company header logo"
                    className="max-h-14 max-w-[140px] object-contain"
                  />
                )}
              </div>

              {/* Company details – right-aligned */}
              <div className="flex-1 text-right">
                <h2 className="text-2xl font-black tracking-normal text-emerald-800 dark:text-emerald-300">
                  {form.COMPANY_NAME || "Company Name"}
                </h2>
                {(() => {
                  const desc = form.COMPANY_PARTNER_DESCRIPTION || "Partner Description";
                  const match = desc.match(/^(.+?\bpartner)\s+(of\b.+)$/i);
                  return (
                    <p className="mt-0.5 text-sm font-bold leading-snug text-orange-600 dark:text-orange-400">
                      {match ? (
                        <>
                          ({match[1]}
                          <br />
                          {match[2]})
                        </>
                      ) : (
                        `(${desc})`
                      )}
                    </p>
                  );
                })()}
                <div className="mt-1.5 space-y-0 text-sm font-extrabold leading-snug text-gray-800 dark:text-gray-100">
                  {form.COMPANY_ADDRESS_LINE_1 && <p>{form.COMPANY_ADDRESS_LINE_1}</p>}
                  {form.COMPANY_ADDRESS_LINE_2 && <p>{form.COMPANY_ADDRESS_LINE_2}</p>}
                  <p>
                    {form.COMPANY_REGION || "State / Country"}
                    {form.COMPANY_EMAIL ? `, E-mail : ${form.COMPANY_EMAIL}` : ""}
                  </p>
                  <p>
                    {form.COMPANY_TOLL_FREE ? `Toll Free : ${form.COMPANY_TOLL_FREE}` : ""}
                    {form.COMPANY_CELL_NUMBERS ? ` / Cell : ${form.COMPANY_CELL_NUMBERS}` : ""}
                  </p>
                  {form.COMPANY_GST_NO && <p>GST No : {form.COMPANY_GST_NO}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex min-w-0 items-start gap-2 rounded-lg bg-gray-50 p-3 dark:bg-white/5">
              <Mail size={16} className="mt-0.5 shrink-0 text-orange-500" />
              <span className="min-w-0 break-words font-semibold leading-snug">
                {form.COMPANY_EMAIL || "No email"}
              </span>
            </div>
            <div className="flex min-w-0 items-start gap-2 rounded-lg bg-gray-50 p-3 dark:bg-white/5">
              <Phone size={16} className="mt-0.5 shrink-0 text-teal-600" />
              <span className="min-w-0 break-words font-semibold leading-snug">
                {form.COMPANY_TOLL_FREE || "No phone"}
              </span>
            </div>
            <div className="flex min-w-0 items-start gap-2 rounded-lg bg-gray-50 p-3 dark:bg-white/5">
              <MapPin size={16} className="mt-0.5 shrink-0 text-rose-500" />
              <span className="min-w-0 break-words font-semibold leading-snug">
                {[form.COMPANY_ADDRESS_LINE_1, form.COMPANY_ADDRESS_LINE_2, form.COMPANY_REGION]
                  .filter(Boolean)
                  .join(", ") || "No address"}
              </span>
            </div>
            <div className="flex min-w-0 items-start gap-2 rounded-lg bg-gray-50 p-3 dark:bg-white/5">
              <Building2 size={16} className="mt-0.5 shrink-0 text-teal-600" />
              <span className="min-w-0 break-words font-semibold leading-snug">
                GST No : {form.COMPANY_GST_NO || "Not set"}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
