'use client';

import styles from './IPOFilters.module.css';

interface IPOFiltersProps {
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
}

export default function IPOFilters({ selectedCategory, onCategoryChange }: IPOFiltersProps) {
    const categories = [
        { id: 'all', label: 'All IPOs', icon: '📊' },
        { id: 'Mainboard', label: 'Mainboard', icon: '🏢' },
        { id: 'SME', label: 'SME', icon: '🏪' }
    ];

    const sortOptions = [
        { id: 'date', label: 'By Date' },
        { id: 'gmp', label: 'By GMP' },
        { id: 'subscription', label: 'By Subscription' }
    ];

    return (
        <div className={styles.container}>
            <div className={styles.categoryFilters}>
                {categories.map(category => (
                    <button
                        key={category.id}
                        className={`${styles.filterButton} ${selectedCategory === category.id ? styles.active : ''}`}
                        onClick={() => onCategoryChange(category.id)}
                    >
                        <span className={styles.icon}>{category.icon}</span>
                        <span>{category.label}</span>
                    </button>
                ))}
            </div>

            <div className={styles.sortSection}>
                <label className={styles.sortLabel}>Sort by:</label>
                <select className={styles.sortSelect}>
                    {sortOptions.map(option => (
                        <option key={option.id} value={option.id}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
