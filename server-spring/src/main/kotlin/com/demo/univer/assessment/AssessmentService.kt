package com.demo.univer.assessment

import org.springframework.stereotype.Service

data class SubmittedCell(val row: Int, val column: Int, val cellRef: String, val value: Any?, val formula: String?)
data class SubmitAssessmentRequest(val cells: List<SubmittedCell>)
data class CellAssessmentResult(
    val row: Int, val column: Int, val cellRef: String, val title: String,
    val earnedScore: Int, val scoreWeight: Int, val status: String,
    val studentValue: Any?, val studentFormula: String?, val standardValue: Any,
    val standardFormula: String, val errorAnalysisPrompt: String
)
data class AssessmentResponse(val totalScore: Int, val maxPossibleScore: Int, val results: List<CellAssessmentResult>)

private data class Rule(val row: Int, val column: Int, val cellRef: String, val title: String, val weight: Int, val value: Any, val formula: String, val prompt: String)

@Service
class AssessmentService {
    private val rules = listOf(
        Rule(6, 2, "C7", "季度销售总额", 30, 158000.0, "=SUM(C3:C6)", "求和范围应为 C3:C6"),
        Rule(7, 2, "C8", "季度平均销售额", 20, 39500.0, "=AVERAGE(C3:C6)", "平均值公式应为 AVERAGE(C3:C6)"),
        Rule(8, 2, "C9", "应缴增值税额", 25, 20540.0, "=C7*0.13", "税率计算应使用 C7*0.13"),
        Rule(9, 2, "C10", "销售额达标判断", 25, "达标", "=IF(C7>100000,\"达标\",\"未达标\")", "使用 IF 判断销售总额是否达标")
    )

    fun assess(request: SubmitAssessmentRequest): AssessmentResponse {
        val submitted = request.cells.associateBy { it.cellRef.uppercase() }
        val results = rules.map { rule ->
            val cell = submitted[rule.cellRef]
            val valueCorrect = when (rule.value) {
                is Double -> (cell?.value as? Number)?.toDouble()?.let { kotlin.math.abs(it - rule.value) < 0.0001 } == true
                else -> cell?.value?.toString() == rule.value.toString()
            }
            val formulaCorrect = normalize(cell?.formula) == normalize(rule.formula)
            val correct = valueCorrect && formulaCorrect
            CellAssessmentResult(rule.row, rule.column, rule.cellRef, rule.title, if (correct) rule.weight else 0,
                rule.weight, if (correct) "CORRECT" else "RED_ERROR", cell?.value, cell?.formula,
                rule.value, rule.formula, rule.prompt)
        }
        return AssessmentResponse(results.sumOf { it.earnedScore }, rules.sumOf { it.weight }, results)
    }

    private fun normalize(formula: String?) = formula.orEmpty().replace(" ", "").uppercase()
}
