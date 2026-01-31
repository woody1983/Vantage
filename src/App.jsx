import React, { useState, useCallback } from 'react'
import { parseExcelFile, analyzeSensitiveInfo, inferColumnTypes, aggregateByColumn, sumByGroup, findRegionLikeColumn, findNumericColumns, findProductLikeColumn, findDateLikeColumn, predictHotProducts, analyzeProductRegionDistribution, analyzeTopProductsByRegion } from './utils/excelParser'
import { UploadZone } from './components/UploadZone'
import { SensitiveReport } from './components/SensitiveReport'
import { HotProductSlice } from './components/HotProductSlice'
import { ProductRegionAnalysis } from './components/ProductRegionAnalysis'
import { TopProductsRegionDashboard } from './components/TopProductsRegionDashboard'
import {
  RegionPieChart,
  RegionBarChart,
  AmountBarChart,
  CategoryPieChart,
  TrendLineChart,
} from './components/Charts'
import './App.css'

export default function App() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [sensitive, setSensitive] = useState(null)
  const [columnTypes, setColumnTypes] = useState({})

  const handleFile = useCallback(async (file) => {
    setError('')
    setLoading(true)
    try {
      const data = await parseExcelFile(file)
      setRows(data)
      setSensitive(analyzeSensitiveInfo(data))
      setColumnTypes(inferColumnTypes(data))
    } catch (e) {
      setError(e?.message || '解析失败，请检查文件格式')
      setRows([])
      setSensitive(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const regionColumn = findRegionLikeColumn(rows)
  const numericColumns = findNumericColumns(rows)
  const regionAgg = regionColumn ? aggregateByColumn(rows, regionColumn) : []
  const numericCol = numericColumns[0]
  const amountByRegion = regionColumn && numericCol ? sumByGroup(rows, regionColumn, numericCol) : []

  const categoryColumns = Object.entries(columnTypes)
    .filter(([, t]) => t === 'category')
    .map(([k]) => k)
  const firstCategory = categoryColumns[0]
  const categoryAgg = firstCategory ? aggregateByColumn(rows, firstCategory) : []

  const allColumns = rows[0] ? Object.keys(rows[0]) : []
  const otherDimension = allColumns.find((c) => c !== regionColumn && c !== firstCategory && columnTypes[c] === 'category') || allColumns[0]
  const otherAgg = otherDimension ? aggregateByColumn(rows, otherDimension) : []

  const productColumn = findProductLikeColumn(rows) || firstCategory || allColumns[0]
  const dateColumn = findDateLikeColumn(rows)
  const hotProducts = productColumn && numericCol
    ? predictHotProducts(rows, productColumn, numericCol, dateColumn)
    : []
  const productRegionData = productColumn && regionColumn
    ? analyzeProductRegionDistribution(rows, productColumn, regionColumn)
    : []
  const topProductsRegionData = productColumn && regionColumn && numericCol
    ? analyzeTopProductsByRegion(rows, productColumn, regionColumn, numericCol)
    : null

  return (
    <div className="app">
      <header className="header">
        <h1>销售数据敏感信息分析与多维展示</h1>
        <p className="subtitle">上传 Excel 后自动检测敏感信息，并从地域、金额、分类等维度展示数据特征</p>
      </header>

      <main className="main">
        <UploadZone onFileSelect={handleFile} loading={loading} />
        {error && <div className="global-error">{error}</div>}

        {rows.length > 0 && (
          <>
            <section className="overview">
              <div className="overview-card">
                <span className="overview-label">总记录数</span>
                <span className="overview-value">{rows.length}</span>
              </div>
              <div className="overview-card">
                <span className="overview-label">数据列数</span>
                <span className="overview-value">{allColumns.length}</span>
              </div>
              {sensitive?.totalCount != null && sensitive.totalCount > 0 && (
                <div className="overview-card warn">
                  <span className="overview-label">敏感信息条数</span>
                  <span className="overview-value">{sensitive.totalCount}</span>
                </div>
              )}
            </section>

            {sensitive && (
              <section className="section">
                <SensitiveReport
                  byColumn={sensitive.byColumn}
                  summary={sensitive.summary}
                  totalCount={sensitive.totalCount}
                />
              </section>
            )}

            {hotProducts.length > 0 && (
              <section className="section">
                <HotProductSlice
                  list={hotProducts}
                  valueColumn={numericCol || '销量'}
                  hasDateColumn={!!dateColumn}
                />
              </section>
            )}

            {productRegionData.length > 0 && (
              <section className="section">
                <ProductRegionAnalysis
                  data={productRegionData}
                  productColumn={productColumn}
                  regionColumn={regionColumn}
                />
              </section>
            )}

            {topProductsRegionData && (
              <section className="section">
                <TopProductsRegionDashboard
                  data={topProductsRegionData}
                  productColumn={productColumn}
                  regionColumn={regionColumn}
                  valueColumn={numericCol}
                />
              </section>
            )}

            <section className="section">
              <h2 className="section-title">
                <span className="icon">📈</span>
                多维度数据分析
              </h2>

              <div className="charts-grid">
                {regionColumn && regionAgg.length > 0 && (
                  <>
                    <RegionPieChart
                      data={regionAgg}
                      title={`客户/销售集中度 · 按「${regionColumn}」`}
                    />
                    <RegionBarChart
                      data={regionAgg}
                      title={`${regionColumn} Top 分布`}
                    />
                  </>
                )}

                {regionColumn && numericCol && amountByRegion.length > 0 && (
                  <AmountBarChart
                    data={amountByRegion}
                    title={`按「${regionColumn}」汇总 · ${numericCol}`}
                    valueLabel={numericCol}
                  />
                )}

                {firstCategory && categoryAgg.length > 0 && (
                  <CategoryPieChart
                    data={categoryAgg}
                    title={`分类分布 · ${firstCategory}`}
                  />
                )}

                {otherDimension && otherAgg.length > 0 && otherDimension !== regionColumn && (
                  <RegionBarChart
                    data={otherAgg}
                    title={`维度「${otherDimension}」分布`}
                  />
                )}

                {otherAgg.length > 0 && (
                  <TrendLineChart
                    data={otherAgg}
                    title={`${otherDimension} 数量趋势`}
                  />
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
