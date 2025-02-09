import { makeAutoObservable } from 'mobx'
import Cookies from 'js-cookie'
import getConfig from 'next/config'
import { createContext } from "react"
import _ from 'lodash'
import bcrypt from 'bcryptjs';

const { publicRuntimeConfig } = getConfig()

class Account {
  private username: string 
  private password: string

  constructor(username: string, password: string) {
    this.username = username
    this.password = password
  }

  async authen(username: string, password: string): Promise<boolean> {
    if (this.username !== username) {
      return false;
    }

    return await bcrypt.compare(password, this.password);
  }
}

export class AuthContext {
  isLoggedIn: boolean

  //-------------------
  // CONSTUCTOR
  //-------------------
  constructor() {
    this.isLoggedIn = false
    makeAutoObservable(this)
  }

  setDomainToken(token: string) {
    let domain = publicRuntimeConfig.APP_DOMAIN
    const option: Cookies.CookieAttributes = { domain: domain }
    Cookies.set("access_token", token, option)
  }
  
  removeDomainToken() {
    let domain = publicRuntimeConfig.APP_DOMAIN
    const option = { domain: domain }
    Cookies.remove("access_token", option)
  }
    
  async authorize(accountList: string, username: string, password: string): Promise<boolean>  {
    let accounts: Account[] = [];
    _.map(accountList.trim().split(","), (user_pwd: string) => {
      let accStrs = user_pwd.trim().split(":")
      accounts.push(new Account(accStrs[0], accStrs[1]))
    })

    console.log("gen1", bcrypt.hashSync("0544", 10))
    console.log("gen2", bcrypt.hashSync("huag028932671", 10))
    console.log(accounts, await bcrypt.compare(password, "$2a$10$9qljIQunWKrEwxMj1m7XKuKtpluBMfqwWOcHZKT7PUEQMBNxlpyRW"))
    for (const acc of accounts) {
      if (await acc.authen(username, password)) {
        return true
      }
    }

    return false
  }
}

export const authContext = createContext(new AuthContext())