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
  PlusCircle,
} from 'lucide-react';
import { useForm, Controller, SubmitHandler, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { normalizePhoneNumber } from '@/lib/utils';
import { useCreateServiceReport, useUpdateServiceReport, useServiceReport } from '@/services/service-report-service';
import { useServiceCategories } from '@/services/service-category-service';
import { useMills, useCreateMill } from '@/services/mill-service';
import { useCustomers, useCreateCustomer } from '@/services/customer-service';
import { useMasterMills, useCreateMasterMill } from '@/services/master-mill-service';
import useServiceReportStore from '@/store/useServiceReportStore';
import { TechnicianMultiSelect } from '@/components/ui/technician-multi-select';
import { SignaturePad } from '@/components/ui/signature-pad';
import { PhoneInput } from '@/components/ui/phone-input';
import { StateSearchSelect } from '@/components/ui/state-search-select';
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

const serviceReportSchema = z.object({
  service_category_id: z.string().min(1, 'Service category is required'),
  technician_ids: z.array(z.string()).min(1, 'At least one engineer is required'),
  mill_id: z.string().min(1, 'Mill is required'),
  place: z.string().min(2, 'Place is required'),
  mill_whatsapp_number: z
    .string()
    .optional()
    .or(z.literal('')),
  mill_email: z.string().optional().or(z.literal('')),
  visit_date: z.string().min(1, 'Visit date is required'),
  visit_time: z.string().optional(),
  call_registered_date: z.string().min(1, 'Call registered date is required'),
  machine_model: z.string().min(1, 'Machine model is required'),
  machine_mfg_date: z.string().optional().or(z.literal('')),
  machine_installation_date: z.string().optional().or(z.literal('')),
  serial_or_frame_no: z.string().min(1, 'Serial/Frame no is required'),
  authorized_person: z.string().min(1, 'Authorized person is required'),
  authorized_person_phone: z
    .string()
    .optional()
    .refine((val) => !val || isValidPhoneNumber(val), {
      message: 'Please enter a valid phone number with country code',
    })
    .or(z.literal('')),
  previous_visit_engineer: z.string().optional().or(z.literal('')),
  nature_of_complaint: z.string().min(1, 'Nature of complaint is required'),
  problem_observed: z.string().optional().or(z.literal('')),
  action_taken: z.string().min(1, 'Action taken is required'),
  commodity: z.string().optional().or(z.literal('')),
  contamination: z.string().optional().or(z.literal('')),
  output_capacity_per_hour: z.string().optional().or(z.literal('')),
  rejection_ratio: z.string().optional().or(z.literal('')),
  purity: z.string().optional().or(z.literal('')),
  no_of_programs_set: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  ac_provided: z.string().min(1, 'AC status is required'),
  compressor_details: z.string().optional().or(z.literal('')),
  air_drier_details: z.string().optional().or(z.literal('')),
  line_filter_condition: z.string().optional().or(z.literal('')),
  machine_filter_condition: z.string().optional().or(z.literal('')),
  auto_drain_valve_working: z.string().min(1, 'Auto drain valve status is required'),
  engineer_remarks: z.string().min(1, 'Engineer remarks is required').max(2000, 'Maximum 2000 characters'),
  engineer_signature: z.string().min(1, 'Engineer signature is required'),
  customer_remarks: z.string().max(2000, 'Maximum 2000 characters').optional().or(z.literal('')),
  customer_signature: z.string().min(1, 'Customer signature is required'),
  status: z.string().min(1, 'Status is required'),
});

type ServiceReportFormValues = z.infer<typeof serviceReportSchema>;

const sections = [
  { id: 1, title: 'General Information', icon: Tag },
  { id: 2, title: 'Service Engineer Details', icon: Users },
  { id: 3, title: 'Customer / Mill Details', icon: Building2 },
  { id: 4, title: 'Visit Details', icon: Calendar },
  { id: 5, title: 'Machine Information', icon: Cpu },
  { id: 6, title: 'Machine Details', icon: Wrench },
  { id: 7, title: 'Machine Performance', icon: Gauge },
  { id: 8, title: 'Equipment Status', icon: Wind },
  { id: 9, title: 'Remarks & Signatures', icon: Pen },
];

type ServiceReportSection = (typeof sections)[number];

function SectionToggle({
  section,
  isOpen,
  onToggle,
  children,
}: {
  section: ServiceReportSection;
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
          <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
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
  return message ? <p className="text-[11px] text-rose-500 font-bold ml-1">{message}</p> : null;
}

export function ServiceReportFormDrawer() {
  const { isFormDrawerOpen, closeFormDrawer, selectedId } = useServiceReportStore();
  const isEdit = !!selectedId;

  const { data: reportData, isLoading: reportLoading } = useServiceReport(selectedId);
  const { data: categoriesData } = useServiceCategories({ skip: 0, take: 500 });
  const { data: millsData } = useMills({ skip: 0, take: 500 });
  const { data: customersData } = useCustomers({ skip: 0, take: 500, status: 'ACTIVE' });
  const { mutateAsync: createReport, isPending: isCreating } = useCreateServiceReport();
  const { mutateAsync: updateReport, isPending: isUpdating } = useUpdateServiceReport();
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

  const categories = categoriesData?.serviceCategories || [];
  const mills = millsData?.mills || [];
  const customers = customersData?.customers || [];

  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>('');
  const [selectedMachineId, setSelectedMachineId] = React.useState<string>('');

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
  } = useForm<ServiceReportFormValues>({
    resolver: zodResolver(serviceReportSchema) as any,
    defaultValues: {
      service_category_id: '',
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
      machine_installation_date: '',
      serial_or_frame_no: '',
      authorized_person: '',
      authorized_person_phone: '',
      previous_visit_engineer: '',
      nature_of_complaint: '',
      problem_observed: '',
      action_taken: '',
      commodity: '',
      contamination: '',
      output_capacity_per_hour: '',
      rejection_ratio: '',
      purity: '',
      no_of_programs_set: undefined,
      ac_provided: 'NO',
      compressor_details: '',
      air_drier_details: '',
      line_filter_condition: '',
      machine_filter_condition: '',
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
  const [quickWarrantyMonths, setQuickWarrantyMonths] = React.useState(12);
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
  // NOTE: Always trim the search query to avoid leading/trailing space mismatches in DB
  const trimmedSearchQuery = debouncedSearchQuery.trim();
  const { data: searchMasterMillsData, isLoading: searchMasterMillsLoading } = useMasterMills(
    {
      search: trimmedSearchQuery || undefined,
      skip: 0,
      take: 10,
    },
    { enabled: trimmedSearchQuery.length >= 2 }
  );
  const searchedMasterMills = searchMasterMillsData?.masterMills || [];

  // Similar existing customers based on quickCustomerName (for duplicate prevention)
  const similarCustomers = React.useMemo(() => {
    if (!quickCustomerName || quickCustomerName.trim().length < 2) return [];
    const search = quickCustomerName.toLowerCase().trim();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(search) && c.id !== existingCustomerId
    ).slice(0, 5);
  }, [quickCustomerName, customers, existingCustomerId]);

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

  React.useEffect(() => {
    if (!isFormDrawerOpen) {
      initializedFormKeyRef.current = null;
      setSelectedCustomerId('');
      setSelectedMachineId('');
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
          service_category_id: reportData.service_category_id,
          technician_ids: reportData.technicians?.map((t: any) => t.technician.id) || [],
          mill_id: reportData.mill_id,
          place: reportData.place,
          mill_whatsapp_number: reportData.mill_whatsapp_number,
          mill_email: reportData.mill_email || '',
          visit_date: reportData.visit_date?.split('T')[0] || '',
          visit_time: reportData.visit_time || '',
          call_registered_date: reportData.call_registered_date?.split('T')[0] || '',
          machine_model: reportData.machine_model,
          machine_mfg_date: reportData.machine_mfg_date?.split('T')[0] || '',
          machine_installation_date: reportData.machine_installation_date?.split('T')[0] || '',
          serial_or_frame_no: reportData.serial_or_frame_no,
          authorized_person: reportData.authorized_person,
          authorized_person_phone: reportData.authorized_person_phone || '',
          previous_visit_engineer: reportData.previous_visit_engineer || '',
          nature_of_complaint: reportData.nature_of_complaint,
          problem_observed: reportData.problem_observed || '',
          action_taken: reportData.action_taken,
          commodity: reportData.commodity || '',
          contamination: reportData.contamination || '',
          output_capacity_per_hour: reportData.output_capacity_per_hour || '',
          rejection_ratio: reportData.rejection_ratio || '',
          purity: reportData.purity || '',
          no_of_programs_set: reportData.no_of_programs_set ?? undefined,
          ac_provided: reportData.ac_provided ? 'YES' : 'NO',
          compressor_details: reportData.compressor_details || '',
          air_drier_details: reportData.air_drier_details || '',
          line_filter_condition: reportData.line_filter_condition || '',
          machine_filter_condition: reportData.machine_filter_condition || '',
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
        reset({
          service_category_id: '',
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
          machine_installation_date: '',
          serial_or_frame_no: '',
          authorized_person: '',
          authorized_person_phone: '',
          previous_visit_engineer: '',
          nature_of_complaint: '',
          problem_observed: '',
          action_taken: '',
          commodity: '',
          contamination: '',
          output_capacity_per_hour: '',
          rejection_ratio: '',
          purity: '',
          no_of_programs_set: undefined,
          ac_provided: 'NO',
          compressor_details: '',
          air_drier_details: '',
          line_filter_condition: '',
          machine_filter_condition: '',
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

  const getInitialVal = (key: keyof ServiceReportFormValues) => {
    if (!reportData) return undefined;
    switch (key) {
      case 'service_category_id': return reportData.service_category_id;
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
      case 'machine_installation_date': return reportData.machine_installation_date?.split('T')[0] || '';
      case 'serial_or_frame_no': return reportData.serial_or_frame_no;
      case 'authorized_person': return reportData.authorized_person;
      case 'authorized_person_phone': return reportData.authorized_person_phone || '';
      case 'previous_visit_engineer': return reportData.previous_visit_engineer || '';
      case 'nature_of_complaint': return reportData.nature_of_complaint;
      case 'problem_observed': return reportData.problem_observed || '';
      case 'action_taken': return reportData.action_taken;
      case 'commodity': return reportData.commodity || '';
      case 'contamination': return reportData.contamination || '';
      case 'output_capacity_per_hour': return reportData.output_capacity_per_hour || '';
      case 'rejection_ratio': return reportData.rejection_ratio || '';
      case 'purity': return reportData.purity || '';
      case 'no_of_programs_set': return reportData.no_of_programs_set ?? undefined;
      case 'ac_provided': return reportData.ac_provided ? 'YES' : 'NO';
      case 'compressor_details': return reportData.compressor_details || '';
      case 'air_drier_details': return reportData.air_drier_details || '';
      case 'line_filter_condition': return reportData.line_filter_condition || '';
      case 'machine_filter_condition': return reportData.machine_filter_condition || '';
      case 'auto_drain_valve_working': return reportData.auto_drain_valve_working ? 'YES' : 'NO';
      case 'engineer_remarks': return reportData.engineer_remarks;
      case 'engineer_signature': return reportData.engineer_signature;
      case 'customer_remarks': return reportData.customer_remarks || '';
      case 'customer_signature': return reportData.customer_signature;
      case 'status': return reportData.status || 'PENDING';
      default: return undefined;
    }
  };

  const hasFieldChanged = (key: keyof ServiceReportFormValues, data: ServiceReportFormValues) => {
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

  const onSubmit = async (data: ServiceReportFormValues) => {
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
        const allKeys = Object.keys(data) as Array<keyof ServiceReportFormValues>;
        allKeys.forEach((key) => {
          if (hasFieldChanged(key, data)) {
            const val = data[key];
            if (key === 'ac_provided') {
              payload.ac_provided = val === 'YES';
            } else if (key === 'auto_drain_valve_working') {
              payload.auto_drain_valve_working = val === 'YES';
            } else if (key === 'no_of_programs_set') {
              payload.no_of_programs_set = val ? Number(val) : null;
            } else if (key === 'engineer_signature') {
              payload.engineer_signature = engineerSignatureUrl;
            } else if (key === 'customer_signature') {
              payload.customer_signature = customerSignatureUrl;
            } else if (
              key === 'machine_mfg_date' ||
              key === 'machine_installation_date' ||
              key === 'authorized_person_phone' ||
              key === 'visit_time'
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
          auto_drain_valve_working: data.auto_drain_valve_working === 'YES',
          no_of_programs_set: data.no_of_programs_set ? Number(data.no_of_programs_set) : undefined,
          machine_mfg_date: data.machine_mfg_date || undefined,
          machine_installation_date: data.machine_installation_date || undefined,
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

  const isLoading = isEdit && reportLoading;
  const isSubmitting = isCreating || isUpdating || isUploading;

  const fieldToSectionMap: Record<string, number> = {
    // Section 1
    service_category_id: 1,

    // Section 2
    technician_ids: 2,

    // Section 3
    mill_id: 3,
    place: 3,
    mill_whatsapp_number: 3,
    mill_email: 3,

    // Section 4
    visit_date: 4,
    visit_time: 4,
    call_registered_date: 4,

    // Section 5
    machine_model: 5,
    machine_mfg_date: 5,
    machine_installation_date: 5,
    serial_or_frame_no: 5,
    authorized_person: 5,
    authorized_person_phone: 5,
    previous_visit_engineer: 5,

    // Section 6
    nature_of_complaint: 6,
    problem_observed: 6,
    action_taken: 6,

    // Section 7
    commodity: 7,
    contamination: 7,
    output_capacity_per_hour: 7,
    rejection_ratio: 7,
    purity: 7,
    no_of_programs_set: 7,

    // Section 8
    ac_provided: 8,
    compressor_details: 8,
    air_drier_details: 8,
    line_filter_condition: 8,
    machine_filter_condition: 8,
    auto_drain_valve_working: 8,

    // Section 9
    status: 9,
    engineer_remarks: 9,
    engineer_signature: 9,
    customer_remarks: 9,
    customer_signature: 9,
  };

  const scrollToFirstError = (errors: FieldErrors<ServiceReportFormValues>) => {
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
      service_category_id: 'Service Category',
      technician_ids: 'Service Engineers',
      mill_id: 'Mill',
      place: 'Place',
      mill_whatsapp_number: 'Mill WhatsApp Number',
      mill_email: 'Mill Email',
      visit_date: 'Visit Date',
      visit_time: 'Visit Time',
      call_registered_date: 'Call Registered Date',
      machine_model: 'Machine Model',
      machine_mfg_date: 'Mfg Date',
      machine_installation_date: 'Installation Date',
      serial_or_frame_no: 'Serial No / Frame No',
      authorized_person: 'Authorized Person',
      authorized_person_phone: 'Authorized Person Contact No',
      nature_of_complaint: 'Nature of Complaint',
      problem_observed: 'Problem Observed',
      action_taken: 'Action Taken',
      commodity: 'Commodity',
      contamination: 'Contamination',
      output_capacity_per_hour: 'Output Capacity/Hour',
      rejection_ratio: 'Rejection Ratio',
      purity: 'Purity',
      no_of_programs_set: 'No of Programs Set',
      ac_provided: 'AC Status',
      compressor_details: 'Compressor Details',
      air_drier_details: 'Air Drier Details',
      line_filter_condition: 'Line Filter Condition',
      machine_filter_condition: 'Machine Filter Condition',
      auto_drain_valve_working: 'Auto Drain Valve Status',
      status: 'Work Status',
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
                {isEdit ? 'Edit Service' : 'New Service'}
              </SheetTitle>
              <SheetDescription className="text-xs sm:text-sm">
                {isEdit ? 'Update service information.' : 'Create a new service.'}
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
            <form id="service-report-form" ref={formRef} onSubmit={handleSubmit(onSubmit, scrollToFirstError)} className="space-y-4 min-w-0">
              {/* Section 1 - General Information */}
              <SectionToggle section={sections[0]} isOpen={!!openSections[1]} onToggle={toggleSection}>
                  <div className="space-y-2" data-error={errors.service_category_id ? 'true' : undefined}>
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Tag size={14} className="text-primary/70" />
                      Service Category
                    </Label>
                    {categories.length > 0 ? (
                      <Select
                        onValueChange={(val) => setValue('service_category_id', val || '')}
                        value={watch('service_category_id')}
                        items={categories.map(c => ({ value: c.id, label: c.name }))}
                      >
                        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                          <SelectValue placeholder="Select service category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-56">
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id} className="font-bold py-3">
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Skeleton className="h-11 rounded-xl w-full" />
                    )}
                    <FieldError message={errors.service_category_id?.message} />
                  </div>
              </SectionToggle>

              {/* Section 2 - Service Engineer Details */}
              <SectionToggle section={sections[1]} isOpen={!!openSections[2]} onToggle={toggleSection}>
                <div className="space-y-2" data-error={errors.technician_ids ? 'true' : undefined}>
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} className="text-primary/70" />
                    Service Engineers
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
              </SectionToggle>

              {/* Section 3 - Customer / Mill Details */}
              <SectionToggle section={sections[2]} isOpen={!!openSections[3]} onToggle={toggleSection}>
                <div className="space-y-4">
                  {/* Search Machine by Ref No / Frame No / Customer / Mill directly */}
                  <div className="space-y-2 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
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
                        ) : searchedMasterMills.length > 0 ? (
                          searchedMasterMills.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                // Set mill_id and auto-resolve customer
                                if (m.mill_id) {
                                  setValue('mill_id', m.mill_id);
                                  // Use customer_id from API response first, then fallback to local lookup
                                  const millCustomerId = m.mill?.customer_id;
                                  if (millCustomerId) {
                                    setSelectedCustomerId(millCustomerId);
                                  } else {
                                    const localMill = mills.find(millItem => millItem.id === m.mill_id);
                                    if (localMill?.customer_id) {
                                      setSelectedCustomerId(localMill.customer_id);
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
                                // Prefill installation date
                                if (m.installation_date) {
                                  setValue('machine_installation_date', m.installation_date.split('T')[0]);
                                }
                                // Prefill place: master mill place → mill place fallback
                                const placeToUse = m.place || m.mill?.place;
                                if (placeToUse) {
                                  setValue('place', placeToUse);
                                }
                                // Prefill whatsapp: master mill phone → mill phone fallback
                                const phoneToUse = m.phone_no || m.mill?.phone;
                                if (phoneToUse) {
                                  setValue('mill_whatsapp_number', normalizePhoneNumber(phoneToUse));
                                }
                                setSelectedMachineId(m.id);
                                setMachineSearchQuery('');
                                toast.success('Machine details prefilled! Verify and adjust as needed.');
                              }}
                              className="w-full text-left p-3 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors text-xs flex flex-col gap-1 cursor-pointer group"
                            >
                              <div className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors">
                                {m.mill?.customer?.name ? `${m.mill.customer.name} — ` : ''}{m.mill?.name || 'Unknown Mill'}
                              </div>
                              <div className="text-gray-400 font-medium">
                                {[
                                  // Show ref_no from MasterMill first, fallback to Mill.ref_no
                                  (m.ref_no || m.mill?.ref_no) ? `Ref: ${m.ref_no || m.mill?.ref_no}` : null,
                                  m.frame_no ? `Frame: ${m.frame_no}` : null,
                                  m.mc_model ? `Model: ${m.mc_model}` : null,
                                  (m.place || m.mill?.place) ? `Place: ${m.place || m.mill?.place}` : null,
                                ]
                                  .filter(Boolean)
                                  .join(' | ')}
                              </div>
                            </button>
                          ))
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
                      <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
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
                        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                          {selectedCustomerId ? (
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                              {customers.find((c) => c.id === selectedCustomerId)?.name ?? 'Unknown Customer'}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600 text-sm font-medium">Select customer</span>
                          )}
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-56 overflow-y-auto">
                          <SelectItem value="all_clear" className="font-bold py-3 text-gray-400">Clear Customer Filter</SelectItem>
                          {customers.map((cust) => (
                            <SelectItem key={cust.id} value={cust.id} className="font-bold py-3">
                              {cust.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Skeleton className="h-11 rounded-xl w-full" />
                    )}
                  </div>

                  {/* Mill Dropdown */}
                  <div className="space-y-2" data-error={errors.mill_id ? 'true' : undefined}>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                        <Building2 size={14} className="text-primary/70" />
                        Mill
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
                        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                          {watch('mill_id') ? (
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                              {mills.find((m) => m.id === watch('mill_id'))?.name ?? 'Unknown Mill'}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600 text-sm font-medium">
                              {selectedCustomerId ? 'Select mill' : 'Select a customer first'}
                            </span>
                          )}
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-56">
                          {filteredMills.length > 0 ? (
                            filteredMills.map((mill) => (
                              <SelectItem key={mill.id} value={mill.id} className="font-bold py-3">
                                {mill.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no_mills" disabled className="py-3 text-gray-400 font-bold">
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

                  {/* Machine / Installation Record (REF NO / Frame No) Dropdown */}
                  {selectedMillId && (
                    <div className="space-y-2 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
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
                            setQuickWarrantyMonths(12);
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
                              setValue('machine_installation_date', '');
                              return;
                            }
                            const m = masterMills.find((rec) => rec.id === val);
                            if (m) {
                              // Frame / serial no
                              if (m.frame_no) setValue('serial_or_frame_no', m.frame_no);
                              // Machine model
                              if (m.mc_model) setValue('machine_model', m.mc_model);
                              // Installation date
                              if (m.installation_date) {
                                setValue('machine_installation_date', m.installation_date.split('T')[0]);
                              }
                              // Place: master mill place → mill place fallback
                              const placeToUse = m.place || m.mill?.place;
                              if (placeToUse) setValue('place', placeToUse);
                              // Phone: master mill phone → mill phone fallback
                              const phoneToUse = m.phone_no || m.mill?.phone;
                              if (phoneToUse) setValue('mill_whatsapp_number', normalizePhoneNumber(phoneToUse));
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
                              // Build a human-readable label — never fall through to UUID
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

                  <div className="space-y-2" data-error={errors.place ? 'true' : undefined}>
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={14} className="text-primary/70" />
                      Place
                    </Label>
                    <Input
                      {...register('place')}
                      placeholder="Enter place/location"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                    />
                    <FieldError message={errors.place?.message} />
                  </div>


                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Mail size={14} className="text-primary/70" />
                      Mill Email ID
                    </Label>
                    <Input
                      {...register('mill_email')}
                      placeholder="mill@example.com (Optional)"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                    />
                    <FieldError message={errors.mill_email?.message} />
                  </div>
                </div>
              </SectionToggle>

              {/* Section 4 - Visit Details */}
              <SectionToggle section={sections[3]} isOpen={!!openSections[4]} onToggle={toggleSection}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2" data-error={errors.visit_date ? 'true' : undefined}>
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <CalendarDays size={14} className="text-primary/70" />
                      Visit Date
                    </Label>
                    <Controller
                      name="visit_date"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select visit date"
                        />
                      )}
                    />
                    <FieldError message={errors.visit_date?.message} />
                  </div>

                  <div className="space-y-2" data-error={errors.call_registered_date ? 'true' : undefined}>
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
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
                          placeholder="Select call date"
                        />
                      )}
                    />
                    <FieldError message={errors.call_registered_date?.message} />
                  </div>
                </div>
              </SectionToggle>

              {/* Section 5 - Machine Information */}
              <SectionToggle section={sections[4]} isOpen={!!openSections[5]} onToggle={toggleSection}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2" data-error={errors.machine_model ? 'true' : undefined}>
                      <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                        <Cpu size={14} className="text-primary/70" />
                        Machine Model
                      </Label>
                      <Input
                        {...register('machine_model')}
                        placeholder="Enter machine model"
                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                      />
                      <FieldError message={errors.machine_model?.message} />
                    </div>

                    <div className="space-y-2" data-error={errors.serial_or_frame_no ? 'true' : undefined}>
                      <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                        <Tag size={14} className="text-primary/70" />
                        Serial No / Frame No
                      </Label>
                      <Input
                        {...register('serial_or_frame_no')}
                        placeholder="Enter serial or frame number"
                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                      />
                      <FieldError message={errors.serial_or_frame_no?.message} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
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
                            placeholder="Select mfg date"
                          />
                        )}
                      />
                      <FieldError message={errors.machine_mfg_date?.message} />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                        <CalendarDays size={14} className="text-primary/70" />
                        Installation Date
                      </Label>
                      <Controller
                        name="machine_installation_date"
                        control={control}
                        render={({ field }) => (
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select installation date"
                          />
                        )}
                      />
                      <FieldError message={errors.machine_installation_date?.message} />
                    </div>

                    <div className="space-y-2" data-error={errors.authorized_person ? 'true' : undefined}>
                      <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                        <Users size={14} className="text-primary/70" />
                        Authorized Person
                      </Label>
                      <Input
                        {...register('authorized_person')}
                        placeholder="Authorized person name"
                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                      />
                      <FieldError message={errors.authorized_person?.message} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2" data-error={errors.authorized_person_phone ? 'true' : undefined}>
                      <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
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
                </div>
              </SectionToggle>

              {/* Section 6 - Machine Details */}
              <SectionToggle section={sections[5]} isOpen={!!openSections[6]} onToggle={toggleSection}>
                <div className="space-y-4">
                  <div className="space-y-2" data-error={errors.nature_of_complaint ? 'true' : undefined}>
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} className="text-primary/70" />
                      Nature of Complaint
                    </Label>
                    <Textarea
                      {...register('nature_of_complaint')}
                      placeholder="Describe the nature of complaint"
                      className="min-h-[80px] bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold resize-none"
                    />
                    <FieldError message={errors.nature_of_complaint?.message} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} className="text-primary/70" />
                      Problem Observed
                    </Label>
                    <Textarea
                      {...register('problem_observed')}
                      placeholder="Describe the problem observed (Optional)"
                      className="min-h-[80px] bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold resize-none"
                    />
                    <FieldError message={errors.problem_observed?.message} />
                  </div>

                  <div className="space-y-2" data-error={errors.action_taken ? 'true' : undefined}>
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Wrench size={14} className="text-primary/70" />
                      Action Taken
                    </Label>
                    <Textarea
                      {...register('action_taken')}
                      placeholder="Describe the action taken"
                      className="min-h-[80px] bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold resize-none"
                    />
                    <FieldError message={errors.action_taken?.message} />
                  </div>
                </div>
              </SectionToggle>

              {/* Section 7 - Machine Performance */}
              <SectionToggle section={sections[6]} isOpen={!!openSections[7]} onToggle={toggleSection}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Package size={14} className="text-primary/70" />
                      Commodity
                    </Label>
                    <Input
                      {...register('commodity')}
                      placeholder="Commodity (Optional)"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} className="text-primary/70" />
                      Contamination
                    </Label>
                    <Input
                      {...register('contamination')}
                      placeholder="Contamination (Optional)"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Gauge size={14} className="text-primary/70" />
                      Output Capacity/Hour
                    </Label>
                    <Input
                      {...register('output_capacity_per_hour')}
                      placeholder="e.g., 500 kg/hr (Optional)"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Gauge size={14} className="text-primary/70" />
                      Rejection Ratio
                    </Label>
                    <Input
                      {...register('rejection_ratio')}
                      placeholder="e.g., 2% (Optional)"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Gauge size={14} className="text-primary/70" />
                      Purity
                    </Label>
                    <Input
                      {...register('purity')}
                      placeholder="e.g., 98% (Optional)"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Cpu size={14} className="text-primary/70" />
                      No of Programs Set
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      {...register('no_of_programs_set', { valueAsNumber: false })}
                      placeholder="0 (Optional)"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                    />
                  </div>
                </div>
              </SectionToggle>

              {/* Section 8 - Equipment Status */}
              <SectionToggle section={sections[7]} isOpen={!!openSections[8]} onToggle={toggleSection}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2" data-error={errors.ac_provided ? 'true' : undefined}>
                      <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                        <Wind size={14} className="text-primary/70" />
                        AC Provided
                      </Label>
                      <Select
                        onValueChange={(val) => setValue('ac_provided', val || '')}
                        value={watch('ac_provided')}
                        items={[
                          { value: 'YES', label: 'Yes' },
                          { value: 'NO', label: 'No' }
                        ]}
                      >
                        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                          <SelectItem value="YES" className="font-bold py-3 text-emerald-500">Yes</SelectItem>
                          <SelectItem value="NO" className="font-bold py-3 text-rose-500">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError message={errors.ac_provided?.message} />
                    </div>

                    <div className="space-y-2" data-error={errors.auto_drain_valve_working ? 'true' : undefined}>
                      <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                        <Wind size={14} className="text-primary/70" />
                        Auto Drain Valve Working
                      </Label>
                      <Select
                        onValueChange={(val) => setValue('auto_drain_valve_working', val || '')}
                        value={watch('auto_drain_valve_working')}
                        items={[
                          { value: 'YES', label: 'Yes' },
                          { value: 'NO', label: 'No' }
                        ]}
                      >
                        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                          <SelectItem value="YES" className="font-bold py-3 text-emerald-500">Yes</SelectItem>
                          <SelectItem value="NO" className="font-bold py-3 text-rose-500">No</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError message={errors.auto_drain_valve_working?.message} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} className="text-primary/70" />
                      Compressor Details
                    </Label>
                    <Input
                      {...register('compressor_details')}
                      placeholder="Compressor details (Optional)"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} className="text-primary/70" />
                      Air Drier Details
                    </Label>
                    <Input
                      {...register('air_drier_details')}
                      placeholder="Air drier details (Optional)"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                        <FileText size={14} className="text-primary/70" />
                        Line Filter Condition
                      </Label>
                      <Input
                        {...register('line_filter_condition')}
                        placeholder="Line filter condition (Optional)"
                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                        <FileText size={14} className="text-primary/70" />
                        Machine Filter Condition
                      </Label>
                      <Input
                        {...register('machine_filter_condition')}
                        placeholder="Machine filter condition (Optional)"
                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                      />
                    </div>
                  </div>
                </div>
              </SectionToggle>

              {/* Section 9 - Remarks & Signatures */}
              <SectionToggle section={sections[8]} isOpen={!!openSections[9]} onToggle={toggleSection}>
                <div className="space-y-6">
                  <div className="space-y-2" data-error={errors.status ? 'true' : undefined}>
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Tag size={14} className="text-primary/70" />
                      Work Status
                    </Label>
                    <Select
                      onValueChange={(val) => setValue('status', val || '')}
                      value={watch('status')}
                      items={[
                        { value: 'PENDING', label: 'Pending' },
                        { value: 'COMPLETED', label: 'Completed' },
                        { value: 'CANCELLED', label: 'Cancelled' }
                      ]}
                    >
                      <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                        <SelectValue placeholder="Select work status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                        <SelectItem value="PENDING" className="font-bold py-3 text-amber-500">Pending</SelectItem>
                        <SelectItem value="COMPLETED" className="font-bold py-3 text-emerald-500">Completed</SelectItem>
                        <SelectItem value="CANCELLED" className="font-bold py-3 text-rose-500">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError message={errors.status?.message} />
                  </div>

                  <div className="space-y-2" data-error={errors.engineer_remarks ? 'true' : undefined}>
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Pen size={14} className="text-primary/70" />
                      Engineer Remarks
                    </Label>
                    <Textarea
                      {...register('engineer_remarks')}
                      placeholder="Enter engineer remarks (max 2000 chars)"
                      className="min-h-[100px] bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold resize-none"
                    />
                    <FieldError message={errors.engineer_remarks?.message} />
                  </div>

                  <div className="space-y-2" data-error={errors.engineer_signature ? 'true' : undefined}>
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Pen size={14} className="text-primary/70" />
                      Engineer Signature
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

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <FileText size={14} className="text-primary/70" />
                      Customer Remarks
                    </Label>
                    <Textarea
                      {...register('customer_remarks')}
                      placeholder="Customer remarks (Optional, max 2000 chars)"
                      className="min-h-[100px] bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold resize-none"
                    />
                    <FieldError message={errors.customer_remarks?.message} />
                  </div>

                  <div className="space-y-2" data-error={errors.customer_signature ? 'true' : undefined}>
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
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
              className="flex-1 rounded-xl h-11 font-black text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="service-report-form"
              disabled={isSubmitting || isLoading}
              className="flex-1 rounded-xl h-11 bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              {isEdit ? 'Update Service' : 'Save Service'}
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
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setExistingCustomerId(null);
                    setQuickCustomerName('');
                    setQuickMillName('');
                    setIsMillNameManuallyEdited(false);
                  }}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                >
                  Change Customer
                </Button>
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
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">Years</Label>
                  <Input
                    type="number"
                    value={quickWarrantyYears}
                    onChange={(e) => setQuickWarrantyYears(Number(e.target.value))}
                    className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-gray-400">Months</Label>
                  <Input
                    type="number"
                    value={quickWarrantyMonths}
                    onChange={(e) => setQuickWarrantyMonths(Number(e.target.value))}
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
                      status: 'ACTIVE',
                    });

                    // Automatically prefill the form
                    setValue('serial_or_frame_no', newRecord.frame_no);
                    setValue('machine_model', newRecord.mc_model || '');
                    if (newRecord.installation_date) {
                      setValue('machine_installation_date', newRecord.installation_date.split('T')[0]);
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
