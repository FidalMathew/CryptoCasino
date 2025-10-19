import { useContext } from "react";
import { GlobalContext } from "./GlobalContextExport";

export default function useGlobalContext() {
  return useContext(GlobalContext);
}
