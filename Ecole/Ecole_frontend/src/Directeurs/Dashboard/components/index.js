/**
 * index.js - Barrel export pour les composants du Dashboard
 */
export { default as Sidebar } from './Sidebar';
export { default as Header } from './Header';
export { default as StatisticsCard } from './StatisticsCard';
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as OverviewTab } from './OverviewTab';
export {
    EffectifsLineChart,
    GradesPieChart,
    AttendanceBarChart
} from './ChartComponents';
