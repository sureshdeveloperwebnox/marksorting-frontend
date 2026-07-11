export interface PreviewRow {
    // Raw cell values — all strings from the spreadsheet
    invoice_no: string;
    type: string;
    invoice_date: string;
    ref_no: string;
    frame_no: string;
    mc_model: string;
    mill_name: string;
    customer_name: string;
    place: string;
    state: string;
    phone_no: string;
    address: string;
    installation_date: string;
    warranty_start_date: string;
    warranty_years: string;
    warranty_months: string;
    amc_starting_date: string;
    amc_closing_date: string;
    amc_period: string;
    amc_amount: string;
    amc_particulars: string;

    // Per-field validation errors: { fieldKey: "error message" }
    errors: Record<string, string>;

    // Derived — true when errors is empty
    isValid: boolean;

    // 0-based row index in the original file (for display)
    rowIndex: number;
}

export interface PreviewResponse {
    importId: string;
    rows: PreviewRow[];
    totalRows: number;
    validRows: number;
    invalidRows: number;
}

export interface ImportStatus {
    state: 'processing' | 'completed' | 'failed';
    percentage: number;
    processedRows: number;
    createdCount: number;
    updatedCount: number;
    errorCount: number;
    errorMessage?: string;
}

export interface ColumnConfig {
    key: keyof PreviewRow;
    header: string;
    width?: number;
}

// ─── Service Report Bulk Upload ───────────────────────────────────────────────

export interface ServiceReportPreviewRow {
    mill_name: string;
    place: string;
    service_category_name: string;
    technician_names: string;
    visit_date: string;
    visit_time: string;
    call_registered_date: string;
    mill_whatsapp_number: string;
    mill_email: string;
    machine_model: string;
    machine_mfg_date: string;
    machine_installation_date: string;
    serial_or_frame_no: string;
    authorized_person: string;
    authorized_person_phone: string;
    previous_visit_engineer: string;
    nature_of_complaint: string;
    problem_observed: string;
    action_taken: string;
    commodity: string;
    contamination: string;
    output_capacity_per_hour: string;
    rejection_ratio: string;
    purity: string;
    no_of_programs_set: string;
    ac_provided: string;
    compressor_details: string;
    air_drier_details: string;
    line_filter_condition: string;
    machine_filter_condition: string;
    auto_drain_valve_working: string;
    engineer_remarks: string;
    customer_remarks: string;
    status: string;

    errors: Record<string, string>;
    isValid: boolean;
    rowIndex: number;
}

export interface ServiceReportPreviewResponse {
    importId: string;
    rows: ServiceReportPreviewRow[];
    totalRows: number;
    validRows: number;
    invalidRows: number;
}

export interface ServiceReportImportStatus {
    state: 'processing' | 'completed' | 'failed';
    percentage: number;
    processedRows: number;
    createdCount: number;
    errorCount: number;
    errorMessage?: string;
}

export interface ServiceReportColumnConfig {
    key: keyof ServiceReportPreviewRow;
    header: string;
    width?: number;
}

// ─── Installation Report Bulk Upload ─────────────────────────────────────────

export interface InstallationReportPreviewRow {
    mill_name: string;
    place: string;
    technician_names: string;
    visit_date: string;
    visit_time: string;
    call_registered_date: string;
    mill_whatsapp_number: string;
    mill_email: string;
    machine_model: string;
    machine_mfg_date: string;
    serial_or_frame_no: string;
    authorized_person: string;
    authorized_person_phone: string;
    invoice_number: string;
    invoice_date: string;
    warranty_start_date: string;
    warranty_end_date: string;
    commodity: string;
    contamination: string;
    output_capacity_per_hour: string;
    rejection_ratio: string;
    purity: string;
    no_of_programs_set: string;
    ac_provided: string;
    compressor_details: string;
    air_drier_details: string;
    ground_earth_provided: string;
    running_channel_combination: string;
    running_channel_combination_value: string;
    no_of_filters_installed: string;
    oil_filter_condition: string;
    line_filter_condition: string;
    auto_drain_valve_working: string;
    engineer_remarks: string;
    customer_remarks: string;
    status: string;

    errors: Record<string, string>;
    isValid: boolean;
    rowIndex: number;
}

export interface InstallationReportPreviewResponse {
    importId: string;
    rows: InstallationReportPreviewRow[];
    totalRows: number;
    validRows: number;
    invalidRows: number;
}

export interface InstallationReportImportStatus {
    state: 'processing' | 'completed' | 'failed';
    percentage: number;
    processedRows: number;
    createdCount: number;
    errorCount: number;
    errorMessage?: string;
}

export interface InstallationReportColumnConfig {
    key: keyof InstallationReportPreviewRow;
    header: string;
    width?: number;
}
