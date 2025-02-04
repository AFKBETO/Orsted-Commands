export const config = {
    environment: Deno.env.get('ENVIRONMENT') || 'development',
    mongo_uri: Deno.env.get('MONGO_URI') || '',
};
