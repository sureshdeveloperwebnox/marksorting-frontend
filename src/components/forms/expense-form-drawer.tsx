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
} from 'lucide-react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateExpense, useUpdateExpense, useExpense } from '@/services/expense-service';
import { useExpenseCategories } from '@/services/expense-category-service';
import { useMills } from '@/services/mill-service';
import { useCustomers } from '@/services/customer-service';
import useExpenseStore from '@/store/useExpenseStore';
import { TechnicianMultiSelect } from '@/components/ui/technician-multi-select';
import { useS3Upload } from '@/hooks/use-s3-upload';
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

const expenseSchema = z.object({
  technician_ids: z.array(z.string()).min(1, 'At least one engineer is required'),
  mill_id: z.string().optional().or(z.literal('')),
  place: z.string().optional().or(z.literal('')),
  others: z.string().optional().or(z.literal('')),
  visit_date: z.string().min(1, 'Date is required'),
  visit_time: z.string().optional(),
  expense_category_id: z.string().min(1, 'Expense category is required'),
  amount: z.preprocess((val) => val === '' || val === null || val === undefined ? undefined : Number(val), z.number().min(0, 'Amount must be positive').optional()),
  expense_images: z.array(z.string()).default([]),
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


  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>('');
  const [openSections, setOpenSections] = React.useState<Record<number, boolean>>({ 1: true });
  const [imagePreviews, setImagePreviews] = React.useState<string[]>([]);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
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
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      technician_ids: [],
      mill_id: '',
      place: '',
      others: '',
      visit_date: '',
      visit_time: '',
      expense_category_id: '',
      amount: undefined,
      expense_images: [],
    },
  });

  const selectedMillId = watch('mill_id');
  const uploadedImages = watch('expense_images') || [];

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

  React.useEffect(() => {
    if (!isFormDrawerOpen) {
      initializedFormKeyRef.current = null;
      if (selectedCustomerId !== '') {
        setSelectedCustomerId('');
      }
      if (imagePreviews.length > 0) {
        setImagePreviews([]);
      }
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
        reset({
          technician_ids: expenseData.technicians?.map((t: any) => t.technician.id) || [],
          mill_id: expenseData.mill_id || '',
          place: expenseData.place || '',
          others: expenseData.others || '',
          visit_date: expenseData.visit_date?.split('T')[0] || '',
          visit_time: expenseData.visit_time || '',
          expense_category_id: expenseData.expense_category_id || '',
          amount: expenseData.amount ? Number(expenseData.amount) : undefined,
          expense_images: expenseData.expense_images || [],
        });
        // Previews from existing images
        const newPreviews = expenseData.expense_images?.map((img: string) =>
          img.startsWith('http') ? img : `https://webnox.blr1.digitaloceanspaces.com/${img.split('/').map(encodeURIComponent).join('/')}`
        ) || [];
        setImagePreviews(newPreviews);
      } else if (!isEdit) {
        if (selectedCustomerId !== '') {
          setSelectedCustomerId('');
        }
        if (imagePreviews.length > 0) {
          setImagePreviews([]);
        }
        reset({
          technician_ids: [],
          mill_id: '',
          place: '',
          others: '',
          visit_date: '',
          visit_time: '',
          expense_category_id: '',
          amount: undefined,
          expense_images: [],
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Create local previews immediately for all files
    const previewPromises = fileArray.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const preview = reader.result as string;
          setImagePreviews((prev) => [...prev, preview]);
          resolve(preview);
        };
        reader.readAsDataURL(file);
      });
    });

    const previews = await Promise.all(previewPromises);

    // Upload files to S3 in parallel
    const uploadResults = await Promise.all(
      fileArray.map((file) => uploadFile(file))
    );

    // Process results and update form values
    const successfulKeys: string[] = [];
    const failedIndices: number[] = [];

    uploadResults.forEach((result, index) => {
      if (result) {
        successfulKeys.push(result.key);
      } else {
        failedIndices.push(index);
      }
    });

    // Add successful uploads to form
    if (successfulKeys.length > 0) {
      const currentImages = watch('expense_images') || [];
      setValue('expense_images', [...currentImages, ...successfulKeys]);
    }

    // Remove failed upload previews
    if (failedIndices.length > 0) {
      setImagePreviews((prev) =>
        prev.filter((_, i) => !failedIndices.includes(i))
      );
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = watch('expense_images') || [];
    setValue('expense_images', currentImages.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit: SubmitHandler<ExpenseFormValues> = async (data) => {
    try {
      const payload = {
        ...data,
        amount: data.amount ? Number(data.amount) : 0,
        mill_id: data.mill_id || null,
        place: data.place || null,
        others: data.others || null,
        visit_time: data.visit_time || undefined,
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
    expense_category_id: 4,
    amount: 4,
    expense_images: 4,
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

                  {/* Customer Dropdown */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Users size={14} className="text-primary/70" />
                      Customer (Optional)
                    </Label>
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
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Building2 size={14} className="text-primary/70" />
                      Select Mill (Optional)
                    </Label>
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
                  {/* Expense Type & Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2" data-error={errors.expense_category_id ? 'true' : undefined}>
                      <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                        <Tag size={14} className="text-primary/70" />
                        Select Expense Category *
                      </Label>
                      {categoriesLoading ? (
                        <Skeleton className="h-11 rounded-xl w-full" />
                      ) : (
                        <Select
                          onValueChange={(val) => setValue('expense_category_id', val || '')}
                          value={watch('expense_category_id') || ''}
                          items={categories.map((c) => ({ value: c.id, label: c.name }))}
                        >
                          <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                            {watch('expense_category_id') ? (
                              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                {categories.find((c) => c.id === watch('expense_category_id'))?.name ?? 'Unknown Category'}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-600 text-sm font-medium">Select category</span>
                            )}
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-56 overflow-y-auto">
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id} className="font-bold py-3">
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FieldError message={errors.expense_category_id?.message} />
                    </div>

                    <div className="space-y-2" data-error={errors.amount ? 'true' : undefined}>
                      <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                        <DollarSign size={14} className="text-primary/70" />
                        Amount (₹)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register('amount')}
                        placeholder="Enter amount"
                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                      />
                      <FieldError message={errors.amount?.message} />
                    </div>
                  </div>

                  {/* Upload Images */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <ImageIcon size={14} className="text-primary/70" />
                      Expense Images (Upload Images)
                    </Label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Existing Uploaded Images previews */}
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-white/10 group">
                          <img
                            src={preview}
                            alt={`Preview ${index}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}

                      {/* Upload Trigger button */}
                      <button
                        type="button"
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        className={cn(
                          "relative aspect-square border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 bg-gray-50/50 dark:bg-white/5 text-gray-500 hover:text-primary",
                          isUploading && "pointer-events-none opacity-60"
                        )}
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{uploadProgress}%</span>
                          </div>
                        ) : (
                          <>
                            <UploadCloud size={20} />
                            <span className="text-[10px] font-bold">Add Image</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
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
      </SheetContent>
    </Sheet>
  );
}
