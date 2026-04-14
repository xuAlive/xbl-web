import { init, registerMap, use, type ComposeOption } from 'echarts/core'
import { PieChart, BarChart, ScatterChart, EffectScatterChart, type PieSeriesOption, type BarSeriesOption, type ScatterSeriesOption, type EffectScatterSeriesOption } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent, GeoComponent, DatasetComponent, type TitleComponentOption, type TooltipComponentOption, type LegendComponentOption, type GridComponentOption, type GeoComponentOption, type DatasetComponentOption } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { LabelLayout, UniversalTransition } from 'echarts/features'

use([
  PieChart,
  BarChart,
  ScatterChart,
  EffectScatterChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  GeoComponent,
  DatasetComponent,
  CanvasRenderer,
  LabelLayout,
  UniversalTransition
])

type EChartsOption = ComposeOption<
  | PieSeriesOption
  | BarSeriesOption
  | ScatterSeriesOption
  | EffectScatterSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | LegendComponentOption
  | GridComponentOption
  | GeoComponentOption
  | DatasetComponentOption
>

type EChartsModule = {
  init: typeof init
  registerMap: typeof registerMap
  type?: EChartsOption
}

export type { EChartsModule }

let echartsPromise: Promise<EChartsModule> | null = null

export const loadEcharts = async (): Promise<EChartsModule> => {
  echartsPromise ??= Promise.resolve({
    init,
    registerMap
  })

  return echartsPromise
}
