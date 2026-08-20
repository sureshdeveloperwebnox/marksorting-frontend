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
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Store, Loader2, Save, Users, Wrench, Package, Hash, Clock, ShieldAlert, Barcode, Plus, PlusCircle, Cpu, Building2, ChevronDown, ChevronUp, Check, Edit3, Sparkles, ArrowRight, ListOrdered } from 'lucide-react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCreateStore, useUpdateStore, useStore, useCreateMaterial, useMaterials } from '@/services/store-service';
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
  customer_id: z.string().optional().or(z.literal('')),
  material_ids: z.array(z.string()).min(1, 'At least one material must be selected'),
  material_quantities: z
    .array(
      z.object({
        material_id: z.string(),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        stock_type: z.string().optional().default('Inflow'),
        serial_numbers: z.array(z.string()).optional(),
      })
    )
    .superRefine((items, ctx) => {
      const seenBarcodes = new Set<string>();
      items.forEach((item, itemIdx) => {
        const serials = item.serial_numbers || [];
        for (let u = 0; u < item.quantity; u++) {
          const raw = serials[u]?.trim() || '';
          if (!raw) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Unit ${u + 1} Barcode is required`,
              path: [itemIdx, 'serial_numbers', u],
            });
          } else if (raw.length > 8) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Unit ${u + 1} Barcode must be maximum 8 characters`,
              path: [itemIdx, 'serial_numbers', u],
            });
          } else if (seenBarcodes.has(raw.toUpperCase())) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Barcode ${raw} is duplicate! Each unit must have a unique barcode`,
              path: [itemIdx, 'serial_numbers', u],
            });
          } else {
            seenBarcodes.add(raw.toUpperCase());
          }
        }
      });
    })
    .optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  warranty_status: z.string().min(1, 'Warranty status is required'),
  service_type: z.string().optional().default('Acknowledgement'),
  frame_number: z.string().min(1, 'Frame number is required'),
  return_status: z.string().min(1, 'Return status is required'),
  inflow_status: z.string().min(1, 'Stock status is required'),
  stock_type: z.string().optional().default('Inflow'),
  barcode: z.string().optional().or(z.literal('')),
  provider_name: z.string().optional().or(z.literal('')),
  invoice_number: z.string().optional().or(z.literal('')),
  remarks: z.string().optional().or(z.literal('')),
});

const mapMachineWarrantyToStore = (allWarranty?: string | null): string => {
  if (!allWarranty) return 'Non Warranty';
  const val = allWarranty.trim();
  if (val === 'Under Warranty' || val === 'Warranty' || val === 'Under Warrenty') return 'Warranty';
  if (val === 'Under AMC') return 'AMC With Spare';
  if (val === 'Non Warranty') return 'Non Warranty';
  if (val === 'Expired') return 'Non Warranty';
  
  if (['Warranty', 'Non Warranty', 'AMC With Spare', 'AMC Without Spare'].includes(val)) {
    return val;
  }
  return 'Non Warranty';
};

const generateContinuousBarcodes = (startCode: string, count: number): string[] => {
  if (!startCode || count <= 0) return [];
  const trimmed = startCode.trim();
  const match = trimmed.match(/^(.*?)(\d+)$/);

  if (!match) {
    return Array.from({ length: count }, (_, i) => `${trimmed}-${i + 1}`);
  }

  const prefix = match[1];
  const numStr = match[2];
  const padLen = numStr.length;
  const startNum = parseInt(numStr, 10);

  return Array.from({ length: count }, (_, i) => {
    const currentNum = startNum + i;
    return `${prefix}${String(currentNum).padStart(padLen, '0')}`;
  });
};

const calculateEndBarcode = (startCode: string, count: number): string => {
  if (!startCode || count <= 0) return '';
  const seq = generateContinuousBarcodes(startCode, count);
  return seq[seq.length - 1] || '';
};

const extractCleanRemarks = (remarks?: string | null): string => {
  if (!remarks) return '';
  let cleaned = remarks;
  const serialIdx = cleaned.search(/\(?\s*Serial Nos:/i);
  if (serialIdx !== -1) {
    cleaned = cleaned.substring(0, serialIdx);
  }
  const stIdx = cleaned.search(/\(?\s*Service Type:/i);
  if (stIdx !== -1) {
    cleaned = cleaned.substring(0, stIdx);
  }
  cleaned = cleaned.replace(/[\(\)\|\s,]+$/, '').trim();
  return cleaned;
};

const parseSerialMapFromRemarks = (remarks?: string | null): Record<string, string[]> => {
  if (!remarks) return {};
  const map: Record<string, string[]> = {};
  const serialNosIdx = remarks.indexOf('Serial Nos:');
  if (serialNosIdx === -1) return {};

  let serialStr = remarks.substring(serialNosIdx + 'Serial Nos:'.length);
  const stIdx = serialStr.indexOf('Service Type:');
  if (stIdx !== -1) {
    serialStr = serialStr.substring(0, stIdx);
  }
  serialStr = serialStr.replace(/[\)\|\s]+$/, '').trim();

  const parts = serialStr.split('|');
  parts.forEach((part) => {
    const colIdx = part.indexOf(':');
    if (colIdx !== -1) {
      const matName = part.substring(0, colIdx).trim();
      const serialsStr = part.substring(colIdx + 1).trim();
      const bracketMatch = serialsStr.match(/\[(.*?)\]/);
      if (bracketMatch && bracketMatch[1]) {
        const serials = bracketMatch[1].split(',').map((s) => s.trim().replace(/\s*\(USED\)/gi, '')).filter(Boolean);
        map[matName] = serials;
      }
    }
  });
  return map;
};

const parseServiceTypeFromRemarks = (remarks?: string | null): 'Replacement' | 'Acknowledgement' => {
  if (!remarks) return 'Acknowledgement';
  const matches = [...remarks.matchAll(/Service Type:\s*([^\s|)]+)/gi)];
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    if (lastMatch && lastMatch[1]) {
      const val = lastMatch[1].trim().toLowerCase();
      if (val === 'replacement') return 'Replacement';
      if (val === 'acknowledgement' || val === 'payment') return 'Acknowledgement';
    }
  }
  return 'Acknowledgement';
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
  const { data: materialsData } = useMaterials({ skip: 0, take: 500 });
  const allMaterials = materialsData?.materials || [];

  const [newMaterialName, setNewMaterialName] = React.useState('');
  const [expandedMaterials, setExpandedMaterials] = React.useState<Record<string, boolean>>({});

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
      service_type: 'Acknowledgement',
      frame_number: '',
      return_status: 'Pending',
      inflow_status: 'Available',
      barcode: '',
      provider_name: '',
      invoice_number: '',
      remarks: '',
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
  const [barcodeRanges, setBarcodeRanges] = React.useState<Record<string, { start: string; end: string }>>({});
  const [showAllUnitsMap, setShowAllUnitsMap] = React.useState<Record<string, boolean>>({});

  // Dialog states for Quick Registration
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

  // Dialog states for Machine Registration
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

  // Query master mills specifically for current frame_number to ensure Warranty & AMC details load immediately in edit mode
  const currentFrameNumber = watch('frame_number');
  const { data: frameMachineData } = useMasterMills(
    {
      search: currentFrameNumber || undefined,
      skip: 0,
      take: 5,
    },
    { enabled: !!currentFrameNumber && currentFrameNumber.length >= 2 }
  );
  const frameMasterMills = frameMachineData?.masterMills || [];

  // Selected Machine object for displaying Warranty & AMC details
  const selectedMachine = React.useMemo(() => {
    if (selectedMachineId) {
      const found =
        searchedMasterMills.find((m) => m.id === selectedMachineId) ||
        masterMills.find((m) => m.id === selectedMachineId) ||
        frameMasterMills.find((m) => m.id === selectedMachineId);
      if (found) return found;
    }
    if (currentFrameNumber) {
      const found =
        searchedMasterMills.find((m) => m.frame_no === currentFrameNumber) ||
        masterMills.find((m) => m.frame_no === currentFrameNumber) ||
        frameMasterMills.find((m) => m.frame_no === currentFrameNumber);
      if (found) return found;
    }
    return null;
  }, [selectedMachineId, currentFrameNumber, searchedMasterMills, masterMills, frameMasterMills]);

  // Filtered mills for the helper dropdown based on selected customer
  const filteredMills = React.useMemo(() => {
    let baseMills = mills;
    if (selectedMachine?.mill) {
      const exists = baseMills.some((m) => m.id === selectedMachine.mill_id);
      if (!exists) {
        baseMills = [selectedMachine.mill as any, ...baseMills];
      }
    }
    if (!selectedCustomerId) {
      return baseMills;
    }
    return baseMills.filter((m) => m.customer_id === selectedCustomerId || m.id === selectedMillId);
  }, [mills, selectedCustomerId, selectedMachine, selectedMillId]);

  // Sync mill selection when machine is matched
  React.useEffect(() => {
    if (selectedMachine?.mill_id) {
      setSelectedMillId(selectedMachine.mill_id);
    }
    if (selectedMachine?.id && (!selectedMachineId || selectedMachineId !== selectedMachine.id)) {
      setSelectedMachineId(selectedMachine.id);
    }
    if (selectedMachine?.mill?.customer_id) {
      setSelectedCustomerId(selectedMachine.mill.customer_id);
      setValue('customer_id', selectedMachine.mill.customer_id);
    } else if (selectedMachine) {
      setSelectedCustomerId('');
      setValue('customer_id', '');
    }
  }, [selectedMachine]);

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
    }
  }, [customerIdWatch]);

  // Clean machine selection if it doesn't belong to the selected mill
  React.useEffect(() => {
    if (!selectedMillId || !selectedMachineId) return;
    const match = searchedMasterMills.find((m) => m.id === selectedMachineId) || masterMills.find((m) => m.id === selectedMachineId);
    if (match && match.mill_id !== selectedMillId) {
      setSelectedMachineId('');
    }
  }, [selectedMillId, masterMills, searchedMasterMills, selectedMachineId]);

  // Reset form and helpers when opening / closing the sheet
  React.useEffect(() => {
    if (isFormDrawerOpen) {
      if (isEdit && storeData) {
        const serialMap = parseSerialMapFromRemarks(storeData.remarks);

        const initialQuantities = storeData.materials.map((m) => {
          const matName = m.material.name;
          const serials = serialMap[matName] || [];
          const qty = m.quantity || 1;
          const fullSerials = Array.from({ length: qty }).map((_, idx) => serials[idx] || '');
          return {
            material_id: m.material.id,
            quantity: qty,
            stock_type: m.stock_type || 'Inflow',
            serial_numbers: fullSerials,
          };
        });

        // Expand all material cards so user sees pre-filled barcodes / serial numbers immediately
        const initialExpanded: Record<string, boolean> = {};
        storeData.materials.forEach((m) => {
          initialExpanded[m.material.id] = true;
        });
        setExpandedMaterials(initialExpanded);

        reset({
          service_engineer_id: storeData.service_engineer_id,
          customer_id: storeData.customer_id,
          material_ids: storeData.materials.map((m) => m.material.id),
          material_quantities: initialQuantities,
          quantity: storeData.quantity,
          warranty_status: storeData.warranty_status,
          service_type: parseServiceTypeFromRemarks(storeData.remarks),
          frame_number: storeData.frame_number,
          return_status: storeData.return_status,
          inflow_status: storeData.inflow_status,
          barcode: storeData.barcode || '',
          provider_name: storeData.provider_name || '',
          invoice_number: storeData.invoice_number || '',
          remarks: extractCleanRemarks(storeData.remarks),
        });

        setSelectedCustomerId(storeData.customer_id);
        if (storeData.frame_number) {
          setMachineSearchQuery(storeData.frame_number);
          setDebouncedSearchQuery(storeData.frame_number);
        }
      } else if (!isEdit) {
        reset({
          service_engineer_id: '',
          customer_id: '',
          material_ids: [],
          material_quantities: [],
          quantity: 1,
          warranty_status: 'Non Warranty',
          service_type: 'Acknowledgement',
          frame_number: '',
          return_status: 'Pending',
          inflow_status: 'Available',
          barcode: '',
          provider_name: '',
          invoice_number: '',
          remarks: '',
        });
        setSelectedCustomerId('');
        setSelectedMillId('');
        setSelectedMachineId('');
        setMachineSearchQuery('');
        setDebouncedSearchQuery('');
        setExpandedMaterials({});
      }
    }
  }, [isFormDrawerOpen, storeData, reset, isEdit]);

  const materialIdsWatch = watch('material_ids') || [];
  const materialQuantitiesWatch = watch('material_quantities') || [];

  React.useEffect(() => {
    if (!isFormDrawerOpen) return;
    const currentQuantities = watch('material_quantities') || [];
    // Filter out any that are no longer in materialIdsWatch
    const filtered = currentQuantities.filter(q => materialIdsWatch.includes(q.material_id));
    // Add any new materialIdsWatch that are not yet in material_quantities
    const newItems = materialIdsWatch
      .filter(id => !filtered.some(q => q.material_id === id))
      .map(id => ({ material_id: id, quantity: 1, stock_type: 'Inflow', serial_numbers: [''] }));
    
    if (newItems.length > 0) {
      const newlyAddedExp: Record<string, boolean> = {};
      newItems.forEach(item => {
        newlyAddedExp[item.material_id] = true;
      });
      setExpandedMaterials(prev => ({ ...prev, ...newlyAddedExp }));
    }

    const nextQuantities = [...filtered, ...newItems];
    
    // Only update if there's an actual difference to avoid infinite loop
    if (JSON.stringify(currentQuantities) !== JSON.stringify(nextQuantities)) {
      setValue('material_quantities', nextQuantities, { shouldDirty: true });
    }
  }, [materialIdsWatch, setValue, watch, isFormDrawerOpen]);

  // Automatically update the main quantity field as sum of material quantities
  const totalQuantity = React.useMemo(() => {
    return materialQuantitiesWatch.reduce((sum, q) => sum + (Number(q.quantity) || 0), 0);
  }, [materialQuantitiesWatch]);

  React.useEffect(() => {
    setValue('quantity', totalQuantity > 0 ? totalQuantity : 1, { shouldValidate: true });
  }, [totalQuantity, setValue]);

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

  const handleSerialNumberChange = (materialId: string, unitIdx: number, value: string) => {
    // Allow alphabets, numbers, and special characters up to 8 characters max limit
    const val = value.slice(0, 8);
    const currentQuantities = watch('material_quantities') || [];
    
    // If user edits Unit 1 barcode directly, automatically update the whole continuous sequence from unit 1
    if (unitIdx === 0 && val.trim()) {
      const targetItem = currentQuantities.find((q) => q.material_id === materialId);
      const count = Number(targetItem?.quantity) || 1;
      const sequence = generateContinuousBarcodes(val, count);
      const endVal = sequence[sequence.length - 1] || '';
      
      setBarcodeRanges((prev) => ({
        ...prev,
        [materialId]: { start: val, end: endVal },
      }));

      const nextQuantities = currentQuantities.map((q) => {
        if (q.material_id === materialId) {
          return { ...q, serial_numbers: sequence };
        }
        return q;
      });
      setValue('material_quantities', nextQuantities, { shouldDirty: true, shouldValidate: true });
      return;
    }

    const nextQuantities = currentQuantities.map((q) => {
      if (q.material_id === materialId) {
        const serials = [...(q.serial_numbers || [])];
        while (serials.length < q.quantity) {
          serials.push('');
        }
        serials[unitIdx] = val;
        return { ...q, serial_numbers: serials };
      }
      return q;
    });
    setValue('material_quantities', nextQuantities, { shouldDirty: true, shouldValidate: true });
  };

  const handleAutoGenerateBarcodes = (materialId: string) => {
    const currentQuantities = watch('material_quantities') || [];
    const allExistingBarcodes = new Set<string>();
    currentQuantities.forEach((q) => {
      if (q.material_id !== materialId) {
        q.serial_numbers?.forEach((s) => {
          if (s && s.trim()) allExistingBarcodes.add(s.trim().toUpperCase());
        });
      }
    });

    const nextQuantities = currentQuantities.map((q) => {
      if (q.material_id === materialId) {
        const qty = Number(q.quantity) || 1;
        // Generate a random 8-digit starting base number
        let startNum = Math.floor(10000000 + Math.random() * (90000000 - qty - 100));
        let candidateStart = startNum.toString();
        let sequence = generateContinuousBarcodes(candidateStart, qty);

        // Ensure none of the generated continuous sequence conflicts with existing barcodes in other materials
        let attempts = 0;
        while (sequence.some((code) => allExistingBarcodes.has(code.toUpperCase())) && attempts < 100) {
          startNum = Math.floor(10000000 + Math.random() * (90000000 - qty - 100));
          candidateStart = startNum.toString();
          sequence = generateContinuousBarcodes(candidateStart, qty);
          attempts++;
        }

        const endCode = sequence[sequence.length - 1] || '';
        setBarcodeRanges((prev) => ({
          ...prev,
          [materialId]: { start: candidateStart, end: endCode },
        }));

        return { ...q, serial_numbers: sequence };
      }
      return q;
    });

    setValue('material_quantities', nextQuantities, { shouldDirty: true, shouldValidate: true });
    toast.success('Continuous unit barcodes auto-generated!');
  };

  const handleStartBarcodeChange = (materialId: string, startVal: string, count: number) => {
    const endVal = calculateEndBarcode(startVal, count);
    setBarcodeRanges((prev) => ({
      ...prev,
      [materialId]: { start: startVal, end: endVal },
    }));

    if (startVal.trim()) {
      const sequence = generateContinuousBarcodes(startVal, count);
      const currentQuantities = watch('material_quantities') || [];
      const nextQuantities = currentQuantities.map((q) => {
        if (q.material_id === materialId) {
          return { ...q, serial_numbers: sequence };
        }
        return q;
      });
      setValue('material_quantities', nextQuantities, { shouldDirty: true, shouldValidate: true });
    }
  };

  const handleEndBarcodeChange = (materialId: string, endVal: string) => {
    setBarcodeRanges((prev) => ({
      ...prev,
      [materialId]: { start: prev[materialId]?.start || '', end: endVal },
    }));
  };

  const applyContinuousRange = (materialId: string, startVal: string, count: number) => {
    if (!startVal.trim()) {
      toast.error('Please enter a Starting Barcode code first!');
      return;
    }
    const sequence = generateContinuousBarcodes(startVal, count);
    const endCode = sequence[sequence.length - 1] || '';
    const currentQuantities = watch('material_quantities') || [];
    const nextQuantities = currentQuantities.map((q) => {
      if (q.material_id === materialId) {
        return { ...q, serial_numbers: sequence };
      }
      return q;
    });
    setValue('material_quantities', nextQuantities, { shouldDirty: true, shouldValidate: true });
    setBarcodeRanges((prev) => ({
      ...prev,
      [materialId]: { start: startVal, end: endCode },
    }));
    toast.success(`Generated ${count} continuous barcodes: ${startVal} → ${endCode}`);
  };

  const extractFirstErrorMessage = (errObj: any): { message: string; fieldName: string } => {
    if (!errObj) return { message: 'Please fill in all mandatory fields', fieldName: '' };
    if (typeof errObj.message === 'string' && errObj.message.trim()) {
      return { message: errObj.message, fieldName: '' };
    }
    if (Array.isArray(errObj)) {
      for (let i = 0; i < errObj.length; i++) {
        if (errObj[i]) {
          const res = extractFirstErrorMessage(errObj[i]);
          if (res.message && res.message !== 'Please fill in all mandatory fields') {
            return { message: res.message, fieldName: 'material_ids' };
          }
        }
      }
    }
    if (typeof errObj === 'object') {
      for (const key of Object.keys(errObj)) {
        if (errObj[key]) {
          const res = extractFirstErrorMessage(errObj[key]);
          if (res.message && res.message !== 'Please fill in all mandatory fields') {
            return { message: res.message, fieldName: key };
          }
        }
      }
    }
    return { message: 'Please fill in all mandatory fields', fieldName: '' };
  };

  const onInvalid = (errors: any) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 0) return;

    // Auto-expand any materials that have errors in material_quantities
    if (errors.material_quantities) {
      const currentQuantities = watch('material_quantities') || [];
      const expandMap: Record<string, boolean> = {};
      if (Array.isArray(errors.material_quantities)) {
        errors.material_quantities.forEach((itemErr: any, idx: number) => {
          if (itemErr && currentQuantities[idx]?.material_id) {
            expandMap[currentQuantities[idx].material_id] = true;
          }
        });
      }
      setExpandedMaterials((prev) => ({ ...prev, ...expandMap }));
    }

    const { message, fieldName } = extractFirstErrorMessage(errors);
    const targetKey = fieldName || errorKeys[0];
    const targetElement =
      document.querySelector(`[data-field="${targetKey}"]`) ||
      document.getElementById(`field-${targetKey}`) ||
      document.querySelector(`[name="${targetKey}"]`) ||
      document.querySelector('.text-rose-500');

    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const focusable = targetElement.querySelector<HTMLElement>(
        'input:not([disabled]), select:not([disabled]), button:not([disabled]), textarea:not([disabled])'
      );
      if (focusable) {
        setTimeout(() => focusable.focus({ preventScroll: true }), 150);
      }
    }

    toast.error(`Mandatory field missing: ${message}`);
  };

  const onSubmit: SubmitHandler<StoreFormValues> = async (data) => {
    // Validate that all dynamic unit fields are filled
    const missingMap: Record<string, boolean> = {};
    let hasMissingUnit = false;

    data.material_quantities?.forEach((mq) => {
      const serials = mq.serial_numbers || [];
      for (let u = 0; u < mq.quantity; u++) {
        if (!serials[u] || !serials[u].trim()) {
          hasMissingUnit = true;
          missingMap[mq.material_id] = true;
          break;
        }
      }
    });

    if (hasMissingUnit) {
      setExpandedMaterials((prev) => ({ ...prev, ...missingMap }));
      toast.error('All dynamic unit fields (Unit 1, Unit 2, etc.) are mandatory! Please fill in all unit codes.');

      const firstMissingMatId = Object.keys(missingMap)[0];
      if (firstMissingMatId) {
        setTimeout(() => {
          const el = document.querySelector(`[data-material-id="${firstMissingMatId}"]`) ||
                     document.querySelector(`[data-field="material_ids"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
      return;
    }

    const serialSummaries: string[] = [];
    data.material_quantities?.forEach((mq) => {
      const mat = allMaterials.find((m) => m.id === mq.material_id);
      const matName = mat ? mat.name : 'Material';
      const enteredSerials = mq.serial_numbers?.filter((s) => s.trim() !== '') || [];
      if (enteredSerials.length > 0) {
        serialSummaries.push(`${matName}: [${enteredSerials.join(', ')}]`);
      }
    });

    let cleanRemarksInput = extractCleanRemarks(data.remarks);
    let finalRemarks = cleanRemarksInput;
    const extraParts: string[] = [];
    if (serialSummaries.length > 0) {
      extraParts.push(`Serial Nos: ${serialSummaries.join(' | ')}`);
    }
    if (data.service_type) {
      extraParts.push(`Service Type: ${data.service_type}`);
    }
    if (extraParts.length > 0) {
      const extraText = extraParts.join(' | ');
      finalRemarks = finalRemarks ? `${finalRemarks} (${extraText})` : `(${extraText})`;
    }

    const payload = {
      ...data,
      customer_id: data.customer_id || undefined,
      remarks: finalRemarks || undefined,
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
      <SheetContent side="right">
        <SheetHeader className="px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Store size={24} />
            </div>
            <div>
              <SheetTitle className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {isEdit ? 'Edit Store Record' : 'Add Store Record'}
              </SheetTitle>
              <SheetDescription className="text-sm font-bold text-gray-500 mt-0.5">
                {isEdit ? 'Update details of the store item.' : 'Register a new item in the stores inventory.'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide pb-24">
          <div className="w-full">
            {isLoading ? (
            <div className="flex items-center justify-center h-full min-h-[300px]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <form id="store-form" onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5">
              <div className="space-y-4">
                
                {/* Service Engineer Selection */}
                <div data-field="service_engineer_id" className="space-y-2">
                  <Label className="text-[13px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
                    <Wrench size={15} strokeWidth={2.5} className="text-primary" />
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
                  <div className="space-y-2">
                    <Label className="text-[13px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
                      <Cpu size={15} strokeWidth={2.5} className="text-primary" />
                      Search Machine to Prefill (REF NO / Frame No / Customer / Mill)
                    </Label>
                    <Input
                      value={machineSearchQuery}
                      onChange={(e) => setMachineSearchQuery(e.target.value)}
                      placeholder="Type REF NO, Frame No, Customer or Mill to search..."
                      className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-sm"
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
                                // Set mill_id, customer_id and prefill frame_number
                                if (m.mill_id) {
                                  setSelectedMillId(m.mill_id);
                                  const millCustomerId = m.mill?.customer_id;
                                  if (millCustomerId) {
                                    setValue('customer_id', millCustomerId);
                                    setSelectedCustomerId(millCustomerId);
                                  } else {
                                    const localMill = mills.find(millItem => millItem.id === m.mill_id);
                                    if (localMill?.customer_id) {
                                      setValue('customer_id', localMill.customer_id);
                                      setSelectedCustomerId(localMill.customer_id);
                                    } else {
                                      setValue('customer_id', '');
                                      setSelectedCustomerId('');
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
                                setIsMillNameManuallyEdited(false);
                                setIsQuickCreateOpen(true);
                                setMachineSearchQuery('');
                              }}
                              className="w-fit text-left text-primary hover:underline flex items-center gap-1 cursor-pointer font-black border-none bg-transparent p-0"
                            >
                              <PlusCircle size={12} strokeWidth={2.5} />
                              Quick Register Customer & Mill
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Customer Selection */}
                  <div data-field="customer_id" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[13px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
                        <Users size={15} strokeWidth={2.5} className="text-primary" />
                        Customer Selection (Optional)
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
                        className="text-xs font-black text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle size={13} strokeWidth={2.5} />
                        Quick Register
                      </button>
                    </div>
                    <Controller
                      name="customer_id"
                      control={control}
                      render={({ field }) => (
                        <CustomerSearchSelect
                          value={field.value || ''}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    {errors.customer_id && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.customer_id.message}</p>}
                  </div>

                  {/* Mill Selection (Optional helper) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[13px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
                        <Building2 size={15} strokeWidth={2.5} className="text-primary" />
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
                          setIsMillNameManuallyEdited(false);
                          setIsQuickCreateOpen(true);
                        }}
                        className="text-xs font-black text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle size={13} strokeWidth={2.5} />
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
                              {mills.find((m) => m.id === selectedMillId)?.name ?? (selectedMachine?.mill_id === selectedMillId ? selectedMachine?.mill?.name : null) ?? 'Unknown Mill'}
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
                              No mills found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="h-11 bg-gray-50/50 dark:bg-white/5 rounded-xl animate-pulse" />
                    )}
                  </div>

                  {/* Machine / Installation Record Helper Dropdown */}
                  {selectedMillId && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <Label className="text-[13px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
                          <Cpu size={15} strokeWidth={2.5} className="text-primary" />
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
                            setQuickWarrantyMonths(0);
                            setQuickWarrantyType('Non Warranty');
                            setIsQuickMasterMillOpen(true);
                          }}
                          className="text-xs font-black text-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <PlusCircle size={13} strokeWidth={2.5} />
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
                          <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
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
                                No master records found for this mill
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}

                  {/* Warranty Status (Moved directly below Machine) */}
                  <div data-field="warranty_status" className="space-y-2">
                    <Label className="text-[13px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert size={15} strokeWidth={2.5} className="text-primary" />
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
                            <SelectItem value="Warranty" className="font-bold py-3 text-emerald-600 dark:text-emerald-400">Warranty</SelectItem>
                            <SelectItem value="Non Warranty" className="font-bold py-3 text-rose-500">Non Warranty</SelectItem>
                            <SelectItem value="AMC With Spare" className="font-bold py-3 text-teal-500">AMC With Spare</SelectItem>
                            <SelectItem value="AMC Without Spare" className="font-bold py-3 text-amber-500">AMC Without Spare</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.warranty_status && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.warranty_status.message}</p>}
                  </div>

                  {/* Service Type Dropdown (New Field) */}
                  <div data-field="service_type" className="space-y-2">
                    <Label className="text-[13px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
                      <Wrench size={15} strokeWidth={2.5} className="text-primary" />
                      Service Type
                    </Label>
                    <Controller
                      name="service_type"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || 'Acknowledgement'}
                        >
                          <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                            <SelectValue placeholder="Select Service Type..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                            <SelectItem value="Acknowledgement" className="font-bold py-3 text-emerald-600 dark:text-emerald-400">
                              Acknowledgement
                            </SelectItem>
                            <SelectItem value="Replacement" className="font-bold py-3 text-blue-600 dark:text-blue-400">
                              Replacement
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.service_type && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.service_type.message}</p>}
                  </div>

                  {/* Return Status */}
                  <div data-field="return_status" className="space-y-2">
                    <Label className="text-[13px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
                      <Clock size={15} strokeWidth={2.5} className="text-primary" />
                      Return Status
                    </Label>
                    <Controller
                      name="return_status"
                      control={control}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || 'Pending'}
                        >
                          <SelectTrigger className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-primary/20 font-bold">
                            <SelectValue placeholder="Select Return Status..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                            <SelectItem value="Pending" className="font-bold py-3 text-amber-500">Pending</SelectItem>
                            <SelectItem value="In Progress" className="font-bold py-3 text-blue-500">In Progress</SelectItem>
                            <SelectItem value="Returned" className="font-bold py-3 text-emerald-500">Returned</SelectItem>
                            <SelectItem value="Not Returned" className="font-bold py-3 text-rose-500">Not Returned</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.return_status && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.return_status.message}</p>}
                  </div>

                  {/* Warranty & AMC Details (Display Information Only) */}
                  <div className="space-y-2">
                    <Label className="text-[13px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
                      <Clock size={15} strokeWidth={2.5} className="text-primary" />
                      Warranty &amp; AMC Details
                    </Label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Warranty Info Card */}
                      <div className="p-3.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-white/5 space-y-2 shadow-sm">
                        <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-white/5">
                          <span className="text-[11px] font-extrabold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                            Warranty Info
                          </span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            {selectedMachine?.all_warranty || watch('warranty_status') || 'Non Warranty'}
                          </span>
                        </div>
                        <div className="text-xs space-y-1.5 text-gray-700 dark:text-gray-300 font-semibold pt-0.5">
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-medium">Start Date:</span>
                            <span>
                              {selectedMachine?.warranty_start_date
                                ? new Date(selectedMachine.warranty_start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                : selectedMachine?.installation_date
                                ? new Date(selectedMachine.installation_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                : '-'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-medium">End Date:</span>
                            <span>
                              {selectedMachine?.warranty_closing_date
                                ? new Date(selectedMachine.warranty_closing_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                : '-'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-medium">Duration:</span>
                            <span>
                              {(() => {
                                const m = selectedMachine?.warranty_months;
                                const y = selectedMachine?.warranty_years;
                                const total = (m !== undefined && m !== null && m > 0) ? m : ((y !== undefined && y !== null && y > 0) ? y * 12 : 0);
                                return total > 0 ? `${total} Months` : '-';
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* AMC Info Card */}
                      <div className="p-3.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-white/5 space-y-2 shadow-sm">
                        <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-white/5">
                          <span className="text-[11px] font-extrabold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                            AMC Info
                          </span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {selectedMachine?.amc_particular || '-'}
                          </span>
                        </div>
                        <div className="text-xs space-y-1.5 text-gray-700 dark:text-gray-300 font-semibold pt-0.5">
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-medium">Start Date:</span>
                            <span>
                              {selectedMachine?.amc_starting_date
                                ? new Date(selectedMachine.amc_starting_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                : '-'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-medium">End Date:</span>
                            <span>
                              {selectedMachine?.amc_closing_date
                                ? new Date(selectedMachine.amc_closing_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                : '-'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 font-medium">Duration:</span>
                            <span>
                              {selectedMachine?.amc_period
                                ? `${selectedMachine.amc_period} Months`
                                : '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                          {/* Material Selection */}
                <div data-field="material_ids" className="space-y-2">
                  <Label className="text-[13px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
                    <Package size={15} strokeWidth={2.5} className="text-primary" />
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

                  {/* Dynamic quantities input for each selected material */}
                  {materialQuantitiesWatch.length > 0 && (
                    <div className="space-y-3 mt-3 p-3.5 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl">
                      <Label className="text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-1">
                        Configure Material Quantities &amp; Dynamic Unit Fields
                      </Label>
                      {materialQuantitiesWatch.map((item, index) => {
                        const mat = allMaterials.find((m) => m.id === item.material_id);
                        const matName = mat ? mat.name : 'Loading Material...';
                        const isExpanded = !!expandedMaterials[item.material_id];

                        return (
                          <div
                            key={item.material_id}
                            className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm space-y-2.5"
                          >
                            {/* Material Header: Toggle + Name on Left | Stock Status + Qty on Right */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedMaterials((prev) => ({
                                      ...prev,
                                      [item.material_id]: !prev[item.material_id],
                                    }));
                                  }}
                                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                                  title={isExpanded ? 'Collapse fields' : 'Click dropdown button to open input fields'}
                                >
                                  {isExpanded ? (
                                    <ChevronUp size={18} className="text-primary font-bold" />
                                  ) : (
                                    <ChevronDown size={18} className="text-gray-400 hover:text-primary transition-colors font-bold" />
                                  )}
                                </button>
                                <Package size={15} strokeWidth={2.5} className="text-primary shrink-0" />
                                <span className="text-xs font-black text-gray-800 dark:text-gray-200 truncate">
                                  {matName}
                                </span>
                                {!isExpanded && (() => {
                                  const qty = Number(item.quantity) || 1;
                                  const filledCount = item.serial_numbers?.filter((s) => s && s.trim()).length || 0;
                                  const isAllFilled = qty > 0 && filledCount === qty;
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => setExpandedMaterials((prev) => ({ ...prev, [item.material_id]: true }))}
                                      className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer shrink-0",
                                        isAllFilled
                                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                                          : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 animate-pulse"
                                      )}
                                    >
                                      {isAllFilled ? `${filledCount}/${qty} Barcodes Set` : `Barcodes Required (${filledCount}/${qty})`}
                                    </button>
                                  );
                                })()}
                              </div>

                              <div className="flex items-center gap-3 flex-shrink-0">
                                {/* Stock Type dropdown per material */}
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:inline">Stock Type:</span>
                                  <Select
                                    onValueChange={(val) => {
                                      const current = watch('material_quantities') || [];
                                      setValue(
                                        'material_quantities',
                                        current.map((q) =>
                                          q.material_id === item.material_id
                                            ? { ...q, stock_type: val || 'Inflow' }
                                            : q
                                        ),
                                        { shouldDirty: true }
                                      );
                                    }}
                                    value={item.stock_type || 'Inflow'}
                                  >
                                    <SelectTrigger className="h-8 w-32 bg-gray-50/80 dark:bg-white/5 border-none rounded-lg focus:ring-1 focus:ring-primary/20 font-bold text-xs">
                                      <SelectValue placeholder="Stock Type" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-100 shadow-xl z-[9999]">
                                      <SelectItem value="Inflow" className="font-bold text-xs py-2 text-emerald-500">Inflow</SelectItem>
                                      <SelectItem value="From Store" className="font-bold text-xs py-2 text-purple-500">From Store</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* QTY counter input */}
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">QTY:</span>
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder="1"
                                    className="w-16 h-8 bg-gray-50 dark:bg-white/5 border-none rounded-lg focus-visible:ring-1 focus-visible:ring-primary/20 font-bold text-right text-xs"
                                    value={item.quantity === undefined || item.quantity === null ? '' : item.quantity}
                                    onChange={(e) => {
                                      const rawVal = e.target.value.replace(/\D/g, '');
                                      const val = rawVal === '' ? ('' as any) : parseInt(rawVal, 10);
                                      const targetQty = typeof val === 'number' && val > 0 ? val : 1;
                                      const currentSerials = item.serial_numbers || [];
                                      const startCode = barcodeRanges[item.material_id]?.start || currentSerials[0] || '';
                                      
                                      let newSerials: string[];
                                      if (startCode.trim()) {
                                        newSerials = generateContinuousBarcodes(startCode, targetQty);
                                        const endCode = newSerials[newSerials.length - 1] || '';
                                        setBarcodeRanges((prev) => ({
                                          ...prev,
                                          [item.material_id]: { start: startCode, end: endCode },
                                        }));
                                      } else {
                                        newSerials = [...currentSerials];
                                        if (targetQty > currentSerials.length) {
                                          for (let i = currentSerials.length; i < targetQty; i++) {
                                            newSerials.push('');
                                          }
                                        } else {
                                          newSerials = newSerials.slice(0, targetQty);
                                        }
                                      }
                                      const nextQuantities = materialQuantitiesWatch.map((q, idx) =>
                                        idx === index ? { ...q, quantity: val, serial_numbers: newSerials } : q
                                      );
                                      setValue('material_quantities', nextQuantities, { shouldDirty: true });
                                    }}
                                    onBlur={() => {
                                      if (!item.quantity || Number(item.quantity) < 1) {
                                        const startCode = barcodeRanges[item.material_id]?.start || item.serial_numbers?.[0] || '';
                                        const newSerials = startCode.trim() ? generateContinuousBarcodes(startCode, 1) : [''];
                                        const nextQuantities = materialQuantitiesWatch.map((q, idx) =>
                                          idx === index ? { ...q, quantity: 1, serial_numbers: newSerials } : q
                                        );
                                        setValue('material_quantities', nextQuantities, { shouldDirty: true });
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Dynamic Input Fields (Appears ONLY after clicking the dropdown button) */}
                            {isExpanded && (() => {
                              const qty = Number(item.quantity) || 1;
                              const currentStart = barcodeRanges[item.material_id]?.start ?? (item.serial_numbers?.[0] || '');
                              const currentEnd = barcodeRanges[item.material_id]?.end ?? (calculateEndBarcode(currentStart, qty) || (item.serial_numbers?.[qty - 1] || ''));
                              const isAllFilled = qty > 0 && Array.from({ length: qty }).every((_, u) => !!item.serial_numbers?.[u]?.trim());
                              const isShowAllUnits = showAllUnitsMap[item.material_id] ?? (qty <= 8);

                              return (
                                <div className="pt-2 border-t border-gray-100 dark:border-white/5 space-y-3 animate-in fade-in-0 duration-200">
                                  {/* Header bar */}
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <span className="text-[11px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                                      <Hash size={12} className="text-primary" />
                                      Unit Barcodes ({qty} {qty === 1 ? 'required code' : 'required codes'})
                                      <span className="text-rose-500 font-black">*</span>
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleAutoGenerateBarcodes(item.material_id)}
                                        className="h-6 px-2 text-[10px] font-black rounded-lg border-primary/30 text-primary hover:bg-primary/10 transition-all gap-1 shadow-xs"
                                      >
                                        <Sparkles size={10} />
                                        Auto-Generate Random
                                      </Button>
                                      <span className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-200/50 dark:border-rose-500/20">
                                        Mandatory (Max 8 Chars)
                                      </span>
                                    </div>
                                  </div>

                                  {/* Continuous Starting & Ending Codes Generator Card */}
                                  <div className="p-3.5 bg-gradient-to-r from-primary/5 via-primary/[0.08] to-primary/5 dark:from-primary/10 dark:via-primary/15 dark:to-primary/10 rounded-2xl border border-primary/25 space-y-2.5 shadow-xs">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                      <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                          <ListOrdered size={14} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                          <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider block">
                                            Continuous Barcode Range
                                          </span>
                                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                                            Enter Starting code to auto-populate continuous sequence for all {qty} units
                                          </span>
                                        </div>
                                      </div>
                                      {isAllFilled && currentStart && currentEnd && (
                                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                                          <Check size={11} strokeWidth={3} />
                                          Sequence: {currentStart} → {currentEnd} ({qty} units)
                                        </span>
                                      )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end pt-1">
                                      <div className="sm:col-span-5 space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                          Starting Code *
                                        </label>
                                        <Input
                                          type="text"
                                          maxLength={8}
                                          placeholder="e.g. BC-70001 or 10001"
                                          value={currentStart}
                                          onChange={(e) => handleStartBarcodeChange(item.material_id, e.target.value, qty)}
                                          className="h-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl font-mono font-bold text-xs tracking-wider focus-visible:ring-2 focus-visible:ring-primary/20 shadow-xs"
                                        />
                                      </div>

                                      <div className="hidden sm:flex sm:col-span-1 justify-center items-center pb-2.5 text-primary/60">
                                        <ArrowRight size={18} strokeWidth={2.5} />
                                      </div>

                                      <div className="sm:col-span-4 space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                          Ending Code (Auto-Calculated)
                                        </label>
                                        <Input
                                          type="text"
                                          maxLength={8}
                                          placeholder="e.g. BC-70050"
                                          value={currentEnd}
                                          onChange={(e) => handleEndBarcodeChange(item.material_id, e.target.value)}
                                          className="h-10 bg-gray-50/70 dark:bg-gray-900/60 border border-gray-200 dark:border-white/10 rounded-xl font-mono font-bold text-xs tracking-wider text-gray-700 dark:text-gray-300"
                                        />
                                      </div>

                                      <div className="sm:col-span-2">
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={() => applyContinuousRange(item.material_id, currentStart, qty)}
                                          className="w-full h-10 rounded-xl font-bold text-xs bg-primary hover:bg-primary/90 text-white gap-1.5 shadow-sm transition-all cursor-pointer"
                                        >
                                          <Sparkles size={13} />
                                          Apply Range
                                        </Button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Individual Unit Fields Section */}
                                  <div className="space-y-2 pt-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Individual Unit Barcodes ({qty} Units)
                                      </span>
                                      {qty > 8 && (
                                        <button
                                          type="button"
                                          onClick={() => setShowAllUnitsMap((prev) => ({ ...prev, [item.material_id]: !isShowAllUnits }))}
                                          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                          {isShowAllUnits ? (
                                            <>Collapse Individual Units <ChevronUp size={12} /></>
                                          ) : (
                                            <>View / Edit All {qty} Units <ChevronDown size={12} /></>
                                          )}
                                        </button>
                                      )}
                                    </div>

                                    {isShowAllUnits && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                        {Array.from({ length: qty }).map((_, unitIdx) => {
                                          const val = item.serial_numbers?.[unitIdx] || '';
                                          const isMissing = !val.trim();

                                          return (
                                            <div key={unitIdx} className="space-y-1.5">
                                              <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-black text-gray-800 dark:text-gray-200">
                                                  Unit {unitIdx + 1} Barcode <span className="text-rose-500 font-black">*</span>
                                                </span>
                                                {isMissing ? (
                                                  <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">Required</span>
                                                ) : (
                                                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">{val.length}/8 Chars</span>
                                                )}
                                              </div>
                                              <Input
                                                type="text"
                                                maxLength={8}
                                                placeholder={`Enter barcode (e.g. BC-7000${unitIdx + 1})`}
                                                value={val}
                                                onChange={(e) => handleSerialNumberChange(item.material_id, unitIdx, e.target.value)}
                                                className={cn(
                                                  "h-10 rounded-xl font-mono font-bold text-xs transition-all tracking-wider",
                                                  isMissing
                                                    ? "bg-rose-50/50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/40 text-gray-900 dark:text-white"
                                                    : "bg-emerald-50/30 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-gray-900 dark:text-white"
                                                )}
                                              />
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}

                      {/* Edit & Save Buttons at the end of Material Selection */}
                      <div className="flex items-center justify-end gap-3 pt-3 mt-3 border-t border-gray-100 dark:border-white/5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const allExp: Record<string, boolean> = {};
                            materialQuantitiesWatch.forEach((q) => {
                              allExp[q.material_id] = true;
                            });
                            setExpandedMaterials(allExp);
                            toast.info('Material input fields expanded for editing');
                          }}
                          className="h-9 px-5 rounded-xl border-gray-200 dark:border-white/10 hover:bg-gray-100 font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <Edit3 size={13} />
                          Edit
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            // Check if any unit input field is empty
                            const missingMap: Record<string, boolean> = {};
                            let hasMissingUnit = false;

                            materialQuantitiesWatch.forEach((q) => {
                              const serials = q.serial_numbers || [];
                              for (let u = 0; u < q.quantity; u++) {
                                if (!serials[u] || !serials[u].trim()) {
                                  hasMissingUnit = true;
                                  missingMap[q.material_id] = true;
                                  break;
                                }
                              }
                            });

                            if (hasMissingUnit) {
                              setExpandedMaterials((prev) => ({ ...prev, ...missingMap }));
                              toast.error('All dynamic unit fields (Unit 1, Unit 2, etc.) are mandatory! Please fill in all unit codes.');
                              return;
                            }

                            setExpandedMaterials({});
                            toast.success('Material selection saved!');
                          }}
                          className="h-9 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
                        >
                          <Check size={14} strokeWidth={2.5} />
                          Save
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Premium inline material creation section */}
                  <div className="pt-2 pb-1">
                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t border-gray-100 dark:border-white/5"></div>
                      <span className="flex-shrink mx-4 text-[10px] text-gray-500 font-black uppercase tracking-wider">Or create new material</span>
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
                <div data-field="quantity" className="space-y-2">
                  <Label className="text-[13px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
                    <Hash size={15} strokeWidth={2.5} className="text-primary" />
                    Total Quantity (Auto-Calculated)
                  </Label>
                  <Input
                    type="text"
                    readOnly
                    disabled
                    placeholder="Total quantity"
                    className="h-11 bg-gray-100/50 dark:bg-white/5 border-none rounded-xl font-bold cursor-not-allowed opacity-75"
                    value={totalQuantity}
                  />
                  {errors.quantity && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.quantity.message}</p>}
                </div>

                {/* Frame Number */}
                <div data-field="frame_number" className="space-y-2">
                  <Label className="text-[13px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
                    <Hash size={15} strokeWidth={2.5} className="text-primary" />
                    Frame Number
                  </Label>
                  <Input
                    placeholder="e.g. FRM10245"
                    className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                    {...register('frame_number')}
                  />
                  {errors.frame_number && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.frame_number.message}</p>}
                </div>

                {/* Provider Name */}
                <div data-field="provider_name" className="space-y-2">
                  <Label className="text-[13px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
                    <Users size={15} strokeWidth={2.5} className="text-primary" />
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
                <div data-field="invoice_number" className="space-y-2">
                  <Label className="text-[13px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
                    <Hash size={15} strokeWidth={2.5} className="text-primary" />
                    Shipment Number (Optional)
                  </Label>
                  <Input
                    placeholder="e.g. INV-10024"
                    className="h-11 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold"
                    {...register('invoice_number')}
                  />
                  {errors.invoice_number && <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.invoice_number.message}</p>}
                </div>

                {/* Remarks */}
                <div data-field="remarks" className="space-y-2">
                  <Label className="text-[13px] font-black text-primary uppercase tracking-wider flex items-center gap-2">
                    Remarks (Optional)
                  </Label>
                  <Textarea
                    placeholder="Enter remarks..."
                    className="min-h-[100px] bg-gray-50/50 dark:bg-white/5 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-primary/20 font-bold text-xs"
                    {...register('remarks')}
                  />
                </div>
              </div>
            </form>
          )}
          </div>
        </div>

        <SheetFooter className="p-4 bg-white/90 dark:bg-gray-955/90 backdrop-blur-md border-t border-gray-100 dark:border-white/5">
          <div className="w-full flex gap-3">
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
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">
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
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">
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
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">
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
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">
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
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">
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
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">
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
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">
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
                Register Master Record
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400">
                Add a new machine installation/service record for the selected mill: 
                <strong> {mills.find(m => m.id === selectedMillId)?.name}</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-hide">
              {/* Invoice No */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">
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
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">
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
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">
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
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">
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
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">
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
                <Label className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">
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
                  <Label className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">Warranty Period (Months)</Label>
                  <Input
                    type="number"
                    value={quickWarrantyMonths}
                    onChange={(e) => setQuickWarrantyMonths(Number(e.target.value))}
                    placeholder="e.g. 12 or 18"
                    className="h-10 bg-gray-50/50 dark:bg-white/5 border-none rounded-xl font-bold text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-200">Warranty</Label>
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
                      <SelectItem value="Under AMC" className="font-bold py-2 text-xs">Under AMC</SelectItem>
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
