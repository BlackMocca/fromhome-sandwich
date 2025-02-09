import { makeAutoObservable } from 'mobx'
import Cookies from 'js-cookie'
import getConfig from 'next/config'
import { createContext } from "react"

const { publicRuntimeConfig } = getConfig()

export class AuthContext {
    isLoggedIn: boolean
    domain: string
  
    //-------------------
    // CONSTUCTOR
    //-------------------
    constructor(domain: string) {
      this.isLoggedIn = false
      this.domain = domain
      makeAutoObservable(this)
    }

    setDomainToken(token: string) {
        const option = { domain: this.domain }
        Cookies.set(this.domain, token, option)
      }
    
    removeDomainToken() {
        const domain = { domain: this.domain }
        Cookies.remove(this.domain, domain)
    }
    
}

export const authContext = createContext(new AuthContext(publicRuntimeConfig.APP_DOMAIN))