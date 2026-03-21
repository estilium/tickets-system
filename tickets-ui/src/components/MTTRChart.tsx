import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Line } from "react-chartjs-2";
import type { MTTR } from "../types/metrics";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export default function MTTRChart({ data }: { data: MTTR[] }) {
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: "MTTR (min)",
        data: data.map(d => d.mttr),
        borderWidth: 2,
        tension: 0.3,
      },
    ],
  };

  return <Line data={chartData} options={options} />;
}

const options = {
  responsive: true,
  plugins: {
    legend: { display: true },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};