import axios from 'axios'

const BASE = 'https://baileys-stocksight-production.up.railway.app/api'

export const api = axios.create({ baseURL: BASE })

export async function fetchMarket() {
  const { data } = await api.get('/market')
  return data
}

export async function fetchScan({ pattern = 'bull_flag', minPrice = 5, minVolume = 200000, grade, limit = 20 } = {}) {
  const params = { pattern, min_price: minPrice, min_volume: minVolume, limit }
  if (grade) params.grade = grade
  const { data } = await api.get('/scan', { params })
  return data
}

export async function fetchTop10() {
  const { data } = await api.get('/top10')
  return data
}

export async function fetchScanners() {
  const { data } = await api.get('/scanners')
  return data
}

export async function fetchTicker(symbol) {
  const { data } = await api.get(`/ticker/${symbol}`)
  return data
}
