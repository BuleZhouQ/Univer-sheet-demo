package com.demo.univer.assessment

import org.springframework.data.annotation.Id
import org.springframework.data.mongodb.core.mapping.Document
import org.springframework.data.mongodb.repository.MongoRepository

data class StandardCell(
    val row: Int,
    val column: Int,
    val cellRef: String,
    val value: Any?,
    val formula: String? = null
)

data class GradingRuleDefinition(
    val id: String,
    val sheetId: String,
    val rangeLabel: String,
    val mode: String,
    val score: Int,
    val tolerance: Double = 0.0,
    val partialCredit: Boolean = true,
    val cells: List<StandardCell>
)

@Document("assessment_questions")
data class QuestionDefinition(
    @Id val id: String = "default",
    val title: String,
    val difficulty: String,
    val duration: Int,
    val background: String,
    val objective: String,
    val steps: List<String>,
    val rules: List<GradingRuleDefinition>
)

data class StudentAnswerTarget(
    val ruleId: String,
    val sheetId: String,
    val rangeLabel: String,
    val row: Int,
    val column: Int,
    val cellRef: String,
    val score: Int
)

data class StudentQuestionDefinition(
    val id: String,
    val title: String,
    val difficulty: String,
    val duration: Int,
    val background: String,
    val objective: String,
    val steps: List<String>,
    val answerTargets: List<StudentAnswerTarget>
)

interface QuestionDefinitionRepository : MongoRepository<QuestionDefinition, String>
