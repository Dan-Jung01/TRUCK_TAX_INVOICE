import React, { useState } from 'react'
import {
  CssBaseline,
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
} from '@mui/material'
import RecordForm from './components/RecordForm'
import RecordList from './components/RecordList'
import MonthlyReport from './components/MonthlyReport'
import YearlyReport from './components/YearlyReport'
import UnpaidSummary from './components/UnpaidSummary'  // ✅ 추가

export default function App() {
  const [editItem, setEditItem] = useState(null)
  const [tab, setTab] = useState(0)

  return (
    <>
      <CssBaseline />
      <Box sx={{ py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" fontWeight={800}>
            용달차 세금 계산서 기록부
          </Typography>

          <Paper
            elevation={2}
            sx={{
              mt: 4,
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <Tabs
              value={tab}
              onChange={(e, newValue) => setTab(newValue)}
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: '#f8f9fa',
              }}
            >
              <Tab label="대시보드" />
              <Tab label="내역 작성" />
            </Tabs>

            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              {/* ✅ 대시보드 탭 */}
              {tab === 0 && (
                <>
                  <UnpaidSummary />  {/* 🔴 미결제 현황 */}
                  <MonthlyReport />   {/* 📊 월별 운송 보고서 */}
                  <YearlyReport />    {/* 📈 연도별 운송 보고서 */}
                </>
              )}

              {/* 🧾 내역 작성 탭 */}
              {tab === 1 && (
                <>
                  <Paper
                    elevation={1}
                    sx={{
                      p: { xs: 2, sm: 3 },
                      borderRadius: 3,
                      mb: 4,
                    }}
                  >
                    <RecordForm
                      editItem={editItem}
                      onCancelEdit={() => setEditItem(null)}
                    />
                  </Paper>

                  <Box sx={{ mb: 8 }}>
                    <RecordList
                      onSelectEdit={(item) => setEditItem(item)}
                      selectedId={editItem?.id || null}
                    />
                  </Box>
                </>
              )}
            </Box>
          </Paper>

          <Typography
            variant="caption"
            color="text.secondary"
            align="center"
            display="block"
            sx={{ mt: 6 }}
          >
            © 2025 Samwha Clean Glove
          </Typography>
        </Container>
      </Box>
    </>
  )
}
