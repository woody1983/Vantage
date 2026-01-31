import React from 'react'

export function SensitiveReport({ byColumn, summary, totalCount }) {
  const columns = byColumn ? Object.values(byColumn) : []
  const hasFindings = columns.some((c) => c.findings?.length > 0) || (summary?.length > 0)

  return (
    <div className="sensitive-report">
      <h2 className="section-title">
        <span className="icon">🛡️</span>
        敏感信息检测报告
      </h2>
      {!hasFindings ? (
        <div className="sensitive-empty">
          <p>未在本次数据中检测到常见敏感信息类型。</p>
          <p className="muted">已检测：手机号、身份证、邮箱、银行卡、中文姓名等。</p>
        </div>
      ) : (
        <>
          <div className="sensitive-summary">
            <div className="summary-card total">
              <span className="label">检测到敏感信息总数</span>
              <span className="value">{totalCount ?? 0}</span>
            </div>
            <div className="summary-tags">
              {(summary || []).map(({ type, count }) => (
                <span key={type} className="tag">
                  {type}: {count}
                </span>
              ))}
            </div>
          </div>
          <div className="sensitive-by-column">
            <h3>按列分布</h3>
            {columns
              .filter((c) => c.findings?.length > 0)
              .map((col) => (
                <div key={col.column} className="column-block">
                  <strong>{col.column}</strong>
                  <ul>
                    {col.findings.map((f, i) => (
                      <li key={i}>
                        <span className="type-badge">{f.type}</span>
                        <span className="muted"> {f.description}，共 {f.count} 处</span>
                        {f.values?.length > 0 && (
                          <span className="sample"> 示例: {f.values.slice(0, 2).join('、')}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  )
}
