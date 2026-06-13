'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Save,
  Loader2,
  Building2,
  Users,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  CalendarDays,
  Cpu,
  FileText,
  Wrench,
  Package,
  Wind,
  Gauge,
  Pen,
  ClipboardCheck,
  Tag,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { normalizePhoneNumber } from '@/lib/utils';
import { useCreateInstallationReport, useUpdateInstallationReport, useInstallationReport } from '@/services/installation-report-service';
import { useMills } from '@/services/mill-service';
import { useCustomers } from '@/services/customer-service';
import useInstallationReportStore from '@/store/useInstallationReportStore';
import { TechnicianMultiSelect } from '@/components/ui/technician-multi-select';
import { SignaturePad } from '@/components/ui/signature-pad';
import { PhoneInput } from '@/components/ui/phone-input';
import { useS3Upload } from '@/hooks/use-s3-upload';
import { isValidPhoneNumber } from 'react-phone-number-input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';

const GROUND_EARTH_FIELD_OPTIONS = [
  { value: 'PRIMARY', label: 'Primary' },
  { value: 'SECONDARY', label: 'Secondary' },
  { value: 'REJECTION_1', label: 'Rejection 1' },
  { value: 'REJECTION_2', label: 'Rejection 2' },
  { value: 'SPLIT', label: 'Split' },
] as const;

type GroundEarthFieldValue = (typeof GROUND_EARTH_FIELD_OPTIONS)[number]['value'];

const normalizeGroundEarthField = (value?: string | null | undefined): GroundEarthFieldValue | '' => {
  return GROUND_EARTH_FIELD_OPTIONS.some((option) => option.value === value)
    ? (value as GroundEarthFieldValue)
    : '';
};

const installationReportSchema = z.object({
  technician_ids: z.array(z.string()).min(1, 'At least one engineer is required'),
  mill_id: z.string().min(1, 'Mill is required'),
  place: z.string().min(2, 'Place is required'),
  mill_whatsapp_number: z
    .string()
    .min(1, 'WhatsApp number is required')
    .refine((val) => !val || isValidPhoneNumber(val), {
      message: 'Please enter a valid WhatsApp number with country code',
    }),
  mill_email: z.string().optional().or(z.literal('')),
  visit_date: z.string().min(1, 'Date is required'),
  visit_time: z.string().optional(),
  call_registered_date: z.string().min(1, 'Call registered date is required'),
  machine_model: z.string().min(1, 'Machine model is required'),
  serial_or_frame_no: z.string().min(1, 'Serial/Frame no is required'),
  authorized_person: z.string().min(1, 'Authorized person is required'),
  invoice_number: z.string().optional().or(z.literal('')),
  invoice_date: z.string().optional().or(z.literal('')),
  warranty_start_date: z.string().optional().or(z.literal('')),
  warranty_end_date: z.string().optional().or(z.literal('')),
  commodity: z.string().optional().or(z.literal('')),
  contamination: z.string().optional().or(z.literal('')),
  output_capacity_per_hour: z.string().optional().or(z.literal('')),
  rejection_ratio: z.string().optional().or(z.literal('')),
  purity: z.string().optional().or(z.literal('')),
  no_of_programs_set: z.preprocess((val) => val === '' || val === null || val === undefined ? undefined : Number(val), z.number().min(0).optional()),
  ac_provided: z.string().min(1, 'AC status is required'),
  compressor_details: z.string().optional().or(z.literal('')),
  air_drier_details: z.string().optional().or(z.literal('')),
  ground_earth_provided: z.string().min(1, 'Ground Earth status is required'),
  ground_earth_value: z.preprocess((val) => val === '' || val === null || val === undefined ? undefined : Number(val), z.number().min(1).max(12).optional()),
  ground_earth_field: z.enum(['PRIMARY', 'SECONDARY', 'REJECTION_1', 'REJECTION_2', 'SPLIT']).optional().or(z.literal('')),
  no_of_filters_installed: z.preprocess((val) => val === '' || val === null || val === undefined ? undefined : Number(val), z.number().min(0).optional()),
  oil_filter_condition: z.string().optional().or(z.literal('')),
  line_filter_condition: z.string().optional().or(z.literal('')),
  auto_drain_valve_working: z.string().min(1, 'Auto drain valve status is required'),
  engineer_remarks: z.string().min(1, 'Engineer remarks is required').max(2000, 'Maximum 2000 characters'),
  engineer_signature: z.string().min(1, 'Engineer signature is required'),
  customer_remarks: z.string().max(2000, 'Maximum 2000 characters').optional().or(z.literal('')),
  customer_signature: z.string().min(1, 'Customer signature is required'),
});

type InstallationReportFormValues = z.infer<typeof installationReportSchema>;

const sections = [
  { id: 1, title: 'Basic Details', icon: Tag },
  { id: 2, title: 'Machine Performance', icon: Gauge },
  { id: 3, title: 'Utility / Equipment Details', icon: Wind },
  { id: 4, title: 'Remarks & Signatures', icon: Pen },
];

