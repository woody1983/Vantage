import * as XLSX from 'xlsx'

/**
 * 将表头行变为唯一键：重复列名依次改为 "原名_2", "原名_3" …
 * 这样两个 "Unit_Price" 会变成 "Unit_Price" 和 "Unit_Price_2"，避免第二列覆盖第一列
 */
function makeUniqueHeaders(rawHeaders) {
  const count = {}
  return rawHeaders.map((h) => {
    const key = h == null || String(h).trim() === '' ? '未命名列' : String(h).trim()
    const n = (count[key] = (count[key] || 0) + 1)
    return n === 1 ? key : `${key}_${n}`
  })
}

/**
 * 解析 Excel 文件为 JSON 数组
 * 若表头有重复列名（如两个 Unit_Price），会自动重命名为 Unit_Price、Unit_Price_2，保留两列数据
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const raw = XLSX.utils.sheet_to_json(firstSheet, { defval: '', header: 1 })
        if (!raw.length) {
          resolve([])
          return
        }
        const headers = makeUniqueHeaders(raw[0])
        const json = raw.slice(1).map((row) => {
          const obj = {}
          headers.forEach((key, i) => {
            obj[key] = row[i] !== undefined ? row[i] : ''
          })
          return obj
        })
        resolve(json)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 敏感信息类型与检测正则
 */
