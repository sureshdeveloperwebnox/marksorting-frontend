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
  PlusCircle,
  Shield,
  RotateCcw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { normalizePhoneNumber } from '@/lib/utils';
import { useCreateInstallationReport, useUpdateInstallationReport, useInstallationReport } from '@/services/installation-report-service';
import { useMills, useCreateMill } from '@/services/mill-service';
import { useCustomers, useCreateCustomer } from '@/services/customer-service';
import { useMasterMills, useCreateMasterMill, useMasterMillsPrefill } from '@/services/master-mill-service';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StateSearchSelect } from '@/components/ui/state-search-select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';

/* ── Indian States List ─────────────────────────────────────── */
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Lakshadweep', 'Puducherry', 'Ladakh', 'Jammu and Kashmir',
];

/* ── State Matching Helper ──────────────────────────────────── */
const matchState = (mill: any) => {
  const address = mill?.address || '';
  const place = mill?.place || '';
  const city = mill?.city || '';
  
  const searchStr = `${address} ${place} ${city}`.toLowerCase();
  
  const matched = INDIAN_STATES.find(s => {
    const cleanState = s.toLowerCase().replace(/\s+/g, '');
    const cleanSearch = searchStr.replace(/\s+/g, '');
    return cleanSearch.includes(cleanState);
  });
  
  return matched || '';
};

const RUNNING_CHANNEL_COMBINATION_VALUE_OPTIONS = [
  { value: 'PRIMARY', label: 'Primary' },
  { value: 'SECONDARY', label: 'Secondary' },
  { value: 'REJECTION_1', label: 'Rejection 1' },
  { value: 'REJECTION_2', label: 'Rejection 2' },
  { value: 'SPLIT', label: 'Split' },
] as const;

type RunningChannelCombinationValueOption = (typeof RUNNING_CHANNEL_COMBINATION_VALUE_OPTIONS)[number]['value'];

const normalizeRunningChannelCombinationValue = (value?: string | null | undefined): RunningChannelCombinationValueOption | '' => {
  return RUNNING_CHANNEL_COMBINATION_VALUE_OPTIONS.some((option) => option.value === value)
    ? (value as RunningChannelCombinationValueOption)
    : '';
};

const installationReportSchema = z.object({
  technician_ids: z.array(z.string()).min(1, 'At least one engineer is required'),
  mill_id: z.string().min(1, 'Mill is required'),
  place: z.string().min(2, 'Place is required'),
  mill_whatsapp_number: z
    .string()
    .optional()
    .or(z.literal('')),
  mill_email: z.string().optional().or(z.literal('')),
  visit_date: z.string().min(1, 'Date is required'),
  visit_time: z.string().optional(),
  call_registered_date: z.string().min(1, 'Call registered date is required'),
  machine_model: z.string().min(1, 'Machine model is required'),
  machine_mfg_date: z.string().min(1, 'Manufacturing date is required'),
  serial_or_frame_no: z.string().min(1, 'Serial/Frame no is required'),
  authorized_person: z.string().min(1, 'Authorized person is required'),
  authorized_person_phone: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const normalized = normalizePhoneNumber(val);
      return isValidPhoneNumber(normalized || val) || (val.replace(/\D/g, '').length >= 7 && val.replace(/\D/g, '').length <= 15);
    }, {
      message: 'Please enter a valid phone number with country code',
    })
    .or(z.literal('')),
  invoice_number: z.string().optional().or(z.literal('')),
  invoice_date: z.string().optional().or(z.literal('')),
  warranty_start_date: z.string().optional().or(z.literal('')),
  warranty_end_date: z.string().optional().or(z.literal('')),
  warranty_years: z.preprocess((val) => val === '' || val === null || val === undefined ? 0 : Number(val), z.number().min(0).optional()),
  warranty_months: z.preprocess((val) => val === '' || val === null || val === undefined ? 0 : Number(val), z.number().min(0).optional()),
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
  running_channel_combination: z.preprocess((val) => val === '' || val === null || val === undefined ? undefined : Number(val), z.number().min(1).max(12).optional()),
  running_channel_combination_value: z.enum(['PRIMARY', 'SECONDARY', 'REJECTION_1', 'REJECTION_2', 'SPLIT']).optional().or(z.literal('')),
  no_of_filters_installed: z.preprocess((val) => val === '' || val === null || val === undefined ? undefined : Number(val), z.number().min(0).optional()),
  oil_filter_condition: z.string().optional().or(z.literal('')),
  line_filter_condition: z.string().optional().or(z.literal('')),
  auto_drain_valve_working: z.string().min(1, 'Auto drain valve status is required'),
  engineer_remarks: z.string().min(1, 'Engineer remarks is required').max(2000, 'Maximum 2000 characters'),
  engineer_signature: z.string().min(1, 'Engineer signature is required'),
  customer_remarks: z.string().max(2000, 'Maximum 2000 characters').optional().or(z.literal('')),
  customer_signature: z.string().optional().or(z.literal('')),
  status: z.string().min(1, 'Status is required'),
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
          "w-full flex items-center justify-between px-4 py-3 bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100/50 dark:hover:bg-white/10 transition-colors",
          isOpen ? "rounded-t-xl" : "rounded-xl"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <section.icon size={16} className="text-primary" />
          </div>
          <span className="font-black text-sm text-gray-900 dark:text-white tracking-tight">
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
            <div className="px-4 pb-4 pt-3 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-[11px] text-rose-500 font-medium ml-1">{message}</p> : null;
}

const getStatusColors = (status?: string) => {
  switch (status?.toUpperCase()) {
    case "PENDING": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "COMPLETED": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "NON_SUCCEED":
    case "NON-SUCCEED":
    case "CANCELLED": return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
    default: return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30";
  }
};

const getStatusDotBg = (status?: string) => {
  switch (status?.toUpperCase()) {
    case "PENDING": return "bg-amber-500";
    case "COMPLETED": return "bg-emerald-500";
    case "NON_SUCCEED":
    case "NON-SUCCEED":
    case "CANCELLED": return "bg-rose-500";
    default: return "bg-gray-400";
  }
};

const getStatusLabel = (status?: string) => {
  switch (status?.toUpperCase()) {
    case "PENDING": return "Pending";
    case "COMPLETED": return "Complete";
    case "NON_SUCCEED":
    case "NON-SUCCEED":
    case "CANCELLED": return "Non-succeed";
    default: return status || "";
  }
};

const INSTALLATION_REPORT_STATUS_OPTIONS = [
  {
    value: "PENDING",
    label: "Pending",
    icon: Clock,
    iconColor: "text-amber-500",
    activeClasses: "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20 font-bold",
  },
  {
    value: "COMPLETED",
    label: "Complete",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    activeClasses: "bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-500/20 font-bold",
  },
  {
    value: "NON_SUCCEED",
    label: "Non-succeed",
    icon: XCircle,
    iconColor: "text-rose-500",
    activeClasses: "bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-500/20 font-bold",
  },
];

