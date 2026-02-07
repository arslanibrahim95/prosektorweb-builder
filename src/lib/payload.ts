import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * Gets the Payload instance for server-side usage.
 */
export async function getPayloadInstance() {
    return await getPayload({
        config,
    })
}
