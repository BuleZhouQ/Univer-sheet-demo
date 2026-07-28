package com.demo.univer.performance

import org.springframework.stereotype.Service

data class PerformanceRow(val rowNumber: Int, val values: List<Any>)
data class PerformanceRowsResponse(val totalRows: Int = 100_000, val columns: Int = 20, val rows: List<PerformanceRow>)

@Service
class PerformanceDataService {
    fun snapshot(): PerformanceRowsResponse = PerformanceRowsResponse(rows = rows(0, 100_000))

    fun rows(offset: Int, limit: Int): List<PerformanceRow> =
        (offset until minOf(offset + limit, 100_000)).map { row ->
            PerformanceRow(row, listOf(
                "ROW-${row.toString().padStart(6, '0')}", "性能测试记录 $row", "部门${row % 20}", "分类${row % 12}",
                1000 + row, 10 + (row % 500) / 10.0, (1000 + row) * (10 + (row % 500) / 10.0),
                "2026-${(row % 12 + 1).toString().padStart(2, '0')}-${(row % 28 + 1).toString().padStart(2, '0')}",
                if (row % 3 == 0) "完成" else "处理中", "用户${row % 100}", "区域${row % 8}", "城市${row % 50}",
                "渠道${row % 6}", row % 4, row % 101, (row % 50) / 10.0, "BATCH-${row % 1000}",
                "第 $row 行性能数据", "2026-07-28 09:${(row % 60).toString().padStart(2, '0')}", (row * 31) % 100000
            ))
        }
}
