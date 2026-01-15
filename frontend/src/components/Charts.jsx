import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from 'recharts';
import { Card } from './ui';
import { cn, getChartColor, formatPercent } from '../lib/utils';

// ============================================
// Brand Comparison Bar Chart
// ============================================

export function BrandComparisonChart({ data, userBrand, className }) {
  // Sort by visibility descending
  const chartData = [...data]
    .sort((a, b) => b.visibility - a.visibility)
    .map((item, index) => ({
      ...item,
      fill: item.isUserBrand ? '#3b82f6' : getChartColor(index + 1),
    }));

  return (
    <Card className={cn('p-6', className)}>
      <h3 className="text-lg font-semibold text-white mb-6">Brand Visibility Comparison</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis 
              type="number" 
              domain={[0, 100]} 
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: '#829ab1', fontSize: 12 }}
              axisLine={{ stroke: '#334e68' }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              tick={{ fill: '#9fb3c8', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={100}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg p-3 shadow-xl" style={{ backgroundColor: 'var(--color-navy-800)', border: '1px solid var(--color-navy-700)' }}>
                    <p className="font-medium text-white">{data.name}</p>
                    <p className="text-sm" style={{ color: 'var(--color-navy-300)' }}>
                      Visibility: <span className="text-blue-400">{formatPercent(data.visibility)}</span>
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-navy-300)' }}>
                      Mentions: <span className="text-white">{data.mentionCount}</span>
                    </p>
                  </div>
                );
              }}
            />
            <Bar 
              dataKey="visibility" 
              radius={[0, 4, 4, 0]}
              fill="#3b82f6"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ============================================
// Share of Voice Pie Chart
// ============================================

export function ShareOfVoiceChart({ data, className }) {
  const chartData = data
    .filter(d => d.shareOfVoice > 0)
    .map((item, index) => ({
      ...item,
      fill: item.isUserBrand ? '#3b82f6' : getChartColor(index + 1),
    }));

  return (
    <Card className={cn('p-6', className)}>
      <h3 className="text-lg font-semibold text-white mb-6">Share of Voice</h3>
      <div className="h-64 flex items-center">
        <ResponsiveContainer width="50%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="shareOfVoice"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg p-3 shadow-xl" style={{ backgroundColor: 'var(--color-navy-800)', border: '1px solid var(--color-navy-700)' }}>
                    <p className="font-medium text-white">{data.name}</p>
                    <p className="text-sm text-blue-400">
                      {formatPercent(data.shareOfVoice)}
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Legend */}
        <div className="flex-1 space-y-2">
          {chartData.map((item, index) => (
            <div key={item.name} className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-sm flex-1" style={{ color: 'var(--color-navy-300)' }}>{item.name}</span>
              <span className={cn(
                'text-sm font-medium',
                item.isUserBrand ? 'text-blue-400' : 'text-white'
              )}>
                {formatPercent(item.shareOfVoice)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ============================================
// Top Cited Domains Chart
// ============================================

export function CitedDomainsChart({ data, className }) {
  const chartData = data.slice(0, 8).map((item, index) => ({
    ...item,
    fill: getChartColor(index),
  }));

  return (
    <Card className={cn('p-6', className)}>
      <h3 className="text-lg font-semibold text-white mb-6">Top Cited Domains</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
            <XAxis 
              dataKey="domain" 
              tick={{ fill: '#9fb3c8', fontSize: 10 }}
              axisLine={{ stroke: '#334e68' }}
              angle={-45}
              textAnchor="end"
              height={70}
            />
            <YAxis 
              tick={{ fill: '#829ab1', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg p-3 shadow-xl" style={{ backgroundColor: 'var(--color-navy-800)', border: '1px solid var(--color-navy-700)' }}>
                    <p className="font-medium text-white">{data.domain}</p>
                    <p className="text-sm" style={{ color: 'var(--color-navy-300)' }}>
                      Citations: <span className="text-blue-400">{data.count}</span>
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-navy-300)' }}>
                      Share: <span className="text-white">{formatPercent(data.percentage)}</span>
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ============================================
// Visibility Trend Line Chart
// ============================================

export function TrendChart({ data, className }) {
  if (!data || data.length < 2) {
    return (
      <Card className={cn('p-6', className)}>
        <h3 className="text-lg font-semibold text-white mb-6">Visibility Trend</h3>
        <div className="h-48 flex items-center justify-center" style={{ color: 'var(--color-navy-500)' }}>
          Run more analyses to see trends
        </div>
      </Card>
    );
  }

  const chartData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <Card className={cn('p-6', className)}>
      <h3 className="text-lg font-semibold text-white mb-6">Visibility Trend</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ left: 0, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334e68" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#829ab1', fontSize: 12 }}
              axisLine={{ stroke: '#334e68' }}
            />
            <YAxis 
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: '#829ab1', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="rounded-lg p-3 shadow-xl" style={{ backgroundColor: 'var(--color-navy-800)', border: '1px solid var(--color-navy-700)' }}>
                    <p className="font-medium text-white mb-1">{data.date}</p>
                    <p className="text-sm" style={{ color: 'var(--color-navy-300)' }}>
                      Visibility: <span className="text-blue-400">{formatPercent(data.visibility)}</span>
                    </p>
                  </div>
                );
              }}
            />
            <Line 
              type="monotone" 
              dataKey="visibility" 
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#60a5fa' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// ============================================
// Sentiment Distribution
// ============================================

export function SentimentChart({ data, className }) {
  const { positive = 0, neutral = 0, negative = 0 } = data.sentiment || {};
  const total = positive + neutral + negative;
  
  if (total === 0) {
    return (
      <Card className={cn('p-6', className)}>
        <h3 className="text-lg font-semibold text-white mb-4">Sentiment</h3>
        <p style={{ color: 'var(--color-navy-500)' }}>No sentiment data available</p>
      </Card>
    );
  }

  const segments = [
    { label: 'Positive', value: positive, color: '#22c55e', percent: (positive / total) * 100 },
    { label: 'Neutral', value: neutral, color: '#627d98', percent: (neutral / total) * 100 },
    { label: 'Negative', value: negative, color: '#ef4444', percent: (negative / total) * 100 },
  ];

  return (
    <Card className={cn('p-6', className)}>
      <h3 className="text-lg font-semibold text-white mb-4">Sentiment Distribution</h3>
      
      {/* Stacked bar */}
      <div className="h-4 flex rounded-full overflow-hidden mb-4">
        {segments.map((seg) => (
          <div
            key={seg.label}
            style={{ width: `${seg.percent}%`, backgroundColor: seg.color }}
            className="transition-all duration-500"
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-4">
        {segments.map((seg) => (
          <div key={seg.label}>
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-xs" style={{ color: 'var(--color-navy-400)' }}>{seg.label}</span>
            </div>
            <p className="text-lg font-semibold text-white">{seg.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}