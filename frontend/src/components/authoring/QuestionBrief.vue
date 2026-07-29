<script setup lang="ts">
import { ArrowDown } from "@element-plus/icons-vue";
import type { QuestionConfig } from "../../models/authoring";
defineProps<{ question: QuestionConfig; preview: boolean }>();
const emit = defineEmits<{ update: [QuestionConfig] }>();
</script>
<template>
  <aside class="question-brief">
    <div class="brief-head"><div><small>题目内容</small><h2>任务说明</h2></div><el-button text><el-icon><ArrowDown /></el-icon></el-button></div>
    <label>题目名称<el-input :model-value="question.title" :readonly="preview" @update:model-value="(value: string) => emit('update', { ...question, title: value })" /></label>
    <label>业务背景<el-input type="textarea" :rows="4" :model-value="question.background" :readonly="preview" @update:model-value="(value: string) => emit('update', { ...question, background: value })" /></label>
    <label>任务目标<el-input type="textarea" :rows="3" :model-value="question.objective" :readonly="preview" @update:model-value="(value: string) => emit('update', { ...question, objective: value })" /></label>
    <div class="brief-grid"><label>难度<el-select :model-value="question.difficulty" :disabled="preview" @update:model-value="(value: QuestionConfig['difficulty']) => emit('update', { ...question, difficulty: value })"><el-option label="简单" value="简单" /><el-option label="中等" value="中等" /><el-option label="困难" value="困难" /></el-select></label><label>预计用时<el-input-number :model-value="question.duration" :disabled="preview" :min="1" controls-position="right" @update:model-value="(value: number | undefined) => emit('update', { ...question, duration: value || 1 })" /></label></div>
    <div class="steps-title">操作步骤 <small>{{ question.steps.length }} 项</small></div>
    <ol><li v-for="(step, index) in question.steps" :key="index"><i>{{ index + 1 }}</i><el-input :model-value="step" :readonly="preview" @update:model-value="(value: string) => { const steps = [...question.steps]; steps[index] = value; emit('update', { ...question, steps }) }" /></li></ol>
  </aside>
</template>
<style scoped>
.question-brief{width:300px;padding:20px 16px;border-right:1px solid #e2e8f0;overflow:auto;background:#fff}.brief-head{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #eef2f5;padding-bottom:15px;margin-bottom:5px}.brief-head small{color:#94a3b8;font-size:10px;letter-spacing:.08em}.brief-head h2{margin:3px 0;font-size:18px}.question-brief label{display:flex;flex-direction:column;gap:5px;color:#718096;font-size:11px;font-weight:600;margin-top:15px}.brief-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.brief-grid label{min-width:0}.steps-title{display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-top:20px}.steps-title small{font-weight:normal;color:#9aa5b3}.question-brief ol{padding:0;margin:10px 0;list-style:none}.question-brief li{display:grid;grid-template-columns:23px 1fr;gap:7px;align-items:start;margin-bottom:8px}.question-brief li i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:#e5f3ee;color:#16735d;font-style:normal;font-size:10px}.question-brief :deep(.el-input__wrapper),.question-brief :deep(.el-textarea__inner){box-shadow:0 0 0 1px #e1e7ee inset;background:#fbfcfd}.question-brief :deep(.el-input__inner),.question-brief :deep(.el-textarea__inner){font-size:11px;color:#304055}.question-brief :deep(.el-input-number){width:100%}
</style>