const SENSITIVE_PATTERNS = [
  {
    type: '手机号',
    pattern: /1[3-9]\d{9}/g,
    description: '11 位中国大陆手机号',
  },
  {
    type: '身份证号',
    pattern: /\b[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g,
    description: '18 位身份证号',
  },
  {
    type: '邮箱',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    description: '电子邮箱地址',
  },
  {
    type: '银行卡号',
    pattern: /\b\d{16,19}\b/g,
    description: '16–19 位银行卡号',
  },
  {
    type: '姓名（中文）',
    pattern: /[\u4e00-\u9fa5]{2,4}(?=\s|$|,|，)/g,
    description: '2–4 个中文字符（可能为姓名）',
  },
]

/**
 * 对单个单元格值检测敏感信息
 */
function detectSensitiveInValue(value) {
  if (value == null || typeof value !== 'string') return []
  const found = []
  const str = String(value).trim()
  for (const { type, pattern, description } of SENSITIVE_PATTERNS) {
    const matches = str.match(pattern)
    if (matches) {
      const unique = [...new Set(matches)]
      found.push({ type, description, values: unique, count: unique.length })
    }
  }
  return found
}

/**
 * 分析整张表的敏感信息：按列汇总
 */
export function analyzeSensitiveInfo(rows) {
  if (!rows?.length) return { byColumn: {}, summary: [], totalCount: 0 }

  const byColumn = {}
  const summaryMap = {}

  for (const row of rows) {
    for (const [colName, value] of Object.entries(row)) {
      if (!byColumn[colName]) byColumn[colName] = { column: colName, findings: [] }
      const findings = detectSensitiveInValue(value)
      for (const f of findings) {
        byColumn[colName].findings.push({
          ...f,
          sampleValue: value,
        })
        summaryMap[f.type] = (summaryMap[f.type] || 0) + f.count
      }
    }
  }

  const summary = Object.entries(summaryMap).map(([type, count]) => ({ type, count }))
  const totalCount = summary.reduce((s, i) => s + i.count, 0)

  return { byColumn, summary, totalCount }
}

/**
 * 推断列类型（用于后续图表维度）
 */
export function inferColumnTypes(rows) {
  if (!rows?.length) return {}
  const first = rows[0]
  const types = {}
  for (const key of Object.keys(first)) {
    const values = rows.map((r) => r[key]).filter((v) => v != null && String(v).trim() !== '')
    const numericCount = values.filter((v) => !Number.isNaN(Number(v)) && String(v).trim() !== '').length
    const uniqueCount = new Set(values.map(String)).size
    if (numericCount / values.length > 0.8) types[key] = 'number'
    else if (uniqueCount <= 20 && values.length > 0) types[key] = 'category'
    else types[key] = 'string'
  }
  return types
}

/**
 * 按某列聚合计数（用于地域/来源等分布）
 */
export function aggregateByColumn(rows, columnName) {
  const map = {}
  for (const row of rows) {
    const v = row[columnName]
    const key = v != null && String(v).trim() !== '' ? String(v).trim() : '（空）'
    map[key] = (map[key] || 0) + 1
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

/**
 * 取数值列并按另一列分组求和
 */
export function sumByGroup(rows, groupColumn, valueColumn) {
  const map = {}
  for (const row of rows) {
    const key = row[groupColumn] != null ? String(row[groupColumn]).trim() : '（空）'
    const num = Number(row[valueColumn])
    if (!Number.isNaN(num)) {
      map[key] = (map[key] || 0) + num
    }
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

/**
 * 自动选择最合适的"地域/来源"列（支持中英文）
 * - 中文关键词：地区、省、市、来源、区域、地域、城市、地址、所在地
 * - 英文关键词：state, region, province, city, address, location, area, country, zone
 */
export function findRegionLikeColumn(rows) {
  if (!rows?.length) return null
  const keys = Object.keys(rows[0])
  const keywords = [
    // 中文
    '地区', '省', '市', '来源', '区域', '地域', '城市', '地址', '所在地',
    // 英文
    'state', 'region', 'province', 'city', 'address', 'location', 'area', 'country', 'zone',
    'state_', 'region_', 'province_', 'city_', 'address_', 'location_', 'area_', 'country_', 'zone_',
  ]
  const keyLower = keys.map((k) => k.toLowerCase())
  for (const keyword of keywords) {
    const index = keyLower.findIndex((k) => k.includes(keyword.toLowerCase()))
    if (index !== -1) return keys[index]
  }
  return null
}

/**
 * 自动选择数值列（用于金额/数量等）
 */
export function findNumericColumns(rows) {
  if (!rows?.length) return []
  const types = inferColumnTypes(rows)
  return Object.entries(types).filter(([, t]) => t === 'number').map(([k]) => k)
}

/**
 * 自动选择"产品/商品"列（用于爆款预测），支持中英文
 * - 中文关键词：产品、商品、品名、SKU、名称、品类、类目、货品
 * - 英文关键词：product, item, sku, name, category, goods, merchandise
 */
export function findProductLikeColumn(rows) {
  if (!rows?.length) return null
  const keys = Object.keys(rows[0])
  const keywords = [
    // 中文
    '产品', '商品', '品名', 'SKU', '名称', '品类', '类目', '货品',
    // 英文
    'product', 'item', 'sku', 'name', 'category', 'goods', 'merchandise',
    'product_', 'item_', 'sku_', 'name_', 'category_', 'goods_', 'merchandise_',
  ]
  const keyLower = keys.map((k) => k.toLowerCase())
  for (const keyword of keywords) {
    const index = keyLower.findIndex((k) => k.includes(keyword.toLowerCase()))
    if (index !== -1) return keys[index]
  }
  return null
}

/**
 * 自动选择“日期/时间”列（用于近期 vs 前期 切分）
 */
export function findDateLikeColumn(rows) {
  if (!rows?.length) return null
  const keys = Object.keys(rows[0])
  const keywords = ['日期', '时间', '下单', '销售', '创建', '订单']
  for (const k of keys) {
    if (keywords.some((w) => k.includes(w))) return k
  }
  return null
}

/**
 * 解析为时间戳（支持 Excel 序列号、ISO 字符串、YYYY-MM-DD 等）
 */
function parseDate(value) {
  if (value == null || value === '') return NaN
  const n = Number(value)
  if (!Number.isNaN(n)) {
    if (n > 100000) return n
    if (n > 1000) return (n - 25569) * 86400 * 1000
    return NaN
  }
  const str = String(value).trim()
  const d = new Date(str)
  return Number.isNaN(d.getTime()) ? NaN : d.getTime()
}

/**
 * 热销产品地区分析：分析销售量前3的产品在不同地区的分布
 * - 按销量排序，取前3个产品
 * - 返回可用于堆叠柱状图/分组柱状图展示的数据
 */
export function analyzeTopProductsByRegion(rows, productColumn, regionColumn, valueColumn) {
  if (!rows?.length || !productColumn || !regionColumn || !valueColumn) return []

  const getProduct = (r) => {
    const v = r[productColumn]
    return v != null && String(v).trim() !== '' ? String(v).trim() : '（未命名）'
  }

  const getRegion = (r) => {
    const v = r[regionColumn]
    return v != null && String(v).trim() !== '' ? String(v).trim() : '（未命名）'
  }

  const getValue = (r) => {
    const n = Number(r[valueColumn])
    return Number.isNaN(n) ? 0 : n
  }

  // 按产品统计总销量
  const productSales = {}
  for (const row of rows) {
    const product = getProduct(row)
    const value = getValue(row)
    productSales[product] = (productSales[product] || 0) + value
  }

  // 获取销量前3的产品
  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name)

  if (topProducts.length === 0) return []

  // 统计前3产品在各地区的销量分布
  const productRegionMap = {}
  const regionTotals = {}

  for (const row of rows) {
    const product = getProduct(row)
    const region = getRegion(row)
    const value = getValue(row)

    // 只统计前3的产品
    if (!topProducts.includes(product)) continue

    if (!productRegionMap[product]) {
      productRegionMap[product] = {}
    }
    productRegionMap[product][region] = (productRegionMap[product][region] || 0) + value
    regionTotals[region] = (regionTotals[region] || 0) + value
  }

  // 获取销量前10的地区（用于图表展示）- 按所有产品的总销量排序
  const topRegions = Object.entries(regionTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name]) => name)

  // 准备堆叠柱状图数据
  const stackData = topRegions.map((region) => {
    const dataPoint = { name: region }
    for (const product of topProducts) {
      dataPoint[product] = productRegionMap[product]?.[region] || 0
    }
    return dataPoint
  })

  // 准备分组柱状图数据
  // 为每个产品单独按该产品在各地区的销量排序（符合市场部习惯）
  const groupData = topProducts.map((product) => {
    // 获取该产品在各地区的销量，并按销量降序排序
    const productRegions = Object.entries(productRegionMap[product] || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    // 提取地区顺序
    const regionOrder = productRegions.map(([region]) => region)

    const dataPoint = { product, _regionOrder: regionOrder }
    // 按该产品自己的销量排序填充数据
    for (const [region, value] of productRegions) {
      dataPoint[region] = value
    }
    // 添加总销量
    dataPoint.total = productSales[product]
    return dataPoint
  })

  return {
    topProducts,
    topRegions,
    productSales,
    stackData,
    groupData,
  }
}

/**
 * 产品地区分布分析：分析每个产品在不同地区的用户分布
 * - 返回每个产品的地区分布，包括订单数、占比
 * - 可用于分析哪些地区对哪些产品更青睐
 */
export function analyzeProductRegionDistribution(rows, productColumn, regionColumn) {
  if (!rows?.length || !productColumn || !regionColumn) return []

  const getProduct = (r) => {
    const v = r[productColumn]
    return v != null && String(v).trim() !== '' ? String(v).trim() : '（未命名）'
  }

  const getRegion = (r) => {
    const v = r[regionColumn]
    return v != null && String(v).trim() !== '' ? String(v).trim() : '（未命名）'
  }

  // 按产品分组，统计每个产品在不同地区的订单数
  const productRegionMap = {}
  const totalByProduct = {}

  for (const row of rows) {
    const product = getProduct(row)
    const region = getRegion(row)

    if (!productRegionMap[product]) {
      productRegionMap[product] = {}
    }
    productRegionMap[product][region] = (productRegionMap[product][region] || 0) + 1
    totalByProduct[product] = (totalByProduct[product] || 0) + 1
  }

  // 转换为数组格式，并计算占比
  const result = []
  for (const [product, regionData] of Object.entries(productRegionMap)) {
    const regions = Object.entries(regionData)
      .map(([region, count]) => ({
        region,
        count,
        percent: totalByProduct[product] > 0 ? (count / totalByProduct[product]) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)

    result.push({
      product,
      totalOrders: totalByProduct[product],
      regions,
      // 计算每个地区的集中度指数：最高的地区占比
      topRegionShare: regions.length > 0 ? regions[0].percent : 0,
      topRegion: regions.length > 0 ? regions[0].region : '—',
    })
  }

  // 按总订单数排序，取前20个产品
  return result
    .sort((a, b) => b.totalOrders - a.totalOrders)
    .slice(0, 20)
}

/**
 * 爆款趋势预测：基于销售痕迹与近期/前期对比
 * - 若有日期列：按时间排序，最近 30% 时间区间为「近期」，其余为「前期」
 * - 若无日期列：假设行序即时间序，最后 30% 行为「近期」，前 70% 为「前期」
 * - 潜力分 = 销售占比 × 近期销量权重，突出「销售额占比高且近期表现好」的产品
 * - 销售占比 = 该产品总销售额 ÷ 所有产品总销售额 × 100%
 */
export function predictHotProducts(rows, productColumn, valueColumn, dateColumn) {
  if (!rows?.length || !productColumn || !valueColumn) return []

  const getProduct = (r) => {
    const v = r[productColumn]
    return v != null && String(v).trim() !== '' ? String(v).trim() : '（未命名）'
  }
  const getValue = (r) => {
    const n = Number(r[valueColumn])
    return Number.isNaN(n) ? 0 : n
  }

  let recentRows
  let earlierRows

  if (dateColumn) {
    const withTs = rows.map((r) => ({ ...r, _ts: parseDate(r[dateColumn]) })).filter((r) => !Number.isNaN(r._ts))
    if (withTs.length < 2) {
      const recentCount = Math.max(1, Math.floor(rows.length * 0.3))
      recentRows = rows.slice(0, recentCount)
      earlierRows = rows.slice(recentCount)
    } else {
      withTs.sort((a, b) => a._ts - b._ts)
      const minTs = withTs[0]._ts
      const maxTs = withTs[withTs.length - 1]._ts
      const span = maxTs - minTs
      const cutTs = maxTs - span * 0.3
      recentRows = withTs.filter((r) => r._ts >= cutTs)
      earlierRows = withTs.filter((r) => r._ts < cutTs)
    }
  } else {
    // 无日期列时：默认「前几行 = 最近的数据」（常见导出顺序），前 30% 为近期，后 70% 为前期
    const recentCount = Math.max(1, Math.floor(rows.length * 0.3))
    recentRows = rows.slice(0, recentCount)
    earlierRows = rows.slice(recentCount)
  }

  const recentByProduct = {}
  const earlierByProduct = {}
  const recentOrderCountByProduct = {}
  const earlierOrderCountByProduct = {}

  for (const r of recentRows) {
    const p = getProduct(r)
    const v = getValue(r)
    recentByProduct[p] = (recentByProduct[p] || 0) + v
    recentOrderCountByProduct[p] = (recentOrderCountByProduct[p] || 0) + 1
  }
  for (const r of earlierRows) {
    const p = getProduct(r)
    const v = getValue(r)
    earlierByProduct[p] = (earlierByProduct[p] || 0) + v
    earlierOrderCountByProduct[p] = (earlierOrderCountByProduct[p] || 0) + 1
  }

  const products = [...new Set([...Object.keys(recentByProduct), ...Object.keys(earlierByProduct)])]

  // 计算所有产品的总销售额，用于计算销售占比
  let allTotalSales = 0
  for (const name of products) {
    allTotalSales += (recentByProduct[name] || 0) + (earlierByProduct[name] || 0)
  }

  const result = products.map((name) => {
    const recent = recentByProduct[name] || 0
    const earlier = earlierByProduct[name] || 0
    const total = recent + earlier
    const recentOrders = recentOrderCountByProduct[name] || 0
    const earlierOrders = earlierOrderCountByProduct[name] || 0
    const totalOrders = recentOrders + earlierOrders
    // 销售占比：该产品总销售额占所有产品总销售额的百分比
    const salesShare = allTotalSales > 0 ? (total / allTotalSales) * 100 : 0
    const recentNorm = Math.sqrt(recent + 1)
    const shareNorm = Math.min(5, salesShare / 10) // 销售占比归一化，避免过大
    const hotScore = shareNorm * recentNorm
    const recentUnitPrice = recentOrders > 0 ? recent / recentOrders : 0
    return {
      name,
      totalSales: Math.round(total * 100) / 100,
      recentSales: Math.round(recent * 100) / 100,
      earlierSales: Math.round(earlier * 100) / 100,
      recentUnitPrice: Math.round(recentUnitPrice * 100) / 100,
      salesShare: Math.round(salesShare * 100) / 100,
      hotScore: Math.round(hotScore * 100) / 100,
      totalOrders,
      recentOrders,
      earlierOrders,
    }
  })

  return result
    .filter((p) => p.recentSales > 0)
    .sort((a, b) => b.hotScore - a.hotScore)
    .slice(0, 15)
}
