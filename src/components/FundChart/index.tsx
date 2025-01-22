import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import type { TradeRecord } from '../../store/slices/tradeRecordSlice';
import dayjs from 'dayjs';

interface FundChartProps {
  fundCode: string;
  historyData: {
    date: string;
    netWorth: number;
    accNetWorth: number;
  }[];
}

const FundChart: React.FC<FundChartProps> = ({ fundCode, historyData }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts>();

  // 获取交易记录
  const tradeRecords = useSelector((state: RootState) =>
    state.tradeRecord.records
      .filter(record => record.fundCode === fundCode)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  );

  // 处理数据
  const processData = () => {
    // 按日期排序
    const sortedData = [...historyData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // 提取数据
    const dates = sortedData.map(item => item.date);
    const values = sortedData.map(item => item.accNetWorth);

    // 处理交易点数据
    const buyPoints: any[] = [];
    const sellPoints: any[] = [];

    tradeRecords.forEach(record => {
      const index = dates.indexOf(record.date);
      if (index !== -1) {
        const point = {
          coord: [index, values[index]],
          value: record.buyAmount ? (record.buyAmount / 10000).toFixed(2) : (record.sellAmount! / 10000).toFixed(2)
        };
        if (record.status === 'holding' || !record.sellDate) {
          buyPoints.push(point);
        } else {
          const sellIndex = dates.indexOf(record.sellDate);
          if (sellIndex !== -1) {
            sellPoints.push({
              coord: [sellIndex, record.sellAccNetWorth],
              value: (record.sellAmount! / 10000).toFixed(2)
            });
          }
        }
      }
    });

    return { dates, values, buyPoints, sellPoints };
  };

  useEffect(() => {
    if (!chartRef.current || !historyData.length) return;

    // 初始化图表
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const { dates, values, buyPoints, sellPoints } = processData();

    // 配置项
    const option = {
      title: {
        text: '近30日走势',
        left: 'center',
        top: 10
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const date = params[0].axisValue;
          const value = params[0].data;
          return `${date}<br/>累计净值：${value}`;
        }
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          formatter: (value: string) => dayjs(value).format('MM-DD'),
          margin: 18
        }
      },
      yAxis: {
        type: 'value',
        scale: true,
        splitLine: {
          show: true,
          lineStyle: {
            type: 'dashed'
          }
        }
      },
      series: [
        {
          type: 'line',
          data: values,
          smooth: true,
          showSymbol: false,
          lineStyle: {
            width: 2
          },
          markPoint: {
            data: buyPoints.map(point => {
              const record = tradeRecords.find(r => r.date === dates[point.coord[0]]);
              return {
                ...point,
                itemStyle: { color: '#f43f5e' },
                label: {
                  formatter: record?.status === 'sold' 
                    ? `买入`  // 如果已卖出，只显示"买入"文字
                    : `买入\n${point.value}万`  // 如果未卖出，显示买入金额
                }
              };
            })
          },
          markLine: {
            data: tradeRecords
              .filter(record => record.status === 'sold')
              .map(record => {
                const buyIndex = dates.indexOf(record.date);
                const sellIndex = dates.indexOf(record.sellDate!);
                return [{
                  coord: [buyIndex, values[buyIndex]],
                  lineStyle: {
                    type: 'dashed',
                    color: record.profit! >= 0 ? '#f43f5e' : '#10b981'
                  }
                }, {
                  coord: [sellIndex, record.sellAccNetWorth],
                  label: {
                    show: true,
                    formatter: `卖出 ${record.profit! >= 0 ? '+' : ''}${(record.profit! / 10000).toFixed(2)}万\n${record.profitRate! >= 0 ? '+' : ''}${record.profitRate!.toFixed(2)}%`,
                    position: 'end',
                    distance: 10,
                    fontSize: 12,
                    color: record.profit! >= 0 ? '#f43f5e' : '#10b981'
                  }
                }];
              }),
            symbol: ['none', 'arrow'],
            symbolSize: [6, 10],
            animation: false
          }
        }
      ],
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%'
      },
      dataZoom: [
        {
          type: 'inside',
          start: Math.max(0, (dates.length - 30) / dates.length * 100),
          end: 100
        },
        {
          type: 'slider',
          start: Math.max(0, (dates.length - 30) / dates.length * 100),
          end: 100
        }
      ]
    };

    chartInstance.current.setOption(option);

    // 响应式调整
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [historyData, tradeRecords]);

  return (
    <div 
      ref={chartRef} 
      className="w-full h-[400px] mt-4 backdrop-blur-lg bg-white/80 shadow-lg rounded-2xl border-0 p-4"
    />
  );
};

export default FundChart; 