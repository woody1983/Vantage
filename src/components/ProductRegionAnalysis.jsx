import React, { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const CHART_COLORS = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#fb923c', '#94a3b8', '#f87171', '#2dd4bf']

/**
 * 产品地区分布分析组件
 * 展示每个产品在不同地区的用户分布情况
 */
export function ProductRegionAnalysis({ data, productColumn, regionColumn }) {
  const [selectedProduct, setSelectedProduct] = useState(null)

  if (!data?.length) return null

  // 默认选中第一个产品
  const currentProduct = selectedProduct || data[0]

  // 准备图表数据
  const regionChartData = currentProduct.regions.slice(0, 10).map((r, i) => ({
    name: r.region,
    value: r.count,
    percent: r.percent,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }))

  const handleProductSelect = (product) => {
    setSelectedProduct(product)
  }

  return (
    <section className="product-region-section">
      <h2 className="section-title">
        <span className="icon">🎯</span>
        产品地区分布分析
      </h2>
      <p className="section-desc">
        分析每个产品在不同地区的用户分布，识别哪些地区对哪些产品更青睐。基于「{productColumn}」和「{regionColumn}」列。
      </p>

      <div className="product-region-content">
        {/* 左侧：产品列表 */}
        <div className="product-list-panel">
          <h3 className="panel-title">产品列表（按订单数排序）</h3>
          <div className="product-list-scroll">
            <table className="product-list-table">
              <thead>
                <tr>
                  <th>产品</th>
                  <th>总订单</th>
                  <th>主要地区</th>
                  <th>占比</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr
                    key={item.product}
                    className={selectedProduct?.product === item.product ? 'selected' : ''}
                    onClick={() => handleProductSelect(item)}
                  >
                    <td className="product-name" title={item.product}>{item.product}</td>
                    <td>{item.totalOrders.toLocaleString()}</td>
                    <td>{item.topRegion}</td>
                    <td>{item.topRegionShare.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 右侧：地区分布详情 */}
        <div className="region-detail-panel">
          <div className="detail-header">
            <h3 className="panel-title">{currentProduct.product}</h3>
            <div className="product-stats">
              <span className="stat-item">总订单数: <strong>{currentProduct.totalOrders.toLocaleString()}</strong></span>
              <span className="stat-item">主要地区: <strong>{currentProduct.topRegion}</strong></span>
              <span className="stat-item">占比: <strong>{currentProduct.topRegionShare.toFixed(1)}%</strong></span>
            </div>
          </div>

          <div className="charts-row">
            {/* 柱状图 */}
            <div className="chart-box">
              <h4 className="chart-subtitle">地区订单分布（Top 10）</h4>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={regionChartData} layout="vertical" margin={{ left: 80, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" stroke="var(--text-muted)" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={70}
                    stroke="var(--text-muted)"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value, name, props) => {
                      if (name === 'value') return [value, '订单数']
                      if (name === 'percent') return [props.payload.percent.toFixed(1) + '%', '占比']
                      return [value, name]
                    }}
                  />
                  <Bar dataKey="value" name="value" radius={[0, 4, 4, 0]}>
                    {regionChartData.map((_, i) => (
                      <Cell key={i} fill={regionChartData[i].fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 饼图 */}
            <div className="chart-box">
              <h4 className="chart-subtitle">地区占比分布（Top 10）</h4>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={regionChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {regionChartData.map((_, i) => (
                      <Cell key={i} fill={regionChartData[i].fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value.toLocaleString()} (${props.payload.percent.toFixed(1)}%)`,
                      name
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 详细数据表格 */}
          <div className="detail-table-box">
            <h4 className="chart-subtitle">地区分布详情</h4>
            <table className="region-detail-table">
              <thead>
                <tr>
                  <th>地区</th>
                  <th>订单数</th>
                  <th>占比</th>
                  <th>占比条</th>
                </tr>
              </thead>
              <tbody>
                {currentProduct.regions.map((region, i) => (
                  <tr key={region.region}>
                    <td className="region-name">{region.region}</td>
                    <td className="region-count">{region.count.toLocaleString()}</td>
                    <td className="region-percent">{region.percent.toFixed(2)}%</td>
                    <td className="region-bar-cell">
                      <div
                        className="region-bar"
                        style={{
                          width: `${Math.max(region.percent, 1)}%`,
                          backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
