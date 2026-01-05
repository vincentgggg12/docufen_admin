
let HOST: string
let LOCALHOST: string = window.location.origin
export const PRODUCTION_MODE = import.meta.env.PROD
try {
  if (!LOCALHOST.includes("localhost")) {
    LOCALHOST = window.location.origin
    HOST = LOCALHOST
    // console.log("Production Host " + HOST)
  } else {
    HOST = "https://localhost:3000"
    LOCALHOST = "https://localhost:3030"
  }
} catch (err: any) {
  HOST = "failed to load"
  LOCALHOST = "failed to load"
}
// export const SERVERURL = `https://${HOST}/api/`
export const RAWSERVERURL = `${HOST}`
export const SERVERURL = `${HOST}/api/`
export const APIURL = SERVERURL + "api/"
export const UPLOADURL = SERVERURL + "upload/"
