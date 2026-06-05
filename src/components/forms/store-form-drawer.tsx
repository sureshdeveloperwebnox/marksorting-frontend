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
import { Store, Loader2, Save, Users, Wrench, Package, Hash, Clock, ShieldAlert, Barcode, Plus } from 'lucide-react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateStore, useUpdateStore, useStore, useCreateMaterial } from '@/services/store-service';
import { useTechnicians } from '@/services/technician-service';
import { CustomerSearchSelect } from '@/components/ui/customer-search-select';
import { MaterialMultiSelect } from '@/components/ui/material-multi-select';
import { toast } from 'sonner';
import { useStoreItemStore } from '@/store/useStoreItemStore';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const storeSchema = z.object({
  service_engineer_id: z.string().min(1, 'Service Engineer is required'),
  customer_id: z.string().min(1, 'Customer is required'),
  material_ids: z.array(z.string()).min(1, 'At least one material must be selected'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  warranty_status: z.string().min(1, 'Warranty status is required'),
  frame_number: z.string().min(1, 'Frame number is required'),
  return_status: z.string().min(1, 'Return status is required'),
  inflow_status: z.string().min(1, 'Stock status is required'),
  barcode: z.string().optional().or(z.literal('')),
  provider_name: z.string().optional().or(z.literal('')),
  invoice_number: z.string().optional().or(z.literal('')),
});

type StoreFormValues = z.infer<typeof storeSchema>;

export function StoreFormDrawer() {
  const { isFormDrawerOpen, closeFormDrawer, selectedStoreId } = useStoreItemStore();
  const isEdit = !!selectedStoreId;

  const { data: storeData, isLoading: storeLoading } = useStore(selectedStoreId);
  const { data: techniciansData } = useTechnicians();
  const { mutateAsync: createStore, isPending: isCreating } = useCreateStore();
  const { mutateAsync: updateStore, isPending: isUpdating } = useUpdateStore();
  const { mutateAsync: createMaterial, isPending: isCreatingMaterial } = useCreateMaterial();

  const [newMaterialName, setNewMaterialName] = React.useState('');

  const technicians = techniciansData?.technicians || [];

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema) as any,
    defaultValues: {
      service_engineer_id: '',
      customer_id: '',
      material_ids: [],
      quantity: 1,
      warranty_status: 'Under Warranty',
      frame_number: '',
      return_status: 'Pending',
      inflow_status: 'Available',
      barcode: '',
      provider_name: '',
      invoice_number: '',
    }
  });

  React.useEffect(() => {
    if (isFormDrawerOpen) {
      if (isEdit && storeData) {
        reset({
          service_engineer_id: storeData.service_engineer_id,
          customer_id: storeData.customer_id,
          material_ids: storeData.materials.map((m) => m.material.id),
          quantity: storeData.quantity,
          warranty_status: storeData.warranty_status,
          frame_number: storeData.frame_number,
          return_status: storeData.return_status,
          inflow_status: storeData.inflow_status,
          barcode: storeData.barcode || '',
          provider_name: storeData.provider_name || '',
          invoice_number: storeData.invoice_number || '',
        });
      } else if (!isEdit) {
        reset({
          service_engineer_id: '',
          customer_id: '',
          material_ids: [],
          quantity: 1,
          warranty_status: 'Under Warranty',
          frame_number: '',
          return_status: 'Pending',
          inflow_status: 'Available',
          barcode: '',
          provider_name: '',
          invoice_number: '',
        });
      }
    }
  }, [isFormDrawerOpen, storeData, reset, isEdit]);

  const handleCreateAndSelectMaterial = async () => {
    if (!newMaterialName.trim()) {
      toast.error('Please enter a material name');
      return;
    }
    try {
      const newMat = await createMaterial({ name: newMaterialName.trim() });
      const currentIds = watch('material_ids') || [];
      setValue('material_ids', [...currentIds, newMat.id], { shouldValidate: true, shouldDirty: true });
      setNewMaterialName('');
    } catch (err) {
      // handled by useCreateMaterial
    }
  };

  const onSubmit: SubmitHandler<StoreFormValues> = async (data) => {
    const payload = {
      ...data,
      barcode: data.barcode || undefined,
      provider_name: data.provider_name || undefined,
      invoice_number: data.invoice_number || undefined,
    };
    try {
      if (isEdit) {
        await updateStore({ id: selectedStoreId!, ...payload });
      } else {
        await createStore(payload);
      }
      closeFormDrawer();
    } catch (error: any) {
      // Error is handled in mutation callbacks (sonner toast)
    }
  };

  const isLoading = isEdit && storeLoading;
  const isSubmitting = isCreating || isUpdating;

  return (
    <Sheet open={isFormDrawerOpen} onOpenChange={(open) => !open && closeFormDrawer()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full bg-white dark:bg-gray-950 border-l border-gray-100 dark:border-white/5">
        <SheetHeader className="px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Store size={24} />
            </div>
            <div>
              <SheetTitle className="text-xl">
                {isEdit ? 'Edit Store Record' : 'Add Store Record'}
              </SheetTitle>
              <SheetDescription>
                {isEdit ? 'Update details of the store item.' : 'Register a new item in the stores inventory.'}
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
            <form id="store-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-4">
                
                {/* Service Engineer Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Wrench size={14} className="text-primary/70" />
                    Service Engineer
                  </Label>
                  <Controller
                    name="service_engineer_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                        items={technicians.map((tech) => ({
                          value: tech.id,
                          label: tech.full_name,
                        }))}
                      >
                        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                          {field.value ? (
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                              {technicians.find((t) => t.id === field.value)?.full_name ?? 'Unknown Engineer'}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600 text-sm font-medium">Select service engineer...</span>
                          )}
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-[300px] overflow-y-auto">
                          {technicians.map((tech) => (
                            <SelectItem key={tech.id} value={tech.id} className="font-bold py-3">
                              {tech.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.service_engineer_id && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.service_engineer_id.message}</p>}
                </div>

                {/* Customer Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} className="text-primary/70" />
                    Customer Selection
                  </Label>
                  <Controller
                    name="customer_id"
                    control={control}
                    render={({ field }) => (
                      <CustomerSearchSelect
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  {errors.customer_id && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.customer_id.message}</p>}
                </div>

                {/* Material Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Package size={14} className="text-primary/70" />
                    Material Selection
                  </Label>
                  <Controller
                    name="material_ids"
                    control={control}
                    render={({ field }) => (
                      <MaterialMultiSelect
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  {errors.material_ids && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.material_ids.message}</p>}

                  {/* Premium inline material creation section */}
                  <div className="pt-2 pb-1">
                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-gray-100 dark:border-white/5"></div>
                      <span className="flex-shrink mx-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Or create new material</span>
                      <div className="flex-grow border-t border-gray-100 dark:border-white/5"></div>
                    </div>
                    
                    <div className="flex gap-2 mt-2">
                      <div className="relative flex-1">
                        <Package size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Enter new material name..."
                          value={newMaterialName}
                          onChange={(e) => setNewMaterialName(e.target.value)}
                          className="h-10 pl-9 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-xs"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCreateAndSelectMaterial();
                            }
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        disabled={isCreatingMaterial || !newMaterialName.trim()}
                        onClick={handleCreateAndSelectMaterial}
                        className="h-10 px-4 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold text-xs transition-all duration-300 shadow-sm flex items-center gap-1.5"
                      >
                        {isCreatingMaterial ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Plus size={13} strokeWidth={3} />
                        )}
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Hash size={14} className="text-primary/70" />
                    Quantity
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="Enter quantity"
                    className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                    {...register('quantity', { valueAsNumber: true })}
                  />
                  {errors.quantity && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.quantity.message}</p>}
                </div>

                {/* Warranty Status */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <ShieldAlert size={14} className="text-primary/70" />
                    Warranty Status
                  </Label>
                  <Controller
                    name="warranty_status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                      >
                        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                          <SelectItem value="Under Warranty" className="font-bold py-3 text-emerald-500">Under Warranty</SelectItem>
                          <SelectItem value="Expired" className="font-bold py-3 text-rose-500">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.warranty_status && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.warranty_status.message}</p>}
                </div>

                {/* Frame Number */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Hash size={14} className="text-primary/70" />
                    Frame Number
                  </Label>
                  <Input
                    placeholder="e.g. FRM10245"
                    className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                    {...register('frame_number')}
                  />
                  {errors.frame_number && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.frame_number.message}</p>}
                </div>

                {/* Return Status */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} className="text-primary/70" />
                    Return Status
                  </Label>
                  <Controller
                    name="return_status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                      >
                        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                          <SelectItem value="Returned" className="font-bold py-3 text-emerald-500">Returned</SelectItem>
                          <SelectItem value="Pending" className="font-bold py-3 text-amber-500">Pending</SelectItem>
                          <SelectItem value="Not Returned" className="font-bold py-3 text-rose-500">Not Returned</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.return_status && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.return_status.message}</p>}
                </div>

                {/* Inflow / Stock Status */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Store size={14} className="text-primary/70" />
                    Inflow / Stock Status
                  </Label>
                  <Controller
                    name="inflow_status"
                    control={control}
                    render={({ field }) => (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                      >
                        <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                          <SelectItem value="Inflow" className="font-bold py-3 text-blue-500">Inflow</SelectItem>
                          <SelectItem value="Outflow" className="font-bold py-3 text-purple-500">Outflow</SelectItem>
                          <SelectItem value="Available" className="font-bold py-3 text-emerald-500">Available</SelectItem>
                          <SelectItem value="Damaged" className="font-bold py-3 text-rose-500">Damaged</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.inflow_status && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.inflow_status.message}</p>}
                </div>

                {/* Barcode details */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Barcode size={14} className="text-primary/70" />
                    Barcode (Optional)
                  </Label>
                  <Input
                    placeholder="Scan or enter barcode"
                    className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                    {...register('barcode')}
                  />
                  {errors.barcode && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.barcode.message}</p>}
                </div>

                {/* Provider Name */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} className="text-primary/70" />
                    Return Shipment Provider (Optional)
                  </Label>
                  <Input
                    placeholder="e.g. DHL, FedEx"
                    className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                    {...register('provider_name')}
                  />
                  {errors.provider_name && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.provider_name.message}</p>}
                </div>

                {/* Invoice/Receipt Number */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                    <Hash size={14} className="text-primary/70" />
                    Return Invoice/Receipt Number (Optional)
                  </Label>
                  <Input
                    placeholder="e.g. INV-10024"
                    className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                    {...register('invoice_number')}
                  />
                  {errors.invoice_number && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.invoice_number.message}</p>}
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
              form="store-form"
              disabled={isSubmitting || isLoading}
              className="flex-1 rounded-xl h-11 bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              {isEdit ? 'Update Store' : 'Save Store'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
