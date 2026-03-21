export type DashboardData = {
  total: number;
  openTickets: number;
  inProgressTickets: number;
  closedTickets: number;
};

export type MTTR = {
  date: string;
  mttr: number;
};