export function InstallationReportFormDrawer() {
  const { isFormDrawerOpen, closeFormDrawer, selectedId } = useInstallationReportStore();
  const isEdit = !!selectedId;
  const [selectedStatus, setSelectedStatus] = React.useState<string>('PENDING');
  const [isUpdatingStatusAlone, setIsUpdatingStatusAlone] = React.useState(false);

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
  const [selectedMachineId, setSelectedMachineId] = React.useState<string>('');
  const [selectedMillObj, setSelectedMillObj] = React.useState<any>(null);

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
      machine_mfg_date: '',
      serial_or_frame_no: '',
      authorized_person: '',
      authorized_person_phone: '',
      invoice_number: '',
      invoice_date: '',
      warranty_start_date: '',
      warranty_end_date: '',
      warranty_months: 12,
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
      running_channel_combination: undefined,
      running_channel_combination_value: '',
      no_of_filters_installed: undefined,
      oil_filter_condition: '',
      line_filter_condition: '',
      auto_drain_valve_working: 'NO',
      engineer_remarks: '',
      engineer_signature: '',
      customer_remarks: '',
      customer_signature: '',
      status: 'PENDING',
    },
  });

  const selectedMillId = watch('mill_id');

  // Mutations for quick inline registration
  const { mutateAsync: createCustomer } = useCreateCustomer();
  const { mutateAsync: createMill } = useCreateMill();
  const { mutateAsync: createMasterMill } = useCreateMasterMill();

  // Fetch master mills for the selected mill
  const { data: masterMillsData, isLoading: masterMillsLoading } = useMasterMills(
    {
      mill_id: selectedMillId || undefined,
      skip: 0,
      take: 100,
      status: 'ACTIVE',
    },
    { enabled: !!selectedMillId }
  );
  const masterMills = masterMillsData?.masterMills || [];

  // Dialog State Variables for Customer & Mill
  const [isQuickCreateOpen, setIsQuickCreateOpen] = React.useState(false);
  const [quickCustomerName, setQuickCustomerName] = React.useState('');
  const [quickMillName, setQuickMillName] = React.useState('');
  const [isMillNameManuallyEdited, setIsMillNameManuallyEdited] = React.useState(false);
  const [quickPhone, setQuickPhone] = React.useState('');
  const [quickAddress, setQuickAddress] = React.useState('');
  const [quickPlace, setQuickPlace] = React.useState('');
  const [quickState, setQuickState] = React.useState('');
  const [quickRefNo, setQuickRefNo] = React.useState('');
  const [existingCustomerId, setExistingCustomerId] = React.useState<string | null>(null);
  const [isQuickRegistering, setIsQuickRegistering] = React.useState(false);

  // Dialog State Variables for Master Mill (Machine Installation)
  const [isQuickMasterMillOpen, setIsQuickMasterMillOpen] = React.useState(false);
  const [quickInvoiceNo, setQuickInvoiceNo] = React.useState('');
  const [quickInvoiceDate, setQuickInvoiceDate] = React.useState('');
  const [quickMasterMillRefNo, setQuickMasterMillRefNo] = React.useState('');
  const [quickMcModel, setQuickMcModel] = React.useState('');
  const [quickFrameNo, setQuickFrameNo] = React.useState('');
  const [quickInstallationDate, setQuickInstallationDate] = React.useState('');
  const [quickWarrantyYears, setQuickWarrantyYears] = React.useState(1);
  const [quickWarrantyMonths, setQuickWarrantyMonths] = React.useState(0);
  const [quickWarrantyType, setQuickWarrantyType] = React.useState('Non Warranty');
  const [isQuickMasterMillRegistering, setIsQuickMasterMillRegistering] = React.useState(false);

  // Search Machine by Ref No / Frame No states
  const [machineSearchQuery, setMachineSearchQuery] = React.useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(machineSearchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [machineSearchQuery]);

  // Query master mills matching search term (global search, not mill_id restricted)
  const trimmedSearchQuery = debouncedSearchQuery.trim();
  const { data: searchMasterMillsData, isLoading: searchMasterMillsLoading } = useMasterMillsPrefill(
    {
      search: trimmedSearchQuery || undefined,
      context: 'installation_report',
    },
    { enabled: trimmedSearchQuery.length >= 2 }
  );
  const serviceBased = searchMasterMillsData?.serviceBased || [];
  const installationBased = searchMasterMillsData?.installationBased || [];
  const hasResults = serviceBased.length > 0 || installationBased.length > 0;

  const handleSelectMachine = (m: any) => {
    // Set mill_id and auto-resolve customer
    if (m.mill_id) {
      setValue('mill_id', m.mill_id);
      if (m.mill) {
        setSelectedMillObj(m.mill);
      }
      // Use customer_id from API response first, then fallback to local lookup
      const millCustomerId = m.mill?.customer_id;
      if (millCustomerId) {
        setSelectedCustomerId(millCustomerId);
      } else {
        const localMill = mills.find(millItem => millItem.id === m.mill_id);
        if (localMill?.customer_id) {
          setSelectedCustomerId(localMill.customer_id);
        } else {
          setSelectedCustomerId('');
        }
      }
    }
    // Prefill frame/serial no
    if (m.frame_no) {
      setValue('serial_or_frame_no', m.frame_no);
    }
    // Prefill machine model
    if (m.mc_model) {
      setValue('machine_model', m.mc_model);
    }
    // Prefill mfg date
    if (m.mfg_date) {
      setValue('machine_mfg_date', m.mfg_date.split('T')[0]);
    }
    // Prefill place
    const placeToUse = m.place || m.mill?.place;
    if (placeToUse) {
      setValue('place', placeToUse);
    }
    // Prefill whatsapp
    const phoneToUse = m.phone_no || m.mill?.phone;
    if (phoneToUse) {
      setValue('mill_whatsapp_number', normalizePhoneNumber(phoneToUse));
    }
    // Prefill invoice & warranty details for Installation Report
    if (m.invoice_no) {
      setValue('invoice_number', m.invoice_no);
    }
    if (m.invoice_date) {
      setValue('invoice_date', m.invoice_date.split('T')[0]);
    }
    if (m.warranty_start_date) {
      setValue('warranty_start_date', m.warranty_start_date.split('T')[0]);
    }
    if (m.warranty_closing_date) {
      setValue('warranty_end_date', m.warranty_closing_date.split('T')[0]);
    }
    if (m.warranty_years !== undefined && m.warranty_years !== null) {
      setValue('warranty_years', m.warranty_years);
    }
    if (m.warranty_months !== undefined && m.warranty_months !== null) {
      setValue('warranty_months', m.warranty_months);
    }
    setSelectedMachineId(m.id);
    setMachineSearchQuery('');
    toast.success('Machine details prefilled! Verify and adjust as needed.');
  };

  // Similar existing customers based on quickCustomerName (for duplicate prevention)
  const similarCustomers = React.useMemo(() => {
    if (!quickCustomerName || quickCustomerName.trim().length < 2) return [];
    const search = quickCustomerName.toLowerCase().trim();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(search) && c.id !== existingCustomerId
    ).slice(0, 5);
  }, [quickCustomerName, customers, existingCustomerId]);

  const filteredMills = React.useMemo(() => {
    let baseMills = mills;
    if (selectedMillObj) {
      const exists = baseMills.some((m) => m.id === selectedMillObj.id);
      if (!exists) {
        baseMills = [selectedMillObj, ...baseMills];
      }
    }
    if (!selectedCustomerId) {
      return baseMills;
    }
    return baseMills.filter((m) => m.customer_id === selectedCustomerId || m.id === selectedMillId);
  }, [mills, selectedCustomerId, selectedMillId, selectedMillObj]);

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

  // Synchronize selectedMachineId when masterMills or the serial_or_frame_no changes
  React.useEffect(() => {
    const frameNo = watch('serial_or_frame_no');
    if (!frameNo) {
      setSelectedMachineId('');
      return;
    }
    const match = masterMills.find((m) => m.frame_no === frameNo);
    if (match) {
      setSelectedMachineId(match.id);
    } else {
      setSelectedMachineId('');
    }
  }, [masterMills, watch('serial_or_frame_no')]);

  // Dynamic auto-calculation of Warranty End Date
  const watchedWarrantyStartDate = watch('warranty_start_date');
  const watchedWarrantyMonths = watch('warranty_months');

  React.useEffect(() => {
    if (watchedWarrantyStartDate) {
      const date = new Date(watchedWarrantyStartDate);
      if (!isNaN(date.getTime())) {
        const months = Number(watchedWarrantyMonths) || 0;
        date.setMonth(date.getMonth() + months);
        date.setDate(date.getDate() - 1);
        const formatted = date.toISOString().split('T')[0];
        setValue('warranty_end_date', formatted);
      }
    } else {
      setValue('warranty_end_date', '');
    }
  }, [watchedWarrantyStartDate, watchedWarrantyMonths, setValue]);


  React.useEffect(() => {
    if (!isFormDrawerOpen) {
      initializedFormKeyRef.current = null;
      setSelectedCustomerId('');
      setSelectedMachineId('');
      setSelectedStatus('PENDING');
      return;
    }

    const formKey = isEdit ? `edit:${selectedId}:${reportData?.id ?? 'loading'}` : 'new';
    if (initializedFormKeyRef.current === formKey) return;
    if (isEdit && !reportData) return;

    initializedFormKeyRef.current = formKey;
    setOpenSections({ 1: true });

    if (isFormDrawerOpen) {
      if (isEdit && reportData) {
        setSelectedStatus(reportData.status || 'PENDING');
        const mill = mills.find((m) => m.id === reportData.mill_id);
        setSelectedCustomerId(mill?.customer_id || '');
        reset({
          technician_ids: reportData.technicians?.map((t: any) => t.technician.id) || [],
          mill_id: reportData.mill_id,
          place: reportData.place,
          mill_whatsapp_number: normalizePhoneNumber(reportData.mill_whatsapp_number) || '',
          mill_email: reportData.mill_email || '',
          visit_date: reportData.visit_date?.split('T')[0] || '',
          visit_time: reportData.visit_time || '',
          call_registered_date: reportData.call_registered_date?.split('T')[0] || '',
          machine_model: reportData.machine_model,
          machine_mfg_date: reportData.machine_mfg_date?.split('T')[0] || '',
          serial_or_frame_no: reportData.serial_or_frame_no,
          authorized_person: reportData.authorized_person,
          authorized_person_phone: normalizePhoneNumber(reportData.authorized_person_phone) || '',
          invoice_number: reportData.invoice_number || '',
          invoice_date: reportData.invoice_date?.split('T')[0] || '',
          warranty_start_date: reportData.warranty_start_date?.split('T')[0] || '',
          warranty_end_date: reportData.warranty_end_date?.split('T')[0] || '',
          warranty_months: (reportData.warranty_months && reportData.warranty_months > 0)
            ? reportData.warranty_months
            : ((reportData.warranty_years ?? 0) * 12 || 12),
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
          running_channel_combination: reportData.running_channel_combination ?? undefined,
          running_channel_combination_value: normalizeRunningChannelCombinationValue(reportData.running_channel_combination_value),
          no_of_filters_installed: reportData.no_of_filters_installed ?? undefined,
          oil_filter_condition: reportData.oil_filter_condition || '',
          line_filter_condition: reportData.line_filter_condition || '',
          auto_drain_valve_working: reportData.auto_drain_valve_working ? 'YES' : 'NO',
          engineer_remarks: reportData.engineer_remarks,
          engineer_signature: reportData.engineer_signature,
          customer_remarks: reportData.customer_remarks || '',
          customer_signature: reportData.customer_signature,
          status: reportData.status || 'PENDING',
        });
      } else if (!isEdit) {
        setSelectedCustomerId('');
        setSelectedMachineId('');
        setSelectedStatus('PENDING');
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
          machine_mfg_date: '',
          serial_or_frame_no: '',
          authorized_person: '',
          authorized_person_phone: '',
          invoice_number: '',
          invoice_date: '',
          warranty_start_date: '',
          warranty_end_date: '',
          warranty_months: 12,
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
          running_channel_combination: undefined,
          running_channel_combination_value: '',
          no_of_filters_installed: undefined,
          oil_filter_condition: '',
          line_filter_condition: '',
          auto_drain_valve_working: 'NO',
          engineer_remarks: '',
          engineer_signature: '',
          customer_remarks: '',
          customer_signature: '',
          status: 'PENDING',
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

  const getInitialVal = (key: keyof InstallationReportFormValues) => {
    if (!reportData) return undefined;
    switch (key) {
      case 'technician_ids': return reportData.technicians?.map((t: any) => t.technician.id) || [];
      case 'mill_id': return reportData.mill_id;
      case 'place': return reportData.place;
      case 'mill_whatsapp_number': return reportData.mill_whatsapp_number;
      case 'mill_email': return reportData.mill_email || '';
      case 'visit_date': return reportData.visit_date?.split('T')[0] || '';
      case 'visit_time': return reportData.visit_time || '';
      case 'call_registered_date': return reportData.call_registered_date?.split('T')[0] || '';
      case 'machine_model': return reportData.machine_model;
      case 'machine_mfg_date': return reportData.machine_mfg_date?.split('T')[0] || '';
      case 'serial_or_frame_no': return reportData.serial_or_frame_no;
      case 'authorized_person': return reportData.authorized_person;
      case 'authorized_person_phone': return reportData.authorized_person_phone || '';
      case 'invoice_number': return reportData.invoice_number || '';
      case 'invoice_date': return reportData.invoice_date?.split('T')[0] || '';
      case 'warranty_start_date': return reportData.warranty_start_date?.split('T')[0] || '';
      case 'warranty_end_date': return reportData.warranty_end_date?.split('T')[0] || '';
      case 'commodity': return reportData.commodity || '';
      case 'contamination': return reportData.contamination || '';
      case 'output_capacity_per_hour': return reportData.output_capacity_per_hour || '';
      case 'rejection_ratio': return reportData.rejection_ratio || '';
      case 'purity': return reportData.purity || '';
      case 'no_of_programs_set': return reportData.no_of_programs_set ?? undefined;
      case 'ac_provided': return reportData.ac_provided ? 'YES' : 'NO';
      case 'compressor_details': return reportData.compressor_details || '';
      case 'air_drier_details': return reportData.air_drier_details || '';
      case 'ground_earth_provided': return reportData.ground_earth_provided ? 'YES' : 'NO';
      case 'running_channel_combination': return reportData.running_channel_combination ?? undefined;
      case 'running_channel_combination_value': return normalizeRunningChannelCombinationValue(reportData.running_channel_combination_value);
      case 'no_of_filters_installed': return reportData.no_of_filters_installed ?? undefined;
      case 'oil_filter_condition': return reportData.oil_filter_condition || '';
      case 'line_filter_condition': return reportData.line_filter_condition || '';
      case 'auto_drain_valve_working': return reportData.auto_drain_valve_working ? 'YES' : 'NO';
      case 'engineer_remarks': return reportData.engineer_remarks;
      case 'engineer_signature': return reportData.engineer_signature;
      case 'customer_remarks': return reportData.customer_remarks || '';
      case 'customer_signature': return reportData.customer_signature;
      case 'status': return reportData.status || 'PENDING';
      default: return undefined;
    }
  };

  const hasFieldChanged = (key: keyof InstallationReportFormValues, data: InstallationReportFormValues) => {
    if (!isEdit || !reportData) return true;
    
    const initialVal = getInitialVal(key);
    const currentVal = data[key];

    if (key === 'technician_ids') {
      const initialIds = (initialVal as string[]) || [];
      const currentIds = (currentVal as string[]) || [];
      if (initialIds.length !== currentIds.length) return true;
      return !initialIds.every(id => currentIds.includes(id));
    }

    return initialVal !== currentVal;
  };

  const onSubmit: SubmitHandler<InstallationReportFormValues> = async (data) => {
    try {
      let engineerSignatureUrl = data.engineer_signature;
      let customerSignatureUrl = data.customer_signature;

      const engineerSigChanged = !isEdit || hasFieldChanged('engineer_signature', data);
      const customerSigChanged = !isEdit || hasFieldChanged('customer_signature', data);

      // Upload engineer signature if it's base64 data (new drawing) AND changed
      if (engineerSigChanged && data.engineer_signature && data.engineer_signature.startsWith('data:')) {
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

      // Upload customer signature if it's base64 data (new drawing) AND changed
      if (customerSigChanged && data.customer_signature && data.customer_signature.startsWith('data:')) {
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

      let payload: any = {};

      if (isEdit) {
        // Construct partial payload with only changed fields
        const allKeys = Object.keys(data) as Array<keyof InstallationReportFormValues>;
        allKeys.forEach((key) => {
          if (hasFieldChanged(key, data)) {
            const val = data[key];
            if (key === 'ac_provided') {
              payload.ac_provided = val === 'YES';
            } else if (key === 'ground_earth_provided') {
              payload.ground_earth_provided = val === 'YES';
            } else if (key === 'auto_drain_valve_working') {
              payload.auto_drain_valve_working = val === 'YES';
            } else if (key === 'no_of_programs_set') {
              payload.no_of_programs_set = val ? Number(val) : null;
            } else if (key === 'running_channel_combination') {
              payload.running_channel_combination = val ? Number(val) : null;
            } else if (key === 'no_of_filters_installed') {
              payload.no_of_filters_installed = val ? Number(val) : null;
            } else if (key === 'warranty_months') {
              const months = val ? Number(val) : 12;
              payload.warranty_months = months;
              payload.warranty_years = Math.floor(months / 12);
            } else if (key === 'engineer_signature') {
              payload.engineer_signature = engineerSignatureUrl;
            } else if (key === 'customer_signature') {
              payload.customer_signature = customerSignatureUrl;
            } else if (
              key === 'machine_mfg_date' ||
              key === 'invoice_date' ||
              key === 'warranty_start_date' ||
              key === 'warranty_end_date' ||
              key === 'authorized_person_phone' ||
              key === 'visit_time' ||
              key === 'running_channel_combination_value'
            ) {
              payload[key] = val || null;
            } else {
              payload[key] = val;
            }
          }
        });

        // Special case: if we updated a signature (uploaded a new image), make sure the URL is in the payload
        if (engineerSigChanged && data.engineer_signature && data.engineer_signature.startsWith('data:')) {
          payload.engineer_signature = engineerSignatureUrl;
        }
        if (customerSigChanged && data.customer_signature && data.customer_signature.startsWith('data:')) {
          payload.customer_signature = customerSignatureUrl;
        }

        // If nothing changed, we can directly close the drawer and show a success toast
        if (Object.keys(payload).length === 0) {
          toast.success('No changes to update');
          closeFormDrawer();
          return;
        }

        await updateReport({ id: selectedId, ...payload });
      } else {
        // Create mode: send everything normalized
        payload = {
          ...data,
          ac_provided: data.ac_provided === 'YES',
          ground_earth_provided: data.ground_earth_provided === 'YES',
          auto_drain_valve_working: data.auto_drain_valve_working === 'YES',
          no_of_programs_set: data.no_of_programs_set ? Number(data.no_of_programs_set) : undefined,
          running_channel_combination: data.running_channel_combination ? Number(data.running_channel_combination) : undefined,
          running_channel_combination_value: data.running_channel_combination_value || undefined,
          no_of_filters_installed: data.no_of_filters_installed ? Number(data.no_of_filters_installed) : undefined,
          invoice_date: data.invoice_date || undefined,
          warranty_start_date: data.warranty_start_date || undefined,
          warranty_end_date: data.warranty_end_date || undefined,
          warranty_months: data.warranty_months ? Number(data.warranty_months) : 12,
          warranty_years: data.warranty_months ? Math.floor(Number(data.warranty_months) / 12) : 1,
          authorized_person_phone: data.authorized_person_phone || undefined,
          visit_time: data.visit_time || undefined,
          engineer_signature: engineerSignatureUrl,
          customer_signature: customerSignatureUrl,
        };
        await createReport(payload);
      }
      closeFormDrawer();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  const handleSelectStatus = (newStatus: string) => {
    setSelectedStatus(newStatus);
    setValue('status', newStatus, { shouldValidate: true });
  };

  const handleUpdateStatusAlone = async (statusToApply?: string) => {
    const statusVal = statusToApply || selectedStatus;
    if (!selectedId || !statusVal) return;
    try {
      setIsUpdatingStatusAlone(true);
      await updateReport({ id: selectedId, status: statusVal });
      setSelectedStatus(statusVal);
      setValue('status', statusVal, { shouldValidate: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatusAlone(false);
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
    machine_mfg_date: 1,
    serial_or_frame_no: 1,
    authorized_person: 1,
    authorized_person_phone: 1,
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
    running_channel_combination: 3,
    running_channel_combination_value: 3,
    no_of_filters_installed: 3,
    oil_filter_condition: 3,
    line_filter_condition: 3,
    auto_drain_valve_working: 3,

    // Section 4
    status: 4,
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
    const fieldLabelMap: Record<string, string> = {
      technician_ids: 'Service Engineers',
      mill_id: 'Mill Name',
      place: 'Place',
      mill_whatsapp_number: 'Mill WhatsApp Number',
      mill_email: 'Mill Email',
      visit_date: 'Date',
      visit_time: 'Time',
      call_registered_date: 'Call Registered Date',
      machine_model: 'Model',
      machine_mfg_date: 'Mfg Date',
      serial_or_frame_no: 'Serial / Frame No',
      authorized_person: 'Authorized Person',
      authorized_person_phone: 'Authorized Person Contact No',
      invoice_number: 'Invoice Number',
      invoice_date: 'Invoice Date',
      warranty_start_date: 'Warranty Start Date',
      warranty_end_date: 'Warranty End Date',
      commodity: 'Commodity',
      contamination: 'Contamination',
      output_capacity_per_hour: 'Output capacity / hour',
      rejection_ratio: 'Rejection Ratio',
      purity: 'Purity',
      no_of_programs_set: 'No of Programs Set',
      ac_provided: 'AC Provided',
      compressor_details: 'Compressor Details',
      air_drier_details: 'Air Drier Details',
      ground_earth_provided: 'Ground Earth Provided',
      running_channel_combination: 'Running Channel Combination',
      running_channel_combination_value: 'Running Channel Combination Value',
      no_of_filters_installed: 'No of Filters Installed',
      oil_filter_condition: 'Oil Filter Condition',
      line_filter_condition: 'Line Filter Condition',
      auto_drain_valve_working: 'Auto Drain Valve Working',
      status: 'Status',
      engineer_remarks: 'Engineer Remarks',
      engineer_signature: 'Engineer Signature',
      customer_remarks: 'Customer Remarks',
      customer_signature: 'Customer Signature',
    };

    const errorFields = Object.keys(errors)
      .map((key) => {
        return (
          fieldLabelMap[key] ||
          key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase())
        );
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
      <SheetContent side="right">
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

        <div ref={sheetRef} className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 scrollbar-hide pb-20">
          <div className="w-full">
            {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <form id="installation-report-form" ref={formRef} onSubmit={handleSubmit(onSubmit, scrollToFirstError)} className="space-y-3 min-w-0">
              {/* Work Status Management Card (Edit Mode) */}
              {isEdit && (
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                      <Shield size={14} className="text-primary/70" />
                      Work Status
                    </Label>
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider",
                      getStatusColors(selectedStatus)
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", getStatusDotBg(selectedStatus))} />
                      {getStatusLabel(selectedStatus)}
                    </span>
                  </div>

                  {/* Status Option Pills */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {INSTALLATION_REPORT_STATUS_OPTIONS.map((opt) => {
                      const isSelected = selectedStatus === opt.value;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectStatus(opt.value)}
                          className={cn(
                            "flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer select-none",
                            isSelected
                              ? opt.activeClasses
                              : "bg-gray-50/70 dark:bg-white/5 border-gray-200/70 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                          )}
                        >
                          <Icon size={14} className={isSelected ? "text-white" : opt.iconColor} />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Update Status Alone Button */}
                  <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                      {selectedStatus !== reportData?.status
                        ? `Ready to update status to "${getStatusLabel(selectedStatus)}".`
                        : "Select any status above to update it alone."}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isUpdatingStatusAlone || isSubmitting || selectedStatus === reportData?.status}
                      onClick={() => handleUpdateStatusAlone(selectedStatus)}
                      className={cn(
                        "h-8 px-3.5 rounded-xl text-xs font-bold text-white shadow-md transition-all duration-200 shrink-0 flex items-center gap-1.5",
                        selectedStatus !== reportData?.status
                          ? "bg-primary hover:bg-primary/90 shadow-primary/20"
                          : "bg-gray-300 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-70"
                      )}
                    >
                      {isUpdatingStatusAlone ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Updating Status...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Update Status Alone
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Section 1 - Basic Details */}
              <SectionToggle section={sections[0]} isOpen={!!openSections[1]} onToggle={toggleSection}>
                <div className="space-y-3">
                  {/* Select Service Engineers */}
                  <div className="space-y-1.5" data-error={errors.technician_ids ? 'true' : undefined}>
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

                  {/* Search Machine by Ref No / Frame No / Customer / Mill directly */}
                  <div className="space-y-1.5 p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                      <Cpu size={14} className="text-primary/70" />
                      Search Machine to Prefill (REF NO / Frame No / Customer / Mill)
                    </Label>
                    <Input
                      value={machineSearchQuery}
                      onChange={(e) => setMachineSearchQuery(e.target.value)}
                      placeholder="Type REF NO, Frame No, Customer or Mill to search..."
                      className="h-11 bg-white dark:bg-gray-900 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
                    />
                    
                    {/* Search Results List */}
                    {machineSearchQuery.trim().length >= 2 && (
                      <div className="mt-2 bg-white dark:bg-gray-955 rounded-xl border border-gray-100 dark:border-white/5 divide-y divide-gray-100 dark:divide-white/5 max-h-48 overflow-y-auto shadow-lg z-20 relative">
                        {searchMasterMillsLoading ? (
                          <div className="p-3 text-xs text-gray-400 font-bold flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin text-primary" />
                            Searching...
                          </div>
                        ) : hasResults ? (
                          <div className="divide-y divide-gray-100 dark:divide-white/5">
                            {installationBased.length > 0 && (
                              <div>
                                <div className="px-3 py-1.5 text-[10px] font-black text-primary bg-primary/5 dark:bg-primary/10 tracking-wider uppercase select-none">
                                  Installation-Based Machines
                                </div>
                                {installationBased.map((m: any) => (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => handleSelectMachine(m)}
                                    className="w-full text-left p-3 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors text-xs flex flex-col gap-1 cursor-pointer group"
                                  >
                                    <div className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors">
                                      {m.mill?.customer?.name ? `${m.mill.customer.name} — ` : ''}{m.mill?.name || 'Unknown Mill'}
                                    </div>
                                    <div className="text-gray-400 font-medium">
                                      {[
                                        (m.ref_no || m.mill?.ref_no) ? `Ref: ${m.ref_no || m.mill?.ref_no}` : null,
                                        m.frame_no ? `Frame: ${m.frame_no}` : null,
                                        m.mc_model ? `Model: ${m.mc_model}` : null,
                                        (m.place || m.mill?.place) ? `Place: ${m.place || m.mill?.place}` : null,
                                      ]
                                        .filter(Boolean)
                                        .join(' | ')}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {serviceBased.length > 0 && (
                              <div>
                                <div className="px-3 py-1.5 text-[10px] font-semibold text-rose-500 bg-rose-500/5 dark:bg-rose-500/10 tracking-wider uppercase select-none">
                                  Service-Based Machines
                                </div>
                                {serviceBased.map((m: any) => (
                                  <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => handleSelectMachine(m)}
                                    className="w-full text-left p-3 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors text-xs flex flex-col gap-1 cursor-pointer group"
                                  >
                                    <div className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors">
                                      {m.mill?.customer?.name ? `${m.mill.customer.name} — ` : ''}{m.mill?.name || 'Unknown Mill'}
                                    </div>
                                    <div className="text-gray-400 font-medium">
                                      {[
                                        (m.ref_no || m.mill?.ref_no) ? `Ref: ${m.ref_no || m.mill?.ref_no}` : null,
                                        m.frame_no ? `Frame: ${m.frame_no}` : null,
                                        m.mc_model ? `Model: ${m.mc_model}` : null,
                                        (m.place || m.mill?.place) ? `Place: ${m.place || m.mill?.place}` : null,
                                      ]
                                        .filter(Boolean)
                                        .join(' | ')}
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 text-xs text-gray-400 font-bold flex flex-col gap-2">
                            <span>No matching machines found</span>
                            <button
                              type="button"
                              onClick={() => {
                                setQuickCustomerName('');
                                setQuickMillName('');
                                setQuickPhone('');
                                setQuickAddress('');
                                setQuickPlace('');
                                setQuickState('');
                                setQuickRefNo(machineSearchQuery);
                                setExistingCustomerId(null);
                                setIsMillNameManuallyEdited(false);
                                setIsQuickCreateOpen(true);
                                setMachineSearchQuery('');
                              }}
                              className="w-fit text-left text-primary hover:underline flex items-center gap-1 cursor-pointer font-black border-none bg-transparent p-0"
                            >
                              <PlusCircle size={12} />
                              Quick Register Customer & Mill
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Customer Dropdown */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        <Users size={14} className="text-primary/70" />
                        Customer
                      </Label>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickCustomerName('');
                          setQuickMillName('');
                          setQuickPhone('');
                          setQuickAddress('');
                          setQuickPlace('');
                          setQuickState('');
                          setQuickRefNo('');
                          setExistingCustomerId(null);
                          setIsMillNameManuallyEdited(false);
                          setIsQuickCreateOpen(true);
                        }}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle size={12} />
                        Quick Register
                      </button>
                    </div>
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
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                        <Building2 size={14} className="text-primary/70" />
                        Mill Name
                      </Label>
                      {selectedCustomerId && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuickCustomerName(customers.find(c => c.id === selectedCustomerId)?.name || '');
                            setExistingCustomerId(selectedCustomerId);
                            setQuickMillName('');
                            setQuickPhone('');
                            setQuickAddress('');
                            setQuickPlace('');
                            setQuickState('');
                            setQuickRefNo('');
                            setIsMillNameManuallyEdited(false);
                            setIsQuickCreateOpen(true);
                          }}
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <PlusCircle size={12} />
                          Quick Add Mill
                        </button>
                      )}
                    </div>
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
                              {mills.find((m) => m.id === watch('mill_id'))?.name ?? (selectedMillObj?.id === watch('mill_id') ? selectedMillObj?.name : null) ?? 'Unknown Mill'}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600 text-sm">
                              Select mill
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
                              No mills found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Skeleton className="h-11 rounded-xl w-full" />
                    )}
                    <FieldError message={errors.mill_id?.message} />
                  </div>

                  {/* Machine / Installation Record (REF NO / Frame No) Dropdown */}
                  {selectedMillId && (
                    <div className="space-y-2 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                          <Cpu size={14} className="text-primary/70" />
                          Select Machine (REF NO / Frame No)
                        </Label>
                        <button
                          type="button"
                          onClick={() => {
                            setQuickInvoiceNo('');
                            setQuickInvoiceDate('');
                            setQuickMasterMillRefNo('');
                            setQuickMcModel('');
                            setQuickFrameNo('');
                            setQuickInstallationDate('');
                            setQuickWarrantyYears(1);
                            setQuickWarrantyMonths(0);
                            setQuickWarrantyType('Non Warranty');
                            setIsQuickMasterMillOpen(true);
                          }}
                          className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <PlusCircle size={12} />
                          Add Machine
                        </button>
                      </div>
                      {masterMillsLoading ? (
                        <Skeleton className="h-11 rounded-xl w-full" />
                      ) : (
                        <Select
                          value={selectedMachineId || ''}
                          onValueChange={(val) => {
                            if (val === 'clear') {
                              setSelectedMachineId('');
                              setValue('serial_or_frame_no', '');
                              setValue('machine_model', '');
                              setValue('invoice_number', '');
                              setValue('invoice_date', '');
                              setValue('warranty_start_date', '');
                              setValue('warranty_end_date', '');
                              setValue('warranty_years', 0);
                              setValue('warranty_months', 0);
                              return;
                            }
                            const m = masterMills.find((rec) => rec.id === val);
                            if (m) {
                              // Frame / serial no
                              if (m.frame_no) setValue('serial_or_frame_no', m.frame_no);
                              // Machine model
                              if (m.mc_model) setValue('machine_model', m.mc_model);
                              // Place
                              const placeToUse = m.place || m.mill?.place;
                              if (placeToUse) setValue('place', placeToUse);
                              // Phone
                              const phoneToUse = m.phone_no || m.mill?.phone;
                              if (phoneToUse) setValue('mill_whatsapp_number', normalizePhoneNumber(phoneToUse));
                              // Invoice & Warranty details for Installation Report
                              if (m.invoice_no) {
                                setValue('invoice_number', m.invoice_no);
                              }
                              if (m.invoice_date) {
                                setValue('invoice_date', m.invoice_date.split('T')[0]);
                              }
                              if (m.mfg_date) {
                                setValue('machine_mfg_date', m.mfg_date.split('T')[0]);
                              }
                              if (m.warranty_start_date) {
                                setValue('warranty_start_date', m.warranty_start_date.split('T')[0]);
                              }
                              if (m.warranty_closing_date) {
                                setValue('warranty_end_date', m.warranty_closing_date.split('T')[0]);
                              }
                              if (m.warranty_years !== undefined && m.warranty_years !== null) {
                                setValue('warranty_years', m.warranty_years);
                              }
                              if (m.warranty_months !== undefined && m.warranty_months !== null) {
                                setValue('warranty_months', m.warranty_months);
                              }
                              setSelectedMachineId(m.id);
                              toast.success('Machine details prefilled! Verify and adjust as needed.');
                            }
                          }}
                        >
                          <SelectTrigger className="h-11 bg-white dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                            {selectedMachineId ? (
                              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                {(() => {
                                  const m = masterMills.find((rec) => rec.id === selectedMachineId);
                                  if (!m) return 'Unknown Machine';
                                  const displayRef = m.ref_no || m.mill?.ref_no;
                                  const parts = [
                                    displayRef ? `Ref: ${displayRef}` : null,
                                    m.frame_no ? `Frame: ${m.frame_no}` : null,
                                    m.mc_model ? `Model: ${m.mc_model}` : null,
                                  ].filter(Boolean);
                                  return (
                                    parts.join(' | ') ||
                                    (m.invoice_no ? `Invoice: ${m.invoice_no}` : null) ||
                                    (m.mill?.name ? `${m.mill.name} — Record` : null) ||
                                    'Machine Record'
                                  );
                                })()}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-600 text-sm font-medium">
                                Select a machine record to prefill...
                              </span>
                            )}
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-56">
                            <SelectItem value="clear" className="font-bold py-3 text-gray-400">
                              Clear Selection
                            </SelectItem>
                            {masterMills.map((m, idx) => {
                              const displayRef = m.ref_no || m.mill?.ref_no;
                              const parts = [
                                displayRef ? `Ref: ${displayRef}` : null,
                                m.frame_no ? `Frame: ${m.frame_no}` : null,
                                m.mc_model ? `Model: ${m.mc_model}` : null,
                              ].filter(Boolean);
                              const label =
                                parts.join(' | ') ||
                                (m.invoice_no ? `Invoice: ${m.invoice_no}` : null) ||
                                (m.mill?.name ? `${m.mill.name} — Record ${idx + 1}` : null) ||
                                `Machine Record ${idx + 1}`;
                              return (
                                <SelectItem key={m.id} value={m.id} className="font-bold py-3">
                                  {label}
                                </SelectItem>
                              );
                            })}
                            {masterMills.length === 0 && (
                              <SelectItem value="no_records" disabled className="py-3 text-gray-400 font-bold">
                                No master mill records found for this mill
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

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

                  {/* Model, Mfg Date, Serial */}
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

                    <div className="space-y-2" data-error={errors.machine_mfg_date ? 'true' : undefined}>
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <CalendarDays size={14} className="text-primary/70" />
                        Mfg Date
                      </Label>
                      <Controller
                        name="machine_mfg_date"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select manufacturing date"
                          />
                        )}
                      />
                      <FieldError message={errors.machine_mfg_date?.message} />
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="space-y-2" data-error={errors.authorized_person_phone ? 'true' : undefined}>
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <Phone size={14} className="text-primary/70" />
                        Authorized Person Contact No
                      </Label>
                      <Controller
                        name="authorized_person_phone"
                        control={control}
                        render={({ field }) => (
                          <PhoneInput
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder="Enter contact number"
                            className="h-11"
                          />
                        )}
                      />
                      <FieldError message={errors.authorized_person_phone?.message} />
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
                  <div className="border-t border-gray-100 dark:border-white/5 pt-4 my-2">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Warranty Details</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                          Warranty Duration (Months)
                        </Label>
                        <Input
                          {...register('warranty_months')}
                          type="number"
                          min={0}
                          placeholder="e.g. 12"
                          className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
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
                              placeholder="Auto-calculated"
                            />
                          )}
                        />
                      </div>
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
                        items={[
                          { value: 'YES', label: 'Yes' },
                          { value: 'NO', label: 'No' }
                        ]}
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

                    <div className="space-y-2" data-error={errors.running_channel_combination ? 'true' : undefined}>
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <Cpu size={14} className="text-primary/70" />
                        Running Channel Combination (1 - 12)
                      </Label>
                      <div
                        className="grid grid-cols-3 gap-3 rounded-xl bg-gray-50/50 p-3 dark:bg-white/5 sm:grid-cols-4"
                      >
                        {Array.from({ length: 12 }).map((_, i) => {
                          const value = i + 1;
                          const selected = watch('running_channel_combination') === value;
                          const disabled = false;

                          return (
                            <button
                              key={value}
                              type="button"
                              disabled={disabled}
                              onClick={() => {
                                setValue(
                                  'running_channel_combination',
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
                              aria-label={`Running channel combination ${value}`}
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
                        Select one checked value.
                      </p>
                      <FieldError message={errors.running_channel_combination?.message} />
                    </div>

                    <div className="space-y-2" data-error={errors.running_channel_combination_value ? 'true' : undefined}>
                      <Label className="text-xs font-medium text-primary uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={14} className="text-primary/70" />
                        Running Channel Combination Value
                      </Label>
                      <Select
                        onValueChange={(val) => setValue('running_channel_combination_value', normalizeRunningChannelCombinationValue(val), { shouldDirty: true, shouldValidate: true })}
                        value={watch('running_channel_combination_value') || ''}
                        items={RUNNING_CHANNEL_COMBINATION_VALUE_OPTIONS.map((option) => ({
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
                          {RUNNING_CHANNEL_COMBINATION_VALUE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="font-medium py-3">
                              <div className="flex items-center gap-3">
                                <span className="h-4 w-4 rounded border-2 border-primary bg-primary/90" />
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError message={errors.running_channel_combination_value?.message} />
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
                        items={[
                          { value: 'YES', label: 'Yes' },
                          { value: 'NO', label: 'No' }
                        ]}
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
                  <div className="space-y-2" data-error={errors.status ? 'true' : undefined}>
                    <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                      <Tag size={14} className="text-primary/70" />
                      Work Status
                    </Label>
                    <Select
                      onValueChange={(val) => setValue('status', val || '')}
                      value={watch('status')}
                      items={[
                        { value: 'PENDING', label: 'Pending' },
                        { value: 'COMPLETED', label: 'Complete' },
                        { value: 'NON_SUCCEED', label: 'Non-succeed' }
                      ]}
                    >
                      <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-medium">
                        <SelectValue placeholder="Select work status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                        <SelectItem value="PENDING" className="font-medium py-3 text-amber-500">Pending</SelectItem>
                        <SelectItem value="COMPLETED" className="font-medium py-3 text-emerald-500">Complete</SelectItem>
                        <SelectItem value="NON_SUCCEED" className="font-medium py-3 text-rose-500">Non-succeed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError message={errors.status?.message} />
                  </div>

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
        </div>

        <SheetFooter className="p-3 sm:p-4 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-t border-gray-100 dark:border-white/5 z-10">
          <div className="w-full flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
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

        {/* Quick Register Customer & Mill Dialog */}
        <Dialog open={isQuickCreateOpen} onOpenChange={setIsQuickCreateOpen}>
          <DialogContent className="sm:max-w-[480px] bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-white/5">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-gray-800 dark:text-gray-200">
                {existingCustomerId ? 'Register Mill' : 'Register Customer & Mill'}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400">
                {existingCustomerId 
                  ? 'Create a new mill under the current customer.' 
                  : 'Create a new customer and link a new mill with basic details.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-hide">
              {/* Customer Name (disabled if existing) */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Customer Name *
                </Label>
                <Input
                  value={quickCustomerName}
                  onChange={(e) => {
                    setQuickCustomerName(e.target.value);
                    if (!isMillNameManuallyEdited) {
                      setQuickMillName(e.target.value);
                    }
                  }}
                  disabled={!!existingCustomerId}
                  placeholder="e.g. Seva Mandir"
                  className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                />
                
                {/* Duplicate warnings/suggestions */}
                {!existingCustomerId && similarCustomers.length > 0 && (
                  <div className="mt-1.5 p-2 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-1">
                    <p className="text-[10px] text-amber-500 font-bold">Similar existing customers found:</p>
                    <div className="flex flex-wrap gap-1">
                      {similarCustomers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setExistingCustomerId(c.id);
                            setQuickCustomerName(c.name);
                          }}
                          className="text-[10px] bg-primary/10 hover:bg-primary/20 text-primary font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer"
                        >
                          Use: {c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Mill Name */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Mill Name *
                </Label>
                <Input
                  value={quickMillName}
                  onChange={(e) => {
                    setQuickMillName(e.target.value);
                    setIsMillNameManuallyEdited(true);
                  }}
                  placeholder="e.g. Seva Mandir Mill 1"
                  className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                />
              </div>

              {/* Ref No */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Ref No / Code
                </Label>
                <Input
                  value={quickRefNo}
                  onChange={(e) => setQuickRefNo(e.target.value)}
                  placeholder="e.g. P-0005"
                  className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                />
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Full Address
                </Label>
                <Input
                  value={quickAddress}
                  onChange={(e) => setQuickAddress(e.target.value)}
                  placeholder="e.g. 123 Main Street"
                  className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                />
              </div>

              {/* Place */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Place / City
                </Label>
                <Input
                  value={quickPlace}
                  onChange={(e) => setQuickPlace(e.target.value)}
                  placeholder="e.g. Coimbatore"
                  className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                />
              </div>

              {/* State Select */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  State
                </Label>
                <StateSearchSelect
                  value={quickState}
                  onChange={setQuickState}
                  placeholder="Select state..."
                  openDirection="up"
                  className="h-10 text-sm font-bold border-none"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  WhatsApp Phone Number
                </Label>
                <PhoneInput
                  value={quickPhone}
                  onChange={setQuickPhone}
                  placeholder="Enter phone number"
                  className="h-10"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-gray-100 dark:border-white/5 pt-3 gap-2 flex-col sm:flex-row">
              {existingCustomerId && (
                <button
                  type="button"
                  onClick={() => {
                    setExistingCustomerId(null);
                    setQuickCustomerName('');
                    setQuickMillName('');
                    setIsMillNameManuallyEdited(false);
                  }}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                >
                  Change Customer
                </button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsQuickCreateOpen(false)}
                className="rounded-xl h-10 font-bold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isQuickRegistering || !quickMillName.trim() || (!existingCustomerId && !quickCustomerName.trim())}
                onClick={async () => {
                  setIsQuickRegistering(true);
                  try {
                    let customerId = existingCustomerId;

                    // Create customer if not exists
                    if (!customerId) {
                      const exactMatch = customers.find(
                        (c) => c.name.toLowerCase().trim() === quickCustomerName.toLowerCase().trim()
                      );
                      if (exactMatch) {
                        customerId = exactMatch.id;
                      } else {
                        const newCust = await createCustomer({
                          name: quickCustomerName.trim(),
                          phone: quickPhone || undefined,
                          address: quickAddress || undefined,
                          status: 'ACTIVE',
                        });
                        customerId = newCust.id;
                      }
                    }

                    // Check if mill already exists under this customer
                    const existingMills = mills.filter(m => m.customer_id === customerId);
                    const exactMillMatch = existingMills.find(
                      (m) => m.name.toLowerCase().trim() === quickMillName.toLowerCase().trim()
                    );

                    let millId = exactMillMatch?.id;

                    if (!millId) {
                      const newMill = await createMill({
                        name: quickMillName.trim(),
                        ref_no: quickRefNo.trim() || undefined,
                        customer_id: customerId,
                        phone: quickPhone || undefined,
                        address: quickAddress || undefined,
                        place: quickPlace || undefined,
                        city: quickPlace || undefined,
                        status: 'ACTIVE',
                      });
                      millId = newMill.id;
                    } else {
                      toast.info('Mill already exists, linking to it.');
                    }

                    // Create Master Mill (Machine Installation Record) if quickRefNo is provided
                    let createdMasterMillId = '';
                    if (quickRefNo.trim()) {
                      try {
                        const newMasterMill = await createMasterMill({
                          invoice_no: 'QR-' + quickRefNo.trim(),
                          ref_no: quickRefNo.trim(),
                          frame_no: quickRefNo.trim(),
                          mill_id: millId,
                          place: quickPlace || undefined,
                          state: quickState || undefined,
                          phone_no: quickPhone || undefined,
                          status: 'ACTIVE',
                          type: 'Installation',
                          installation_date: watch('visit_date')
                            ? new Date(watch('visit_date')).toISOString()
                            : new Date().toISOString(),
                        });
                        createdMasterMillId = newMasterMill.id;
                      } catch (masterMillErr) {
                        console.error('Failed to auto-create master mill record:', masterMillErr);
                      }
                    }

                    // Update form selections
                    setSelectedCustomerId(customerId || '');
                    setValue('mill_id', millId || '');
                    setValue('place', quickPlace || quickAddress || '');
                    setValue('mill_whatsapp_number', normalizePhoneNumber(quickPhone));

                    if (createdMasterMillId) {
                      setSelectedMachineId(createdMasterMillId);
                      setValue('serial_or_frame_no', quickRefNo.trim());
                      setValue('invoice_number', 'QR-' + quickRefNo.trim());
                      setValue('invoice_date', (watch('visit_date') || new Date().toISOString().split('T')[0]));
                    }
                    
                    toast.success('Customer, Mill, and Machine linked successfully!');
                    setIsQuickCreateOpen(false);
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Failed to register Customer & Mill');
                  } finally {
                    setIsQuickRegistering(false);
                  }
                }}
                className="rounded-xl h-10 bg-primary hover:bg-primary/90 text-white font-bold"
              >
                {isQuickRegistering ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quick Register Machine (Master Mill Record) Dialog */}
        <Dialog open={isQuickMasterMillOpen} onOpenChange={setIsQuickMasterMillOpen}>
          <DialogContent className="sm:max-w-[480px] bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-white/5">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-gray-800 dark:text-gray-200">
                Register Machine (Master Mill Record)
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400">
                Add a new machine installation/service record for the selected mill: 
                <strong> {mills.find(m => m.id === selectedMillId)?.name}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-hide">
              {/* Invoice No */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Invoice No *
                </Label>
                <Input
                  value={quickInvoiceNo}
                  onChange={(e) => setQuickInvoiceNo(e.target.value)}
                  placeholder="e.g. INV-0036"
                  className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                />
              </div>

              {/* Invoice Date */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Invoice Date
                </Label>
                <DatePicker
                  value={quickInvoiceDate}
                  onChange={setQuickInvoiceDate}
                  placeholder="Select invoice date"
                />
              </div>

              {/* Ref No */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Ref No / Code
                </Label>
                <Input
                  value={quickMasterMillRefNo}
                  onChange={(e) => setQuickMasterMillRefNo(e.target.value)}
                  placeholder="e.g. P-0005"
                  className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                />
              </div>

              {/* MC Model */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Machine Model
                </Label>
                <Input
                  value={quickMcModel}
                  onChange={(e) => setQuickMcModel(e.target.value)}
                  placeholder="e.g. RX-40"
                  className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                />
              </div>

              {/* Frame No */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Frame / W No *
                </Label>
                <Input
                  value={quickFrameNo}
                  onChange={(e) => setQuickFrameNo(e.target.value)}
                  placeholder="e.g. Frame 12345"
                  className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                />
              </div>

              {/* Installation Date */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                  Installation Date
                </Label>
                <DatePicker
                  value={quickInstallationDate}
                  onChange={setQuickInstallationDate}
                  placeholder="Select installation date"
                />
              </div>

              {/* Warranty type */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">Warranty Period (Months)</Label>
                  <Input
                    type="number"
                    value={quickWarrantyMonths}
                    onChange={(e) => setQuickWarrantyMonths(Number(e.target.value))}
                    placeholder="e.g. 12 or 18"
                    className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">Warranty</Label>
                  <Select
                    value={quickWarrantyType}
                    onValueChange={(val) => setQuickWarrantyType(val || 'Non Warranty')}
                  >
                    <SelectTrigger className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                      <SelectItem value="Non Warranty" className="font-bold py-2 text-xs">Non Warranty</SelectItem>
                      <SelectItem value="Under Warranty" className="font-bold py-2 text-xs">Under Warranty</SelectItem>
                      <SelectItem value="Expired" className="font-bold py-2 text-xs">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-gray-100 dark:border-white/5 pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsQuickMasterMillOpen(false)}
                className="rounded-xl h-10 font-bold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isQuickMasterMillRegistering || !quickInvoiceNo.trim() || !quickFrameNo.trim()}
                onClick={async () => {
                  setIsQuickMasterMillRegistering(true);
                  try {
                    // Duplicate check
                    const duplicate = masterMills.find(
                      (m) => m.frame_no?.toLowerCase().trim() === quickFrameNo.toLowerCase().trim()
                    );
                    if (duplicate) {
                      toast.error(`A machine with Frame No "${quickFrameNo}" is already registered.`);
                      setIsQuickMasterMillRegistering(false);
                      return;
                    }

                    const selectedMill = mills.find((m) => m.id === selectedMillId);

                    const newRecord = await createMasterMill({
                      type: 'Installation',
                      invoice_no: quickInvoiceNo.trim(),
                      invoice_date: quickInvoiceDate || undefined,
                      ref_no: quickMasterMillRefNo.trim() || undefined,
                      mill_id: selectedMillId,
                      mc_model: quickMcModel.trim() || undefined,
                      frame_no: quickFrameNo.trim(),
                      address: selectedMill?.address || undefined,
                      place: selectedMill?.place || undefined,
                      phone_no: selectedMill?.phone || undefined,
                      warranty_years: quickWarrantyYears,
                      warranty_months: quickWarrantyMonths,
                      all_warranty: quickWarrantyType,
                      installation_date: quickInstallationDate || undefined,
                      mfg_date: quickInstallationDate || new Date().toISOString().split('T')[0],
                      status: 'ACTIVE',
                    });

                    // Automatically prefill the form
                    setValue('serial_or_frame_no', newRecord.frame_no);
                    setValue('machine_model', newRecord.mc_model || '');
                    if (newRecord.invoice_no) {
                      setValue('invoice_number', newRecord.invoice_no);
                    }
                    if (newRecord.invoice_date) {
                      setValue('invoice_date', newRecord.invoice_date.split('T')[0]);
                    }
                    if (newRecord.mfg_date) {
                      setValue('machine_mfg_date', newRecord.mfg_date.split('T')[0]);
                    }
                    
                    toast.success('Machine record created and prefilled successfully!');
                    setIsQuickMasterMillOpen(false);
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Failed to create machine record');
                  } finally {
                    setIsQuickMasterMillRegistering(false);
                  }
                }}
                className="rounded-xl h-10 bg-primary hover:bg-primary/90 text-white font-bold"
              >
                {isQuickMasterMillRegistering ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Prefill'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
