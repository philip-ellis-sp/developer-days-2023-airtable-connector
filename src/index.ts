import {
    Context,
    createConnector,
    readConfig,
    Response,
    logger,
    StdAccountListOutput,
    StdAccountReadInput,
    StdAccountReadOutput,
    StdTestConnectionOutput,
    StdEntitlementListInput,
    StdEntitlementListOutput,
    StdEntitlementReadInput,
    StdEntitlementReadOutput,
    ConnectorError,
    StdAccountCreateInput,
    StdAccountCreateOutput,
    StdAccountDeleteInput,
    StdAccountDeleteOutput,
    StdAccountUpdateInput,
    StdAccountUpdateOutput,
} from '@sailpoint/connector-sdk'
import { MyClient } from './my-client'

// Connector must be exported as module property named connector
export const connector = async () => {

    const entitlements: string [] =  ["user", "admin", "readonly"]
    // Get connector source config
    const config = await readConfig()

    // Use the vendor SDK, or implement own client as necessary, to initialize a client
    const myClient = new MyClient(config)

    return createConnector()
        .stdTestConnection(async (context: Context, input: undefined, res: Response<StdTestConnectionOutput>) => {
            logger.info("Running test connection")
            res.send(await myClient.testConnection())
        })
        .stdAccountList(async (context: Context, input: undefined, res: Response<StdAccountListOutput>) => {
            const accounts = await myClient.getAllAccounts()

            for (const account of accounts) {
                res.send({
                    identity: account.id,
                    attributes: {
                        id: <string>account.get('id'),
                        email: <string>account.get('email'),
                        fullname: <string>account.get('fullname'),
                        entitlements: <string[]>(account.get('entitlements') ? account.get('entitlements') : [])
                    }
                })
            }
            logger.info(`stdAccountList sent ${accounts.length} accounts`)
        })
        .stdAccountRead(async (context: Context, input: StdAccountReadInput, res: Response<StdAccountReadOutput>) => {
            const account = await myClient.getAccount(input.identity)

            res.send({
                identity: account.id,
                attributes: {
                    id: <string>account.get('id'),
                    email: <string>account.get('email'),
                    fullname: <string>account.get('fullname'),
                    entitlements: <string[]>(account.get('entitlements') ? account.get('entitlements') : [])
                }
            })
            logger.info(`stdAccountRead read account : ${input.identity}`)

        })

        .stdEntitlementList(async (context: Context, input: StdEntitlementListInput, res: Response<StdEntitlementListOutput>) => {
            for(const entitlement of entitlements) {
                res.send({
                    identity: entitlement,
                    type: 'group',
                    attributes: {
                        id: entitlement,
                        name: entitlement
                    }
                })
            }
        })
        .stdEntitlementRead(async (context: Context, input: StdEntitlementReadInput, res: Response<StdEntitlementReadOutput>) => {

            const entitlement: string = entitlements.filter((e) => {return e == input.identity})[0]

            if (entitlement) {
                res.send({
                    identity: entitlement,
                    type: 'group',
                    attributes: {
                        id: entitlement,
                        name: entitlement
                    }
                })
            } else {
                throw new ConnectorError("Entitlement not found")
            }
        })

        .stdAccountCreate(async (context: Context, input: StdAccountCreateInput, res: Response<StdAccountCreateOutput>) => {
            const account = await myClient.createAccount(input)
            res.send({
                identity: account.id,
                attributes: {
                    id: <string>account.get('id'),
                    email: <string>account.get('email'),
                    fullname: <string>account.get('fullname'),
                    entitlements: <string[]>(account.get('entitlements') ? account.get('entitlements') : [])
                }
            })
        })

        .stdAccountDelete(async (context: Context, input: StdAccountDeleteInput, res: Response<StdAccountDeleteOutput>) => {
            res.send(await myClient.deleteAccount(input.identity))
        })

        .stdAccountUpdate(async (context: Context, input: StdAccountUpdateInput, res: Response<StdAccountUpdateOutput>) => {
            const account = await myClient.getAccount(input.identity)
            for (const change of input.changes) {
                if (change.attribute == 'entitlements') {
                    let tempEntitlments = <string[]>account.get(change.attribute)
                    if (!tempEntitlments) {
                        tempEntitlments = []
                    }
                    switch (change.op) {
                        case 'Add':
                            tempEntitlments.push(change.value)
                            account.set(change.attribute, tempEntitlments)
                            break;
                        case 'Set':
                            tempEntitlments = [change.value]
                            account.set(change.attribute, tempEntitlments)
                            break;
                        case 'Remove':
                            tempEntitlments = tempEntitlments.filter((e) => {return e != change.value})
                            account.set(change.attribute, tempEntitlments)
                            break;
                        default:
                            break;
                    }
                } else {
                    account.set(change.attribute, change.value)
                }
            }

            const updatedAccount = await myClient.updateAccount(account)
            res.send({
                identity: updatedAccount.id,
                attributes: {
                    id: <string>updatedAccount.get('id'),
                    email: <string>updatedAccount.get('email'),
                    fullname: <string>updatedAccount.get('fullname'),
                    entitlements: <string[]>(updatedAccount.get('entitlements') ? updatedAccount.get('entitlements') : [])
                }
            })
        })
}
