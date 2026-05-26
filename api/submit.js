// Vercel serverless function entrypoint for the Shoes of Hope form.
// Mirrors the validation in server.js so a hosted deploy on Vercel
// uses the same logic as the local Express server.

const supabaseService = require('../supabaseService');
const { sendConfirmationEmail } = require('./sendConfirmation');

function generateSubmissionId() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const d = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const t = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const rand = Math.random().toString(36).substring(2, 6);
    return `SOH-${d}-${t}-${rand}`;
}

function validate(formData) {
    const required = [
        'eventLocation',
        'relationship', 'isLicensedFoster',
        'caregiverFirstName', 'caregiverLastName',
        'caregiverEmail', 'caregiverPhone',
        'caregiverStreet', 'caregiverCity', 'caregiverState', 'caregiverZip', 'caregiverCounty',
        'childFirstName', 'childLastInitial', 'childAge', 'childGender', 'childGradeFall',
        'childPlacementType', 'childCustodyCounty',
        'shoeGender', 'underwearGender',
        'hasSocialWorker', 'agreeToTerms',
    ];

    if (formData.shoeGender === 'Girl') required.push('girlShoeSize');
    if (formData.shoeGender === 'Boy') required.push('boyShoeSize');
    if (formData.underwearGender === 'Girl') required.push('girlsUnderwearSize');
    if (formData.underwearGender === 'Boy') required.push('boysUnderwearSize');
    if (formData.hasSocialWorker === 'Yes') {
        required.push('swFirstName', 'swLastName', 'swEmail', 'swCounty');
    }

    return required.filter((f) => {
        const v = formData[f];
        if (v === true) return false;
        return v === undefined || v === null || String(v).trim() === '';
    });
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date',
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const formData = req.body || {};

        const missing = validate(formData);
        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missing.join(', ')}`,
                missingFields: missing,
            });
        }

        const submissionIdPattern = /^SOH-\d{8}-\d{6}-[a-z0-9]{2,8}$/;
        const submissionId = submissionIdPattern.test(String(formData.submissionId || ''))
            ? formData.submissionId
            : generateSubmissionId();

        let supabaseResult = null;
        try {
            supabaseResult = await supabaseService.insertSubmission({
                submissionId,
                ...formData,
            });
        } catch (supabaseError) {
            console.error('Supabase error (non-blocking):', supabaseError.message);
        }

        let emailResult = null;
        try {
            emailResult = await sendConfirmationEmail({
                to: formData.caregiverEmail,
                caregiverFirstName: formData.caregiverFirstName,
                childFirstName: formData.childFirstName,
                submissionId,
            });
        } catch (emailError) {
            console.error('Confirmation email error (non-blocking):', emailError.message);
        }

        return res.status(200).json({
            success: true,
            message: 'Registration submitted successfully',
            submissionId,
            supabaseSubmitted: supabaseResult?.success || false,
            supabaseId: supabaseResult?.data?.id || null,
            emailSent: emailResult?.success || false,
        });
    } catch (error) {
        console.error('Error processing form submission:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process form submission',
            error: error.message,
        });
    }
};
