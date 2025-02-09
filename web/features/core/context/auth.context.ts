import { makeAutoObservable } from 'mobx'
import Cookies from 'js-cookie'
import getConfig from 'next/config'
import { createContext } from "react"
import _ from 'lodash'

const { publicRuntimeConfig } = getConfig()
const envUserStringList = process.env.USER_PWD || "admin:admin"

class Account {
  username: string 
  password: string

  constructor(username: string, password: string) {
    this.username = username
    this.password = password
  }
}

export class AuthContext {
  isLoggedIn: boolean
  domain: string
  accounts?: Account[]

  //-------------------
  // CONSTUCTOR
  //-------------------
  constructor(domain: string, accounts: string) {
    this.isLoggedIn = false
    this.domain = domain

    if (!this.accounts) { this.accounts = [] }
    _.map(accounts.trim().split(","), (user_pwd: string) => {
      let accStrs = user_pwd.trim().split(":")
      this.accounts?.push(new Account(accStrs[0], accStrs[1]))
    })
    
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

export const authContext = createContext(new AuthContext(publicRuntimeConfig.APP_DOMAIN, envUserStringList))