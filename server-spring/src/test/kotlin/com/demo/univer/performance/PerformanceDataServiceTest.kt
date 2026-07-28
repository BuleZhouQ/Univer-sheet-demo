package com.demo.univer.performance

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class PerformanceDataServiceTest {
    @Test
    fun `returns 200 rows with 20 columns`() {
        val result = PerformanceDataService().rows(200, 200)
        assertEquals(200, result.size)
        assertEquals(20, result.first().values.size)
        assertEquals(200, result.first().rowNumber)
    }
}
