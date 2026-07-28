package com.demo.univer.assessment

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class AssessmentServiceTest {
    @Test
    fun `scores correct SUM AVERAGE tax and IF formulas`() {
        val request = SubmitAssessmentRequest(listOf(
            SubmittedCell(6, 2, "C7", 158000.0, "=SUM(C3:C6)"),
            SubmittedCell(7, 2, "C8", 39500.0, "=AVERAGE(C3:C6)"),
            SubmittedCell(8, 2, "C9", 20540.0, "=C7*0.13"),
            SubmittedCell(9, 2, "C10", "达标", "=IF(C7>100000,\"达标\",\"未达标\")")
        ))
        assertEquals(100, AssessmentService().assess(request).totalScore)
    }
}
