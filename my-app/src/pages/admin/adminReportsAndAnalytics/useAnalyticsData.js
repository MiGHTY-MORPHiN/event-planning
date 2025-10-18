import { useState, useEffect } from "react";
import { auth } from "../../../firebase";
import BASE_URL from "../../../apiConfig";

const getToken = () =>
    auth.currentUser
        ? auth.currentUser.getIdToken()
        : Promise.reject("Not logged in");

export const useAnalyticsData = () => {
    const [platformSummary, setPlatformSummary] = useState(null);
    const [monthlyFinancials, setMonthlyFinancials] = useState([]);
    const [newEventsData, setNewEventsData] = useState([]);
    const [vendorCategoryData, setVendorCategoryData] = useState([]);
    const [eventCategoryData, setEventCategoryData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOnTheFlyReports = async () => {
            try {
                const token = await getToken();
                const [summaryRes, eventsRes] = await Promise.all([
                    fetch(`${BASE_URL}/admin/analytics/platform-summary`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`${BASE_URL}/admin/events`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);

                if (!summaryRes.ok) throw new Error(`Failed to fetch summary: ${summaryRes.statusText}`);
                if (!eventsRes.ok) throw new Error(`Failed to fetch events: ${eventsRes.statusText}`);

                const summaryData = await summaryRes.json();
                const eventsData = await eventsRes.json();
                const allEvents = eventsData.events || [];

                setPlatformSummary(summaryData);

                if (summaryData.vendorInsights?.popularCategories) {
                    setVendorCategoryData(summaryData.vendorInsights.popularCategories.slice(0, 8));
                }
                if (summaryData.eventInsights?.categoryPopularity) {
                    setEventCategoryData(summaryData.eventInsights.categoryPopularity.slice(0, 8));
                }

                const today = new Date();
                const allEventDates = allEvents.map((e) => new Date(e.date)).filter((d) => !isNaN(d.getTime()));
                const minDate = allEventDates.length > 0 ? new Date(Math.min(...allEventDates)) : new Date(today.getFullYear() - 1, today.getMonth(), 1);
                const maxDate = allEventDates.length > 0 ? new Date(Math.max(...allEventDates)) : today;

                const financialsMap = {};
                for (let d = new Date(minDate); d <= maxDate; d.setMonth(d.getMonth() + 1)) {
                    const monthName = d.toLocaleString("default", { year: "2-digit", month: "short" });
                    financialsMap[monthName] = { month: monthName, budget: 0, spending: 0, newEvents: 0 };
                }

                allEvents.forEach((event) => {
                    const eventDate = new Date(event.date);
                    if (isNaN(eventDate.getTime())) return;
                    const monthName = eventDate.toLocaleString("default", { year: "2-digit", month: "short" });
                    if (financialsMap[monthName]) {
                        financialsMap[monthName].budget += Number(event.budget) || 0;
                        financialsMap[monthName].spending += (Number(event.budget) || 0) * 0.7;
                        financialsMap[monthName].newEvents += 1;
                    }
                });

                const sortedFinancials = Object.values(financialsMap).sort((a, b) => new Date(`01 ${a.month}`) - new Date(`01 ${b.month}`));

                setMonthlyFinancials(sortedFinancials);
                setNewEventsData(sortedFinancials.map(({ month, newEvents }) => ({ month, newEvents })));

            } catch (err) {
                console.error("Error fetching reports:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOnTheFlyReports();
    }, []);

    return { platformSummary, monthlyFinancials, newEventsData, vendorCategoryData, eventCategoryData, isLoading, error };
};