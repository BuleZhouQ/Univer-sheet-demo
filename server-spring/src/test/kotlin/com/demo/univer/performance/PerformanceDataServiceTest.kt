package com.demo.univer.performance

import io.mockk.every
import io.mockk.mockk
import kotlin.test.Test
import kotlin.test.assertEquals

class PerformanceDataServiceTest {
    private val repository = mockk<PerformanceRowRepository>()
    private val service = PerformanceDataService(repository)

    @Test
    fun `rows are read from database`() {
        val document = PerformanceRowDocument(200, listOf("ROW-000200", "???????? 200 ?"))
        every { repository.findByRowNumberBetweenOrderByRowNumberAsc(200, 201) } returns listOf(document)
        assertEquals(listOf(PerformanceRow(200, document.values)), service.rows(200, 2))
    }
}
