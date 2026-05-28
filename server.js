require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const supabaseService = require('./supabaseService');
const { sendConfirmationEmail } = require('./api/sendConfirmation');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(__dirname));

const submissionsDir = path.join(__dirname, 'submissions');
if (!fs.existsSync(submissionsDir)) {
    fs.mkdirSync(submissionsDir, { recursive: true });
}

// Match the client-side format: SOH-YYYYMMDD-HHMMSS-xxxx
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
        'caregiverStreet', 'caregiverCity', 'caregiverState', 'caregiverZip',
        'childFirstName', 'childLastName', 'childDob', 'childAge', 'childGender', 'childGradeFall',
        'childPlacementType', 'childEthnicity', 'childCustodyCounty',
        'shoeGender', 'underwearGender',
        'hasSocialWorker', 'agreeToTerms',
    ];

    // Caregiver phone (or alternative if no mobile)
    if (formData.noMobileNumber === 'Yes') required.push('alternativePhone');
    else required.push('caregiverPhone');

    // Caregiver email: direct when relationship is Caregiver, else gated by knowCaregiverEmail
    if (formData.relationship === 'Caregiver') {
        required.push('caregiverEmail');
    } else {
        required.push('knowCaregiverEmail');
        if (formData.knowCaregiverEmail === 'yes') required.push('caregiverEmail');
    }

    // Relationship = Other → secondary type + person completing the form
    if (formData.relationship === 'Other') {
        required.push('relationshipOtherType',
            'personCompletingFirstName', 'personCompletingLastName',
            'personCompletingTextable', 'personCompletingEmail');
        if (formData.personCompletingTextable === 'No') required.push('personCompletingAltPhone');
        else required.push('personCompletingPhone');
        if (formData.relationshipOtherType === 'Other') required.push('relationshipOtherCustom');
    }

    // Licensed foster → licensing agency
    if (formData.isLicensedFoster === 'Yes') required.push('licensingAgency');

    // Conditional shoe / underwear size by gender
    if (formData.shoeGender === 'Girl') required.push('girlShoeSize');
    if (formData.shoeGender === 'Boy') required.push('boyShoeSize');
    if (formData.underwearGender === 'Girl') required.push('girlsUnderwearSize');
    if (formData.underwearGender === 'Boy') required.push('boysUnderwearSize');

    // Conditional social worker
    if (formData.hasSocialWorker === 'Yes') {
        required.push('swFirstName', 'swLastName', 'swEmail', 'socialWorkerCanText', 'socialWorkerCounty');
        if (formData.noSocialWorkerMobileNumber === 'Yes') required.push('alternativeSocialWorkerPhone');
        else required.push('swPhone');
        if (['Other', 'Other, XX', 'Unknown, XX'].includes(formData.socialWorkerCounty)) {
            required.push('socialWorkerCountyOther');
        }
    }

    const missing = required.filter((f) => {
        const v = formData[f];
        if (v === true) return false;
        return v === undefined || v === null || String(v).trim() === '';
    });

    return missing;
}

app.post('/api/submit', async (req, res) => {
    try {
        const formData = req.body || {};

        const missingFields = validate(formData);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`,
                missingFields,
            });
        }

        // Trust client-supplied submission ID if it matches the expected format, else mint one.
        const submissionIdPattern = /^SOH-\d{8}-\d{6}-[a-z0-9]{2,8}$/;
        const submissionId = submissionIdPattern.test(String(formData.submissionId || ''))
            ? formData.submissionId
            : generateSubmissionId();

        const submission = {
            submissionId,
            timestamp: new Date().toISOString(),
            ...formData,
            submissionId,
        };

        // JSON backup (best-effort; ignored on read-only environments like Vercel functions)
        try {
            const filepath = path.join(submissionsDir, `${submissionId}.json`);
            fs.writeFileSync(filepath, JSON.stringify(submission, null, 2));
        } catch (fsErr) {
            console.warn('Local backup skipped:', fsErr.message);
        }

        // Insert into Supabase (non-blocking)
        let supabaseResult = null;
        try {
            supabaseResult = await supabaseService.insertSubmission({
                submissionId,
                ...formData,
            });
            if (!supabaseResult.success) {
                console.error('Supabase insert failed:', supabaseResult.error);
            }
        } catch (supabaseError) {
            console.error('Supabase error (non-blocking):', supabaseError.message);
        }

        // Confirmation email (non-blocking)
        let emailResult = null;
        try {
            emailResult = await sendConfirmationEmail({
                to: formData.caregiverEmail || formData.personCompletingEmail,
                caregiverFirstName: formData.caregiverFirstName || formData.personCompletingFirstName,
                childFirstName: formData.childFirstName,
                eventLocation: formData.eventLocation,
                submissionId,
            });
        } catch (emailError) {
            console.error('Confirmation email error (non-blocking):', emailError.message);
        }

        res.status(200).json({
            success: true,
            message: 'Registration submitted successfully',
            submissionId,
            supabaseSubmitted: supabaseResult?.success || false,
            supabaseId: supabaseResult?.data?.id || null,
            emailSent: emailResult?.success || false,
        });
    } catch (error) {
        console.error('Error processing form submission:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process form submission',
            error: error.message,
        });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Shoes of Hope Form server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
