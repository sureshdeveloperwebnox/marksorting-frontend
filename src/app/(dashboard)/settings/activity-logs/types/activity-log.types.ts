export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  device_name: string | null;
  created_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface QueryActivityLogsDto {
  skip?: number;
  take?: number;
  user_id?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface ActivityLogsResponse {
  data: ActivityLog[];
  meta: {
    total: number;
    skip: number;
    take: number;
    has_more: boolean;
  };
}

export interface ActivityStats {
  total_activities: number;
  most_active_user: {
    id: string;
    full_name: string;
    email: string;
    activity_count: number;
  } | null;
  most_common_action: {
    action: string;
    count: number;
  } | null;
  login_count: number;
  logout_count: number;
}
