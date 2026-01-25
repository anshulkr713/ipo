'use client';

import { useState, useEffect } from 'react';

import styles from './IPOCalendarWidget.module.css';
import { fetchCalendarEvents } from '../../lib/api';

export default function IPOCalendarWidget() {
    const [currentDate, setCurrentDate] = useState<Date | null>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Initialize date on client-side only to avoid hydration mismatch
    useEffect(() => {
        setCurrentDate(new Date());
        setMounted(true);
    }, []);

    useEffect(() => {
        if (currentDate) {
            loadEvents();
        }
    }, [currentDate]);

    async function loadEvents() {
        if (!currentDate) return;
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const data = await fetchCalendarEvents(year, month);
        setEvents(data);
        setLoading(false);
    }

    // Don't render until we're mounted on client
    if (!mounted || !currentDate) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading calendar...</div>
            </div>
        );
    }

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek };
    };

    const getEventsForDay = (day: number) => {
        const dateStr = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day
        ).toISOString().split('T')[0];

        return events.filter(event => event.event_date === dateStr);
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: startingDayOfWeek }, (_, i) => i);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button
                    className={styles.navButton}
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                >
                    ←
                </button>
                <h3 className={styles.monthYear}>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <button
                    className={styles.navButton}
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                >
                    →
                </button>
            </div>

            <div className={styles.calendar}>
                <div className={styles.weekdays}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className={styles.weekday}>{day}</div>
                    ))}
                </div>

                <div className={styles.days}>
                    {blanks.map(i => (
                        <div key={`blank-${i}`} className={styles.blankDay} />
                    ))}
                    {days.map(day => {
                        const dayEvents = getEventsForDay(day);
                        const hasEvents = dayEvents.length > 0;
                        const today = new Date();
                        const isToday =
                            day === today.getDate() &&
                            currentDate.getMonth() === today.getMonth() &&
                            currentDate.getFullYear() === today.getFullYear();

                        return (
                            <div
                                key={day}
                                className={`${styles.day} ${hasEvents ? styles.hasEvents : ''} ${isToday ? styles.today : ''}`}
                                title={hasEvents ? dayEvents.map(e => e.event_title).join(', ') : ''}
                            >
                                <span className={styles.dayNumber}>{day}</span>
                                {hasEvents && (
                                    <div className={styles.eventDots}>
                                        {dayEvents.slice(0, 3).map((event, i) => (
                                            <div key={i} className={styles.eventDot} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {events.length > 0 && (
                <div className={styles.upcomingEvents}>
                    <h4 className={styles.eventsTitle}>Upcoming Events</h4>
                    <div className={styles.eventsList}>
                        {events.slice(0, 5).map((event, i) => (
                            <a
                                key={i}
                                href={`/ipo/${event.ipos?.slug || '#'}`}
                                className={styles.eventItem}
                            >
                                <span className={styles.eventDate}>
                                    {new Date(event.event_date).getDate()}
                                </span>
                                <div className={styles.eventInfo}>
                                    <span className={styles.eventTitle}>{event.event_title}</span>
                                    <span className={styles.eventType}>{event.event_type}</span>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
