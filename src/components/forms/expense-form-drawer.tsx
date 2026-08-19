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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Save,
  Loader2,
  Building2,
  Users,
  MapPin,
  CalendarDays,
  Clock,
  Tag,
  ChevronDown,
  ChevronRight,
  DollarSign,
  UploadCloud,
  X,
  Image as ImageIcon,
  PlusCircle,
  Cpu,
  FileText,
  CheckCircle,
  XCircle,
  Shield,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateExpense, useUpdateExpense, useExpense, useExpenseEligibility } from '@/services/expense-service';
import { useExpenseCategories } from '@/services/expense-category-service';
import { useMills, useCreateMill } from '@/services/mill-service';
import { useCustomers, useCreateCustomer } from '@/services/customer-service';
import { useMasterMills, useCreateMasterMill } from '@/services/master-mill-service';
import useExpenseStore from '@/store/useExpenseStore';
import { useAuthStore } from '@/store/auth-store';
import { TechnicianMultiSelect } from '@/components/ui/technician-multi-select';
// ExpenseCategoryMultiSelect removed — inline per-item dropdowns used instead
import { useS3Upload } from '@/hooks/use-s3-upload';
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
import { PhoneInput } from '@/components/ui/phone-input';
import { cn, normalizePhoneNumber } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { DatePicker } from '@/components/ui/date-picker';
import { TimePicker } from '@/components/ui/time-picker';

const getExpenseSchema = (isServiceEngineer: boolean) => z.object({
  expense_type: z.enum(['MILL', 'OTHERS']).default('MILL'),
  technician_ids: z.array(z.string()).min(1, 'At least one engineer is required'),
  mill_id: z.string().optional().or(z.literal('')),
  place: z.string().optional().or(z.literal('')),
  others: z.string().optional().or(z.literal('')),
  visit_date: z.string()
    .min(1, 'Date is required')
    .refine((val) => {
      if (!val) return true;
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return new Date(val) <= today;
    }, {
      message: 'Expense date cannot be in the future',
    }),
  visit_time: z.string().optional().or(z.literal('')),
  service_report_id: z.string().optional().or(z.literal('')),
  installation_report_id: z.string().optional().or(z.literal('')),
  expense_items: z.array(z.object({
    expense_category_id: z.string().min(1, 'Category is required'),
    amount: z.preprocess((val) => val === '' || val === null || val === undefined ? 0 : Number(val), z.number().int('Amount must be a whole number (no paise)').min(0, 'Amount must be positive')),
    admin_amount: z.preprocess((val) => val === '' || val === null || val === undefined ? 0 : Number(val), z.number().int('Admin amount must be a whole number (no paise)').min(0, 'Admin amount must be positive')),
    remarks: z.string().optional().or(z.literal('')),
    admin_remarks: z.string().optional().or(z.literal('')),
    expense_images: z.array(z.string()).default([]),
  })).min(1, 'At least one category is required'),
}).superRefine((data, ctx) => {
  if (isServiceEngineer) {
    if (!data.service_report_id && !data.installation_report_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['service_report_id'],
        message: 'You must link this expense to a Service Report or Installation Report',
      });
    }
  }

  if (data.expense_type === 'MILL') {
    if (!data.mill_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mill_id'],
        message: 'Mill Name is required for Mill Expenses',
      });
    }
  } else if (data.expense_type === 'OTHERS') {
    if (!data.place || !data.place.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['place'],
        message: 'Place is required for other expenses',
      });
    }
  }
});

type ExpenseFormValues = z.infer<ReturnType<typeof getExpenseSchema>>;

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-[11px] text-rose-500 font-bold ml-1">{message}</p> : null;
}

const getStatusColors = (status?: string) => {
  switch (status?.toUpperCase()) {
    case "PENDING": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "IN_PROGRESS": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
    case "COMPLETED": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "CANCELLED": return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
    default: return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30";
  }
};

const getStatusDotBg = (status?: string) => {
  switch (status?.toUpperCase()) {
    case "PENDING": return "bg-amber-500";
    case "IN_PROGRESS": return "bg-blue-500";
    case "COMPLETED": return "bg-emerald-500";
    case "CANCELLED": return "bg-rose-500";
    default: return "bg-gray-400";
  }
};

const getStatusLabel = (status?: string) => {
  switch (status?.toUpperCase()) {
    case "PENDING": return "Pending";
    case "IN_PROGRESS": return "In Progress";
    case "COMPLETED": return "Approved";
    case "CANCELLED": return "Rejected";
    default: return status || "";
  }
};

const EXPENSE_STATUS_OPTIONS = [
  {
    value: "PENDING",
    label: "Pending",
    icon: Clock,
    iconColor: "text-amber-500",
    activeClasses: "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20 font-bold",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
    icon: RotateCcw,
    iconColor: "text-blue-500",
    activeClasses: "bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-500/20 font-bold",
  },
  {
    value: "COMPLETED",
    label: "Approved",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    activeClasses: "bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-500/20 font-bold",
  },
  {
    value: "CANCELLED",
    label: "Rejected",
    icon: XCircle,
    iconColor: "text-rose-500",
    activeClasses: "bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-500/20 font-bold",
  },
];

