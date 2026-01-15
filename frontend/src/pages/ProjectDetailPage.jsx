import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Play, 
  Eye, 
  BarChart3, 
  Quote, 
  TrendingUp,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useProject, useDashboard, useDashboardPrompts, useCitations, useTrends, useRunAnalysis } from '../hooks/useApi';
import { analysis as analysisApi } from '../lib/api';
import { Breadcrumb } from '../components/Layout';
import { Card, Button, MetricCard, Badge, Tabs, Spinner, EmptyState, ProgressBar } from '../components/ui';
import { BrandComparisonChart, ShareOfVoiceChart, CitedDomainsChart, TrendChart, SentimentChart } from '../components/Charts';
import { formatPercent, formatNumber, formatRelativeTime, getSentimentBadge, truncate, cn } from '../lib/utils';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [promptFilter, setPromptFilter] = useState('all');
  const [analysisProgress, setAnalysisProgress] = useState(null);
  
  const { data: projectData, isLoading: projectLoading, refetch: refetchProject } = useProject(id);
  const { data: dashboardData, isLoading: dashboardLoading, refetch: refetchDashboard } = useDashboard(id);
  const { data: promptsData, isLoading: promptsLoading, refetch: refetchPrompts } = useDashboardPrompts(id, promptFilter);
  const { data: citationsData } = useCitations(id);
  const { data: trendsData } = useTrends(id);
  const runAnalysis = useRunAnalysis();

  const project = projectData?.project;
  const dashboard = dashboardData;
  const prompts = promptsData?.prompts || [];

  // Handle running analysis
  const handleRunAnalysis = async () => {
    try {
      const result = await runAnalysis.mutateAsync(id);
      
      setAnalysisProgress({
        runId: result.runId,
        processed: 0,
        total: result.totalPrompts,
        status: 'running',
      });

      const cleanup = analysisApi.streamProgress(
        id,
        result.runId,
        (data) => {
          if (data.type === 'progress') {
            setAnalysisProgress(prev => ({
              ...prev,
              processed: data.processed,
              total: data.total,
              currentPrompt: data.currentPrompt,
            }));
          } else if (data.type === 'complete') {
            setAnalysisProgress(prev => ({ ...prev, status: 'complete' }));
            setTimeout(() => {
              refetchProject();
              refetchDashboard();
              refetchPrompts();
              setAnalysisProgress(null);
            }, 1500);
          }
        },
        (error) => {
          console.error('SSE error:', error);
          setAnalysisProgress(prev => ({ ...prev, status: 'error' }));
        }
      );

      return cleanup;
    } catch (error) {
      console.error('Failed to start analysis:', error);
      setAnalysisProgress(null);
    }
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--color-navy-400)' }}>Project not found</p>
        <Link to="/projects" className="text-blue-400 hover:underline mt-2 inline-block">
          Back to projects
        </Link>
      </div>
    );
  }

  const hasData = dashboard?.hasData;

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: project.name },
      ]} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{project.name}</h1>
          <p className="mt-1" style={{ color: 'var(--color-navy-400)' }}>{project.category}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {analysisProgress ? (
            <AnalysisProgressCard progress={analysisProgress} />
          ) : (
            <>
              {hasData && (
                <Button variant="secondary" onClick={() => {
                  refetchDashboard();
                  refetchPrompts();
                }}>
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              )}
              <Button onClick={handleRunAnalysis} loading={runAnalysis.isPending}>
                <Play className="w-4 h-4" />
                Run Analysis
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Analysis in progress */}
      {analysisProgress && analysisProgress.status === 'running' && (
        <Card className="p-6" style={{ borderColor: 'rgb(59 130 246 / 0.3)', backgroundColor: 'rgb(59 130 246 / 0.05)' }}>
          <div className="flex items-center gap-4 mb-4">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            <div className="flex-1">
              <p className="font-medium text-white">Analysis in Progress</p>
              <p className="text-sm" style={{ color: 'var(--color-navy-400)' }}>
                Processing prompt {analysisProgress.processed} of {analysisProgress.total}
              </p>
            </div>
            <span className="text-lg font-bold text-blue-400">
              {Math.round((analysisProgress.processed / analysisProgress.total) * 100)}%
            </span>
          </div>
          <ProgressBar value={analysisProgress.processed} max={analysisProgress.total} />
          {analysisProgress.currentPrompt && (
            <p className="text-xs mt-3 truncate" style={{ color: 'var(--color-navy-500)' }}>
              Current: "{truncate(analysisProgress.currentPrompt, 80)}"
            </p>
          )}
        </Card>
      )}

      {/* Tabs */}
      <Tabs
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'prompts', label: 'Prompts', count: promptsData?.total },
          { value: 'citations', label: 'Citations' },
          { value: 'competitors', label: 'Competitors' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab 
          dashboard={dashboard} 
          trends={trendsData?.trends} 
          hasData={hasData}
          onRunAnalysis={handleRunAnalysis}
          isRunning={!!analysisProgress}
        />
      )}
      
      {activeTab === 'prompts' && (
        <PromptsTab 
          prompts={prompts}
          promptsData={promptsData}
          filter={promptFilter}
          onFilterChange={setPromptFilter}
          hasData={hasData}
          isLoading={promptsLoading}
        />
      )}
      
      {activeTab === 'citations' && (
        <CitationsTab 
          citations={citationsData} 
          hasData={hasData}
        />
      )}
      
      {activeTab === 'competitors' && (
        <CompetitorsTab 
          dashboard={dashboard} 
          hasData={hasData}
        />
      )}
    </div>
  );
}

