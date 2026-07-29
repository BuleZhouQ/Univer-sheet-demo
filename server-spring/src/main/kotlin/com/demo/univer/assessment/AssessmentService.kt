package com.demo.univer.assessment

import org.springframework.stereotype.Service
import kotlin.math.abs
import kotlin.math.roundToInt

data class SubmittedCell(val row: Int, val column: Int, val cellRef: String, val value: Any?, val formula: String?)
data class SubmitAssessmentRequest(val cells: List<SubmittedCell>, val questionId: String = "default")
data class CellAssessmentResult(
    val row: Int, val column: Int, val cellRef: String, val title: String,
    val earnedScore: Int, val scoreWeight: Int, val status: String,
    val studentValue: Any?, val studentFormula: String?, val errorAnalysisPrompt: String
)
data class AssessmentResponse(val totalScore: Int, val maxPossibleScore: Int, val results: List<CellAssessmentResult>)

@Service
class AssessmentService(private val repository: QuestionDefinitionRepository? = null) {
    fun assess(request: SubmitAssessmentRequest): AssessmentResponse {
        val question = repository?.findById(request.questionId)?.orElse(null)
            ?: QuestionDefinitionService.defaultQuestion(request.questionId)
        val submitted = request.cells.associateBy { it.cellRef.uppercase() }
        val results = question.rules.map { rule ->
            val correctCells = rule.cells.count { standard ->
                val cell = submitted[standard.cellRef.uppercase()]
                matches(rule, cell, standard)
            }
            val ratio = if (rule.cells.isEmpty()) 0.0 else correctCells.toDouble() / rule.cells.size
            val earned = when {
                ratio == 1.0 -> rule.score
                rule.partialCredit -> (rule.score * ratio).roundToInt()
                else -> 0
            }
            val first = rule.cells.first()
            val submittedFirst = submitted[first.cellRef.uppercase()]
            CellAssessmentResult(
                first.row, first.column, rule.rangeLabel, rule.rangeLabel,
                earned, rule.score,
                when { ratio == 1.0 -> "CORRECT"; ratio > 0 -> "YELLOW_ANALYZED"; else -> "RED_ERROR" },
                submittedFirst?.value, submittedFirst?.formula,
                if (ratio == 1.0) "" else "该区域有 ${rule.cells.size - correctCells} 个单元格不符合评分规则"
            )
        }
        return AssessmentResponse(results.sumOf { it.earnedScore }, results.sumOf { it.scoreWeight }, results)
    }

    private fun matches(rule: GradingRuleDefinition, submitted: SubmittedCell?, standard: StandardCell): Boolean =
        when (rule.mode) {
            "FORMULA" -> normalize(submitted?.formula) == normalize(standard.formula)
            "VALUE" -> {
                val actual = (submitted?.value as? Number)?.toDouble()
                    ?: submitted?.value?.toString()?.toDoubleOrNull()
                val expected = (standard.value as? Number)?.toDouble()
                    ?: standard.value?.toString()?.toDoubleOrNull()
                actual != null && expected != null && abs(actual - expected) <= rule.tolerance
            }
            else -> submitted?.value?.toString()?.trim() == standard.value?.toString()?.trim()
        }

    private fun normalize(formula: String?) = formula.orEmpty().replace(" ", "").uppercase()
}
