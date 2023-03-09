import { ConnectorError, StdAccountCreateInput } from "@sailpoint/connector-sdk"
import Airtable, { FieldSet, Record } from "airtable"


export class MyClient {
    private readonly airtableBase: Airtable.Base

    constructor(config: any) {
        // Fetch necessary properties from config.
        // Following properties actually do not exist in the config -- it just serves as an example.
        if (config?.apiKey == null) {
            throw new ConnectorError('apiKey must be provided from config')
        }
        if (config?.airtableBase == null) {
            throw new ConnectorError('airtableBase must be provided from config')
        }

        Airtable.configure({apiKey: config.apiKey})
        this.airtableBase = Airtable.base(config.airtableBase)
    }

    async getAllAccounts(): Promise<Record<FieldSet>[]> {
        let result: Record<FieldSet>[] = []
        return this.airtableBase('Users').select().firstPage().then(records => {
            for (let record of records) {
                result.push(record)
            }
            return result
        }).catch(err => {
            throw new ConnectorError('Unable to connect!')
        })
    }

    async getAccount(identity: string): Promise<Record<FieldSet>> {
        return this.airtableBase('Users').find(
            identity
        ).then(record => {
            return record
        }).catch(err => {
            throw new ConnectorError('Unable to connect!')
        })
    }

    async testConnection(): Promise<any> {
        return this.airtableBase('Users').select().firstPage().then(records => {
            return {}
        }).catch(err => {
            throw new ConnectorError('Unable to connect!')
        })
    }

    async createAccount(input: StdAccountCreateInput): Promise<Record<FieldSet>> {
        if(!input.attributes['id']) {
            throw new ConnectorError('cannot create without field id')
        }
        return this.airtableBase('Users').create({
            'id': input.attributes['id'],
            'email': input.attributes['email'],
            'fullname': input.attributes['fullname']
        }).then(record => {
            return record
        }).catch(err => {
            throw new ConnectorError('error while creating account: ' + err)
        })
    }

    async deleteAccount(identity: string): Promise<any> {
        return this.airtableBase('Users').destroy(identity,
        ).then(() => {
            return {}
        }).catch(err => {
            throw new ConnectorError('error while deleting account: ' + err)
        })
    }

    async updateAccount(input: Record<FieldSet>): Promise<Record<FieldSet>> {
        return this.airtableBase('Users').update(input.id,{
            'id': input.get('id'),
            'fullname': input.get('fullname'),
            'email': input.get('email'),
            'entitlements': input.get('entitlements')
        }).then(record => {
            return record
        }).catch(err => {
            throw new ConnectorError('error while updating account: ' + err)
        })
    }

}
