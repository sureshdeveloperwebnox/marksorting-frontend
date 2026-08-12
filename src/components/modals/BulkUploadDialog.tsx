'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, X, Columns3 } from 'lucide-react'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    useUploadPreview,
    useConfirmImport,
    useImportStatus,
    downloadTemplate,
} from '@/services/bulk-upload-service'
import type { PreviewRow, PreviewResponse, ImportStatus, ColumnConfig } from '@/types/bulk-upload'

// ---------------------------------------------------------------------------
// Props interface
// ---------------------------------------------------------------------------

export interface BulkUploadDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    previewEndpoint: string
    importEndpoint: string
    statusEndpoint: string
    templateEndpoint: string
    columnConfig: ColumnConfig[]
}

// ---------------------------------------------------------------------------
// UploadStep
// ---------------------------------------------------------------------------

interface UploadStepProps {
    templateEndpoint: string
    previewEndpoint: string
    onPreviewReady: (data: PreviewResponse) => void
}

function UploadStep({ templateEndpoint, previewEndpoint, onPreviewReady }: UploadStepProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [sizeError, setSizeError] = useState<string | null>(null)
    const [isDownloading, setIsDownloading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const MAX_SIZE = 15 * 1024 * 1024 // 15 MB

    const uploadPreviewMutation = useUploadPreview(previewEndpoint)

    const validateAndSetFile = useCallback((file: File) => {
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            setSizeError('Only .xlsx and .xls files are accepted.')
            setSelectedFile(null)
            return
        }
        if (file.size > MAX_SIZE) {
            setSizeError('File exceeds the 15 MB size limit. Please upload a smaller file.')
            setSelectedFile(null)
            return
        }
        setSizeError(null)
        setSelectedFile(file)
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(false)
            const file = e.dataTransfer.files?.[0]
            if (file) validateAndSetFile(file)
        },
        [validateAndSetFile],
    )

    const handleFileInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file) validateAndSetFile(file)
        },
        [validateAndSetFile],
    )

    const handleUpload = useCallback(() => {
        if (!selectedFile) return
        uploadPreviewMutation.mutate(selectedFile, {
            onSuccess: (data) => {
                onPreviewReady(data)
            },
        })
    }, [selectedFile, uploadPreviewMutation, onPreviewReady])

    return (
        <div className="flex flex-col gap-4">
            {/* Dropzone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={[
                    'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors',
                    isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-white/10 hover:border-primary/50 hover:bg-primary/5',
                ].join(' ')}
            >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-primary" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Drag &amp; drop your Excel file here
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        or click to browse &nbsp;·&nbsp; .xlsx and .xls only &nbsp;·&nbsp; max 15 MB
                    </p>
                </div>
                {selectedFile && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-primary font-medium">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>{selectedFile.name}</span>
                    </div>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileInputChange}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>

            {/* Inline size / type error */}
            {sizeError && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{sizeError}</span>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 mt-1">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={isDownloading}
                    onClick={async (e) => {
                        e.stopPropagation()
                        setIsDownloading(true)
                        await downloadTemplate(templateEndpoint)
                        setIsDownloading(false)
                    }}
                    className="gap-2"
                >
                    {isDownloading ? (
                        <>
                            <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                            Downloading…
                        </>
                    ) : (
                        <>
                            <Download className="w-4 h-4" />
                            Download Sample
                        </>
                    )}
                </Button>

                <Button
                    size="sm"
                    disabled={!selectedFile || uploadPreviewMutation.isPending}
                    onClick={(e) => {
                        e.stopPropagation()
                        handleUpload()
                    }}
                    className="gap-2"
                >
                    {uploadPreviewMutation.isPending ? (
                        <>
                            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            Uploading…
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4" />
                            Upload
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// PreviewStep
// ---------------------------------------------------------------------------

type PreviewTab = 'all' | 'valid' | 'errors'

interface PreviewStepProps {
    rows: PreviewRow[]
    columnConfig: ColumnConfig[]
    importEndpoint: string
    previewData: PreviewResponse
    onImport: (importId: string) => void
    onCancel: () => void
}

function PreviewStep({
    rows,
    columnConfig,
    importEndpoint,
    previewData,
    onImport,
    onCancel,
}: PreviewStepProps) {
    const [activeTab, setActiveTab] = useState<PreviewTab>('all')
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(
        () => new Set(columnConfig.map((c) => c.key as string)),
    )
    const [showColPicker, setShowColPicker] = useState(false)
    const colPickerRef = useRef<HTMLDivElement>(null)

    // Close col-picker when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node)) {
                setShowColPicker(false)
            }
        }
        if (showColPicker) document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [showColPicker])

    const confirmImportMutation = useConfirmImport(importEndpoint)

    const validCount = rows.filter((r) => r.isValid).length
    const invalidCount = rows.filter((r) => !r.isValid).length

    const filteredRows =
        activeTab === 'valid'
            ? rows.filter((r) => r.isValid)
            : activeTab === 'errors'
                ? rows.filter((r) => !r.isValid)
                : rows

    const visibleColumns = columnConfig.filter((c) => visibleKeys.has(c.key as string))

    const toggleColumn = (key: string) => {
        setVisibleKeys((prev) => {
            const next = new Set(prev)
            if (next.has(key)) {
                // keep at least 1 visible
                if (next.size > 1) next.delete(key)
            } else {
                next.add(key)
            }
            return next
        })
    }

    const handleImport = useCallback(() => {
        confirmImportMutation.mutate(previewData.importId, {
            onSuccess: () => {
                onImport(previewData.importId)
            },
        })
    }, [confirmImportMutation, previewData.importId, onImport])

    const tabClass = (tab: PreviewTab) =>
        [
            'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
            activeTab === tab
                ? 'bg-primary text-white'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5',
        ].join(' ')

    const errorCellClass =
        'bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-700'

    return (
        <div className="flex flex-col gap-3">
            {/* Summary + column toggle */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                        Valid:{' '}
                        <span
                            data-testid="valid-count"
                            className="font-bold text-green-600 dark:text-green-400"
                        >
                            {validCount}
                        </span>
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                        Invalid:{' '}
                        <span
                            data-testid="invalid-count"
                            className="font-bold text-red-500 dark:text-red-400"
                        >
                            {invalidCount}
                        </span>
                    </span>
                    <span className="text-gray-400 dark:text-gray-600">Total: {rows.length}</span>
                </div>

                {/* Column visibility toggle */}
                <div className="relative" ref={colPickerRef}>
                    <button
                        type="button"
                        onClick={() => setShowColPicker((v) => !v)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <Columns3 className="w-3.5 h-3.5" />
                        Columns ({visibleKeys.size}/{columnConfig.length})
                    </button>

                    {showColPicker && (
                        <div className="absolute right-0 top-full mt-1.5 z-50 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/10 rounded-xl shadow-xl p-3 min-w-[200px] max-h-72 overflow-y-auto">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Toggle Columns
                                </span>
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setVisibleKeys(new Set(columnConfig.map((c) => c.key as string)))}
                                        className="text-[10px] text-primary font-semibold hover:underline"
                                    >
                                        All
                                    </button>
                                    <span className="text-gray-300 dark:text-gray-700">·</span>
                                    <button
                                        type="button"
                                        onClick={() => setVisibleKeys(new Set([columnConfig[0].key as string]))}
                                        className="text-[10px] text-gray-400 font-semibold hover:underline"
                                    >
                                        Min
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1">
                                {columnConfig.map((col) => {
                                    const key = col.key as string
                                    const checked = visibleKeys.has(key)
                                    return (
                                        <label
                                            key={key}
                                            className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => toggleColumn(key)}
                                                className="w-3.5 h-3.5 accent-primary"
                                            />
                                            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                                                {col.header}
                                            </span>
                                        </label>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1">
                <button type="button" className={tabClass('all')} onClick={() => setActiveTab('all')}>
                    All Rows
                </button>
                <button type="button" className={tabClass('valid')} onClick={() => setActiveTab('valid')}>
                    Valid Rows Only
                </button>
                <button type="button" className={tabClass('errors')} onClick={() => setActiveTab('errors')}>
                    Errors Only
                </button>
            </div>

            {/* Table */}
            <div className="overflow-auto max-h-[55vh] rounded-xl border border-gray-100 dark:border-white/5">
                <table className="w-full text-xs border-collapse min-w-max">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10">
                        <tr>
                            <th className="px-2 py-2 text-left font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/5 w-10">
                                #
                            </th>
                            {visibleColumns.map((col) => (
                                <th
                                    key={col.key}
                                    className="px-2 py-2 text-left font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-white/5 whitespace-nowrap"
                                    style={col.width ? { width: col.width } : undefined}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRows.map((row) => (
                            <tr
                                key={row.rowIndex}
                                className={
                                    row.isValid
                                        ? 'hover:bg-gray-50 dark:hover:bg-white/2'
                                        : 'hover:bg-red-50/50 dark:hover:bg-red-950/10'
                                }
                            >
                                <td className="px-2 py-1.5 text-gray-400 border-b border-gray-50 dark:border-white/3">
                                    {row.rowIndex + 1}
                                </td>
                                {visibleColumns.map((col) => {
                                    const errorMsg = row.errors[col.key as string]
                                    const cellValue = row[col.key as keyof Omit<PreviewRow, 'errors' | 'isValid' | 'rowIndex'>] as string
                                    return (
                                        <td
                                            key={col.key}
                                            data-field={col.key}
                                            className={[
                                                'px-2 py-1.5 border-b border-gray-50 dark:border-white/3 whitespace-nowrap',
                                                errorMsg ? errorCellClass : '',
                                            ]
                                                .filter(Boolean)
                                                .join(' ')}
                                        >
                                            {errorMsg ? (
                                                <div title={errorMsg} className="cursor-help">
                                                    {cellValue || <span className="text-red-400 italic">missing</span>}
                                                </div>
                                            ) : (
                                                cellValue
                                            )}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                        {filteredRows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={visibleColumns.length + 1}
                                    className="py-8 text-center text-gray-400 text-sm"
                                >
                                    No rows to display.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 mt-1">
                <Button variant="outline" size="sm" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    size="sm"
                    data-testid="import-button"
                    disabled={validCount === 0 || confirmImportMutation.isPending}
                    onClick={handleImport}
                    className="gap-2"
                >
                    {confirmImportMutation.isPending ? (
                        <>
                            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            Starting…
                        </>
                    ) : (
                        `Import Valid Rows Only (${validCount})`
                    )}
                </Button>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// ProgressStep
// ---------------------------------------------------------------------------

interface ProgressStepProps {
    importId: string
    statusEndpoint: string
    onSuccess: () => void
    onClose: () => void
}

function ProgressStep({ importId, statusEndpoint, onSuccess, onClose }: ProgressStepProps) {
    const queryClient = useQueryClient()
    const { data: status, error } = useImportStatus(importId, statusEndpoint, true)

    const is404 =
        error != null &&
        typeof (error as any).response?.status === 'number' &&
        (error as any).response.status === 404

    const handleDone = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['master-mills'] })
        queryClient.invalidateQueries({ queryKey: ['master-mills-stats'] })
        onSuccess()
        onClose()
    }, [queryClient, onSuccess, onClose])

    if (is404) {
        return (
            <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                </div>
                <div className="text-center">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                        Import session data expired
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                        The import session could not be found. It may have expired before completion.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={onClose}>
                    Close
                </Button>
            </div>
        )
    }

    if (status?.state === 'failed') {
        return (
            <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
                    <X className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-center">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Import Failed</p>
                    {status.errorMessage && (
                        <p className="text-sm text-red-500 dark:text-red-400 mt-1 max-w-xs">
                            {status.errorMessage}
                        </p>
                    )}
                </div>
                <Button variant="outline" size="sm" onClick={onClose}>
                    Close
                </Button>
            </div>
        )
    }

    if (status?.state === 'completed') {
        return (
            <div className="flex flex-col items-center gap-4 py-6">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-center">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">Import Completed</p>
                    <p className="text-sm text-gray-400 mt-1">
                        All valid rows have been processed successfully.
                    </p>
                </div>
                {/* Counters */}
                <div className="flex gap-6 text-sm">
                    <div className="text-center">
                        <p className="font-bold text-green-600 dark:text-green-400">
                            <span data-testid="created-count">{status?.createdCount ?? 0}</span>
                        </p>
                        <p className="text-xs text-gray-400">Created</p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-blue-500 dark:text-blue-400">
                            <span data-testid="updated-count">{status?.updatedCount ?? 0}</span>
                        </p>
                        <p className="text-xs text-gray-400">Updated</p>
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-red-500 dark:text-red-400">
                            <span data-testid="error-count">{status?.errorCount ?? 0}</span>
                        </p>
                        <p className="text-xs text-gray-400">Errors</p>
                    </div>
                </div>
                <Button size="sm" onClick={handleDone} className="gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Done
                </Button>
            </div>
        )
    }

    // Processing state
    const percentage = status?.percentage ?? 0

    return (
        <div className="flex flex-col gap-5 py-4">
            <div className="text-center">
                <p className="font-semibold text-gray-800 dark:text-gray-200">Importing Records…</p>
                <p className="text-xs text-gray-400 mt-1">Please keep this window open.</p>
            </div>

            {/* Progress bar */}
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span>{percentage}%</span>
                </div>
                <progress
                    value={percentage}
                    max={100}
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Import progress"
                    className="w-full h-2 rounded-full overflow-hidden appearance-none [&::-webkit-progress-bar]:bg-gray-100 [&::-webkit-progress-bar]:dark:bg-gray-800 [&::-webkit-progress-value]:bg-primary [&::-webkit-progress-value]:transition-all [&::-moz-progress-bar]:bg-primary"
                />
            </div>

            {/* Live counters */}
            <div className="flex gap-6 text-sm justify-center">
                <div className="text-center">
                    <p className="font-bold text-green-600 dark:text-green-400">
                        <span data-testid="created-count">{status?.createdCount ?? 0}</span>
                    </p>
                    <p className="text-xs text-gray-400">Created</p>
                </div>
                <div className="text-center">
                    <p className="font-bold text-blue-500 dark:text-blue-400">
                        <span data-testid="updated-count">{status?.updatedCount ?? 0}</span>
                    </p>
                    <p className="text-xs text-gray-400">Updated</p>
                </div>
                <div className="text-center">
                    <p className="font-bold text-red-500 dark:text-red-400">
                        <span data-testid="error-count">{status?.errorCount ?? 0}</span>
                    </p>
                    <p className="text-xs text-gray-400">Errors</p>
                </div>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Root BulkUploadDialog
// ---------------------------------------------------------------------------

type WizardStep = 'upload' | 'preview' | 'progress'

const STEP_LABELS: Record<WizardStep, string> = {
    upload: 'Upload File',
    preview: 'Preview Data',
    progress: 'Importing',
}

export function BulkUploadDialog({
    open,
    onOpenChange,
    onSuccess,
    previewEndpoint,
    importEndpoint,
    statusEndpoint,
    templateEndpoint,
    columnConfig,
}: BulkUploadDialogProps) {
    const [step, setStep] = useState<WizardStep>('upload')
    const [importId, setImportId] = useState<string | null>(null)
    const [previewData, setPreviewData] = useState<PreviewResponse | null>(null)

    // Reset when dialog closes
    useEffect(() => {
        if (!open) {
            setStep('upload')
            setImportId(null)
            setPreviewData(null)
        }
    }, [open])

    const handlePreviewReady = useCallback((data: PreviewResponse) => {
        setPreviewData(data)
        setStep('preview')
    }, [])

    const handleImportConfirmed = useCallback((id: string) => {
        setImportId(id)
        setStep('progress')
    }, [])

    const handleClose = useCallback(() => {
        onOpenChange(false)
    }, [onOpenChange])

    // Widen the dialog for the preview step so the 18-column table is fully visible
    const dialogSizeClass =
        step === 'preview'
            ? 'w-[95vw] max-w-[95vw] lg:w-[92vw] lg:max-w-[92vw]'
            : 'sm:max-w-2xl'

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={`${dialogSizeClass} max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-white/5`}
                showCloseButton={step !== 'progress'}
            >
                <DialogHeader>
                    <DialogTitle className="text-base font-black text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-primary" />
                        Bulk Upload — {STEP_LABELS[step]}
                    </DialogTitle>
                    {/* Step indicator */}
                    <div className="flex items-center gap-1.5 mt-1">
                        {(['upload', 'preview', 'progress'] as WizardStep[]).map((s, idx) => (
                            <React.Fragment key={s}>
                                <div
                                    className={[
                                        'h-1.5 flex-1 rounded-full transition-colors',
                                        step === s
                                            ? 'bg-primary'
                                            : idx < (['upload', 'preview', 'progress'] as WizardStep[]).indexOf(step)
                                                ? 'bg-primary/40'
                                                : 'bg-gray-200 dark:bg-white/10',
                                    ].join(' ')}
                                />
                            </React.Fragment>
                        ))}
                    </div>
                </DialogHeader>

                {step === 'upload' && (
                    <UploadStep
                        templateEndpoint={templateEndpoint}
                        previewEndpoint={previewEndpoint}
                        onPreviewReady={handlePreviewReady}
                    />
                )}

                {step === 'preview' && previewData && (
                    <PreviewStep
                        rows={previewData.rows}
                        columnConfig={columnConfig}
                        importEndpoint={importEndpoint}
                        previewData={previewData}
                        onImport={handleImportConfirmed}
                        onCancel={handleClose}
                    />
                )}

                {step === 'progress' && importId && (
                    <ProgressStep
                        importId={importId}
                        statusEndpoint={statusEndpoint}
                        onSuccess={onSuccess}
                        onClose={handleClose}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}
