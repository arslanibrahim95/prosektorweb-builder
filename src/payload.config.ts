import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { Users } from './collections/Users'
import { Projects } from './collections/Projects'
import { Pages } from './collections/Pages'
import { Media } from './collections/Media'
import { Services } from './collections/Services'
import { JobApplications } from './collections/JobApplications'
import { ContactSubmissions } from './collections/ContactSubmissions'
import { QuoteRequests } from './collections/QuoteRequests'
import { Customers } from './collections/Customers'
import { ClientDocuments } from './collections/ClientDocuments'
import { AnalyticsEvents } from './collections/AnalyticsEvents'
import { BlogPosts } from './collections/BlogPosts'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
    admin: {
        user: Users.slug,
        importMap: {
            baseDir: path.resolve(dirname),
        },
    },
    collections: [Users, Projects, Pages, Media, Services, BlogPosts, JobApplications, ContactSubmissions, QuoteRequests, Customers, ClientDocuments, AnalyticsEvents],
    editor: lexicalEditor({}),
    secret: process.env.PAYLOAD_SECRET || '',
    db: postgresAdapter({
        pool: {
            connectionString: process.env.DATABASE_URL || '',
        },
    }),
    typescript: {
        outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
})
