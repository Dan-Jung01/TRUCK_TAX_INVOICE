import React, { useEffect, useState, useMemo } from 'react'
import {
  Card, Typography, Grid, Box, Stack, Divider,
  IconButton, Chip, Tooltip, TextField, MenuItem,
  FormControl, InputLabel, Select
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import FilterAltIcon from '@mui/icons-material/FilterAlt'
import { db } from '../firebase'
import { collection, onSnapshot, query, deleteDoc, doc } from 'firebase/firestore'

export default function RecordList({ onSelectEdit, selectedId }) {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState({
    startDate: '',
    endDate: '',
    paidStatus: 'unpaid', // ✅ 기본값: 미결제
    sortOrder: 'asc',     // ✅ 기본값: 출고일 오름차순
  })

  // Firestore 실시간 데이터 불러오기
  useEffect(() => {
    const q = query(collection(db, 'records'))
    const unsub = onSnapshot(q, (snap) => {
      const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setItems(next)
    })
    return () => unsub()
  }, [])

  // 삭제 기능
  const handleDelete = async (id, name) => {
    if (window.confirm(`"${name || '이 항목'}"을(를) 삭제하시겠습니까?`)) {
      await deleteDoc(doc(db, 'records', id))
      alert('기록이 삭제되었습니다.')
    }
  }

  // 필터 변경
  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilter((prev) => ({ ...prev, [name]: value }))
  }

  // ✅ 필터링 + 정렬 로직
  const filteredItems = useMemo(() => {
    let list = [...items]

    // 출고일 기간 필터
    list = list.filter((item) => {
      let match = true
      if (filter.startDate && item.shipDate)
        match = new Date(item.shipDate) >= new Date(filter.startDate)
      if (filter.endDate && item.shipDate)
        match = match && new Date(item.shipDate) <= new Date(filter.endDate)
      return match
    })

    // 결제 여부 필터
    list = list.filter((item) => {
      if (filter.paidStatus === 'all') return true
      if (filter.paidStatus === 'paid') return item.paid === true
      return item.paid !== true // unpaid
    })

    // 출고일 기준 정렬
    list.sort((a, b) => {
      const dateA = a.shipDate ? new Date(a.shipDate) : new Date(0)
      const dateB = b.shipDate ? new Date(b.shipDate) : new Date(0)
      return filter.sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })

    return list
  }, [items, filter])

  return (
    <Box>
      {/* 상단 타이틀 + 필터 */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            기록 내역
          </Typography>
          {/* ✅ 현재 표시 중인 건수 출력 */}
          <Typography variant="subtitle2" color="text.secondary">
            (총 {filteredItems.length.toLocaleString()}건)
          </Typography>
        </Stack>

        {/* 필터 영역 */}
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{rowGap: 2}}>
          <TextField
            label="출고 시작일"
            name="startDate"
            type="date"
            size="small"
            value={filter.startDate}
            onChange={handleFilterChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="출고 종료일"
            name="endDate"
            type="date"
            size="small"
            value={filter.endDate}
            onChange={handleFilterChange}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>결제 여부</InputLabel>
            <Select
              label="결제 여부"
              name="paidStatus"
              value={filter.paidStatus}
              onChange={handleFilterChange}
            >
              <MenuItem value="all">전체</MenuItem>
              <MenuItem value="paid">결제 완료</MenuItem>
              <MenuItem value="unpaid">미결제</MenuItem>
            </Select>
          </FormControl>

          {/* ✅ 정렬 옵션 */}
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>정렬 순서</InputLabel>
            <Select
              label="정렬 순서"
              name="sortOrder"
              value={filter.sortOrder}
              onChange={handleFilterChange}
            >
              <MenuItem value="asc">출고일 오름차순</MenuItem>
              <MenuItem value="desc">출고일 내림차순</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {/* 본문 카드 리스트 */}
      {filteredItems.length === 0 ? (
        <Typography color="text.secondary">해당 조건에 맞는 기록이 없습니다.</Typography>
      ) : (
        <Stack spacing={2}>
          {filteredItems.map((item) => {
            const supply = item.supplyAmount ?? 0
            const qty = item.qty ?? 0
            const tax = item.tax ?? Math.floor(supply * 0.1)
            const total = item.total ?? supply + tax
            const isPaid = !!item.paid
            const shipDateStr = item.shipDate
              ? new Date(item.shipDate).toLocaleDateString('ko-KR')
              : '-'
            const createdDateStr = item.createdAt?.toDate
              ? item.createdAt.toDate().toLocaleDateString('ko-KR')
              : '-'
            const paidDateStr = item.paidDate
              ? new Date(item.paidDate).toLocaleDateString('ko-KR')
              : null
            const unitFare = item.unitFare ?? (qty > 0 ? Math.floor(supply / qty) : 0)

            return (
              <Card
                key={item.id}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 2,
                  transition: '0.2s',
                  borderWidth: 2,
                  borderColor:
                    selectedId === item.id
                      ? 'primary.main'
                      : isPaid
                        ? 'success.main'
                        : 'divider',
                  bgcolor:
                    selectedId === item.id
                      ? '#e3f2fd'
                      : isPaid
                        ? '#f0fdf4'
                        : '#fff',
                  '&:hover': { boxShadow: 4, cursor: 'pointer' },
                }}
                onClick={() => onSelectEdit(item)} // ✅ 클릭 시 App으로 전달
              >
                {/* 카드 헤더 */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={2}>
                    {/* ✅ 출고항목(도착지) 표시 */}
                    <Typography variant="h6" fontWeight={700}>
                      {item.memo
                        ? item.destination
                          ? `${item.memo} (${item.destination})`
                          : item.memo
                        : '출고 항목 미입력'}
                    </Typography>

                    {/* ✅ 결제 완료 Chip */}
                    {isPaid && <Chip label="결제 완료" color="success" size="small" />}
                  </Stack>

                  {/* 수정 / 삭제 버튼 */}
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="수정">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectEdit(item)
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="삭제">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(item.id, item.shopName)
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>

                {/* 상호명 표시 */}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {item.shopName || '-'}
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                {/* 카드 본문 */}
                <Grid container spacing={1}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">출고일</Typography>
                    <Typography variant="body1">{shipDateStr}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">출고수량</Typography>
                    <Typography variant="body1">{qty.toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">공급가액</Typography>
                    <Typography variant="body1">{supply.toLocaleString()} 원</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">합계금액</Typography>
                    <Typography variant="body1" fontWeight={700}>
                      {total.toLocaleString()} 원
                    </Typography>
                    {/* ✅ 결레당 운임비 추가 */}
                    <Typography variant="body2" color="text.secondary">
                      (결레당 운임비: {unitFare.toLocaleString()} 원)
                    </Typography>
                  </Grid>
                </Grid>

                {/* 하단 기록일 / 결제일 */}
                <Box sx={{ mt: 1 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">
                      기록일: {createdDateStr}
                    </Typography>
                    {paidDateStr && (
                      <Typography variant="caption" color="success.main">
                        결제 완료일: {paidDateStr}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Card>
            )
          })}
        </Stack>
      )}
    </Box>
  )
}
