// app/actions.ts
'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function addComment(formData: FormData) {
    const ipoSlug = formData.get('ipoSlug') as string;
    const ipoId = formData.get('ipoId') as string;
    const content = formData.get('content') as string;
    const parentId = formData.get('parentId') as string | null;

    // Basic Validation
    if (!content || !ipoId || !ipoSlug) {
        console.error("Missing required fields for comment");
        return;
    }

    try {
        const { error } = await supabase
            .from('ipo_comments')
            .insert({
                ipo_id: parseInt(ipoId),
                user_name: 'Guest Investor', // Hardcoded for now (or fetch from Auth session)
                user_email: 'guest@example.com',
                comment_text: content,
                parent_id: parentId ? parseInt(parentId) : null,
            });

        if (error) {
            console.error("Database Error: Failed to create comment:", error);
            return;
        }

        // This tells Next.js to re-fetch the data for this IPO page
        // so the new comment appears immediately without a full page reload.
        revalidatePath(`/ipo/${ipoSlug}`);

    } catch (error) {
        console.error("Database Error: Failed to create comment:", error);
    }
}