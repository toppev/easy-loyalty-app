import { get, post, SERVER_API_URL, setBackendUrl, validBackendURL } from "../config/axios";
import { ServerSettings } from "../components/settings/SettingsPage";

/**
 * Also updates the backendUrl
 */
async function getOrCreateServer(data: { email: string, token?: string }, create: boolean) {
    if (process.env.NODE_ENV === "development") {
        return { created: true }
    }
    const res = await post(`${SERVER_API_URL}/server/get_or_create/?create=${create}`, data, true)
    setBackendUrl(res.data.apiendpoint)
    return { created: res.status === 201, ...res };
}

/**
 * Makes sure the app knows the backend URL. Fetches it from the server if needed.
 */
async function ensureServerAPI(email: string) {
    if (!validBackendURL()) {
        throw new Error('Invalid backend URL')
    }
    const res = await post(`${SERVER_API_URL}/server/get_or_create/?create=false`, { email }, true)
    setBackendUrl(res.data.apiendpoint)
}

function updateServer(data: ServerSettings) {
    return post(`${SERVER_API_URL}/server/update`, data, true)
}

function updateServerOwner(data: { email: string, updated: { email: string } }) {
    return post(`${SERVER_API_URL}/user/update`, data, true)
}


/**
 * Ping the server until it responds.
 */
function waitForServer(callback: () => any, onError?: (error: Error) => any) {

    const sendRequest = () => {
        get('/ping')
            .then(callback)
            .catch((err) => {
                onError && onError(err)
                setTimeout(sendRequest, 5000)
            })
    }

    sendRequest()

}

export {
    getOrCreateServer,
    updateServer,
    updateServerOwner,
    waitForServer,
    ensureServerAPI
}