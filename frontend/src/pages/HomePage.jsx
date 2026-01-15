import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Eye, 
  BarChart3, 
  Quote, 
  Target,
  Plus,
  ArrowRight,
  Sparkles,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useProjects } from '../hooks/useApi';
import { Card, Button, MetricCard, EmptyState, Spinner, Badge } from '../components/ui';
import { formatPercent, formatRelativeTime } from '../lib/utils';

export default function HomePage() {
  const { data, isLoading, error } = useProjects();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const projects = data?.projects || [];
  const hasProjects = projects.length > 0;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(to bottom right, rgb(59 130 246 / 0.1), transparent, rgb(168 85 247 / 0.1))' }} />
        <div className="relative card p-8 md:p-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4" style={{ backgroundColor: 'rgb(59 130 246 / 0.1)', color: 'var(--color-electric-400)' }}>
              <Sparkles className="w-4 h-4" />
              AI Search Visibility
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Track Your Brand Across AI Platforms
            </h1>
            <p className="text-lg mb-6" style={{ color: 'var(--color-navy-300)' }}>
              Monitor how ChatGPT, Gemini, and other AI models recommend your brand. 
              Get actionable insights to improve your AI search visibility.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/projects/new">
                <Button>
                  <Plus className="w-4 h-4" />
                  Create Project
                </Button>
              </Link>
              {hasProjects && (
                <Link to="/projects">
                  <Button variant="secondary">
                    View All Projects
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
          
          {/* Decorative element */}
          <div className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2">
            <div className="relative w-48 h-48">
              <div className="absolute inset-0 rounded-full blur-3xl" style={{ background: 'linear-gradient(to bottom right, rgb(59 130 246 / 0.2), rgb(168 85 247 / 0.2))' }} />
              <div className="absolute inset-4 rounded-full animate-pulse" style={{ background: 'linear-gradient(to bottom right, rgb(59 130 246 / 0.3), rgb(168 85 247 / 0.3))' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Eye className="w-16 h-16 text-blue-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {hasProjects && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            label="Active Projects"
            value={projects.length}
            icon={Target}
          />
          <MetricCard
            label="Total Prompts Tracked"
            value={projects.reduce((sum, p) => sum + (p._count?.prompts || 0), 0)}
            icon={Quote}
          />
          <MetricCard
            label="Analysis Runs"
            value={projects.reduce((sum, p) => sum + (p._count?.analysisRuns || 0), 0)}
            icon={BarChart3}
          />
          <MetricCard
            label="Brands Monitored"
            value={projects.reduce((sum, p) => sum + (p.brands?.length || 0), 0)}
            icon={TrendingUp}
          />
        </div>
      )}

      {/* Projects List or Empty State */}
      {hasProjects ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Your Projects</h2>
            <Link to="/projects">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      ) : (
        <Card className="p-12">
          <EmptyState
            icon={Target}
            title="No projects yet"
            description="Create your first project to start tracking your brand's visibility across AI search platforms."
            action={
              <Link to="/projects/new">
                <Button>
                  <Plus className="w-4 h-4" />
                  Create Your First Project
                </Button>
              </Link>
            }
          />
        </Card>
      )}

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FeatureCard
          icon={Eye}
          title="Visibility Tracking"
          description="Monitor how often your brand appears in AI-generated responses across different prompts and topics."
        />
        <FeatureCard
          icon={BarChart3}
          title="Competitive Analysis"
          description="Compare your brand's AI presence against competitors with share of voice metrics."
        />
        <FeatureCard
          icon={Quote}
          title="Citation Insights"
          description="Discover which sources AI models use most frequently and identify opportunities for better coverage."
        />
      </div>
    </div>
  );
}

function ProjectCard({ project }) {
  const latestMetrics = project.brands?.find(b => b.isUserBrand)?.metricsSnapshots?.[0];
  
  return (
    <Link to={`/projects/${project.id}`}>
      <Card hover className="p-6 h-full">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-white mb-1">{project.name}</h3>
            <p className="text-sm" style={{ color: 'var(--color-navy-400)' }}>{project.category}</p>
          </div>
          <Badge variant={latestMetrics ? 'success' : 'neutral'}>
            {latestMetrics ? 'Active' : 'No data'}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--color-navy-400)' }}>Your Brand</span>
            <span className="text-white font-medium">{project.userBrand}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--color-navy-400)' }}>Competitors</span>
            <span className="text-white">{(project.brands?.length || 1) - 1}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--color-navy-400)' }}>Prompts</span>
            <span className="text-white">{project._count?.prompts || 0}</span>
          </div>

          {latestMetrics && (
            <div className="pt-3 border-t" style={{ borderColor: 'var(--color-navy-800)' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--color-navy-400)' }}>AI Visibility</span>
                <span className="text-lg font-bold text-blue-400">
                  {formatPercent(latestMetrics.visibilityScore)}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <Card className="p-6">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgb(59 130 246 / 0.1)' }}>
        <Icon className="w-6 h-6 text-blue-400" />
      </div>
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm" style={{ color: 'var(--color-navy-400)' }}>{description}</p>
    </Card>
  );
}