function AnalysisProgressCard({ progress }) {
  if (progress.status === 'complete') {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: 'rgb(34 197 94 / 0.1)', color: '#4ade80' }}>
        <CheckCircle2 className="w-5 h-5" />
        <span className="font-medium">Analysis Complete!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-xl" style={{ backgroundColor: 'var(--color-navy-800)' }}>
      <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
      <span style={{ color: 'var(--color-navy-300)' }}>
        {progress.processed}/{progress.total}
      </span>
    </div>
  );
}

function OverviewTab({ dashboard, trends, hasData, onRunAnalysis, isRunning }) {
  if (!hasData) {
    return (
      <Card className="p-12">
        <EmptyState
          icon={BarChart3}
          title="No analysis data yet"
          description="Run your first analysis to see your brand's AI visibility metrics."
          action={
            <Button onClick={onRunAnalysis} loading={isRunning}>
              <Play className="w-4 h-4" />
              Run First Analysis
            </Button>
          }
        />
      </Card>
    );
  }

  const { summary, brandComparison, topCitedDomains } = dashboard;
  const userBrandData = brandComparison?.find(b => b.isUserBrand);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          label="AI Visibility"
          value={formatPercent(summary?.userBrandVisibility, 1)}
          icon={Eye}
          className="glow-blue"
        />
        <MetricCard
          label="Share of Voice"
          value={formatPercent(summary?.userBrandShareOfVoice, 1)}
          icon={BarChart3}
        />
        <MetricCard
          label="Avg Position"
          value={summary?.userBrandAvgPosition ? formatNumber(summary.userBrandAvgPosition, 1) : '—'}
          icon={TrendingUp}
        />
        <MetricCard
          label="Prompts Tracked"
          value={summary?.totalPrompts || 0}
          icon={Quote}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {brandComparison && <BrandComparisonChart data={brandComparison} userBrand={summary?.userBrand} />}
        {brandComparison && <ShareOfVoiceChart data={brandComparison} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {topCitedDomains && <CitedDomainsChart data={topCitedDomains} />}
        {userBrandData && <SentimentChart data={userBrandData} />}
      </div>

      {trends && <TrendChart data={trends} />}

      {dashboard.analysisRun && (
        <Card className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-navy-400)' }}>
            <Clock className="w-4 h-4" />
            Last analysis: {formatRelativeTime(dashboard.analysisRun.completedAt)}
          </div>
          <Badge variant="success">
            {dashboard.analysisRun.totalPrompts} prompts analyzed
          </Badge>
        </Card>
      )}
    </div>
  );
}

