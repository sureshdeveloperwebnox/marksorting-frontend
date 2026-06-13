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
import { useMills } from '@/services/mill-service';
import { PhoneInput } from '@/components/ui/phone-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { normalizePhoneNumber } from '@/lib/utils';

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

const WARRANTY_TYPES = ['Non Warranty', 'Under Warranty', 'Expired'];

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
  warranty_years: z.coerce.number().min(0).optional(),
  warranty_months: z.coerce.number().min(0).optional(),
  installation_date: z.string().optional().or(z.literal('')),
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
    <div className="flex items-center gap-2 pt-2 pb-1 border-b border-gray-100 dark:border-white/5 mb-4">
      <Icon size={14} className={cn('flex-shrink-0', color)} />
      <span className={cn('text-[11px] font-black uppercase tracking-[0.14em]', color)}>
        {title}
      </span>
    </div>
  );
}

/* ── Field Label Component ──────────────────────────────────── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
      {children}
    </Label>
  );
}

/* ── Main Form Drawer ───────────────────────────────────────── */
export function MasterMillFormDrawer() {
  const { isFormDrawerOpen, closeFormDrawer, selectedMasterMillId } =
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
    warranty_years: 1,
    warranty_months: 12,
    installation_date: '',
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
    if (selectedMillId) {
      const mill = mills.find((m) => m.id === selectedMillId);
      if (mill?.address && !isEdit) {
        setValue('address', mill.address || '');
        setValue('phone_no', normalizePhoneNumber(mill.phone) || '');
      }
    }
  }, [selectedMillId, mills, setValue, isEdit]);

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
          warranty_years: recordData.warranty_years ?? 1,
          warranty_months: recordData.warranty_months ?? 12,
          installation_date: recordData.installation_date
            ? recordData.installation_date.split('T')[0]
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
    const payload: any = {
      ...data,
      mill_id: data.mill_id || undefined,
      invoice_date: data.invoice_date || undefined,
      installation_date: data.installation_date || undefined,
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
    <Sheet
      open={isFormDrawerOpen}
      onOpenChange={(open) => !open && closeFormDrawer()}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 flex flex-col h-full bg-white dark:bg-gray-950 border-l border-gray-100 dark:border-white/5"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <FileText size={22} />
            </div>
            <div>
              <SheetTitle className="text-xl">
                {isEdit ? 'Edit Master Mill Record' : 'Add Master Mill Record'}
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
                    className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
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
                  <Input
                    {...register('invoice_date')}
                    type="date"
                    className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
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
                    className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
                  />
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                        items={mills.map((m) => ({ value: m.id, label: m.name }))}
                      >
                        <SelectTrigger className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold text-sm">
                          {field.value ? (
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                              {mills.find((m) => m.id === field.value)?.name ?? 'Unknown'}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm font-medium">Select mill...</span>
                          )}
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-[240px] overflow-y-auto">
                          <SelectItem value="" className="font-bold py-2.5 text-gray-400">None / Clear</SelectItem>
                          {mills.map((m) => (
                            <SelectItem key={m.id} value={m.id} className="font-bold py-2.5">
                              {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
                    className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
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
                      className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>State</FieldLabel>
                    <Controller
                      name="state"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <SelectTrigger className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold text-sm">
                            <SelectValue placeholder="State..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-[240px] overflow-y-auto">
                            <SelectItem value="" className="font-bold py-2 text-gray-400">None</SelectItem>
                            {INDIAN_STATES.map((s) => (
                              <SelectItem key={s} value={s} className="font-bold py-2">
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                    className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <FieldLabel>Frame / W No</FieldLabel>
                  <Input
                    {...register('frame_no')}
                    placeholder="Frame or serial number"
                    className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
                  />
                </div>
              </div>

              {/* ── Warranty Details ────────────────────────── */}
              <SectionHeader icon={Shield} title="Warranty Details" color="text-emerald-500" />
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <FieldLabel>Years</FieldLabel>
                    <Input
                      {...register('warranty_years')}
                      type="number"
                      min={0}
                      placeholder="0"
                      className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Months</FieldLabel>
                    <Input
                      {...register('warranty_months')}
                      type="number"
                      min={0}
                      placeholder="12"
                      className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Type</FieldLabel>
                    <Controller
                      name="all_warranty"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || 'Non Warranty'}>
                          <SelectTrigger className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                            {WARRANTY_TYPES.map((w) => (
                              <SelectItem key={w} value={w} className="font-bold py-2.5">
                                {w}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FieldLabel>
                      <Calendar size={12} />
                      Installation Date
                    </FieldLabel>
                    <Input
                      {...register('installation_date')}
                      type="date"
                      className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>
                      <Calendar size={12} />
                      Warranty Closing
                    </FieldLabel>
                    <Input
                      {...register('warranty_closing_date')}
                      type="date"
                      placeholder="Auto-calculated"
                      className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
                    />
                    <p className="text-[10px] text-gray-400 ml-1">
                      Auto-calculated if left blank
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
                    <Input
                      {...register('amc_starting_date')}
                      type="date"
                      className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>AMC Period (months)</FieldLabel>
                    <Input
                      {...register('amc_period')}
                      type="number"
                      min={0}
                      placeholder="12"
                      className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <FieldLabel>AMC Particular</FieldLabel>
                  <Input
                    {...register('amc_particular')}
                    placeholder="AMC description or notes"
                    className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <FieldLabel>
                      <Calendar size={12} />
                      AMC Closing Date
                    </FieldLabel>
                    <Input
                      {...register('amc_closing_date')}
                      type="date"
                      className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
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
                      className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
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
                    <Select onValueChange={field.onChange} value={field.value || 'ACTIVE'}>
                      <SelectTrigger className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold text-sm">
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

        {/* Footer */}
        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-t border-gray-100 dark:border-white/5">
          <div className="flex gap-3 w-full">
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
  );
}