export function ExpenseFormDrawer() {
  const { isFormDrawerOpen, closeFormDrawer, selectedId } = useExpenseStore();
  const isEdit = !!selectedId;
  const [selectedStatus, setSelectedStatus] = React.useState<string>('PENDING');
  const [isUpdatingStatusAlone, setIsUpdatingStatusAlone] = React.useState(false);

  const { data: expenseData, isLoading: expenseLoading } = useExpense(selectedId);
  const { data: millsData } = useMills({ skip: 0, take: 500 });
  const { data: customersData } = useCustomers({ skip: 0, take: 500, status: 'ACTIVE' });
  const { data: categoriesData, isLoading: categoriesLoading } = useExpenseCategories({ skip: 0, take: 500, status: 'ACTIVE' });
  const { mutateAsync: createExpense, isPending: isCreating } = useCreateExpense();
  const { mutateAsync: updateExpense, isPending: isUpdating } = useUpdateExpense();
  const { uploadFile, isUploading, uploadProgress } = useS3Upload();

  const mills = React.useMemo(() => millsData?.mills || [], [millsData?.mills]);
  const customers = React.useMemo(() => customersData?.customers || [], [customersData?.customers]);
  const categories = React.useMemo(() => categoriesData?.expenseCategories || [], [categoriesData?.expenseCategories]);

  const user = useAuthStore((state) => state.user);
  const isServiceEngineer = user?.role === 'Service Engineer';

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(getExpenseSchema(isServiceEngineer)) as any,
    defaultValues: {
      expense_type: 'MILL',
      technician_ids: [],
      mill_id: '',
      place: '',
      others: '',
      visit_date: '',
      visit_time: '',
      service_report_id: '',
      installation_report_id: '',
      expense_items: [],
    },
  });

  const selectedMillId = watch('mill_id');
  const expenseType = watch('expense_type') || 'MILL';
  const selectedTechnicianIds = watch('technician_ids');

  // Primary technician ID to load reports for (either logged-in service engineer, or the first selected technician in list)
  const primaryTechId = isServiceEngineer ? user?.id : (selectedTechnicianIds && selectedTechnicianIds.length > 0 ? selectedTechnicianIds[0] : undefined);

  // Fetch reports eligibility
  const { data: eligibilityData, isLoading: eligibilityLoading } = useExpenseEligibility(
    primaryTechId,
    selectedId || undefined
  );

  // Clear stale report linkage when the primary technician changes (admin changing engineer selection)
  const prevPrimaryTechIdRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (!isFormDrawerOpen) return;
    if (prevPrimaryTechIdRef.current !== undefined && prevPrimaryTechIdRef.current !== primaryTechId) {
      setValue('service_report_id', '');
      setValue('installation_report_id', '');
      setReportTypeRadio(isServiceEngineer ? 'service' : 'none');
    }
    prevPrimaryTechIdRef.current = primaryTechId;
  }, [primaryTechId, isFormDrawerOpen, setValue, isServiceEngineer]);

  const eligibleReports = React.useMemo(() => {
    return {
      serviceReports: eligibilityData?.serviceReports || [],
      installationReports: eligibilityData?.installationReports || [],
    };
  }, [eligibilityData]);

  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>('');
  const [selectedMachineId, setSelectedMachineId] = React.useState<string>('');
  const [selectedMillObj, setSelectedMillObj] = React.useState<any>(null);
  const [activeUploadIndex, setActiveUploadIndex] = React.useState<number | null>(null);
  const [reportTypeRadio, setReportTypeRadio] = React.useState<'none' | 'service' | 'installation'>('none');

  const sheetRef = React.useRef<HTMLDivElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const initializedFormKeyRef = React.useRef<string | null>(null);

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

  // Autofill details based on selected Mill
  React.useEffect(() => {
    if (selectedMillId) {
      const mill = mills.find((m) => m.id === selectedMillId);
      if (mill) {
        if (mill.address && !watch('place')) {
          setValue('place', mill.address);
        }
        if (mill.customer_id && !selectedCustomerId) {
          setSelectedCustomerId(mill.customer_id);
        }
      }
    }
  }, [selectedMillId, mills, setValue, watch, selectedCustomerId]);

  // Synchronize selectedMachineId when mill changes
  React.useEffect(() => {
    if (!selectedMillId || !selectedMachineId) return;
    const match = masterMills.find((m) => m.id === selectedMachineId);
    if (!match || match.mill_id !== selectedMillId) {
      setSelectedMachineId('');
    }
  }, [selectedMillId, masterMills, selectedMachineId]);

  React.useEffect(() => {
    if (!isFormDrawerOpen) {
      initializedFormKeyRef.current = null;
      setSelectedCustomerId('');
      setSelectedMachineId('');
      setSelectedStatus('PENDING');
      return;
    }

    const formKey = isEdit ? `edit:${selectedId}:${expenseData?.id ?? 'loading'}` : 'new';
    if (initializedFormKeyRef.current === formKey) return;
    if (isEdit && !expenseData) return;

    initializedFormKeyRef.current = formKey;

    if (isFormDrawerOpen) {
      if (isEdit && expenseData) {
        setSelectedStatus(expenseData.status || 'PENDING');
        const mill = mills.find((m) => m.id === expenseData.mill_id);
        const newCustId = mill?.customer_id || '';
        if (selectedCustomerId !== newCustId) {
          setSelectedCustomerId(newCustId);
        }
        setSelectedMachineId('');

        const itemsToReset = expenseData.expense_items?.length
          ? expenseData.expense_items.map((item: any) => ({
            expense_category_id: item.expense_category_id,
            amount: item.amount ? Number(item.amount) : 0,
            admin_amount: item.admin_amount ? Number(item.admin_amount) : 0,
            remarks: item.remarks || '',
            admin_remarks: item.admin_remarks || '',
            expense_images: item.expense_images || [],
          }))
          : expenseData.expense_category_id
            ? [
              {
                expense_category_id: expenseData.expense_category_id,
                amount: expenseData.amount ? Number(expenseData.amount) : 0,
                admin_amount: expenseData.admin_amount ? Number(expenseData.admin_amount) : 0,
                remarks: expenseData.remarks || '',
                admin_remarks: '',
                expense_images: expenseData.expense_images || [],
              },
            ]
            : [];

        reset({
          expense_type: (expenseData.expense_type as 'MILL' | 'OTHERS') || 'MILL',
          technician_ids: expenseData.technicians?.map((t: any) => t.technician.id) || [],
          mill_id: expenseData.mill_id || '',
          place: expenseData.place || '',
          others: expenseData.others || '',
          visit_date: expenseData.visit_date?.split('T')[0] || '',
          visit_time: expenseData.visit_time || '',
          service_report_id: expenseData.service_report_id || '',
          installation_report_id: expenseData.installation_report_id || '',
          expense_items: itemsToReset,
        });

        if (expenseData.service_report_id) {
          setReportTypeRadio('service');
        } else if (expenseData.installation_report_id) {
          setReportTypeRadio('installation');
        } else {
          setReportTypeRadio(isServiceEngineer ? 'service' : 'none');
        }
      } else if (!isEdit) {
        setSelectedCustomerId('');
        setSelectedMachineId('');
        setSelectedStatus('PENDING');
        reset({
          expense_type: 'MILL',
          technician_ids: [],
          mill_id: '',
          place: '',
          others: '',
          visit_date: '',
          visit_time: '',
          service_report_id: '',
          installation_report_id: '',
          expense_items: [],
        });
        setReportTypeRadio(isServiceEngineer ? 'service' : 'none');
      }
    }
  }, [isFormDrawerOpen, selectedId, expenseData, reset, isEdit, mills, isServiceEngineer]);

  React.useEffect(() => {
    if (!isFormDrawerOpen || !isEdit || !expenseData || selectedCustomerId) return;
    const mill = mills.find((m) => m.id === expenseData.mill_id);
    if (mill?.customer_id) {
      setSelectedCustomerId(mill.customer_id);
    }
  }, [isFormDrawerOpen, isEdit, expenseData, mills, selectedCustomerId]);

  const handleItemImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Upload files to S3 in parallel
    const uploadResults = await Promise.all(
      fileArray.map((file) => uploadFile(file))
    );

    const successfulKeys = uploadResults.filter(Boolean).map(result => result!.key);

    if (successfulKeys.length > 0) {
      const currentItems = watch('expense_items') || [];
      const updated = [...currentItems];
      updated[index].expense_images = [
        ...(updated[index].expense_images || []),
        ...successfulKeys,
      ];
      setValue('expense_items', updated, { shouldValidate: true });
    }

    // Reset file input
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleRemoveItemImage = (itemIndex: number, imageIndex: number) => {
    const currentItems = watch('expense_items') || [];
    const updated = [...currentItems];
    updated[itemIndex].expense_images = updated[itemIndex].expense_images.filter((_, idx) => idx !== imageIndex);
    setValue('expense_items', updated, { shouldValidate: true });
  };

  const handleUpdateStatusAlone = async (statusToApply?: string) => {
    const statusVal = statusToApply || selectedStatus;
    if (!selectedId || !statusVal) return;
    try {
      setIsUpdatingStatusAlone(true);
      await updateExpense({ id: selectedId, status: statusVal });
      setSelectedStatus(statusVal);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdatingStatusAlone(false);
    }
  };

  const onSubmit: SubmitHandler<ExpenseFormValues> = async (data) => {
    try {
      const payload: any = {
        ...data,
        mill_id: data.expense_type === 'MILL' ? (data.mill_id || null) : null,
        place: data.place || null,
        others: data.others || null,
        visit_time: data.visit_time || undefined,
        service_report_id: data.service_report_id || null,
        installation_report_id: data.installation_report_id || null,
        expense_items: data.expense_items.map((item) => ({
          ...item,
          amount: Number(item.amount || 0),
        })),
      };

      if (isEdit) {
        payload.status = selectedStatus;
        await updateExpense({ id: selectedId, ...payload });
      } else {
        await createExpense(payload);
      }
      closeFormDrawer();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  const isLoading = isEdit && expenseLoading;
  const isSubmitting = isCreating || isUpdating || isUploading;

  const scrollToFirstError = (errors: any) => {
    const fieldLabelMap: Record<string, string> = {
      technician_ids: 'Service Engineers',
      mill_id: 'Mill Name',
      place: 'Place',
      others: 'Others',
      visit_date: 'Date',
      visit_time: 'Time',
      expense_items: 'Expense Categories & Details',
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

    setTimeout(() => {
      const firstError = formRef.current?.querySelector('[data-error="true"]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  return (
    <Sheet open={isFormDrawerOpen} onOpenChange={(open) => !open && closeFormDrawer()}>
      <SheetContent side="right">
        <SheetHeader className="px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-gray-900 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <DollarSign size={24} />
            </div>
            <div>
              <SheetTitle className="text-xl">
                {isEdit ? 'Edit Expense Report' : 'New Expense Report'}
              </SheetTitle>
              <SheetDescription>
                {isEdit ? 'Update expense registration details.' : 'Fill details below to log new expense.'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div ref={sheetRef} className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide pb-24">
          {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (            <form id="expense-report-form" ref={formRef} onSubmit={handleSubmit(onSubmit, scrollToFirstError)} className="space-y-4">
              {/* Expense Status Management Card (Edit Mode) */}
              {isEdit && (
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-2xl p-3.5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-black text-primary uppercase tracking-widest">
                      <Shield size={14} className="text-primary/70" />
                      Status:
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {EXPENSE_STATUS_OPTIONS.map((opt) => {
                        const isSelected = selectedStatus === opt.value;
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setSelectedStatus(opt.value)}
                            className={cn(
                              "flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg border text-xs font-bold transition-all select-none cursor-pointer",
                              isSelected
                                ? opt.activeClasses
                                : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-100"
                            )}
                          >
                            <Icon size={12} className={isSelected ? "text-white" : opt.iconColor} />
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {selectedStatus !== expenseData?.status && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={isUpdatingStatusAlone || isSubmitting}
                      onClick={() => handleUpdateStatusAlone(selectedStatus)}
                      className="h-8 px-3 rounded-lg text-xs font-bold text-white bg-primary hover:bg-primary/90 shadow-sm shrink-0 flex items-center gap-1"
                    >
                      {isUpdatingStatusAlone ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 size={12} />}
                      Update Status
                    </Button>
                  )}
                </div>
              )}

              {/* SECTION 1: TRIP, ENGINEERS & LOCATION DETAILS (4-Column Layout) */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-2xl p-4 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-2.5">
                  <div className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={14} className="text-primary/70" />
                    1. Trip & Location Details
                  </div>
                </div>

                {/* Row 1 (4 Columns): Expense Type, Expense Date, Visit Time, Place */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-start">
                  {/* 1. Expense Type */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                      <Tag size={12} className="text-primary/70" />
                      Expense Type *
                    </Label>
                    <Controller
                      name="expense_type"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                            <SelectValue placeholder="Expense Type" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                            <SelectItem value="MILL" className="font-bold py-2.5">Mill / Machine Expense</SelectItem>
                            <SelectItem value="OTHERS" className="font-bold py-2.5">Others (Travel, Food, etc.)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* 2. Expense Date */}
                  <div className="space-y-1.5" data-error={errors.visit_date ? 'true' : undefined}>
                    <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                      <CalendarDays size={12} className="text-primary/70" />
                      Expense Date *
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

                  {/* 3. Visit Time */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                      <Clock size={12} className="text-primary/70" />
                      Time (Optional)
                    </Label>
                    <Controller
                      name="visit_time"
                      control={control}
                      render={({ field }) => (
                        <TimePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select time"
                        />
                      )}
                    />
                  </div>

                  {/* 4. Place / Location */}
                  <div className="space-y-1.5" data-error={errors.place ? 'true' : undefined}>
                    <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                      <MapPin size={12} className="text-primary/70" />
                      Place / Location {expenseType === 'OTHERS' ? '*' : '(Optional)'}
                    </Label>
                    <Input
                      {...register('place')}
                      placeholder="e.g. Coimbatore"
                      className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                    />
                    <FieldError message={errors.place?.message} />
                  </div>
                </div>

                {/* Row 2 (4 Columns): Service Engineers (2 cols) + Report Association (2 cols) */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3.5 items-start">
                  {/* Engineers (2 cols) */}
                  <div className="lg:col-span-2 space-y-1.5" data-error={errors.technician_ids ? 'true' : undefined}>
                    <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                      <Users size={12} className="text-primary/70" />
                      Select Service Engineers *
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

                  {/* Report Association (2 cols) */}
                  <div className="lg:col-span-2 space-y-1.5">
                    <div className="p-3 bg-orange-50/40 dark:bg-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                          <FileText size={12} className="text-orange-500" />
                          Report Association {isServiceEngineer ? '*' : '(Optional)'}
                        </Label>
                        <div className="flex items-center gap-1">
                          {!isServiceEngineer && (
                            <button
                              type="button"
                              onClick={() => {
                                setReportTypeRadio('none');
                                setValue('service_report_id', '');
                                setValue('installation_report_id', '');
                              }}
                              className={cn(
                                "px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer",
                                reportTypeRadio === 'none'
                                  ? "bg-orange-500 text-white"
                                  : "bg-white/80 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-white"
                              )}
                            >
                              None
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setReportTypeRadio('service');
                              setValue('service_report_id', '');
                              setValue('installation_report_id', '');
                            }}
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer",
                              reportTypeRadio === 'service'
                                ? "bg-orange-500 text-white"
                                : "bg-white/80 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-white"
                            )}
                          >
                            Service Report
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReportTypeRadio('installation');
                              setValue('service_report_id', '');
                              setValue('installation_report_id', '');
                            }}
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[11px] font-bold transition-all cursor-pointer",
                              reportTypeRadio === 'installation'
                                ? "bg-orange-500 text-white"
                                : "bg-white/80 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-white"
                            )}
                          >
                            Installation Report
                          </button>
                        </div>
                      </div>

                      {reportTypeRadio !== 'none' && (
                        <Select
                          value={
                            reportTypeRadio === 'service'
                              ? watch('service_report_id') || ''
                              : watch('installation_report_id') || ''
                          }
                          onValueChange={(val) => {
                            if (!val || val === 'no_reports') {
                              setValue('service_report_id', '');
                              setValue('installation_report_id', '');
                              return;
                            }
                            if (reportTypeRadio === 'service') {
                              setValue('service_report_id', val);
                              setValue('installation_report_id', '');
                              const report = eligibleReports.serviceReports.find((r) => r.id === val);
                              if (report) {
                                if (report.mill_id) {
                                  setValue('mill_id', report.mill_id);
                                  const mill = mills.find((m) => m.id === report.mill_id);
                                  if (mill?.customer_id) setSelectedCustomerId(mill.customer_id);
                                }
                                if (report.place) setValue('place', report.place);
                                if (report.visit_date) setValue('visit_date', report.visit_date.split('T')[0]);
                                toast.success('Service report details prefilled!');
                              }
                            } else {
                              setValue('service_report_id', '');
                              setValue('installation_report_id', val);
                              const report = eligibleReports.installationReports.find((r) => r.id === val);
                              if (report) {
                                if (report.mill_id) {
                                  setValue('mill_id', report.mill_id);
                                  const mill = mills.find((m) => m.id === report.mill_id);
                                  if (mill?.customer_id) setSelectedCustomerId(mill.customer_id);
                                }
                                if (report.place) setValue('place', report.place);
                                if (report.visit_date) setValue('visit_date', report.visit_date.split('T')[0]);
                                toast.success('Installation report details prefilled!');
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="h-9 bg-white dark:bg-gray-900 border-none rounded-lg focus:ring-2 focus:ring-primary/20 font-bold text-xs">
                            {reportTypeRadio === 'service' && watch('service_report_id') ? (
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                SR: {eligibleReports.serviceReports.find((r) => r.id === watch('service_report_id'))?.report_number ?? 'Service Report'}
                              </span>
                            ) : reportTypeRadio === 'installation' && watch('installation_report_id') ? (
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                IR: {eligibleReports.installationReports.find((r) => r.id === watch('installation_report_id'))?.report_number ?? 'Installation Report'}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-600 text-xs font-medium">
                                {reportTypeRadio === 'service' ? 'Select service report...' : 'Select installation report...'}
                              </span>
                            )}
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-56 overflow-y-auto">
                            {reportTypeRadio === 'service' ? (
                              eligibleReports.serviceReports.length > 0 ? (
                                eligibleReports.serviceReports.map((r) => (
                                  <SelectItem key={r.id} value={r.id} className="font-bold py-2">
                                    <span className="text-xs font-bold">SR: {r.report_number} ({r.mill_name})</span>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no_reports" disabled className="py-2 text-xs text-gray-400 font-bold">
                                  No unlinked service reports found
                                </SelectItem>
                              )
                            ) : (
                              eligibleReports.installationReports.length > 0 ? (
                                eligibleReports.installationReports.map((r) => (
                                  <SelectItem key={r.id} value={r.id} className="font-bold py-2">
                                    <span className="text-xs font-bold">IR: {r.report_number} ({r.mill_name})</span>
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no_reports" disabled className="py-2 text-xs text-gray-400 font-bold">
                                  No unlinked installation reports found
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <FieldError message={errors.service_report_id?.message || errors.installation_report_id?.message} />
                  </div>
                </div>

                {/* Row 3: If MILL mode, 4-Column Grid for Search Machine, Customer, Mill, Machine */}
                {expenseType === 'MILL' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-start">
                    {/* Column 1: Search Machine Prefill */}
                    <div className="space-y-1.5 relative">
                      <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                        <Cpu size={12} className="text-primary/70" />
                        Quick Prefill Search
                      </Label>
                      <Input
                        value={machineSearchQuery}
                        onChange={(e) => setMachineSearchQuery(e.target.value)}
                        placeholder="Search REF / Mill..."
                        className="h-10 bg-primary/5 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-xs"
                      />
                      {machineSearchQuery.trim().length >= 2 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-white/5 divide-y divide-gray-100 dark:divide-white/5 max-h-48 overflow-y-auto shadow-2xl z-30">
                          {searchMasterMillsLoading ? (
                            <div className="p-2.5 text-xs text-gray-400 font-bold flex items-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin text-primary" />
                              Searching...
                            </div>
                          ) : searchedMasterMills.length > 0 ? (
                            searchedMasterMills.map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  if (m.mill_id) {
                                    setValue('mill_id', m.mill_id);
                                    if (m.mill) setSelectedMillObj(m.mill);
                                    const millCustomerId = m.mill?.customer_id;
                                    if (millCustomerId) {
                                      setSelectedCustomerId(millCustomerId);
                                    } else {
                                      const localMill = mills.find(millItem => millItem.id === m.mill_id);
                                      setSelectedCustomerId(localMill?.customer_id || '');
                                    }
                                  }
                                  const placeToUse = m.place || m.mill?.place;
                                  if (placeToUse) setValue('place', placeToUse);
                                  setSelectedMachineId(m.id);
                                  setMachineSearchQuery('');
                                  toast.success('Machine details prefilled!');
                                }}
                                className="w-full text-left p-2.5 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors text-xs flex flex-col gap-0.5 cursor-pointer group"
                              >
                                <div className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors">
                                  {m.mill?.customer?.name ? `${m.mill.customer.name} — ` : ''}{m.mill?.name || 'Unknown Mill'}
                                </div>
                                <div className="text-[11px] text-gray-400 font-medium">
                                  {[m.ref_no ? `Ref: ${m.ref_no}` : null, m.mc_model ? `Model: ${m.mc_model}` : null, m.place ? `Place: ${m.place}` : null].filter(Boolean).join(' | ')}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-2.5 text-xs text-gray-400 font-bold flex flex-col gap-1.5">
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
                                className="text-left text-primary hover:underline flex items-center gap-1 cursor-pointer font-bold border-none bg-transparent p-0"
                              >
                                <PlusCircle size={11} />
                                Quick Register
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Column 2: Customer (Optional) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                          <Users size={12} className="text-primary/70" />
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
                          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <PlusCircle size={10} />
                          + Register
                        </button>
                      </div>
                      {customers.length > 0 ? (
                        <Select
                          onValueChange={(val) => {
                            setSelectedCustomerId(val === 'all_clear' ? '' : val || '');
                            setValue('mill_id', '');
                            setValue('place', '');
                          }}
                          value={selectedCustomerId || ''}
                          items={customers.map((c) => ({ value: c.id, label: c.name }))}
                        >
                          <SelectTrigger className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold text-xs">
                            {selectedCustomerId ? (
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                                {customers.find((c) => c.id === selectedCustomerId)?.name ?? 'Unknown'}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-600 text-xs font-medium">Select customer</span>
                            )}
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-56 overflow-y-auto">
                            <SelectItem value="all_clear" className="font-bold py-2 text-xs text-gray-400">Clear Customer Filter</SelectItem>
                            {customers.map((cust) => (
                              <SelectItem key={cust.id} value={cust.id} className="font-bold py-2 text-xs">
                                {cust.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Skeleton className="h-10 rounded-xl w-full" />
                      )}
                    </div>

                    {/* Column 3: Mill Name * */}
                    <div className="space-y-1.5" data-error={errors.mill_id ? 'true' : undefined}>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                          <Building2 size={12} className="text-primary/70" />
                          Mill Name *
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
                            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <PlusCircle size={10} />
                            + Add Mill
                          </button>
                        )}
                      </div>
                      {mills.length > 0 ? (
                        <Select
                          onValueChange={(val) => {
                            setValue('mill_id', val || '');
                            setValue('place', '');
                          }}
                          value={watch('mill_id') || ''}
                          items={filteredMills.map(m => ({ value: m.id, label: m.name }))}
                        >
                          <SelectTrigger className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold text-xs">
                            {watch('mill_id') ? (
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                                {mills.find((m) => m.id === watch('mill_id'))?.name ?? (selectedMillObj?.id === watch('mill_id') ? selectedMillObj?.name : null) ?? 'Unknown Mill'}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-600 text-xs font-medium">
                                Select mill
                              </span>
                            )}
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-56">
                            {filteredMills.length > 0 ? (
                              filteredMills.map((mill) => (
                                <SelectItem key={mill.id} value={mill.id} className="font-bold py-2 text-xs">
                                  {mill.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no_mills" disabled className="py-2 text-xs text-gray-400 font-bold">
                                No mills found
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Skeleton className="h-10 rounded-xl w-full" />
                      )}
                      <FieldError message={errors.mill_id?.message} />
                    </div>

                    {/* Column 4: Select Machine (REF / Frame No) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                          <Cpu size={12} className="text-primary/70" />
                          Machine Record
                        </Label>
                        {selectedMillId && (
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
                            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <PlusCircle size={10} />
                            + Machine
                          </button>
                        )}
                      </div>
                      {masterMillsLoading ? (
                        <Skeleton className="h-10 rounded-xl w-full" />
                      ) : (
                        <Select
                          value={selectedMachineId || ''}
                          onValueChange={(val) => {
                            if (val === 'clear') {
                              setSelectedMachineId('');
                              return;
                            }
                            const m = masterMills.find((rec) => rec.id === val);
                            if (m) {
                              const placeToUse = m.place || m.mill?.place;
                              if (placeToUse) setValue('place', placeToUse);
                              setSelectedMachineId(m.id);
                              toast.success('Machine details prefilled!');
                            }
                          }}
                        >
                          <SelectTrigger className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold text-xs">
                            {selectedMachineId ? (
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                                {(() => {
                                  const m = masterMills.find((rec) => rec.id === selectedMachineId);
                                  if (!m) return 'Unknown Machine';
                                  const displayRef = m.ref_no || m.mill?.ref_no;
                                  const parts = [
                                    displayRef ? `Ref: ${displayRef}` : null,
                                    m.frame_no ? `Frame: ${m.frame_no}` : null,
                                    m.mc_model ? `Model: ${m.mc_model}` : null,
                                  ].filter(Boolean);
                                  return parts.join(' | ') || 'Machine Record';
                                })()}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-600 text-xs font-medium">
                                {selectedMillId ? 'Select machine...' : 'Select mill first'}
                              </span>
                            )}
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-56">
                            <SelectItem value="clear" className="font-bold py-2 text-xs text-gray-400">
                              Clear Selection
                            </SelectItem>
                            {masterMills.map((m, idx) => {
                              const displayRef = m.ref_no || m.mill?.ref_no;
                              const parts = [
                                displayRef ? `Ref: ${displayRef}` : null,
                                m.frame_no ? `Frame: ${m.frame_no}` : null,
                                m.mc_model ? `Model: ${m.mc_model}` : null,
                              ].filter(Boolean);
                              const label = parts.join(' | ') || `Machine Record ${idx + 1}`;
                              return (
                                <SelectItem key={m.id} value={m.id} className="font-bold py-2 text-xs">
                                  {label}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                ) : (
                  /* OTHERS mode - Full Width Remarks */
                  <div className="space-y-1.5" data-error={errors.others ? 'true' : undefined}>
                    <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                      <Tag size={12} className="text-primary/70" />
                      Others Description / Purpose
                    </Label>
                    <Input
                      {...register('others')}
                      placeholder="e.g. Supplier visit, hotel stay description, local conveyance, etc."
                      className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-xs"
                    />
                    <FieldError message={errors.others?.message} />
                  </div>
                )}
              </div>

              {/* SECTION 2: ITEMIZED EXPENSE CATEGORIES & RECEIPTS (Compact Single-Page Table Grid) */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-2xl p-4 shadow-sm space-y-3" data-error={errors.expense_items ? 'true' : undefined}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                      <Tag size={14} className="text-primary/70" />
                      2. Expense Categories & Receipts
                    </div>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[11px] font-extrabold">
                      {(watch('expense_items') || []).length} items
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs font-black text-gray-800 dark:text-gray-200">
                      Total: <span className="text-primary font-black">₹{((watch('expense_items') || []).reduce((acc, it) => acc + (Number(it.amount) || 0), 0)).toLocaleString('en-IN')}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const current = watch('expense_items') || [];
                        setValue('expense_items', [
                          ...current,
                          { expense_category_id: '', amount: 0, admin_amount: 0, remarks: '', admin_remarks: '', expense_images: [] },
                        ], { shouldValidate: false });
                      }}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-primary/5 hover:bg-primary/10 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <PlusCircle size={12} />
                      Add Category
                    </button>
                  </div>
                </div>

                {/* Array validation error */}
                {typeof errors.expense_items?.message === 'string' && (
                  <FieldError message={errors.expense_items.message} />
                )}

                {/* Empty State */}
                {(watch('expense_items') || []).length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl text-gray-400">
                    <Tag size={24} className="opacity-30" />
                    <p className="text-xs font-bold">No expense categories added yet</p>
                    <button
                      type="button"
                      onClick={() =>
                        setValue('expense_items', [
                          { expense_category_id: '', amount: 0, admin_amount: 0, remarks: '', admin_remarks: '', expense_images: [] },
                        ], { shouldValidate: false })
                      }
                      className="flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      <PlusCircle size={12} />
                      Add First Category
                    </button>
                  </div>
                )}

                {/* Compact Itemized List */}
                <div className="space-y-2.5">
                  <AnimatePresence>
                    {(watch('expense_items') || []).map((item, index) => {
                      const itemErrors = (errors.expense_items as any)?.[index];
                      const selectedElsewhere = (watch('expense_items') || [])
                        .filter((_, i) => i !== index)
                        .map((it) => it.expense_category_id)
                        .filter(Boolean);
                      const availableCategories = categories.filter(
                        (c) => !selectedElsewhere.includes(c.id)
                      );
                      const chosenCat = categories.find((c) => c.id === item.expense_category_id);

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15 }}
                          className="border border-gray-100 dark:border-white/5 rounded-xl p-3 bg-gray-50/40 dark:bg-gray-950/40 hover:border-primary/20 transition-all space-y-2.5"
                        >
                          {/* Row 1 (4-Column Layout): Category (4 cols), Amount (2 cols), Remarks (5 cols), Action/Delete (1 col) */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-start">
                            {/* Category Select - 4 cols */}
                            <div className="md:col-span-4 space-y-1">
                              <Label className="text-[11px] font-black text-primary uppercase tracking-wider flex items-center gap-1">
                                <Tag size={11} className="text-primary/70" />
                                Category *
                              </Label>
                              <Select
                                value={item.expense_category_id || ''}
                                onValueChange={(val) => {
                                  const updated = [...(watch('expense_items') || [])];
                                  updated[index] = { ...updated[index], expense_category_id: val ?? '' };
                                  setValue('expense_items', updated, { shouldValidate: true });
                                }}
                              >
                                <SelectTrigger className="h-9 bg-white dark:bg-gray-900 border-none rounded-lg focus:ring-2 focus:ring-primary/20 font-bold text-xs">
                                  {chosenCat ? (
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                                      <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[9px] shrink-0">
                                        {chosenCat.name.charAt(0).toUpperCase()}
                                      </div>
                                      {chosenCat.name}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400 dark:text-gray-600 text-xs font-medium">
                                      {categoriesLoading ? 'Loading…' : 'Select category…'}
                                    </span>
                                  )}
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-56 overflow-y-auto">
                                  {availableCategories.map((c) => (
                                    <SelectItem key={c.id} value={c.id} className="font-bold py-2 text-xs">
                                      {c.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FieldError message={itemErrors?.expense_category_id?.message} />
                            </div>

                            {/* Amount - 2 cols */}
                            <div className="md:col-span-2 space-y-1">
                              <Label className="text-[11px] font-black text-primary uppercase tracking-wider flex items-center gap-1">
                                <DollarSign size={11} className="text-primary/70" />
                                Amount (₹) *
                              </Label>
                              <Input
                                type="number"
                                step="1"
                                value={item.amount || ''}
                                onChange={(e) => {
                                  if (isEdit) return;
                                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                                  const updated = [...(watch('expense_items') || [])];
                                  updated[index].amount = val;
                                  setValue('expense_items', updated, { shouldValidate: true });
                                }}
                                placeholder="0"
                                readOnly={isEdit}
                                className={cn(
                                  "h-9 bg-white dark:bg-gray-900 border-none rounded-lg font-bold text-xs",
                                  isEdit ? "cursor-default opacity-70 select-none focus-visible:ring-0" : "focus-visible:ring-2 focus-visible:ring-primary/20"
                                )}
                              />
                              <FieldError message={itemErrors?.amount?.message} />
                            </div>

                            {/* Remarks - 5 cols */}
                            <div className="md:col-span-5 space-y-1">
                              <Label className="text-[11px] font-black text-primary uppercase tracking-wider flex items-center gap-1">
                                <FileText size={11} className="text-primary/70" />
                                Remarks
                              </Label>
                              <Input
                                value={item.remarks || ''}
                                onChange={(e) => {
                                  if (isEdit) return;
                                  const updated = [...(watch('expense_items') || [])];
                                  updated[index].remarks = e.target.value;
                                  setValue('expense_items', updated, { shouldValidate: true });
                                }}
                                placeholder="Remarks / notes…"
                                readOnly={isEdit}
                                className={cn(
                                  "h-9 bg-white dark:bg-gray-900 border-none rounded-lg font-bold text-xs",
                                  isEdit ? "cursor-default opacity-70 select-none focus-visible:ring-0" : "focus-visible:ring-2 focus-visible:ring-primary/20"
                                )}
                              />
                            </div>

                            {/* Delete Button - 1 col */}
                            <div className="md:col-span-1 flex justify-end md:justify-center pt-1 md:pt-5">
                              <button
                                type="button"
                                title="Remove this category"
                                onClick={() => {
                                  const current = watch('expense_items') || [];
                                  setValue('expense_items', current.filter((_, i) => i !== index), { shouldValidate: true });
                                }}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                              >
                                <X size={15} />
                              </button>
                            </div>
                          </div>

                          {/* Row 2: Compact Receipts Strip & Admin Details */}
                          <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            {/* Receipts Thumbnail Strip */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <ImageIcon size={11} /> Receipts:
                              </span>
                              {(item.expense_images || []).map((img, imgIdx) => {
                                const src = img.startsWith('http') || img.startsWith('data:')
                                  ? img
                                  : `https://webnox.blr1.digitaloceanspaces.com/${img.split('/').map(encodeURIComponent).join('/')}`;
                                return (
                                  <div key={imgIdx} className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-200 dark:border-white/10 group">
                                    <img src={src} alt={`Receipt ${imgIdx}`} className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItemImage(index, imgIdx)}
                                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                );
                              })}

                              <label className={cn(
                                'h-8 px-2.5 border border-dashed border-gray-300 dark:border-white/20 rounded-lg hover:border-primary text-gray-500 hover:text-primary transition-colors flex items-center gap-1.5 bg-white dark:bg-gray-900 text-[11px] font-bold cursor-pointer',
                                isUploading && activeUploadIndex === index && 'pointer-events-none opacity-60'
                              )}>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => {
                                    setActiveUploadIndex(index);
                                    handleItemImageUpload(index, e);
                                  }}
                                />
                                {isUploading && activeUploadIndex === index ? (
                                  <div className="flex items-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                                    <span>{uploadProgress}%</span>
                                  </div>
                                ) : (
                                  <>
                                    <UploadCloud size={13} />
                                    <span>+ Receipt</span>
                                  </>
                                )}
                              </label>
                            </div>

                            {/* Admin Adjustments (if admin role) */}
                            {!isServiceEngineer && (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Admin ₹:</span>
                                  <Input
                                    type="number"
                                    step="1"
                                    value={item.admin_amount || ''}
                                    onChange={(e) => {
                                      const val = e.target.value === '' ? 0 : Number(e.target.value);
                                      const updated = [...(watch('expense_items') || [])];
                                      updated[index].admin_amount = val;
                                      setValue('expense_items', updated, { shouldValidate: true });
                                    }}
                                    placeholder="0"
                                    className="h-7 w-20 bg-white dark:bg-gray-900 border-none rounded-md font-bold text-xs"
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Note:</span>
                                  <Input
                                    value={item.admin_remarks || ''}
                                    onChange={(e) => {
                                      const updated = [...(watch('expense_items') || [])];
                                      updated[index].admin_remarks = e.target.value;
                                      setValue('expense_items', updated, { shouldValidate: true });
                                    }}
                                    placeholder="Admin note…"
                                    className="h-7 w-32 bg-white dark:bg-gray-900 border-none rounded-md font-bold text-xs"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </form>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-gray-900 z-10">
          <div className="flex flex-col gap-3 w-full">
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={closeFormDrawer}
                className="flex-1 h-11 rounded-xl text-sm font-semibold border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="expense-report-form"
                disabled={isSubmitting || isUpdatingStatusAlone}
                className="flex-1 h-11 rounded-xl text-sm font-bold bg-primary hover:bg-primary/95 text-white shadow-lg shadow-primary/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {isEdit ? 'Save Changes' : 'Create Expense'}
                  </>
                )}
              </Button>
            </div>
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

                    if (createdMasterMillId) {
                      setSelectedMachineId(createdMasterMillId);
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
          <DialogContent className="sm:max-w-[480px] bg-white dark:bg-gray-955 rounded-2xl border border-gray-100 dark:border-white/5">
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
                      status: 'ACTIVE',
                    });

                    // Automatically prefill the form
                    setSelectedMachineId(newRecord.id);
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
