import React, { useRef, useState } from 'react'

const ACCEPT = '.xlsx,.xls,.csv'

export function UploadZone({ onFileSelect, loading }) {
  const [drag, setDrag] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const handleFile = (file) => {
    setError('')
    if (!file) return
    const name = (file.name || '').toLowerCase()
    if (!/\.(xlsx|xls|csv)$/.test(name)) {
      setError('请上传 Excel 文件（.xlsx / .xls）或 CSV')
      return
    }
    onFileSelect(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDrag(false)
    const file = e.dataTransfer?.files?.[0]
    handleFile(file)
  }

  const onDragOver = (e) => {
    e.preventDefault()
    setDrag(true)
  }

  const onDragLeave = () => setDrag(false)

  const onInputChange = (e) => {
    handleFile(e.target?.files?.[0])
    e.target.value = ''
  }

  return (
    <div className="upload-zone-wrapper">
      <div
        className={`upload-zone ${drag ? 'drag-over' : ''} ${loading ? 'loading' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          onChange={onInputChange}
          className="upload-input"
        />
        {loading ? (
          <div className="upload-loading">
            <span className="spinner" />
            <span>正在解析并分析…</span>
          </div>
        ) : (
          <>
            <div className="upload-icon">📊</div>
            <p className="upload-text">拖拽 Excel 文件到此处，或点击选择文件</p>
            <p className="upload-hint">支持 .xlsx、.xls、.csv</p>
          </>
        )}
      </div>
      {error && <p className="upload-error">{error}</p>}
    </div>
  )
}
