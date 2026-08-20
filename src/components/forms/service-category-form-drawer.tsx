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
import { Save, Loader2, Tag, RefreshCcw, AlignLeft } from 'lucide-react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateServiceCategory, useUpdateServiceCategory, useServiceCategory } from '@/services/service-category-service';
import { useServiceCategoryStore } from '@/store/useServiceCategoryStore';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

const serviceCategorySchema = z.object({
    name: z.string().min(2, 'Category Name must be at least 2 characters'),
    description: z.string().optional(),
    status: z.string().min(1, 'Status is required'),
});

type ServiceCategoryFormValues = z.infer<typeof serviceCategorySchema>;

export function ServiceCategoryFormDrawer() {
    const { isFormDrawerOpen, closeFormDrawer, selectedId } = useServiceCategoryStore();
    const isEdit = !!selectedId;

    const { data: categoryData, isLoading: categoryLoading } = useServiceCategory(selectedId);
    const { mutateAsync: createCategory, isPending: isCreating } = useCreateServiceCategory();
    const { mutateAsync: updateCategory, isPending: isUpdating } = useUpdateServiceCategory();

    const {
        register,
        control,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors }
    } = useForm<ServiceCategoryFormValues>({
        resolver: zodResolver(serviceCategorySchema) as any,
        defaultValues: {
            name: '',
            description: '',
            status: 'ACTIVE',
        }
    });

    React.useEffect(() => {
        if (isFormDrawerOpen) {
            if (isEdit && categoryData) {
                reset({
                    name: categoryData.name,
                    description: categoryData.description || '',
                    status: categoryData.status,
                });
            } else if (!isEdit) {
                reset({
                    name: '',
                    description: '',
                    status: 'ACTIVE',
                });
            }
        }
    }, [isFormDrawerOpen, categoryData, reset, isEdit]);

    const onSubmit: SubmitHandler<ServiceCategoryFormValues> = async (data) => {
        try {
            if (isEdit) {
                await updateCategory({ id: selectedId, ...data });
            } else {
                await createCategory(data);
                reset({
                    name: '',
                    description: '',
                    status: 'ACTIVE',
                });
            }
            closeFormDrawer();
        } catch (error: any) {
            // Error is handled in the mutation callbacks (sonner toast)
        }
    };

    const isLoading = isEdit && categoryLoading;
    const isSubmitting = isCreating || isUpdating;

    return (
        <Sheet open={isFormDrawerOpen} onOpenChange={(open) => !open && closeFormDrawer()}>
            <SheetContent side="right">
                <SheetHeader className="px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <Tag size={24} />
                        </div>
                        <div>
                            <SheetTitle className="text-xl">
                                {isEdit ? 'Edit Service Category' : 'Add New Service Category'}
                            </SheetTitle>
                            <SheetDescription>
                                {isEdit ? 'Update service category information.' : 'Register a new service category in the system.'}
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
                        <form id="service-category-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
                                {/* Category Name Field */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                        <Tag size={14} className="text-primary/70" />
                                        Category Name
                                        <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        {...register('name')}
                                        placeholder="Enter category name"
                                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                                    />
                                    {errors.name && <p className="text-[11px] text-rose-500 font-medium ml-1">{errors.name.message}</p>}
                                </div>

                                {/* Description Field */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                        <AlignLeft size={14} className="text-primary/70" />
                                        Description
                                        <span className="text-gray-400 font-normal normal-case tracking-normal text-[11px]">(Optional)</span>
                                    </Label>
                                    <Input
                                        {...register('description')}
                                        placeholder="Enter description (Optional)"
                                        className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-medium"
                                    />
                                    {errors.description && <p className="text-[11px] text-rose-500 font-medium ml-1">{errors.description.message}</p>}
                                </div>

                                {/* Status Field */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                        <RefreshCcw size={14} className="text-primary/70" />
                                        Category Status
                                    </Label>
                                    <Select
                                        onValueChange={(val) => setValue('status', val ?? 'ACTIVE')}
                                        value={watch('status')}
                                        items={[
                                            { value: 'ACTIVE', label: 'Active' },
                                            { value: 'INACTIVE', label: 'Inactive' }
                                        ]}
                                    >
                                        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-medium">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                            <SelectItem value="ACTIVE" className="font-medium py-3 text-emerald-500">Active</SelectItem>
                                            <SelectItem value="INACTIVE" className="font-medium py-3 text-amber-500">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && <p className="text-[11px] text-rose-500 font-medium ml-1">{errors.status.message}</p>}
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
                            form="service-category-form"
                            disabled={isSubmitting || isLoading}
                            className="flex-1 rounded-xl h-11 bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 gap-2"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                            {isEdit ? 'Update Category' : 'Save Category'}
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
