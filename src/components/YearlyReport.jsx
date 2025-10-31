// src/components/YearlyReport.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";
import { db } from "../firebase";
import { collection, query, onSnapshot } from "firebase/firestore";

export default function YearlyReport() {
  const [records, setRecords] = useState([]);
  const [year, setYear] = useState("");
  const [monthlyStats, setMonthlyStats] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "records"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRecords(list);
    });
    return () => unsub();
  }, []);

  // ✅ 기본 연도 = 현재 연도
  useEffect(() => {
    const now = new Date();
    setYear(now.getFullYear().toString());
  }, []);

  // ✅ 연도 변경 시 월별 통계 계산
  useEffect(() => {
    if (!year) return;

    // 1~12월 초기화
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month: `${i + 1}월`,
      totalSum: 0,
      qtySum: 0,
      unitFareAvg: 0,
      count: 0, // ✅ 운송 건수
    }));

    // 데이터 집계
    records.forEach((item) => {
      if (!item.shipDate) return;
      const date = new Date(item.shipDate);
      const itemYear = date.getFullYear().toString();
      if (itemYear !== year) return;

      const monthIndex = date.getMonth(); // 0~11
      const supply = item.supplyAmount ?? 0;
      const qty = item.qty ?? 0;

      monthly[monthIndex].totalSum += supply;
      monthly[monthIndex].qtySum += qty;
      monthly[monthIndex].count += 1; // ✅ 건수 누적
    });

    // 켤레당 운임 계산
    monthly.forEach((m) => {
      if (m.qtySum > 0) {
        m.unitFareAvg = Math.round(m.totalSum / m.qtySum);
      }
    });

    setMonthlyStats(monthly);
  }, [records, year]);

  // ✅ 연도별 합계
  const totalYearSum = monthlyStats.reduce((sum, m) => sum + m.totalSum, 0);
  const totalQtySum = monthlyStats.reduce((sum, m) => sum + m.qtySum, 0);
  const totalCount = monthlyStats.reduce((sum, m) => sum + m.count, 0);
  const totalUnitFare =
    totalQtySum > 0 ? Math.round(totalYearSum / totalQtySum) : 0;

  const formatNumber = (n) =>
    n?.toLocaleString("ko-KR", { minimumFractionDigits: 0 });

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        mt: 5,
        overflow: "hidden",
      }}
    >
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        연도별 운송 보고서
      </Typography>

      {/* ✅ 연도 선택 */}
      <TextField
        label="조회 연도"
        type="number"
        size="small"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        sx={{ width: 140, mb: 3 }}
      />

      <Divider sx={{ mb: 2 }} />

      <TableContainer>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#f4f6f8" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>월</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                총 운임 (VAT 제외)
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                총 수량 (켤레)
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                켤레당 운임
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                운송 건수
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {monthlyStats.map((m, idx) => (
              <TableRow key={idx}>
                <TableCell>{m.month}</TableCell>
                <TableCell align="right">
                  {formatNumber(m.totalSum)} 원
                </TableCell>
                <TableCell align="right">
                  {formatNumber(m.qtySum)} 켤레
                </TableCell>
                <TableCell align="right">
                  {formatNumber(m.unitFareAvg)} 원
                </TableCell>
                <TableCell align="right">
                  {formatNumber(m.count)} 건
                </TableCell>
              </TableRow>
            ))}

            {/* ✅ 연간 합계 */}
            <TableRow sx={{ bgcolor: "#3f51b5" }}>
              <TableCell sx={{ color: "white", fontWeight: 700 }}>
                연간 합계
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }} align="right">
                {formatNumber(totalYearSum)} 원
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }} align="right">
                {formatNumber(totalQtySum)} 켤레
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }} align="right">
                {formatNumber(totalUnitFare)} 원
              </TableCell>
              <TableCell sx={{ color: "white", fontWeight: 700 }} align="right">
                {formatNumber(totalCount)} 건
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
