import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts'

const CHART_COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#fb923c', '#94a3b8']

export function RegionPieChart({ data, title }) {
  const chartData = (data || []).slice(0, 10).map((d, i) => ({
    ...d,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }))
  return (
    <div className="chart-card">
      <h3 className="chart-title">{title || '客户/销售地域分布'}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={chartData[i].fill} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => [v, '数量']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function RegionBarChart({ data, title }) {
  const chartData = (data || []).slice(0, 12)
  return (
    <div className="chart-card">
      <h3 className="chart-title">{title || '地域/来源 Top'}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a32" />
          <XAxis type="number" stroke="#71717a" />
          <YAxis type="category" dataKey="name" width={70} stroke="#71717a" tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="value" fill="#22d3ee" radius={[0, 4, 4, 0]} name="数量" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function AmountBarChart({ data, title, valueLabel }) {
  const chartData = (data || []).slice(0, 10)
  return (
    <div className="chart-card">
      <h3 className="chart-title">{title || '金额/数量分布'}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a32" />
          <XAxis dataKey="name" stroke="#71717a" tick={{ fontSize: 11 }} />
          <YAxis stroke="#71717a" tickFormatter={(v) => (v >= 10000 ? `${v / 10000}万` : v)} />
          <Tooltip formatter={(v) => [Number(v).toLocaleString(), valueLabel || '数值']} />
          <Bar dataKey="value" fill="#a78bfa" radius={[4, 4, 0, 0]} name={valueLabel || '数值'} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CategoryPieChart({ data, title }) {
  const chartData = (data || []).slice(0, 8).map((d, i) => ({
    ...d,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }))
  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={chartData[i].fill} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TrendLineChart({ data, title, dataKey }) {
  const chartData = (data || []).slice(0, 20)
  return (
    <div className="chart-card">
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a32" />
          <XAxis dataKey="name" stroke="#71717a" />
          <YAxis stroke="#71717a" />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey || 'value'} stroke="#34d399" strokeWidth={2} dot={{ fill: '#34d399' }} name="数值" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
