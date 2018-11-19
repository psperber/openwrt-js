class Openwrt {
  constructor(opts) {
    const {
      host,
      credentials,
      sysauth,
      fetch
    } = opts
    this._credentials = credentials
    this._sysauth = sysauth
    // TODO: support tls
    this._baseURL = `http://${host}`
    this._fetch = fetch || require('cross-fetch')
  }

  async _request(url, opts) {
    if (!this._sysauth) {
      await this.auth()
    }
    return this._fetch(this._baseURL + url, Object.assign({}, opts, {
      headers: {
        'cache-control': 'no-cache',
        Cookie: `sysauth=${this._sysauth}`
      }
    }))
    // TODO: react to 403 if cookie is expired
      .then(res => res.json())
  }

  auth() {
    const {
      username,
      password
    } = this._credentials
    return this._fetch(this._baseURL + '/cgi-bin/luci', {
      method: 'POST',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      },
      redirect: 'manual',
      body: `luci_username=${encodeURIComponent(username)}&luci_password=${encodeURIComponent(password)}`
    })
      .then(res => {
        const setCookie = res.headers.get('set-cookie')
        // TODO: verify that cookie is sysauth
        this._sysauth = setCookie.substr(8, setCookie.indexOf(';') - 8)
      })
  }

  getDhcpLeaseStatus() {
    return this._request('/cgi-bin/luci/admin/network/dhcplease_status')
  }

  getStatus() {
    return this._request('/cgi-bin/luci/?status=1')
  }

  getWirelessAssoclist() {
    return this._request('/cgi-bin/luci/admin/network/wireless_assoclist')
  }

  getWirelessStatus(interfaces) {
    if (interfaces.length === 0) {
      return Promise.resolve([])
    }
    return this._request('/cgi-bin/luci/admin/network/wireless_status/' + interfaces.join(','))
  }
}

module.exports = Openwrt
