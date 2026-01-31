import React, { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const CHART_COLORS = ['#22d3ee', '#a78bfa', '#34d399']

/**
 * 销量前3产品地区分布数据看板
 */
export function TopProductsRegionDashboard({ data, productColumn, regionColumn, valueColumn }) {
  const [chartType, setChartType] = useState('stack') // 'stack' | 'group'

  if (!data?.topProducts?.length) return null

  const { topProducts, topRegions, productSales, stackData, groupData } = data

  // 从分组数据中提取所有地区键（用于图例）
  const allRegionsInGroupData = groupData.reduce((regions, item) => {
    Object.keys(item).forEach((key) => {
      if (key !== 'product' && key !== 'total' && key !== '_regionOrder' && !regions.includes(key)) {
        regions.push(key)
      }
    })
    return regions
  }, [])

  return (
    <section className="top-products-dashboard">
      <h2 className="section-title">
        <span className="icon">🏆</span>
        销量 Top 3 产品地区分布
      </h2>
      <p className="section-desc">
        分析销售量最高的 3 个产品在不同地区的分布情况。基于「{productColumn}」、「{regionColumn}」和「{valueColumn}」列。
      </p>

      {/* 产品概览卡片 */}
      <div className="products-overview">
        {topProducts.map((product, index) => (
          <div key={product} className={`product-card rank-${index + 1}`}>
            <div className="product-rank">#{index + 1}</div>
            <div className="product-info">
              <div className="product-name" title={product}>{product}</div>
              <div className="product-sales">
                销量: <strong>{productSales[product].toLocaleString()}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 图表切换按钮 */}
      <div className="chart-toggle">
        <button
          className={`toggle-btn ${chartType === 'stack' ? 'active' : ''}`}
          onClick={() => setChartType('stack')}
        >
          堆叠柱状图
        </button>
        <button
          className={`toggle-btn ${chartType === 'group' ? 'active' : ''}`}
          onClick={() => setChartType('group')}
        >
          分组柱状图
        </button>
      </div>

      {/* 图表展示区 */}
      <div className="dashboard-chart">
        {chartType === 'stack' ? (
          <ResponsiveContainer width="100%" height={380}>
            <BarChart
              data={stackData}
              margin={{ top: 20, right: 30, left: 60, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                stroke="var(--text-muted)"
                angle={-30}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                stroke="var(--text-muted)"
                tickFormatter={(value) =>
                  value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` :
                  value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value
                }
              />
              <Tooltip
                formatter={(value, name) => [Number(value).toLocaleString(), name]}
                contentStyle={{ backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border)', borderRadius: '8px' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(value) => (
                  <span style={{ color: 'var(--text)' }}>{value}</span>
                )}
              />
              {topProducts.map((product, index) => (
                <Bar
                  key={product}
                  dataKey={product}
                  stackId="a"
                  fill={CHART_COLORS[index]}
                  name={product}
                  radius={[0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={380}>
            <BarChart
              data={groupData}
              margin={{ top: 20, right: 30, left: 60, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="product"
                stroke="var(--text-muted)"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + '…' : value}
              />
              <YAxis
                stroke="var(--text-muted)"
                tickFormatter={(value) =>
                  value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` :
                  value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value
                }
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null

                  // 获取当前产品的数据
                  const currentProduct = label
                  const currentData = groupData.find((item) => item.product === currentProduct)

                  if (!currentData) return null

                  // 按该产品在各地区的销量排序
                  const sortedRegions = Object.entries(currentData)
                    .filter(([key]) => key !== 'product' && key !== 'total' && key !== '_regionOrder')
                    .map(([region, value]) => ({
                      region,
                      value,
                    }))
                    .sort((a, b) => b.value - a.value)

                  return (
                    <div className="custom-tooltip">
                      <div className="tooltip-title">{currentProduct}</div>
                      {sortedRegions.map((item, index) => (
                        <div key={item.region} className="tooltip-row">
                          <span className="tooltip-region">{item.region}</span>
                          <span className="tooltip-value">{Number(item.value).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(value) => (
                  <span style={{ color: 'var(--text)' }}>{value}</span>
                )}
              />
              {allRegionsInGroupData.map((region, index) => (
                <Bar
                  key={region}
                  dataKey={region}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  name={region}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 数据表格 */}
      <div className="data-table-box">
        <h3 className="chart-subtitle">详细数据</h3>
        <table className="detail-data-table">
          <thead>
            <tr>
              <th>产品</th>
              <th>总销量</th>
              <th>主要地区</th>
              <th>占比</th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((product, index) => {
              const productData = groupData[index]
              // 从当前产品的数据中提取地区并按销量排序
              const regions = Object.entries(productData)
                .filter(([key]) => key !== 'product' && key !== 'total' && key !== '_regionOrder')
                .map(([region, value]) => ({
                  region,
                  value,
                  percent: productSales[product] > 0 ? (value / productSales[product]) * 100 : 0,
                }))
                .sort((a, b) => b.value - a.value)

              const topRegion = regions[0]

              return (
                <tr key={product}>
                  <td className="product-cell">
                    <span className={`rank-badge rank-${index + 1}`}>#{index + 1}</span>
                    <span className="product-name-text" title={product}>{product}</span>
                  </td>
                  <td className="sales-cell">{productSales[product].toLocaleString()}</td>
                  <td className="region-cell">{topRegion?.region || '—'}</td>
                  <td className="percent-cell">{topRegion?.percent?.toFixed(1) || 0}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
