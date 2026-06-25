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
import { Store, Loader2, Save, Users, Wrench, Package, Hash, Clock, ShieldAlert, Barcode, Plus, PlusCircle, Cpu, Building2 } from 'lucide-react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateStore, useUpdateStore, useStore, useCreateMaterial } from '@/services/store-service';
import { useTechnicians } from '@/services/technician-service';
import { useCustomers, useCreateCustomer } from '@/services/customer-service';
import { useMills, useCreateMill } from '@/services/mill-service';
import { useMasterMills, useCreateMasterMill } from '@/services/master-mill-service';
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
import { DatePicker } from '@/components/ui/date-picker';

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

const mapMachineWarrantyToStore = (allWarranty?: string | null): string => {
  if (!allWarranty) return 'Non Warranty';
  const val = allWarranty.trim();
  if (val === 'Under Warranty') return 'Supplementary';
  if (val === 'Under AMC') return 'AMC With Spare';
  if (val === 'Non Warranty') return 'Non Warranty';
  if (val === 'Expired') return 'Non Warranty';
  
  if (['Non Warranty', 'Supplementary', 'AMC With Spare', 'AMC Without Spare'].includes(val)) {
    return val;
  }
  return 'Non Warranty';
};

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
      warranty_status: 'Non Warranty',
      frame_number: '',
      return_status: 'Pending',
      inflow_status: 'Available',
      barcode: '',
      provider_name: '',
      invoice_number: '',
    }
  });

  // Fetch mills and customers lists
  const { data: customersData } = useCustomers({ skip: 0, take: 500, status: 'ACTIVE' });
  const customers = customersData?.customers || [];

  const { data: millsData } = useMills({ skip: 0, take: 500, status: 'ACTIVE' });
  const mills = millsData?.mills || [];

  // Local helper states for selection alignment
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>('');
  const [selectedMillId, setSelectedMillId] = React.useState<string>('');
  const [selectedMachineId, setSelectedMachineId] = React.useState<string>('');

  // Dialog states for Quick Registration
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

  // Dialog states for Machine Registration
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

  // Fetch master mills for the selected mill helper dropdown
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

  // Similar existing customers based on quickCustomerName
  const similarCustomers = React.useMemo(() => {
    if (!quickCustomerName || quickCustomerName.trim().length < 2) return [];
    const search = quickCustomerName.toLowerCase().trim();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(search) && c.id !== existingCustomerId
    ).slice(0, 5);
  }, [quickCustomerName, customers, existingCustomerId]);

  // Filtered mills for the helper dropdown based on selected customer
  const filteredMills = React.useMemo(() => {
    if (!selectedCustomerId) {
      return mills;
    }
    return mills.filter((m) => m.customer_id === selectedCustomerId);
  }, [mills, selectedCustomerId]);

  // Mutations for quick creation
  const { mutateAsync: createCustomer } = useCreateCustomer();
  const { mutateAsync: createMill } = useCreateMill();
  const { mutateAsync: createMasterMill } = useCreateMasterMill();

  // Watch form fields to sync state
  const customerIdWatch = watch('customer_id');

  // Synchronize state when customer is updated
  React.useEffect(() => {
    if (customerIdWatch) {
      setSelectedCustomerId(customerIdWatch);
    } else {
      setSelectedCustomerId('');
      setSelectedMillId('');
      setSelectedMachineId('');
    }
  }, [customerIdWatch]);

  // Clean machine selection if it doesn't belong to the selected mill
  React.useEffect(() => {
    if (!selectedMillId || !selectedMachineId) return;
    const match = masterMills.find((m) => m.id === selectedMachineId);
    if (!match || match.mill_id !== selectedMillId) {
      setSelectedMachineId('');
    }
  }, [selectedMillId, masterMills, selectedMachineId]);

  // Reset form and helpers when opening / closing the sheet
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
        setSelectedCustomerId(storeData.customer_id);
        setSelectedMillId('');
        setSelectedMachineId('');
      } else if (!isEdit) {
        reset({
          service_engineer_id: '',
          customer_id: '',
          material_ids: [],
          quantity: 1,
          warranty_status: 'Non Warranty',
          frame_number: '',
          return_status: 'Pending',
          inflow_status: 'Available',
          barcode: '',
          provider_name: '',
          invoice_number: '',
        });
        setSelectedCustomerId('');
        setSelectedMillId('');
        setSelectedMachineId('');
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

                  {/* Search Machine by Ref No / Frame No / Customer / Mill directly */}
                  <div className="space-y-2 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                      <Cpu size={14} className="text-primary/70" />
                      Search Machine to Prefill (REF NO / Frame No / Customer / Mill)
                    </Label>
                    <Input
                      value={machineSearchQuery}
                      onChange={(e) => setMachineSearchQuery(e.target.value)}
                      placeholder="Type REF NO, Frame No, Customer or Mill to search..."
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
                                // Set customer_id and prefill frame_number
                                if (m.mill_id) {
                                  const millCustomerId = m.mill?.customer_id;
                                  if (millCustomerId) {
                                    setValue('customer_id', millCustomerId);
                                    setSelectedCustomerId(millCustomerId);
                                  } else {
                                    const localMill = mills.find(millItem => millItem.id === m.mill_id);
                                    if (localMill?.customer_id) {
                                      setValue('customer_id', localMill.customer_id);
                                      setSelectedCustomerId(localMill.customer_id);
                                    }
                                  }
                                }
                                if (m.frame_no) {
                                  setValue('frame_number', m.frame_no);
                                }
                                if (m.all_warranty) {
                                  setValue('warranty_status', mapMachineWarrantyToStore(m.all_warranty));
                                }
                                setSelectedMachineId(m.id);
                                setMachineSearchQuery('');
                                toast.success('Machine details prefilled! Verify and adjust as needed.');
                              }}
                              className="w-full text-left p-3 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors text-xs flex flex-col gap-1 cursor-pointer group"
                            >
                              <div className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors">
                                {m.mill?.customer?.name ? `${m.mill.customer.name} — ` : ''}{m.mill?.name || 'Unknown Mill'}
                              </div>
                              <div className="text-gray-400 font-medium">
                                {[
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

                  {/* Customer Selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                        <Users size={14} className="text-primary/70" />
                        Customer Selection
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

                  {/* Mill Selection (Optional helper) */}
                  {selectedCustomerId && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-2">
                          <Building2 size={14} className="text-primary/70" />
                          Select Mill (Optional Helper)
                        </Label>
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
                      </div>
                      {mills.length > 0 ? (
                        <Select
                          onValueChange={(val) => {
                            setSelectedMillId(val === 'clear' ? '' : val || '');
                          }}
                          value={selectedMillId || ''}
                          items={filteredMills.map(m => ({ value: m.id, label: m.name }))}
                        >
                          <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                            {selectedMillId ? (
                              <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                {mills.find((m) => m.id === selectedMillId)?.name ?? 'Unknown Mill'}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-600 text-sm font-medium">
                                Select a mill to filter machines...
                              </span>
                            )}
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-56">
                            <SelectItem value="clear" className="font-bold py-3 text-gray-400">Clear Mill Filter</SelectItem>
                            {filteredMills.length > 0 ? (
                              filteredMills.map((mill) => (
                                <SelectItem key={mill.id} value={mill.id} className="font-bold py-3">
                                  {mill.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no_mills" disabled className="py-3 text-gray-400 font-bold">
                                No mills found for this customer
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="h-11 bg-gray-50/50 dark:bg-white/5 rounded-xl animate-pulse" />
                      )}
                    </div>
                  )}

                  {/* Machine / Installation Record Helper Dropdown */}
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
                        <div className="h-11 bg-gray-50/50 dark:bg-white/5 rounded-xl animate-pulse" />
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
                              if (m.frame_no) setValue('frame_number', m.frame_no);
                              if (m.all_warranty) {
                                setValue('warranty_status', mapMachineWarrantyToStore(m.all_warranty));
                              }
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
                          <SelectItem value="Non Warranty" className="font-bold py-3 text-rose-500">Non Warranty</SelectItem>
                          <SelectItem value="Supplementary" className="font-bold py-3 text-blue-500">Supplementary</SelectItem>
                          <SelectItem value="AMC With Spare" className="font-bold py-3 text-emerald-500">AMC With Spare</SelectItem>
                          <SelectItem value="AMC Without Spare" className="font-bold py-3 text-amber-500">AMC Without Spare</SelectItem>
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
                    Shipment Provider (Optional)
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
                    Shipment Number (Optional)
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

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-gray-955/90 backdrop-blur-md border-t border-gray-100 dark:border-white/5">
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

        {/* Quick Register Customer & Mill Dialog */}
        <Dialog open={isQuickCreateOpen} onOpenChange={setIsQuickCreateOpen}>
          <DialogContent className="sm:max-w-[480px] bg-white dark:bg-gray-955 rounded-2xl border border-gray-100 dark:border-white/5">
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
                          installation_date: new Date().toISOString(),
                        });
                        createdMasterMillId = newMasterMill.id;
                      } catch (masterMillErr) {
                        console.error('Failed to auto-create master mill record:', masterMillErr);
                      }
                    }

                    // Update form selections
                    setSelectedCustomerId(customerId || '');
                    setSelectedMillId(millId || '');

                    if (createdMasterMillId) {
                      setSelectedMachineId(createdMasterMillId);
                    }
                    
                    setValue('customer_id', customerId || '');
                    if (quickRefNo.trim()) {
                      setValue('frame_number', quickRefNo.trim());
                      setValue('warranty_status', 'Non Warranty');
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
                    setValue('frame_number', newRecord.frame_no || quickFrameNo.trim());
                    setValue('warranty_status', mapMachineWarrantyToStore(newRecord.all_warranty));
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
