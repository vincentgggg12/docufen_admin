import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Info } from 'lucide-react';
import { useDocumentStore } from '@/lib/stateManagement';
import { useShallow } from 'zustand/shallow';
import { DateTime } from 'luxon';
import { useTranslation } from 'react-i18next';
import { Stage } from '@/components/editor/lib/lifecycle';
import { getStageString, stageToDocumentStage } from '@/components/editor/lib/utils';
import { getStageColor } from '@/components/editor/lib/stageColors';
import { trackAmplitudeEvent } from '@/lib/analytics/amplitude';
import { AMPLITUDE_EVENTS } from '@/lib/analytics/events';
import { BorderTrail } from '@/components/motion-primitives/border-trail';

type LateEntryProps = {
    lateEntry: boolean;
    toggleLateEntry: (checked: boolean) => void;
    lateActionDate: string;
    setLateActionDate: (date: string) => void;
    lateActionTime: string;
    setLateActionTime: (time: string) => void;
    reason: string;
    setReason: (reason: string) => void;
    documentStage: Stage;
};

const LateEntry: React.FC<LateEntryProps> = ({
    lateEntry,
    toggleLateEntry,
    lateActionDate,
    setLateActionDate,
    lateActionTime,
    setLateActionTime,
    reason,
    setReason,
    documentStage,
}) => {
  const { timezone } = useDocumentStore(useShallow(state => ({
    timezone: state.timezone,
  })));
  const { t } = useTranslation();
  const [isReasonFocused, setIsReasonFocused] = React.useState(false);
  const stageColor = getStageColor(documentStage);
  React.useEffect(() => {
    if (timezone == null) return
    const datetime = DateTime.now().setZone(timezone).toISODate()
    if (datetime == null) return
    setLateActionDate(datetime)
  }, [timezone])
    return (
        <TooltipPrimitive.Provider>
            <div className="flex flex-col space-y-2 pt-2">
                <div className="flex items-center gap-1">
                    <div className="flex items-center space-x-2">
                        <CheckboxPrimitive.Root
                            data-testid={`editor.${getStageString(documentStage)}.lateEntry.checkbox`}
                            id="lateEntry"
                            checked={lateEntry}
                            onCheckedChange={(checked) => {
                                if (typeof checked === 'boolean') {
                                    toggleLateEntry(checked);

                                    // Track late entry toggled event
                                    trackAmplitudeEvent(AMPLITUDE_EVENTS.LATE_ENTRY_TOGGLED, {
                                        document_id: useDocumentStore.getState().documentId || 'unknown',
                                        document_name: useDocumentStore.getState().documentName || 'unknown',
                                        enabled: checked,
                                        document_stage: stageToDocumentStage(documentStage)
                                    });
                                }
                            }}
                            className="h-4 w-4 rounded border border-gray-300 bg-background flex items-center justify-center data-[state=checked]:bg-[var(--stage-color)] data-[state=checked]:border-[var(--stage-color)]"
                            style={{ '--stage-color': stageColor } as React.CSSProperties}
                        >
                            <CheckboxPrimitive.Indicator>
                                <Check className="h-3 w-3 text-white" />
                            </CheckboxPrimitive.Indicator>
                        </CheckboxPrimitive.Root>
                        <label htmlFor="lateEntry" className="text-sm font-medium text-gray-700">
                            {t("lateEntry")}
                        </label>
                    </div>

                    <TooltipPrimitive.Root>
                        <TooltipPrimitive.Trigger asChild>
                            <button
                                data-testid={`editor.${getStageString(documentStage)}.lateEntry.infoButton`}
                                className="rounded-full bg-gray-100 p-1 hover:bg-gray-200 transition-colors ml-1"
                            >
                                <Info className="h-4 w-4 text-gray-600" />
                            </button>
                        </TooltipPrimitive.Trigger>
                        <TooltipPrimitive.Content
                            className="bg-background px-3 py-2 rounded-md shadow-md text-sm max-w-xs z-50 border border-gray-200"
                            sideOffset={5}
                        >
                            {t("lateEntryInfo")}
                            <TooltipPrimitive.Arrow className="fill-background" />
                        </TooltipPrimitive.Content>
                    </TooltipPrimitive.Root>
                </div>

                {lateEntry && (
                    <div className="flex gap-2 items-center mt-2">
                        <input
                            data-testid={`editor.${getStageString(documentStage)}.lateEntry.dateInput`}
                            type="date"
                            className="h-9 bg-background border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--stage-color)]/20 focus:border-[var(--stage-color)] text-sm flex-1"
                            style={{ '--stage-color': stageColor } as React.CSSProperties}
                            value={lateActionDate}
                            onChange={(e) => {
                                console.log("Evalue: " + e.target.value);
                                setLateActionDate(e.target.value);
                            }}
                        />

                        <input
                            data-testid={`editor.${getStageString(documentStage)}.lateEntry.timeInput`}
                            type="time"
                            className="h-9 bg-background border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--stage-color)]/20 focus:border-[var(--stage-color)] text-sm flex-1"
                            style={{ '--stage-color': stageColor } as React.CSSProperties}
                            value={lateActionTime}
                            onChange={(e) => {
                                setLateActionTime(e.target.value);
                            }}
                        />

                        <div
                            className="relative flex-grow overflow-hidden rounded-md"
                            style={{ '--stage-color': stageColor } as React.CSSProperties}
                        >
                          <input
                            data-testid={`editor.${getStageString(documentStage)}.lateEntry.reasonInput`}
                            type="text"
                            placeholder={t('mPopup.attachments.placeholder.lateEntryReason')}
                            className="h-9 w-full bg-background border border-gray-200 rounded-md px-3 py-2 focus:outline-none text-sm"
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                            }}
                            onFocus={() => setIsReasonFocused(true)}
                            onBlur={() => setIsReasonFocused(false)}
                          />
                          {isReasonFocused && (
                            <BorderTrail
                              className="bg-gradient-to-l from-[var(--stage-color)]/30 via-[var(--stage-color)] to-[var(--stage-color)]/30"
                              size={50}
                              transition={{
                                repeat: Infinity,
                                duration: 3,
                                ease: 'linear',
                              }}
                            />
                          )}
                        </div>
                    </div>
                )}
            </div>
        </TooltipPrimitive.Provider>
    );
};

export default LateEntry;
