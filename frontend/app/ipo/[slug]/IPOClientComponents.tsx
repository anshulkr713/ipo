// app/ipo/[slug]/IPOClientComponents.tsx
'use client';

import { useState, useEffect } from 'react';
import { addComment } from '@/app/actions';
import styles from './page.module.css';

// --- 1. PROFIT CALCULATOR ---
export const ProfitCalculator = ({ gmp, lotSize, priceMax }: { gmp: number, lotSize: number, priceMax: number }) => {
    const [currentGmp, setCurrentGmp] = useState(gmp);

    // Fallback if priceMax is missing/zero to avoid division by zero
    const effectivePrice = priceMax || 1;

    const profit = currentGmp * lotSize;
    const investment = effectivePrice * lotSize;
    const returnPercent = ((profit / investment) * 100).toFixed(2);

    return (
        <section className={styles.calculatorSection}>
            <h2 className={styles.sectionTitle} style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
                <span className={styles.sectionIcon}>🧮</span> IPO Profit Calculator
            </h2>
            <div className={styles.calcGrid}>
                <div className={styles.calcInputGroup}>
                    <label>Current GMP (₹)</label>
                    <input
                        type="number"
                        className={styles.calcInput}
                        value={currentGmp}
                        onChange={(e) => setCurrentGmp(Number(e.target.value))}
                    />
                </div>
                <div className={styles.calcInputGroup}>
                    <label>Lot Size</label>
                    <input
                        type="text"
                        className={styles.calcInput}
                        value={`${lotSize} Shares`}
                        readOnly
                        style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
                    />
                </div>
                <div className={styles.calcResult}>
                    <span className={styles.calcResultLabel}>Est. Profit (1 Lot)</span>
                    <div className={styles.calcResultValue}>₹{profit.toLocaleString('en-IN')}</div>
                    <div className={styles.calcResultSub}>
                        Listing Gain: <span style={{ color: '#16a34a' }}>{returnPercent}%</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- 2. CHAT / DISCUSSION SYSTEM ---

// Helper to handle comments recursively
const SingleComment = ({ comment, ipoSlug, ipoId, isReply = false }: any) => {
    const [showReplyInput, setShowReplyInput] = useState(false);

    return (
        <div className={styles.commentItem} style={{ marginTop: isReply ? '1rem' : '0' }}>
            <div className={styles.avatar}>
                {comment.user_name ? comment.user_name.charAt(0).toUpperCase() : 'G'}
            </div>
            <div className={styles.commentContent}>
                <div className={styles.commentHeader}>
                    <span className={styles.authorName}>{comment.user_name}</span>
                    <span className={styles.commentDate}>
                        {new Date(comment.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                    </span>
                </div>
                <div className={styles.commentBody}>{comment.comment_text}</div>

                <div className={styles.commentFooter}>
                    <button
                        className={styles.actionBtn}
                        onClick={() => setShowReplyInput(!showReplyInput)}
                    >
                        Reply
                    </button>
                </div>

                {/* Reply Input */}
                {showReplyInput && (
                    <div className={styles.replyInputWrapper}>
                        <form
                            action={async (formData) => {
                                await addComment(formData);
                                setShowReplyInput(false);
                            }}
                            className={styles.replyForm}
                        >
                            <input type="hidden" name="ipoSlug" value={ipoSlug} />
                            <input type="hidden" name="ipoId" value={ipoId} />
                            <input type="hidden" name="parentId" value={comment.id} />

                            <input
                                name="content"
                                className={styles.commentInput}
                                placeholder="Write a reply..."
                                required
                                autoFocus
                            />
                            <div className={styles.commentActions}>
                                <button type="button" className={styles.btnSecondary} onClick={() => setShowReplyInput(false)}>Cancel</button>
                                <button type="submit" className={styles.btnPrimary}>Reply</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Recursively render replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div className={styles.repliesContainer}>
                        {comment.replies.map((reply: any) => (
                            <SingleComment
                                key={reply.id}
                                comment={reply}
                                ipoSlug={ipoSlug}
                                ipoId={ipoId}
                                isReply={true}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const DiscussionSection = ({ comments, ipoSlug, ipoId }: { comments: any[], ipoSlug: string, ipoId: string }) => {
    // 1. Convert flat list to tree structure for nested comments
    // Note: This logic assumes comments are fetched sorted by created_at asc or desc
    const buildTree = (list: any[]) => {
        const map = new Map();
        const roots: any[] = [];

        // Initialize map
        list.forEach((item, i) => {
            map.set(item.id, { ...item, replies: [] });
        });

        // Connect parents and children
        list.forEach((item) => {
            if (item.parent_id) {
                const parent = map.get(item.parent_id);
                if (parent) {
                    parent.replies.push(map.get(item.id));
                }
            } else {
                roots.push(map.get(item.id));
            }
        });

        return roots.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    };

    const commentTree = buildTree(comments);

    return (
        <section className={styles.section} id="discussion">
            <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>💬</span> Investor Discussion
                <span className={styles.commentCount}>({comments.length})</span>
            </h2>

            <div className={styles.commentInputArea}>
                <div className={styles.avatar}>You</div>
                <div className={styles.inputWrapper}>
                    <form action={addComment}>
                        <input type="hidden" name="ipoSlug" value={ipoSlug} />
                        <input type="hidden" name="ipoId" value={ipoId} />
                        <input
                            name="content"
                            className={styles.commentInput}
                            placeholder="Ask a question or share your view..."
                            required
                        />
                        <div className={styles.commentActions}>
                            <button type="submit" className={styles.btnPrimary}>Post Comment</button>
                        </div>
                    </form>
                </div>
            </div>

            <div className={styles.commentList}>
                {commentTree.length === 0 ? (
                    <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No comments yet. Be the first to start the discussion!</p>
                ) : (
                    commentTree.map((comment) => (
                        <SingleComment
                            key={comment.id}
                            comment={comment}
                            ipoSlug={ipoSlug}
                            ipoId={ipoId}
                        />
                    ))
                )}
            </div>
        </section>
    );
};

// --- 3. STICKY FOOTER ---
export const StickyFooter = ({ companyName, status }: { companyName: string, status: string }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsVisible(window.scrollY > 600);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className={`${styles.stickyFooter} ${isVisible ? styles.visible : ''}`}>
            <div className={styles.footerContent}>
                <div className={styles.footerInfo}>
                    <span className={styles.footerTitle}>{companyName} IPO</span>
                    <span className={`${styles.footerStatus} ${status === 'open' ? styles.statusOpenText : ''}`}>
                        {status.toUpperCase()}
                    </span>
                </div>
                <div className={styles.footerActions}>
                    <button className={`${styles.footerButton} ${styles.alertBtn}`}>🔔 Alert</button>
                    <button className={`${styles.footerButton} ${styles.applyBtn}`}>Apply Now</button>
                </div>
            </div>
        </div>
    );
};