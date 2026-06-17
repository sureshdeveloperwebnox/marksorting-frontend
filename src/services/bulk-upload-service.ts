import api from '@/lib/api';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PreviewResponse, ImportStatus } from '@/types/bulk-upload';

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
 * Step 3: poll import status.
 * Stops polling automatically when state is 'completed' or 'failed'.
 * The enabled param controls whether polling starts.
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
 * Triggers a browser download of the template file at templateEndpoint.
 * Uses axios so the request goes through the configured API base URL and
 * includes the auth credentials (cookies/interceptors).
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
        a.download = 'master_mills_template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch {
        toast.error('Failed to download template. Please try again.');
    }
}
