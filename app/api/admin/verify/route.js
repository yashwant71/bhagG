export async function POST(request) {
    try {
        const { password } = await request.json();

        if (password === process.env.ADMIN_PASSWORD) {
            return Response.json({ success: true });
        } else {
            return Response.json({ success: false, error: 'Incorrect password' }, { status: 401 });
        }
    } catch (error) {
        return Response.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
