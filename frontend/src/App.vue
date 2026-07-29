<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { ElMessage } from "element-plus";
import UniverSheetEditor from "./components/sheet/UniverSheetEditor.vue";
import AuthoringSidebar from "./components/authoring/AuthoringSidebar.vue";
import QuestionBrief from "./components/authoring/QuestionBrief.vue";
import type { UniverWorkbookAdapter } from "./adapters/univer-workbook-adapter";
import { useWorkbookAuthoring } from "./composables/useWorkbookAuthoring";
import { useCollaboration } from "./composables/useCollaboration";
import type { QuestionConfig } from "./models/authoring";
import type { CellAssessmentResult } from "./models/assessment";
import { getStudentQuestion, getTeacherQuestion, saveTeacherQuestion, submitStudentQuestion, type StudentAnswerTarget } from "./services/question-api";

const adapter = ref<UniverWorkbookAdapter>();
const collaboration = useCollaboration(() => adapter.value);
const authoring = useWorkbookAuthoring(() => adapter.value);
const query = new URLSearchParams(location.search);
const room = query.get("room") || "univer-demo";
const questionId = query.get("questionId") || "default";
const studentMode = query.get("mode") === "student";
const performanceMode = query.get("performance") === "1";
const user = query.get("user") || sessionStorage.getItem("univer-user") || `用户-${Math.random().toString(36).slice(2, 6)}`;
const savedQuestion = localStorage.getItem("univer-question-config");
const question = ref<QuestionConfig>(savedQuestion ? JSON.parse(savedQuestion) : {
  title: "销售日报整理与汇总", difficulty: "简单", duration: 12,
  background: "同事发来了一份只有默认工作表名称的销售日报。请根据业务要求补全销售金额，并整理成可复用的日报模板。",
  objective: "完成每笔销售金额计算，并在底部汇总当日销售总额，结果保留两位小数。",
  steps: ["在 D 列使用“数量 × 单价”计算每笔销售金额", "在 D6 单元格汇总全部销售金额", "将金额列设置为两位小数"],
});
const saved = ref(false);
const studentTargets = ref<StudentAnswerTarget[]>([]);
let stopSelection: (() => void) | undefined;

const onEditorReady = async (editor: UniverWorkbookAdapter) => {
  adapter.value = editor;
  if (performanceMode) {
    window.requestAnimationFrame(() => editor.markReady());
    return;
  }
  collaboration.connect(room, user);
  if (studentMode) {
    try {
      const definition = await getStudentQuestion(questionId);
      question.value = definition;
      studentTargets.value = definition.answerTargets;
      await editor.setCells(definition.answerTargets.map((target) => ({ row: target.row, column: target.column, value: null })));
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : "试卷加载失败");
    }
  } else {
    stopSelection = authoring.start();
    window.requestAnimationFrame(() => editor.markReady());
    try {
      const definition = await getTeacherQuestion(questionId);
      question.value = definition;
      authoring.rules.value = definition.rules;
    } catch {
      // Keep the editable local draft when the API is temporarily offline.
    }
  }
};

const updateQuestion = (next: QuestionConfig) => {
  question.value = next;
  localStorage.setItem("univer-question-config", JSON.stringify(next));
};

const saveQuestion = async () => {
  try {
    await saveTeacherQuestion(questionId, { id: questionId, ...question.value, rules: authoring.rules.value });
    localStorage.setItem("univer-question-config", JSON.stringify(question.value));
    saved.value = true;
    window.setTimeout(() => { saved.value = false; }, 1800);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存失败");
  }
};

const submitStudent = async () => {
  const editor = adapter.value;
  if (!editor) return;
  try {
    const response = await submitStudentQuestion(questionId, studentTargets.value.map((target) => ({
      ...target,
      value: editor.getCellValue(target.row, target.column),
      formula: editor.getCellFormula(target.row, target.column),
    })));
    ElMessage.success(`提交完成：${response.totalScore} / ${response.maxPossibleScore} 分`);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "提交失败");
  }
};

