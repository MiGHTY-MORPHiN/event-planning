import React from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// More meaningful, event-planning specific data
const monthlyFinancials = [
  { month: 'April', budget: 15000, spending: 12500 },
  { month: 'May', budget: 20000, spending: 21500 },
  { month: 'June', budget: 18000, spending: 16000 },
  { month: 'July', budget: 25000, spending: 24500 },
  { month: 'August', budget: 22000, spending: 23000 },
];

const newEventsData = [
    { month: 'April', newEvents: 4 },
    { month: 'May', newEvents: 3 },
    { month: 'June', newEvents: 7 },
    { month: 'July', newEvents: 5 },
    { month: 'August', newEvents: 9 },
];

const guestRsvpData = [
  { name: 'Attending', value: 125 },
  { name: 'Pending', value: 45 },
  { name: 'Not Attending', value: 15 },
  { name: 'Maybe', value: 10 },
];

const COLORS = ['#2e7d32', '#ff6d00', '#d50000', '#2962ff'];

function Reports() {
  return (
    <main className='main-container'>

      <div className='charts'>
        {/* Chart 1: Monthly Financial Overview */}
        <div className="chart-container">
          <h4>Monthly Financials (Budget vs. Spending)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyFinancials} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="budget" fill="#8884d8" name="Budgeted Amount" />
              <Bar dataKey="spending" fill="#82ca9d" name="Actual Spending" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: New Event Creation Trend */}
        <div className="chart-container">
            <h4>New Event Creation Trend</h4>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={newEventsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="newEvents" stroke="#ff6d00" strokeWidth={2} name="New Events Created" />
                </LineChart>
            </ResponsiveContainer>
        </div>

        {/* Chart 3: Guest RSVP Status Breakdown */}
        <div className="chart-container">
            <h4>Guest RSVP Status (Tech Conference)</h4>
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie
                        data={guestRsvpData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {guestRsvpData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
        
        {/* Placeholder for another chart */}
        <div className="chart-container">
            <h4>Upcoming Feature</h4>
            <div className="placeholder-chart">
                <p>More reports coming soon...</p>
            </div>
        </div>

      </div>
    </main>
  );
}

export default Reports;
