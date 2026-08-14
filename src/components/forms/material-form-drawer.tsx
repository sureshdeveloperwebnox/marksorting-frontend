"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  FileText,
  CheckCircle2,
  Loader2,
  Ruler,
} from "lucide-react";
import { useCreateMaterial, useUpdateMaterial, Material } from "@/services/store-service";

const materialSchema = z.object({
  name: z.string().min(1, "Material Name is required"),
  uom: z.string().optional(),
  description: z.string().optional(),
  status: z.string(),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

interface MaterialFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  material?: Material | null;
}

export function MaterialFormDrawer({
  isOpen,
  onClose,
  material,
}: MaterialFormDrawerProps) {
  const isEdit = Boolean(material);
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: "",
      uom: "PCS",
      description: "",
      status: "ACTIVE",
    },
  });

  React.useEffect(() => {
    if (material) {
      reset({
        name: material.name || "",
        uom: material.uom || "PCS",
        description: material.description || "",
        status: material.status || "ACTIVE",
      });
    } else {
      reset({
        name: "",
        uom: "PCS",
        description: "",
        status: "ACTIVE",
      });
    }
  }, [material, reset, isOpen]);

  const onSubmit = async (values: MaterialFormValues) => {
    if (isEdit && material) {
      await updateMaterial.mutateAsync({
        id: material.id,
        data: values,
      });
    } else {
      await createMaterial.mutateAsync(values);
    }
    onClose();
  };

  const isSubmitting = createMaterial.isPending || updateMaterial.isPending;

  return (
    <Sheet open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent side="right">
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Package size={24} />
            </div>
            <div>
              <SheetTitle className="text-xl">
                {isEdit ? "Edit Material Master" : "Add Material Master"}
              </SheetTitle>
              <SheetDescription>
                {isEdit
                  ? "Update details of the material item."
                  : "Register a new material for inventory and store returns."}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide pb-24 space-y-6">
            {/* Material Name */}
            <div className="space-y-2">
              <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <Package size={14} className="text-primary/70" />
                Material Name <span className="text-rose-500 font-black">*</span>
              </Label>
              <Input
                {...register("name")}
                placeholder="e.g. Sensor Board TT-20, Ejector Valve..."
                className="h-11 rounded-xl"
              />
              {errors.name && (
                <p className="text-[11px] text-rose-500 font-bold ml-1">{errors.name.message}</p>
              )}
            </div>

            {/* UOM (Unit of Measurement) */}
            <div className="space-y-2">
              <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <Ruler size={14} className="text-primary/70" />
                UOM (Unit of Measurement)
              </Label>
              <Controller
                name="uom"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || "PCS"}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Select UOM..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="PCS">PCS (Pieces)</SelectItem>
                      <SelectItem value="NOS">NOS (Numbers)</SelectItem>
                      <SelectItem value="SET">SET (Sets)</SelectItem>
                      <SelectItem value="KG">KG (Kilograms)</SelectItem>
                      <SelectItem value="MTR">MTR (Meters)</SelectItem>
                      <SelectItem value="BOX">BOX (Boxes)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={14} className="text-primary/70" />
                Status
              </Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || "ACTIVE"}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Select Status..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Description / Remarks */}
            <div className="space-y-2">
              <Label className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} className="text-primary/70" />
                Description / Notes
              </Label>
              <textarea
                {...register("description")}
                placeholder="Enter any additional details or specifications..."
                className="w-full min-h-[100px] p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 font-medium text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white transition-all"
              />
            </div>
          </div>

          {/* Footer */}
          <SheetFooter className="p-4 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-t border-gray-100 dark:border-white/5 shrink-0 mt-auto">
            <div className="w-full flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-white/10 font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-white font-bold shadow-lg shadow-primary/25"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEdit ? (
                  "Update Material"
                ) : (
                  "Save Material"
                )}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