const runGrade = async () => {
  const submitted = await authoring.grade();
  if (!submitted?.length) return;
  const results: CellAssessmentResult[] = authoring.rules.value.flatMap((rule) => rule.cells.map((standard) => {
    const cell = submitted.find((item) => item.cellRef === standard.cellRef);
    const actual = cell?.value;
    const correct = rule.mode === "FORMULA"
      ? (cell?.formula || "").replaceAll(" ", "").toUpperCase() === (standard.formula || "").replaceAll(" ", "").toUpperCase()
      : rule.mode === "VALUE" ? !Number.isNaN(Number(actual)) && Math.abs(Number(actual) - Number(standard.value)) <= rule.tolerance
      : String(actual ?? "").trim() === String(standard.value ?? "").trim();
    return { row: standard.row, column: standard.column, cellRef: standard.cellRef, title: rule.rangeLabel, earnedScore: correct ? rule.score : 0, scoreWeight: rule.score, status: correct ? "CORRECT" : "RED_ERROR", studentValue: actual as string | number, studentFormula: cell?.formula, standardValue: standard.value as string | number, standardFormula: standard.formula || "", errorAnalysisPrompt: "请检查该单元格的值或公式。" } satisfies CellAssessmentResult;
  }));
  authoring.applyResults(results);
  const score = results.reduce((sum, item) => sum + item.earnedScore, 0);
  ElMessage({ type: score === authoring.totalScore.value ? "success" : "warning", message: `试判完成：${score} / ${authoring.totalScore.value} 分` });
};

onBeforeUnmount(() => {
  stopSelection?.();
  collaboration.disconnect();
  adapter.value?.dispose();
});
</script>

<template>
  <main class="app-shell" :class="{ 'preview-mode': authoring.preview.value, 'performance-only': performanceMode }">
    <header class="toolbar">
      <div class="brand"><div class="brand-mark">▣</div><div><h1>表格实训</h1><span>题库与在线考核</span></div></div>
      <div class="toolbar-title"><span class="mode-dot"></span>{{ performanceMode ? "10 万行性能测试" : studentMode ? "学员答题模式" : authoring.preview.value ? "学员预览" : "教师出题模式" }}</div>
      <div class="actions">
        <span v-if="!studentMode && !performanceMode" class="save-state">{{ saved ? "✓ 已保存到服务器" : "评分规则保存在服务器" }}</span>
        <el-button v-if="!studentMode && !performanceMode" plain @click="authoring.togglePreview()">{{ authoring.preview.value ? "退出预览" : "学员视角预览" }}</el-button>
        <el-button v-if="!studentMode && !performanceMode && !authoring.preview.value" type="primary" @click="saveQuestion">保存题目</el-button>
        <el-tag v-if="studentMode" type="success">答案已隔离</el-tag>
      </div>
    </header>
    <section class="titlebar">
      <el-button link>‹ 返回题库</el-button>
      <div class="title-copy"><h2>{{ question.title }}</h2><div><el-tag size="small">{{ question.difficulty }}</el-tag><span>◷ 预计 {{ question.duration }} 分钟</span><span>满分 {{ authoring.totalScore.value }} 分</span></div></div>
      <el-button v-if="!studentMode && !performanceMode && !authoring.preview.value" link class="collapse-action">收起题目说明</el-button>
    </section>
    <section class="workspace">
      <QuestionBrief v-if="!performanceMode && (studentMode || !authoring.preview.value)" :question="question" :preview="studentMode || authoring.preview.value" @update="updateQuestion" />
      <div class="sheet"><UniverSheetEditor @ready="onEditorReady" /></div>
      <AuthoringSidebar v-if="!performanceMode && !studentMode && (!authoring.preview.value || authoring.rules.value.length)" :rules="authoring.rules.value" :selection="authoring.selection.value" :selected-value="authoring.selection.value ? (adapter?.getCellValue(authoring.selection.value.startRow, authoring.selection.value.startColumn) ?? null) : null" :preview="authoring.preview.value" :total-score="authoring.totalScore.value" @mark="authoring.markSelection" @remove="authoring.removeRule" @update="(id, patch) => { const rule = authoring.rules.value.find((item) => item.id === id); if (rule) Object.assign(rule, patch) }" />
    </section>
    <footer class="bottom-bar">
      <span>{{ performanceMode ? "✦ 性能模式：仅加载 Univer 与 10 万行数据，不启用出题业务监听" : studentMode ? "✦ 标准答案由服务器隔离保存，完成后请提交试卷" : "✦ 提示：先在表格中填写标准答案，选中单元格后点击“设为标准答案”" }}</span>
      <el-button v-if="!studentMode && !performanceMode" plain @click="authoring.togglePreview()">{{ authoring.preview.value ? "返回出题" : "预览试卷" }}</el-button>
      <el-button v-if="!studentMode && !performanceMode && !authoring.preview.value" type="primary" @click="runGrade">试判一次</el-button>
      <el-button v-if="studentMode && !performanceMode" type="primary" @click="submitStudent">提交试卷</el-button>
    </footer>
  </main>
</template>
