'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Save, Loader2, Mail, Phone, Factory, MapPin, RefreshCcw, Users, Hash, Plus, Trash2 } from 'lucide-react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { normalizePhoneNumber } from '@/lib/utils';
import { useCreateMill, useUpdateMill, useMill } from '@/services/mill-service';
import { PhoneInput } from '@/components/ui/phone-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { useMillStore } from '@/store/useMillStore';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useCustomers } from '@/services/customer-service';
import { Skeleton } from '@/components/ui/skeleton';

const millSchema = z.object({
  name: z.string().min(2, 'Mill Name must be at least 2 characters'),
  ref_no: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || isValidPhoneNumber(val),
      { message: 'Please enter a valid phone number with correct country code' }
    ),
  phone_2: z
    .string()
    .optional()
    .refine(
      (val) => !val || isValidPhoneNumber(val),
      { message: 'Please enter a valid phone number with correct country code' }
    ),
  phone_3: z
    .string()
    .optional()
    .refine(
      (val) => !val || isValidPhoneNumber(val),
      { message: 'Please enter a valid phone number with correct country code' }
    ),
  address: z.string().optional().or(z.literal('')),
  place: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  status: z.string().min(1, 'Status is required'),
  customer_id: z.string().optional().or(z.literal('')),
});

type MillFormValues = z.infer<typeof millSchema>;

