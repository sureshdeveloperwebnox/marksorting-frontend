'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Save,
  Loader2,
  Factory,
  MapPin,
  FileText,
  Calendar,
  Shield,
  Wrench,
  Phone,
  Users,
  Hash,
  IndianRupee,
  LucideIcon,
  PlusCircle,
} from 'lucide-react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useCreateMasterMill,
  useUpdateMasterMill,
  useMasterMill,
} from '@/services/master-mill-service';
import { useMasterMillStore } from '@/store/useMasterMillStore';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useMills, useCreateMill } from '@/services/mill-service';
import { useCreateCustomer, useCustomers } from '@/services/customer-service';
import { PhoneInput } from '@/components/ui/phone-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { normalizePhoneNumber } from '@/lib/utils';
import { DatePicker } from '@/components/ui/date-picker';
import { StateSearchSelect } from '@/components/ui/state-search-select';
import { MillSearchSelect } from '@/components/ui/mill-search-select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

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
  
  // Try to search for state in address, place, city
  const searchStr = `${address} ${place} ${city}`.toLowerCase();
  
  // Clean states for matching
  const matched = INDIAN_STATES.find(s => {
    const cleanState = s.toLowerCase().replace(/\s+/g, '');
    const cleanSearch = searchStr.replace(/\s+/g, '');
    return cleanSearch.includes(cleanState);
  });
  
  return matched || '';
};

/* ── Zod Schema ─────────────────────────────────────────────── */
const masterMillSchema = z.object({
  invoice_no: z.string().min(1, 'Invoice number is required'),
  invoice_date: z.string().optional().or(z.literal('')),
  ref_no: z.string().optional().or(z.literal('')),
  mill_id: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  place: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  phone_no: z
    .string()
    .optional()
    .refine((val) => !val || isValidPhoneNumber(val), {
      message: 'Please enter a valid phone number',
    }),
  mc_model: z.string().optional().or(z.literal('')),
  frame_no: z.string().optional().or(z.literal('')),
  mfg_date: z.string().min(1, 'Manufacturing date is required'),
  warranty_years: z.coerce.number().min(0).optional(),
  warranty_months: z.coerce.number().min(0).optional(),
  installation_date: z.string().optional().or(z.literal('')),
  warranty_start_date: z.string().optional().or(z.literal('')),
  warranty_closing_date: z.string().optional().or(z.literal('')),
  all_warranty: z.string().optional().or(z.literal('')),
  amc_starting_date: z.string().optional().or(z.literal('')),
  amc_period: z.coerce.number().min(0).optional(),
  amc_particular: z.string().optional().or(z.literal('')),
  amc_closing_date: z.string().optional().or(z.literal('')),
  amc_amount: z.coerce.number().min(0).optional(),
  status: z.string().min(1, 'Status is required'),
});

type MasterMillFormValues = z.infer<typeof masterMillSchema>;

/* ── Section Header Component ──────────────────────────────── */
function SectionHeader({
  icon: Icon,
  title,
  color = 'text-primary',
}: {
  icon: LucideIcon;
  title: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 pt-3 pb-1.5 border-b border-gray-100 dark:border-white/5 mb-4">
      <Icon size={15} className={cn('flex-shrink-0', color)} />
      <span className={cn('text-xs font-black uppercase tracking-[0.14em]', color)}>
        {title}
      </span>
    </div>
  );
}

