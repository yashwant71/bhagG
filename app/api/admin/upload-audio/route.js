import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('Cloudinary environment variables are missing!');
}

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const password = formData.get('password');

        if (password !== process.env.ADMIN_PASSWORD) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 });
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to cloudinary
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'auto',
                    folder: 'gita-audio',
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        resolve(Response.json({ error: 'Upload to Cloudinary failed' }, { status: 500 }));
                    } else {
                        resolve(Response.json({ url: result.secure_url }));
                    }
                }
            );

            uploadStream.end(buffer);
        });
    } catch (error) {
        console.error('Upload error:', error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
