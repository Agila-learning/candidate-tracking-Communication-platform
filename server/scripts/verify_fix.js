const { cloudinary } = require('../config/cloudinary');
const fs = require('fs');

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('server/scripts/verify_fix_result.txt', msg + '\n');
};

const main = async () => {
    fs.writeFileSync('server/scripts/verify_fix_result.txt', '');
    log('--- Verifying Fix Logic ---');

    // 1. Simulate an Announcement Object with a known valid URL (from previous tests)
    // We know this file exists and check if our new logic generates a 200 OK URL.
    // Note: The "valid" URL from previous tests was:
    // https://res.cloudinary.com/ddqojav6v/raw/authenticated/s--5BiEpuHX--/v1771260890/fic_announcements_new/interview_notes_260216_202403_1771260889054.pdf
    // But that one had a different signature because it didn't have flags.

    // Let's use the UPLOAD test file because we have full control and know it works with version.
    // But first we need to upload a NEW file to be sure we are testing the "happy path".

    try {
        const timestamp = Date.now();
        const publicId = `verify_fix_${timestamp}.txt`;
        const content = "Verification Content";
        const base64Content = Buffer.from(content).toString('base64');
        const dataUri = `data:text/plain;base64,${base64Content}`;

        log(`Uploading verification file: ${publicId}`);

        const result = await cloudinary.uploader.upload(dataUri, {
            resource_type: 'raw',
            type: 'authenticated',
            public_id: publicId,
        });

        const uploadedPublicId = result.public_id;
        const uploadedVersion = result.version;
        // The URL stored in DB would look like this (standard upload response url):
        const dbStoredUrl = result.secure_url;

        log(`Uploaded! storedUrl: ${dbStoredUrl}`);

        // --- SIMULATE ROUTE LOGIC ---
        const annObj = {
            attachmentPublicId: uploadedPublicId,
            attachmentUrl: dbStoredUrl,
            attachmentName: 'verify.txt'
        };

        const isRawUrl = annObj.attachmentUrl && annObj.attachmentUrl.includes('/raw/');
        const isDoc = annObj.attachmentName && annObj.attachmentName.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv)$/i);
        const isRaw = isRawUrl || isDoc;

        // Extract version (The FIX)
        const versionMatch = annObj.attachmentUrl && annObj.attachmentUrl.match(/\/v(\d+)\//);
        const version = versionMatch ? versionMatch[1] : undefined;

        log(`Extracted Version: ${version}`);

        const generatedUrl = cloudinary.url(annObj.attachmentPublicId, {
            resource_type: isRaw ? 'raw' : 'image',
            type: isRaw ? 'authenticated' : 'upload',
            sign_url: true,
            secure: true,
            flags: 'attachment',
            version: version
        });

        log(`Generated URL: ${generatedUrl}`);

        // Verify Access
        log('Checking access...');
        try {
            const res = await fetch(generatedUrl, { method: 'HEAD' });
            log(`Status: ${res.status} ${res.statusText}`);
            if (res.status === 200) {
                log('SUCCESS: Fix verified!');
            } else {
                log('FAILURE: Still getting error.');
            }
        } catch (e) {
            log('Error fetching: ' + e.message);
        }

        // Cleanup
        await cloudinary.uploader.destroy(uploadedPublicId, { resource_type: 'raw', type: 'authenticated' });
        log('Cleanup done.');

    } catch (e) {
        log('Verification Failed: ' + e.message);
    }
};

main();
