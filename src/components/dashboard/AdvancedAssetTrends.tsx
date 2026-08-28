import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp } from 'lucide-react';

export const AdvancedAssetTrends: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Dummy data for asset trends
    const data = [
      { date: '2025-01', value: 100 },
      { date: '2025-02', value: 120 },
      { date: '2025-03', value: 110 },
      { date: '2025-04', value: 150 },
      { date: '2025-05', value: 140 },
      { date: '2025-06', value: 180 },
    ];

    const svg = d3.select(svgRef.current);
    const width = 600;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    svg.selectAll('*').remove();

    const x = d3.scalePoint()
      .domain(data.map(d => d.date))
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) || 200])
      .range([height - margin.bottom, margin.top]);

    const line = d3.line<typeof data[0]>()
      .x(d => x(d.date) || 0)
      .y(d => y(d.value));

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'hsl(var(--primary))')
      .attr('stroke-width', 3)
      .attr('d', line);

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5));

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

  }, []);

  return (
    <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-2xl shadow-black/5 rounded-[2.5rem] h-full flex flex-col hover:bg-card/80 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-8">
        <CardTitle className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">
          Tendências de Ativos (Longo Prazo)
        </CardTitle>
        <div className="w-12 h-12 rounded-[1.25rem] bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-8 pt-0">
        <svg ref={svgRef} width="100%" height="300" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet" />
      </CardContent>
    </Card>
  );
};
