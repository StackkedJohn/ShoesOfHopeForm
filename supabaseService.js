require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

class SupabaseService {
    constructor() {
        this.supabase = null;
        this.configured = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
        if (!this.configured) {
            console.warn('Supabase not configured - submissions will only be saved locally');
        }
    }

    getClient() {
        if (!this.configured) {
            throw new Error('Supabase is not configured');
        }
        if (!this.supabase) {
            this.supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_SERVICE_KEY,
                {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                    },
                },
            );
        }
        return this.supabase;
    }

    /**
     * Insert a Shoes of Hope registration into the shared `submissions` table.
     * request_type is hard-coded to 'Shoes of Hope'.
     * NOT NULL columns required by the table are populated with reasonable
     * fall-backs (NULL-safe placeholders for fields that don't apply to SOH).
     */
    async insertSubmission(data) {
        if (!this.configured) {
            return { success: false, error: 'Supabase not configured' };
        }

        try {
            const client = this.getClient();

            const childLastInitial = (data.childLastInitial || '').slice(0, 1).toUpperCase() || null;

            const commentParts = [];
            if (data.specialtyShoeNotes && String(data.specialtyShoeNotes).trim()) {
                commentParts.push('Specialty shoe needs: ' + String(data.specialtyShoeNotes).trim());
            }
            if (data.shoesOfHopeComments && String(data.shoesOfHopeComments).trim()) {
                commentParts.push(String(data.shoesOfHopeComments).trim());
            }
            const combinedComments = commentParts.length ? commentParts.join('\n\n') : null;

            const submission = {
                // System
                submission_id: data.submissionId,
                request_type: 'Shoes of Hope',

                // Relationship
                relationship: data.relationship || null,

                // Caregiver
                caregiver_first_name: data.caregiverFirstName || null,
                caregiver_last_name: data.caregiverLastName || null,
                caregiver_email: data.caregiverEmail || null,
                caregiver_phone: data.caregiverPhone || null,
                caregiver_street: data.caregiverStreet || null,
                caregiver_city: data.caregiverCity || null,
                caregiver_state: data.caregiverState || null,
                caregiver_zip: data.caregiverZip || null,
                caregiver_county: data.caregiverCounty || null,

                // Foster status
                is_licensed_foster: data.isLicensedFoster || null,

                // Social worker
                has_social_worker_info: data.hasSocialWorker || null,
                social_worker_first_name: data.swFirstName || null,
                social_worker_last_name: data.swLastName || null,
                social_worker_email: data.swEmail || null,
                social_worker_phone: data.swPhone || null,
                social_worker_county: data.swCounty || null,

                // Event location — caregiver picks Gaston or Rutherford
                completion_contact: 'Caregiver',
                pickup_location: data.eventLocation || 'TBD',

                // Child
                child_first_name: data.childFirstName || null,
                child_last_initial: childLastInitial,
                child_last_name: childLastInitial, // schema requires this; we only collect initial
                child_age: data.childAge || null,
                child_gender: data.childGender || null,
                child_placement_type: data.childPlacementType || null,
                child_custody_county: data.childCustodyCounty || null,

                // Shoes of Hope sizes
                child_grade_fall: data.childGradeFall || null,
                shoe_gender: data.shoeGender || null,
                girl_shoe_size: data.girlShoeSize || null,
                boy_shoe_size: data.boyShoeSize || null,
                underwear_gender: data.underwearGender || null,
                girls_underwear_size: data.girlsUnderwearSize || null,
                boys_underwear_size: data.boysUnderwearSize || null,
                shoes_of_hope_comments: combinedComments,

                // Consent
                agree_to_terms: data.agreeToTerms === true || data.agreeToTerms === 'true' || data.agreeToTerms === 'on',

                // Sync metadata
                sync_status: 'synced',
                last_synced_at: new Date().toISOString(),
            };

            const { data: insertedData, error } = await client
                .from('submissions')
                .insert([submission])
                .select()
                .single();

            if (error) {
                console.error('Supabase insert error:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data: insertedData };
        } catch (error) {
            console.error('Supabase service error:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new SupabaseService();
