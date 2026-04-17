import React, { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts'

const TIMEFRAMES = [
  { label: '1m',  resolution: '1' },
  { label: '5m',  resolution: '5' },
  { label: '15m', resolution: '15' },
  { label: '1h',  resolution: '60' },
  { label: '1D',  resolution: 'D' },
  { label: '1W',  resolution: 'W' },
  { label: '1M',  resolution: 'M' },
]

const TOOLS = [
  { key: 'crosshair', icon: '✛', label: 'Crosshair' },
  { key: 'hline',     icon: '—', label: 'H-Line' },
  { key: 'support',   icon: '▲', label: 'Support' },
  { key: 'resist',    icon: '▼', label: 'Resist' },
]

const TOOL_COLORS = {
  hline:   '#e8c97a',  // gold
  support: '#22c55e',  // green
  resist:  '#ef4444',  // red
}

export default function StockChart({ ticker, onClose }) {
  const chartContainerRef = useRef(null)
  const chartRef          = useRef(null)
  const candleRef         = useRef(null)
  const volRef            = useRef(null)
  const ma50Ref           = useRef(null)
  const ma200Ref          = useRef(null)
  const priceLinesRef     = useRef([])
  const liveRef           = useRef(null)
  const activeToolRef     = useRef('crosshair')

  const [activeTool, setActiveTool] = useState('crosshair')
  const [resolution, setResolution] = useState('D')
  const [info, setInfo]             = useState(null)
  const [loading, setLoading]       = useState(true)

  const setTool = (t) => {
    activeToolRef.current = t
    setActiveTool(t)
  }

  // ── Build chart once ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      width:  chartContainerRef.current.clientWidth,
      height: 400,
      layout: { background: { color: '#111318' }, textColor: '#9ca3af', fontFamily: "'DM Mono', monospace" },
      grid:   { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(201,168,76,0.5)', labelBackgroundColor: '#c9a84c' },
        horzLine: { color: 'rgba(201,168,76,0.5)', labelBackgroundColor: '#c9a84c' },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.07)' },
      timeScale:       { borderColor: 'rgba(255,255,255,0.07)', timeVisible: true },
    })

    chartRef.current = chart

    candleRef.current = chart.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444',
      borderUpColor: '#22c55e', borderDownColor: '#ef4444',
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    })

    volRef.current = chart.addHistogramSeries({
      priceScaleId: 'volume',
      scaleMargins: { top: 0.82, bottom: 0 },
    })

    ma50Ref.current = chart.addLineSeries({
      color: '#f59e0b', lineWidth: 1, title: '50 MA',
      priceLineVisible: false, lastValueVisible: false,
    })

    ma200Ref.current = chart.addLineSeries({
      color: '#a78bfa', lineWidth: 1, lineStyle: LineStyle.Dashed, title: '200 MA',
      priceLineVisible: false, lastValueVisible: false,
    })

    // ── Subscribe to chart clicks for drawing ──────────────────────────────
    chart.subscribeClick((param) => {
      const tool = activeToolRef.current
      if (tool === 'crosshair') return
      if (!param.point || !candleRef.current) return

      const price = candleRef.current.coordinateToPrice(param.point.y)
      if (!price || isNaN(price)) return

      const color = TOOL_COLORS[tool] || '#e8c97a'
      const titleMap = { hline: '──', support: '▲ Support', resist: '▼ Resist' }

      const line = candleRef.current.createPriceLine({
        price,
        color,
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `${titleMap[tool] || ''} $${price.toFixed(2)}`,
      })
      priceLinesRef.current.push(line)
    })

    const ro = new ResizeObserver(() => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    })
    ro.observe(chartContainerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      if (liveRef.current) clearInterval(liveRef.current)
    }
  }, [])

  // ── Load candles ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ticker) return
    loadCandles()
    if (liveRef.current) clearInterval(liveRef.current)
    const ms = ['1','5','15','60'].includes(resolution) ? 10000 : 60000
    liveRef.current = setInterval(updateLive, ms)
    return () => { if (liveRef.current) clearInterval(liveRef.current) }
  }, [ticker, resolution])

  const loadCandles = async () => {
    setLoading(true)
    try {
      const [cd, ti] = await Promise.all([
        fetch(`/api/candles/${ticker}?resolution=${resolution}`).then(r => r.json()),
        fetch(`/api/ticker/${ticker}`).then(r => r.json()),
      ])
      if (cd.candles && candleRef.current) {
        candleRef.current.setData(cd.candles)
        volRef.current?.setData(cd.volume || [])
        ma50Ref.current?.setData(cd.ma50 || [])
        ma200Ref.current?.setData(cd.ma200 || [])
        chartRef.current?.timeScale().fitContent()
      }
      setInfo(ti)
    } catch(e) {}
    setLoading(false)
  }

  const updateLive = async () => {
    try {
      const ti = await fetch(`/api/ticker/${ticker}`).then(r => r.json())
      if (!ti?.price || !candleRef.current) return
      candleRef.current.update({
        time:  Math.floor(Date.now() / 1000),
        open:  ti.price,
        high:  ti.price,
        low:   ti.price,
        close: ti.price,
      })
      setInfo(ti)
    } catch(e) {}
  }

  const clearLines = () => {
    priceLinesRef.current.forEach(l => {
      try { candleRef.current?.removePriceLine(l) } catch(e) {}
    })
    priceLinesRef.current = []
  }

  const up = info?.change_pct >= 0

  return (
    <div style={{ background:'#111318', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, overflow:'hidden', marginTop:8 }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:15, fontWeight:500, color:'#e8c97a' }}>{ticker}</span>
          {info && <>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:14 }}>${info.price?.toLocaleString()}</span>
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color: up?'#22c55e':'#ef4444' }}>
              {up?'+':''}{info.change_pct?.toFixed(2)}%
            </span>
          </>}
          <span style={{ fontSize:11, color:'#f59e0b' }}>━ 50MA</span>
          <span style={{ fontSize:11, color:'#a78bfa' }}>╌ 200MA</span>
          <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#22c55e' }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', display:'inline-block', animation:'pulse-dot 2s infinite' }}/>Live
          </span>
        </div>
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <button onClick={clearLines} style={{ padding:'4px 10px', borderRadius:4, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'#6b7280', fontSize:11, cursor:'pointer' }}>
            Clear All
          </button>
          <button onClick={onClose} style={{ padding:'4px 10px', borderRadius:4, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'#6b7280', fontSize:17, cursor:'pointer', lineHeight:1 }}>×</button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display:'flex', alignItems:'center', gap:4, padding:'6px 12px', borderBottom:'1px solid rgba(255,255,255,0.07)', background:'rgba(0,0,0,0.2)', flexWrap:'wrap' }}>
        {/* Timeframes */}
        {TIMEFRAMES.map(tf => (
          <button key={tf.resolution} onClick={() => setResolution(tf.resolution)}
            style={{ padding:'3px 10px', borderRadius:4, border:'none', fontSize:12, cursor:'pointer',
              background: resolution===tf.resolution ? 'rgba(201,168,76,0.2)':'transparent',
              color: resolution===tf.resolution ? '#e8c97a':'#6b7280' }}>
            {tf.label}
          </button>
        ))}

        <div style={{ width:1, height:16, background:'rgba(255,255,255,0.1)', margin:'0 6px' }} />

        {/* Drawing tools */}
        {TOOLS.map(t => (
          <button key={t.key} onClick={() => setTool(t.key)} title={t.label}
            style={{ padding:'4px 12px', borderRadius:4, fontSize:12, cursor:'pointer',
              border: activeTool===t.key ? `1px solid ${TOOL_COLORS[t.key]||'#c9a84c'}` : '1px solid rgba(255,255,255,0.1)',
              background: activeTool===t.key ? `${TOOL_COLORS[t.key]||'#c9a84c'}22` : 'transparent',
              color: activeTool===t.key ? (TOOL_COLORS[t.key]||'#e8c97a') : '#6b7280',
              fontWeight: activeTool===t.key ? 500 : 400 }}>
            {t.icon} {t.label}
          </button>
        ))}

        <div style={{ flex:1 }} />
        {loading && <span style={{ fontSize:11, color:'#6b7280' }}>Loading...</span>}
        {activeTool !== 'crosshair' && (
          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4,
            background: `${TOOL_COLORS[activeTool]}22`,
            color: TOOL_COLORS[activeTool],
            border: `1px solid ${TOOL_COLORS[activeTool]}44` }}>
            ✏️ Click chart to draw {activeTool === 'hline' ? 'line' : activeTool}
          </span>
        )}
      </div>

      {/* ── Chart canvas ── */}
      <div ref={chartContainerRef} style={{ width:'100%' }} />

      {/* ── Footer stats ── */}
      <div style={{ padding:'8px 14px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', gap:16, fontSize:11, color:'#6b7280', flexWrap:'wrap' }}>
        {info && <>
          <span>RSI <span style={{ color: info.rsi>70?'#ef4444':info.rsi<40?'#60a5fa':'#e8eaf0' }}>{info.rsi?.toFixed(0)}</span></span>
          <span>RVOL <span style={{ color: info.rvol>=2?'#22c55e':'#e8eaf0' }}>{info.rvol?.toFixed(1)}x</span></span>
          <span>Vol <span style={{ color:'#e8eaf0' }}>{info.volume>=1e6?(info.volume/1e6).toFixed(1)+'M':(info.volume/1e3).toFixed(0)+'K'}</span></span>
          <span>50MA <span style={{ color: info.price>info.ma50?'#22c55e':'#ef4444' }}>${info.ma50?.toFixed(2)}</span></span>
          <span>200MA <span style={{ color: info.price>info.ma200?'#22c55e':'#ef4444' }}>${info.ma200?.toFixed(2)}</span></span>
        </>}
        <span style={{ marginLeft:'auto' }}>
          {['1','5','15'].includes(resolution)?'Intraday · live':resolution==='60'?'Hourly · live':'Daily · live'}
        </span>
      </div>
    </div>
  )
}
