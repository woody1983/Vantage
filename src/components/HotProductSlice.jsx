import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const HEAT_COLORS = ['#22d3ee', '#34d399', '#fbbf24', '#f472b6', '#f87171']

function getHeatColor(rank, total) {
  if (total <= 0) return HEAT_COLORS[0]
  const idx = Math.min(rank, Math.floor((rank / total) * HEAT_COLORS.length))
  return HEAT_COLORS[Math.min(idx, HEAT_COLORS.length - 1)]
}

export function HotProductSlice({ list, valueColumn, hasDateColumn }) {
  if (!list?.length) return null

  const chartData = list.slice(0, 10).map((item, i) => ({
    ...item,
    displayName: item.name.length > 8 ? item.name.slice(0, 8) + '…' : item.name,
    fill: getHeatColor(i, list.length),
  }))

  return (
    <section className="hot-slice">
      <h2 className="section-title">
        <span className="icon">🔥</span>
        爆款趋势预测
      </h2>
      <p className="hot-slice-desc">
        基于<strong>销售占比与近期销量</strong>，识别当前阶段具爆款潜力的产品。
        {hasDateColumn ? ' 已按时间列切分近期/前期。' : ' 按数据行序将最后约 30% 视为近期。'}
      </p>

      <div className="hot-slice-content">
        <div className="hot-chart-wrap">
          <h3 className="chart-title">潜力指数 Top 10（销售占比 × 近期销量）</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 12, right: 24, top: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--text-muted)" />
              <YAxis
                type="category"
                dataKey="displayName"
                width={90}
                stroke="var(--text-muted)"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'hotScore') return [value, '潜力指数']
                  if (name === 'recentUnitPrice') return [value, '该SKU的单价']
                  if (name === 'salesShare') return [value + '%', '销售占比']
                  return [value, name]
                }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0]?.payload
                  if (!d) return null
                  return (
                    <div className="hot-tooltip">
                      <div className="hot-tooltip-name">{d.name}</div>
                      <div>总订单量: <strong>{d.totalOrders != null ? d.totalOrders.toLocaleString() : '—'}</strong></div>
                      <div>潜力指数: <strong>{d.hotScore}</strong></div>
                      <div>该SKU的单价: <strong>{d.recentUnitPrice != null ? Number(d.recentUnitPrice).toLocaleString() : '—'}</strong></div>
                      <div>该SKU的销售总额: <strong>{d.totalSales != null ? Number(d.totalSales).toLocaleString() : '—'}</strong></div>
                      <div>销售占比: <strong>{d.salesShare}%</strong></div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="hotScore" name="hotScore" radius={[0, 4, 4, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={chartData[i].fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="hot-table-wrap">
          <h3 className="chart-title">爆款潜力列表</h3>
          <div className="hot-table-scroll">
            <table className="hot-table">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>产品</th>
                  <th>总订单量</th>
                  <th>该SKU的单价</th>
                  <th>该SKU的销售总额</th>
                  <th>销售占比</th>
                  <th>潜力指数</th>
                </tr>
              </thead>
              <tbody>
                {list.map((row, i) => (
                  <tr key={row.name}>
                    <td className="rank">{i + 1}</td>
                    <td className="name" title={row.name}>{row.name}</td>
                    <td>{row.totalOrders != null ? row.totalOrders.toLocaleString() : '—'}</td>
                    <td>{row.recentUnitPrice != null ? Number(row.recentUnitPrice).toLocaleString() : '—'}</td>
                    <td>{typeof row.totalSales === 'number' ? row.totalSales.toLocaleString() : row.totalSales}</td>
                    <td>{row.salesShare}%</td>
                    <td className="score">{row.hotScore}</td>
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
