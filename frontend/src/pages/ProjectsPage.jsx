import { Link } from 'react-router-dom';
import { Plus, Trash2, BarChart3, ExternalLink } from 'lucide-react';
import { useProjects, useDeleteProject } from '../hooks/useApi';
import { Breadcrumb } from '../components/Layout';
import { Card, Button, Badge, Spinner, EmptyState } from '../components/ui';
import { formatPercent, formatRelativeTime } from '../lib/utils';

export default function ProjectsPage() {
  const { data, isLoading } = useProjects();
  const deleteProject = useDeleteProject();

  const projects = data?.projects || [];

  const handleDelete = async (e, projectId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      await deleteProject.mutateAsync(projectId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Projects' },
      ]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="mt-1" style={{ color: 'var(--color-navy-400)' }}>Manage your AI visibility tracking projects</p>
        </div>
        <Link to="/projects/new">
          <Button>
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={BarChart3}
            title="No projects yet"
            description="Create your first project to start tracking your brand's AI visibility."
            action={
              <Link to="/projects/new">
                <Button>
                  <Plus className="w-4 h-4" />
                  Create Project
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => {
            const userBrand = project.brands?.find(b => b.isUserBrand);
            const latestMetrics = userBrand?.metricsSnapshots?.[0];
            const competitors = project.brands?.filter(b => !b.isUserBrand) || [];

            return (
              <Link key={project.id} to={`/projects/${project.id}`}>
                <Card hover className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                        <Badge variant={latestMetrics ? 'success' : 'neutral'}>
                          {latestMetrics ? 'Active' : 'No data'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm mb-4" style={{ color: 'var(--color-navy-400)' }}>{project.category}</p>
                      
                      <div className="flex flex-wrap items-center gap-6 text-sm">
                        <div>
                          <span style={{ color: 'var(--color-navy-500)' }}>Your Brand: </span>
                          <span className="text-white font-medium">{project.userBrand}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-navy-500)' }}>Competitors: </span>
                          <span className="text-white">{competitors.length}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-navy-500)' }}>Prompts: </span>
                          <span className="text-white">{project._count?.prompts || 0}</span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-navy-500)' }}>Runs: </span>
                          <span className="text-white">{project._count?.analysisRuns || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {latestMetrics && (
                        <div className="text-right">
                          <p className="text-sm" style={{ color: 'var(--color-navy-400)' }}>AI Visibility</p>
                          <p className="text-2xl font-bold text-blue-400">
                            {formatPercent(latestMetrics.visibilityScore)}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDelete(e, project.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}