/* ── Field Label Component ──────────────────────────────────── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
      {children}
    </Label>
  );
}

/* ── Main Form Drawer ───────────────────────────────────────── */
export function MasterMillFormDrawer() {
  const { isFormDrawerOpen, closeFormDrawer, selectedMasterMillId, resetFilters } =
    useMasterMillStore();
  const isEdit = !!selectedMasterMillId;

  const { data: recordData, isLoading: recordLoading } = useMasterMill(
    selectedMasterMillId,
  );
  const { data: millsData } = useMills({
    skip: 0,
    take: 500,
    status: 'ACTIVE',
  });
  const { mutateAsync: createMasterMill, isPending: isCreating } =
    useCreateMasterMill();
  const { mutateAsync: updateMasterMill, isPending: isUpdating } =
    useUpdateMasterMill();

  const mills = millsData?.mills || [];

  // Query customers list to prevent duplicate creation
  const { data: customersData } = useCustomers({
    skip: 0,
    take: 1000,
    status: 'ACTIVE',
  });
  const customers = customersData?.customers || [];

  // Quick Create States
  const [isQuickCreateOpen, setIsQuickCreateOpen] = React.useState(false);
  const [isQuickRegistering, setIsQuickRegistering] = React.useState(false);
  const [quickCustomerName, setQuickCustomerName] = React.useState('');
  const [quickMillName, setQuickMillName] = React.useState('');
  const [isMillNameManuallyEdited, setIsMillNameManuallyEdited] = React.useState(false);
  const [quickPhone, setQuickPhone] = React.useState('');
  const [quickAddress, setQuickAddress] = React.useState('');
  const [quickPlace, setQuickPlace] = React.useState('');
  const [quickState, setQuickState] = React.useState('');
  const [quickRefNo, setQuickRefNo] = React.useState('');
  const [existingCustomerId, setExistingCustomerId] = React.useState<string | null>(null);

  // Similar existing customers based on quickCustomerName
  const similarCustomers = React.useMemo(() => {
    if (!quickCustomerName || quickCustomerName.trim().length < 2) return [];
    const search = quickCustomerName.toLowerCase().trim();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(search) && c.id !== existingCustomerId
    ).slice(0, 5);
  }, [quickCustomerName, customers, existingCustomerId]);

  // Similar existing mills based on quickMillName
  const similarMills = React.useMemo(() => {
    if (!quickMillName || quickMillName.trim().length < 2) return [];
    const search = quickMillName.toLowerCase().trim();
    return mills.filter((m) => m.name.toLowerCase().includes(search)).slice(0, 5);
  }, [quickMillName, mills]);

  const createCustomerMutation = useCreateCustomer();
  const createMillMutation = useCreateMill();

  const defaultValues: MasterMillFormValues = {
    invoice_no: '',
    invoice_date: '',
    ref_no: '',
    mill_id: '',
    address: '',
    place: '',
    state: '',
    phone_no: '',
    mc_model: '',
    frame_no: '',
    mfg_date: '',
    warranty_months: 12,
    installation_date: '',
    warranty_start_date: '',
    warranty_closing_date: '',
    all_warranty: 'Non Warranty',
    amc_starting_date: '',
    amc_period: undefined,
    amc_particular: '',
    amc_closing_date: '',
    amc_amount: undefined,
    status: 'ACTIVE',
  };

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MasterMillFormValues>({
    resolver: zodResolver(masterMillSchema) as any,
    defaultValues,
  });

  // Auto-fill mill address when mill is selected
  const selectedMillId = watch('mill_id');
  React.useEffect(() => {
    if (selectedMillId && !isEdit) {
      const mill = mills.find((m) => m.id === selectedMillId);
      if (mill) {
        setValue('address', mill.address || '');
        setValue('place', mill.place || '');
        setValue('phone_no', normalizePhoneNumber(mill.phone) || '');
        if (mill.ref_no) {
          setValue('ref_no', mill.ref_no);
        }
        const stateVal = matchState(mill);
        if (stateVal) {
          setValue('state', stateVal);
        }
      }
    }
  }, [selectedMillId, mills, setValue, isEdit]);

  // Watch ref_no to auto-prefill and select mill
  const enteredRefNo = watch('ref_no');
  React.useEffect(() => {
    if (enteredRefNo && !isEdit) {
      const cleanEntered = enteredRefNo.trim().toLowerCase().replace(/[\s\-\/]/g, '');
      if (cleanEntered) {
        const foundMill = mills.find((m) => {
          const cleanRef = (m.ref_no || '').trim().toLowerCase().replace(/[\s\-\/]/g, '');
          return cleanRef === cleanEntered;
        });

        if (foundMill && foundMill.id !== selectedMillId) {
          setValue('mill_id', foundMill.id);
        }
      }
    }
  }, [enteredRefNo, mills, setValue, isEdit, selectedMillId]);

  // Check if enteredRefNo has any matching mill
  const hasMatchingMill = React.useMemo(() => {
    if (!enteredRefNo) return true;
    const cleanEntered = enteredRefNo.trim().toLowerCase().replace(/[\s\-\/]/g, '');
    if (!cleanEntered) return true;
    return mills.some((m) => {
      const cleanRef = (m.ref_no || '').trim().toLowerCase().replace(/[\s\-\/]/g, '');
      return cleanRef === cleanEntered;
    });
  }, [enteredRefNo, mills]);

  // Dynamic auto-calculation of Warranty Closing Date
  const watchedInstallationDate = watch('installation_date');
  const watchedWarrantyStartDate = watch('warranty_start_date');
  const watchedWarrantyMonths = watch('warranty_months');

  React.useEffect(() => {
    const baseDate = watchedWarrantyStartDate || watchedInstallationDate;
    if (baseDate) {
      const date = new Date(baseDate);
      if (!isNaN(date.getTime())) {
        const months = Number(watchedWarrantyMonths) || 0;
        date.setMonth(date.getMonth() + months);
        date.setDate(date.getDate() - 1);
        const formatted = date.toISOString().split('T')[0];
        setValue('warranty_closing_date', formatted);
      }
    } else {
      setValue('warranty_closing_date', '');
    }
  }, [watchedInstallationDate, watchedWarrantyStartDate, watchedWarrantyMonths, setValue]);

  // Dynamic auto-calculation of AMC Closing Date
  const watchedAmcStartingDate = watch('amc_starting_date');
  const watchedAmcPeriod = watch('amc_period');

  React.useEffect(() => {
    if (watchedAmcStartingDate && watchedAmcPeriod) {
      const date = new Date(watchedAmcStartingDate);
      if (!isNaN(date.getTime())) {
        const period = Number(watchedAmcPeriod) || 0;
        date.setMonth(date.getMonth() + period);
        date.setDate(date.getDate() - 1);
        const formatted = date.toISOString().split('T')[0];
        setValue('amc_closing_date', formatted);
      }
    } else {
      setValue('amc_closing_date', '');
    }
  }, [watchedAmcStartingDate, watchedAmcPeriod, setValue]);

  // Suggestions matching the typed ref_no
  const suggestedMills = React.useMemo(() => {
    if (!enteredRefNo || hasMatchingMill) return [];
    const cleanEntered = enteredRefNo.trim().toLowerCase().replace(/[\s\-\/]/g, '');
    if (!cleanEntered) return [];
    return mills.filter((m) => {
      const cleanRef = (m.ref_no || '').trim().toLowerCase().replace(/[\s\-\/]/g, '');
      const cleanName = m.name.toLowerCase().replace(/[\s\-\/]/g, '');
      return cleanRef.includes(cleanEntered) || cleanName.includes(cleanEntered);
    }).slice(0, 3);
  }, [enteredRefNo, mills, hasMatchingMill]);

  const handleQuickCreateOpen = () => {
    setQuickCustomerName('');
    setQuickMillName('');
    setExistingCustomerId(null);
    setIsMillNameManuallyEdited(false);
    setQuickPhone(watch('phone_no') || '');
    setQuickAddress(watch('address') || '');
    setQuickPlace(watch('place') || '');
    setQuickState(watch('state') || '');
    setQuickRefNo(watch('ref_no') || '');
    setIsQuickCreateOpen(true);
  };

  const handleQuickCreateSubmit = async () => {
    setIsQuickRegistering(true);
    try {
      let customerId = existingCustomerId;

      // 1. Create the customer if not already selected/existing
      if (!customerId) {
        // Double check if a customer with the exact name already exists
        const exactMatch = customers.find(
          (c) => c.name.toLowerCase().trim() === quickCustomerName.toLowerCase().trim()
        );
        if (exactMatch) {
          customerId = exactMatch.id;
        } else {
          const newCustomer = await createCustomerMutation.mutateAsync({
            name: quickCustomerName,
            phone: quickPhone || undefined,
            address: quickAddress || undefined,
            status: 'ACTIVE',
          });
          customerId = newCustomer.id;
        }
      }

      // 2. Create the mill linked to the customer
      const newMill = await createMillMutation.mutateAsync({
        name: quickMillName,
        ref_no: quickRefNo || undefined,
        customer_id: customerId,
        phone: quickPhone || undefined,
        address: quickAddress || undefined,
        place: quickPlace || undefined,
        city: quickPlace || undefined,
        status: 'ACTIVE',
      });

      // 3. Set the form values
      setValue('mill_id', newMill.id);
      setValue('ref_no', quickRefNo);
      setValue('address', newMill.address || '');
      setValue('place', newMill.place || '');
      setValue('phone_no', normalizePhoneNumber(newMill.phone) || '');
      if (quickState) {
        setValue('state', quickState);
      }

      toast.success('Customer and Mill registered and linked successfully!');
      setIsQuickCreateOpen(false);
    } catch (err: any) {
      console.error('Failed to quick register:', err);
      toast.error(err.response?.data?.message || 'Failed to register Customer & Mill');
    } finally {
      setIsQuickRegistering(false);
    }
  };

  React.useEffect(() => {
    if (isFormDrawerOpen) {
      if (isEdit && recordData) {
        reset({
          invoice_no: recordData.invoice_no || '',
          invoice_date: recordData.invoice_date
            ? recordData.invoice_date.split('T')[0]
            : '',
          ref_no: recordData.ref_no || '',
          mill_id: recordData.mill_id || '',
          address: recordData.address || '',
          place: recordData.place || '',
          state: recordData.state || '',
          phone_no: normalizePhoneNumber(recordData.phone_no) || '',
          mc_model: recordData.mc_model || '',
          frame_no: recordData.frame_no || '',
          mfg_date: recordData.mfg_date
            ? recordData.mfg_date.split('T')[0]
            : '',
          warranty_months: (recordData.warranty_months && recordData.warranty_months > 0)
            ? recordData.warranty_months
            : ((recordData.warranty_years ?? 0) * 12 || 12),
          installation_date: recordData.installation_date
            ? recordData.installation_date.split('T')[0]
            : '',
          warranty_start_date: recordData.warranty_start_date
            ? recordData.warranty_start_date.split('T')[0]
            : '',
          warranty_closing_date: recordData.warranty_closing_date
            ? recordData.warranty_closing_date.split('T')[0]
            : '',
          all_warranty: recordData.all_warranty || 'Non Warranty',
          amc_starting_date: recordData.amc_starting_date
            ? recordData.amc_starting_date.split('T')[0]
            : '',
          amc_period: recordData.amc_period ?? undefined,
          amc_particular: recordData.amc_particular || '',
          amc_closing_date: recordData.amc_closing_date
            ? recordData.amc_closing_date.split('T')[0]
            : '',
          amc_amount: recordData.amc_amount ?? undefined,
          status: recordData.status || 'ACTIVE',
        });
      } else if (!isEdit) {
        reset(defaultValues);
      }
    }
  }, [isFormDrawerOpen, recordData, reset, isEdit]);

  const onSubmit: SubmitHandler<MasterMillFormValues> = async (data) => {
    const totalMonths = data.warranty_months !== undefined ? Number(data.warranty_months) : 12;
    const payload: any = {
      ...data,
      warranty_months: totalMonths,
      warranty_years: Math.floor(totalMonths / 12),
      mill_id: data.mill_id || undefined,
      invoice_date: data.invoice_date || undefined,
      installation_date: data.installation_date || undefined,
      warranty_start_date: data.warranty_start_date || undefined,
      warranty_closing_date: data.warranty_closing_date || undefined,
      amc_starting_date: data.amc_starting_date || undefined,
      amc_closing_date: data.amc_closing_date || undefined,
    };
    try {
      if (isEdit) {
        await updateMasterMill({ id: selectedMasterMillId, ...payload });
      } else {
        await createMasterMill(payload);
      }
      closeFormDrawer();
    } catch (_error) {
      // Handled by mutation callbacks
    }
  };

  const isLoading = isEdit && recordLoading;
  const isSubmitting = isCreating || isUpdating;

  return (
    <>
      <Sheet
        open={isFormDrawerOpen}
        onOpenChange={(open) => !open && closeFormDrawer()}
      >
      <SheetContent side="right">
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex-shrink-0">
          <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <FileText size={22} />
              </div>
              <div>
                <SheetTitle className="text-xl">
                  {isEdit ? 'Edit Master Record' : 'Add Master Record'}
                </SheetTitle>
                <SheetDescription>
                  {isEdit
                    ? 'Update the machine/warranty details.'
                    : 'Register a new machine installation record.'}
                </SheetDescription>
              </div>
            </div>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-hide pb-24">
          <div className="w-full">
            {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <form
              id="master-mill-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-1"
            >


              {/* ── Invoice Details ─────────────────────────── */}
              <SectionHeader icon={FileText} title="Invoice Details" color="text-blue-500" />
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <FieldLabel>
                    <Hash size={12} />
                    Invoice No *
                  </FieldLabel>
                  <Input
                    {...register('invoice_no')}
                    placeholder="e.g. INV-0036"
                    className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium text-sm"
                  />
                  {errors.invoice_no && (
                    <p className="text-[11px] text-rose-500 font-bold ml-1">
                      {errors.invoice_no.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <FieldLabel>
                    <Calendar size={12} />
                    Invoice Date
                  </FieldLabel>
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
                <div className="space-y-2 col-span-2">
                  <FieldLabel>
                    <Hash size={12} />
                    Ref No
                  </FieldLabel>
                  <Input
                    {...register('ref_no')}
                    placeholder="e.g. P-0005-17-18"
                    className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium text-sm"
                  />
                  
                  {/* Inline warning and suggestion checklist when Ref No is not found */}
                  {!hasMatchingMill && enteredRefNo && (
                    <div className="mt-2.5 p-3.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-[16px] space-y-2">
                      <div className="flex items-start gap-2.5">
                        <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                            Ref No "{enteredRefNo}" is not registered.
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                            No active mill matches this reference number. You can quickly register it inline or select a suggestion below.
                          </p>
                        </div>
                      </div>

                      {/* Suggestions list (checklist of existing matches) */}
                      {suggestedMills.length > 0 && (
                        <div className="pt-1.5 border-t border-gray-100 dark:border-white/5">
                          <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">
                            Suggested existing mills:
                          </p>
                          <div className="flex flex-col gap-1">
                            {suggestedMills.map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setValue('mill_id', m.id);
                                  if (m.ref_no) setValue('ref_no', m.ref_no);
                                }}
                                className="text-left text-xs text-primary hover:underline font-bold flex items-center gap-1.5 py-0.5 rounded transition-all"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {m.name} {m.ref_no ? `(${m.ref_no})` : ''}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-2">
                        <Button
                          type="button"
                          onClick={handleQuickCreateOpen}
                          className="w-full h-10 rounded-xl text-xs font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 border-none"
                        >
                          <PlusCircle size={14} />
                          Quick Register Customer &amp; Mill
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Mill / Location ─────────────────────────── */}
              <SectionHeader icon={Factory} title="Mill & Location" color="text-primary" />
              <div className="space-y-4 mb-4">
                <div className="space-y-2">
                  <FieldLabel>
                    <Users size={12} />
                    Mill Name
                  </FieldLabel>
                  <Controller
                    name="mill_id"
                    control={control}
                    render={({ field }) => (
                      <MillSearchSelect
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Select mill..."
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>
                    <Users size={12} />
                    Customer Name
                  </FieldLabel>
                  <Input
                    value={
                      selectedMillId
                        ? mills.find((m) => m.id === selectedMillId)?.customer?.name || 'Unknown'
                        : ''
                    }
                    disabled
                    placeholder="Auto-resolved from selected mill"
                    className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-medium text-sm text-gray-500 dark:text-gray-400 disabled:opacity-80"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>
                    <MapPin size={12} />
                    Address
                  </FieldLabel>
                  <Input
                    {...register('address')}
                    placeholder="Full address"
                    className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FieldLabel>
                      <MapPin size={12} />
                      Place
                    </FieldLabel>
                    <Input
                      {...register('place')}
                      placeholder="City / Town"
                      className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>State</FieldLabel>
                    <Controller
                      name="state"
                      control={control}
                      render={({ field }) => (
                        <StateSearchSelect
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Select State..."
                          className="h-10 text-sm font-bold border-none"
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <FieldLabel>
                    <Phone size={12} />
                    Phone No
                  </FieldLabel>
                  <Controller
                    name="phone_no"
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Enter phone number"
                        className="h-10"
                      />
                    )}
                  />
                  {errors.phone_no && (
                    <p className="text-[11px] text-rose-500 font-bold ml-1">
                      {errors.phone_no.message}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Machine Details ─────────────────────────── */}
              <SectionHeader icon={Wrench} title="Machine Details" color="text-violet-500" />
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2 col-span-2">
                  <FieldLabel>MC Model</FieldLabel>
                  <Input
                    {...register('mc_model')}
                    placeholder="e.g. RX-40 B FOR ZX-40"
                    className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium text-sm"
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <FieldLabel>Frame / W No</FieldLabel>
                  <Input
                    {...register('frame_no')}
                    placeholder="Frame or serial number"
                    className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium text-sm"
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <FieldLabel>
                    <Calendar size={12} />
                    Mfg Date *
                  </FieldLabel>
                  <Controller
                    name="mfg_date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select mfg date"
                      />
                    )}
                  />
                  {errors.mfg_date && (
                    <p className="text-[11px] text-rose-500 font-bold ml-1">
                      {errors.mfg_date.message}
                    </p>
                  )}
                </div>
              </div>

              {/* ── Warranty Details ────────────────────────── */}
              <SectionHeader icon={Shield} title="Warranty Details" color="text-emerald-500" />
              <div className="space-y-4 mb-4">
                <div className="space-y-2">
                  <FieldLabel>Warranty Period (Months)</FieldLabel>
                  <Input
                    {...register('warranty_months')}
                    type="number"
                    min={0}
                    placeholder="e.g. 12"
                    className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <FieldLabel>
                      <Calendar size={12} />
                      Installation Date
                    </FieldLabel>
                    <Controller
                      name="installation_date"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select date"
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>
                      <Calendar size={12} />
                      Warranty Start
                    </FieldLabel>
                    <Controller
                      name="warranty_start_date"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select date"
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>
                      <Calendar size={12} />
                      Warranty Closing
                    </FieldLabel>
                    <Controller
                      name="warranty_closing_date"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Auto-calculated"
                        />
                      )}
                    />
                    <p className="text-[10px] text-gray-400 ml-1">
                      Auto-calculated
                    </p>
                  </div>
                </div>
              </div>

              {/* ── AMC Details ─────────────────────────────── */}
              <SectionHeader icon={IndianRupee} title="AMC Details" color="text-amber-500" />
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FieldLabel>
                      <Calendar size={12} />
                      AMC Start Date
                    </FieldLabel>
                    <Controller
                      name="amc_starting_date"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select start date"
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>AMC Period (Months)</FieldLabel>
                    <Input
                      {...register('amc_period')}
                      type="number"
                      min={0}
                      placeholder="12"
                      className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <FieldLabel>AMC Particular</FieldLabel>
                  <Controller
                    name="amc_particular"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || ''}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium text-sm">
                          <SelectValue placeholder="Select AMC Particular" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 dark:border-white/10">
                          <SelectItem value="With AMC" className="font-semibold text-sm rounded-lg">
                            With AMC
                          </SelectItem>
                          <SelectItem value="Without AMC" className="font-semibold text-sm rounded-lg">
                            Without AMC
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FieldLabel>
                      <Calendar size={12} />
                      AMC Closing Date
                    </FieldLabel>
                    <Controller
                      name="amc_closing_date"
                      control={control}
                      render={({ field }) => (
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Auto-calculated"
                        />
                      )}
                    />
                    <p className="text-[10px] text-gray-400 ml-1">
                      Auto-calculated if left blank
                    </p>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>
                      <IndianRupee size={12} />
                      AMC Amount (₹)
                    </FieldLabel>
                    <Input
                      {...register('amc_amount')}
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* ── Status ──────────────────────────────────── */}
              <SectionHeader icon={Shield} title="Record Status" color="text-gray-500" />
              <div className="space-y-2 mb-4">
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || 'ACTIVE'}
                      items={[
                        { value: 'ACTIVE', label: 'Active' },
                        { value: 'INACTIVE', label: 'Inactive' }
                      ]}
                    >
                      <SelectTrigger className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-medium text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                        <SelectItem value="ACTIVE" className="font-bold py-2.5 text-emerald-500">Active</SelectItem>
                        <SelectItem value="INACTIVE" className="font-bold py-2.5 text-amber-500">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </form>
          )}
        </div>
      </div>

        {/* Footer */}
        <SheetFooter className="p-4 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-t border-gray-100 dark:border-white/5">
          <div className="w-full flex gap-3">
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
              form="master-mill-form"
              disabled={isSubmitting || isLoading}
              className="flex-1 rounded-xl h-11 bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isEdit ? 'Update Record' : 'Save Record'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>

    {/* Quick Register Customer & Mill Dialog */}
    <Dialog open={isQuickCreateOpen} onOpenChange={setIsQuickCreateOpen}>
      <DialogContent className="sm:max-w-[425px] rounded-[24px] border-none shadow-2xl p-6 bg-white dark:bg-gray-900 z-[99999]">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Factory className="text-primary" size={20} />
            Quick Register Customer &amp; Mill
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 font-bold">
            Register a new customer and mill to link with this Master record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {/* Ref No */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-primary uppercase tracking-widest">Reference No</Label>
            <Input 
              value={quickRefNo} 
              onChange={(e) => setQuickRefNo(e.target.value)} 
              placeholder="e.g. P_8992" 
              className="h-9 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-xs" 
            />
          </div>

          {/* Customer Name */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-bold text-primary uppercase tracking-widest">Customer Name *</Label>
              {existingCustomerId && (
                <button
                  type="button"
                  onClick={() => {
                    setExistingCustomerId(null);
                    setQuickCustomerName('');
                    setQuickMillName('');
                    setIsMillNameManuallyEdited(false);
                  }}
                  className="text-[9px] font-black uppercase text-rose-500 hover:underline tracking-wider"
                >
                  Clear Selection
                </button>
              )}
            </div>
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
              className={cn(
                "h-9 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-xs",
                existingCustomerId && "opacity-75 bg-blue-500/5 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
              )}
            />

            {/* Match from existing customer checklist */}
            {!existingCustomerId && similarCustomers.length > 0 && (
              <div className="mt-1.5 p-2 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-1">
                <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">
                  Match from existing customer checklist:
                </p>
                <div className="flex flex-col gap-1 max-h-[80px] overflow-y-auto">
                  {similarCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setQuickCustomerName(c.name);
                        setExistingCustomerId(c.id);
                      }}
                      className="text-left text-[11px] font-bold text-gray-700 dark:text-gray-300 hover:text-primary hover:underline flex items-center justify-between py-1 px-1.5 rounded bg-white dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-gray-100 dark:border-white/5"
                    >
                      <span>{c.name}</span>
                      {c.phone && <span className="text-[9px] text-gray-400 font-normal">{c.phone}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mill Name */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-primary uppercase tracking-widest">Mill Name *</Label>
            <Input 
              value={quickMillName} 
              onChange={(e) => {
                setQuickMillName(e.target.value);
                setIsMillNameManuallyEdited(true);
              }}
              placeholder="e.g. Seva Mandir Mill" 
              className="h-9 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-xs" 
            />

            {/* Match from existing mill checklist */}
            {similarMills.length > 0 && (
              <div className="mt-1.5 p-2 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">
                  Existing Mills matching name:
                </p>
                <div className="flex flex-col gap-1 max-h-[80px] overflow-y-auto">
                  {similarMills.map((m) => (
                    <div
                      key={m.id}
                      className="text-[10px] font-bold text-gray-500 dark:text-gray-400 py-0.5 px-1.5 flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      {m.name} {m.place ? `(${m.place})` : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Phone No */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-primary uppercase tracking-widest">Contact Phone</Label>
            <PhoneInput
              value={quickPhone}
              onChange={setQuickPhone}
              placeholder="Enter phone number"
              className="h-9"
            />
          </div>

          {/* Address */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-primary uppercase tracking-widest">Address</Label>
            <Input 
              value={quickAddress} 
              onChange={(e) => setQuickAddress(e.target.value)}
              placeholder="Mill street address" 
              className="h-9 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-xs" 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Place */}
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-primary uppercase tracking-widest">Place / Town</Label>
              <Input 
                value={quickPlace} 
                onChange={(e) => setQuickPlace(e.target.value)}
                placeholder="Place" 
                className="h-9 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-xs" 
              />
            </div>
            {/* State */}
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-primary uppercase tracking-widest">State</Label>
              <StateSearchSelect
                value={quickState}
                onChange={setQuickState}
                placeholder="Select State..."
                className="h-9 text-xs font-bold border-none"
                openDirection="up"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-end pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsQuickCreateOpen(false)}
            className="rounded-lg h-9 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleQuickCreateSubmit}
            disabled={isQuickRegistering || !quickCustomerName || !quickMillName}
            className="rounded-lg h-9 text-xs bg-primary hover:bg-primary/95 text-white font-black shadow-lg shadow-primary/20 gap-1.5"
          >
            {isQuickRegistering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Create &amp; Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
