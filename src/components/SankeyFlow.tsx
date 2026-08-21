
import React from 'react';
import { ResponsiveContainer, Sankey, Tooltip, Layer, Rectangle } from 'recharts';

interface SankeyData {
  nodes: { name: string; color?: string }[];
  links: { source: number; target: number; value: number }[];
}

interface SankeyFlowProps {
  data: SankeyData;
  onNodeClick?: (node: any) => void;
  selectedNode?: string | null;
  currency?: "USD" | "KHR";
  exchangeRate?: number;
}


const CustomizedNode = (props: any) => {
  const { x, y, width, height, index, payload, containerWidth, onNodeClick, selectedNode } = props;
  const isOut = x + width + 6 > containerWidth;
  const isSelected = selectedNode === payload.name;

  return (
    <Layer key={`sankey-node-${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={payload.color || 'var(--primary)'}
        fillOpacity={isSelected ? 1 : 0.8}
        stroke="var(--border)"
        strokeWidth={isSelected ? 2 : 1}
        className="cursor-pointer transition-all duration-200 hover:fill-opacity-100"
        onClick={() => onNodeClick?.(payload)}
      />
      <text
        x={x + (isOut ? -6 : width + 6)}
        y={y + height / 2}
        textAnchor={isOut ? 'end' : 'start'}
        alignmentBaseline="middle"
        fontSize="10px"
        fontWeight="bold"
        fill="var(--foreground)"
        className="pointer-events-none uppercase tracking-tighter"
      >
        {payload.name}
      </text>
      <text
        x={x + (isOut ? -6 : width + 6)}
        y={y + height / 2 + 12}
        textAnchor={isOut ? 'end' : 'start'}
        alignmentBaseline="middle"
        fontSize="9px"
        fill="var(--muted-foreground)"
        className="pointer-events-none tabular-nums"
      >
        {payload.value?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </text>
    </Layer>
  );
};


export const SankeyFlow: React.FC<SankeyFlowProps> = ({ data, onNodeClick, selectedNode, currency = "USD", exchangeRate = 4000 }) => {
  if (!data.nodes.length || !data.links.length) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm uppercase tracking-widest font-bold">
        No flow data available
      </div>
    );
  }

  return (
    <div className="h-[500px] w-full py-4 space-y-4">
      <ResponsiveContainer width="100%" height="85%">
        <Sankey
          data={data}
          node={<CustomizedNode onNodeClick={onNodeClick} selectedNode={selectedNode} containerWidth={500} />}
          nodePadding={40}
          link={{ stroke: 'var(--primary)', opacity: 0.15, cursor: 'pointer' }}
          margin={{ top: 20, left: 10, right: 100, bottom: 20 }}
          iterations={64}
        >
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--border)',
              borderRadius: '4px',
              fontSize: '10px',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              color: 'var(--foreground)',
              boxShadow: 'none'
            }}
            formatter={(value: any, name: any, props: any) => {
              const { payload } = props;
              const source = data.nodes[payload.source]?.name;
              const target = data.nodes[payload.target]?.name;
              const total = value?.toLocaleString(undefined, { minimumFractionDigits: 2 });
              const symbol = currency === 'USD' ? '$' : '៛';
              const rateInfo = exchangeRate ? ` (Rate: ${exchangeRate})` : '';
              return [`${symbol}${total}${rateInfo}`, `${source} → ${target}`];

            }}

          />
        </Sankey>
      </ResponsiveContainer>
      
      <div className="flex flex-wrap gap-3 justify-center pt-4 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--mint)' }} />
          <span className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">Income Source</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--primary)' }} />
          <span className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">Central Pool</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--ember)' }} />
          <span className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">Expense Type</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--signal)' }} />
          <span className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">Savings</span>
        </div>
      </div>
    </div>
  );
};

