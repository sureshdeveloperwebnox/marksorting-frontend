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
import { Save, Loader2, Mail, Phone, MapPin, RefreshCcw, User } from 'lucide-react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { normalizePhoneNumber } from '@/lib/utils';
import { useCreateCustomer, useUpdateCustomer, useCustomer } from '@/services/customer-service';
import { PhoneInput } from '@/components/ui/phone-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { useCustomerStore } from '@/store/useCustomerStore';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

const customerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z
        .string()
        .optional()
        .refine((val) => !val || isValidPhoneNumber(val), {
            message: 'Please enter a valid phone number with country code',
        }),
    address: z.string().optional().or(z.literal('')),
    status: z.string().min(1, 'Status is required'),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export function CustomerFormDrawer() {
    const { isFormDrawerOpen, closeFormDrawer, selectedCustomerId } = useCustomerStore();
    const isEdit = !!selectedCustomerId;

    const { data: customerData, isLoading: customerLoading } = useCustomer(selectedCustomerId);
    const { mutateAsync: createCustomer, isPending: isCreating } = useCreateCustomer();
    const { mutateAsync: updateCustomer, isPending: isUpdating } = useUpdateCustomer();

    const {
        register,
        control,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema) as any,
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            address: '',
            status: 'ACTIVE',
        },
    });

    React.useEffect(() => {
        if (isFormDrawerOpen) {
            if (isEdit && customerData) {
                reset({
                    name: customerData.name,
                    email: customerData.email || '',
                    phone: normalizePhoneNumber(customerData.phone),
                    address: customerData.address || '',
                    status: customerData.status,
                });
            } else if (!isEdit) {
                reset({ name: '', email: '', phone: '', address: '', status: 'ACTIVE' });
            }
        }
    }, [isFormDrawerOpen, customerData, reset, isEdit]);

    const onSubmit: SubmitHandler<CustomerFormValues> = async (data) => {
        try {
            if (isEdit) {
                await updateCustomer({ id: selectedCustomerId, ...data });
            } else {
                await createCustomer(data);
            }
            closeFormDrawer();
        } catch {
            // Errors handled in mutation callbacks
        }
    };

    const isLoading = isEdit && customerLoading;
    const isSubmitting = isCreating || isUpdating;

    return (
        <Sheet open={isFormDrawerOpen} onOpenChange={(open) => !open && closeFormDrawer()}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-md p-0 flex flex-col h-full bg-white dark:bg-gray-950 border-l border-gray-100 dark:border-white/5"
            >
                {/* Header */}
                <SheetHeader className="px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <User size={24} />
                        </div>
                        <div>
                            <SheetTitle className="text-xl">
                                {isEdit ? 'Edit Customer' : 'Add New Customer'}
                            </SheetTitle>
                            <SheetDescription>
                                {isEdit ? 'Update customer information.' : 'Register a new customer in the system.'}
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide pb-24">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full min-h-[300px]">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <form id="customer-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">

                                {/* Customer Name */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                                        <User size={14} className="text-primary/70" />
                                        Customer Name
                                    </Label>
                                    <Input
                                        {...register('name')}
                                        placeholder="Enter customer name"
                                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                                    />
                                    {errors.name && (
                                        <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.name.message}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                                        <Mail size={14} className="text-primary/70" />
                                        Email Address
                                    </Label>
                                    <Input
                                        {...register('email')}
                                        placeholder="customer@example.com (Optional)"
                                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                                    />
                                    {errors.email && (
                                        <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.email.message}</p>
                                    )}
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
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
                                        <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.phone.message}</p>
                                    )}
                                </div>

                                {/* Address */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                                        <MapPin size={14} className="text-primary/70" />
                                        Address
                                    </Label>
                                    <Input
                                        {...register('address')}
                                        placeholder="Enter complete address (Optional)"
                                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                                    />
                                    {errors.address && (
                                        <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.address.message}</p>
                                    )}
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                                        <RefreshCcw size={14} className="text-primary/70" />
                                        Customer Status
                                    </Label>
                                    <Select
                                        onValueChange={(val) => setValue('status', val ?? 'ACTIVE')}
                                        value={watch('status')}
                                        items={[
                                            { value: 'ACTIVE', label: 'Active' },
                                            { value: 'INACTIVE', label: 'Inactive' }
                                        ]}
                                    >
                                        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                            <SelectItem value="ACTIVE" className="font-bold py-3 text-emerald-500">Active</SelectItem>
                                            <SelectItem value="INACTIVE" className="font-bold py-3 text-amber-500">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

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
                            form="customer-form"
                            disabled={isSubmitting || isLoading}
                            className="flex-1 rounded-xl h-11 bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 gap-2"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                            {isEdit ? 'Update Customer' : 'Save Customer'}
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
