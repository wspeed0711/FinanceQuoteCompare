import React from 'react';
import { renderToString } from 'react-dom/server';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Page A', '0P000019C5Percent': 4000 },
  { name: 'Page B', '0P000019C5Percent': 3000 },
];

function TestChart() {
  return (
    <LineChart width={500} height={300} data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
      <Line type="monotone" dataKey="0P000019C5Percent" stroke="#8884d8" />
    </LineChart>
  );
}

try {
  const html = renderToString(<TestChart />);
  console.log("Rendered successfully. Length:", html.length);
} catch (e: any) {
  console.error("Crash:", e.message);
}
