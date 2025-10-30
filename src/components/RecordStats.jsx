// src/components/RecordStats.jsx
import React, { useEffect, useState } from 'react'
import { Typography, Box, Paper } from '@mui/material'
import { db } from '../firebase'
import { collection, onSnapshot, query } from 'firebase/firestore'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, BarChart, ComposedChart
} from 'recharts'

export default function RecordStats() {
  const [stats, setStats] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'records'))
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      const monthlyMap = {}

      items.forEach(item => {
        if (!item.shipDate) return
        const date = new Date(item.shipDate)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const total = item.total ?? 0
        const qty = item.qty ?? 0
        const supply = item.supplyAmount ?? 0

        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = { month: monthKey, totalSum: 0, qtySum: 0, supplySum: 0 }
        }
        monthlyMap[monthKey].totalSum += total
        monthlyMap[monthKey].qtySum += qty
        monthlyMap[monthKey].supplySum += supply
      })

      const monthlyStats = Object.values(monthlyMap)
        .sort((a, b) => new Date(a.month) - new Date(b.month))
        .map(m => ({
          ...m,
          unitFareAvg:
            m.qtySum > 0 ? Math.round(m.supplySum / m.qtySum) : 0
        }))

      setStats(monthlyStats)
    })
    return () => unsub()
  }, [])

  return (
    <Box sx={{ mt: 8 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        운송료 월별 통계
      </Typography>

      {stats.length === 0 ? (
        <Typography color="text.secondary">통계 데이터를 불러오는 중이거나 기록이 없습니다.</Typography>
      ) : (
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            월별 금액 총합, 출고 켤레수, 결레당 운임비 평균 추세
          </Typography>

          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip formatter={(v) => v.toLocaleString()} />
              <Legend />

              {/* 금액 총합 (막대그래프) */}
              <Bar yAxisId="left" dataKey="totalSum" fill="#90caf9" name="금액 총합 (원)" />

              {/* 켤레 수 (막대그래프) */}
              <Bar yAxisId="left" dataKey="qtySum" fill="#a5d6a7" name="켤레 수 (켤레)" />

              {/* 결레당 운임비 (꺾은선그래프) */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="unitFareAvg"
                stroke="#ff9800"
                name="결레당 운임비 (원)"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Paper>
      )}
    </Box>
  )
}
