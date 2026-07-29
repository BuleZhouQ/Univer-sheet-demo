<script setup lang="ts">
import { computed } from "vue";
import { CircleCheck, Delete, Setting, View } from "@element-plus/icons-vue";
import type { GradingMode, GradingRule, SelectionRange } from "../../models/authoring";

const props = defineProps<{
  rules: GradingRule[];
  selection?: SelectionRange;
  selectedValue: string | number | boolean | null;
  preview: boolean;
  totalScore: number;
}>();
const emit = defineEmits<{
  mark: [];
  remove: [string];
  update: [string, Partial<GradingRule>];
}>();

const modeNames: Record<GradingMode, string> = { VALUE: "结果匹配", FORMULA: "公式匹配", TEXT: "文本匹配" };
const selectionText = computed(() => props.selection ? `${props.selection.startRow + 1},${props.selection.startColumn + 1}` : "未选择");
</script>

<template>
  <aside class="authoring-sidebar">
    <div class="sidebar-heading">
      <div><small>自动判分配置</small><h2>标准答案</h2></div>
      <el-tag size="small" type="success">教师模式</el-tag>
    </div>
    <div v-if="preview" class="preview-banner"><el-icon><View /></el-icon> 学员预览中<br /><small>标准答案已从工作簿中清空</small></div>
    <template v-else>
      <div class="selection-box">
        <div class="selection-badge">＋</div>
        <div><small>当前选中区域</small><strong>{{ selection?.startRow !== undefined ? selectionText : "请选择单元格" }}</strong><p>{{ selectedValue ?? "空白单元格" }}</p></div>
      </div>
      <el-button class="mark-button" type="primary" :disabled="!selection || selectedValue === null || selectedValue === ''" @click="emit('mark')">
        <el-icon><CircleCheck /></el-icon> 设为标准答案
      </el-button>
    </template>

    <div class="score-line"><span>评分项总分</span><b :class="{ valid: totalScore === 100 }">{{ totalScore }}<small> / 100</small></b></div>
    <div v-if="!rules.length" class="empty-rules"><el-icon><Setting /></el-icon><p>还没有评分项</p><small>选中标准答案单元格后添加</small></div>
    <div v-for="(rule, index) in rules" :key="rule.id" class="rule-card">
      <div class="rule-title"><i>{{ index + 1 }}</i><div><strong>{{ rule.rangeLabel }}</strong><small>{{ rule.cells.length }} 个单元格</small></div><el-button text @click="emit('remove', rule.id)"><el-icon><Delete /></el-icon></el-button></div>
      <div class="rule-fields">
        <label>判分方式<el-select :model-value="rule.mode" size="small" @update:model-value="(value: GradingMode) => emit('update', rule.id, { mode: value })">
          <el-option v-for="(name, mode) in modeNames" :key="mode" :value="mode" :label="name" />
        </el-select></label>
        <label>分值<el-input-number :model-value="rule.score" :min="1" :max="100" size="small" controls-position="right" @update:model-value="(value: number | undefined) => emit('update', rule.id, { score: value || 1 })" /></label>
      </div>
      <label v-if="rule.mode === 'VALUE'" class="tolerance">允许误差 <el-input-number :model-value="rule.tolerance" :min="0" :step="0.01" size="small" @update:model-value="(value: number | undefined) => emit('update', rule.id, { tolerance: value || 0 })" /></label>
      <div class="rule-footer"><span>允许部分得分</span><el-switch :model-value="rule.partialCredit" size="small" @update:model-value="(value: boolean) => emit('update', rule.id, { partialCredit: value })" /></div>
    </div>
  </aside>
</template>

<style scoped>
.authoring-sidebar{width:320px;padding:20px 16px;border-left:1px solid #e2e8f0;overflow:auto;background:#fff}.sidebar-heading{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eef2f5;padding-bottom:15px;margin-bottom:15px}.sidebar-heading small{color:#94a3b8;font-size:10px;letter-spacing:.08em}.sidebar-heading h2{margin:3px 0 0;font-size:18px;color:#172238}.selection-box{display:flex;gap:10px;padding:12px;border:1px solid #dcece6;border-radius:9px;background:#f3faf7}.selection-badge{width:30px;height:30px;border-radius:7px;display:grid;place-items:center;background:#d9eee8;color:#16735d;font-size:20px}.selection-box small,.selection-box p{display:block;color:#8a97a6;font-size:10px;margin:0}.selection-box strong{display:block;font-size:13px;margin:2px 0}.mark-button{width:100%;margin:11px 0 15px}.preview-banner{padding:14px;border-radius:9px;background:#eef7f3;color:#18745d;font-size:13px;line-height:1.7}.preview-banner small{color:#6f8f85;font-size:10px}.score-line{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #edf1f4;border-bottom:1px solid #edf1f4;padding:15px 0;margin-bottom:12px;color:#66758a;font-size:12px}.score-line b{font-size:21px;color:#d88b1c}.score-line b.valid{color:#16735d}.score-line b small{font-size:11px;color:#9da7b4}.empty-rules{text-align:center;color:#9aa6b3;padding:32px 0}.empty-rules .el-icon{font-size:28px}.empty-rules p{margin:8px 0 2px;font-size:12px}.empty-rules small{font-size:10px}.rule-card{border:1px solid #e1e7ec;border-radius:8px;padding:11px;margin-bottom:10px;box-shadow:0 2px 8px rgba(26,44,66,.04)}.rule-title{display:grid;grid-template-columns:27px 1fr 26px;align-items:center;gap:8px}.rule-title i{width:27px;height:27px;border-radius:7px;background:#fff1d8;color:#b87317;display:grid;place-items:center;font-style:normal;font-size:11px;font-weight:700}.rule-title strong{display:block;font-size:12px}.rule-title small{color:#9aa5b3;font-size:10px}.rule-title .el-button{padding:0;color:#aeb7c2}.rule-fields{display:grid;grid-template-columns:1fr 75px;gap:8px;margin-top:10px}.rule-fields label,.tolerance{color:#7f8b9a;font-size:10px;display:flex;flex-direction:column;gap:5px}.tolerance{margin-top:8px}.rule-footer{border-top:1px solid #f0f2f5;margin-top:10px;padding-top:9px;display:flex;justify-content:space-between;color:#768396;font-size:10px}
</style>
