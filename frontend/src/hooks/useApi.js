import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projects, analysis, dashboard } from '../lib/api';

// ============================================
// Project Hooks
// ============================================

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: projects.list,
  });
}

export function useProject(id) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => projects.get(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projects.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projects.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// ============================================
// Analysis Hooks
// ============================================

export function useAnalysisRuns(projectId) {
  return useQuery({
    queryKey: ['analysisRuns', projectId],
    queryFn: () => analysis.getRuns(projectId),
    enabled: !!projectId,
  });
}

export function useLatestAnalysis(projectId) {
  return useQuery({
    queryKey: ['latestAnalysis', projectId],
    queryFn: () => analysis.getLatest(projectId),
    enabled: !!projectId,
    retry: false,
  });
}

export function useRunAnalysis() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: analysis.run,
    onSuccess: (data, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['analysisRuns', projectId] });
    },
  });
}

// ============================================
// Dashboard Hooks
// ============================================

export function useDashboard(projectId, runId) {
  return useQuery({
    queryKey: ['dashboard', projectId, runId],
    queryFn: () => dashboard.get(projectId, runId),
    enabled: !!projectId,
  });
}

export function useDashboardPrompts(projectId, filter = 'all') {
  return useQuery({
    queryKey: ['dashboardPrompts', projectId, filter],
    queryFn: () => dashboard.getPrompts(projectId, { filter }),
    enabled: !!projectId,
  });
}

export function useCitations(projectId) {
  return useQuery({
    queryKey: ['citations', projectId],
    queryFn: () => dashboard.getCitations(projectId),
    enabled: !!projectId,
  });
}

export function useTrends(projectId) {
  return useQuery({
    queryKey: ['trends', projectId],
    queryFn: () => dashboard.getTrends(projectId),
    enabled: !!projectId,
  });
}

export function useCompetitors(projectId) {
  return useQuery({
    queryKey: ['competitors', projectId],
    queryFn: () => dashboard.getCompetitors(projectId),
    enabled: !!projectId,
  });
}