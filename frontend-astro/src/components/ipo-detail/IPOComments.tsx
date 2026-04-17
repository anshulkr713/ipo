'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import styles from './IPOComments.module.css';

// Client-side Supabase instance for comments
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Comment {
    id: number;
    ipo_id: number;
    user_name: string;
    comment_text: string;
    should_apply_vote?: 'Yes' | 'No';
    is_approved?: boolean;
    upvotes?: number;
    downvotes?: number;
    created_at?: string;
    parent_id?: number;
    replies?: Comment[];
}

interface Props {
    ipoId: number;
    ipoName: string;
}

export function IPOCommentsSection({ ipoId, ipoName }: Props) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [userName, setUserName] = useState('');
    const [vote, setVote] = useState<'Yes' | 'No' | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Fetch comments on mount
    useEffect(() => {
        fetchComments();
    }, [ipoId]);

    const fetchComments = async () => {
        try {
            const { data, error } = await supabase
                .from('ipo_comments')
                .select('*')
                .eq('ipo_id', ipoId)
                .eq('is_approved', true)
                .order('created_at', { ascending: false });

            if (!error) {
                setComments(data || []);
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !userName.trim()) return;

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('ipo_comments')
                .insert({
                    ipo_id: ipoId,
                    user_name: userName,
                    user_email: '',
                    comment_text: newComment,
                    should_apply_vote: vote,
                    is_approved: false,
                    upvotes: 0,
                    downvotes: 0
                });

            if (!error) {
                setNewComment('');
                setVote(null);
                setShowForm(false);
                fetchComments();
            }
        } catch (error) {
            console.error('Error posting comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate vote stats
    const yesVotes = comments.filter(c => c.should_apply_vote === 'Yes').length;
    const noVotes = comments.filter(c => c.should_apply_vote === 'No').length;
    const totalVotes = yesVotes + noVotes;

    return (
        <div className={styles.commentsSection}>
            <div className={styles.commentsHeader}>
                <h3>💬 IPO Discussion ({comments.length})</h3>
                <button
                    className={styles.addCommentBtn}
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? '✕ Cancel' : '+ Add Comment'}
                </button>
            </div>

            {/* Voting Stats */}
            {totalVotes > 0 && (
                <div className={styles.votingStats}>
                    <div className={styles.voteQuestion}>Should you apply for {ipoName}?</div>
                    <div className={styles.voteBar}>
                        <div
                            className={styles.voteYes}
                            style={{ width: `${(yesVotes / totalVotes) * 100}%` }}
                        >
                            👍 Yes ({yesVotes})
                        </div>
                        <div
                            className={styles.voteNo}
                            style={{ width: `${(noVotes / totalVotes) * 100}%` }}
                        >
                            👎 No ({noVotes})
                        </div>
                    </div>
                    <div className={styles.voteCount}>{totalVotes} votes</div>
                </div>
            )}

            {/* New Comment Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className={styles.commentForm}>
                    <input
                        type="text"
                        placeholder="Your Name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className={styles.nameInput}
                        required
                    />
                    <textarea
                        placeholder={`Share your thoughts on ${ipoName}...`}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className={styles.commentInput}
                        rows={4}
                        required
                    />
                    <div className={styles.voteOptions}>
                        <span>Should apply?</span>
                        <label className={`${styles.voteOption} ${vote === 'Yes' ? styles.selected : ''}`}>
                            <input
                                type="radio"
                                name="vote"
                                value="Yes"
                                checked={vote === 'Yes'}
                                onChange={() => setVote('Yes')}
                            />
                            👍 Yes
                        </label>
                        <label className={`${styles.voteOption} ${vote === 'No' ? styles.selected : ''}`}>
                            <input
                                type="radio"
                                name="vote"
                                value="No"
                                checked={vote === 'No'}
                                onChange={() => setVote('No')}
                            />
                            👎 No
                        </label>
                    </div>
                    <button
                        type="submit"
                        disabled={submitting}
                        className={styles.submitBtn}
                    >
                        {submitting ? 'Posting...' : 'Post Comment'}
                    </button>
                </form>
            )}

            {/* Comments List */}
            <div className={styles.commentsList}>
                {loading ? (
                    <div className={styles.loading}>Loading comments...</div>
                ) : comments.length === 0 ? (
                    <div className={styles.noComments}>
                        <p>No comments yet. Be the first to share your thoughts!</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className={styles.commentCard}>
                            <div className={styles.commentHeader}>
                                <span className={styles.userName}>{comment.user_name}</span>
                                {comment.should_apply_vote && (
                                    <span className={`${styles.voteBadge} ${comment.should_apply_vote === 'Yes' ? styles.yes : styles.no}`}>
                                        {comment.should_apply_vote === 'Yes' ? '👍 Apply' : '👎 Skip'}
                                    </span>
                                )}
                                <span className={styles.timestamp}>{formatDate(comment.created_at)}</span>
                            </div>
                            <p className={styles.commentText}>{comment.comment_text}</p>
                            <div className={styles.commentActions}>
                                <button className={styles.actionBtn}>
                                    👍 {comment.upvotes || 0}
                                </button>
                                <button className={styles.actionBtn}>
                                    👎 {comment.downvotes || 0}
                                </button>
                                <button className={styles.actionBtn}>
                                    💬 Reply
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
