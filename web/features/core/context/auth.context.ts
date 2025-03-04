import { makeAutoObservable } from 'mobx'
import Cookies from 'js-cookie'
import getConfig from 'next/config'
import { createContext } from "react"
import _ from 'lodash'
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs'

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
    const option: Cookies.CookieAttributes = { domain: domain, expires: dayjs().endOf('year').millisecond() }
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

    for (const acc of accounts) {
      if (await acc.authen(username, password)) {
        return true
      }
    }

    return false
  }
}

export const authContext = createContext(new AuthContext())