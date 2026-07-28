<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import UniverSheetEditor from "./components/sheet/UniverSheetEditor.vue";
import type { UniverWorkbookAdapter } from "./adapters/univer-workbook-adapter";
import AssessmentSidebar from "./components/assessment/AssessmentSidebar.vue";
import { useExcelAssessment } from "./composables/useExcelAssessment";
import { useCollaboration } from "./composables/useCollaboration";

const adapter = ref<UniverWorkbookAdapter>();
const assessment = useExcelAssessment(() => adapter.value);
const collaboration = useCollaboration(() => adapter.value);
const query = new URLSearchParams(location.search);
const room = query.get("room") || "univer-demo";
const user = query.get("user") || sessionStorage.getItem("univer-user") || `用户-${Math.random().toString(36).slice(2, 6)}`;
sessionStorage.setItem("univer-user", user);

const onEditorReady = (editor: UniverWorkbookAdapter) => {
  adapter.value = editor;
  collaboration.connect(room, user);
};

onBeforeUnmount(() => {
  collaboration.disconnect();
  adapter.value?.dispose();
  adapter.value = undefined;
});
</script>

<template>
  <main class="app-shell">
    <header class="toolbar">
      <div><h1>Univer 在线表格考核</h1><p>公式考核与大数据性能验证</p></div>
      <div class="actions">
        <span>房间：{{ room }} · {{ user }}</span>
        <el-tag :type="collaboration.connected.value ? 'success' : 'warning'">{{ collaboration.status.value }}</el-tag>
        <el-tag type="success">Univer</el-tag>
      </div>
    </header>
    <section class="workspace">
      <div class="sheet"><UniverSheetEditor @ready="onEditorReady" /></div>
      <AssessmentSidebar :results="assessment.results.value" :total="assessment.summary.value.totalScore" :max="assessment.summary.value.maxScore" :loading="assessment.loading.value" :error="assessment.error.value" @submit="assessment.submit" @inspect="assessment.inspect" />
    </section>
  </main>
</template>
