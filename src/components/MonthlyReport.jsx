// src/components/MonthlyReport.jsx
import React, { useState, useEffect } from "react";
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
  Stack,
} from "@mui/material";
import { db } from "../firebase";
import { collection, query, onSnapshot } from "firebase/firestore";

export default function MonthlyReport() {
  const [records, setRecords] = useState([]);
  const [month, setMonth] = useState(""); // YYYY-MM
  const [filtered, setFiltered] = useState([]);

  // ✅ Firestore 데이터 실시간 불러오기
  useEffect(() => {
    const q = query(collection(db, "records"));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRecords(list);
    });
    return () => unsub();
  }, []);

  // ✅ 기본값: 현재 월 (YYYY-MM)
  useEffect(() => {
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    setMonth(defaultMonth);
  }, []);

  // ✅ 월 변경 시 자동 필터링 + 정렬
  useEffect(() => {
    if (!month) return;
    const filteredData = records
      .filter((item) => {
        if (!item.shipDate) return false;
        const date = new Date(item.shipDate);
        const key = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        return key === month;
      })
      .sort((a, b) => {
        const dateA = a.shipDate ? new Date(a.shipDate) : new Date(0);
        const dateB = b.shipDate ? new Date(b.shipDate) : new Date(0);
        return dateA - dateB; // ✅ 출고일 오름차순 정렬
      });

    setFiltered(filteredData);
  }, [month, records]);

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
        월별 운송 보고서
      </Typography>

      {/* ✅ 월 선택 */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="flex-start"
        sx={{ mb: 3 }}
      >
        <TextField
          label="조회 월 (YYYY-MM)"
          type="month"
          size="small"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          sx={{ width: 180 }}
        />
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {filtered.length === 0 ? (
        <Typography color="text.secondary">
          조회된 데이터가 없습니다.
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: "#f4f6f8" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>일자</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>도착지</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  운임(VAT제외)
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  총 수량(켤레)
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  켤레당 운임
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>비고</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filtered.map((r) => {
                const date = r.shipDate
                  ? new Date(r.shipDate).toLocaleDateString("ko-KR")
                  : "-";
                const unitFare =
                  r.qty && r.qty > 0
                    ? ((r.supplyAmount || 0) / r.qty).toFixed(2)
                    : "-";
                return (
                  <TableRow key={r.id}>
                    <TableCell>{date}</TableCell>
                    <TableCell>{r.destination || "-"}</TableCell>
                    <TableCell align="right">
                      {formatNumber(r.supplyAmount || 0)}원
                    </TableCell>
                    <TableCell align="right">
                      {formatNumber(r.qty || 0)}켤레
                    </TableCell>
                    <TableCell align="right">{unitFare}원</TableCell>
                    <TableCell>{r.memo || "-"}</TableCell>
                  </TableRow>
                );
              })}

              {/* ✅ 합계 행 (같은 테이블 내부) */}
              <TableRow sx={{ bgcolor: "#3f51b5" }}>
                <TableCell sx={{ color: "white", fontWeight: 700 }}>
                  월별 총 합계
                </TableCell>

                <TableCell
                  sx={{ color: "white", fontWeight: 700 }}
                  align="left"
                >
                  총 {filtered.length.toLocaleString()}건
                </TableCell>

                <TableCell
                  sx={{ color: "white", fontWeight: 700 }}
                  align="right"
                >
                  {formatNumber(
                    filtered.reduce(
                      (sum, r) => sum + (r.supplyAmount || 0),
                      0
                    )
                  )}{" "}
                  원
                </TableCell>

                <TableCell
                  sx={{ color: "white", fontWeight: 700 }}
                  align="right"
                >
                  {formatNumber(
                    filtered.reduce((sum, r) => sum + (r.qty || 0), 0)
                  )}{" "}
                  켤레
                </TableCell>

                <TableCell
                  sx={{ color: "white", fontWeight: 700 }}
                  align="right"
                >
                  {(() => {
                    const totalSupply = filtered.reduce(
                      (sum, r) => sum + (r.supplyAmount || 0),
                      0
                    );
                    const totalQty = filtered.reduce(
                      (sum, r) => sum + (r.qty || 0),
                      0
                    );
                    return totalQty > 0
                      ? `${formatNumber(
                          Math.round(totalSupply / totalQty)
                        )} 원`
                      : "0 원";
                  })()}
                </TableCell>

                <TableCell
                  sx={{ color: "white", fontWeight: 700 }}
                  align="left"
                >
                  –
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