export function MillFormDrawer() {
  const { isFormDrawerOpen, closeFormDrawer, selectedMillId } = useMillStore();
  const isEdit = !!selectedMillId;

  const [showPhone2, setShowPhone2] = React.useState(false);
  const [showPhone3, setShowPhone3] = React.useState(false);

  const { data: millData, isLoading: millLoading } = useMill(selectedMillId);
  const { data: customersData } = useCustomers({ skip: 0, take: 500, status: 'ACTIVE' });
  const { mutateAsync: createMill, isPending: isCreating } = useCreateMill();
  const { mutateAsync: updateMill, isPending: isUpdating } = useUpdateMill();

  const customers = customersData?.customers || [];

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<MillFormValues>({
    resolver: zodResolver(millSchema) as any,
    defaultValues: {
      name: '',
      ref_no: '',
      email: '',
      phone: '',
      phone_2: '',
      phone_3: '',
      address: '',
      place: '',
      city: '',
      status: 'ACTIVE',
      customer_id: '',
    }
  });

  React.useEffect(() => {
    if (isFormDrawerOpen) {
      if (isEdit && millData) {
        reset({
          name: millData.name,
          ref_no: millData.ref_no || '',
          email: millData.email || '',
          phone: normalizePhoneNumber(millData.phone),
          phone_2: normalizePhoneNumber(millData.phone_2),
          phone_3: normalizePhoneNumber(millData.phone_3),
          address: millData.address || '',
          place: millData.place || '',
          city: millData.city || '',
          status: millData.status,
          customer_id: millData.customer_id || '',
        });
        setShowPhone2(!!millData.phone_2);
        setShowPhone3(!!millData.phone_3);
      } else if (!isEdit) {
        reset({
          name: '',
          ref_no: '',
          email: '',
          phone: '',
          phone_2: '',
          phone_3: '',
          address: '',
          place: '',
          city: '',
          status: 'ACTIVE',
          customer_id: '',
        });
        setShowPhone2(false);
        setShowPhone3(false);
      }
    }
  }, [isFormDrawerOpen, millData, reset, isEdit]);

  const onSubmit: SubmitHandler<MillFormValues> = async (data) => {
    const payload = {
      ...data,
      email: data.email || undefined,
      ref_no: data.ref_no || undefined,
      address: data.address || undefined,
      place: data.place || undefined,
      city: data.city || undefined,
      phone: data.phone || undefined,
      phone_2: data.phone_2 || undefined,
      phone_3: data.phone_3 || undefined,
      customer_id: data.customer_id || undefined,
    };
    try {
      if (isEdit) {
        await updateMill({ id: selectedMillId, ...payload });
      } else {
        await createMill(payload);
      }
      closeFormDrawer();
    } catch (error: any) {
      // Error is handled in the mutation callbacks (sonner toast)
    }
  };

  const isLoading = isEdit && millLoading;
  const isSubmitting = isCreating || isUpdating;

  return (
    <Sheet open={isFormDrawerOpen} onOpenChange={(open) => !open && closeFormDrawer()}>
      <SheetContent side="right">
        <SheetHeader className="px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Factory size={24} />
            </div>
            <div>
              <SheetTitle className="text-xl">
                {isEdit ? 'Edit Mill' : 'Add New Mill'}
              </SheetTitle>
              <SheetDescription>
                {isEdit ? 'Update mill information.' : 'Register a new mill in the system.'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide pb-24">
          {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <form id="mill-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                {/* Mill Name Field */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Factory size={14} className="text-primary/70" />
                    Mill Name
                  </Label>
                  <Input
                    {...register('name')}
                    placeholder="Enter mill name"
                    className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                  />
                  {errors.name && <p className="text-[11px] text-rose-500 font-medium ml-1">{errors.name.message}</p>}
                </div>

                {/* Ref No Field */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Hash size={14} className="text-primary/70" />
                    Ref No
                  </Label>
                  <Input
                    {...register('ref_no')}
                    placeholder="Enter reference number (Optional)"
                    className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                  />
                  {errors.ref_no && <p className="text-[11px] text-rose-500 font-medium ml-1">{errors.ref_no.message}</p>}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Mail size={14} className="text-primary/70" />
                    Email Address
                    <span className="text-gray-400 font-normal normal-case tracking-normal text-[11px]">(Optional)</span>
                  </Label>
                  <Input
                    {...register('email')}
                    placeholder="contact@mill.com (Optional)"
                    className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                  />
                  {errors.email && <p className="text-[11px] text-rose-500 font-medium ml-1">{errors.email.message}</p>}
                </div>

                {/* Phone Number Field */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Phone size={14} className="text-primary/70" />
                    Contact No.
                  </Label>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        value={field.value || ''}
                        onChange={field.onChange}
                        placeholder="Enter phone number (Optional)"
                        className="h-11"
                      />
                    )}
                  />
                  {errors.phone && (
                    <p className="text-[11px] text-rose-500 font-medium ml-1">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Contact No 2 Field */}
                {showPhone2 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                        <Phone size={14} className="text-primary/70" />
                        Contact No. 2
                      </Label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPhone2(false);
                          setValue('phone_2', '');
                        }}
                        className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-none border-none p-0"
                      >
                        <Trash2 size={11} />
                        Remove
                      </button>
                    </div>
                    <Controller
                      name="phone_2"
                      control={control}
                      render={({ field }) => (
                        <PhoneInput
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Enter contact number 2"
                          className="h-11"
                        />
                      )}
                    />
                    {errors.phone_2 && (
                      <p className="text-[11px] text-rose-500 font-medium ml-1">
                        {errors.phone_2.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Contact No 3 Field */}
                {showPhone3 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                        <Phone size={14} className="text-primary/70" />
                        Contact No. 3
                      </Label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPhone3(false);
                          setValue('phone_3', '');
                        }}
                        className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-none border-none p-0"
                      >
                        <Trash2 size={11} />
                        Remove
                      </button>
                    </div>
                    <Controller
                      name="phone_3"
                      control={control}
                      render={({ field }) => (
                        <PhoneInput
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Enter contact number 3"
                          className="h-11"
                        />
                      )}
                    />
                    {errors.phone_3 && (
                      <p className="text-[11px] text-rose-500 font-medium ml-1">
                        {errors.phone_3.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Add Alternate Contact Button */}
                {(!showPhone2 || !showPhone3) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!showPhone2) {
                        setShowPhone2(true);
                      } else {
                        setShowPhone3(true);
                      }
                    }}
                    className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-primary/5 hover:bg-primary/10 transition-all duration-300 w-fit cursor-pointer border border-primary/10"
                  >
                    <Plus size={14} />
                    Add Alternate Contact
                  </button>
                )}

                {/* Location/Address Field */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={14} className="text-primary/70" />
                    Location / Address
                  </Label>
                  <Input
                    {...register('address')}
                    placeholder="Enter complete address (Optional)"
                    className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                  />
                  {errors.address && <p className="text-[11px] text-rose-500 font-medium ml-1">{errors.address.message}</p>}
                </div>

                {/* Place and City Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={14} className="text-primary/70" />
                      Place
                    </Label>
                    <Input
                      {...register('place')}
                      placeholder="Enter place (Optional)"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                    />
                    {errors.place && <p className="text-[11px] text-rose-500 font-medium ml-1">{errors.place.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={14} className="text-primary/70" />
                      City
                    </Label>
                    <Input
                      {...register('city')}
                      placeholder="Enter city (Optional)"
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                    />
                    {errors.city && <p className="text-[11px] text-rose-500 font-medium ml-1">{errors.city.message}</p>}
                  </div>
                </div>

                {/* Customer */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} className="text-primary/70" />
                    Customer
                    <span className="text-gray-400 font-normal normal-case tracking-normal text-[11px]">(Optional)</span>
                  </Label>
                  <Controller
                    name="customer_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                        items={customers.map((c) => ({ value: c.id, label: c.name }))}
                      >
                        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-medium">
                          {field.value ? (
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {customers.find((c) => c.id === field.value)?.name ?? 'Unknown Customer'}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600 text-sm font-medium">Select customer for this mill...</span>
                          )}
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-[300px] overflow-y-auto">
                          <SelectItem value="" className="font-medium py-3 text-gray-400">None / Clear</SelectItem>
                          {customers.map((cust) => (
                            <SelectItem key={cust.id} value={cust.id} className="font-medium py-3">
                              {cust.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.customer_id && <p className="text-[11px] text-rose-500 font-medium ml-1">{errors.customer_id.message}</p>}
                </div>

                {/* Mill Status */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                    <RefreshCcw size={14} className="text-primary/70" />
                    Mill Status
                  </Label>
                  <Select
                    onValueChange={(val) => setValue('status', val ?? 'ACTIVE')}
                    value={watch('status')}
                    items={[
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'INACTIVE', label: 'Inactive' },
                      { value: 'CLOSED', label: 'Closed' }
                    ]}
                  >
                    <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                      <SelectItem value="ACTIVE" className="font-medium py-3 text-emerald-500">Active</SelectItem>
                      <SelectItem value="INACTIVE" className="font-medium py-3 text-amber-500">Inactive</SelectItem>
                      <SelectItem value="CLOSED" className="font-medium py-3 text-rose-500">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>
          )}
        </div>

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
              form="mill-form"
              disabled={isSubmitting || isLoading}
              className="flex-1 rounded-xl h-11 bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              {isEdit ? 'Update Mill' : 'Save Mill'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
