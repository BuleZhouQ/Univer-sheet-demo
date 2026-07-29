<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { createUniver, defaultTheme, LocaleType, mergeLocales } from "@univerjs/presets";
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import SheetsCoreZhCN from "@univerjs/preset-sheets-core/locales/zh-CN";
import "@univerjs/preset-sheets-core/lib/index.css";
import { createAssessmentWorkbookData, performanceRowsToWorkbookData, UniverWorkbookAdapter } from "../../adapters/univer-workbook-adapter";

const emit = defineEmits<{ ready: [UniverWorkbookAdapter] }>();
const container = ref<HTMLElement>();
const loading = ref(true);
let univer: any;

onMounted(async () => {
  const result = createUniver({
    locale: LocaleType.ZH_CN,
    locales: { [LocaleType.ZH_CN]: mergeLocales(SheetsCoreZhCN) },
    theme: defaultTheme,
    presets: [UniverSheetsCorePreset({ container: container.value! })],
  });
  univer = result.univer;
  try {
    const query = new URLSearchParams(location.search);
    if (query.get("performance") !== "0") {
      const response = await fetch("/api/performance/snapshot");
      if (!response.ok) throw new Error(`snapshot HTTP ${response.status}`);
      const snapshot = await response.json();
      result.univerAPI.createWorkbook(performanceRowsToWorkbookData(snapshot));
    } else {
      result.univerAPI.createWorkbook(createAssessmentWorkbookData(100_000, 26));
    }
  } catch {
    result.univerAPI.createWorkbook(createAssessmentWorkbookData(100_000, 26));
  } finally {
    loading.value = false;
  }
  emit("ready", new UniverWorkbookAdapter(result.univerAPI));
});

onBeforeUnmount(() => univer?.dispose());
</script>

<template><div class="univer-wrapper"><div ref="container" class="univer-container" /><div v-if="loading" class="loading-mask">正在加载完整工作簿…</div></div></template>

<style scoped>.univer-wrapper { position:relative; width:100%; height:100%; }.univer-container { width:100%; height:100%; }.loading-mask { position:absolute; inset:0; display:grid; place-items:center; background:#fff; color:#64748b; }</style>
