import React, { useState } from 'react'
import { CssBaseline, Container, Box, Typography, Paper } from '@mui/material'
import RecordForm from './components/RecordForm'
import RecordList from './components/RecordList'

export default function App() {
  const [editItem, setEditItem] = useState(null)

  return (
    <>
      <CssBaseline />
      <Box sx={{ py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" fontWeight={800}>
            용달차 세금계산서 기록부
          </Typography>

          <Paper elevation={1} sx={{ p: { xs: 2, sm: 3 }, mt: 5, borderRadius: 3 }}>
            <RecordForm
              editItem={editItem}
              onCancelEdit={() => setEditItem(null)}  // ✅ 취소 시 선택 해제
            />
          </Paper>

          <Box sx={{ mt: 6, mb: 8 }}>
            <RecordList
              onSelectEdit={(item) => setEditItem(item)}  // ✅ 카드 클릭 시 선택
              selectedId={editItem?.id || null}           // ✅ 선택된 카드 강조
            />
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            align="center"
            display="block"
            sx={{ mt: 8 }}
          >
            © 2025 Samwha Clean Glove
          </Typography>
        </Container>
      </Box>
    </>
  )
}
