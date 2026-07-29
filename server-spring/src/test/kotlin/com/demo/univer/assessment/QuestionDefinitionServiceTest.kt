package com.demo.univer.assessment

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Test
import org.mockito.Mockito
import java.util.Optional

class QuestionDefinitionServiceTest {
    private val repository = Mockito.mock(QuestionDefinitionRepository::class.java)
    private val service = QuestionDefinitionService(repository)

    @Test
    fun `student view exposes answer locations without standard answers`() {
        Mockito.`when`(repository.findById("exam")).thenReturn(Optional.of(QuestionDefinitionService.defaultQuestion("exam")))
        val student = service.studentView("exam")
        assertEquals(4, student.answerTargets.size)
        assertFalse(student.toString().contains("158000"))
        assertFalse(student.toString().contains("SUM"))
    }
}
