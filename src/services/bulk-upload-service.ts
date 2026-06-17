import api from '@/lib/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
    PreviewResponse,
    ImportStatus,
    ServiceReportPreviewResponse,
    ServiceReportImportStatus,
} from '@/types/bulk-upload';

/**
 * Step 1 → 2: upload file, receive preview.
 * Wraps the file in FormData with key `file` and posts to previewEndpoint.
 */
export function useUploadPreview(previewEndpoint: string) {
    return useMutation<PreviewResponse, Error, File>({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await api.post<PreviewResponse>(previewEndpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data;
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to upload file');
        },
    });
}

/**
 * Generic Step 1 → 2 for any module: returns a typed PreviewResponse.
 * Used by ServiceReport bulk upload which has its own response shape.
 */
export function useUploadPreviewGeneric<T>(previewEndpoint: string) {
    return useMutation<T, Error, File>({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await api.post<T>(previewEndpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data;
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to upload file');
        },
    });
}

/**
 * Step 2 → 3: confirm import by importId.
 * Posts { importId } to importEndpoint.
 */
export function useConfirmImport(importEndpoint: string) {
    return useMutation<void, Error, string>({
        mutationFn: async (importId: string) => {
            await api.post(importEndpoint, { importId });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to start import');
        },
    });
}

/**
 * Step 3: poll import status (master mills shape).
 * Stops polling automatically when state is 'completed' or 'failed'.
 */
export function useImportStatus(
    importId: string | null,
    statusEndpoint: string,
    enabled: boolean,
) {
    return useQuery<ImportStatus>({
        queryKey: ['import-status', importId],
        queryFn: async () => {
            const { data } = await api.get<ImportStatus>(`${statusEndpoint}/${importId}`);
            return data;
        },
        enabled: enabled && !!importId,
        refetchInterval: (query) => {
            const data = query.state.data;
            if (data?.state === 'completed' || data?.state === 'failed') {
                return false;
            }
            return 1000;
        },
    });
}

/**
 * Step 3: poll service report import status.
 * Identical stop condition logic, but typed to ServiceReportImportStatus.
 */
export function useServiceReportImportStatus(
    importId: string | null,
    statusEndpoint: string,
    enabled: boolean,
) {
    return useQuery<ServiceReportImportStatus>({
        queryKey: ['sr-import-status', importId],
        queryFn: async () => {
            const { data } = await api.get<ServiceReportImportStatus>(
                `${statusEndpoint}/${importId}`,
            );
            return data;
        },
        enabled: enabled && !!importId,
        refetchInterval: (query) => {
            const data = query.state.data;
            if (data?.state === 'completed' || data?.state === 'failed') {
                return false;
            }
            return 1000;
        },
    });
}

/**
 * Triggers a browser download of the template file at templateEndpoint.
 * Uses axios so auth interceptors apply.
 */
export async function downloadTemplate(templateEndpoint: string): Promise<void> {
    try {
        const response = await api.get(templateEndpoint, { responseType: 'blob' });
        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Derive filename from Content-Disposition if present, else fallback
        const disposition: string =
            response.headers['content-disposition'] || '';
        const match = disposition.match(/filename="?([^"]+)"?/);
        a.download = match?.[1] ?? 'template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch {
        toast.error('Failed to download template. Please try again.');
    }
}

// ─── Service Report convenience hooks (endpoint-bound) ───────────────────────

const SR_ENDPOINTS = {
    preview: '/service-reports/bulk-upload/preview',
    import: '/service-reports/bulk-upload/import',
    status: '/service-reports/bulk-upload/status',
    template: '/service-reports/bulk-upload/template',
} as const;

/**
 * Convenience hook: upload a service report Excel file and receive a typed preview.
 */
export function useServiceReportUploadPreview() {
    return useUploadPreviewGeneric<ServiceReportPreviewResponse>(SR_ENDPOINTS.preview);
}

/**
 * Convenience hook: confirm a service report bulk import.
 */
export function useServiceReportConfirmImport() {
    return useConfirmImport(SR_ENDPOINTS.import);
}

export { SR_ENDPOINTS };

