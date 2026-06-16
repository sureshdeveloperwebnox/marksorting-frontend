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
} from 'lucide-react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateExpense, useUpdateExpense, useExpense } from '@/services/expense-service';
import { useExpenseCategories } from '@/services/expense-category-service';
import { useMills, useCreateMill } from '@/services/mill-service';
import { useCustomers, useCreateCustomer } from '@/services/customer-service';
import { useMasterMills, useCreateMasterMill } from '@/services/master-mill-service';
import useExpenseStore from '@/store/useExpenseStore';
import { TechnicianMultiSelect } from '@/components/ui/technician-multi-select';
import { ExpenseCategoryMultiSelect } from '@/components/ui/expense-category-multi-select';
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

const expenseSchema = z.object({
  technician_ids: z.array(z.string()).min(1, 'At least one engineer is required'),
  mill_id: z.string().optional().or(z.literal('')),
  place: z.string().optional().or(z.literal('')),
  others: z.string().optional().or(z.literal('')),
  visit_date: z.string().min(1, 'Date is required'),
  visit_time: z.string().optional(),
  expense_items: z.array(z.object({
    expense_category_id: z.string().min(1, 'Category is required'),
    amount: z.preprocess((val) => val === '' || val === null || val === undefined ? 0 : Number(val), z.number().min(0, 'Amount must be positive')),
    admin_amount: z.preprocess((val) => val === '' || val === null || val === undefined ? 0 : Number(val), z.number().min(0, 'Admin amount must be positive')),
    remarks: z.string().optional().or(z.literal('')),
    expense_images: z.array(z.string()).default([]),
  })).min(1, 'At least one category is required'),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const sections = [
  { id: 1, title: 'Engineer & Mill Details', icon: Users },
  { id: 2, title: 'Alternative / Other Details', icon: MapPin },
  { id: 3, title: 'Date & Time', icon: CalendarDays },
  { id: 4, title: 'Expense Info & Images', icon: DollarSign },
];

type ExpenseSection = (typeof sections)[number];

function SectionToggle({
  section,
  isOpen,
  onToggle,
  children,
}: {
  section: ExpenseSection;
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

export function ExpenseFormDrawer() {
  const { isFormDrawerOpen, closeFormDrawer, selectedId } = useExpenseStore();
  const isEdit = !!selectedId;

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

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      technician_ids: [],
      mill_id: '',
      place: '',
      others: '',
      visit_date: '',
      visit_time: '',
      expense_items: [],
    },
  });

  const selectedMillId = watch('mill_id');

  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>('');
  const [selectedMachineId, setSelectedMachineId] = React.useState<string>('');
  const [openSections, setOpenSections] = React.useState<Record<number, boolean>>({ 1: true });
  const [activeUploadIndex, setActiveUploadIndex] = React.useState<number | null>(null);
  
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

  const toggleSection = (id: number) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };


  const filteredMills = React.useMemo(() => {
    if (!selectedCustomerId) {
      return mills.filter((m) => m.id === selectedMillId);
    }
    return mills.filter((m) => m.customer_id === selectedCustomerId || m.id === selectedMillId);
  }, [mills, selectedCustomerId, selectedMillId]);

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
      return;
    }

    const formKey = isEdit ? `edit:${selectedId}:${expenseData?.id ?? 'loading'}` : 'new';
    if (initializedFormKeyRef.current === formKey) return;
    if (isEdit && !expenseData) return;

    initializedFormKeyRef.current = formKey;
    setOpenSections({ 1: true, 2: false, 3: false, 4: true });

    if (isFormDrawerOpen) {
      if (isEdit && expenseData) {
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
              expense_images: item.expense_images || [],
            }))
          : expenseData.expense_category_id
          ? [
              {
                expense_category_id: expenseData.expense_category_id,
                amount: expenseData.amount ? Number(expenseData.amount) : 0,
                admin_amount: expenseData.admin_amount ? Number(expenseData.admin_amount) : 0,
                remarks: expenseData.remarks || '',
                expense_images: expenseData.expense_images || [],
              },
            ]
          : [];

        reset({
          technician_ids: expenseData.technicians?.map((t: any) => t.technician.id) || [],
          mill_id: expenseData.mill_id || '',
          place: expenseData.place || '',
          others: expenseData.others || '',
          visit_date: expenseData.visit_date?.split('T')[0] || '',
          visit_time: expenseData.visit_time || '',
          expense_items: itemsToReset,
        });
      } else if (!isEdit) {
        setSelectedCustomerId('');
        setSelectedMachineId('');
        reset({
          technician_ids: [],
          mill_id: '',
          place: '',
          others: '',
          visit_date: '',
          visit_time: '',
          expense_items: [],
        });
      }
    }
  }, [isFormDrawerOpen, selectedId, expenseData, reset, isEdit, mills]);

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

  const onSubmit: SubmitHandler<ExpenseFormValues> = async (data) => {
    try {
      const payload = {
        ...data,
        mill_id: data.mill_id || null,
        place: data.place || null,
        others: data.others || null,
        visit_time: data.visit_time || undefined,
        expense_items: data.expense_items.map((item) => ({
          ...item,
          amount: Number(item.amount || 0),
        })),
      };

      if (isEdit) {
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

  const fieldToSectionMap: Record<string, number> = {
    technician_ids: 1,
    mill_id: 1,
    place: 2,
    others: 2,
    visit_date: 3,
    visit_time: 3,
    expense_items: 4,
  };

  const scrollToFirstError = (errors: any) => {
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
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col h-full bg-gray-50 dark:bg-gray-950 border-l border-gray-100 dark:border-white/5"
      >
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
          ) : (
            <form id="expense-report-form" ref={formRef} onSubmit={handleSubmit(onSubmit, scrollToFirstError)} className="space-y-4">
              {/* Section 1 - Engineer & Mill Details */}
              <SectionToggle section={sections[0]} isOpen={!!openSections[1]} onToggle={toggleSection}>
                <div className="space-y-4">
                  {/* Select Service Engineers */}
                  <div className="space-y-2" data-error={errors.technician_ids ? 'true' : undefined}>
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Users size={14} className="text-primary/70" />
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

                  {/* Search Machine by Ref No / Frame No directly */}
                  <div className="space-y-2 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Cpu size={14} className="text-primary/70" />
                      Search Machine to Prefill (REF NO / Frame No)
                    </Label>
                    <Input
                      value={machineSearchQuery}
                      onChange={(e) => setMachineSearchQuery(e.target.value)}
                      placeholder="Type REF NO or Frame No to search..."
                      className="h-11 bg-white dark:bg-gray-900 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
                    />
                    
                    {/* Search Results List */}
                    {machineSearchQuery.trim().length >= 2 && (
                      <div className="mt-2 bg-white dark:bg-gray-950 rounded-xl border border-gray-100 dark:border-white/5 divide-y divide-gray-100 dark:divide-white/5 max-h-48 overflow-y-auto shadow-lg z-20 relative">
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
                                // Prefill place: master mill place → mill place fallback
                                const placeToUse = m.place || m.mill?.place;
                                if (placeToUse) {
                                  setValue('place', placeToUse);
                                }
                                setSelectedMachineId(m.id);
                                setMachineSearchQuery('');
                                toast.success('Machine details prefilled! Verify and adjust as needed.');
                              }}
                              className="w-full text-left p-3 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors text-xs flex flex-col gap-1 cursor-pointer group"
                            >
                              <div className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors">
                                {m.mill?.name || 'Unknown Mill'}
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
                        Customer (Optional)
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

                  {/* Mill Name */}
                  <div className="space-y-2" data-error={errors.mill_id ? 'true' : undefined}>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                        <Building2 size={14} className="text-primary/70" />
                        Select Mill (Optional)
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
                        }}
                        value={watch('mill_id') || ''}
                        items={filteredMills.map(m => ({ value: m.id, label: m.name }))}
                      >
                        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                          {watch('mill_id') ? (
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                              {mills.find((m) => m.id === watch('mill_id'))?.name ?? 'Unknown Mill'}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600 text-sm font-medium">
                              {selectedCustomerId ? 'Select mill' : 'Select a customer first (Optional)'}
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

                  {/* Machine / Installation Record Dropdown */}
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
                              return;
                            }
                            const m = masterMills.find((rec) => rec.id === val);
                            if (m) {
                              const placeToUse = m.place || m.mill?.place;
                              if (placeToUse) setValue('place', placeToUse);
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
                </div>
              </SectionToggle>

              {/* Section 2 - Alternative / Other Details */}
              <SectionToggle section={sections[1]} isOpen={!!openSections[2]} onToggle={toggleSection}>
                <div className="space-y-4">
                  {/* Others */}
                  <div className="space-y-2" data-error={errors.others ? 'true' : undefined}>
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Tag size={14} className="text-primary/70" />
                      Others
                    </Label>
                    <Input
                      {...register('others')}
                      placeholder="e.g. Supplier Name or Hotel Description"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                    />
                    <FieldError message={errors.others?.message} />
                  </div>

                  {/* Place */}
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
                </div>
              </SectionToggle>

              {/* Section 3 - Date */}
              <SectionToggle section={{ ...sections[2], title: 'Date' }} isOpen={!!openSections[3]} onToggle={toggleSection}>
                <div className="space-y-2" data-error={errors.visit_date ? 'true' : undefined}>
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <CalendarDays size={14} className="text-primary/70" />
                    Date *
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
              </SectionToggle>

              {/* Section 4 - Expense Info & Images */}
              <SectionToggle section={sections[3]} isOpen={!!openSections[4]} onToggle={toggleSection}>
                <div className="space-y-4">
                  {/* Select Expense Categories Multi-Select */}
                  <div className="space-y-2" data-error={errors.expense_items ? 'true' : undefined}>
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Tag size={14} className="text-primary/70" />
                      Select Expense Categories *
                    </Label>
                    <Controller
                      name="expense_items"
                      control={control}
                      render={({ field }) => (
                        <ExpenseCategoryMultiSelect
                          value={field.value?.map((it) => it.expense_category_id) || []}
                          onChange={(newIds) => {
                            const currentItems = field.value || [];
                            const updatedItems = newIds.map((id) => {
                              const existing = currentItems.find((item) => item.expense_category_id === id);
                              if (existing) return existing;
                              return {
                                expense_category_id: id,
                                amount: 0,
                                admin_amount: 0,
                                remarks: '',
                                expense_images: [],
                              };
                            });
                            field.onChange(updatedItems);
                          }}
                          placeholder="Select categories..."
                        />
                      )}
                    />
                    <FieldError message={errors.expense_items?.message} />
                  </div>

                  {/* Render Fields for each selected category */}
                  <AnimatePresence>
                    {(watch('expense_items') || []).map((item, index) => {
                      const cat = categories.find((c) => c.id === item.expense_category_id);
                      return (
                        <motion.div
                          key={item.expense_category_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="border border-gray-100 dark:border-white/5 rounded-2xl p-4 space-y-4 bg-gray-50/20 dark:bg-white/[0.01]"
                        >
                          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-2">
                            <span className="font-bold text-sm text-primary flex items-center gap-2">
                              <Tag size={14} />
                              {cat?.name || 'Category'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const current = watch('expense_items') || [];
                                setValue('expense_items', current.filter((_, i) => i !== index), { shouldValidate: true });
                              }}
                              className="text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                            >
                              <X size={16} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                                <DollarSign size={14} className="text-primary/70" />
                                Amount (₹) *
                              </Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.amount || ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                                  const updated = [...(watch('expense_items') || [])];
                                  updated[index].amount = val;
                                  setValue('expense_items', updated, { shouldValidate: true });
                                }}
                                placeholder="Enter amount"
                                className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                                <FileText size={14} className="text-primary/70" />
                                Remarks
                              </Label>
                              <textarea
                                value={item.remarks || ''}
                                onChange={(e) => {
                                  const updated = [...(watch('expense_items') || [])];
                                  updated[index].remarks = e.target.value;
                                  setValue('expense_items', updated, { shouldValidate: true });
                                }}
                                placeholder="Enter remarks..."
                                rows={1}
                                className="w-full min-h-[44px] p-3 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm outline-none resize-none focus-visible:ring-2 focus-visible:ring-primary/20"
                              />
                            </div>
                          </div>

                          {/* Item Image Upload & Admin Expense Amount Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                            {/* Receipt Images */}
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                                <ImageIcon size={14} className="text-primary/70" />
                                Receipt Images
                              </Label>
                              
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {(item.expense_images || []).map((img, imgIdx) => {
                                  const src = img.startsWith('http') || img.startsWith('data:') ? img : `https://webnox.blr1.digitaloceanspaces.com/${img.split('/').map(encodeURIComponent).join('/')}`;
                                  return (
                                    <div key={imgIdx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-white/10 group">
                                      <img
                                        src={src}
                                        alt={`Receipt ${imgIdx}`}
                                        className="w-full h-full object-cover"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveItemImage(index, imgIdx)}
                                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  );
                                })}

                                <label className={cn(
                                  "relative aspect-square border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 bg-gray-50/50 dark:bg-white/5 text-gray-500 hover:text-primary cursor-pointer",
                                  isUploading && activeUploadIndex === index && "pointer-events-none opacity-60"
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
                                    <div className="flex flex-col items-center gap-1.5">
                                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                      <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{uploadProgress}%</span>
                                    </div>
                                  ) : (
                                    <>
                                      <UploadCloud size={20} />
                                      <span className="text-[10px] font-bold">Add Receipt</span>
                                    </>
                                  )}
                                </label>
                              </div>
                            </div>

                            {/* Admin Expense Amount */}
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                                <DollarSign size={14} className="text-primary/70" />
                                Admin Expense Amount (₹)
                              </Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.admin_amount || ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 0 : Number(e.target.value);
                                  const updated = [...(watch('expense_items') || [])];
                                  updated[index].admin_amount = val;
                                  setValue('expense_items', updated, { shouldValidate: true });
                                }}
                                placeholder="Enter admin expense amount"
                                className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </SectionToggle>
            </form>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-gray-900 z-10">
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
              disabled={isSubmitting}
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
                  onChange={(e) => setQuickCustomerName(e.target.value)}
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
                  onChange={(e) => setQuickMillName(e.target.value)}
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
