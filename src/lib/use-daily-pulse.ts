import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { useAuth } from "./auth-context";

export type SourceBasis = {
  source_type: "internal_store_data";
  metric_name: string;
  current_value: string | number;
  comparison_value: string | number;
  period: string;
  explanation: string;
};

export type RecommendationCategory = "revenue" | "operations" | "customer_growth";
export type RecommendationPriority = "low" | "medium" | "high" | "critical";
export type TargetRole = "owner" | "admin" | "manager" | "kitchen" | "marketing";
export type RecommendationStatus = "active" | "viewed" | "dismissed" | "executed";

export type PulseRecommendation = {
  id: string;
  pulse_id: string;
  store_id: string;
  category: RecommendationCategory;
  title: string;
  priority: RecommendationPriority;
  confidence: number;
  reason: string;
  expected_impact: string;
  target_role: TargetRole;
  source_basis: SourceBasis;
  status: RecommendationStatus;
  viewed_at: string | null;
  dismissed_at: string | null;
  executed_at?: string | null;
  execution_result?: any;
  created_at: string;
};

export type SetupAction = {
  id: string;
  title: string;
  description: string;
  link: string;
};

export type SufficiencyTier = "insufficient" | "limited" | "sufficient";

export type DailyPulse = {
  id: string;
  store_id: string;
  business_date: string;
  status: "active" | "insufficient_data" | "completed";
  sufficiency_tier: SufficiencyTier;
  metrics_snapshot: Record<string, any>;
  recommendations: PulseRecommendation[];
  setup_actions: SetupAction[];
};

export function useDailyPulse() {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ["daily-pulse", user?.id],
    enabled: !!user && !loading,
    queryFn: async (): Promise<DailyPulse> => {
      const res = await api.get("/stores/me/growth/daily-pulse");
      return res.data.data;
    },
    staleTime: 60000,
    retry: 2,
  });
}

export function useViewRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/stores/me/growth/recommendations/${id}/view`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-pulse"] });
    },
  });
}

export function useDismissRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/stores/me/growth/recommendations/${id}/dismiss`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-pulse"] });
    },
  });
}

export type GrowthExperimentStatus = "running" | "completed" | "inconclusive" | "awaiting_campaign_send";
export type GrowthExperimentResult = "success" | "neutral" | "failure" | null;

export type GrowthExperiment = {
  id: string;
  store_id: string;
  recommendation_id: string;
  action_log_id: string | null;
  action_type: string;
  target_metric: string;
  target_entity_type: string | null;
  target_entity_id: string | null;
  baseline_value: number;
  baseline_period_start: string;
  baseline_period_end: string;
  experiment_start: string;
  experiment_end: string;
  expected_impact: string;
  actual_value: number | null;
  actual_impact: number | null;
  status: GrowthExperimentStatus;
  result: GrowthExperimentResult;
  recommendation_title?: string;
  recommendation_reason?: string;
  created_at: string;
  completed_at: string | null;
};

export type ImpactSummary = {
  total_experiments: number;
  active_running: number;
  completed_success: number;
  completed_neutral: number;
  completed_failure: number;
  inconclusive: number;
  awaiting_campaign_send: number;
  total_measured_revenue_impact: number;
  breakdown: Array<{
    id: string;
    action_type: string;
    target_metric: string;
    expected_impact: string;
    baseline_value: number;
    actual_value: number | null;
    actual_impact: number | null;
    status: GrowthExperimentStatus;
    result: GrowthExperimentResult;
    recommendation_title?: string;
  }>;
};

export function useExecuteRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, action_type, payload }: { id: string; action_type: string; payload?: any }) => {
      const res = await api.post(`/stores/me/growth/recommendations/${id}/execute`, {
        action_type,
        payload,
        confirmed: true
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-pulse"] });
      queryClient.invalidateQueries({ queryKey: ["growth-experiments"] });
      queryClient.invalidateQueries({ queryKey: ["growth-impact-summary"] });
    },
  });
}

export function useExperiments() {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ["growth-experiments", user?.id],
    enabled: !!user && !loading,
    queryFn: async (): Promise<GrowthExperiment[]> => {
      const res = await api.get("/stores/me/growth/experiments");
      return res.data.data;
    },
    staleTime: 30000,
  });
}

export function useImpactSummary() {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ["growth-impact-summary", user?.id],
    enabled: !!user && !loading,
    queryFn: async (): Promise<ImpactSummary> => {
      const res = await api.get("/stores/me/growth/impact-summary");
      return res.data.data;
    },
    staleTime: 30000,
  });
}

