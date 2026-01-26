import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const ipoId = url.searchParams.get('ipo_id');

    if (!ipoId) {
        return new Response(JSON.stringify({ error: 'ipo_id is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const { data, error } = await supabase
            .from('ipo_comments')
            .select('*')
            .eq('ipo_id', parseInt(ipoId))
            .eq('is_approved', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching comments:', error);
            return new Response(JSON.stringify({ error: 'Failed to fetch comments' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ comments: data || [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('Error:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { ipo_id, user_name, comment_text, should_apply_vote } = body;

        if (!ipo_id || !user_name || !comment_text) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { data, error } = await supabase
            .from('ipo_comments')
            .insert({
                ipo_id,
                user_name,
                user_email: '', // Optional
                comment_text,
                should_apply_vote,
                is_approved: false, // Requires moderation
                upvotes: 0,
                downvotes: 0
            })
            .select()
            .single();

        if (error) {
            console.error('Error posting comment:', error);
            return new Response(JSON.stringify({ error: 'Failed to post comment' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Comment submitted for review',
            comment: data
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('Error:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
