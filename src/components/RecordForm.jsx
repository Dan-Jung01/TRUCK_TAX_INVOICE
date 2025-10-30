import React, { useMemo, useState, useEffect } from 'react'
import { Grid, TextField, Button, Stack } from '@mui/material'
import { db } from '../firebase'
import { addDoc, updateDoc, doc, collection, serverTimestamp } from 'firebase/firestore'

export default function RecordForm({ editItem, onCancelEdit }) {
  const today = new Date().toISOString().slice(0, 10)
  const initialForm = {
    shipDate: today,
    bizNumber: '',
    shopName: '',
    name: '',
    phone: '',
    account: '',
    bank: '',
    memo: '',
    destination: '',
    supplyAmount: '',
    qty: '',
    paidDate: '',
    paid: false,
  }

  const [form, setForm] = useState(initialForm)
  const [editing, setEditing] = useState(false)
  const [docId, setDocId] = useState(null)

  useEffect(() => {
    if (editItem) {
      setEditing(true)
      setDocId(editItem.id)
      setForm({
        shipDate: editItem.shipDate ? new Date(editItem.shipDate).toISOString().slice(0, 10) : today,
        bizNumber: editItem.bizNumber || '',
        shopName: editItem.shopName || '',
        name: editItem.name || '',
        phone: editItem.phone || '',
        account: editItem.account || '',
        bank: editItem.bank || '', // ✅ 기존 데이터 로드
        memo: editItem.memo || '',
        destination: editItem.destination || '',
        supplyAmount: editItem.supplyAmount ? editItem.supplyAmount.toLocaleString() : '',
        qty: editItem.qty ? editItem.qty.toLocaleString() : '',
        paidDate: editItem.paidDate
          ? new Date(editItem.paidDate).toISOString().slice(0, 10)
          : '',
        paid: !!editItem.paid,
      })
    } else {
      setEditing(false)
      setDocId(null)
      setForm(initialForm)
    }
  }, [editItem])

  const supply = Number(form.supplyAmount.replace(/,/g, '') || 0)
  const qty = Number((form.qty || '').toString().replace(/,/g, '') || 0)
  const tax = useMemo(() => Math.floor(supply * 0.1), [supply])
  const total = useMemo(() => supply + tax, [supply, tax])
  const unitFare = useMemo(() => (qty > 0 ? Math.floor(supply / qty) : 0), [supply, qty])
  const formatNumber = (num) => num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  const onChange = (e) => {
    const { name, value } = e.target
    if (name === 'supplyAmount' || name === 'qty') {
      const numeric = value.replace(/[^0-9]/g, '')
      setForm((prev) => ({ ...prev, [name]: formatNumber(numeric) }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      supplyAmount: supply,
      qty,
      tax,
      total,
      unitFare,
      paid: !!form.paidDate,
      paidDate: form.paidDate ? new Date(form.paidDate).toISOString() : null,
      updatedAt: serverTimestamp(),
      shipDate: form.shipDate ? new Date(form.shipDate).toISOString() : null,
    }

    if (editing && docId) {
      await updateDoc(doc(db, 'records', docId), payload)
      alert('기록이 수정되었습니다.')
    } else {
      await addDoc(collection(db, 'records'), {
        ...payload,
        createdAt: serverTimestamp(),
      })
      alert('기록이 추가되었습니다.')
    }

    setForm(initialForm)
    setEditing(false)
    setDocId(null)
    if (onCancelEdit) onCancelEdit()
  }

  const handleCancel = () => {
    setForm(initialForm)
    setEditing(false)
    setDocId(null)
    if (onCancelEdit) onCancelEdit() // ✅ App.jsx에 신호 보내기
  }

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <h3>{editing ? '기존 내역 수정' : '신규 내역 추가'}</h3>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="출고일자 *"
            type="date"
            name="shipDate"
            value={form.shipDate}
            onChange={onChange}
            required
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField label="사업자번호" name="bizNumber" value={form.bizNumber} onChange={onChange} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField label="상호" name="shopName" value={form.shopName} onChange={onChange} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField label="성명" name="name" value={form.name} onChange={onChange} fullWidth />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <TextField label="전화번호" name="phone" value={form.phone} onChange={onChange} fullWidth />
        </Grid>

        {/* ✅ 계좌번호 + 은행명 */}
        <Grid item xs={12} sm={8} md={5}>
          <TextField label="계좌번호" name="account" value={form.account} onChange={onChange} fullWidth />
        </Grid>
        <Grid item xs={12} sm={4} md={3}>
          <TextField label="은행" name="bank" value={form.bank} onChange={onChange} fullWidth />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField label="제품명(오더명)" name="memo" value={form.memo} onChange={onChange} fullWidth />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="도착지"
            name="destination"
            fullWidth
            value={form.destination || ''}
            onChange={onChange}
          />
        </Grid>


        <Grid item xs={12} sm={4}>
          <TextField
            label="공급가액 (원) *"
            name="supplyAmount"
            value={form.supplyAmount}
            onChange={onChange}
            required
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="출고 수량 (결레) *"
            name="qty"
            value={form.qty}
            onChange={onChange}
            required
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="켤레당 운임비 (자동 계산)"
            value={formatNumber(unitFare)}
            fullWidth
            InputProps={{ readOnly: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="세액 (자동 계산)"
            value={formatNumber(tax)}
            fullWidth
            InputProps={{ readOnly: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="합계금액 (자동 계산)"
            value={formatNumber(total)}
            fullWidth
            InputProps={{ readOnly: true }}
          />
        </Grid>

        {/* ✅ 결제 완료일자 */}
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            label="결제 완료일자"
            name="paidDate"
            type="date"
            value={form.paidDate}
            onChange={onChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12}>
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            {editing && <Button onClick={handleCancel} variant="outlined">취소</Button>}
            <Button type="submit" variant="contained" size="large">
              {editing ? '기록 수정' : '기록 추가'}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </form>
  )
}
