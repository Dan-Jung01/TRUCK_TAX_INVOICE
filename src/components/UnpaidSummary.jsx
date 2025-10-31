// src/components/UnpaidSummary.jsx
import React, { useEffect, useState } from "react";
import { Typography, Paper } from "@mui/material";
import { db } from "../firebase";
import { collection, query, onSnapshot } from "firebase/firestore";

export default function UnpaidSummary() {
  const [unpaidCount, setUnpaidCount] = useState(0);
  const [unpaidAmount, setUnpaidAmount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "records"));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // ✅ 전체 미결제 데이터 필터링
      const unpaid = all.filter((r) => !r.paid);
      const totalUnpaid = unpaid.reduce((sum, r) => sum + (r.total || 0), 0);

      setUnpaidCount(unpaid.length);
      setUnpaidAmount(totalUnpaid);
      setIsLoaded(true);
    });

    return () => unsub();
  }, []);

  const formatNumber = (n) =>
    n?.toLocaleString("ko-KR", { minimumFractionDigits: 0 });

  // ✅ 조건에 따라 스타일 변경
  const isAllPaid = unpaidCount === 0 && isLoaded;

  return (
    <Paper
      elevation={3}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        mb: 3,
        ...(isAllPaid
          ? {
              bgcolor: "success.main",
              color: "white",
              border: "1px solid",
              borderColor: "success.dark",
            }
          : {
              bgcolor: "#fff0f0",
              border: "1px solid",
              borderColor: "error.main",
              color: "error.main",
            }),
      }}
    >
      {isAllPaid ? (
        <Typography variant="h6" fontWeight={700} textAlign="center">
          ✅ 모든 거래 결제 완료
        </Typography>
      ) : (
        <>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            🔴 전체 미결제 현황
          </Typography>
          <Typography variant="subtitle1" fontWeight={700}>
            미결제 건수: {unpaidCount.toLocaleString()}건
          </Typography>
          <Typography variant="subtitle1" fontWeight={700}>
            미결제 금액: {formatNumber(unpaidAmount)}원
          </Typography>
        </>
      )}
    </Paper>
  );
}