function PromptsTab({ prompts, promptsData, filter, onFilterChange, hasData, isLoading }) {
  if (!hasData) {
    return (
      <Card className="p-12">
        <EmptyState
          icon={Quote}
          title="No prompt data yet"
          description="Run an analysis to see how your brand performs across different prompts."
        />
      </Card>
    );
  }

  const filterTabs = [
    { value: 'all', label: 'All', count: promptsData?.total },
    { value: 'mentioned', label: 'Mentioned', count: promptsData?.mentioned },
    { value: 'not-mentioned', label: 'Not Mentioned', count: promptsData?.notMentioned },
  ];

  return (
    <div className="space-y-4">
      <Tabs tabs={filterTabs} activeTab={filter} onChange={onFilterChange} />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : prompts.length === 0 ? (
        <Card className="p-8 text-center">
          <p style={{ color: 'var(--color-navy-400)' }}>No prompts match this filter</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {prompts.map((prompt) => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
        </div>
      )}
    </div>
  );
}

function PromptCard({ prompt }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0'
        )}
        style={{ backgroundColor: prompt.isMentioned ? 'rgb(34 197 94 / 0.1)' : 'var(--color-navy-800)' }}
        >
          {prompt.isMentioned ? (
            <CheckCircle2 className="w-5 h-5" style={{ color: '#4ade80' }} />
          ) : (
            <XCircle className="w-5 h-5" style={{ color: 'var(--color-navy-500)' }} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium mb-1">{prompt.text}</p>
          
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge variant="neutral">{prompt.intentType}</Badge>
            
            {prompt.isMentioned && (
              <>
                <span style={{ color: 'var(--color-navy-400)' }}>
                  Position: <span className="text-white font-medium">{prompt.position}</span>
                </span>
                <Badge variant={prompt.sentiment === 'positive' ? 'success' : prompt.sentiment === 'negative' ? 'danger' : 'neutral'}>
                  {prompt.sentiment || 'neutral'}
                </Badge>
                {prompt.isRecommended && <Badge variant="success">Recommended</Badge>}
              </>
            )}
            
            {prompt.citationCount > 0 && (
              <span style={{ color: 'var(--color-navy-400)' }}>
                {prompt.citationCount} citation{prompt.citationCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {prompt.allMentions && prompt.allMentions.length > 1 && (
            <div className="mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {expanded ? 'Hide' : 'Show'} all {prompt.allMentions.length} brands mentioned
              </button>
              
              {expanded && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {prompt.allMentions.map((mention, i) => (
                    <span 
                      key={i}
                      className="px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: 'var(--color-navy-800)', color: 'var(--color-navy-300)' }}
                    >
                      {mention.position}. {mention.brand}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function CitationsTab({ citations, hasData }) {
  if (!hasData || !citations) {
    return (
      <Card className="p-12">
        <EmptyState
          icon={ExternalLink}
          title="No citation data yet"
          description="Run an analysis to see which domains AI models cite most frequently."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Total Citations" value={citations.totalCitations || 0} icon={Quote} />
        <MetricCard label="Unique Domains" value={citations.uniqueDomains || 0} icon={ExternalLink} />
        <MetricCard label="Top Domain Share" value={formatPercent(citations.domains?.[0]?.percentage)} icon={TrendingUp} />
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Cited Domains</h3>
        <div className="space-y-3">
          {citations.domains?.map((domain, index) => (
            <div key={domain.domain} className="flex items-center gap-4">
              <span className="w-6 text-sm text-right" style={{ color: 'var(--color-navy-500)' }}>{index + 1}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-medium">{domain.domain}</span>
                  <span className="text-sm" style={{ color: 'var(--color-navy-400)' }}>{domain.citationCount} citations</span>
                </div>
                <ProgressBar value={domain.percentage} max={100} />
              </div>
              <span className="text-sm text-blue-400 w-16 text-right">
                {formatPercent(domain.percentage)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {citations.topPages && citations.topPages.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Cited Pages</h3>
          <div className="space-y-3">
            {citations.topPages.slice(0, 10).map((page, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg" style={{ backgroundColor: 'rgb(36 59 83 / 0.5)' }}>
                <span className="w-6 h-6 rounded flex items-center justify-center text-xs" style={{ backgroundColor: 'var(--color-navy-700)', color: 'var(--color-navy-300)' }}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white truncate">{page.title || page.url}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-navy-500)' }}>{page.domain}</p>
                </div>
                <Badge variant="neutral">{page.count} citations</Badge>
                <a href={page.url} target="_blank" rel="noopener noreferrer" className="p-2 transition-colors hover:text-blue-400" style={{ color: 'var(--color-navy-400)' }}>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function CompetitorsTab({ dashboard, hasData }) {
  if (!hasData || !dashboard?.brandComparison) {
    return (
      <Card className="p-12">
        <EmptyState
          icon={BarChart3}
          title="No competitor data yet"
          description="Run an analysis to see how you compare against competitors."
        />
      </Card>
    );
  }

  const userBrand = dashboard.brandComparison.find(b => b.isUserBrand);
  const competitors = dashboard.brandComparison.filter(b => !b.isUserBrand);

  return (
    <div className="space-y-6">
      {userBrand && (
        <Card className="p-6" style={{ borderColor: 'rgb(59 130 246 / 0.3)', backgroundColor: 'rgb(59 130 246 / 0.05)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="primary">Your Brand</Badge>
            <h3 className="text-lg font-semibold text-white">{userBrand.name}</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm" style={{ color: 'var(--color-navy-400)' }}>Visibility</p>
              <p className="text-2xl font-bold text-blue-400">{formatPercent(userBrand.visibility)}</p>
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--color-navy-400)' }}>Share of Voice</p>
              <p className="text-2xl font-bold text-white">{formatPercent(userBrand.shareOfVoice)}</p>
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--color-navy-400)' }}>Avg Position</p>
              <p className="text-2xl font-bold text-white">{formatNumber(userBrand.avgPosition) || '—'}</p>
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--color-navy-400)' }}>Mentions</p>
              <p className="text-2xl font-bold text-white">{userBrand.mentionCount}</p>
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--color-navy-400)' }}>First Position</p>
              <p className="text-2xl font-bold text-white">{userBrand.firstPositionCount}</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: 'var(--color-navy-800)' }}>
          <h3 className="font-semibold text-white">Competitor Comparison</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Visibility</th>
                <th>Share of Voice</th>
                <th>Avg Position</th>
                <th>Mentions</th>
                <th>Sentiment</th>
                <th>Gap</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((competitor) => {
                const visibilityGap = userBrand ? competitor.visibility - userBrand.visibility : 0;
                return (
                  <tr key={competitor.id}>
                    <td className="font-medium text-white">{competitor.name}</td>
                    <td>{formatPercent(competitor.visibility)}</td>
                    <td>{formatPercent(competitor.shareOfVoice)}</td>
                    <td>{formatNumber(competitor.avgPosition) || '—'}</td>
                    <td>{competitor.mentionCount}</td>
                    <td>
                      <div className="flex gap-1">
                        <span className="text-green-400">{competitor.sentiment?.positive || 0}</span>
                        <span style={{ color: 'var(--color-navy-500)' }}>/</span>
                        <span style={{ color: 'var(--color-navy-400)' }}>{competitor.sentiment?.neutral || 0}</span>
                        <span style={{ color: 'var(--color-navy-500)' }}>/</span>
                        <span className="text-red-400">{competitor.sentiment?.negative || 0}</span>
                      </div>
                    </td>
                    <td>
                      <span className={cn('font-medium', visibilityGap > 0 ? 'text-red-400' : visibilityGap < 0 ? 'text-green-400' : '')} style={visibilityGap === 0 ? { color: 'var(--color-navy-400)' } : {}}>
                        {visibilityGap > 0 ? '+' : ''}{formatPercent(visibilityGap)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}