type InstallationSection = (typeof sections)[number];

function SectionToggle({
  section,
  isOpen,
  onToggle,
  children,
}: {
  section: InstallationSection;
  isOpen: boolean;
  onToggle: (id: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-100 dark:border-white/5 rounded-xl bg-white dark:bg-gray-950">
      <button
        type="button"
        onClick={() => onToggle(section.id)}
        className={cn(
          "w-full flex items-center justify-between px-5 py-4 bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100/50 dark:hover:bg-white/10 transition-colors",
          isOpen ? "rounded-t-xl" : "rounded-xl"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <section.icon size={16} className="text-primary" />
          </div>
          <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
            {section.id}. {section.title}
          </span>
        </div>
        {isOpen ? (
          <ChevronDown size={18} className="text-gray-400" />
        ) : (
          <ChevronRight size={18} className="text-gray-400" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
            animate={{
              height: 'auto',
              opacity: 1,
              transitionEnd: { overflow: 'visible' },
            }}
            exit={{
              height: 0,
              opacity: 0,
              overflow: 'hidden',
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 pt-4 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-[11px] text-rose-500 font-medium ml-1">{message}</p> : null;
}

export function InstallationReportFormDrawer() {
  const { isFormDrawerOpen, closeFormDrawer, selectedId } = useInstallationReportStore();
  const isEdit = !!selectedId;

  const { data: reportData, isLoading: reportLoading } = useInstallationReport(selectedId);
  const { data: millsData } = useMills({ skip: 0, take: 500 });
  const { data: customersData } = useCustomers({ skip: 0, take: 500, status: 'ACTIVE' });
  const { mutateAsync: createReport, isPending: isCreating } = useCreateInstallationReport();
  const { mutateAsync: updateReport, isPending: isUpdating } = useUpdateInstallationReport();

  const mills = millsData?.mills || [];
  const customers = customersData?.customers || [];

  const { uploadFile, isUploading } = useS3Upload();

  const base64ToFile = (base64DataUrl: string, filename: string): File => {
    const arr = base64DataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[arr.length - 1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const isValidBase64Image = (str?: string): boolean => {
    if (!str) return false;
    if (!str.startsWith('data:image/')) return false;
    if (str.includes('...')) return false;
    if (str.length < 100) return false;
    return true;
  };

  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>('');

  const [openSections, setOpenSections] = React.useState<Record<number, boolean>>({ 1: true });
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const initializedFormKeyRef = React.useRef<string | null>(null);

  const toggleSection = (id: number) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InstallationReportFormValues>({
    resolver: zodResolver(installationReportSchema) as any,
    defaultValues: {
      technician_ids: [],
      mill_id: '',
      place: '',
      mill_whatsapp_number: '',
      mill_email: '',
      visit_date: '',
      visit_time: '',
      call_registered_date: '',
      machine_model: '',
      serial_or_frame_no: '',
      authorized_person: '',
      invoice_number: '',
      invoice_date: '',
      warranty_start_date: '',
      warranty_end_date: '',
      commodity: '',
      contamination: '',
      output_capacity_per_hour: '',
      rejection_ratio: '',
      purity: '',
      no_of_programs_set: undefined,
      ac_provided: 'NO',
      compressor_details: '',
      air_drier_details: '',
      ground_earth_provided: 'NO',
      ground_earth_value: undefined,
      ground_earth_field: '',
      no_of_filters_installed: undefined,
      oil_filter_condition: '',
      line_filter_condition: '',
      auto_drain_valve_working: 'NO',
      engineer_remarks: '',
      engineer_signature: '',
      customer_remarks: '',
      customer_signature: '',
    },
  });

  const selectedMillId = watch('mill_id');

  const filteredMills = React.useMemo(() => {
    if (!selectedCustomerId) {
      return mills.filter((m) => m.id === selectedMillId);
    }
    return mills.filter((m) => m.customer_id === selectedCustomerId || m.id === selectedMillId);
  }, [mills, selectedCustomerId, selectedMillId]);

  React.useEffect(() => {
    if (selectedMillId) {
      const mill = mills.find((m) => m.id === selectedMillId);
      if (mill) {
        if (mill.phone && !watch('mill_whatsapp_number')) {
          setValue('mill_whatsapp_number', normalizePhoneNumber(mill.phone));
        }
        if (mill.email && !watch('mill_email')) {
          setValue('mill_email', mill.email);
        }
        if (mill.address && !watch('place')) {
          setValue('place', mill.address);
        }
        if (mill.customer_id && !selectedCustomerId) {
          setSelectedCustomerId(mill.customer_id);
        }
      }
    }
  }, [selectedMillId, mills, setValue, watch, selectedCustomerId]);

  React.useEffect(() => {
    if (!isFormDrawerOpen) {
      initializedFormKeyRef.current = null;
      setSelectedCustomerId('');
      return;
    }

    const formKey = isEdit ? `edit:${selectedId}:${reportData?.id ?? 'loading'}` : 'new';
    if (initializedFormKeyRef.current === formKey) return;
    if (isEdit && !reportData) return;

    initializedFormKeyRef.current = formKey;
    setOpenSections({ 1: true });

    if (isFormDrawerOpen) {
      if (isEdit && reportData) {
        const mill = mills.find((m) => m.id === reportData.mill_id);
        setSelectedCustomerId(mill?.customer_id || '');
        reset({
          technician_ids: reportData.technicians?.map((t: any) => t.technician.id) || [],
          mill_id: reportData.mill_id,
          place: reportData.place,
          mill_whatsapp_number: reportData.mill_whatsapp_number,
          mill_email: reportData.mill_email || '',
          visit_date: reportData.visit_date?.split('T')[0] || '',
          visit_time: reportData.visit_time || '',
          call_registered_date: reportData.call_registered_date?.split('T')[0] || '',
          machine_model: reportData.machine_model,
          serial_or_frame_no: reportData.serial_or_frame_no,
          authorized_person: reportData.authorized_person,
          invoice_number: reportData.invoice_number || '',
          invoice_date: reportData.invoice_date?.split('T')[0] || '',
          warranty_start_date: reportData.warranty_start_date?.split('T')[0] || '',
          warranty_end_date: reportData.warranty_end_date?.split('T')[0] || '',
          commodity: reportData.commodity || '',
          contamination: reportData.contamination || '',
          output_capacity_per_hour: reportData.output_capacity_per_hour || '',
          rejection_ratio: reportData.rejection_ratio || '',
          purity: reportData.purity || '',
          no_of_programs_set: reportData.no_of_programs_set ?? undefined,
          ac_provided: reportData.ac_provided ? 'YES' : 'NO',
          compressor_details: reportData.compressor_details || '',
          air_drier_details: reportData.air_drier_details || '',
          ground_earth_provided: reportData.ground_earth_provided ? 'YES' : 'NO',
          ground_earth_value: reportData.ground_earth_value ?? undefined,
          ground_earth_field: normalizeGroundEarthField(reportData.ground_earth_field),
          no_of_filters_installed: reportData.no_of_filters_installed ?? undefined,
          oil_filter_condition: reportData.oil_filter_condition || '',
          line_filter_condition: reportData.line_filter_condition || '',
          auto_drain_valve_working: reportData.auto_drain_valve_working ? 'YES' : 'NO',
          engineer_remarks: reportData.engineer_remarks,
          engineer_signature: reportData.engineer_signature,
          customer_remarks: reportData.customer_remarks || '',
          customer_signature: reportData.customer_signature,
        });
      } else if (!isEdit) {
        setSelectedCustomerId('');
        reset({
          technician_ids: [],
          mill_id: '',
          place: '',
          mill_whatsapp_number: '',
          mill_email: '',
          visit_date: '',
          visit_time: '',
          call_registered_date: '',
          machine_model: '',
          serial_or_frame_no: '',
          authorized_person: '',
          invoice_number: '',
          invoice_date: '',
          warranty_start_date: '',
          warranty_end_date: '',
          commodity: '',
          contamination: '',
          output_capacity_per_hour: '',
          rejection_ratio: '',
          purity: '',
          no_of_programs_set: undefined,
          ac_provided: 'NO',
          compressor_details: '',
          air_drier_details: '',
          ground_earth_provided: 'NO',
          ground_earth_value: undefined,
          ground_earth_field: '',
          no_of_filters_installed: undefined,
          oil_filter_condition: '',
          line_filter_condition: '',
          auto_drain_valve_working: 'NO',
          engineer_remarks: '',
          engineer_signature: '',
          customer_remarks: '',
          customer_signature: '',
        });
      }
    }
  }, [isFormDrawerOpen, selectedId, reportData, reset, isEdit, mills]);

  React.useEffect(() => {
    if (!isFormDrawerOpen || !isEdit || !reportData || selectedCustomerId) return;
    const mill = mills.find((m) => m.id === reportData.mill_id);
    if (mill?.customer_id) {
      setSelectedCustomerId(mill.customer_id);
    }
  }, [isFormDrawerOpen, isEdit, reportData, mills, selectedCustomerId]);

  const onSubmit: SubmitHandler<InstallationReportFormValues> = async (data) => {
    try {
      let engineerSignatureUrl = data.engineer_signature;
      let customerSignatureUrl = data.customer_signature;

      // Upload engineer signature if it's base64 data (new drawing)
      if (data.engineer_signature && data.engineer_signature.startsWith('data:')) {
        if (isValidBase64Image(data.engineer_signature)) {
          try {
            const file = base64ToFile(data.engineer_signature, `eng-sig-${Date.now()}.png`);
            const uploadResult = await uploadFile(file);
            if (uploadResult && uploadResult.fileUrl) {
              engineerSignatureUrl = uploadResult.fileUrl;
            } else {
              toast.error('Failed to upload engineer signature to S3');
              return; // Stop submission if upload fails
            }
          } catch (error) {
            console.error('Error processing engineer signature:', error);
            toast.error('Failed to process engineer signature');
            return; // Stop submission on error
          }
        } else {
          toast.error('Invalid engineer signature image');
          return;
        }
      }

      // Upload customer signature if it's base64 data (new drawing)
      if (data.customer_signature && data.customer_signature.startsWith('data:')) {
        if (isValidBase64Image(data.customer_signature)) {
          try {
            const file = base64ToFile(data.customer_signature, `cust-sig-${Date.now()}.png`);
            const uploadResult = await uploadFile(file);
            if (uploadResult && uploadResult.fileUrl) {
              customerSignatureUrl = uploadResult.fileUrl;
            } else {
              toast.error('Failed to upload customer signature to S3');
              return; // Stop submission if upload fails
            }
          } catch (error) {
            console.error('Error processing customer signature:', error);
            toast.error('Failed to process customer signature');
            return; // Stop submission on error
          }
        } else {
          toast.error('Invalid customer signature image');
          return;
        }
      }

      const payload = {
        ...data,
        ac_provided: data.ac_provided === 'YES',
        ground_earth_provided: data.ground_earth_provided === 'YES',
        auto_drain_valve_working: data.auto_drain_valve_working === 'YES',
        no_of_programs_set: data.no_of_programs_set ? Number(data.no_of_programs_set) : undefined,
        ground_earth_value: data.ground_earth_value ? Number(data.ground_earth_value) : undefined,
        ground_earth_field: data.ground_earth_field || undefined,
        no_of_filters_installed: data.no_of_filters_installed ? Number(data.no_of_filters_installed) : undefined,
        invoice_date: data.invoice_date || undefined,
        warranty_start_date: data.warranty_start_date || undefined,
        warranty_end_date: data.warranty_end_date || undefined,
        engineer_signature: engineerSignatureUrl,
        customer_signature: customerSignatureUrl,
      };

      if (isEdit) {
        await updateReport({ id: selectedId, ...payload });
      } else {
        await createReport(payload);
      }
      closeFormDrawer();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  const isLoading = isEdit && reportLoading;
  const isSubmitting = isCreating || isUpdating || isUploading;

  const fieldToSectionMap: Record<string, number> = {
    // Section 1
    technician_ids: 1,
    mill_id: 1,
    place: 1,
    mill_whatsapp_number: 1,
    mill_email: 1,
    visit_date: 1,
    visit_time: 1,
    call_registered_date: 1,
    machine_model: 1,
    serial_or_frame_no: 1,
    authorized_person: 1,
    invoice_number: 1,
    invoice_date: 1,
    warranty_start_date: 1,
    warranty_end_date: 1,

    // Section 2
    commodity: 2,
    contamination: 2,
    output_capacity_per_hour: 2,
    rejection_ratio: 2,
    purity: 2,
    no_of_programs_set: 2,

    // Section 3
    ac_provided: 3,
    compressor_details: 3,
    air_drier_details: 3,
    ground_earth_provided: 3,
    ground_earth_value: 3,
    ground_earth_field: 3,
    no_of_filters_installed: 3,
    oil_filter_condition: 3,
    line_filter_condition: 3,
    auto_drain_valve_working: 3,

    // Section 4
    engineer_remarks: 4,
    engineer_signature: 4,
    customer_remarks: 4,
    customer_signature: 4,
  };

  const scrollToFirstError = (errors: any) => {
    // Open any section that contains an error
    const sectionsToOpen: Record<number, boolean> = {};
    Object.keys(errors).forEach((fieldName) => {
      const sectionId = fieldToSectionMap[fieldName];
      if (sectionId) {
        sectionsToOpen[sectionId] = true;
      }
    });

    if (Object.keys(sectionsToOpen).length > 0) {
      setOpenSections((prev) => ({
        ...prev,
        ...sectionsToOpen,
      }));
    }

    // Show a toast with all validation error fields
    const errorFields = Object.keys(errors)
      .map((key) => {
        return key
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase());
      });

    toast.error('Validation Failed', {
      description: `Please fill required fields: ${errorFields.join(', ')}`,
      duration: 6000,
    });

    // Wait a brief tick for the sections to open and render before scrolling
    setTimeout(() => {
      const firstError = formRef.current?.querySelector('[data-error="true"]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  return (
    <Sheet open={isFormDrawerOpen} onOpenChange={(open) => !open && closeFormDrawer()}>
      <SheetContent
        side="right"
        className="w-screen sm:max-w-[92vw] xl:max-w-[900px] p-0 flex flex-col h-full bg-gray-50 dark:bg-gray-950 border-l border-gray-100 dark:border-white/5"
      >
        <SheetHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-8">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20 flex-shrink-0">
              <ClipboardCheck size={24} />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-lg sm:text-xl truncate">
                {isEdit ? 'Edit Installation' : 'New Installation'}
              </SheetTitle>
              <SheetDescription className="text-xs sm:text-sm">
                {isEdit ? 'Update installation details.' : 'Fill details below to register installation.'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div ref={sheetRef} className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-6 py-4 sm:py-6 scrollbar-hide pb-32 sm:pb-24">
          {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <form id="installation-report-form" ref={formRef} onSubmit={handleSubmit(onSubmit, scrollToFirstError)} className="space-y-4 min-w-0">
              {/* Section 1 - Basic Details */}
              <SectionToggle section={sections[0]} isOpen={!!openSections[1]} onToggle={toggleSection}>
                <div className="space-y-4">
                  {/* Select Service Engineers */}
                  <div className="space-y-2" data-error={errors.technician_ids ? 'true' : undefined}>
                    <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                      <Users size={14} className="text-primary/70" />
                      Select Service Engineers
                    </Label>
                    <Controller
                      name="technician_ids"
                      control={control}
                      render={({ field }) => (
                        <TechnicianMultiSelect
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select engineers..."
                        />
                      )}
                    />
                    <FieldError message={errors.technician_ids?.message} />
                  </div>

                  {/* Customer Dropdown */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                      <Users size={14} className="text-primary/70" />
                      Customer
                    </Label>
                    {customers.length > 0 ? (
                      <Select
                        onValueChange={(val) => {
                          setSelectedCustomerId(val === 'all_clear' ? '' : val || '');
                          setValue('mill_id', '');
                          setValue('place', '');
                          setValue('mill_whatsapp_number', '');
                          setValue('mill_email', '');
                        }}
                        value={selectedCustomerId || ''}
                        items={customers.map((c) => ({ value: c.id, label: c.name }))}
                      >
                        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-medium">
                          {selectedCustomerId ? (
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {customers.find((c) => c.id === selectedCustomerId)?.name ?? 'Unknown Customer'}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600 text-sm">Select customer</span>
                          )}
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-56 overflow-y-auto">
                          <SelectItem value="all_clear" className="font-medium py-3 text-gray-400">Clear Customer Filter</SelectItem>
                          {customers.map((cust) => (
                            <SelectItem key={cust.id} value={cust.id} className="font-medium py-3">
                              {cust.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Skeleton className="h-11 rounded-xl w-full" />
                    )}
                  </div>

                  {/* Mill Name */}
                  <div className="space-y-2" data-error={errors.mill_id ? 'true' : undefined}>
                    <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                      <Building2 size={14} className="text-primary/70" />
                      Mill Name
                    </Label>
                    {mills.length > 0 ? (
                      <Select
                        onValueChange={(val) => {
                          setValue('mill_id', val || '');
                          setValue('place', '');
                          setValue('mill_whatsapp_number', '');
                          setValue('mill_email', '');
                        }}
                        value={watch('mill_id')}
                        items={filteredMills.map(m => ({ value: m.id, label: m.name }))}
                      >
                        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-medium">
                          {watch('mill_id') ? (
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {mills.find((m) => m.id === watch('mill_id'))?.name ?? 'Unknown Mill'}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600 text-sm">
                              {selectedCustomerId ? 'Select mill' : 'Select a customer first'}
                            </span>
                          )}
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-56">
                          {filteredMills.length > 0 ? (
                            filteredMills.map((mill) => (
                              <SelectItem key={mill.id} value={mill.id} className="font-medium py-3">
                                {mill.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no_mills" disabled className="py-3 text-gray-400 font-medium">
                              {selectedCustomerId ? "No mills found for this customer" : "Please select a customer first"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Skeleton className="h-11 rounded-xl w-full" />
                    )}
                    <FieldError message={errors.mill_id?.message} />
                  </div>

                  {/* Place */}
                  <div className="space-y-2" data-error={errors.place ? 'true' : undefined}>
                    <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={14} className="text-primary/70" />
                      Place
                    </Label>
                    <Input
                      {...register('place')}
                      placeholder="Enter mill place"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                    />
                    <FieldError message={errors.place?.message} />
                  </div>

                  {/* Mill Whatsapp Number & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2" data-error={errors.mill_whatsapp_number ? 'true' : undefined}>
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <Phone size={14} className="text-primary/70" />
                        Mill Whatsapp Number
                      </Label>
                      <Controller
                        name="mill_whatsapp_number"
                        control={control}
                        render={({ field }) => (
                          <PhoneInput
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder="Enter Whatsapp number"
                            className="h-11"
                          />
                        )}
                      />
                      <FieldError message={errors.mill_whatsapp_number?.message} />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <Mail size={14} className="text-primary/70" />
                        Mill Email ID
                      </Label>
                      <Input
                        {...register('mill_email')}
                        placeholder="mill@example.com (Optional)"
                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                      />
                      <FieldError message={errors.mill_email?.message} />
                    </div>
                  </div>

                  {/* Date, Call Registered Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2" data-error={errors.visit_date ? 'true' : undefined}>
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <CalendarDays size={14} className="text-primary/70" />
                        Date
                      </Label>
                      <Controller
                        name="visit_date"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select date"
                          />
                        )}
                      />
                      <FieldError message={errors.visit_date?.message} />
                    </div>

                    <div className="space-y-2" data-error={errors.call_registered_date ? 'true' : undefined}>
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={14} className="text-primary/70" />
                        Call Registered Date
                      </Label>
                      <Controller
                        name="call_registered_date"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select call registered date"
                          />
                        )}
                      />
                      <FieldError message={errors.call_registered_date?.message} />
                    </div>
                  </div>

                  {/* Model, Serial, Authorized Person */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2" data-error={errors.machine_model ? 'true' : undefined}>
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <Cpu size={14} className="text-primary/70" />
                        Model
                      </Label>
                      <Input
                        {...register('machine_model')}
                        placeholder="Machine model"
                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                      />
                      <FieldError message={errors.machine_model?.message} />
                    </div>

                    <div className="space-y-2" data-error={errors.serial_or_frame_no ? 'true' : undefined}>
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <Tag size={14} className="text-primary/70" />
                        Serial / Frame No
                      </Label>
                      <Input
                        {...register('serial_or_frame_no')}
                        placeholder="Serial/Frame number"
                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                      />
                      <FieldError message={errors.serial_or_frame_no?.message} />
                    </div>

                    <div className="space-y-2" data-error={errors.authorized_person ? 'true' : undefined}>
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <Users size={14} className="text-primary/70" />
                        Authorized Person
                      </Label>
                      <Input
                        {...register('authorized_person')}
                        placeholder="Authorized person name"
                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                      />
                      <FieldError message={errors.authorized_person?.message} />
                    </div>
                  </div>

                  {/* Invoice details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <FileText size={14} className="text-primary/70" />
                        Invoice Number
                      </Label>
                      <Input
                        {...register('invoice_number')}
                        placeholder="Invoice number (Optional)"
                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <CalendarDays size={14} className="text-primary/70" />
                        Invoice Date
                      </Label>
                      <Controller
                        name="invoice_date"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select invoice date"
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Warranty details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={14} className="text-primary/70" />
                        Warranty Start Date
                      </Label>
                      <Controller
                        name="warranty_start_date"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select warranty start date"
                          />
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={14} className="text-primary/70" />
                        Warranty End Date
                      </Label>
                      <Controller
                        name="warranty_end_date"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select warranty end date"
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>
              </SectionToggle>

              {/* Section 2 - Machine Performance */}
              <SectionToggle section={sections[1]} isOpen={!!openSections[2]} onToggle={toggleSection}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                      <Package size={14} className="text-primary/70" />
                      Commodity
                    </Label>
                    <Input
                      {...register('commodity')}
                      placeholder="e.g., Rice, Coffee (Optional)"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} className="text-primary/70" />
                      Contamination
                    </Label>
                    <Input
                      {...register('contamination')}
                      placeholder="e.g., Black grains, stones (Optional)"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                      <Gauge size={14} className="text-primary/70" />
                      Output capacity / hour
                    </Label>
                    <Input
                      {...register('output_capacity_per_hour')}
                      placeholder="e.g., 5 tons/hour (Optional)"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                      <Gauge size={14} className="text-primary/70" />
                      Rejection Ratio
                    </Label>
                    <Input
                      {...register('rejection_ratio')}
                      placeholder="e.g., 1:10 (Optional)"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                      <Gauge size={14} className="text-primary/70" />
                      Purity
                    </Label>
                    <Input
                      {...register('purity')}
                      placeholder="e.g., 99.9% (Optional)"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                      <Cpu size={14} className="text-primary/70" />
                      No of Programs set
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      {...register('no_of_programs_set', { valueAsNumber: false })}
                      placeholder="0 (Optional)"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                    />
                  </div>
                </div>
              </SectionToggle>

              {/* Section 3 - Utility / Equipment Details */}
              <SectionToggle section={sections[2]} isOpen={!!openSections[3]} onToggle={toggleSection}>
                <div className="space-y-4">
                  {/* AC and Compressor */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2" data-error={errors.ac_provided ? 'true' : undefined}>
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <Wind size={14} className="text-primary/70" />
                        Air Conditioner Provided or not?
                      </Label>
                      <Select
                        onValueChange={(val) => setValue('ac_provided', val || '')}
                        value={watch('ac_provided')}
                      >
                        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-medium">
                          <SelectValue placeholder="Select AC status" />
                        </SelectTrigger>
                        <SelectContent
                          alignItemWithTrigger={false}
                          className="rounded-xl border-gray-100 shadow-xl"
                        >
                          <SelectItem value="YES" className="font-medium py-3 text-emerald-500">Yes</SelectItem>
                          <SelectItem value="NO" className="font-medium py-3 text-rose-500">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError message={errors.ac_provided?.message} />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <FileText size={14} className="text-primary/70" />
                        Compressor Details
                      </Label>
                      <Input
                        {...register('compressor_details')}
                        placeholder="Compressor details (Optional)"
                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                      />
                    </div>
                  </div>

                  {/* Air Drier */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} className="text-primary/70" />
                      Air Drier details
                    </Label>
                    <Input
                      {...register('air_drier_details')}
                      placeholder="Air drier details (Optional)"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                    />
                  </div>

                  {/* Ground Earth Toggle & Ground Earth Value */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2" data-error={errors.ground_earth_provided ? 'true' : undefined}>
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <Wind size={14} className="text-primary/70" />
                        Ground Earth Provided or not?
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['YES', 'NO'] as const).map((option) => {
                          const selected = watch('ground_earth_provided') === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                setValue('ground_earth_provided', option, { shouldDirty: true, shouldValidate: true });
                                if (option === 'NO') {
                                  setValue('ground_earth_value', undefined, { shouldDirty: true, shouldValidate: true });
                                  setValue('ground_earth_field', '', { shouldDirty: true, shouldValidate: true });
                                }
                              }}
                              className={cn(
                                "flex h-11 items-center gap-3 rounded-xl bg-gray-50/50 px-4 text-left font-medium transition-all dark:bg-white/5",
                                selected
                                  ? "ring-2 ring-primary/30 text-primary"
                                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                              )}
                              role="checkbox"
                              aria-checked={selected}
                            >
                              <span
                                className={cn(
                                  "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
                                  selected ? "border-primary bg-primary text-white" : "border-gray-300 bg-white dark:border-white/20 dark:bg-gray-950"
                                )}
                              >
                                {selected && <Check size={13} strokeWidth={3} />}
                              </span>
                              {option === 'YES' ? 'Yes' : 'No'}
                            </button>
                          );
                        })}
                      </div>
                      <FieldError message={errors.ground_earth_provided?.message} />
                    </div>

                    <div className="space-y-2" data-error={errors.ground_earth_value ? 'true' : undefined}>
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <Cpu size={14} className="text-primary/70" />
                        Ground Earth Value Selection (1 - 12)
                      </Label>
                      <div
                        className={cn(
                          "grid grid-cols-3 gap-3 rounded-xl bg-gray-50/50 p-3 dark:bg-white/5 sm:grid-cols-4",
                          watch('ground_earth_provided') !== 'YES' && "opacity-50"
                        )}
                      >
                        {Array.from({ length: 12 }).map((_, i) => {
                          const value = i + 1;
                          const selected = watch('ground_earth_value') === value;
                          const disabled = watch('ground_earth_provided') !== 'YES';

                          return (
                            <button
                              key={value}
                              type="button"
                              disabled={disabled}
                              onClick={() => {
                                setValue(
                                  'ground_earth_value',
                                  selected ? undefined : value,
                                  { shouldDirty: true, shouldValidate: true }
                                );
                              }}
                              className={cn(
                                "flex min-h-12 items-center justify-center gap-2 rounded-lg border bg-white px-3 text-sm font-black transition-all dark:bg-gray-950",
                                selected
                                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                                  : "border-gray-200 text-gray-700 hover:border-primary/40 hover:text-primary dark:border-white/10 dark:text-gray-300",
                                disabled && "cursor-not-allowed hover:border-gray-200 hover:text-gray-700 dark:hover:border-white/10 dark:hover:text-gray-300"
                              )}
                              role="checkbox"
                              aria-checked={selected}
                              aria-label={`Ground Earth value ${value}`}
                            >
                              <span
                                className={cn(
                                  "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                                  selected ? "border-primary bg-primary text-white" : "border-gray-300 dark:border-white/20"
                                )}
                              >
                                {selected && <Check size={11} strokeWidth={3} />}
                              </span>
                              {value}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[11px] font-medium text-gray-400">
                        {watch('ground_earth_provided') === 'YES'
                          ? 'Select one checked value.'
                          : 'Choose Yes above to enable value selection.'}
                      </p>
                      <FieldError message={errors.ground_earth_value?.message} />
                    </div>

                    <div className="space-y-2" data-error={errors.ground_earth_field ? 'true' : undefined}>
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={14} className="text-primary/70" />
                        Ground Field Earth
                      </Label>
                      <Select
                        disabled={watch('ground_earth_provided') !== 'YES'}
                        onValueChange={(val) => setValue('ground_earth_field', normalizeGroundEarthField(val), { shouldDirty: true, shouldValidate: true })}
                        value={watch('ground_earth_field') || ''}
                        items={GROUND_EARTH_FIELD_OPTIONS.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))}
                      >
                        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-medium">
                          <SelectValue placeholder="Select Primary / Secondary / Rejection / Split" />
                        </SelectTrigger>
                        <SelectContent
                          alignItemWithTrigger={false}
                          className="rounded-xl border-gray-100 shadow-xl"
                        >
                          {GROUND_EARTH_FIELD_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="font-medium py-3">
                              <div className="flex items-center gap-3">
                                <span className="h-4 w-4 rounded border-2 border-primary bg-primary/90" />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError message={errors.ground_earth_field?.message} />
                    </div>
                  </div>
                  {/* Filters installed */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <Cpu size={14} className="text-primary/70" />
                        No of filters installed
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        {...register('no_of_filters_installed', { valueAsNumber: false })}
                        placeholder="0 (Optional)"
                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <FileText size={14} className="text-primary/70" />
                        Oil Filter condition
                      </Label>
                      <Input
                        {...register('oil_filter_condition')}
                        placeholder="Oil filter condition (Optional)"
                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                      />
                    </div>
                  </div>

                  {/* Line filter and Auto drain valve */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <FileText size={14} className="text-primary/70" />
                        Line filter condition
                      </Label>
                      <Input
                        {...register('line_filter_condition')}
                        placeholder="Line filter condition (Optional)"
                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                      />
                    </div>

                    <div className="space-y-2" data-error={errors.auto_drain_valve_working ? 'true' : undefined}>
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <Wind size={14} className="text-primary/70" />
                        Auto drain valve working or not?
                      </Label>
                      <Select
                        onValueChange={(val) => setValue('auto_drain_valve_working', val || '')}
                        value={watch('auto_drain_valve_working')}
                      >
                        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-medium">
                          <SelectValue placeholder="Select Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                          <SelectItem value="YES" className="font-medium py-3 text-emerald-500">Yes</SelectItem>
                          <SelectItem value="NO" className="font-medium py-3 text-rose-500">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError message={errors.auto_drain_valve_working?.message} />
                    </div>
                  </div>
                </div>
              </SectionToggle>

              {/* Section 4 - Remarks & Signatures */}
              <SectionToggle section={sections[3]} isOpen={!!openSections[4]} onToggle={toggleSection}>
                <div className="space-y-6">
                  {/* Service Engineer Details */}
                  <div className="border-b border-gray-100 dark:border-white/5 pb-6 space-y-4">
                    <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">Service Engineer Details</h3>
                    
                    <div className="space-y-2" data-error={errors.engineer_remarks ? 'true' : undefined}>
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <Pen size={14} className="text-primary/70" />
                        Service Engineer Remarks
                      </Label>
                      <Textarea
                        {...register('engineer_remarks')}
                        placeholder="Enter service engineer remarks (max 2000 chars)"
                        className="min-h-[100px] bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium resize-none"
                      />
                      <FieldError message={errors.engineer_remarks?.message} />
                    </div>

                    <div className="space-y-2" data-error={errors.engineer_signature ? 'true' : undefined}>
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <Pen size={14} className="text-primary/70" />
                        Service Engineer Signature
                      </Label>
                      <Controller
                        name="engineer_signature"
                        control={control}
                        render={({ field }) => (
                          <SignaturePad value={field.value} onChange={field.onChange} />
                        )}
                      />
                      <FieldError message={errors.engineer_signature?.message} />
                    </div>
                  </div>

                  {/* Customer Details */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">Customer Details</h3>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <FileText size={14} className="text-primary/70" />
                        Customer Remarks
                      </Label>
                      <Textarea
                        {...register('customer_remarks')}
                        placeholder="Customer remarks (Optional, max 2000 chars)"
                        className="min-h-[100px] bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium resize-none"
                      />
                      <FieldError message={errors.customer_remarks?.message} />
                    </div>

                    <div className="space-y-2" data-error={errors.customer_signature ? 'true' : undefined}>
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <Pen size={14} className="text-primary/70" />
                        Customer Signature
                      </Label>
                      <Controller
                        name="customer_signature"
                        control={control}
                        render={({ field }) => (
                          <SignaturePad value={field.value} onChange={field.onChange} />
                        )}
                      />
                      <FieldError message={errors.customer_signature?.message} />
                    </div>
                  </div>
                </div>
              </SectionToggle>
            </form>
          )}
        </div>

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-t border-gray-100 dark:border-white/5 z-10">
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 w-full">
            <Button
              type="button"
              variant="ghost"
              onClick={closeFormDrawer}
              className="flex-1 rounded-xl h-11 font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="installation-report-form"
              disabled={isSubmitting || isLoading}
              className="flex-1 rounded-xl h-11 bg-primary hover:bg-primary/90 text-white font-medium shadow-lg shadow-primary/20 gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              {isEdit ? 'Update Installation' : 'Save Installation'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
