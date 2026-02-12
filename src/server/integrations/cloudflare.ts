type Zone = {
  id: string
  name: string
  status: 'active' | 'pending' | 'moved' | 'deleted' | 'paused'
  name_servers: string[]
}

type Result = {
  success: boolean
  error?: string
}

type DnsPropagationResult = {
  propagated: boolean
  error?: string
}

type SslStatusResult = {
  status: 'active' | 'pending' | 'error'
  error?: string
}

class CloudflareService {
  async verifyToken(): Promise<{ valid: boolean; error?: string }> {
    const hasToken = Boolean(process.env.CLOUDFLARE_API_TOKEN)
    return hasToken ? { valid: true } : { valid: false, error: 'Missing CLOUDFLARE_API_TOKEN' }
  }

  async listZones(): Promise<Zone[]> {
    return []
  }

  async getZoneByName(_name: string): Promise<Zone | null> {
    return null
  }

  async createZone(name: string): Promise<Result & { zone?: Zone }> {
    return {
      success: true,
      zone: {
        id: `zone_${name.replace(/[^a-z0-9]/gi, '').toLowerCase()}`,
        name,
        status: 'pending',
        name_servers: ['ns1.cloudflare.com', 'ns2.cloudflare.com'],
      },
    }
  }

  async createDnsRecord(
    _zoneId: string,
    _type: string,
    _name: string,
    _value: string,
    _ttl?: number,
    _priority?: number,
    _proxied?: boolean
  ): Promise<Result> {
    return { success: true }
  }

  async createStandardWebsiteDns(
    _zoneId: string,
    _domain: string,
    _serverIp: string
  ): Promise<Result> {
    return { success: true }
  }

  async verifyDnsPropagation(
    _domain: string,
    _expectedServerIp?: string
  ): Promise<DnsPropagationResult> {
    return { propagated: true }
  }

  async getSSLStatus(_domain: string): Promise<SslStatusResult> {
    return { status: 'active' }
  }

  async createPreviewSubdomain(
    rootDomain: string,
    subdomain: string,
    _serverIp: string
  ): Promise<Result & { fqdn: string }> {
    return {
      success: true,
      fqdn: `${subdomain}.${rootDomain}`,
    }
  }

  async enableEmailRouting(_zoneId: string): Promise<Result> {
    return { success: true }
  }

  async createEmailRule(_zoneId: string, _email: string, _forwardTo: string): Promise<Result> {
    return { success: true }
  }

  async checkDomainAvailability(
    _domain: string
  ): Promise<{ available: boolean; premium: boolean; error?: string }> {
    return { available: true, premium: false }
  }

  async getDomainPricing(
    _tld: string
  ): Promise<{ registerPrice: number; renewPrice: number; currency: string; error?: string }> {
    return {
      registerPrice: 10,
      renewPrice: 10,
      currency: 'USD',
    }
  }

  async registerDomain(
    _domain: string,
    _years: number,
    _contactInfo: unknown
  ): Promise<Result & { domain?: { expires_at: string } }> {
    return {
      success: true,
      domain: {
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      },
    }
  }

  async getAccountId(): Promise<string | null> {
    return process.env.CLOUDFLARE_ACCOUNT_ID || null
  }
}

export async function getCloudflareService(): Promise<CloudflareService | null> {
  if (!process.env.CLOUDFLARE_API_TOKEN) return null
  return new CloudflareService()
}

export function getDefaultServerIp(): string | null {
  return process.env.DEFAULT_SERVER_IP || process.env.SERVER_IP || null
}
