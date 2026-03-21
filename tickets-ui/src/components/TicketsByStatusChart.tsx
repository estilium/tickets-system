import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

type Props = {
  data: { status: string; count: number }[];
};

export default function TicketsByStatusChart({ data }: Props) {
  const chartData = {
    labels: data.map(d => d.status),
    datasets: [
      {
        label: "Tickets",
        data: data.map(d => d.count),
        borderWidth: 1,
      },
    ],
  };
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);
  return <Bar data={chartData} key={JSON.stringify(data)} />;
}