export function useRecalculateExperiment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/stores/me/growth/experiments/${id}/recalculate`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["growth-experiments"] });
      queryClient.invalidateQueries({ queryKey: ["growth-impact-summary"] });
    },
  });
}

export function useCompleteExperiment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/stores/me/growth/experiments/${id}/complete`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["growth-experiments"] });
      queryClient.invalidateQueries({ queryKey: ["growth-impact-summary"] });
    },
  });
}

export type MonthlyStrategyCategory = "revenue_optimization" | "operational_efficiency" | "customer_retention";

export type MonthlyStrategyRecommendation = {
  id: string;
  strategy_id: string;
  store_id: string;
  category: MonthlyStrategyCategory;
  title: string;
  priority: RecommendationPriority;
  confidence: number;
  reason: string;
  evidence_summary: Record<string, any>;
  expected_impact_range: string;
  risk_level: "low" | "medium" | "high";
  source_basis: SourceBasis;
  suggested_execution_path: string;
  experiment_suggestion: Record<string, any>;
  external_evidence?: Array<{
    id: string;
    signal_type: string;
    title: string;
    source_name: string;
    observed_at: string;
    confidence: number;
  }>;
  external_signal_ids?: string[];
  external_confidence?: number;
  external_context_used?: boolean;
  external_context_note?: string;
  status: RecommendationStatus;
  created_at: string;
};

export type MonthlyGrowthStrategy = {
  id: string;
  store_id: string;
  strategy_period: string;
  status: "active" | "insufficient_data" | "completed";
  data_sufficiency_tier: SufficiencyTier;
  metrics_snapshot: Record<string, any>;
  past_outcomes_summary: Record<string, any>;
  external_context_used?: boolean;
  external_signals_count?: number;
  recommendations: MonthlyStrategyRecommendation[];
  setup_actions?: SetupAction[];
};

export type ExternalSignalType =
  | "competitor_pricing"
  | "competitor_availability"
  | "weather"
  | "local_event"
  | "public_holiday"
  | "seasonal_trend"
  | "market_observation";

export type ExternalSignalStatus = "draft" | "verified" | "expired" | "rejected";

export type ExternalMarketSignal = {
  id: string;
  store_id: string;
  signal_type: ExternalSignalType;
  title: string;
  description?: string;
  value?: Record<string, any>;
  source_name: string;
  source_url?: string | null;
  observed_at: string;
  retrieved_at: string;
  valid_until?: string | null;
  confidence: number;
  status: ExternalSignalStatus;
  created_at: string;
};

export function useMonthlyStrategy(includeExternal = true) {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ["monthly-strategy", user?.id, includeExternal],
    enabled: !!user && !loading,
    queryFn: async (): Promise<MonthlyGrowthStrategy> => {
      const res = await api.get(`/stores/me/growth/monthly-strategy?include_external=${includeExternal}`);
      return res.data.data;
    },
    staleTime: 60000,
  });
}

export function useRefreshMonthlyStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (period?: string) => {
      const res = await api.post(`/stores/me/growth/monthly-strategy/refresh${period ? `?period=${period}` : ""}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly-strategy"] });
    },
  });
}

export function useMonthlyStrategyHistory() {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ["monthly-strategy-history", user?.id],
    enabled: !!user && !loading,
    queryFn: async (): Promise<MonthlyGrowthStrategy[]> => {
      const res = await api.get("/stores/me/growth/monthly-strategy/history");
      return res.data.data;
    },
    staleTime: 60000,
  });
}

export function useExternalSignals(filters?: { signal_type?: string; status?: string; active_only?: boolean }) {
  const { user, loading } = useAuth();
  const queryParams = new URLSearchParams();
  if (filters?.signal_type) queryParams.set("signal_type", filters.signal_type);
  if (filters?.status) queryParams.set("status", filters.status);
  if (filters?.active_only) queryParams.set("active_only", "true");

  return useQuery({
    queryKey: ["external-signals", user?.id, filters],
    enabled: !!user && !loading,
    queryFn: async (): Promise<ExternalMarketSignal[]> => {
      const res = await api.get(`/stores/me/growth/external-signals?${queryParams.toString()}`);
      return res.data.data;
    },
    staleTime: 30000,
  });
}

export function useCreateExternalSignal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (signalData: Partial<ExternalMarketSignal>) => {
      const res = await api.post("/stores/me/growth/external-signals", signalData);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-signals"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-strategy"] });
    },
  });
}

export function useVerifyExternalSignal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/stores/me/growth/external-signals/${id}/verify`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-signals"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-strategy"] });
    },
  });
}

export function useRejectExternalSignal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/stores/me/growth/external-signals/${id}/reject`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-signals"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-strategy"] });
    },
  });
}

export function useDeleteExternalSignal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/stores/me/growth/external-signals/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-signals"] });
      queryClient.invalidateQueries({ queryKey: ["monthly-strategy"] });
    },
  });
}
