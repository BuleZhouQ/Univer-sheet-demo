<script setup lang="ts">
import type { CellAssessmentResult } from "../../models/assessment";
defineProps<{ results: CellAssessmentResult[]; total: number; max: number; loading: boolean; error: string }>();
defineEmits<{ submit: []; inspect: [CellAssessmentResult] }>();
</script>
<template>
  <aside class="sidebar">
    <div class="score"><strong>{{ total }}</strong><span>/ {{ max || 100 }} 分</span></div>
    <el-button type="primary" :loading="loading" @click="$emit('submit')">提交考核</el-button>
    <el-alert v-if="error" :title="error" type="error" :closable="false" />
    <div v-for="item in results" :key="item.cellRef" class="result" :class="item.status" @click="$emit('inspect', item)">
      <b>{{ item.cellRef }} · {{ item.title }}</b>
      <span>{{ item.earnedScore }}/{{ item.scoreWeight }} 分</span>
      <p v-if="item.status !== 'CORRECT'">{{ item.errorAnalysisPrompt }}</p>
    </div>
  </aside>
</template>
<style scoped>
.sidebar { width: 320px; padding: 18px; border-left: 1px solid #e2e8f0; overflow: auto; display:flex; flex-direction:column; gap:12px; }
.score strong { font-size: 34px; color:#2563eb; }.score span { color:#64748b; }
.result { padding:12px; border:1px solid #e2e8f0; border-radius:8px; cursor:pointer; display:grid; gap:5px; }
.result span,.result p { font-size:12px; margin:0; color:#64748b; }.CORRECT{border-left:4px solid #22c55e}.RED_ERROR{border-left:4px solid #ef4444}.YELLOW_ANALYZED{border-left:4px solid #eab308}
</style>
