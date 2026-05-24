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
} from 'lucide-react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { normalizePhoneNumber } from '@/lib/utils';
import { useCreateServiceReport, useUpdateServiceReport, useServiceReport } from '@/services/service-report-service';
import { useServiceCategories } from '@/services/service-category-service';
import { useMills } from '@/services/mill-service';
import { useCustomers } from '@/services/customer-service';
import useServiceReportStore from '@/store/useServiceReportStore';
import { TechnicianMultiSelect } from '@/components/ui/technician-multi-select';
import { SignaturePad } from '@/components/ui/signature-pad';
import { PhoneInput } from '@/components/ui/phone-input';
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

const serviceReportSchema = z.object({
  service_category_id: z.string().min(1, 'Service category is required'),
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
  visit_date: z.string().min(1, 'Visit date is required'),
  visit_time: z.string().min(1, 'Visit time is required'),
  call_registered_date: z.string().min(1, 'Call registered date is required'),
  machine_model: z.string().min(1, 'Machine model is required'),
  machine_mfg_date: z.string().optional().or(z.literal('')),
  machine_installation_date: z.string().optional().or(z.literal('')),
  serial_or_frame_no: z.string().min(1, 'Serial/Frame no is required'),
  authorized_person: z.string().min(1, 'Authorized person is required'),
  previous_visit_engineer: z.string().optional().or(z.literal('')),
  nature_of_complaint: z.string().min(1, 'Nature of complaint is required'),
  problem_observed: z.string().optional().or(z.literal('')),
  action_taken: z.string().min(1, 'Action taken is required'),
  commodity: z.string().optional().or(z.literal('')),
  contamination: z.string().optional().or(z.literal('')),
  output_capacity_per_hour: z.string().optional().or(z.literal('')),
  rejection_ratio: z.string().optional().or(z.literal('')),
  purity: z.string().optional().or(z.literal('')),
  no_of_programs_set: z.number().min(0).optional().or(z.literal('')),
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

export function ServiceReportFormDrawer() {
  const { isFormDrawerOpen, closeFormDrawer, selectedId } = useServiceReportStore();
  const isEdit = !!selectedId;

  const { data: reportData, isLoading: reportLoading } = useServiceReport(selectedId);
  const { data: categoriesData } = useServiceCategories({ skip: 0, take: 500 });
  const { data: millsData } = useMills({ skip: 0, take: 500 });
  const { data: customersData } = useCustomers({ skip: 0, take: 500, status: 'ACTIVE' });
  const { mutateAsync: createReport, isPending: isCreating } = useCreateServiceReport();
  const { mutateAsync: updateReport, isPending: isUpdating } = useUpdateServiceReport();

  const categories = categoriesData?.serviceCategories || [];
  const mills = millsData?.mills || [];
  const customers = customersData?.customers || [];

  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>('');

  const [openSections, setOpenSections] = React.useState<Record<number, boolean>>({ 1: true });
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

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
      previous_visit_engineer: '',
      nature_of_complaint: '',
      problem_observed: '',
      action_taken: '',
      commodity: '',
      contamination: '',
      output_capacity_per_hour: '',
      rejection_ratio: '',
      purity: '',
      no_of_programs_set: '',
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
    },
  });

  const selectedMillId = watch('mill_id');

  const filteredMills = React.useMemo(() => {
    const currentMillId = watch('mill_id');
    if (!selectedCustomerId) {
      return mills.filter((m) => m.id === currentMillId);
    }
    return mills.filter((m) => m.customer_id === selectedCustomerId || m.id === currentMillId);
  }, [mills, selectedCustomerId, watch('mill_id')]);

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

  React.useEffect(() => {
    if (isFormDrawerOpen) {
      setOpenSections({ 1: true });
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
          previous_visit_engineer: reportData.previous_visit_engineer || '',
          nature_of_complaint: reportData.nature_of_complaint,
          problem_observed: reportData.problem_observed || '',
          action_taken: reportData.action_taken,
          commodity: reportData.commodity || '',
          contamination: reportData.contamination || '',
          output_capacity_per_hour: reportData.output_capacity_per_hour || '',
          rejection_ratio: reportData.rejection_ratio || '',
          purity: reportData.purity || '',
          no_of_programs_set: reportData.no_of_programs_set ?? '',
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
        });
      } else if (!isEdit) {
        setSelectedCustomerId('');
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
          previous_visit_engineer: '',
          nature_of_complaint: '',
          problem_observed: '',
          action_taken: '',
          commodity: '',
          contamination: '',
          output_capacity_per_hour: '',
          rejection_ratio: '',
          purity: '',
          no_of_programs_set: '',
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
        });
      }
    } else {
      setSelectedCustomerId('');
    }
  }, [isFormDrawerOpen, reportData, reset, isEdit, mills]);

  const onSubmit: SubmitHandler<ServiceReportFormValues> = async (data) => {
    try {
      const payload = {
        ...data,
        ac_provided: data.ac_provided === 'YES',
        auto_drain_valve_working: data.auto_drain_valve_working === 'YES',
        no_of_programs_set: data.no_of_programs_set ? Number(data.no_of_programs_set) : undefined,
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
  const isSubmitting = isCreating || isUpdating;

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
    engineer_remarks: 9,
    engineer_signature: 9,
    customer_remarks: 9,
    customer_signature: 9,
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

  const SectionToggle = ({ section, children }: { section: typeof sections[0]; children: React.ReactNode }) => (
    <div className="border border-gray-100 dark:border-white/5 rounded-xl bg-white dark:bg-gray-950">
      <button
        type="button"
        onClick={() => toggleSection(section.id)}
        className={cn(
          "w-full flex items-center justify-between px-5 py-4 bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100/50 dark:hover:bg-white/10 transition-colors",
          openSections[section.id] ? "rounded-t-xl" : "rounded-xl"
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
        {openSections[section.id] ? (
          <ChevronDown size={18} className="text-gray-400" />
        ) : (
          <ChevronRight size={18} className="text-gray-400" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {openSections[section.id] && (
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

  const FieldError = ({ message }: { message?: string }) =>
    message ? <p className="text-[11px] text-rose-500 font-bold ml-1">{message}</p> : null;

  return (
    <Sheet open={isFormDrawerOpen} onOpenChange={(open) => !open && closeFormDrawer()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col h-full bg-gray-50 dark:bg-gray-950 border-l border-gray-100 dark:border-white/5"
      >
        <SheetHeader className="px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <ClipboardCheck size={24} />
            </div>
            <div>
              <SheetTitle className="text-xl">
                {isEdit ? 'Edit Service Report' : 'New Service Report'}
              </SheetTitle>
              <SheetDescription>
                {isEdit ? 'Update service report information.' : 'Create a new service report.'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div ref={sheetRef} className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide pb-24">
          {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <form id="service-report-form" ref={formRef} onSubmit={handleSubmit(onSubmit, scrollToFirstError)} className="space-y-4">
              {/* Section 1 - General Information */}
              <SectionToggle section={sections[0]}>
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
              <SectionToggle section={sections[1]}>
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
              <SectionToggle section={sections[2]}>
                <div className="space-y-4">
                  {/* Customer Dropdown */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
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
                        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                          <SelectValue placeholder="Select customer" />
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
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Building2 size={14} className="text-primary/70" />
                      Mill
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
                        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                          <SelectValue placeholder={selectedCustomerId ? "Select mill" : "Select a customer first"} />
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

                  <div className="space-y-2" data-error={errors.mill_whatsapp_number ? 'true' : undefined}>
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Phone size={14} className="text-primary/70" />
                      Mill WhatsApp Number
                    </Label>
                    <Controller
                      name="mill_whatsapp_number"
                      control={control}
                      render={({ field }) => (
                        <PhoneInput
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Enter WhatsApp number"
                          className="h-11"
                        />
                      )}
                    />
                    <FieldError message={errors.mill_whatsapp_number?.message} />
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
              <SectionToggle section={sections[3]}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                  <div className="space-y-2" data-error={errors.visit_time ? 'true' : undefined}>
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Clock size={14} className="text-primary/70" />
                      Visit Time
                    </Label>
                    <Controller
                      name="visit_time"
                      control={control}
                      render={({ field }) => (
                        <TimePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select visit time"
                        />
                      )}
                    />
                    <FieldError message={errors.visit_time?.message} />
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
                          placeholder="Select call registered date"
                        />
                      )}
                    />
                    <FieldError message={errors.call_registered_date?.message} />
                  </div>
                </div>
              </SectionToggle>

              {/* Section 5 - Machine Information */}
              <SectionToggle section={sections[4]}>
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Users size={14} className="text-primary/70" />
                      Previous Visit Engineer
                    </Label>
                    <Input
                      {...register('previous_visit_engineer')}
                      placeholder="Previous visit engineer name (Optional)"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                    />
                    <FieldError message={errors.previous_visit_engineer?.message} />
                  </div>
                </div>
              </SectionToggle>

              {/* Section 6 - Machine Details */}
              <SectionToggle section={sections[5]}>
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
              <SectionToggle section={sections[6]}>
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
              <SectionToggle section={sections[7]}>
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
              <SectionToggle section={sections[8]}>
                <div className="space-y-6">
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

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-t border-gray-100 dark:border-white/5 z-10">
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
              form="service-report-form"
              disabled={isSubmitting || isLoading}
              className="flex-1 rounded-xl h-11 bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              {isEdit ? 'Update Report' : 'Save Report'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
