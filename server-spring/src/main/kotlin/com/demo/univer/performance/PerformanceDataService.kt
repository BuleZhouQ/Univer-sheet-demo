package com.demo.univer.performance

import org.springframework.stereotype.Service

const val PERFORMANCE_TOTAL_ROWS = 100_000
const val PERFORMANCE_COLUMNS = 20

data class PerformanceRow(val rowNumber: Int, val values: List<Any>)
data class PerformanceRowsResponse(
    val totalRows: Int = PERFORMANCE_TOTAL_ROWS,
    val columns: Int = PERFORMANCE_COLUMNS,
    val rows: List<PerformanceRow>
)

@Service
class PerformanceDataService(private val repository: PerformanceRowRepository) {
    fun snapshot(): PerformanceRowsResponse = PerformanceRowsResponse(
        rows = repository.findAllByOrderByRowNumberAsc().map { PerformanceRow(it.rowNumber, it.values) }
    )

    fun rows(offset: Int, limit: Int): List<PerformanceRow> {
        val endRow = minOf(offset + limit - 1, PERFORMANCE_TOTAL_ROWS - 1)
        return repository.findByRowNumberBetweenOrderByRowNumberAsc(offset, endRow)
            .map { PerformanceRow(it.rowNumber, it.values) }
    }
}
