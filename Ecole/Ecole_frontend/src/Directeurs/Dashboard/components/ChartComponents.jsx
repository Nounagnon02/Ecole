/**
 * ChartComponents - Composants de graphiques réutilisables
 */
import React from 'react';
import {
    PieChart, Pie, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';

// Graphique en ligne pour l'évolution des effectifs
export const EffectifsLineChart = ({ data }) => (
    <div className="card">
        <h4 style={{ marginBottom: '1rem', fontWeight: '600' }}>
            Évolution des effectifs
        </h4>
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" />
                <Tooltip
                    contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: 'var(--shadow-md)'
                    }}
                />
                <Line
                    type="monotone"
                    dataKey="students"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    activeDot={{ r: 8 }}
                />
            </LineChart>
        </ResponsiveContainer>
    </div>
);

// Graphique en camembert pour la répartition des notes
export const GradesPieChart = ({ data }) => {
    const COLORS = [
        'var(--primary-light)',
        'var(--secondary-3)',
        'var(--secondary-2)',
        'var(--primary)'
    ];

    return (
        <div className="card">
            <h4 style={{ marginBottom: '1rem', fontWeight: '600' }}>
                Répartition des notes
            </h4>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: 'var(--shadow-md)'
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

// Graphique en barres pour la présence
export const AttendanceBarChart = ({ data }) => (
    <div className="chart-card">
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="présent" fill="#60a5fa" />
                <Bar dataKey="absent" fill="#f87171" />
            </BarChart>
        </ResponsiveContainer>
    </div>
);

// Export par défaut pour compatibilité
export default {
    EffectifsLineChart,
    GradesPieChart,
    AttendanceBarChart
};
