const DEV = process.env.REACT_APP_DEV;

const LOCAL_CLIENT = "http://localhost:3000";
const LOCAL_SERVER = "http://192.168.1.74:3300";

const DEPLOYED_HOME = "https://meet.nguyenhiep.me";
const DEPLOYED_SERVER = "https://auth-when4meet.vercel.app";

export const HOME_URL = DEV ? LOCAL_CLIENT : DEPLOYED_HOME;
export const SERVER_URL = DEV ? LOCAL_SERVER : DEPLOYED_SERVER;

export const STRIPPED_HOME_URL = HOME_URL?.replace("http://", "").replace("https://", "");
