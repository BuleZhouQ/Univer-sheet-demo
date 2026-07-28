<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import UniverSheetEditor from "./components/sheet/UniverSheetEditor.vue";
import type { UniverWorkbookAdapter } from "./adapters/univer-workbook-adapter";
import AssessmentSidebar from "./components/assessment/AssessmentSidebar.vue";
import { useExcelAssessment } from "./composables/useExcelAssessment";

const adapter = ref<UniverWorkbookAdapter>();
const assessment = useExcelAssessment(() => adapter.value);

const onEditorReady = (editor: UniverWorkbookAdapter) => {
  adapter.value = editor;
};

onBeforeUnmount(() => adapter.value = undefined);
</script>

<template>
  <main class="app-shell">
    <header class="toolbar">
      <div><h1>Univer 在线表格考核</h1><p>公式考核与大数据性能验证</p></div>
      <div class="actions"><span>完整快照 · 100,000 行</span><el-tag type="success">Univer</el-tag></div>
    </header>
    <section class="workspace">
      <div class="sheet"><UniverSheetEditor @ready="onEditorReady" /></div>
      <AssessmentSidebar :results="assessment.results.value" :total="assessment.summary.value.totalScore" :max="assessment.summary.value.maxScore" :loading="assessment.loading.value" :error="assessment.error.value" @submit="assessment.submit" @inspect="assessment.inspect" />
    </section>
  </main>
</template>
