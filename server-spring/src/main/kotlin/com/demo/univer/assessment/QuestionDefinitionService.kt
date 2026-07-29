package com.demo.univer.assessment

import org.springframework.stereotype.Service

@Service
class QuestionDefinitionService(private val repository: QuestionDefinitionRepository) {
    fun get(id: String): QuestionDefinition = repository.findById(id).orElseGet { defaultQuestion(id) }

    fun save(id: String, question: QuestionDefinition): QuestionDefinition {
        require(question.rules.isNotEmpty()) { "至少配置一个评分项" }
        require(question.rules.sumOf { it.score } in 1..100) { "评分项总分必须在 1 到 100 之间" }
        require(question.rules.all { it.cells.isNotEmpty() }) { "评分项必须包含答案单元格" }
        return repository.save(question.copy(id = id))
    }

    fun studentView(id: String): StudentQuestionDefinition {
        val question = get(id)
        return StudentQuestionDefinition(
            question.id, question.title, question.difficulty, question.duration,
            question.background, question.objective, question.steps,
            question.rules.flatMap { rule ->
                rule.cells.map { cell ->
                    StudentAnswerTarget(rule.id, rule.sheetId, rule.rangeLabel, cell.row, cell.column, cell.cellRef, rule.score)
                }
            }
        )
    }

    companion object {
        fun defaultQuestion(id: String = "default") = QuestionDefinition(
            id, "季度销售数据分析", "中等", 15,
            "根据季度销售数据完成汇总、平均值、税额和达标判断。",
            "使用正确公式完成指定单元格。",
            listOf("计算季度销售总额", "计算季度平均销售额", "计算增值税额", "判断销售额是否达标"),
            listOf(
                rule("sum", "C7", 6, 2, 30, 158000.0, "=SUM(C3:C6)"),
                rule("average", "C8", 7, 2, 20, 39500.0, "=AVERAGE(C3:C6)"),
                rule("tax", "C9", 8, 2, 25, 20540.0, "=C7*0.13"),
                rule("target", "C10", 9, 2, 25, "达标", "=IF(C7>100000,\"达标\",\"未达标\")")
            )
        )

        private fun rule(id: String, ref: String, row: Int, column: Int, score: Int, value: Any, formula: String) =
            GradingRuleDefinition(id, "sheet-01", ref, "FORMULA", score, 0.0001, false,
                listOf(StandardCell(row, column, ref, value, formula)))
    }
}
