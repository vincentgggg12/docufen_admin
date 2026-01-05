import { useDocumentStore } from "@/lib/stateManagement";
import { DateTime } from "luxon";
import React from "react";
import { useShallow } from "zustand/shallow";
interface UseTimeComparison {
  now: string
  today: string
  lateTimeInPast: boolean
}

export const useTimeComparison = (lateActionDate: string, lateActionTime: string) => {
  const { timezone } = useDocumentStore(useShallow((state) => ({
    timezone: state.timezone,
  })));
  const dt = DateTime.now().setZone(timezone)
  const [now] = React.useState<string>(dt.toFormat("HH:mm"))
  const [today] = React.useState<string>(dt.toFormat("yyyy-MM-dd"));
  const [lateTimeInPast, setLateTimeInPast] = React.useState<boolean>(false);
  // const lateActionTime = React.useRef("");
  // const reason = React.useRef("");
  React.useEffect(() => {
    if (lateActionDate < today) {
      setLateTimeInPast(true);
      // console.log("Late action date is in the past, setting lateTimeInPast to true");
    } else if (lateActionDate === today && lateActionTime && lateActionTime < now) {
      setLateTimeInPast(true);
      // console.log("Late action date is in the past, setting lateTimeInPast to true");
    } else {
      setLateTimeInPast(false);
      // console.log("Late action date FUTURE");
    }
  }, [lateActionTime, lateActionDate]);
  return { lateTimeInPast, now, today } as UseTimeComparison;
}